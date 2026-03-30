import asyncio
import time
from dataclasses import dataclass

import httpx

from ..core.exceptions import ApiError


@dataclass(frozen=True)
class FetchResult:
    url: str
    status_code: int
    elapsed_ms: float
    content_type: str
    text: str | None = None
    content: bytes | None = None


class CrawlerEngine:
    name: str

    async def fetch_text(self, url: str) -> FetchResult:
        raise NotImplementedError()

    async def fetch_bytes(self, url: str) -> FetchResult:
        raise NotImplementedError()

    async def fetch_title(self, url: str) -> tuple[str, FetchResult]:
        res = await self.fetch_text(url)
        if not res.text:
            raise ApiError(400, "empty response")
        import re

        m = re.search(r"<title[^>]*>(.*?)</title>", res.text, re.IGNORECASE | re.DOTALL)
        title = (m.group(1).strip() if m else "")[:256]
        return title, res


class HttpxBs4Engine(CrawlerEngine):
    name = "httpx_bs4"

    def __init__(self, *, transport: httpx.AsyncBaseTransport | None = None):
        self.transport = transport

    async def fetch_text(self, url: str) -> FetchResult:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, transport=self.transport) as c:
            r = await c.get(url, headers={"User-Agent": "Mozilla/5.0"})
            elapsed = (time.perf_counter() - t0) * 1000.0
            r.raise_for_status()
            return FetchResult(
                url=str(r.url),
                status_code=int(r.status_code),
                elapsed_ms=float(elapsed),
                content_type=str(r.headers.get("content-type", "")),
                text=r.text,
            )

    async def fetch_bytes(self, url: str) -> FetchResult:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True, transport=self.transport) as c:
            r = await c.get(url, headers={"User-Agent": "Mozilla/5.0"})
            elapsed = (time.perf_counter() - t0) * 1000.0
            r.raise_for_status()
            return FetchResult(
                url=str(r.url),
                status_code=int(r.status_code),
                elapsed_ms=float(elapsed),
                content_type=str(r.headers.get("content-type", "")),
                content=r.content,
            )


class RequestsBs4Engine(CrawlerEngine):
    name = "requests_bs4"

    async def fetch_text(self, url: str) -> FetchResult:
        try:
            import requests
        except Exception:
            raise ApiError(400, "requests not installed")

        def _do() -> FetchResult:
            t0 = time.perf_counter()
            r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30, allow_redirects=True)
            elapsed = (time.perf_counter() - t0) * 1000.0
            r.raise_for_status()
            return FetchResult(
                url=str(r.url),
                status_code=int(r.status_code),
                elapsed_ms=float(elapsed),
                content_type=str(r.headers.get("content-type", "")),
                text=r.text,
            )

        return await asyncio.to_thread(_do)

    async def fetch_bytes(self, url: str) -> FetchResult:
        try:
            import requests
        except Exception:
            raise ApiError(400, "requests not installed")

        def _do() -> FetchResult:
            t0 = time.perf_counter()
            r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=60, allow_redirects=True)
            elapsed = (time.perf_counter() - t0) * 1000.0
            r.raise_for_status()
            return FetchResult(
                url=str(r.url),
                status_code=int(r.status_code),
                elapsed_ms=float(elapsed),
                content_type=str(r.headers.get("content-type", "")),
                content=r.content,
            )

        return await asyncio.to_thread(_do)


def get_engine(name: str) -> CrawlerEngine:
    n = (name or "").strip().lower()
    if n in ("httpx_bs4", "httpx"):
        return HttpxBs4Engine()
    if n in ("requests_bs4", "requests"):
        return RequestsBs4Engine()
    if n == "playwright":
        raise ApiError(400, "playwright engine not enabled")
    if n == "scrapy":
        raise ApiError(400, "scrapy engine not enabled")
    raise ApiError(400, "unknown engine")

