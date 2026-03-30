from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..core.models import Base


class Attachment(Base):
    __tablename__ = "attachments"
    __table_args__ = (UniqueConstraint("sha256", name="uq_attachments_sha256"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    batch_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    original_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    local_path: Mapped[str] = mapped_column(String(512), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    corrupted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[str] = mapped_column(String(32), nullable=False)


class ReportAttachment(Base):
    __tablename__ = "report_attachments"
    __table_args__ = (UniqueConstraint("report_id", "attachment_id", name="uq_report_attachment"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_id: Mapped[str] = mapped_column(String(64), ForeignKey("accident_crawled_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    attachment_id: Mapped[str] = mapped_column(String(64), ForeignKey("attachments.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[str] = mapped_column(String(32), nullable=False)

