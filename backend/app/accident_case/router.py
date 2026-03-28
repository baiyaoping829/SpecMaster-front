from fastapi import APIRouter, Depends, UploadFile, File, Query
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.exceptions import ApiError
from ..core.redis_client import redis_dep
from ..core.responses import created, ok
from ..core.db import get_session
from .external import search_external_cases
from .schemas import AccidentCaseCreate, AccidentCaseUpdate, ExternalImportReq, LinkSpecReq
from .service import AccidentService


router = APIRouter(prefix=f"{settings.api_prefix}/accidents", tags=["accidents"])


def _svc(session: AsyncSession, redis: Redis | None) -> AccidentService:
    return AccidentService(session=session, redis=redis, minio_enabled=settings.minio_enabled)


@router.post("/", response_model=None)
async def create_case(payload: AccidentCaseCreate, session: AsyncSession = Depends(get_session), redis: Redis | None = Depends(redis_dep)):
    data = await _svc(session, redis).create_case(payload)
    return created(data.model_dump())


@router.get("/{case_id}", response_model=None)
async def get_case(case_id: str, session: AsyncSession = Depends(get_session), redis: Redis | None = Depends(redis_dep)):
    data = await _svc(session, redis).get_case(case_id)
    return ok(data.model_dump())


@router.put("/{case_id}", response_model=None)
async def update_case(case_id: str, payload: AccidentCaseUpdate, session: AsyncSession = Depends(get_session), redis: Redis | None = Depends(redis_dep)):
    data = await _svc(session, redis).update_case(case_id, payload)
    return ok(data.model_dump())


@router.delete("/{case_id}", response_model=None)
async def delete_case(case_id: str, session: AsyncSession = Depends(get_session), redis: Redis | None = Depends(redis_dep)):
    await _svc(session, redis).delete_case(case_id)
    return ok({"ok": True})


@router.get("/", response_model=None)
async def list_cases(page: int = 1, size: int = 20, session: AsyncSession = Depends(get_session), redis: Redis | None = Depends(redis_dep)):
    data = await _svc(session, redis).list_cases(page=page, size=size)
    return ok(data.model_dump())


@router.get("/external/search", response_model=None)
async def external_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
):
    items = search_external_cases(query=q, limit=limit)
    return ok({"items": [x.__dict__ for x in items]})


@router.post("/external/import", response_model=None)
async def external_import(
    payload: ExternalImportReq,
    session: AsyncSession = Depends(get_session),
    redis: Redis | None = Depends(redis_dep),
):
    data = await _svc(session, redis).import_external(payload)
    return ok(data)


@router.post("/{case_id}/specs", response_model=None)
async def link_spec(case_id: str, payload: LinkSpecReq, session: AsyncSession = Depends(get_session), redis: Redis | None = Depends(redis_dep)):
    await _svc(session, redis).link_spec(case_id=case_id, spec_id=payload.spec_id)
    return ok({"ok": True})


@router.delete("/{case_id}/specs/{spec_id}", response_model=None)
async def unlink_spec(case_id: str, spec_id: str, session: AsyncSession = Depends(get_session), redis: Redis | None = Depends(redis_dep)):
    await _svc(session, redis).unlink_spec(case_id=case_id, spec_id=spec_id)
    return ok({"ok": True})


@router.post("/{case_id}/attachments", response_model=None)
async def upload_attachments(
    case_id: str,
    files: list[UploadFile] = File(...),
    session: AsyncSession = Depends(get_session),
    redis: Redis | None = Depends(redis_dep),
):
    payload = []
    for f in files:
        if not (f.filename or "").lower().endswith(".pdf"):
            raise ApiError(400, "only pdf supported")
        data = await f.read()
        payload.append((f.filename or "file.pdf", data, "application/pdf"))
    keys = await _svc(session, redis).upload_attachments(case_id=case_id, files=payload)
    return created({"attachment_keys": keys})


@router.get("/{case_id}/attachments/presign", response_model=None)
async def presign_attachment(
    case_id: str,
    key: str = Query(...),
    session: AsyncSession = Depends(get_session),
    redis: Redis | None = Depends(redis_dep),
):
    url = await _svc(session, redis).presign_attachment(case_id=case_id, key=key)
    return ok({"url": url})


@router.delete("/{case_id}/attachments", response_model=None)
async def delete_attachment(
    case_id: str,
    key: str = Query(...),
    session: AsyncSession = Depends(get_session),
    redis: Redis | None = Depends(redis_dep),
):
    await _svc(session, redis).delete_attachment(case_id=case_id, key=key)
    return ok({"ok": True})

