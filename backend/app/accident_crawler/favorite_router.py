from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.db import get_session
from ..core.responses import ok
from .favorite_schemas import FavoriteSiteCreate, FavoriteSiteUpdate
from .favorite_service import FavoriteService


router = APIRouter(prefix="/api/favorite", tags=["favorite-sites"])


def _user_id(x_user_id: str | None) -> str:
    return (x_user_id or "").strip() or "default"


def _svc(session: AsyncSession) -> FavoriteService:
    return FavoriteService(session=session)


@router.post("", response_model=None)
async def create_favorite(payload: FavoriteSiteCreate, session: AsyncSession = Depends(get_session), x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    vo, existed = await _svc(session).create(user_id=_user_id(x_user_id), req=payload)
    return ok({"item": vo.model_dump(), "existed": existed})


@router.get("", response_model=None)
async def list_favorites(
    page: int = 1,
    size: int = 20,
    q: str = "",
    tag: str = "",
    session: AsyncSession = Depends(get_session),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    data = await _svc(session).list(user_id=_user_id(x_user_id), q=q, tag=tag, page=page, size=size)
    return ok(data.model_dump())

@router.get("/lookup", response_model=None)
async def lookup_favorite(site_url: str = Query(..., min_length=1, max_length=2048), session: AsyncSession = Depends(get_session), x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    try:
        vo = await _svc(session).get_by_url(user_id=_user_id(x_user_id), site_url=site_url)
        return ok({"found": True, "item": vo.model_dump()})
    except Exception:
        return ok({"found": False})


@router.put("/{favorite_id}", response_model=None)
async def update_favorite(
    favorite_id: str,
    payload: FavoriteSiteUpdate,
    session: AsyncSession = Depends(get_session),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    vo = await _svc(session).update(user_id=_user_id(x_user_id), favorite_id=favorite_id, req=payload)
    return ok(vo.model_dump())


@router.delete("/{favorite_id}", response_model=None)
async def delete_favorite(
    favorite_id: str,
    session: AsyncSession = Depends(get_session),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    await _svc(session).delete(user_id=_user_id(x_user_id), favorite_id=favorite_id)
    return ok({"ok": True})

