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
