import hashlib
import os
import shutil
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.exceptions import ApiError
from .attachment_models import Attachment, ReportAttachment


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _attachments_root() -> Path:
    p = Path(settings.attachments_dir)
    if p.is_absolute() and (p.exists() or str(p).startswith("/data")):
        if os.name == "nt" and str(p).startswith("/data"):
            return Path(__file__).resolve().parents[3] / "storage" / "attachments"
        return p
    return Path(__file__).resolve().parents[3] / "storage" / "attachments"


def _ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def _low_disk(path: Path) -> bool:
    try:
        total, used, free = shutil.disk_usage(str(path))
        if total <= 0:
            return False
        free_pct = (free / total) * 100.0
        return free_pct < float(settings.attachment_low_disk_pct)
    except Exception:
        return False


class AttachmentService:
    def __init__(self, *, session: AsyncSession):
        self.session = session

    async def save_bytes(self, *, batch_id: str, original_url: str, data: bytes) -> Attachment:
        root = _attachments_root()
        _ensure_dir(root)
        if _low_disk(root):
            raise ApiError(507, "low disk space")

        sha = hashlib.sha256(data or b"").hexdigest()
        stmt = select(Attachment).where(Attachment.sha256 == sha)
        existing = (await self.session.execute(stmt)).scalar_one_or_none()
        if existing and Path(existing.local_path).exists():
            return existing

        day = _now()[:10].replace("-", "")
        dirp = root / day / (batch_id or "no_batch")
        _ensure_dir(dirp)
        name = sha[:16]
        out = dirp / name
        out.write_bytes(data or b"")
        size = out.stat().st_size if out.exists() else 0

        row = Attachment(
            id=uuid4().hex,
            batch_id=batch_id or "",
            original_url=str(original_url),
            local_path=str(out),
            sha256=sha,
            file_size=int(size),
            corrupted=False,
            created_at=_now(),
        )
        self.session.add(row)
        try:
            await self.session.flush()
        except IntegrityError:
            await self.session.rollback()
            existing2 = (await self.session.execute(select(Attachment).where(Attachment.sha256 == sha))).scalar_one()
            return existing2
        return row

    async def link_to_report(self, *, report_id: str, attachment_id: str) -> None:
        row = ReportAttachment(id=uuid4().hex, report_id=report_id, attachment_id=attachment_id, created_at=_now())
        self.session.add(row)
        try:
            await self.session.flush()
        except IntegrityError:
            await self.session.rollback()

    async def audit_consistency(self) -> dict:
        stmt = select(Attachment)
        rows = (await self.session.execute(stmt)).scalars().all()
        checked = 0
        corrupted = 0
        for r in rows:
            checked += 1
            exists = Path(r.local_path).exists()
            if not exists and not bool(r.corrupted):
                await self.session.execute(update(Attachment).where(Attachment.id == r.id).values(corrupted=True))
                corrupted += 1
        await self.session.commit()
        return {"checked": checked, "new_corrupted": corrupted}
