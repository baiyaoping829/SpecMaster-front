import json
from uuid import uuid4

from sqlalchemy import desc, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions import ApiError
from .favorite_models import FavoriteSite
from .favorite_schemas import FavoriteSiteCreate, FavoriteSiteList, FavoriteSiteUpdate, FavoriteSiteVO


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _dump_tags(tags: list[str]) -> str:
    norm = [str(x).strip() for x in (tags or []) if str(x).strip()]
    uniq = []
    seen = set()
    for t in norm:
        k = t.lower()
        if k in seen:
            continue
        seen.add(k)
        uniq.append(t[:64])
    return json.dumps(uniq[:50], ensure_ascii=False)


def _load_tags(raw: str) -> list[str]:
    try:
        v = json.loads(raw or "[]")
        if isinstance(v, list):
            return [str(x) for x in v if str(x).strip()]
    except Exception:
        pass
    return []

def _escape_like(s: str) -> str:
    return str(s).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class FavoriteService:
    def __init__(self, *, session: AsyncSession):
        self.session = session

    async def create(self, *, user_id: str, req: FavoriteSiteCreate) -> tuple[FavoriteSiteVO, bool]:
        now = _now()
        row = FavoriteSite(
            id=uuid4().hex,
            user_id=user_id,
            site_url=req.site_url.strip(),
            site_name=(req.site_name or "").strip()[:256],
            tags=_dump_tags(req.tags),
            created_at=now,
            updated_at=now,
            deleted_at=None,
        )
        try:
            async with self.session.begin_nested():
                self.session.add(row)
                await self.session.flush()
        except IntegrityError:
            await self.session.rollback()
            existing = await self.get_by_url(user_id=user_id, site_url=req.site_url)
            return existing, True
        return self._vo(row), False

    async def get_by_url(self, *, user_id: str, site_url: str) -> FavoriteSiteVO:
        stmt = (
            select(FavoriteSite)
            .where(FavoriteSite.user_id == user_id)
            .where(FavoriteSite.site_url == site_url.strip())
            .where(FavoriteSite.deleted_at.is_(None))
        )
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if not row:
            raise ApiError(404, "not found")
        return self._vo(row)

    async def list(self, *, user_id: str, q: str = "", tag: str = "", page: int = 1, size: int = 20) -> FavoriteSiteList:
        safe_page = max(1, int(page))
        safe_size = min(200, max(1, int(size)))
        offset = (safe_page - 1) * safe_size

        stmt = select(FavoriteSite).where(FavoriteSite.user_id == user_id).where(FavoriteSite.deleted_at.is_(None))
        count_stmt = select(func.count(FavoriteSite.id)).where(FavoriteSite.user_id == user_id).where(FavoriteSite.deleted_at.is_(None))

        if q:
            like = f"%{_escape_like(q.strip())}%"
            stmt = stmt.where(
                or_(
                    FavoriteSite.site_name.like(like, escape="\\"),
                    FavoriteSite.site_url.like(like, escape="\\"),
                    FavoriteSite.tags.like(like, escape="\\"),
                )
            )
            count_stmt = count_stmt.where(
                or_(
                    FavoriteSite.site_name.like(like, escape="\\"),
                    FavoriteSite.site_url.like(like, escape="\\"),
                    FavoriteSite.tags.like(like, escape="\\"),
                )
            )
        if tag:
            like = f"%{_escape_like(tag.strip())}%"
            stmt = stmt.where(FavoriteSite.tags.like(like, escape="\\"))
            count_stmt = count_stmt.where(FavoriteSite.tags.like(like, escape="\\"))

        stmt = stmt.order_by(desc(FavoriteSite.updated_at)).offset(offset).limit(safe_size)
        rows = (await self.session.execute(stmt)).scalars().all()
        total = int((await self.session.execute(count_stmt)).scalar_one())
        return FavoriteSiteList(items=[self._vo(r) for r in rows], total=total, page=safe_page, size=safe_size)

    async def update(self, *, user_id: str, favorite_id: str, req: FavoriteSiteUpdate) -> FavoriteSiteVO:
        stmt = (
            select(FavoriteSite)
            .where(FavoriteSite.id == favorite_id)
            .where(FavoriteSite.user_id == user_id)
            .where(FavoriteSite.deleted_at.is_(None))
        )
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if not row:
            raise ApiError(404, "not found")

        patch = {"updated_at": _now()}
        if req.site_name is not None:
            patch["site_name"] = str(req.site_name or "").strip()[:256]
        if req.tags is not None:
            patch["tags"] = _dump_tags(req.tags)

        async with self.session.begin_nested():
            await self.session.execute(update(FavoriteSite).where(FavoriteSite.id == favorite_id).values(**patch))

        row2 = (await self.session.execute(select(FavoriteSite).where(FavoriteSite.id == favorite_id))).scalar_one()
        return self._vo(row2)

    async def delete(self, *, user_id: str, favorite_id: str) -> None:
        now = _now()
        async with self.session.begin_nested():
            res = await self.session.execute(
                update(FavoriteSite)
                .where(FavoriteSite.id == favorite_id)
                .where(FavoriteSite.user_id == user_id)
                .where(FavoriteSite.deleted_at.is_(None))
                .values(deleted_at=now, updated_at=now)
            )
            if res.rowcount != 1:
                raise ApiError(404, "not found")

    def _vo(self, row: FavoriteSite) -> FavoriteSiteVO:
        return FavoriteSiteVO(
            id=row.id,
            user_id=row.user_id,
            site_url=row.site_url,
            site_name=row.site_name,
            tags=_load_tags(row.tags),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

