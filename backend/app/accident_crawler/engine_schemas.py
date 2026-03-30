from pydantic import BaseModel, Field


class EngineCompareItem(BaseModel):
    engine: str
    ok: bool
    status_code: int
    elapsed_ms: float
    title: str = ""
    error: str | None = None


class EngineCompareResponse(BaseModel):
    url: str
    items: list[EngineCompareItem]


class EngineCompareRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    engines: list[str] = Field(default_factory=lambda: ["httpx_bs4", "requests_bs4", "playwright"])

