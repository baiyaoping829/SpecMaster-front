from pydantic import BaseModel, Field


class CrawlTaskCreate(BaseModel):
    keyword: str = Field(min_length=1, max_length=256)
    target_url: str = Field(min_length=1, max_length=2048)
    max_items: int = Field(default=20, ge=1, le=200)
    max_depth: int = Field(default=1, ge=0, le=3)
    engine: str = Field(default="httpx_bs4", max_length=32)
    concurrency: int = Field(default=10, ge=1, le=100)


class CrawlTaskVO(BaseModel):
    id: str
    keyword: str
    target_url: str
    batch_id: str
    engine: str
    concurrency: int
    status: str
    stage: str
    current: int
    total: int
    percent: float
    trace_id: str
    max_items: int
    max_depth: int
    success_count: int
    fail_count: int
    last_error: str | None = None
    log_path: str | None = None
    started_at: str | None = None
    finished_at: str | None = None
    created_at: str
    updated_at: str


class CrawlTaskList(BaseModel):
    items: list[CrawlTaskVO]
    total: int
    page: int
    size: int


class CrawledReportVO(BaseModel):
    id: str
    task_id: str | None = None
    fingerprint: str
    title: str
    report_no: str
    occurred_at: str
    location: str
    accident_type: str
    casualties: str
    cause_overview: str
    responsible_party: str
    overview: str
    report_url: str
    source_url: str
    published_at: str
    raw_path: str | None = None
    raw_mime: str | None = None
    parsed_json: str
    created_at: str
    updated_at: str


class CrawledReportList(BaseModel):
    items: list[CrawledReportVO]
    total: int
    page: int
    size: int
