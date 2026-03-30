import sqlalchemy as sa
import pytest
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.accident_crawler.attachment_service import AttachmentService
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
async def test_attachment_save_and_dedupe(session: AsyncSession):
    svc = AttachmentService(session=session)
    a1 = await svc.save_bytes(batch_id="b1", original_url="https://a.test/1.pdf", data=b"abc")
    a2 = await svc.save_bytes(batch_id="b1", original_url="https://a.test/2.pdf", data=b"abc")
    await session.commit()
    assert a1.sha256 == a2.sha256
    assert a1.id == a2.id

