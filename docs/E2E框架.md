# 自动化拟人化 E2E 测试框架

## 一键执行

- 本地：`npm run e2e:human`
- 生成 Allure 报告（可选）：`npm run e2e:report`

说明：`e2e:human` 仅在达标时生成“好结果”报告 `reports/executive-summary.*`；未达标会直接以非 0 退出码失败。

## 设计要点

### 拟人化用户路径

- 用 Playwright 模拟真实用户行为：登录 → 进入模块 → 表单输入/搜索 → 列表勾选 → 二次确认 → 结果提示。
- 规范标准模块深度覆盖：列表检索、跨页多选、删除、查看最新规范、网络异常与重试。
- 全模块导览覆盖：按路由清单逐一访问，确保渲染与路由守卫稳定。

### 无人值守自授权（白名单）

为应对“权限/审核/验证码”等拦截点，后端在 `E2E_WHITELIST=1` 时开放测试白名单接口（需 `X-E2E-KEY`）：

- `POST /api/test/whitelist/token`：发放/创建测试用户并返回 token
- `POST /api/test/whitelist/seed/specs`：快速注入测试规范数据
- `GET /api/test/whitelist/process`：采集服务端资源消耗（内存/CPU）

### 指标采集与只输出好结果

- 成功率：从 Playwright JSON 报告统计
- 性能：从 `/metrics` 的 `http_request_duration_ms` 计算 P50/P95/P99
- 资源：通过 `/api/test/whitelist/process` 采集
- 只输出好结果：仅当满足阈值时才生成 `reports/executive-summary.md/html`

## 可插拔测试数据包

- 默认数据包：`e2e-human/datasets/spec-basic.json`
- 覆盖默认：设置 `E2E_DATASET` 指向自定义 JSON 文件

字段：
- `seedSpecs`：预置数据条数
- `routes`：导览访问路由列表

## 阈值配置（环境变量）

- `E2E_SUCCESS_RATE`：成功率阈值（默认 99）
- `E2E_P99_MS`：P99 延迟阈值（默认 800）
- `E2E_SKIP_BUILD=1`：跳过 global-setup 的 build（CI 推荐在前置 stage build）

