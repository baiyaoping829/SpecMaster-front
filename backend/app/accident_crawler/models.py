from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..core.models import Base


class AccidentCrawlTask(Base):
    __tablename__ = "accident_crawl_tasks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    keyword: Mapped[str] = mapped_column(String(256), nullable=False)
    target_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    batch_id: Mapped[str] = mapped_column(String(64), nullable=False, default="", index=True)
    batch_seq: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    engine: Mapped[str] = mapped_column(String(32), nullable=False, default="httpx_bs4")
    engine_params: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    concurrency: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    strategy_used: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    strategy_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False, default="", index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    stage: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    progress_current: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    progress_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    trace_id: Mapped[str] = mapped_column(String(64), nullable=False, default="", index=True)

    max_items: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    max_depth: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    success_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fail_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(String(512), nullable=True, default=None)
    log_path: Mapped[str | None] = mapped_column(String(512), nullable=True, default=None)

    started_at: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)
    finished_at: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)
    created_at: Mapped[str] = mapped_column(String(32), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(32), nullable=False)
    deleted_at: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)


class AccidentCrawledReport(Base):
    __tablename__ = "accident_crawled_reports"
    __table_args__ = (UniqueConstraint("fingerprint", name="uq_accident_crawled_reports_fingerprint"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    task_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("accident_crawl_tasks.id", ondelete="SET NULL"), nullable=True, index=True)

    fingerprint: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    report_no: Mapped[str] = mapped_column(String(128), nullable=False, default="", index=True)
    occurred_at: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    location: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    accident_type: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    casualties: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    cause_overview: Mapped[str] = mapped_column(Text, nullable=False, default="")
    responsible_party: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    overview: Mapped[str] = mapped_column(Text, nullable=False, default="")

    report_url: Mapped[str] = mapped_column(String(2048), nullable=False, default="")
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False, default="")
    published_at: Mapped[str] = mapped_column(String(32), nullable=False, default="")

    raw_path: Mapped[str | None] = mapped_column(String(512), nullable=True, default=None)
    raw_mime: Mapped[str | None] = mapped_column(String(128), nullable=True, default=None)
    parsed_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

    created_at: Mapped[str] = mapped_column(String(32), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(32), nullable=False)
    deleted_at: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)
