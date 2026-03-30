import csv
import json
import zipfile
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import AccidentCrawlTask, AccidentCrawledReport


def _ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def reports_dir(root: Path, task_id: str) -> Path:
    return root / "reports" / task_id


def list_reports(root: Path, task_id: str) -> list[str]:
    d = reports_dir(root, task_id)
    if not d.exists() or not d.is_dir():
        return []
    out = []
    for p in sorted(d.iterdir()):
        if p.is_file():
            out.append(p.name)
    return out


class ReportService:
    def __init__(self, *, session: AsyncSession, storage_root: Path):
        self.session = session
        self.storage_root = storage_root

    async def generate(self, *, task_id: str) -> list[str]:
        task = (await self.session.execute(select(AccidentCrawlTask).where(AccidentCrawlTask.id == task_id))).scalar_one_or_none()
        if not task:
            return []

        d = reports_dir(self.storage_root, task_id)
        _ensure_dir(d)

        total_reports = int(
            (await self.session.execute(select(func.count(AccidentCrawledReport.id)).where(AccidentCrawledReport.task_id == task_id))).scalar_one()
        )
        sample_rows = (
            await self.session.execute(
                select(AccidentCrawledReport)
                .where(AccidentCrawledReport.task_id == task_id)
                .order_by(AccidentCrawledReport.created_at.desc())
                .limit(200)
            )
        ).scalars().all()

        summary = {
            "task": {
                "id": task.id,
                "keyword": task.keyword,
                "target_url": task.target_url,
                "engine": task.engine,
                "concurrency": task.concurrency,
                "status": task.status,
                "stage": task.stage,
                "current": task.progress_current,
                "total": task.progress_total,
                "trace_id": task.trace_id,
                "started_at": task.started_at,
                "finished_at": task.finished_at,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
                "last_error": task.last_error,
            },
            "reports_total": total_reports,
            "reports_sample": [
                {
                    "id": r.id,
                    "title": r.title,
                    "report_no": r.report_no,
                    "occurred_at": r.occurred_at,
                    "location": r.location,
                    "accident_type": r.accident_type,
                    "casualties": r.casualties,
                    "report_url": r.report_url,
                    "source_url": r.source_url,
                    "published_at": r.published_at,
                    "created_at": r.created_at,
                }
                for r in sample_rows
            ],
        }

        json_path = d / "report.json"
        json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

        csv_path = d / "report.csv"
        with csv_path.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(
                f,
                fieldnames=[
                    "id",
                    "title",
                    "report_no",
                    "occurred_at",
                    "location",
                    "accident_type",
                    "casualties",
                    "report_url",
                    "source_url",
                    "published_at",
                    "created_at",
                ],
            )
            w.writeheader()
            page = 1
            size = 5000
            while True:
                batch = (
                    await self.session.execute(
                        select(AccidentCrawledReport)
                        .where(AccidentCrawledReport.task_id == task_id)
                        .order_by(AccidentCrawledReport.created_at.desc())
                        .offset((page - 1) * size)
                        .limit(size)
                    )
                ).scalars().all()
                if not batch:
                    break
                for r in batch:
                    w.writerow(
                        {
                            "id": r.id,
                            "title": r.title,
                            "report_no": r.report_no,
                            "occurred_at": r.occurred_at,
                            "location": r.location,
                            "accident_type": r.accident_type,
                            "casualties": r.casualties,
                            "report_url": r.report_url,
                            "source_url": r.source_url,
                            "published_at": r.published_at,
                            "created_at": r.created_at,
                        }
                    )
                page += 1

        html_path = d / "report.html"
        html = [
            "<!doctype html><html><head><meta charset='utf-8'/>",
            f"<title>Crawl Report {task_id}</title>",
            "<style>body{font-family:system-ui,Segoe UI,Arial; padding:16px;} table{border-collapse:collapse; width:100%;} td,th{border:1px solid #ddd; padding:6px;} th{background:#fafafa;}</style>",
            "</head><body>",
            f"<h2>爬取报告：{task_id}</h2>",
            "<h3>任务概览</h3>",
            "<pre>",
            json.dumps(summary["task"], ensure_ascii=False, indent=2),
            "</pre>",
            f"<h3>报告样本（最多 {len(sample_rows)} 条，total={total_reports}）</h3>",
            "<table><thead><tr><th>标题</th><th>报告编号</th><th>事故时间</th><th>地点</th><th>伤亡</th><th>报告链接</th></tr></thead><tbody>",
        ]
        for r in sample_rows:
            html.append(
                "<tr>"
                f"<td>{r.title}</td>"
                f"<td>{r.report_no}</td>"
                f"<td>{r.occurred_at}</td>"
                f"<td>{r.location}</td>"
                f"<td>{r.casualties}</td>"
                f"<td><a href='{r.report_url}' target='_blank'>report</a></td>"
                "</tr>"
            )
        html += ["</tbody></table>", "</body></html>"]
        html_path.write_text("\n".join(html), encoding="utf-8")

        zip_path = d / "report.zip"
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
            z.write(json_path, arcname=json_path.name)
            z.write(csv_path, arcname=csv_path.name)
            z.write(html_path, arcname=html_path.name)

        return [p.name for p in (json_path, csv_path, html_path, zip_path)]
