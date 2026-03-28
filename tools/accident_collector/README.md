# 事故案例数据采集与验证系统

该目录提供一套可复现的“采集 → 清洗/校验 → 生成前端上传 JSON → 前端交互模拟上传 → 服务端一致性验证 → 报告输出”的完整链路。

## 1. 安装依赖

```bash
py -3.13 -m pip install -r tools/accident_collector/requirements.txt
```

## 2. 采集与导出（≥10 个案例）

从应急管理部网站“事故及灾害查处/调查报告”入口采集 2018-2023 区间的“重大/特别重大”事故调查报告条目，自动下载 PDF（如存在）并提取正文。

```bash
py -3.13 tools/accident_collector/cli.py crawl --year-from 2018 --year-to 2023 --limit 10 --out-dir tools/accident_collector/output
```

输出：
- `tools/accident_collector/output/raw/*.json`：标准结构化数据
- `tools/accident_collector/output/frontend/*.json`：前端交互/上传使用的 JSON（每案例独立文件）
- `tools/accident_collector/output/downloads/*.pdf`：下载到本地的调查报告 PDF（如存在）

## 3. 启动系统（前端 + FastAPI）

前端：`npm run dev`（默认 `http://127.0.0.1:5173`）  
FastAPI：`py -3.13 backend/run.py`（默认 `http://127.0.0.1:8001`）  
MinIO：确保 `.env`/环境变量中配置 `MINIO_ENDPOINT/MINIO_ACCESS_KEY/MINIO_SECRET_KEY/MINIO_BUCKET=accident-attachment`

如需一键启动基础设施：

```bash
docker compose -f docker-compose.infra.yml up -d
```

## 4. 服务端一致性验证（API + PDF 解析/关键词索引）

该脚本会读取导出的 `frontend/*.json`，通过 FastAPI 创建事故并上传 PDF，然后回查：
- 标题一致
- attachment_keys 非空
- PDF 提取结果 `report_text/report_keywords` 已写入 `content` JSON

说明：服务端附件接口仅接受 `.pdf` 文件名（用于保证“调查报告 PDF”链路可验证）。

```bash
py -3.13 tools/accident_collector/verify_server.py --limit 10
```

输出：
- `tools/accident_collector/output/server-verify-report.json`

## 5. 前端交互模拟导入（Playwright）

```bash
npx playwright test -c playwright.accident.config.ts --project=chromium -g \"事故案例采集数据导入\"\n```

可选环境变量：
- `E2E_IMPORT_DIR`：默认 `tools/accident_collector/output/frontend`
- `E2E_IMPORT_LIMIT`：默认 10
