from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from ..html import abs_url, clean_text, extract_visible_text, find_pdf_links, soup
from ..http import Http
from ..models import AccidentCaseRecord, Attachment
from ..pdf import extract_pdf_text, save_bytes, sha256_bytes
from ..validators import normalize_date


LIST_URL = "https://www.mem.gov.cn/gk/sgcc/tbzdsgdcbg/index_{page}.shtml"


@dataclass(frozen=True)
class ListItem:
    title: str
    url: str
    published_at: str | None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_list(html: str, base_url: str) -> list[ListItem]:
    doc = soup(html)
    items: list[ListItem] = []
    for a in doc.select("a[href]"):
        text = clean_text(a.get_text(" ", strip=True))
        href = a.get("href") or ""
        if not href:
            continue
        m = re.search(r"(\d{4}-\d{2}-\d{2})$", text)
        published_at = m.group(1) if m else None
        title = text[: m.start()].strip() if m else text
        if not title or len(title) < 6:
            continue
        if "调查报告" not in title and "通报" not in title and "公布" not in title:
            continue
        items.append(ListItem(title=title, url=abs_url(base_url, href), published_at=published_at))
    uniq: dict[str, ListItem] = {}
    for it in items:
        uniq[it.url] = it
    return list(uniq.values())


def _extract_numeric(text: str) -> tuple[int, int, float | None]:
    deaths = 0
    injuries = 0
    loss = None

    m = re.search(r"造成\s*(\d+)\s*人死亡", text)
    if m:
        deaths = int(m.group(1))
    m = re.search(r"\s*(\d+)\s*人受伤", text)
    if m:
        injuries = int(m.group(1))

    m = re.search(r"直接经济损失\s*([0-9\.]+)\s*(亿元|万元|元)", text)
    if m:
        val = float(m.group(1))
        unit = m.group(2)
        if unit == "亿元":
            loss = val * 1e8
        elif unit == "万元":
            loss = val * 1e4
        else:
            loss = val
    return deaths, injuries, loss


def _guess_level(title: str, text: str) -> str:
    for key in ("特别重大", "重大", "较大", "一般"):
        if key in title or key in text:
            return key
    return "重大"


def _guess_location(text: str) -> str:
    m = re.search(r"(\\S{2,10}(省|市|自治区|特别行政区)\\S{0,10}(市|县|区|旗))", text)
    if m:
        return m.group(1)
    return "未知"


def _guess_industry(title: str, text: str) -> str:
    for k in ("煤矿", "化工", "道路交通", "消防", "建筑施工", "矿山", "危化", "燃气", "船舶", "电力"):
        if k in title or k in text:
            return k
    return "综合"


def _guess_occurred_at(text: str) -> str:
    m = re.search(r"(\d{4})\s*[年\.-]\s*(\d{1,2})\s*[月\.-]\s*(\d{1,2})\s*[日]?", text)
    if not m:
        return "1970-01-01"
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return f"{y:04d}-{mo:02d}-{d:02d}"


def _extract_accountability(text: str) -> str:
    markers = ["责任追究", "责任认定", "处理建议", "处理意见", "对有关责任人员", "追究刑事责任"]
    for mk in markers:
        idx = text.find(mk)
        if idx >= 0:
            return text[idx : idx + 1200].strip()
    return ""


def crawl_top_cases(
    *,
    http: Http,
    year_from: int,
    year_to: int,
    limit: int,
    download_dir: str,
) -> list[AccidentCaseRecord]:
    results: list[AccidentCaseRecord] = []
    miss = 0
    for page in range(1, 21):
        try:
            html = http.get_text(LIST_URL.format(page=page))
            miss = 0
        except Exception:
            miss += 1
            if miss >= 3:
                break
            continue
        items = parse_list(html, LIST_URL.format(page=page))
        for it in items:
            if not it.published_at:
                continue
            y = int(it.published_at.split("-")[0])
            if y < year_from or y > year_to:
                continue
            if "特别重大" not in it.title and "重大" not in it.title:
                continue
            rec = fetch_detail(http=http, title=it.title, url=it.url, published_at=it.published_at, download_dir=download_dir)
            results.append(rec)
            if len(results) >= limit:
                return results
    return results


def fetch_detail(*, http: Http, title: str, url: str, published_at: str, download_dir: str) -> AccidentCaseRecord:
    if url.lower().endswith(".pdf"):
        pdf_links = [url]
        text = ""
    else:
        html = http.get_text(url)
        doc = soup(html)
        text = extract_visible_text(doc)
        pdf_links = find_pdf_links(doc, url)
    attachments: list[Attachment] = []
    report_text = text

    if pdf_links:
        pdf_url = pdf_links[0]
        pdf_bytes = http.get_bytes(pdf_url)
        sha = sha256_bytes(pdf_bytes)
        local_path = f"{download_dir}/{sha}.pdf"
        save_bytes(Path(local_path), pdf_bytes)
        try:
            report_text = extract_pdf_text(Path(local_path)).strip() or report_text
        except Exception:
            report_text = report_text
        attachments.append(Attachment(kind="report_pdf", url=pdf_url, local_path=local_path, sha256=sha, mime_type="application/pdf"))

    deaths, injuries, loss = _extract_numeric(report_text)

    occurred_at = _guess_occurred_at(report_text)
    try:
        occurred_at = normalize_date(occurred_at)
    except Exception:
        occurred_at = published_at
    if occurred_at.startswith("1970-"):
        occurred_at = published_at

    return AccidentCaseRecord(
        source="mem.gov.cn",
        source_url=url,
        source_urls=[url],
        name=title,
        occurred_at=occurred_at,
        location=_guess_location(report_text),
        industry=_guess_industry(title, report_text),
        level=_guess_level(title, report_text),
        deaths=deaths,
        injuries=injuries,
        direct_economic_loss_cny=loss,
        overview=(report_text[:800].strip() if report_text else ""),
        investigation_report_fulltext=report_text,
        accountability=_extract_accountability(report_text) or "未提取到责任追究段落",
        attachments=attachments,
        cleaned_at=_now(),
    )
