import json
import re
from dataclasses import dataclass
from hashlib import sha1
from pathlib import Path
from typing import Any


OUTPUT_DIR = Path(__file__).resolve().parents[3] / "tools/accident_collector/output"


@dataclass(frozen=True)
class ExternalCandidate:
    case_no: str
    title: str
    occurred_at: str
    location: str
    industry: str
    level: str
    deaths: int
    injuries: int
    direct_economic_loss_cny: float | None
    overview: str
    direct_cause: str
    indirect_cause: str
    rectification: str
    accountability: str
    source_url: str
    published_at: str
    report_pdf_local_path: str | None


def _safe_read_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _normalize_query(q: str) -> list[str]:
    tokens = [x.strip() for x in re.split(r"[\\s,，;；]+", (q or "").strip()) if x.strip()]
    return tokens[:10]


def _matches(text: str, tokens: list[str]) -> bool:
    if not tokens:
        return False
    t = text.lower()
    return all(tok.lower() in t for tok in tokens)


def _extract_between(text: str, start_markers: list[str], end_markers: list[str], limit: int = 800) -> str:
    idx = -1
    for mk in start_markers:
        idx = text.find(mk)
        if idx >= 0:
            break
    if idx < 0:
        return ""
    end = len(text)
    for mk in end_markers:
        j = text.find(mk, idx + 2)
        if j >= 0:
            end = min(end, j)
    frag = text[idx:end].strip()
    return frag[:limit]


def _derive_case_no(source_url: str, occurred_at: str) -> str:
    year = (occurred_at or "0000")[:4]
    h = sha1(source_url.encode("utf-8")).hexdigest()[:12]
    return f"{year}-{h}"


def search_external_cases(*, query: str, limit: int = 5) -> list[ExternalCandidate]:
    tokens = _normalize_query(query)
    raw_dir = OUTPUT_DIR / "raw"
    if not raw_dir.exists():
        return []
    items = sorted(raw_dir.glob("*.json"))
    results: list[ExternalCandidate] = []
    for p in items:
        obj = _safe_read_json(p)
        if not obj:
            continue
        text = "\n".join(
            [
                str(obj.get("name") or ""),
                str(obj.get("location") or ""),
                str(obj.get("industry") or ""),
                str(obj.get("level") or ""),
                str(obj.get("overview") or ""),
                str(obj.get("investigation_report_fulltext") or ""),
                str(obj.get("accountability") or ""),
            ]
        )
        if not _matches(text, tokens):
            continue

        report_text = str(obj.get("investigation_report_fulltext") or "")
        direct = _extract_between(report_text, ["直接原因"], ["间接原因", "事故原因", "责任追究", "处理建议"])
        indirect = _extract_between(report_text, ["间接原因"], ["事故原因", "责任追究", "处理建议", "防范措施", "整改措施"])
        rect = _extract_between(report_text, ["整改措施", "防范措施"], ["责任追究", "处理建议", "附"])

        atts = obj.get("attachments") or []
        pdf_local = None
        for a in atts:
            if isinstance(a, dict) and a.get("kind") == "report_pdf" and a.get("local_path"):
                pdf_local = str(a.get("local_path"))
                break

        source_url = str(obj.get("source_url") or "")
        occurred_at = str(obj.get("occurred_at") or "")
        results.append(
            ExternalCandidate(
                case_no=_derive_case_no(source_url, occurred_at),
                title=str(obj.get("name") or ""),
                occurred_at=occurred_at,
                location=str(obj.get("location") or ""),
                industry=str(obj.get("industry") or ""),
                level=str(obj.get("level") or ""),
                deaths=int(obj.get("deaths") or 0),
                injuries=int(obj.get("injuries") or 0),
                direct_economic_loss_cny=obj.get("direct_economic_loss_cny"),
                overview=str(obj.get("overview") or ""),
                direct_cause=direct,
                indirect_cause=indirect,
                rectification=rect,
                accountability=str(obj.get("accountability") or ""),
                source_url=source_url,
                published_at=str(obj.get("cleaned_at") or "")[:10],
                report_pdf_local_path=pdf_local,
            )
        )
        if len(results) >= limit:
            break
    return results
