from pydantic import BaseModel, Field


class FavoriteSiteCreate(BaseModel):
    site_url: str = Field(min_length=1, max_length=2048)
    site_name: str = Field(default="", max_length=256)
    tags: list[str] = Field(default_factory=list)


class FavoriteSiteUpdate(BaseModel):
    site_name: str | None = Field(default=None, max_length=256)
    tags: list[str] | None = None


class FavoriteSiteVO(BaseModel):
    id: str
    user_id: str
    site_url: str
    site_name: str
    tags: list[str]
    created_at: str
    updated_at: str


class FavoriteSiteList(BaseModel):
    items: list[FavoriteSiteVO]
    total: int
    page: int
    size: int

