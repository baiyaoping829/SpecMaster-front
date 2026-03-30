import json
from pathlib import Path

import httpx
import pytest
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.accident_crawler.parse import extract_fields
from app.accident_crawler.schemas import CrawlTaskCreate
from app.accident_crawler.service import AccidentCrawlerService
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


def test_extract_fields_basic():
    text = "发生时间：2024年1月2日 地点：河北省石家庄市 造成3人死亡2人受伤 直接原因：违规作业"
    f = extract_fields(title="河北某事故通报", text=text)
    assert f.occurred_at == "2024-01-02"
    assert "河北" in f.location
    assert "死亡" in f.casualties


@pytest.mark.asyncio
async def test_crawl_and_persist(session: AsyncSession, tmp_path: Path, monkeypatch):
    from app.accident_crawler import service as crawler_service

    monkeypatch.setattr(crawler_service, "STORAGE_DIR", tmp_path / "crawler_storage")

    target = "https://site.test/list"
    detail = "https://site.test/detail/1"
    pdf = "https://site.test/files/report.pdf"

    list_html = f"""
    <html><head><title>list</title></head>
    <body>
      <a href="{detail}">重大事故 通报</a>
    </body></html>
    """
    detail_html = f"""
    <html><head><title>重大事故调查报告</title></head>
    <body>
      <div>发生时间：2024年1月2日</div>
      <div>地点：河北省石家庄市</div>
      <div>造成3人死亡</div>
      <div>直接原因：违规作业</div>
      <a href="{pdf}">调查报告.pdf</a>
    </body></html>
    """
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"

    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == target:
            return httpx.Response(200, text=list_html, headers={"content-type": "text/html; charset=utf-8"})
        if str(request.url) == detail:
            return httpx.Response(200, text=detail_html, headers={"content-type": "text/html; charset=utf-8"})
        if str(request.url) == pdf:
            return httpx.Response(200, content=pdf_bytes, headers={"content-type": "application/pdf"})
        return httpx.Response(404, text="not found")

    transport = httpx.MockTransport(handler)
    svc = AccidentCrawlerService(session=session, http_transport=transport)

    vo = await svc.create_task(CrawlTaskCreate(keyword="重大事故", target_url=target, max_items=10, max_depth=1))
    await svc.run_task(task_id=vo.id)

    reports = await svc.list_reports(page=1, size=10)
    assert reports.total == 1
    r = reports.items[0]
    assert r.occurred_at == "2024-01-02"
    assert "河北" in r.location
    assert "死亡" in r.casualties
    assert isinstance(r.report_no, str)
    assert r.report_url == pdf
    assert r.source_url == detail
    assert r.raw_path and Path(r.raw_path).exists()


@pytest.mark.asyncio
async def test_crawl_retry_on_transient_error(session: AsyncSession):
    target = "https://site.test/list"
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == target:
            calls["n"] += 1
            if calls["n"] < 2:
                raise httpx.ConnectError("boom", request=request)
            return httpx.Response(200, text="<html><body>empty</body></html>", headers={"content-type": "text/html"})
        return httpx.Response(404)

    transport = httpx.MockTransport(handler)
    svc = AccidentCrawlerService(session=session, http_transport=transport)
    vo = await svc.create_task(CrawlTaskCreate(keyword="x", target_url=target, max_items=5, max_depth=1))
    await svc.run_task(task_id=vo.id)
    assert calls["n"] >= 2
