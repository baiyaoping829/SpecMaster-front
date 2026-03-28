from pydantic import BaseModel, Field, HttpUrl


class Attachment(BaseModel):
    kind: str = Field(description="report_pdf|other")
    url: HttpUrl | None = None
    local_path: str | None = None
    sha256: str | None = None
    mime_type: str | None = None


class AccidentCaseRecord(BaseModel):
    source: str = Field(description="mem.gov.cn|mem.gov.cn-awh|nmsa.gov.cn|other")
    source_url: HttpUrl
    source_urls: list[HttpUrl] = Field(default_factory=list)

    name: str
    occurred_at: str = Field(description="YYYY-MM-DD or ISO8601")
    location: str
    industry: str
    level: str = Field(description="一般|较大|重大|特别重大")

    deaths: int = Field(ge=0)
    injuries: int = Field(ge=0)
    direct_economic_loss_cny: float | None = Field(default=None, ge=0)

    overview: str
    investigation_report_fulltext: str = Field(description="国务院批复调查报告全文（HTML提取或PDF提取）")
    accountability: str = Field(description="责任追究结果")

    attachments: list[Attachment] = Field(default_factory=list)

    cleaned_at: str | None = None

