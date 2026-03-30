# 事故爬取子模块测试报告

## 覆盖范围

- 爬取与解析：HTML 列表页 → 详情页 → PDF 链接识别与下载
- 字段提取：事故时间/地点/伤亡/原因概述等最小字段集
- 去重：基于 fingerprint 的唯一约束（重复插入跳过）
- 异常恢复：网络瞬断重试
- 存储：原始文件落盘 + 结构化字段入库

## 自动化测试

后端（pytest）：
- `backend/tests/test_accident_crawler.py`
  - `test_extract_fields_basic`
  - `test_crawl_and_persist`（MockTransport 全链路）
  - `test_crawl_retry_on_transient_error`

执行结果（本次实现验证）：
- `pytest -q`：通过

## 静态扫描/构建

- 前端 `npm run build`：通过（建议在集成前再次执行）
- 后端 `python -m compileall`：通过

## 性能压测

脚本：
- `tools/perf/crawler-reports-load.mjs`

运行示例：

```bash
node tools/perf/crawler-reports-load.mjs
CONCURRENCY=100 REQUESTS=1000 node tools/perf/crawler-reports-load.mjs
```

判定规则（脚本内置）：
- 平均响应 `< 500ms`
- 成功率 `>= 99%`

