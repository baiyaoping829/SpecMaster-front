from pydantic import BaseModel, Field


class RegexPreviewRequest(BaseModel):
    seed_url: str = Field(min_length=1, max_length=2048)
    regex: str = Field(min_length=1, max_length=512)
    max_preview: int = Field(default=1000, ge=1, le=1000)
    timeout_seconds: int = Field(default=3, ge=1, le=10)


class RegexPreviewResponse(BaseModel):
    seed_url: str
    regex: str
    discovered: int
    matched: int
    elapsed_ms: float
    urls: list[str]


class RegexEnqueueRequest(BaseModel):
    keyword: str = Field(min_length=1, max_length=256)
    seed_url: str = Field(min_length=1, max_length=2048)
    regex: str = Field(min_length=1, max_length=512)
    max_urls: int = Field(default=1000, ge=1, le=1000)
    max_depth: int = Field(default=0, ge=0, le=5)
    engine: str = Field(default="httpx_bs4", max_length=32)
    concurrency: int = Field(default=10, ge=1, le=100)


class RegexEnqueueResponse(BaseModel):
    batch_id: str
    created_tasks: int

