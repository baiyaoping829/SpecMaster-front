import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

const projectRoot = process.cwd()

const run = (cmd, args, env) =>
  new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: projectRoot, env, stdio: 'inherit', shell: process.platform === 'win32' })
    proc.on('exit', (code) => resolve(code || 0))
  })

const parsePromMetrics = (text) => {
  const lines = String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const buckets = []
  for (const line of lines) {
    if (!line.startsWith('http_request_duration_ms_bucket')) continue
    const m = line.match(/^http_request_duration_ms_bucket\{([^}]*)\}\s+([0-9.]+)$/)
    if (!m) continue
    const labelsRaw = m[1]
    const value = Number(m[2])
    const labels = {}
    for (const part of labelsRaw.split(',').map((x) => x.trim()).filter(Boolean)) {
      const kv = part.split('=')
      if (kv.length !== 2) continue
      const k = kv[0]
      const v = kv[1].replace(/^"|"$/g, '')
      labels[k] = v
    }
    buckets.push({ labels, value })
  }
  return buckets
}

const quantileFromBuckets = (bucketPairs, q) => {
  const sorted = bucketPairs
    .map((p) => ({ le: p.le === '+Inf' ? Infinity : Number(p.le), count: Number(p.count) }))
    .sort((a, b) => a.le - b.le)
  const total = sorted.length ? sorted[sorted.length - 1].count : 0
  if (total <= 0) return 0
  const target = total * q
  let prevLe = 0
  let prevCount = 0
  for (const b of sorted) {
    if (b.count >= target) {
      const bucketCount = b.count - prevCount
      if (bucketCount <= 0) return isFinite(b.le) ? b.le : prevLe
      const pos = (target - prevCount) / bucketCount
      const le = isFinite(b.le) ? b.le : prevLe
      return prevLe + (le - prevLe) * pos
    }
    prevLe = isFinite(b.le) ? b.le : prevLe
    prevCount = b.count
  }
  return prevLe
}

const computeRouteQuantiles = (buckets, routes) => {
  const byRoute = new Map()
  for (const b of buckets) {
    const route = b.labels.route
    if (!routes.includes(route)) continue
    const le = b.labels.le
    const key = route
    if (!byRoute.has(key)) byRoute.set(key, [])
    byRoute.get(key).push({ le, count: b.value })
  }
  const out = {}
  for (const [route, arr] of byRoute.entries()) {
    out[route] = {
      p50: quantileFromBuckets(arr, 0.5),
      p95: quantileFromBuckets(arr, 0.95),
      p99: quantileFromBuckets(arr, 0.99)
    }
  }
  return out
}

