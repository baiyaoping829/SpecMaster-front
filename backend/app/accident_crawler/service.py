import json
import random
import asyncio
import re
import time
from dataclasses import dataclass
from hashlib import sha1
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.parse import urljoin
from uuid import uuid4

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import desc, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions import ApiError
from .engines import get_engine
from .models import AccidentCrawledReport, AccidentCrawlTask
from .attachment_models import Attachment, ReportAttachment
from .parse import extract_fields
from .schemas import CrawlTaskCreate, CrawlTaskList, CrawlTaskVO, CrawledReportList, CrawledReportVO
from .attachment_service import AttachmentService
from .strategy_service import recommend_strategy, strategy_fingerprint
from .report_service import ReportService, list_reports


STORAGE_DIR = Path(__file__).resolve().parents[3] / "backend" / "storage" / "crawler"


UA_POOL = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
]


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _fingerprint(*, title: str, report_url: str, source_url: str) -> str:
    raw = f"{title}\n{report_url}\n{source_url}".encode("utf-8", "ignore")
    return sha1(raw).hexdigest()


def _ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def _proxy_candidates() -> list[str]:
    import os

    raw = str(os.getenv("CRAWLER_PROXIES") or "").strip()
    if not raw:
        return []
    return [x.strip() for x in raw.split(",") if x.strip()]


def _extract_report_no(text: str) -> str:
    s = (text or "").replace("\u3000", " ")
    s = re.sub(r"\s+", " ", s)
    m = re.search(r"(?:报告编号|编号)[:：]?\s*([A-Za-z0-9\u4e00-\u9fff\-\(\)（）〔〕【】]+?号)", s)
    if m:
        return m.group(1)[:128]
    m = re.search(r"([A-Za-z\u4e00-\u9fff]{1,16}[〔【(（]?\d{4}[〕】)）]?\s*\d{1,4}\s*号)", s)
    if m:
        y = re.search(r"(\d{4})", m.group(1))
        if y and int(y.group(1)) < 2015:
            return ""
        return m.group(1)[:128]
    return ""


def _extract_pdf_text_from_bytes(data: bytes) -> str:
    from pdfminer.high_level import extract_text

    tmp = NamedTemporaryFile(suffix=".pdf", delete=False)
    try:
        tmp.write(data or b"")
        tmp.flush()
        tmp.close()
        try:
            return extract_text(tmp.name) or ""
        except Exception:
            return ""
    finally:
        try:
            Path(tmp.name).unlink(missing_ok=True)
        except Exception:
            pass


@dataclass(frozen=True)
class CrawlResult:
    ok: int
    fail: int
    last_error: str | None


