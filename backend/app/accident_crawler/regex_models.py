from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..core.models import Base


class RegexBatch(Base):
    __tablename__ = "regex_batches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    seed_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    regex: Mapped[str] = mapped_column(String(512), nullable=False)
    max_urls: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    created_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="created")
    created_at: Mapped[str] = mapped_column(String(32), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(32), nullable=False)
    deleted_at: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)