const main = async () => {
  await mkdir(join(projectRoot, 'reports', 'raw'), { recursive: true })
  await mkdir(join(projectRoot, 'reports', '.internal'), { recursive: true })

  const port = Number(process.env.E2E_PORT || 0) || 4101 + Math.floor(Math.random() * 1500)
  const baseURL = `http://127.0.0.1:${port}`
  const key = process.env.E2E_KEY || randomBytes(16).toString('hex')

  const env = {
    ...process.env,
    PORT: String(port),
    E2E_BASE_URL: baseURL,
    E2E_KEY: key,
    E2E_WHITELIST: '1',
    E2E_NO_TEARDOWN: '1'
  }

  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'

  if (process.env.E2E_SKIP_BROWSERS !== '1') {
    const installCode = await run(npx, ['playwright', 'install'], env)
    if (installCode !== 0) {
      process.exitCode = 1
      return
    }
  }

  const exitCode = await run(npx, ['playwright', 'test', '-c', 'playwright.human.config.ts'], env)

  const resultsRaw = await readFile(join(projectRoot, 'reports', 'raw', 'playwright-results.json'), 'utf8').catch(() => '')
  const results = resultsRaw ? JSON.parse(resultsRaw) : null
  const totals = { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0 }
  const failures = []

  const walk = (suite) => {
    for (const s of suite?.suites || []) walk(s)
    for (const spec of suite?.specs || []) {
      for (const t of spec?.tests || []) {
        totals.total += 1
        const status = String(t?.results?.[t.results.length - 1]?.status || t?.status || '')
        if (status === 'passed') totals.passed += 1
        else if (status === 'skipped') totals.skipped += 1
        else if (status === 'flaky') totals.flaky += 1
        else {
          totals.failed += 1
          const last = t?.results?.[t.results.length - 1] || {}
          failures.push({
            title: Array.isArray(t?.titlePath) ? t.titlePath.join(' > ') : String(t?.title || ''),
            status,
            error: last?.error?.message || last?.error?.stack || null
          })
        }
      }
    }
  }
  if (results?.suites) {
    for (const s of results.suites) walk(s)
  }

  const successRate = totals.total > 0 ? (totals.passed / totals.total) * 100 : 0

  const metricsText = await fetch(`${baseURL}/metrics`).then((r) => r.text()).catch(() => '')
  const buckets = parsePromMetrics(metricsText)
  const routes = [
    '/api/spec/list',
    '/api/spec/upload',
    '/api/specifications/latest',
    '/api/specifications',
    '/api/auth/login',
    '/api/auth/me'
  ]
  const q = computeRouteQuantiles(buckets, routes)

  const procStats = await fetch(`${baseURL}/api/test/whitelist/process`, { headers: { 'x-e2e-key': key } })
    .then((r) => r.json())
    .catch(() => null)

  const thresholds = {
    successRate: Number(process.env.E2E_SUCCESS_RATE || 99),
    p99Ms: Number(process.env.E2E_P99_MS || 800)
  }

  const worstP99 = Math.max(
    0,
    ...Object.values(q).map((v) => Number(v?.p99 || 0)).filter((n) => Number.isFinite(n))
  )
  const ok = successRate >= thresholds.successRate && totals.failed === 0 && worstP99 <= thresholds.p99Ms

  const perf = {
    ts: new Date().toISOString(),
    baseURL,
    successRate,
    totals,
    thresholds,
    routeQuantilesMs: q,
    worstP99Ms: worstP99,
    process: procStats?.data || null
  }

  await writeFile(join(projectRoot, 'reports', 'raw', 'e2e-metrics.json'), JSON.stringify(perf, null, 2), 'utf8')

  const executive = `# Executive Summary（E2E）\n\n- 范围：全模块导览 + 规范标准深度遍历（含异常/边界）\n- 成功率：${successRate.toFixed(2)}%（阈值≥${thresholds.successRate}%）\n- 致命缺陷：${totals.failed}（要求 0）\n- 性能（P99）：${worstP99.toFixed(2)} ms（阈值≤${thresholds.p99Ms} ms）\n\n## 关键接口延迟（ms）\n\n| Route | P50 | P95 | P99 |\n|---|---:|---:|---:|\n${Object.entries(q)
    .map(([k, v]) => `| ${k} | ${Number(v.p50).toFixed(2)} | ${Number(v.p95).toFixed(2)} | ${Number(v.p99).toFixed(2)} |`)
    .join('\n')}\n\n## 资源消耗（Server）\n\n- RSS：${procStats?.data?.mem?.rss ?? 'n/a'}\n- HeapUsed：${procStats?.data?.mem?.heapUsed ?? 'n/a'}\n\n`

  const chartData = Object.entries(q).map(([route, v]) => ({ route, p99: Number(v?.p99 || 0) }))
  const max = Math.max(1, ...chartData.map((d) => d.p99))
  const w = 900
  const h = 260
  const pad = 40
  const barW = chartData.length ? Math.floor((w - pad * 2) / chartData.length) : 1
  const bars = chartData
    .map((d, i) => {
      const x = pad + i * barW + 6
      const bh = Math.round(((h - pad * 2) * d.p99) / max)
      const y = h - pad - bh
      const label = d.route.replace('/api/', '')
      return `<rect x="${x}" y="${y}" width="${Math.max(6, barW - 12)}" height="${bh}" fill="#3b82f6"></rect>
<text x="${x}" y="${h - pad + 14}" font-size="10" fill="#111">${label}</text>
<text x="${x}" y="${Math.max(12, y - 4)}" font-size="10" fill="#111">${d.p99.toFixed(1)}</text>`
    })
    .join('\n')
  const executiveHtml = `<!doctype html><meta charset="utf-8" />
<title>Executive Summary（E2E）</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;margin:24px;color:#111} pre{background:#f7f7f7;padding:12px;border-radius:8px;overflow:auto} </style>
<h1>Executive Summary（E2E）</h1>
<ul>
  <li>范围：全模块导览 + 规范标准深度遍历（含异常/边界）</li>
  <li>成功率：${successRate.toFixed(2)}%（阈值≥${thresholds.successRate}%）</li>
  <li>致命缺陷：${totals.failed}（要求 0）</li>
  <li>性能（P99）：${worstP99.toFixed(2)} ms（阈值≤${thresholds.p99Ms} ms）</li>
</ul>
<h2>P99 性能曲线（柱状）</h2>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="border:1px solid #eee;border-radius:8px">
  <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#999" />
  <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#999" />
  ${bars}
</svg>
<h2>原始数据</h2>
<pre>${JSON.stringify(perf, null, 2)}</pre>`

  const slowRoutes = Object.entries(q)
    .filter(([, v]) => Number(v?.p99 || 0) > thresholds.p99Ms)
    .map(([route, v]) => ({ route, p99: Number(v.p99 || 0) }))
    .sort((a, b) => b.p99 - a.p99)
  const suggestions = `# Debug Suggestions（Internal）\n\n## 汇总\n\n- Playwright exit code: ${exitCode}\n- 成功率: ${successRate.toFixed(2)}%（阈值≥${thresholds.successRate}%）\n- 失败用例数: ${totals.failed}\n- worstP99Ms: ${worstP99.toFixed(2)}（阈值≤${thresholds.p99Ms}）\n\n## 失败用例（溯源）\n\n${failures.length ? failures.map((f, i) => `### ${i + 1}. ${f.title}\n- status: ${f.status}\n- error: ${String(f.error || '').slice(0, 1200)}\n`).join('\n') : '- 无\n'}\n\n## 超阈值接口（溯源）\n\n${slowRoutes.length ? slowRoutes.map((r) => `- ${r.route}: p99=${r.p99.toFixed(2)}ms`).join('\n') : '- 无\n'}\n\n## 可执行修复建议（不进入最终报告）\n\n${
    totals.failed
      ? '- 优先修复：从失败用例的首个断言点开始复现（使用 test-results 的 trace/video），确认是选择器波动、数据竞争还是后端返回异常。\n'
      : ''
  }${
    slowRoutes.length
      ? '- 性能：优先优化 p99 超标路由（检查 SQL 扫描、索引、缓存命中率；必要时对该 route 做分页与字段投影收敛）。\n'
      : ''
  }- 稳定性：对网络抖动类失败启用更精细的等待策略（以请求完成/关键元素可见为准），避免固定 sleep。\n- 数据隔离：对 E2E 生成的数据增加统一前缀与清理策略，减少跨用例污染。\n`
  await writeFile(join(projectRoot, 'reports', '.internal', 'debug-suggestions.md'), suggestions, 'utf8')

  if (ok) {
    await mkdir(join(projectRoot, 'reports'), { recursive: true })
    await writeFile(join(projectRoot, 'reports', 'executive-summary.md'), executive, 'utf8')
    await writeFile(join(projectRoot, 'reports', 'executive-summary.html'), executiveHtml, 'utf8')
  }

  const pidRaw = await readFile(join(projectRoot, '.e2e', 'server.pid'), 'utf8').catch(() => '')
  const pid = Number(String(pidRaw || '').trim())
  if (Number.isFinite(pid) && pid > 0) {
    try {
      process.kill(pid)
    } catch {
    }
  }

  process.exitCode = ok ? 0 : 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})

