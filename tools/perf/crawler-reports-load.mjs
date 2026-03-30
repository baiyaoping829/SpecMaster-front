import { performance } from 'node:perf_hooks'
const BASE = process.env.ACCIDENT_API_BASE || 'http://127.0.0.1:8001'
const CONCURRENCY = Number(process.env.CONCURRENCY || '100')
const REQUESTS = Number(process.env.REQUESTS || '1000')

const url = `${BASE}/api/v1/crawler/reports?page=1&size=20`

const runOne = async () => {
  const start = performance.now()
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const ms = performance.now() - start
  const ok = res.ok
  await res.arrayBuffer().catch(() => null)
  return { ok, ms, status: res.status }
}

const main = async () => {
  const batches = Math.ceil(REQUESTS / CONCURRENCY)
  let done = 0
  let ok = 0
  let fail = 0
  let sum = 0
  let max = 0
  const statusCount = {}

  for (let b = 0; b < batches; b++) {
    const n = Math.min(CONCURRENCY, REQUESTS - done)
    const results = await Promise.all(Array.from({ length: n }, runOne))
    for (const r of results) {
      done += 1
      sum += r.ms
      if (r.ms > max) max = r.ms
      statusCount[r.status] = (statusCount[r.status] || 0) + 1
      if (r.ok) ok += 1
      else fail += 1
    }
  }

  const avg = done ? sum / done : 0
  const successRate = done ? (ok / done) * 100 : 0
  console.log(JSON.stringify({ url, CONCURRENCY, REQUESTS, ok, fail, successRate, avgMs: avg, maxMs: max, statusCount }, null, 2))
  if (avg > 500 || successRate < 99) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
