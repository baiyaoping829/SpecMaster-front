import sqlalchemy as sa
import pytest
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.accident_crawler.favorite_schemas import FavoriteSiteCreate, FavoriteSiteUpdate
from app.accident_crawler.favorite_service import FavoriteService
from app.core.exceptions import ApiError
from app.core.models import Base


@pytest.fixture()
async def session(tmp_path: Path) -> AsyncSession:
    db_path = tmp_path / "test.sqlite"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", pool_pre_ping=True)

    async with engine.begin() as conn:
        await conn.exec_driver_sql("PRAGMA foreign_keys=ON;")
        if "specs" not in Base.metadata.tables:
            sa.Table("specs", Base.metadata, sa.Column("id", sa.String(length=64), primary_key=True))
        await conn.run_sync(Base.metadata.create_all)

    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as s:
        yield s

    await engine.dispose()


@pytest.mark.asyncio
async def test_create_idempotent_and_unique(session: AsyncSession):
    svc = FavoriteService(session=session)
    vo1, existed1 = await svc.create(user_id="u1", req=FavoriteSiteCreate(site_url="https://a.com", site_name="A", tags=["t1"]))
    vo2, existed2 = await svc.create(user_id="u1", req=FavoriteSiteCreate(site_url="https://a.com", site_name="A2", tags=["t2"]))
    assert existed1 is False
    assert existed2 is True
    assert vo1.id == vo2.id
    vo3, existed3 = await svc.create(user_id="u2", req=FavoriteSiteCreate(site_url="https://a.com", site_name="A", tags=[]))
    assert existed3 is False
    assert vo3.user_id == "u2"


@pytest.mark.asyncio
async def test_access_control_like_behavior(session: AsyncSession):
    svc = FavoriteService(session=session)
    vo, _ = await svc.create(user_id="u1", req=FavoriteSiteCreate(site_url="https://b.com", site_name="B", tags=[]))
    with pytest.raises(ApiError):
        await svc.update(user_id="u2", favorite_id=vo.id, req=FavoriteSiteUpdate(site_name="X"))


@pytest.mark.asyncio
async def test_like_escape_prevents_wildcard_expansion(session: AsyncSession):
    svc = FavoriteService(session=session)
    await svc.create(user_id="u1", req=FavoriteSiteCreate(site_url="https://x.com/%/p", site_name="X", tags=["a_b"]))
    await svc.create(user_id="u1", req=FavoriteSiteCreate(site_url="https://y.com/abc", site_name="Y", tags=["zzz"]))

    res = await svc.list(user_id="u1", q="%", page=1, size=50)
    assert res.total == 1
    assert res.items[0].site_url == "https://x.com/%/p"

    res2 = await svc.list(user_id="u1", q="_", page=1, size=50)
    assert res2.total == 1
    assert res2.items[0].site_url == "https://x.com/%/p"

