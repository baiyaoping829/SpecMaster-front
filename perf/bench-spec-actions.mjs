import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const startServer = async (port) => {
  const proc = spawn(process.execPath, ['server/index.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let ready = false
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server start timeout')), 8000)
    proc.stdout.on('data', (buf) => {
      const text = buf.toString('utf8')
      if (text.includes('server listening')) {
        ready = true
        clearTimeout(timeout)
        resolve()
      }
    })
    proc.on('exit', (code) => {
      if (!ready) {
        clearTimeout(timeout)
        reject(new Error(`server exited: ${code}`))
      }
    })
  })

  return proc
}

const stopServer = async (proc) => {
  if (!proc || proc.killed) return
  proc.kill()
  await new Promise((resolve) => proc.once('exit', resolve))
}

const timedFetch = async (url, options, timeoutMs) => {
  const ctrl = new AbortController()
  const t0 = performance.now()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs || 3000)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal })
    const json = await res.json().catch(() => null)
    const t1 = performance.now()
    return { ok: res.ok, status: res.status, json, ms: t1 - t0 }
  } finally {
    clearTimeout(timer)
  }
}

const p = (arr, pct) => {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1))
  return sorted[idx]
}

const login = async (baseUrl) => {
  const r = await timedFetch(
    `${baseUrl}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' })
    },
    3000
  )
  if (!r.json || r.json.code !== 200) throw new Error('login failed')
  return String(r.json.data.token)
}

const createSpec = async (baseUrl, token, i) => {
  const r = await timedFetch(
    `${baseUrl}/api/spec/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: `bench-${Date.now()}-${i}`, code: `bench-${i}`, type: 'GB', level: 1, status: 1 })
    },
    3000
  )
  if (!r.json || r.json.code !== 200) throw new Error('create failed')
  return String(r.json.data.id)
}

const deleteSpecs = async (baseUrl, token, ids) => {
  return timedFetch(
    `${baseUrl}/api/specifications`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(ids)
    },
    3000
  )
}

const latestSpecs = async (baseUrl) => {
  return timedFetch(`${baseUrl}/api/specifications/latest`, { method: 'GET' }, 3000)
}

const main = async () => {
  const port = 3301 + Math.floor(Math.random() * 2000)
  const baseUrl = `http://127.0.0.1:${port}`
  const proc = await startServer(port)
  try {
    const token = await login(baseUrl)

    const latestTimes = []
    const latestErrors = []
    for (let i = 0; i < 50; i++) {
      const r = await latestSpecs(baseUrl)
      latestTimes.push(r.ms)
      if (!r.json || r.json.code !== 200) latestErrors.push({ i, status: r.status, ms: r.ms })
    }

    const deleteTimes = []
    const deleteErrors = []
    for (let i = 0; i < 30; i++) {
      const id = await createSpec(baseUrl, token, i)
      const r = await deleteSpecs(baseUrl, token, [id])
      deleteTimes.push(r.ms)
      if (!r.json || r.json.code !== 200) deleteErrors.push({ i, status: r.status, ms: r.ms })
    }

    const result = {
      ts: new Date().toISOString(),
      baseUrl,
      latest: {
        n: latestTimes.length,
        p95: p(latestTimes, 95),
        avg: latestTimes.reduce((a, b) => a + b, 0) / Math.max(1, latestTimes.length),
        errors: latestErrors
      },
      delete: {
        n: deleteTimes.length,
        p95: p(deleteTimes, 95),
        avg: deleteTimes.reduce((a, b) => a + b, 0) / Math.max(1, deleteTimes.length),
        errors: deleteErrors
      }
    }

    const jsonPath = join(projectRoot, 'perf', 'bench-spec-actions.json')
    await writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf8')

    const htmlPath = join(projectRoot, 'perf', 'bench-spec-actions.html')
    const passLatest = result.latest.p95 < 500 && result.latest.errors.length === 0
    const passDelete = result.delete.p95 < 500 && result.delete.errors.length === 0
    const html = `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8" />
<title>性能基准 - 查看/删除规范</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; margin:24px; color:#111}
table{border-collapse:collapse; width:720px; max-width:100%}
th,td{border:1px solid #ddd; padding:10px 12px; text-align:left}
th{background:#f7f7f7}
.ok{color:#067d17; font-weight:600}
.bad{color:#b42318; font-weight:600}
.muted{color:#666}
</style>
<h1>性能基准 - 查看/删除规范</h1>
<div class="muted">时间：${result.ts}</div>
<div class="muted">目标：单次操作 P95 &lt; 500ms（本地基准）</div>
<div class="muted">Base URL：${result.baseUrl}</div>
<h2>结果</h2>
<table>
  <thead><tr><th>操作</th><th>样本数</th><th>P95 (ms)</th><th>AVG (ms)</th><th>错误数</th><th>结论</th></tr></thead>
  <tbody>
    <tr>
      <td>GET /api/specifications/latest</td>
      <td>${result.latest.n}</td>
      <td>${result.latest.p95.toFixed(2)}</td>
      <td>${result.latest.avg.toFixed(2)}</td>
      <td>${result.latest.errors.length}</td>
      <td class="${passLatest ? 'ok' : 'bad'}">${passLatest ? 'PASS' : 'FAIL'}</td>
    </tr>
    <tr>
      <td>DELETE /api/specifications</td>
      <td>${result.delete.n}</td>
      <td>${result.delete.p95.toFixed(2)}</td>
      <td>${result.delete.avg.toFixed(2)}</td>
      <td>${result.delete.errors.length}</td>
      <td class="${passDelete ? 'ok' : 'bad'}">${passDelete ? 'PASS' : 'FAIL'}</td>
    </tr>
  </tbody>
</table>
<h2>原始数据</h2>
<pre>${JSON.stringify(result, null, 2)}</pre>
</html>`
    await writeFile(htmlPath, html, 'utf8')

    console.log(JSON.stringify({ ok: true, jsonPath, htmlPath, result }, null, 2))
  } finally {
    await stopServer(proc)
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})

