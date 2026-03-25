import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { stat } from 'node:fs/promises'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const distIndex = join(projectRoot, 'dist', 'index.html')

const startServer = async (port) => {
  const proc = spawn(process.execPath, ['server/index.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server start timeout')), 8000)
    proc.stdout.on('data', (buf) => {
      const text = buf.toString('utf8')
      if (text.includes('server listening')) {
        clearTimeout(timeout)
        resolve()
      }
    })
    proc.on('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`server exited: ${code}`))
    })
  })

  return proc
}

const stopServer = async (proc) => {
  if (!proc || proc.killed) return
  proc.kill()
  await new Promise((resolve) => proc.once('exit', resolve))
}

test('serves SPA routes from dist', async (t) => {
  const hasDist = await stat(distIndex).then(() => true).catch(() => false)
  if (!hasDist) {
    t.skip()
    return
  }

  const port = 3101 + Math.floor(Math.random() * 2000)
  const proc = await startServer(port)
  try {
    const res = await fetch(`http://127.0.0.1:${port}/spec-data`)
    assert.equal(res.status, 200)
    const html = await res.text()
    assert.ok(html.includes('id="app"') || html.includes("id='app'"))
  } finally {
    await stopServer(proc)
  }
})
