import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.db import get_session
from ..core.responses import ok
from .service import AccidentCrawlerService


router = APIRouter(prefix="/api/progress", tags=["progress"])


def _parse_time(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def _progress_payload(vo) -> dict:
    total = int(getattr(vo, "total", 0) or 0)
    current = int(getattr(vo, "current", 0) or 0)
    percent = float(getattr(vo, "percent", 0.0) or 0.0)
    start_time = _parse_time(getattr(vo, "started_at", None))
    eta = None
    if start_time and total > 0 and current > 0 and percent < 100.0:
        elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
        rate = elapsed / current
        eta = max(0, int(rate * (total - current)))
    out = {
        "taskId": getattr(vo, "id"),
        "status": getattr(vo, "status"),
        "stage": getattr(vo, "stage", ""),
        "current": current,
        "total": total,
        "percent": percent,
        "startTime": getattr(vo, "started_at", None),
        "eta": eta,
        "traceId": getattr(vo, "trace_id", ""),
        "lastError": getattr(vo, "last_error", None),
    }
    return out


@router.get("/{task_id}", response_model=None)
async def get_progress(task_id: str, session: AsyncSession = Depends(get_session)):
    svc = AccidentCrawlerService(session=session)
    vo = await svc.get_task(task_id)
    payload = _progress_payload(vo)
    if payload["status"] not in ("running", "pending"):
        files = svc.task_report_files(task_id)
        payload["reports"] = {
            "files": files,
            "zip": f"/api/v1/crawler/tasks/{task_id}/reports.zip",
            "links": [f"/api/v1/crawler/tasks/{task_id}/reports/{name}" for name in files],
        }
    return ok(payload)


@router.get("/{task_id}/stream", response_model=None)
async def stream_progress(task_id: str, request: Request, session: AsyncSession = Depends(get_session)):
    async def gen():
        svc = AccidentCrawlerService(session=session)
        while True:
            if await request.is_disconnected():
                break
            vo = await svc.get_task(task_id)
            payload = _progress_payload(vo)
            if payload["status"] not in ("running", "pending"):
                files = svc.task_report_files(task_id)
                payload["reports"] = {
                    "files": files,
                    "zip": f"/api/v1/crawler/tasks/{task_id}/reports.zip",
                    "links": [f"/api/v1/crawler/tasks/{task_id}/reports/{name}" for name in files],
                }
            yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
            if payload["status"] not in ("running", "pending"):
                break
            await asyncio.sleep(1)

    return StreamingResponse(gen(), media_type="text/event-stream; charset=utf-8")
