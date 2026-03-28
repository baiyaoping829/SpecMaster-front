from pydantic import BaseModel, Field


class AccidentCaseVO(BaseModel):
    id: str
    case_no: str | None = None
    title: str
    content: str
    attachment_keys: list[str] = Field(default_factory=list)
    unit_name: str | None = None
    occurred_year: int | None = None
    version: int
    created_at: str
    updated_at: str


class AccidentCaseCreate(BaseModel):
    case_no: str = Field(min_length=1, max_length=50, pattern=r"^[A-Za-z0-9\-/]{1,50}$")
    title: str = Field(min_length=1, max_length=256)
    content: str = Field(min_length=1)
    attachment_keys: list[str] = Field(default_factory=list)


class AccidentCaseUpdate(BaseModel):
    version: int
    case_no: str | None = Field(default=None, min_length=1, max_length=50, pattern=r"^[A-Za-z0-9\-/]{1,50}$")
    title: str | None = Field(default=None, min_length=1, max_length=256)
    content: str | None = Field(default=None, min_length=1)
    attachment_keys: list[str] | None = None


class ExternalImportItem(BaseModel):
    case_no: str = Field(min_length=1, max_length=50, pattern=r"^[A-Za-z0-9\-/]{1,50}$")
    title: str = Field(min_length=1, max_length=256)
    occurred_at: str
    location: str = ""
    industry: str = ""
    level: str = ""
    deaths: int = 0
    injuries: int = 0
    direct_economic_loss_cny: float | None = None
    overview: str = ""
    direct_cause: str = ""
    indirect_cause: str = ""
    rectification: str = ""
    source_url: str = ""
    published_at: str = ""
    report_pdf_local_path: str | None = None
    accountability: str = ""


class ExternalImportReq(BaseModel):
    unit_name: str = "外部导入"
    items: list[ExternalImportItem]


class AccidentCaseList(BaseModel):
    items: list[AccidentCaseVO]
    total: int
    page: int
    size: int


class LinkSpecReq(BaseModel):
    spec_id: str

