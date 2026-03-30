import asyncio
import re
import time
from uuid import uuid4
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions import ApiError
from .models import AccidentCrawlTask
from .regex_models import RegexBatch
from .regex_schemas import RegexEnqueueRequest, RegexEnqueueResponse, RegexPreviewRequest, RegexPreviewResponse
from .strategy_service import recommend_strategy, strategy_fingerprint


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class RegexService:
    def __init__(self, *, session: AsyncSession):
        self.session = session

    async def preview(self, req: RegexPreviewRequest) -> RegexPreviewResponse:
        t0 = time.perf_counter()
        try:
            pattern = re.compile(req.regex)
        except Exception:
            raise ApiError(400, "invalid regex")

        async def _do() -> tuple[int, list[str]]:
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                r = await client.get(req.seed_url, headers={"User-Agent": "Mozilla/5.0"})
                r.raise_for_status()
                soup = BeautifulSoup(r.text or "", "lxml")
                urls: list[str] = []
                discovered = 0
                for a in soup.find_all("a"):
                    href = a.get("href") or ""
                    if not href:
                        continue
                    discovered += 1
                    u = urljoin(req.seed_url, href)
                    if pattern.search(u):
                        if u not in urls:
                            urls.append(u)
                            if len(urls) >= req.max_preview:
                                break
                return discovered, urls

        try:
            discovered, urls = await asyncio.wait_for(_do(), timeout=float(req.timeout_seconds))
        except asyncio.TimeoutError:
            raise ApiError(408, "regex preview timeout")
        except httpx.HTTPStatusError as e:
            raise ApiError(400, f"seed fetch failed: {e.response.status_code}")
        except httpx.RequestError as e:
            raise ApiError(400, f"seed fetch failed: {e}")

        ms = (time.perf_counter() - t0) * 1000.0
        return RegexPreviewResponse(
            seed_url=req.seed_url,
            regex=req.regex,
            discovered=int(discovered),
            matched=len(urls),
            elapsed_ms=float(ms),
            urls=urls,
        )

    async def enqueue(self, *, user_id: str, req: RegexEnqueueRequest) -> RegexEnqueueResponse:
        prev = await self.preview(
            RegexPreviewRequest(seed_url=req.seed_url, regex=req.regex, max_preview=req.max_urls, timeout_seconds=3)
        )
        now = _now()
        batch_id = uuid4().hex
        batch = RegexBatch(
            id=batch_id,
            user_id=user_id,
            seed_url=req.seed_url,
            regex=req.regex,
            max_urls=req.max_urls,
            created_count=0,
            status="created",
            created_at=now,
            updated_at=now,
            deleted_at=None,
        )
        self.session.add(batch)
        created = 0
        for i, u in enumerate(prev.urls, start=1):
            strategy = recommend_strategy(url=u)
            if req.engine:
                strategy["engine"] = str(req.engine)
            strategy["concurrency"] = int(req.concurrency or strategy.get("concurrency", 10))
            fp = strategy_fingerprint(strategy)
            task = AccidentCrawlTask(
                id=uuid4().hex,
                keyword=req.keyword,
                target_url=u,
                batch_id=batch_id,
                batch_seq=i,
                engine=str(strategy.get("engine", "httpx_bs4")),
                engine_params="{}",
                concurrency=int(strategy.get("concurrency", 10)),
                strategy_used=json.dumps(strategy, ensure_ascii=False),
                strategy_fingerprint=fp,
                status="pending",
                max_items=1,
                max_depth=req.max_depth,
                success_count=0,
                fail_count=0,
                last_error=None,
                log_path=None,
                started_at=None,
                finished_at=None,
                created_at=now,
                updated_at=now,
                deleted_at=None,
            )
            self.session.add(task)
            created += 1
        await self.session.commit()
        await self.session.execute(
            update(RegexBatch).where(RegexBatch.id == batch_id).values(created_count=created, status="enqueued", updated_at=_now())
        )
        await self.session.commit()
        return RegexEnqueueResponse(batch_id=batch_id, created_tasks=created)
