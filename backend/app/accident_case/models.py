from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..core.models import Base


class AccidentCase(Base):
    __tablename__ = "accident_cases"
    __table_args__ = (UniqueConstraint("unit_name", "occurred_year", "case_no", name="uq_accident_case_no_unit_year"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    case_no: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_keys: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    unit_name: Mapped[str | None] = mapped_column(String(256), nullable=True, index=True)
    occurred_year: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[str] = mapped_column(String(32), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(32), nullable=False)
    deleted_at: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)


class AccidentSpecRef(Base):
    __tablename__ = "accident_spec_refs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    accident_id: Mapped[str] = mapped_column(String(64), ForeignKey("accident_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    spec_id: Mapped[str] = mapped_column(String(64), ForeignKey("specs.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[str] = mapped_column(String(32), nullable=False)
    deleted_at: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)

