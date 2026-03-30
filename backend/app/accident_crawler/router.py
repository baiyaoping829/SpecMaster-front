from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.db import SessionLocal, get_session
from ..core.exceptions import ApiError
from ..core.responses import ok, created
from .attachment_service import AttachmentService
from .schemas import CrawlTaskCreate
from .service import AccidentCrawlerService


router = APIRouter(prefix=f"{settings.api_prefix}/crawler", tags=["accident-crawler"])


def _svc(session: AsyncSession) -> AccidentCrawlerService:
    return AccidentCrawlerService(session=session)


@router.post("/tasks", response_model=None)
async def create_task(payload: CrawlTaskCreate, session: AsyncSession = Depends(get_session)):
    vo = await _svc(session).create_task(payload)
    return created(vo.model_dump())


@router.get("/tasks", response_model=None)
async def list_tasks(
    page: int = 1,
    size: int = 20,
    q: str = "",
    status: str = "",
    start_time: str = "",
    end_time: str = "",
    session: AsyncSession = Depends(get_session),
):
    data = await _svc(session).list_tasks(page=page, size=size, q=q, status=status, start_time=start_time, end_time=end_time)
    return ok(data.model_dump())


@router.get("/tasks/{task_id}", response_model=None)
async def get_task(task_id: str, session: AsyncSession = Depends(get_session)):
    vo = await _svc(session).get_task(task_id)
    return ok(vo.model_dump())

@router.get("/tasks/{task_id}/log", response_model=None)
async def get_task_log(task_id: str, tail: int = Query(4000, ge=0, le=200000), session: AsyncSession = Depends(get_session)):
    text = await _svc(session).get_task_log(task_id=task_id, tail=tail)
    return ok({"text": text})


@router.post("/tasks/{task_id}/run", response_model=None)
async def run_task(task_id: str, bg: BackgroundTasks, session: AsyncSession = Depends(get_session)):
    async def _bg_run(tid: str) -> None:
        async with SessionLocal() as s:
            await AccidentCrawlerService(session=s).run_task(task_id=tid)

    bg.add_task(_bg_run, task_id)
    return ok({"queued": True, "task_id": task_id})


@router.get("/reports", response_model=None)
async def list_reports(
    q: str = "",
    accident_type: str = "",
    start_date: str = "",
    end_date: str = "",
    casualties_level: str = "",
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = 1,
    size: int = 20,
    session: AsyncSession = Depends(get_session),
):
    data = await _svc(session).list_reports(
        q=q,
        accident_type=accident_type,
        start_date=start_date,
        end_date=end_date,
        casualties_level=casualties_level,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        size=size,
    )
    return ok(data.model_dump())


@router.delete("/reports/{report_id}", response_model=None)
async def delete_report(report_id: str, session: AsyncSession = Depends(get_session)):
    await _svc(session).delete_report(report_id)
    return ok({"ok": True})


@router.post("/reports/{report_id}/reparse", response_model=None)
async def reparse_report(report_id: str, session: AsyncSession = Depends(get_session)):
    vo = await _svc(session).reparse_report(report_id)
    return ok(vo.model_dump())


@router.get("/reports/{report_id}/attachments", response_model=None)
async def list_report_attachments(report_id: str, session: AsyncSession = Depends(get_session)):
    data = await _svc(session).list_report_attachments(report_id)
    return ok({"items": data, "total": len(data)})


@router.post("/attachments/audit", response_model=None)
async def audit_attachments(session: AsyncSession = Depends(get_session)):
    data = await AttachmentService(session=session).audit_consistency()
    return ok(data)


@router.get("/tasks/{task_id}/reports", response_model=None)
async def list_task_reports(task_id: str, session: AsyncSession = Depends(get_session)):
    svc = AccidentCrawlerService(session=session)
    files = svc.task_report_files(task_id)
    return ok(
        {
            "task_id": task_id,
            "files": files,
            "zip": f"/api/v1/crawler/tasks/{task_id}/reports.zip",
            "links": [f"/api/v1/crawler/tasks/{task_id}/reports/{name}" for name in files],
        }
    )


@router.get("/tasks/{task_id}/reports/{name}", response_model=None)
async def download_task_report(task_id: str, name: str):
    base = Path(__file__).resolve().parents[3] / "backend" / "storage" / "crawler" / "reports" / task_id
    p = (base / name).resolve()
    if base.resolve() not in p.parents:
        raise ApiError(400, "invalid path")
    if not p.exists() or not p.is_file():
        raise ApiError(404, "not found")
    return FileResponse(str(p), filename=p.name)


@router.get("/tasks/{task_id}/reports.zip", response_model=None)
async def download_task_report_zip(task_id: str):
    base = Path(__file__).resolve().parents[3] / "backend" / "storage" / "crawler" / "reports" / task_id
    p = (base / "report.zip").resolve()
    if not p.exists() or not p.is_file():
        raise ApiError(404, "not found")
    return FileResponse(str(p), filename=p.name)
