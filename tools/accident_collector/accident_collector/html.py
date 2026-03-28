from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup


def soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def abs_url(base: str, href: str) -> str:
    return urljoin(base, href)


def clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", s or "").strip()
    return s


def extract_visible_text(doc: BeautifulSoup) -> str:
    for tag in doc(["script", "style", "noscript"]):
        tag.extract()
    txt = doc.get_text("\n")
    lines = [clean_text(x) for x in txt.splitlines()]
    lines = [x for x in lines if x]
    return "\n".join(lines)


def find_pdf_links(doc: BeautifulSoup, base_url: str) -> list[str]:
    links: list[str] = []
    for a in doc.select("a[href]"):
        href = a.get("href") or ""
        if ".pdf" in href.lower():
            links.append(abs_url(base_url, href))
    return list(dict.fromkeys(links))

