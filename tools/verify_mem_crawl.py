import re
import time
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from pdfminer.high_level import extract_text


LIST_URL = "https://www.mem.gov.cn/gk/sgcc/tbzdsgdcbg/"
DETAIL_URL = "https://www.mem.gov.cn/gk/zfxxgkpt/fdzdgknr/202308/t20230829_460802.shtml"
CLICKED_PDF = "https://www.mem.gov.cn/gk/zfxxgkpt/fdzdgknr/202308/P020230829535806813294.pdf"


def fetch(client: httpx.Client, url: str) -> tuple[httpx.Response, float]:
    t0 = time.perf_counter()
    r = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
    ms = (time.perf_counter() - t0) * 1000.0
    return r, ms


def extract_pdf_text(data: bytes) -> str:
    tmp = NamedTemporaryFile(suffix=".pdf", delete=False)
    try:
        tmp.write(data or b"")
        tmp.flush()
        tmp.close()
        try:
            return extract_text(tmp.name) or ""
        except Exception:
            return ""
    finally:
        try:
            Path(tmp.name).unlink(missing_ok=True)
        except Exception:
            pass


def parse_list_page(html: str, base: str) -> list[dict]:
    soup = BeautifulSoup(html or "", "lxml")
    items: list[dict] = []
    for a in soup.find_all("a"):
        href = a.get("href") or ""
        text = " ".join(a.get_text(" ", strip=True).split())
        if not href or not text:
            continue
        m = re.search(r"(\d{4}-\d{2}-\d{2})$", text)
        if not m:
            continue
        published = m.group(1)
        title = text[:-10].strip()
        absu = urljoin(base, href)
        if title:
            items.append({"title": title, "published_at": published, "detail_url": absu})
    uniq: dict[str, dict] = {}
    for it in items:
        uniq[it["detail_url"]] = it
    return list(uniq.values())


def discover_page_urls(html: str, base: str) -> list[str]:
    soup = BeautifulSoup(html or "", "lxml")
    urls = {base}
    for a in soup.find_all("a"):
        t = a.get_text(" ", strip=True)
        href = a.get("href") or ""
        if not href:
            continue
        if t.isdigit() or t in ("下一页", "上一页"):
            u = urljoin(base, href)
            if "tbzdsgdcbg" in u:
                urls.add(u)
    return sorted(urls)


def find_pdf_link(detail_html: str, base: str) -> str:
    soup = BeautifulSoup(detail_html or "", "lxml")
    cands: list[tuple[str, str]] = []
    for a in soup.find_all("a"):
        href = a.get("href") or ""
        if href.lower().endswith(".pdf") or ".pdf?" in href.lower():
            cands.append((a.get_text(" ", strip=True) or "", urljoin(base, href)))
    for t, u in cands:
        if "下载" in t:
            return u
    return cands[0][1] if cands else ""


def extract_meta(text: str) -> dict:
    s = (text or "").replace("\u3000", " ")
    s = re.sub(r"\s+", " ", s)

    def norm_date(x: str) -> str:
        m = re.search(r"(\d{4})\s*[年\-/\.]\s*(\d{1,2})\s*[月\-/\.]\s*(\d{1,2})", x)
        if m:
            return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
        m = re.search(r"(\d{4})-(\d{2})-(\d{2})", x)
        return m.group(0) if m else ""

    report_no = ""
    m = re.search(r"(?:报告编号|编号)[:：]?\s*([A-Za-z0-9\u4e00-\u9fff\-\(\)（）〔〕【】]+?号)", s)
    if m:
        report_no = m.group(1)
    if not report_no:
        m = re.search(r"(\d+·\d+)", s)
        if m:
            report_no = m.group(1)

    occurred_at = norm_date(s)
    location = ""
    m = re.search(r"(?:事故发生地点|发生地点|地点)[:：]?\s*([^。；]{2,60})", s)
    if m:
        location = m.group(1).strip()
    if not location:
        m = re.search(r"(内蒙古[^。；]{0,30}阿拉善[^。；]{0,30})", s)
        if m:
            location = m.group(1).strip()

    casualties = ""
    m = re.search(r"造成[^。；]{0,40}?(\d{1,3})\s*人死亡", s)
    if m:
        casualties = f"{m.group(1)}人死亡"
    m2 = re.search(r"(\d{1,3})\s*人受伤", s)
    if m2:
        casualties = (casualties + " " if casualties else "") + f"{m2.group(1)}人受伤"

    return {"report_no": report_no[:128], "occurred_at": occurred_at, "location": location[:256], "casualties": casualties[:128]}


def main() -> None:
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        pages: list[str] = [LIST_URL]
        for i in range(1, 20):
            u = urljoin(LIST_URL, f"index_{i}.shtml")
            r, _ = fetch(client, u)
            if r.status_code != 200:
                break
            pages.append(u)

        page_times: list[float] = []
        all_items: list[dict] = []
        ok_pages = 0
        for u in pages:
            try:
                r, ms = fetch(client, u)
                r.raise_for_status()
                ok_pages += 1
                page_times.append(ms)
                all_items += parse_list_page(r.text, u)
            except Exception:
                page_times.append(30000.0)

        unique = {it["detail_url"]: it for it in all_items}
        all_items = list(unique.values())

        avg_ms = sum(page_times) / len(page_times) if page_times else 0.0
        success_rate = (ok_pages / len(pages) * 100.0) if pages else 0.0
        miss_date = sum(1 for it in all_items if not it.get("published_at"))
        miss_rate = (miss_date / len(all_items) * 100.0) if all_items else 0.0
        print("LIST_PAGES", {"discovered": len(pages), "ok": ok_pages, "success_rate_pct": success_rate, "avg_ms": avg_ms, "max_ms": max(page_times) if page_times else 0.0})
        print("LIST_ITEMS", {"count": len(all_items), "missing_date": miss_date, "missing_rate_pct": miss_rate, "sample": all_items[:3]})
        print("CLICKED_IN_LIST", any(it["detail_url"] == DETAIL_URL for it in all_items))

        rd, msd = fetch(client, DETAIL_URL)
        rd.raise_for_status()
        pdf_found = find_pdf_link(rd.text, DETAIL_URL)
        print("DETAIL", {"status": rd.status_code, "ms": msd, "pdf_found": pdf_found})

        pdf_url = pdf_found or CLICKED_PDF
        rp, msp = fetch(client, pdf_url)
        rp.raise_for_status()
        data = rp.content
        print("PDF", {"url": pdf_url, "status": rp.status_code, "bytes": len(data), "ms": msp, "content_type": rp.headers.get("content-type", "")})

        t0 = time.perf_counter()
        text = extract_pdf_text(data)
        parse_ms = (time.perf_counter() - t0) * 1000.0
        meta = extract_meta(text)
        print("PDF_PARSE", {"ms": parse_ms, "text_len": len(text), "meta": meta})


if __name__ == "__main__":
    main()

