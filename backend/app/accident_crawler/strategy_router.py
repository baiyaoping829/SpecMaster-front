from fastapi import APIRouter, Header
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from ..core.db import get_session
from ..core.responses import ok, created
from .schemas import CrawlTaskCreate
from .service import AccidentCrawlerService
from .strategy_service import StrategyService, recommend_strategy, strategy_fingerprint


router = APIRouter(prefix="/api/strategy", tags=["strategy"])


def _user_id(x_user_id: str | None) -> str:
    return (x_user_id or "").strip() or "default"


class SaveExperienceRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    name: str = Field(min_length=1, max_length=128)
    description: str = Field(default="", max_length=512)
    strategy: dict = Field(default_factory=dict)


class ABCompareRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    strategy: dict = Field(default_factory=dict)

class SmartTaskRequest(BaseModel):
    keyword: str = Field(min_length=1, max_length=256)
    target_url: str = Field(min_length=1, max_length=2048)
    max_items: int = Field(default=20, ge=1, le=200)
    max_depth: int = Field(default=1, ge=0, le=3)


@router.get("/recommend", response_model=None)
async def recommend(url: str):
    s = recommend_strategy(url=url)
    return ok({"url": url, "strategy": s, "fingerprint": strategy_fingerprint(s)})


@router.post("/experience", response_model=None)
async def save_experience(payload: SaveExperienceRequest, session: AsyncSession = Depends(get_session), x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    svc = StrategyService(session=session)
    item = await svc.save_experience(
        user_id=_user_id(x_user_id),
        url=payload.url,
        name=payload.name,
        description=payload.description,
        strategy=payload.strategy,
    )
    await session.commit()
    return created(item)


@router.get("/experience", response_model=None)
async def list_experience(domain: str = "", page: int = 1, size: int = 20, session: AsyncSession = Depends(get_session), x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    svc = StrategyService(session=session)
    data = await svc.list_experience(user_id=_user_id(x_user_id), domain=domain, page=page, size=size)
    return ok(data)


@router.post("/ab-compare", response_model=None)
async def ab_compare(payload: ABCompareRequest, session: AsyncSession = Depends(get_session)):
    svc = StrategyService(session=session)
    data = await svc.ab_compare(url=payload.url, user_strategy=payload.strategy)
    return ok(data)


@router.post("/smart-task", response_model=None)
async def smart_task(payload: SmartTaskRequest, session: AsyncSession = Depends(get_session)):
    s = recommend_strategy(url=payload.target_url)
    req = CrawlTaskCreate(
        keyword=payload.keyword,
        target_url=payload.target_url,
        max_items=payload.max_items,
        max_depth=payload.max_depth,
        engine=str(s.get("engine", "httpx_bs4")),
        concurrency=int(s.get("concurrency", 10)),
    )
    vo = await AccidentCrawlerService(session=session).create_task(req)
    return created({"task": vo.model_dump(), "strategy": s, "fingerprint": strategy_fingerprint(s)})
