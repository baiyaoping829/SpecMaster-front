from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..core.models import Base


class FavoriteSite(Base):
    __tablename__ = "favorite_sites"
    __table_args__ = (UniqueConstraint("user_id", "site_url", name="uq_favorite_sites_user_url"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    site_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    site_name: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    tags: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    created_at: Mapped[str] = mapped_column(String(32), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(32), nullable=False)
    deleted_at: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)

