from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.db import get_session
from ..core.redis_client import redis_dep
from ..core.responses import ok
from .schemas import AccidentCaseUpdate
from .service import AccidentService


router = APIRouter(prefix=f"{settings.api_prefix}/accident", tags=["accident-legacy"])


def _svc(session: AsyncSession, redis: Redis | None) -> AccidentService:
    return AccidentService(session=session, redis=redis, minio_enabled=settings.minio_enabled)


@router.post("/update", response_model=None)
async def legacy_update(
    case_id: str,
    req: AccidentCaseUpdate,
    session: AsyncSession = Depends(get_session),
    redis: Redis | None = Depends(redis_dep),
):
    vo = await _svc(session, redis).update_case(case_id=case_id, req=req)
    return ok(vo.model_dump())

