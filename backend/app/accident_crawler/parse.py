import re
from dataclasses import dataclass


@dataclass(frozen=True)
class ExtractedFields:
    title: str
    occurred_at: str
    location: str
    accident_type: str
    casualties: str
    cause_overview: str
    responsible_party: str
    overview: str
    published_at: str


_TYPE_HINTS: list[tuple[str, str]] = [
    ("坍塌", "坍塌事故"),
    ("火灾", "火灾事故"),
    ("爆炸", "爆炸事故"),
    ("中毒", "中毒和窒息事故"),
    ("触电", "触电事故"),
    ("高处坠落", "高处坠落"),
    ("交通", "交通事故"),
    ("煤矿", "煤矿事故"),
    ("瓦斯", "煤矿事故"),
    ("化学", "危化事故"),
]


def _first_match(patterns: list[str], text: str) -> str:
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(1) if m.groups() else m.group(0)
    return ""


def _normalize_date(s: str) -> str:
    if not s:
        return ""
    s = s.strip()
    m = re.search(r"(\d{4})\s*[年\-/\.]\s*(\d{1,2})\s*[月\-/\.]\s*(\d{1,2})", s)
    if m:
        y, mo, d = m.group(1), int(m.group(2)), int(m.group(3))
        return f"{y}-{mo:02d}-{d:02d}"
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return ""


def extract_fields(*, title: str, text: str) -> ExtractedFields:
    raw = (text or "").replace("\u3000", " ")
    compact = re.sub(r"\s+", " ", raw)

    occurred_at = _normalize_date(
        _first_match(
            [
                r"发生时间[:：]?\s*([0-9]{4}[^。；\n]{0,20})",
                r"事故发生(?:于|在)\s*([0-9]{4}[^。；\n]{0,20})",
                r"([0-9]{4}\s*[年\-/\.]\s*[0-9]{1,2}\s*[月\-/\.]\s*[0-9]{1,2})",
            ],
            compact,
        )
    )

    published_at = _normalize_date(
        _first_match([r"发布日期[:：]?\s*([0-9]{4}[^。；\n]{0,20})", r"发布(?:于|日期)[:：]?\s*([0-9]{4}[^。；\n]{0,20})"], compact)
    )

    location = _first_match(
        [
            r"事故发生地点[:：]?\s*([^。；\n]{2,60})",
            r"发生地点[:：]?\s*([^。；\n]{2,60})",
            r"地点[:：]?\s*([^。；\n]{2,60})",
            r"发生(?:在|于)\s*([^。；\n]{2,60})",
        ],
        compact,
    )
    location = location.strip()

    casualties = _first_match(
        [
            r"造成([^。；\n]{2,40}?(?:死亡|受伤)[^。；\n]{0,20})",
            r"([0-9]{1,3}\s*人死亡[^。；\n]{0,20})",
            r"([0-9]{1,3}\s*死[^。；\n]{0,20})",
        ],
        compact,
    )
    casualties = casualties.strip()

    accident_type = ""
    for k, v in _TYPE_HINTS:
        if k in (title or "") or k in compact:
            accident_type = v
            break

    cause_overview = _first_match(
        [
            r"(直接原因[^。；\n]{0,300})",
            r"(事故原因[^。；\n]{0,300})",
            r"(原因分析[^。；\n]{0,300})",
        ],
        compact,
    ).strip()

    responsible_party = _first_match([r"责任(?:单位|方)[:：]?\s*([^。；\n]{2,60})", r"有关责任人[:：]?\s*([^。；\n]{2,60})"], compact).strip()

    overview = _first_match([r"(事故概况[^。；\n]{0,600})", r"(事故经过[^。；\n]{0,600})"], compact).strip()
    if not overview:
        overview = compact[:600].strip()

    return ExtractedFields(
        title=str(title or "").strip()[:256],
        occurred_at=occurred_at,
        location=location[:256],
        accident_type=accident_type,
        casualties=casualties[:128],
        cause_overview=cause_overview[:800],
        responsible_party=responsible_party[:256],
        overview=overview[:2000],
        published_at=published_at,
    )
