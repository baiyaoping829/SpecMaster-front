from __future__ import annotations

import hashlib
from pathlib import Path

from pdfminer.high_level import extract_text


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def extract_pdf_text(path: Path) -> str:
    return extract_text(str(path)) or ""

