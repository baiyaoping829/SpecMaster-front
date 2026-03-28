from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential_jitter


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}


class Http:
    def __init__(self, *, timeout_seconds: float = 30.0):
        self._client = httpx.Client(headers=DEFAULT_HEADERS, timeout=timeout_seconds, follow_redirects=True)

    def close(self) -> None:
        self._client.close()

    @retry(stop=stop_after_attempt(5), wait=wait_exponential_jitter(initial=0.5, max=8))
    def get_text(self, url: str) -> str:
        r = self._client.get(url)
        r.raise_for_status()
        r.encoding = r.encoding or "utf-8"
        return r.text

    @retry(stop=stop_after_attempt(5), wait=wait_exponential_jitter(initial=0.5, max=8))
    def get_bytes(self, url: str) -> bytes:
        r = self._client.get(url)
        r.raise_for_status()
        return r.content

