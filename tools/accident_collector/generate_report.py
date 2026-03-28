from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone


def main() -> int:
    report_path = Path("tools/accident_collector/output/server-verify-report.json")
    if not report_path.exists():
        raise SystemExit("missing server-verify-report.json, run verify_server.py first")
    data = json.loads(report_path.read_text(encoding="utf-8"))

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    md = []
    md.append("# 事故案例数据采集与验证报告")
    md.append("")
    md.append(f"- 生成时间：{now}")
    md.append(f"- 用例总数：{data.get('total')}")
    md.append(f"- 通过数：{data.get('passed')}")
    md.append(f"- 失败数：{len(data.get('failed') or [])}")
    md.append("")

    if data.get("failed"):
        md.append("## 失败清单")
        for x in data["failed"]:
            md.append(f"- {x}")
        md.append("")

    md.append("## 验证维度")
    md.append("- 采集：官方页面列表抓取、详情页解析、PDF 下载（如存在）")
    md.append("- 清洗：日期标准化、字段缺失兜底、文本去噪")
    md.append("- 服务端：创建事故、上传 PDF、写入 attachment_keys、提取 report_text、生成 report_keywords")
    md.append("")

    out = Path("tools/accident_collector/output/test-report.md")
    out.write_text("\n".join(md) + "\n", encoding="utf-8")
    print(str(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

