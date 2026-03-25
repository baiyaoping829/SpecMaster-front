import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

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

const login = async (port) => {
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  })
  const body = await res.json()
  assert.equal(body.code, 200)
  return body.data.token
}

test('GET /api/health returns ok', async () => {
  const port = 3101 + Math.floor(Math.random() * 2000)
  const proc = await startServer(port)
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.code, 200)
    assert.equal(body.data.ok, true)
    assert.ok(Array.isArray(body.data.db))
    assert.equal(typeof body.data.redis, 'boolean')
    assert.equal(typeof body.data.minio, 'boolean')
  } finally {
    await stopServer(proc)
  }
})

test('GET /api/spec/list returns items array', async () => {
  const port = 3101 + Math.floor(Math.random() * 2000)
  const proc = await startServer(port)
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/spec/list`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.code, 200)
    assert.ok(Array.isArray(body.data.items))
    assert.equal(typeof body.data.total, 'number')
  } finally {
    await stopServer(proc)
  }
})

test('GET /api/specifications/latest returns latest items', async () => {
  const port = 3101 + Math.floor(Math.random() * 2000)
  const proc = await startServer(port)
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/specifications/latest`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.code, 200)
    assert.ok(Array.isArray(body.data.items))
    if (body.data.items.length) {
      const it = body.data.items[0]
      assert.ok('id' in it)
      assert.ok('name' in it)
      assert.ok('version' in it)
      assert.ok('uploadTime' in it)
    }
  } finally {
    await stopServer(proc)
  }
})

test('GET /api/specifications/latest supports concurrent fetch', async () => {
  const port = 3101 + Math.floor(Math.random() * 2000)
  const proc = await startServer(port)
  try {
    const tasks = Array.from({ length: 10 }).map(async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/specifications/latest`)
      assert.equal(res.status, 200)
      const body = await res.json()
      assert.equal(body.code, 200)
      assert.ok(Array.isArray(body.data.items))
      return body.data.items.length
    })
    const results = await Promise.all(tasks)
    assert.equal(results.length, 10)
  } finally {
    await stopServer(proc)
  }
})

test('DELETE /api/specifications returns partial failures', async () => {
  const port = 3101 + Math.floor(Math.random() * 2000)
  const proc = await startServer(port)
  try {
    const token = await login(port)
    const createRes = await fetch(`http://127.0.0.1:${port}/api/spec/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: `T-${Date.now()}`, code: `C-${Date.now()}`, type: 'GB', level: 1, status: 1 })
    })
    const createBody = await createRes.json()
    assert.equal(createBody.code, 200)
    const id = String(createBody.data.id)

    const delRes = await fetch(`http://127.0.0.1:${port}/api/specifications`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify([id, 'missing-id'])
    })
    const delBody = await delRes.json()
    assert.equal(delBody.code, 200)
    assert.ok(Array.isArray(delBody.data.successIds))
    assert.ok(Array.isArray(delBody.data.failed))
    assert.ok(delBody.data.successIds.includes(id))
    assert.ok(delBody.data.failed.some((f) => f.id === 'missing-id'))
  } finally {
    await stopServer(proc)
  }
})

test('DELETE /api/specifications supports concurrent delete', async () => {
  const port = 3101 + Math.floor(Math.random() * 2000)
  const proc = await startServer(port)
  try {
    const token = await login(port)

    const createOne = async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/spec/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: `T-${Date.now()}-${Math.random()}`, code: `C-${Date.now()}-${Math.random()}`, type: 'GB', level: 1, status: 1 })
      })
      const body = await res.json()
      assert.equal(body.code, 200)
      return String(body.data.id)
    }

    const [id1, id2] = await Promise.all([createOne(), createOne()])

    const del1 = fetch(`http://127.0.0.1:${port}/api/specifications`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify([id1, 'missing-1'])
    }).then(async (r) => ({ status: r.status, body: await r.json() }))

    const del2 = fetch(`http://127.0.0.1:${port}/api/specifications`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify([id2, 'missing-2'])
    }).then(async (r) => ({ status: r.status, body: await r.json() }))

    const [r1, r2] = await Promise.all([del1, del2])
    assert.equal(r1.status, 200)
    assert.equal(r2.status, 200)
    assert.equal(r1.body.code, 200)
    assert.equal(r2.body.code, 200)
    assert.ok(r1.body.data.successIds.includes(id1))
    assert.ok(r2.body.data.successIds.includes(id2))
    assert.ok(r1.body.data.failed.some((f) => f.id === 'missing-1'))
    assert.ok(r2.body.data.failed.some((f) => f.id === 'missing-2'))
  } finally {
    await stopServer(proc)
  }
})
