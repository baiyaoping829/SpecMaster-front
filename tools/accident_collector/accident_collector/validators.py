from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime

from dateutil import parser as dtparser

from .models import AccidentCaseRecord


@dataclass(frozen=True)
class ValidationIssue:
    level: str
    field: str
    message: str


def normalize_date(s: str) -> str:
    dt = dtparser.parse(s)
    return dt.date().isoformat()


def validate_case(case: AccidentCaseRecord) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    required_str = {
        "name": case.name,
        "occurred_at": case.occurred_at,
        "location": case.location,
        "industry": case.industry,
        "level": case.level,
        "overview": case.overview,
        "investigation_report_fulltext": case.investigation_report_fulltext,
        "accountability": case.accountability,
    }
    for k, v in required_str.items():
        if not v or not str(v).strip():
            issues.append(ValidationIssue("error", k, "required"))

    try:
        _ = normalize_date(case.occurred_at)
    except Exception:
        issues.append(ValidationIssue("error", "occurred_at", "invalid date"))

    if case.deaths < 0:
        issues.append(ValidationIssue("error", "deaths", "must be >=0"))
    if case.injuries < 0:
        issues.append(ValidationIssue("error", "injuries", "must be >=0"))

    if case.direct_economic_loss_cny is not None and case.direct_economic_loss_cny < 0:
        issues.append(ValidationIssue("error", "direct_economic_loss_cny", "must be >=0"))

    if case.deaths == 0 and case.level in ("重大", "特别重大"):
        issues.append(ValidationIssue("warn", "level", "major/extra-major with zero deaths"))

    if len(case.name) > 256:
        issues.append(ValidationIssue("error", "name", "too long (>256)"))

    if not case.investigation_report_fulltext or len(case.investigation_report_fulltext) < 200:
        issues.append(ValidationIssue("warn", "investigation_report_fulltext", "too short"))

    return issues

