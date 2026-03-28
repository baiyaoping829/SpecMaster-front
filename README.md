# 规标大师（specmaster）

规标大师是面向工程领域的规范标准综合应用系统，目标是将各业务模块尽量解耦独立，通过“数据贯通”形成统一能力底座，便于模块独立部署与运维。

## 模块

- 规范标准模块
- 规范智阅模块
- 规范智答模块
- 风险智控模块
- 合同智审模块
- 事故案例模块
- 工程知识模块
- 工程管理模块

## 前端架构

- 技术栈：Vite + Vue 3 + TypeScript + Pinia + Vue Router + Element Plus
- 模块边界：通过路由前缀划分模块入口，并在 `ModuleLayout` 中按前缀切换模块侧边栏

## 后端架构（现状）

本仓库包含两套后端形态：

- Node 后端：`server/`（当前支撑规范标准模块的 CRUD、文件上传到 MinIO、PDF 预览等能力）
- FastAPI 事故案例后端：`backend/`（事故案例模块的独立后端，严格模块化，仅通过 `accident_spec_refs.spec_id -> specs.id` 与规范模块数据贯通）

## 事故案例 FastAPI 后端（backend）

### 目录结构

- `backend/app/accident_case/`：事故案例模块（独立子包）
- `backend/migrations/*`：MySQL/SQLite SQL 迁移脚本
- `backend/alembic/`：Alembic 迁移（支持升级/回滚）

### 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

- `MYSQL_URL`：MySQL 连接串（为空则自动降级 SQLite）
- `SQLITE_PATH`：SQLite 文件路径（建议在 backend/.env 配置为 `../server/dev.sqlite` 与 Node 后端共用）
- `REDIS_URL`：Redis 连接串（为空则禁用缓存）
- `MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY`：MinIO（S3）配置

### 安装依赖

```bash
python -m pip install -r backend/requirements.txt
```

### 数据库迁移

Alembic（推荐）：

```bash
cd backend
alembic -c alembic.ini upgrade head
```

SQL 脚本（可选）：

- SQLite：`backend/migrations/sqlite/V1__accident_case.sql`
- MySQL：`backend/migrations/mysql/V1__accident_case.sql`

### 启动

```bash
python backend/run.py
```

默认监听 `http://localhost:8001`，OpenAPI 地址：

- `http://localhost:8001/openapi.json`

### 缓存与对象存储策略

- Redis cache-aside：
  - `accident:case:{id}`（TTL 300s）
  - `accident:list:{page}:{size}`（TTL 300s）
  - 写操作会失效相关 key
- MinIO：
  - bucket：`accident-attachment`
  - 私有读，通过预签名 URL 访问（事故模块可按需扩展附件上传/删除接口）

## 前端开发（Vite）

事故案例 API 默认走 `/api/v1/*`，开发环境已配置代理到 `http://localhost:8001`（见 `vite.config.ts`）。

```bash
npm install
npm run dev
```
