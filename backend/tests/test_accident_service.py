import json
from pathlib import Path

import pytest
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.accident_case.service import AccidentService
from app.accident_case.schemas import AccidentCaseCreate, AccidentCaseUpdate
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
async def test_crud_flow(session: AsyncSession):
    svc = AccidentService(session=session, redis=None, minio_enabled=False)

    created = await svc.create_case(AccidentCaseCreate(case_no="T-1", title="t1", content=json.dumps({"summary": "s"}), attachment_keys=[]))
    assert created.id
    got = await svc.get_case(created.id)
    assert got.title == "t1"
    assert got.version == 0

    updated = await svc.update_case(created.id, AccidentCaseUpdate(version=0, title="t2"))
    assert updated.title == "t2"
    assert updated.version == 1

    listed = await svc.list_cases(page=1, size=10)
    assert listed.total >= 1
    assert any(x.id == created.id for x in listed.items)

    await svc.delete_case(created.id)
    with pytest.raises(Exception):
        await svc.get_case(created.id)


@pytest.mark.asyncio
async def test_link_and_unlink_spec(session: AsyncSession):
    svc = AccidentService(session=session, redis=None, minio_enabled=False)
    async with session.begin():
        await session.execute(sa.text("insert into specs (id) values (:id)"), {"id": "S1"})

    created = await svc.create_case(AccidentCaseCreate(case_no="T-2", title="t1", content="{}", attachment_keys=[]))
    await svc.link_spec(case_id=created.id, spec_id="S1")
    await svc.unlink_spec(case_id=created.id, spec_id="S1")


@pytest.mark.asyncio
async def test_upload_attachments_requires_minio(session: AsyncSession):
    svc = AccidentService(session=session, redis=None, minio_enabled=False)
    created = await svc.create_case(AccidentCaseCreate(case_no="T-3", title="t1", content="{}", attachment_keys=[]))
    with pytest.raises(ApiError):
        await svc.upload_attachments(case_id=created.id, files=[("a.pdf", b"%PDF-1.4", "application/pdf")])

