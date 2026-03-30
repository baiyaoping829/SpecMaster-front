import hashlib
import json
from urllib.parse import urlparse
from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from .engines import get_engine
from .strategy_models import ExperienceStrategy


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _domain(url: str) -> str:
    try:
        return (urlparse(url).hostname or "").lower()
    except Exception:
        return ""


def strategy_fingerprint(strategy: dict) -> str:
    raw = json.dumps(strategy or {}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()


def recommend_strategy(*, url: str) -> dict:
    d = _domain(url)
    path = (urlparse(url).path or "").lower()
    if "gov.cn" in d:
        return {"engine": "httpx_bs4", "concurrency": 5, "delay_ms": 800, "headers": {"User-Agent": "Mozilla/5.0"}, "proxy": False}
    if any(x in d for x in ["news", "toutiao", "ifeng"]) or "/news" in path:
        return {"engine": "playwright", "concurrency": 3, "delay_ms": 1200, "headers": {"User-Agent": "Mozilla/5.0"}, "proxy": False}
    return {"engine": "requests_bs4", "concurrency": 10, "delay_ms": 400, "headers": {"User-Agent": "Mozilla/5.0"}, "proxy": False}


class StrategyService:
    def __init__(self, *, session: AsyncSession):
        self.session = session

    async def save_experience(self, *, user_id: str, url: str, name: str, description: str, strategy: dict) -> dict:
        now = _now()
        fp = strategy_fingerprint(strategy)
        row = ExperienceStrategy(
            id=uuid4().hex,
            user_id=user_id,
            domain=_domain(url),
            name=(name or "").strip()[:128],
            description=(description or "").strip()[:512],
            strategy_json=json.dumps(strategy or {}, ensure_ascii=False),
            fingerprint=fp,
            created_at=now,
            updated_at=now,
            deleted_at=None,
        )
        self.session.add(row)
        await self.session.flush()
        return self._vo(row)

    async def list_experience(self, *, user_id: str, domain: str = "", page: int = 1, size: int = 20) -> dict:
        safe_page = max(1, int(page))
        safe_size = min(200, max(1, int(size)))
        offset = (safe_page - 1) * safe_size
        stmt = select(ExperienceStrategy).where(ExperienceStrategy.user_id == user_id).where(ExperienceStrategy.deleted_at.is_(None))
        if domain:
            stmt = stmt.where(ExperienceStrategy.domain == domain.lower())
        rows = (await self.session.execute(stmt.order_by(desc(ExperienceStrategy.updated_at)).offset(offset).limit(safe_size))).scalars().all()
        items = [self._vo(r) for r in rows]
        return {"items": items, "total": len(items), "page": safe_page, "size": safe_size}

    async def ab_compare(self, *, url: str, user_strategy: dict) -> dict:
        smart = recommend_strategy(url=url)
        smart_engine = str(smart.get("engine", "httpx_bs4"))
        user_engine = str((user_strategy or {}).get("engine", "httpx_bs4"))

        async def run(name: str) -> dict:
            try:
                e = get_engine(name)
                title, res = await e.fetch_title(url)
                return {"engine": name, "ok": True, "elapsed_ms": res.elapsed_ms, "title": title}
            except Exception as ex:
                return {"engine": name, "ok": False, "elapsed_ms": 0.0, "title": "", "error": str(ex)}

        smart_res = await run(smart_engine)
        user_res = await run(user_engine)
        return {"url": url, "smart": smart, "user": user_strategy, "smart_result": smart_res, "user_result": user_res}

    def _vo(self, row: ExperienceStrategy) -> dict:
        try:
            strategy = json.loads(row.strategy_json or "{}")
        except Exception:
            strategy = {}
        return {
            "id": row.id,
            "user_id": row.user_id,
            "domain": row.domain,
            "name": row.name,
            "description": row.description,
            "strategy": strategy,
            "fingerprint": row.fingerprint,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
        }

