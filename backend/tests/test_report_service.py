import sqlalchemy as sa
import pytest
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from uuid import uuid4

from app.accident_crawler.models import AccidentCrawlTask, AccidentCrawledReport
from app.accident_crawler.report_service import ReportService, list_reports
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
async def test_generate_reports_creates_files(session: AsyncSession, tmp_path: Path):
    tid = uuid4().hex
    now = "2026-01-01T00:00:00Z"
    task = AccidentCrawlTask(
        id=tid,
        keyword="k",
        target_url="https://x",
        batch_id="",
        batch_seq=0,
        engine="httpx_bs4",
        engine_params="{}",
        concurrency=10,
        strategy_used="{}",
        strategy_fingerprint="",
        status="succeeded",
        stage="done",
        progress_current=1,
        progress_total=1,
        trace_id="t1",
        max_items=1,
        max_depth=0,
        success_count=1,
        fail_count=0,
        last_error=None,
        log_path="",
        started_at=now,
        finished_at=now,
        created_at=now,
        updated_at=now,
        deleted_at=None,
    )
    session.add(task)
    r = AccidentCrawledReport(
        id=uuid4().hex,
        task_id=tid,
        fingerprint=uuid4().hex,
        title="t",
        report_no="2·22",
        occurred_at="2023-02-22",
        location="内蒙古",
        accident_type="坍塌",
        casualties="1人死亡",
        cause_overview="",
        responsible_party="",
        overview="",
        report_url="https://r",
        source_url="https://s",
        published_at="2023-08-29",
        raw_path=None,
        raw_mime=None,
        parsed_json="{}",
        created_at=now,
        updated_at=now,
        deleted_at=None,
    )
    session.add(r)
    await session.commit()

    svc = ReportService(session=session, storage_root=tmp_path)
    files = await svc.generate(task_id=tid)
    assert "report.json" in files
    assert "report.csv" in files
    assert "report.html" in files
    assert "report.zip" in files
    assert set(list_reports(tmp_path, tid)) >= {"report.json", "report.csv", "report.html", "report.zip"}

