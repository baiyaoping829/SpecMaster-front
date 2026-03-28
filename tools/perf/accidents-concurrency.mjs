const BASE = process.env.ACCIDENT_API_BASE || 'http://127.0.0.1:8001'
const N = Number(process.env.N || '50')

const jsonFetch = async (url, init) => {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { status: res.status, json, text }
}

const main = async () => {
  const create = await jsonFetch(`${BASE}/api/v1/accidents/`, {
    method: 'POST',
    body: JSON.stringify({ title: `E2E-CONC-${Date.now()}`, content: '{}', attachment_keys: [] })
  })
  if (create.status !== 200 && create.status !== 201) throw new Error(`create failed: ${create.status} ${create.text}`)
  const id = create.json?.data?.id
  const version = create.json?.data?.version
  if (!id) throw new Error('missing id')

  const reqs = Array.from({ length: N }, (_, i) =>
    jsonFetch(`${BASE}/api/v1/accidents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, title: `E2E-CONC-${i}` })
    })
  )
  const results = await Promise.all(reqs)
  const statusCount = results.reduce((m, r) => {
    m[r.status] = (m[r.status] || 0) + 1
    return m
  }, {})

  console.log(JSON.stringify({ id, version, N, statusCount }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})