class AccidentCrawlerService:
    def __init__(self, *, session: AsyncSession, http_transport: httpx.AsyncBaseTransport | None = None):
        self.session = session
        self.http_transport = http_transport

    async def create_task(self, req: CrawlTaskCreate) -> CrawlTaskVO:
        now = _now()
        strategy = recommend_strategy(url=req.target_url)
        if req.engine:
            strategy["engine"] = str(req.engine)
        strategy["concurrency"] = int(req.concurrency or strategy.get("concurrency", 10))
        fp = strategy_fingerprint(strategy)
        row = AccidentCrawlTask(
            id=uuid4().hex,
            keyword=req.keyword,
            target_url=req.target_url,
            batch_id="",
            batch_seq=0,
            engine=str(strategy.get("engine", "httpx_bs4")),
            engine_params="{}",
            concurrency=int(strategy.get("concurrency", 10)),
            strategy_used=json.dumps(strategy, ensure_ascii=False),
            strategy_fingerprint=fp,
            status="pending",
            max_items=int(req.max_items),
            max_depth=int(req.max_depth),
            success_count=0,
            fail_count=0,
            last_error=None,
            log_path=str((STORAGE_DIR / "logs" / f"{uuid4().hex}.log").as_posix()),
            started_at=None,
            finished_at=None,
            created_at=now,
            updated_at=now,
            deleted_at=None,
        )
        async with self.session.begin_nested():
            self.session.add(row)
        return self._task_vo(row)

    async def list_tasks(self, *, page: int, size: int, q: str = "", status: str = "", start_time: str = "", end_time: str = "") -> CrawlTaskList:
        safe_page = max(1, int(page))
        safe_size = min(200, max(1, int(size)))
        offset = (safe_page - 1) * safe_size
        stmt = select(AccidentCrawlTask).where(AccidentCrawlTask.deleted_at.is_(None))
        count_stmt = select(func.count(AccidentCrawlTask.id)).where(AccidentCrawlTask.deleted_at.is_(None))
        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(or_(AccidentCrawlTask.keyword.like(like), AccidentCrawlTask.target_url.like(like)))
            count_stmt = count_stmt.where(or_(AccidentCrawlTask.keyword.like(like), AccidentCrawlTask.target_url.like(like)))
        if status:
            stmt = stmt.where(AccidentCrawlTask.status == status)
            count_stmt = count_stmt.where(AccidentCrawlTask.status == status)
        if start_time:
            stmt = stmt.where(AccidentCrawlTask.created_at >= start_time)
            count_stmt = count_stmt.where(AccidentCrawlTask.created_at >= start_time)
        if end_time:
            stmt = stmt.where(AccidentCrawlTask.created_at <= end_time)
            count_stmt = count_stmt.where(AccidentCrawlTask.created_at <= end_time)
        stmt = stmt.order_by(desc(AccidentCrawlTask.created_at)).offset(offset).limit(safe_size)
        rows = (await self.session.execute(stmt)).scalars().all()
        total = int((await self.session.execute(count_stmt)).scalar_one())
        return CrawlTaskList(items=[self._task_vo(r) for r in rows], total=total, page=safe_page, size=safe_size)

    async def get_task(self, task_id: str) -> CrawlTaskVO:
        stmt = select(AccidentCrawlTask).where(AccidentCrawlTask.id == task_id).where(AccidentCrawlTask.deleted_at.is_(None))
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if not row:
            raise ApiError(404, "not found")
        return self._task_vo(row)

    def task_report_files(self, task_id: str) -> list[str]:
        return list_reports(STORAGE_DIR, task_id)

    async def get_task_log(self, *, task_id: str, tail: int = 4000) -> str:
        task = await self._get_task_row(task_id)
        p = Path(task.log_path or "")
        if not p.is_absolute():
            p = STORAGE_DIR / "logs" / f"{task_id}.log"
        if not p.exists() or not p.is_file():
            return ""
        data = p.read_text(encoding="utf-8", errors="ignore")
        if tail and len(data) > int(tail):
            return data[-int(tail) :]
        return data

    async def run_task(self, *, task_id: str) -> CrawlTaskVO:
        task = await self._get_task_row(task_id)
        if task.status == "running":
            return self._task_vo(task)

        _ensure_dir(STORAGE_DIR / "logs")
        _ensure_dir(STORAGE_DIR / "raw")

        trace_id = uuid4().hex
        await self._update_task(
            task_id,
            status="running",
            stage="starting",
            progress_current=0,
            progress_total=0,
            trace_id=trace_id,
            started_at=_now(),
            finished_at=None,
            last_error=None,
            success_count=0,
            fail_count=0,
        )
        try:
            res = await self._crawl(
                task_id=task_id,
                keyword=task.keyword,
                target_url=task.target_url,
                max_items=task.max_items,
                max_depth=task.max_depth,
                engine_name=task.engine,
                batch_id=task.batch_id or task_id,
            )
            await self._update_task(
                task_id,
                status="succeeded" if res.fail == 0 else "finished",
                stage="done" if res.fail == 0 else "finished",
                finished_at=_now(),
                success_count=res.ok,
                fail_count=res.fail,
                last_error=res.last_error,
                progress_current=res.ok + res.fail,
            )
        except Exception as e:
            await self._update_task(task_id, status="failed", stage="failed", finished_at=_now(), last_error=str(e))
        try:
            _ensure_dir(STORAGE_DIR / "reports")
            await ReportService(session=self.session, storage_root=STORAGE_DIR).generate(task_id=task_id)
        except Exception:
            pass
        return await self.get_task(task_id)

    async def list_reports(
        self,
        *,
        q: str = "",
        accident_type: str = "",
        start_date: str = "",
        end_date: str = "",
        casualties_level: str = "",
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        size: int = 20,
    ) -> CrawledReportList:
        safe_page = max(1, int(page))
        safe_size = min(200, max(1, int(size)))
        offset = (safe_page - 1) * safe_size

        stmt = select(AccidentCrawledReport).where(AccidentCrawledReport.deleted_at.is_(None))
        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(or_(AccidentCrawledReport.title.like(like), AccidentCrawledReport.location.like(like), AccidentCrawledReport.overview.like(like)))
        if accident_type:
            stmt = stmt.where(AccidentCrawledReport.accident_type == accident_type)
        if start_date:
            stmt = stmt.where(AccidentCrawledReport.occurred_at >= start_date)
        if end_date:
            stmt = stmt.where(AccidentCrawledReport.occurred_at <= end_date)
        if casualties_level:
            like = f"%{casualties_level}%"
            stmt = stmt.where(AccidentCrawledReport.casualties.like(like))

        order_col = AccidentCrawledReport.created_at if sort_by not in {"occurred_at", "published_at", "created_at"} else getattr(AccidentCrawledReport, sort_by)
        if sort_order.lower() == "asc":
            stmt = stmt.order_by(order_col.asc())
        else:
            stmt = stmt.order_by(order_col.desc())

        count_stmt = select(func.count(AccidentCrawledReport.id)).where(AccidentCrawledReport.deleted_at.is_(None))
        if q:
            like = f"%{q.strip()}%"
            count_stmt = count_stmt.where(or_(AccidentCrawledReport.title.like(like), AccidentCrawledReport.location.like(like), AccidentCrawledReport.overview.like(like)))
        if accident_type:
            count_stmt = count_stmt.where(AccidentCrawledReport.accident_type == accident_type)
        if start_date:
            count_stmt = count_stmt.where(AccidentCrawledReport.occurred_at >= start_date)
        if end_date:
            count_stmt = count_stmt.where(AccidentCrawledReport.occurred_at <= end_date)
        if casualties_level:
            like = f"%{casualties_level}%"
            count_stmt = count_stmt.where(AccidentCrawledReport.casualties.like(like))

        rows = (await self.session.execute(stmt.offset(offset).limit(safe_size))).scalars().all()
        total = int((await self.session.execute(count_stmt)).scalar_one())
        return CrawledReportList(items=[self._report_vo(r) for r in rows], total=total, page=safe_page, size=safe_size)

    async def delete_report(self, report_id: str) -> None:
        now = _now()
        async with self.session.begin_nested():
            stmt = (
                update(AccidentCrawledReport)
                .where(AccidentCrawledReport.id == report_id)
                .where(AccidentCrawledReport.deleted_at.is_(None))
                .values(deleted_at=now, updated_at=now)
            )
            res = await self.session.execute(stmt)
            if res.rowcount != 1:
                raise ApiError(404, "not found")

    async def reparse_report(self, report_id: str) -> CrawledReportVO:
        stmt = select(AccidentCrawledReport).where(AccidentCrawledReport.id == report_id).where(AccidentCrawledReport.deleted_at.is_(None))
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if not row:
            raise ApiError(404, "not found")

        raw_text = ""
        if row.raw_path:
            p = Path(row.raw_path)
            if p.exists() and p.is_file():
                if "pdf" in (row.raw_mime or "").lower() or p.suffix.lower() == ".pdf":
                    raw_text = _extract_pdf_text_from_bytes(p.read_bytes())
                elif (row.raw_mime or "").startswith("text/") or p.suffix.lower() in {".html", ".txt"}:
                    raw_text = p.read_text(encoding="utf-8", errors="ignore")

        parsed = extract_fields(title=row.title, text=raw_text)
        report_no = _extract_report_no(raw_text)
        payload = {**parsed.__dict__, "report_no": report_no}
        patch = {
            "report_no": report_no,
            "occurred_at": parsed.occurred_at,
            "location": parsed.location,
            "accident_type": parsed.accident_type,
            "casualties": parsed.casualties,
            "cause_overview": parsed.cause_overview,
            "responsible_party": parsed.responsible_party,
            "overview": parsed.overview,
            "published_at": parsed.published_at,
            "updated_at": _now(),
            "parsed_json": json.dumps(payload, ensure_ascii=False),
        }
        async with self.session.begin_nested():
            await self.session.execute(update(AccidentCrawledReport).where(AccidentCrawledReport.id == report_id).values(**patch))
        stmt2 = select(AccidentCrawledReport).where(AccidentCrawledReport.id == report_id)
        row2 = (await self.session.execute(stmt2)).scalar_one()
        return self._report_vo(row2)

    async def _crawl(self, *, task_id: str, keyword: str, target_url: str, max_items: int, max_depth: int, engine_name: str, batch_id: str) -> CrawlResult:
        proxies = _proxy_candidates()
        ok = 0
        fail = 0
        last_error: str | None = None

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, transport=self.http_transport) as client:
            links: list[str] = []
            if max_depth <= 0:
                links = [target_url]
            else:
                try:
                    html = await self._get_text(client, target_url, proxies=proxies, engine_name=engine_name)
                except Exception as e:
                    await self._append_log(task_id, f"target fetch failed: {e}")
                    return CrawlResult(ok=0, fail=1, last_error=str(e))
                links = self._discover_links(base=target_url, html=html, keyword=keyword)
                if not links:
                    await self._append_log(task_id, "no matched links")
                    return CrawlResult(ok=0, fail=0, last_error=None)

            total = min(len(links), int(max_items))
            await self._update_task(task_id, stage="crawling", progress_total=total, progress_current=0)
            last_progress_at = 0.0
            for idx, u in enumerate(links[:max_items], start=1):
                now_perf = time.perf_counter()
                if (now_perf - last_progress_at) >= 0.8 or idx == total:
                    await self._update_task(task_id, progress_current=idx)
                    last_progress_at = now_perf
                await asyncio.sleep(random.uniform(0.2, 0.8))
                try:
                    if u.lower().endswith(".pdf") or ".pdf?" in u.lower():
                        await self._update_task(task_id, stage="download_pdf")
                        raw_path, raw_mime, data, status, cost_ms = await self._download_file(
                            client, task_id=task_id, url=u, proxies=proxies, engine_name=engine_name
                        )
                        title = u.split("/")[-1]
                        pdf_text = _extract_pdf_text_from_bytes(data) if "pdf" in (raw_mime or "").lower() else ""
                        parsed = extract_fields(title=title, text=pdf_text)
                        report_no = _extract_report_no(pdf_text)
                        payload = {**parsed.__dict__, "report_no": report_no}
                        fp = _fingerprint(title=parsed.title, report_url=u, source_url=u)
                        inserted = await self._upsert_report(
                            task_id=task_id,
                            fingerprint=fp,
                            parsed=parsed,
                            report_no=report_no,
                            parsed_json=payload,
                            report_url=u,
                            source_url=u,
                            raw_path=raw_path,
                            raw_mime=raw_mime,
                        )
                        if inserted:
                            ok += 1
                            await self._append_log(task_id, f"ok: {status} {len(data)}B {int(cost_ms)}ms {parsed.title} {u}")
                            await self._link_attachment(batch_id=batch_id, report_fingerprint=fp, original_url=u, data=data)
                        else:
                            await self._append_log(task_id, f"dup: {parsed.title} {u}")
                        continue

                    await self._update_task(task_id, stage="fetch_detail")
                    detail_html = await self._get_text(client, u, proxies=proxies, engine_name=engine_name)
                    soup = BeautifulSoup(detail_html, "lxml")
                    title = (soup.title.text.strip() if soup.title and soup.title.text else "") or u
                    text = soup.get_text("\n", strip=True)

                    report_url = ""
                    pdf_link = self._find_pdf_link(base=u, soup=soup)
                    raw_path = None
                    raw_mime = None
                    if pdf_link:
                        report_url = pdf_link
                        await self._update_task(task_id, stage="download_pdf")
                        raw_path, raw_mime, pdf_bytes, status, cost_ms = await self._download_file(
                            client, task_id=task_id, url=pdf_link, proxies=proxies, engine_name=engine_name
                        )
                        pdf_text = _extract_pdf_text_from_bytes(pdf_bytes) if "pdf" in (raw_mime or "").lower() else ""
                        if pdf_text:
                            text = pdf_text
                        await self._append_log(task_id, f"pdf: {status} {len(pdf_bytes)}B {int(cost_ms)}ms {pdf_link}")
                    else:
                        report_url = u
                        raw_path, raw_mime = self._save_text(task_id=task_id, url=u, text=detail_html, suffix=".html")

                    parsed = extract_fields(title=title, text=text)
                    await self._update_task(task_id, stage="persist")
                    report_no = _extract_report_no(text)
                    payload = {**parsed.__dict__, "report_no": report_no}
                    fp = _fingerprint(title=parsed.title, report_url=report_url, source_url=u)
                    inserted = await self._upsert_report(
                        task_id=task_id,
                        fingerprint=fp,
                        parsed=parsed,
                        report_no=report_no,
                        parsed_json=payload,
                        report_url=report_url,
                        source_url=u,
                        raw_path=raw_path,
                        raw_mime=raw_mime,
                    )
                    if inserted:
                        ok += 1
                        await self._append_log(task_id, f"ok: {parsed.title} {u}")
                        if pdf_link:
                            await self._link_attachment(batch_id=batch_id, report_fingerprint=fp, original_url=pdf_link, data=pdf_bytes)
                    else:
                        await self._append_log(task_id, f"dup: {parsed.title} {u}")
                except Exception as e:
                    fail += 1
                    last_error = str(e)
                    await self._append_log(task_id, f"fail: {u} {e}")

        return CrawlResult(ok=ok, fail=fail, last_error=last_error)

    async def _get_text(self, client: httpx.AsyncClient, url: str, *, proxies: list[str], engine_name: str) -> str:
        if (engine_name or "httpx_bs4") != "httpx_bs4":
            eng = get_engine(engine_name)
            res = await eng.fetch_text(url)
            return res.text or ""
        headers = {"User-Agent": random.choice(UA_POOL)}
        proxy = random.choice(proxies) if proxies else None
        for i in range(3):
            try:
                if proxy:
                    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, proxy=proxy) as c:
                        r = await c.get(url, headers=headers)
                else:
                    r = await client.get(url, headers=headers)
                r.raise_for_status()
                return r.text
            except Exception:
                if i == 2:
                    raise
                await asyncio.sleep(random.uniform(0.3, 0.9))
        return ""

    def _discover_links(self, *, base: str, html: str, keyword: str) -> list[str]:
        tokens = [t.strip() for t in re.split(r"[\s,，;；]+", (keyword or "").strip()) if t.strip()]
        soup = BeautifulSoup(html or "", "lxml")
        urls: list[str] = []
        for a in soup.find_all("a"):
            href = a.get("href") or ""
            if not href:
                continue
            abs_url = urljoin(base, href)
            text = (a.get_text(" ", strip=True) or "") + " " + href
            text_norm = re.sub(r"\\s+", "", text).lower()
            if tokens and all(re.sub(r"\\s+", "", t).lower() in text_norm for t in tokens):
                if abs_url not in urls:
                    urls.append(abs_url)
        return urls

    def _find_pdf_link(self, *, base: str, soup: BeautifulSoup) -> str:
        for a in soup.find_all("a"):
            href = a.get("href") or ""
            if not href:
                continue
            if not (href.lower().endswith(".pdf") or ".pdf?" in href.lower()):
                continue
            text = a.get_text(" ", strip=True) or ""
            if "下载" in text:
                return urljoin(base, href)
        for a in soup.find_all("a"):
            href = a.get("href") or ""
            if not href:
                continue
            if href.lower().endswith(".pdf") or ".pdf?" in href.lower():
                return urljoin(base, href)
        return ""

    async def _download_file(
        self, client: httpx.AsyncClient, *, task_id: str, url: str, proxies: list[str], engine_name: str
    ) -> tuple[str, str, bytes, int, float]:
        if (engine_name or "httpx_bs4") != "httpx_bs4":
            eng = get_engine(engine_name)
            res = await eng.fetch_bytes(url)
            data = res.content or b""
            mime = res.content_type or "application/octet-stream"
            out_path = self._save_bytes(task_id=task_id, url=str(res.url), data=data, mime=mime)
            return out_path, mime, data, int(res.status_code), float(res.elapsed_ms)
        headers = {"User-Agent": random.choice(UA_POOL)}
        proxy = random.choice(proxies) if proxies else None
        t0 = time.perf_counter()
        if proxy:
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, proxy=proxy) as c:
                r = await c.get(url, headers=headers)
        else:
            r = await client.get(url, headers=headers)
        r.raise_for_status()
        data = r.content
        cost_ms = (time.perf_counter() - t0) * 1000.0
        mime = r.headers.get("content-type", "application/octet-stream")
        suffix = ".pdf" if "pdf" in mime.lower() or url.lower().endswith(".pdf") else ".bin"
        p = STORAGE_DIR / "raw" / task_id
        _ensure_dir(p)
        name = sha1(url.encode("utf-8")).hexdigest()[:16] + suffix
        out = p / name
        out.write_bytes(data)
        return str(out), mime, data, int(r.status_code), float(cost_ms)

    def _save_bytes(self, *, task_id: str, url: str, data: bytes, mime: str) -> str:
        suffix = ".pdf" if "pdf" in (mime or "").lower() or str(url).lower().endswith(".pdf") else ".bin"
        p = STORAGE_DIR / "raw" / task_id
        _ensure_dir(p)
        name = sha1(str(url).encode("utf-8")).hexdigest()[:16] + suffix
        out = p / name
        out.write_bytes(data or b"")
        return str(out)

    def _save_text(self, *, task_id: str, url: str, text: str, suffix: str) -> tuple[str, str]:
        p = STORAGE_DIR / "raw" / task_id
        _ensure_dir(p)
        name = sha1(url.encode("utf-8")).hexdigest()[:16] + suffix
        out = p / name
        out.write_text(text or "", encoding="utf-8", errors="ignore")
        mime = "text/html; charset=utf-8" if suffix == ".html" else "text/plain; charset=utf-8"
        return str(out), mime

    async def _upsert_report(
        self,
        *,
        task_id: str,
        fingerprint: str,
        parsed,
        report_no: str,
        parsed_json: dict,
        report_url: str,
        source_url: str,
        raw_path: str | None,
        raw_mime: str | None,
    ) -> bool:
        now = _now()
        row = AccidentCrawledReport(
            id=uuid4().hex,
            task_id=task_id,
            fingerprint=fingerprint,
            title=parsed.title,
            report_no=str(report_no or ""),
            occurred_at=parsed.occurred_at,
            location=parsed.location,
            accident_type=parsed.accident_type,
            casualties=parsed.casualties,
            cause_overview=parsed.cause_overview,
            responsible_party=parsed.responsible_party,
            overview=parsed.overview,
            report_url=report_url,
            source_url=source_url,
            published_at=parsed.published_at,
            raw_path=raw_path,
            raw_mime=raw_mime,
            parsed_json=json.dumps(parsed_json or {}, ensure_ascii=False),
            created_at=now,
            updated_at=now,
            deleted_at=None,
        )
        async with self.session.begin_nested():
            self.session.add(row)
            try:
                await self.session.flush()
            except IntegrityError:
                return False
        return True

    async def _link_attachment(self, *, batch_id: str, report_fingerprint: str, original_url: str, data: bytes) -> None:
        if not data:
            return
        stmt = select(AccidentCrawledReport).where(AccidentCrawledReport.fingerprint == report_fingerprint)
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if not row:
            return
        svc = AttachmentService(session=self.session)
        att = await svc.save_bytes(batch_id=batch_id, original_url=original_url, data=data)
        await svc.link_to_report(report_id=row.id, attachment_id=att.id)

    async def list_report_attachments(self, report_id: str) -> list[dict]:
        stmt = (
            select(Attachment)
            .join(ReportAttachment, ReportAttachment.attachment_id == Attachment.id)
            .where(ReportAttachment.report_id == report_id)
            .order_by(desc(Attachment.created_at))
        )
        rows = (await self.session.execute(stmt)).scalars().all()
        return [
            {
                "id": r.id,
                "batch_id": r.batch_id,
                "original_url": r.original_url,
                "local_path": r.local_path,
                "sha256": r.sha256,
                "file_size": r.file_size,
                "corrupted": bool(r.corrupted),
                "created_at": r.created_at,
            }
            for r in rows
        ]

    async def _append_log(self, task_id: str, line: str) -> None:
        task = await self._get_task_row(task_id)
        log_path = Path(task.log_path or "")
        if not log_path.is_absolute():
            log_path = STORAGE_DIR / "logs" / f"{task_id}.log"
        _ensure_dir(log_path.parent)
        msg = f"{_now()} {line}\n"
        log_path.write_text((log_path.read_text(encoding="utf-8", errors="ignore") if log_path.exists() else "") + msg, encoding="utf-8")

    async def _get_task_row(self, task_id: str) -> AccidentCrawlTask:
        stmt = select(AccidentCrawlTask).where(AccidentCrawlTask.id == task_id).where(AccidentCrawlTask.deleted_at.is_(None))
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if not row:
            raise ApiError(404, "not found")
        return row

    async def _update_task(self, task_id: str, **patch) -> None:
        patch["updated_at"] = _now()
        async with self.session.begin_nested():
            await self.session.execute(update(AccidentCrawlTask).where(AccidentCrawlTask.id == task_id).values(**patch))

    def _task_vo(self, row: AccidentCrawlTask) -> CrawlTaskVO:
        total = int(row.progress_total or 0)
        cur = int(row.progress_current or 0)
        percent = (cur / total * 100.0) if total > 0 else (100.0 if row.status in ("succeeded", "finished") else 0.0)
        return CrawlTaskVO(
            id=row.id,
            keyword=row.keyword,
            target_url=row.target_url,
            batch_id=row.batch_id,
            engine=row.engine,
            concurrency=row.concurrency,
            status=row.status,
            stage=row.stage or "",
            current=cur,
            total=total,
            percent=float(percent),
            trace_id=row.trace_id or "",
            max_items=row.max_items,
            max_depth=row.max_depth,
            success_count=row.success_count,
            fail_count=row.fail_count,
            last_error=row.last_error,
            log_path=row.log_path,
            started_at=row.started_at,
            finished_at=row.finished_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    def _report_vo(self, row: AccidentCrawledReport) -> CrawledReportVO:
        return CrawledReportVO(
            id=row.id,
            task_id=row.task_id,
            fingerprint=row.fingerprint,
            title=row.title,
            report_no=row.report_no,
            occurred_at=row.occurred_at,
            location=row.location,
            accident_type=row.accident_type,
            casualties=row.casualties,
            cause_overview=row.cause_overview,
            responsible_party=row.responsible_party,
            overview=row.overview,
            report_url=row.report_url,
            source_url=row.source_url,
            published_at=row.published_at,
            raw_path=row.raw_path,
            raw_mime=row.raw_mime,
            parsed_json=row.parsed_json,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
