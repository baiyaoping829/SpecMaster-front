import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { GenericContainer, Wait } from 'testcontainers'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const startServer = async (env, port) => {
  const proc = spawn(process.execPath, ['server/index.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, ...env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let ready = false
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server start timeout')), 20000)
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

const tryFetch = async (url, init) => {
  const res = await fetch(url, init)
  const body = await res.json()
  return { res, body }
}

test('Testcontainers: Postgres/MySQL/SQLite + Redis + MinIO', async (t) => {
  if (process.env.SKIP_TESTCONTAINERS === '1') {
    t.skip()
    return
  }
  if (process.env.RUN_TESTCONTAINERS !== '1' && process.env.CI !== 'true') {
    t.skip()
    return
  }

  let postgres
  let mysql
  let redis
  let minio
  let serverProc

  try {
    try {
      const probe = await new GenericContainer('redis:7.4').withExposedPorts(6379).start()
      await probe.stop()
    } catch (e) {
      t.skip()
      return
    }

    postgres = await new GenericContainer('postgres:16')
      .withEnvironment({
        POSTGRES_DB: 'specmaster',
        POSTGRES_USER: 'specmaster_rw',
        POSTGRES_PASSWORD: 'specmaster'
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forListeningPorts())
      .start()

    mysql = await new GenericContainer('mysql:8.4')
      .withEnvironment({
        MYSQL_DATABASE: 'specmaster',
        MYSQL_USER: 'specmaster_rw',
        MYSQL_PASSWORD: 'specmaster',
        MYSQL_ROOT_PASSWORD: 'root'
      })
      .withCommand(['--default-authentication-plugin=mysql_native_password'])
      .withExposedPorts(3306)
      .withWaitStrategy(Wait.forListeningPorts())
      .start()

    redis = await new GenericContainer('redis:7.4').withExposedPorts(6379).withWaitStrategy(Wait.forLogMessage('Ready to accept connections')).start()

    minio = await new GenericContainer('minio/minio:RELEASE.2025-02-07T23-21-09Z')
      .withEnvironment({
        MINIO_ROOT_USER: 'minioadmin',
        MINIO_ROOT_PASSWORD: 'minioadmin'
      })
      .withCommand(['server', '/data'])
      .withExposedPorts(9000)
      .start()

    const port = 3901 + Math.floor(Math.random() * 1000)
    serverProc = await startServer(
      {
        AUTO_MIGRATE: '1',
        AUTO_MIGRATE_ALL: '1',
        DB_DIALECT: 'sqlite',
        SQLITE_FILE: 'server/testcontainers.sqlite',
        REDIS_ENABLED: '1',
        REDIS_URL: `redis://127.0.0.1:${redis.getMappedPort(6379)}`,
        MINIO_ENABLED: '1',
        MINIO_ENDPOINT: `http://127.0.0.1:${minio.getMappedPort(9000)}`,
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin',
        MINIO_BUCKET: 'specmaster-docs',
        PG_HOST: '127.0.0.1',
        PG_PORT: String(postgres.getMappedPort(5432)),
        PG_DATABASE: 'specmaster',
        PG_USER: 'specmaster_rw',
        PG_PASSWORD: 'specmaster',
        MYSQL_HOST: '127.0.0.1',
        MYSQL_PORT: String(mysql.getMappedPort(3306)),
        MYSQL_DATABASE: 'specmaster',
        MYSQL_USER: 'specmaster_rw',
        MYSQL_PASSWORD: 'specmaster'
      },
      port
    )

    const base = `http://127.0.0.1:${port}`

    const { body: loginBody } = await tryFetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' })
    })
    assert.equal(loginBody.code, 200)
    const token = loginBody.data.token
    assert.ok(token)

    for (const dialect of ['sqlite', 'postgres', 'mysql']) {
      const name = `TC-${dialect}-${Date.now()}`
      const { body } = await tryFetch(`${base}/api/spec/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-DB-DIALECT': dialect },
        body: JSON.stringify({ name, code: `TC-${dialect}-${Date.now()}`, type: 'GB', level: 1, status: 1 })
      })
      assert.equal(body.code, 200)

      const { body: listBody } = await tryFetch(`${base}/api/spec/list?name=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: { 'X-DB-DIALECT': dialect }
      })
      assert.equal(listBody.code, 200)
      assert.ok(listBody.data.total >= 1)
    }
  } finally {
    await stopServer(serverProc)
    await minio?.stop().catch(() => {})
    await redis?.stop().catch(() => {})
    await mysql?.stop().catch(() => {})
    await postgres?.stop().catch(() => {})
  }
})

