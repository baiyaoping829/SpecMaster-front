from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.db import get_session
from ..core.responses import ok
from .regex_schemas import RegexEnqueueRequest, RegexPreviewRequest
from .regex_service import RegexService


router = APIRouter(prefix="/api/regex", tags=["regex"])


def _user_id(x_user_id: str | None) -> str:
    return (x_user_id or "").strip() or "default"


def _svc(session: AsyncSession) -> RegexService:
    return RegexService(session=session)


@router.post("/preview", response_model=None)
async def preview(payload: RegexPreviewRequest, session: AsyncSession = Depends(get_session)):
    res = await _svc(session).preview(payload)
    return ok(res.model_dump())


@router.post("/enqueue", response_model=None)
async def enqueue(payload: RegexEnqueueRequest, session: AsyncSession = Depends(get_session), x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    res = await _svc(session).enqueue(user_id=_user_id(x_user_id), req=payload)
    return ok(res.model_dump())

