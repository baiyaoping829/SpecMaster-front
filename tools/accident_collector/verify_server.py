from __future__ import annotations

import argparse
import json
from pathlib import Path

import httpx


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--in-dir", default="tools/accident_collector/output/frontend")
    p.add_argument("--api-base", default="http://127.0.0.1:8001")
    p.add_argument("--limit", type=int, default=10)
    args = p.parse_args()

    in_dir = Path(args.in_dir)
    files = sorted(in_dir.glob("*.json"))[: args.limit]
    if not files:
        raise SystemExit("no cases found, run tools/accident_collector/cli.py crawl first")

    base = args.api_base.rstrip("/")
    report = {"total": len(files), "passed": 0, "failed": [], "details": []}

    with httpx.Client(timeout=90.0) as client:
        for f in files:
            payload = json.loads(f.read_text(encoding="utf-8"))
            title = payload["title"]
            content = json.dumps(payload["content"], ensure_ascii=False)
            attachments = payload.get("attachments") or []
            pdf = next((a for a in attachments if a.get("kind") == "report_pdf" and a.get("local_path")), None)

            r = client.post(f"{base}/api/v1/accidents/", json={"title": title, "content": content, "attachment_keys": []})
            if r.status_code not in (200, 201):
                report["failed"].append({"file": f.name, "step": "create", "status": r.status_code})
                continue
            case = r.json().get("data") or {}
            case_id = case.get("id")

            if pdf and Path(pdf["local_path"]).exists():
                path = Path(pdf["local_path"])
                ru = client.post(
                    f"{base}/api/v1/accidents/{case_id}/attachments",
                    files={"files": (path.name, path.read_bytes(), "application/pdf")},
                )
                if ru.status_code not in (200, 201):
                    report["failed"].append({"file": f.name, "step": "upload", "status": ru.status_code})
                    continue

            detail = client.get(f"{base}/api/v1/accidents/{case_id}")
            if detail.status_code != 200:
                report["failed"].append({"file": f.name, "step": "detail", "status": detail.status_code})
                continue
            vo = detail.json().get("data") or {}
            if vo.get("title") != title:
                report["failed"].append({"file": f.name, "step": "compare-title", "msg": "mismatch"})
                continue

            content_obj = {}
            try:
                content_obj = json.loads(vo.get("content") or "{}")
            except Exception:
                content_obj = {}

            if pdf:
                keys = vo.get("attachment_keys") or []
                if not keys:
                    report["failed"].append({"file": f.name, "step": "compare-keys", "msg": "empty"})
                    continue
                if not content_obj.get("report_text") or not content_obj.get("report_keywords"):
                    report["failed"].append({"file": f.name, "step": "pdf-index", "msg": "missing extracted text/keywords"})
                    continue

            report["passed"] += 1
            report["details"].append({"file": f.name, "case_id": case_id, "attachments": len(vo.get("attachment_keys") or [])})

    out = Path("tools/accident_collector/output/server-verify-report.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(str(out))
    return 0 if report["passed"] == report["total"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

