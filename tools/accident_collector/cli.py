from __future__ import annotations

import argparse
import json
from pathlib import Path

import httpx

from accident_collector.http import Http
from accident_collector.models import AccidentCaseRecord
from accident_collector.sources.mem_reports import crawl_top_cases
from accident_collector.validators import validate_case


def _write_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def _to_frontend_payload(rec: AccidentCaseRecord) -> dict:
    content = {
        "summary": rec.overview,
        "type": rec.industry,
        "date": rec.occurred_at,
        "level": rec.level,
        "province": rec.location,
        "casualties": f"死亡{rec.deaths}人，受伤{rec.injuries}人",
        "loss": rec.direct_economic_loss_cny or 0,
        "progress": "国务院督办事故调查报告已发布",
        "lessons": "",
        "punishment": rec.accountability,
    }
    return {
        "title": rec.name,
        "content": content,
        "attachments": [a.model_dump(mode="json") for a in rec.attachments],
        "source": {"source": rec.source, "source_url": str(rec.source_url), "source_urls": [str(u) for u in rec.source_urls]},
    }


def cmd_crawl(args: argparse.Namespace) -> int:
    http = Http(timeout_seconds=30.0)
    try:
        recs = crawl_top_cases(
            http=http,
            year_from=args.year_from,
            year_to=args.year_to,
            limit=args.limit,
            download_dir=str(Path(args.out_dir) / "downloads"),
        )
    finally:
        http.close()

    raw_dir = Path(args.out_dir) / "raw"
    fe_dir = Path(args.out_dir) / "frontend"

    issues_total = 0
    for i, rec in enumerate(recs):
        _write_json(raw_dir / f"{i+1:02d}.json", rec.model_dump(mode="json"))
        _write_json(fe_dir / f"{i+1:02d}.json", _to_frontend_payload(rec))
        issues = validate_case(rec)
        issues_total += sum(1 for x in issues if x.level == "error")
        if issues:
            _write_json(Path(args.out_dir) / "validation" / f"{i+1:02d}.issues.json", [x.__dict__ for x in issues])

    print(f"collected={len(recs)} errors={issues_total} out={args.out_dir}")
    return 0 if issues_total == 0 else 2


def cmd_upload(args: argparse.Namespace) -> int:
    out_dir = Path(args.in_dir)
    files = sorted((out_dir / "frontend").glob("*.json"))
    if not files:
        raise SystemExit("no frontend json found, run crawl first")

    base = args.api_base.rstrip("/")
    ok = 0
    with httpx.Client(timeout=60.0) as client:
        for f in files[: args.limit]:
            payload = json.loads(f.read_text(encoding="utf-8"))
            title = payload["title"]
            content = json.dumps(payload["content"], ensure_ascii=False)
            r = client.post(f"{base}/api/v1/accidents/", json={"title": title, "content": content, "attachment_keys": []})
            if r.status_code not in (200, 201):
                print("create failed", f.name, r.status_code)
                continue
            case_id = r.json().get("data", {}).get("id")
            atts = payload.get("attachments") or []
            local_pdfs = [a.get("local_path") for a in atts if a.get("kind") == "report_pdf" and a.get("local_path")]
            upload_files = []
            for p in local_pdfs:
                path = Path(p)
                if path.exists():
                    upload_files.append(("files", (path.name, path.read_bytes(), "application/pdf")))
            if upload_files:
                ru = client.post(f"{base}/api/v1/accidents/{case_id}/attachments", files=upload_files)
                if ru.status_code not in (200, 201):
                    print("upload failed", f.name, ru.status_code)
                    continue
            ok += 1

    print(f"uploaded={ok}")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(prog="accident-collector")
    sub = p.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("crawl", help="crawl cases from official sites and export json")
    c.add_argument("--year-from", type=int, default=2018)
    c.add_argument("--year-to", type=int, default=2023)
    c.add_argument("--limit", type=int, default=10)
    c.add_argument("--out-dir", type=str, default="tools/accident_collector/output")
    c.set_defaults(func=cmd_crawl)

    u = sub.add_parser("upload", help="upload exported frontend json into local FastAPI")
    u.add_argument("--in-dir", type=str, default="tools/accident_collector/output")
    u.add_argument("--api-base", type=str, default="http://127.0.0.1:8001")
    u.add_argument("--limit", type=int, default=10)
    u.set_defaults(func=cmd_upload)

    args = p.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
