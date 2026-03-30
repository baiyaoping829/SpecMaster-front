# 事故爬取子模块接口文档（FastAPI）

Base URL（开发）：`http://localhost:8001/api/v1`

## 1. 创建爬取任务

`POST /crawler/tasks`

请求体：

```json
{
  "keyword": "重大事故 河北 2024",
  "target_url": "https://example.com/list",
  "max_items": 20,
  "max_depth": 1
}
```

返回：`code=201`，`data` 为任务对象（含 `id/status/log_path`）。

## 2. 任务列表 / 任务详情

- `GET /crawler/tasks?page=1&size=20`
- `GET /crawler/tasks/{task_id}`

返回：`code=200`。

## 3. 触发任务运行

`POST /crawler/tasks/{task_id}/run`

说明：异步入队（FastAPI BackgroundTasks），返回：

```json
{ "queued": true, "task_id": "..." }
```

## 3.1 查看任务日志

`GET /crawler/tasks/{task_id}/log?tail=4000`

返回：

```json
{ "text": "...." }
```

## 4. 报告列表（供“案例选/管理后台”使用）

`GET /crawler/reports`

查询参数：
- `q`：关键词（匹配标题/地点/概述）
- `accident_type`：事故类型（精确匹配）
- `start_date` / `end_date`：事故发生日期范围（YYYY-MM-DD）
- `casualties_level`：伤亡等级（简单 like 匹配，如“死亡/受伤/重伤”）
- `sort_by`：`created_at|occurred_at|published_at`
- `sort_order`：`asc|desc`
- `page` / `size`

## 5. 删除报告 / 重新解析

- `DELETE /crawler/reports/{report_id}`
- `POST /crawler/reports/{report_id}/reparse`

说明：删除为软删除；重新解析会基于 `raw_path`（HTML/TXT）重新提取结构化字段并覆盖。

## 6. 反爬/稳定性配置

通过环境变量可选开启代理池：

- `CRAWLER_PROXIES=http://user:pass@ip:port,https://ip:port,...`

内置策略：
- UA 池轮换
- 请求间隔随机化
- 失败重试（最多 3 次）
- 任务日志：`log_path` 指向本地日志文件
