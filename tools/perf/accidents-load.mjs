const BASE = process.env.ACCIDENT_API_BASE || 'http://127.0.0.1:8001'
const DURATION_SECONDS = Number(process.env.DURATION_SECONDS || '60')
const CONCURRENCY = Number(process.env.CONCURRENCY || '50')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const nowMs = () => Number(process.hrtime.bigint() / 1000000n)

const timedFetchJson = async (url, init) => {
  const t0 = nowMs()
  const res = await fetch(url, init)
  const t1 = nowMs()
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { ms: t1 - t0, status: res.status, json, textLen: text.length }
}

const percentile = (arr, p) => {
  if (!arr.length) return 0
  const xs = [...arr].sort((a, b) => a - b)
  const idx = Math.min(xs.length - 1, Math.max(0, Math.floor((p / 100) * xs.length)))
  return xs[idx]
}

const main = async () => {
  const endAt = Date.now() + DURATION_SECONDS * 1000
  const latencies = []
  const statuses = new Map()
  let errors = 0
  let ok = 0

  const worker = async () => {
    while (Date.now() < endAt) {
      const r = await timedFetchJson(`${BASE}/api/v1/accidents/?page=1&size=20`)
      latencies.push(r.ms)
      statuses.set(r.status, (statuses.get(r.status) || 0) + 1)
      if (r.status >= 400) errors++
      else ok++
      await sleep(5)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  const avg = latencies.reduce((a, b) => a + b, 0) / Math.max(1, latencies.length)
  const p50 = percentile(latencies, 50)
  const p90 = percentile(latencies, 90)
  const p95 = percentile(latencies, 95)
  const p99 = percentile(latencies, 99)

  const statusObj = Object.fromEntries([...statuses.entries()].sort((a, b) => a[0] - b[0]))

  const report = {
    base: BASE,
    durationSeconds: DURATION_SECONDS,
    concurrency: CONCURRENCY,
    count: latencies.length,
    ok,
    errors,
    status: statusObj,
    latencyMs: { avg, p50, p90, p95, p99 }
  }

  console.log(JSON.stringify(report, null, 2))
  if (errors > 0) process.exitCode = 2
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})

