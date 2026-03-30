import sqlalchemy as sa
import pytest
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.accident_crawler.strategy_service import StrategyService, recommend_strategy, strategy_fingerprint
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
async def test_recommend_and_save(session: AsyncSession):
    s = recommend_strategy(url="https://www.mem.gov.cn/gk/sgcc/")
    assert s["engine"] in ("httpx_bs4", "requests_bs4", "playwright")
    fp = strategy_fingerprint(s)
    assert len(fp) == 40

    svc = StrategyService(session=session)
    item = await svc.save_experience(user_id="u1", url="https://www.mem.gov.cn/a", name="n1", description="d1", strategy=s)
    await session.commit()
    assert item["fingerprint"] == fp
    lst = await svc.list_experience(user_id="u1", domain="www.mem.gov.cn", page=1, size=10)
    assert lst["total"] >= 1

