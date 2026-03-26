import http from 'node:http'
import { stat, readFile, mkdir } from 'node:fs/promises'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { createWriteStream } from 'node:fs'
import { randomUUID } from 'node:crypto'
import Busboy from 'busboy'
import { loadConfig } from './config.mjs'
import { startOtel } from './otel.mjs'
import { createMetrics } from './metrics.mjs'
import { DataSourceManager } from './db/manager.mjs'
import { runMigrations } from './migrate.mjs'
import { createRedisClients } from './cache/redis.mjs'
import { createCacheAside } from './cache/cacheAside.mjs'
import { createMinio, ensureBucket, sha256File, buildObjectKey, putObjectFromFile, cleanupTempFile, fileSize } from './storage/minio.mjs'
import { hashPassword, verifyPassword, signToken, verifyToken, getBearerToken } from './auth.mjs'
import { startOutboxPublisher, startCacheInvalidationConsumer } from './outbox.mjs'
import { createSpecService } from './services/specService.mjs'
import { createFileService } from './services/fileService.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const distDir = join(__dirname, '..', 'dist')

const ok = (data) => ({ code: 200, message: 'ok', data })
const fail = (code, message) => ({ code, message, data: null })

const isE2EWhitelistEnabled = () => process.env.E2E_WHITELIST === '1'
const getE2EKey = (req) => {
  const header = req.headers?.['x-e2e-key']
  if (!header) return ''
  return Array.isArray(header) ? String(header[0] || '') : String(header || '')
}
const requireE2EKey = (req) => {
  const expected = String(process.env.E2E_KEY || '')
  if (!expected) {
    const e = new Error('e2e whitelist misconfigured')
    e.status = 500
    throw e
  }
  const got = getE2EKey(req)
  if (!got || got !== expected) {
    const e = new Error('forbidden')
    e.status = 403
    throw e
  }
}

const sendJson = (res, status, payload) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DB-DIALECT, X-E2E-KEY')
  res.end(JSON.stringify(payload))
}

const readJson = async (req) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const contentTypeByExt = (ext) => {
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
      return 'application/javascript; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.ico':
      return 'image/x-icon'
    case '.mjs':
      return 'application/javascript; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

const serveFile = async (res, filePath) => {
  const file = await readFile(filePath)
  res.statusCode = 200
  res.setHeader('Content-Type', contentTypeByExt(extname(filePath)))
  res.end(file)
}

const serveSpa = async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const pathname = decodeURIComponent(url.pathname)
    const normalized = pathname.replace(/\/+$/, '') || '/'

    const fileCandidate = normalized === '/' ? join(distDir, 'index.html') : join(distDir, normalized)
    const fileStat = await stat(fileCandidate).catch(() => null)
    if (fileStat?.isFile()) {
      await serveFile(res, fileCandidate)
      return true
    }

    const indexPath = join(distDir, 'index.html')
    const indexStat = await stat(indexPath).catch(() => null)
    if (indexStat?.isFile()) {
      await serveFile(res, indexPath)
      return true
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('dist not found, run npm run build first')
    return true
  } catch {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('server error')
    return true
  }
}

const requireAuth = async ({ req, config }) => {
  const token = getBearerToken(req)
  if (!token) {
    const e = new Error('unauthorized')
    e.status = 401
    throw e
  }
  try {
    const payload = await verifyToken({ secret: config.auth.jwtSecret, token })
    return payload
  } catch {
    const e = new Error('unauthorized')
    e.status = 401
    throw e
  }
}

const getDialectFromRequest = (req, dbManager) => {
  const header = req.headers?.['x-db-dialect']
  const value = Array.isArray(header) ? header[0] : header
  const dialect = value ? String(value) : null
  if (dialect && ['postgres', 'mysql', 'sqlite'].includes(dialect)) return dialect
  return dbManager.defaultDialect
}

export const startApp = async () => {
  const otel = await startOtel().catch(() => null)
  const config = await loadConfig()
  const metrics = createMetrics()
  const dbManager = new DataSourceManager(config)

  if (config.features.autoMigrate) {
    if (config.db.defaultDialect === 'sqlite') {
      await mkdir(dirname(config.db.sqliteFile), { recursive: true }).catch(() => {})
    }
    const targets = config.features.autoMigrateAll ? ['sqlite', 'postgres', 'mysql'] : [config.db.defaultDialect]
    for (const dialect of targets) {
      const db = dbManager.getDb(dialect)
      await runMigrations(db, dialect)
    }
  }

  let { redis, redlock } = createRedisClients(config)
  if (redis) {
    const ok = await redis
      .connect()
      .then(() => redis.ping())
      .then(() => true)
      .catch(() => false)
    if (!ok) {
      await redis.quit().catch(() => {})
      redis = null
      redlock = null
    }
  }
  const cache = createCacheAside({ redis, redlock })

  let minio = createMinio(config)
  if (minio.s3) {
    const ok = await ensureBucket(minio.s3, config.minio.bucket).then(() => true).catch(() => false)
    if (!ok) {
      minio = { s3: null }
    }
  }

  const outboxPublisher = startOutboxPublisher({ dbManager, redis, intervalMs: 500 })
  const cacheConsumer = startCacheInvalidationConsumer({ redis, cache })

  const specService = createSpecService({ dbManager, cache })
  const fileService = createFileService({ dbManager, cache, minio, config })

  const ensureDefaultAdmin = async () => {
    const db = dbManager.getDb(config.db.defaultDialect)
    const existing = await db.selectFrom('users').selectAll().where('username', '=', 'admin').executeTakeFirst()
    if (existing) return
    const password = process.env.ADMIN_PASSWORD || 'admin'
    const row = {
      id: 'admin',
      username: 'admin',
      password_hash: hashPassword(password),
      role: 'admin',
      created_at: new Date().toISOString()
    }
    await db.insertInto('users').values(row).execute()
  }

  await ensureDefaultAdmin()

  const ensureSeedSpecs = async () => {
    const db = dbManager.getDb(config.db.defaultDialect)
    const row = await db.selectFrom('specs').select((eb) => eb.fn.count('id').as('cnt')).executeTakeFirst()
    const count = Number(row?.cnt || 0)
    if (count > 0) return
    const createdAt = new Date().toISOString()
    await db
      .insertInto('specs')
      .values([
        {
          id: '1',
          name: '建筑设计防火规范',
          code: 'GB 50016-2014',
          type: 'GB',
          level: 1,
          status: 1,
          implementation_date: '2015-05-01',
          compilation_unit: '住房和城乡建设部',
          keywords: '防火,建筑',
          description: '建筑设计防火基本要求',
          uploader_user_id: 'admin',
          version: 0,
          created_at: createdAt,
          updated_at: createdAt
        },
        {
          id: '2',
          name: '混凝土结构设计规范',
          code: 'GB 50010-2010',
          type: 'GB',
          level: 1,
          status: 1,
          implementation_date: '2011-07-01',
          compilation_unit: '住房和城乡建设部',
          keywords: '混凝土,结构',
          description: '混凝土结构设计要求',
          uploader_user_id: 'admin',
          version: 0,
          created_at: createdAt,
          updated_at: createdAt
        }
      ])
      .execute()
  }

  await ensureSeedSpecs()

  const server = http.createServer(async (req, res) => {
    const start = Date.now()
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const pathname = url.pathname
    const method = req.method || 'GET'

    const routeLabel = pathname.startsWith('/api/') ? pathname : 'spa'

    if (method === 'OPTIONS') {
      res.statusCode = 204
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DB-DIALECT')
      res.end()
      return
    }

    try {
      if (method === 'GET' && pathname === '/metrics') {
        res.statusCode = 200
        res.setHeader('Content-Type', metrics.register.contentType)
        res.end(await metrics.register.metrics())
        return
      }

      if (pathname === '/api/health' && method === 'GET') {
        const dbHealth = await dbManager.health()
        const redisOk = redis ? await redis.ping().then(() => true).catch(() => false) : false
        const minioOk = Boolean(minio.s3)
        sendJson(res, 200, ok({ ok: true, db: dbHealth, redis: redisOk, minio: minioOk }))
        return
      }

      if (isE2EWhitelistEnabled() && pathname === '/api/test/whitelist/token' && method === 'POST') {
        requireE2EKey(req)
        const dialect = getDialectFromRequest(req, dbManager)
        const db = dbManager.getDb(dialect)
        const body = await readJson(req)
        const username = String(body?.username || 'e2e')
        const role = String(body?.role || 'admin')
        let user = await db.selectFrom('users').selectAll().where('username', '=', username).executeTakeFirst()
        if (!user) {
          const id = String(Date.now()) + '-' + randomUUID()
          const createdAt = new Date().toISOString()
          await db
            .insertInto('users')
            .values({
              id,
              username,
              password_hash: hashPassword(String(body?.password || 'e2e')),
              role,
              created_at: createdAt,
              updated_at: createdAt
            })
            .execute()
          user = await db.selectFrom('users').selectAll().where('username', '=', username).executeTakeFirst()
        }
        const token = await signToken({
          secret: config.auth.jwtSecret,
          ttlSeconds: config.auth.tokenTtlSeconds,
          payload: { sub: user.id, username: user.username, role: user.role }
        })
        sendJson(res, 200, ok({ token, username: user.username, role: user.role }))
        return
      }

      if (isE2EWhitelistEnabled() && pathname === '/api/test/whitelist/seed/specs' && method === 'POST') {
        requireE2EKey(req)
        const dialect = getDialectFromRequest(req, dbManager)
        const db = dbManager.getDb(dialect)
        const body = await readJson(req)
        const count = Math.min(500, Math.max(0, Number(body?.count || 0)))
        const token = String(body?.token || '')
        let actorUserId = null
        if (token) {
          const payload = await verifyToken({ secret: config.auth.jwtSecret, token }).catch(() => null)
          actorUserId = payload?.sub ? String(payload.sub) : null
        }
        const createdAt = new Date().toISOString()
        const ids = []
        for (let i = 0; i < count; i++) {
          const id = String(Date.now()) + '-' + randomUUID()
          ids.push(id)
          await db
            .insertInto('specs')
            .values({
              id,
              name: `E2E-Seed-${Date.now()}-${i}`,
              code: `E2E-${Date.now()}-${i}`,
              type: 'GB',
              level: 1,
              status: 1,
              implementation_date: null,
              compilation_unit: null,
              keywords: null,
              description: null,
              uploader_user_id: actorUserId,
              version: 0,
              created_at: createdAt,
              updated_at: createdAt
            })
            .execute()
        }
        sendJson(res, 200, ok({ ids }))
        return
      }

      if (isE2EWhitelistEnabled() && pathname === '/api/test/whitelist/process' && method === 'GET') {
        requireE2EKey(req)
        const mem = process.memoryUsage()
        const cpu = process.cpuUsage()
        sendJson(res, 200, ok({ pid: process.pid, uptimeMs: Math.floor(process.uptime() * 1000), mem, cpu }))
        return
      }

      if (pathname === '/api/debug/cache/stats' && method === 'GET') {
        sendJson(res, 200, ok(cache.stats))
        return
      }

      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await readJson(req)
        const username = String(body?.username || '')
        const password = String(body?.password || '')
        const dialect = getDialectFromRequest(req, dbManager)
        const db = dbManager.getDb(dialect)
        const user = await db.selectFrom('users').selectAll().where('username', '=', username).executeTakeFirst()
        if (!user || !verifyPassword(password, user.password_hash)) {
          sendJson(res, 200, fail(401, 'invalid credentials'))
          return
        }
        const token = await signToken({
          secret: config.auth.jwtSecret,
          ttlSeconds: config.auth.tokenTtlSeconds,
          payload: { sub: user.id, username: user.username, role: user.role }
        })
        sendJson(res, 200, ok({ token }))
        return
      }

      if (pathname === '/api/auth/me' && method === 'GET') {
        const payload = await requireAuth({ req, config })
        sendJson(res, 200, ok(payload))
        return
      }

      if (pathname === '/api/admin/datasource/switch' && method === 'POST') {
        const payload = await requireAuth({ req, config })
        if (payload.role !== 'admin') {
          sendJson(res, 200, fail(403, 'forbidden'))
          return
        }
        const body = await readJson(req)
        const dialect = String(body?.dialect || '')
        if (!['postgres', 'mysql', 'sqlite'].includes(dialect)) {
          sendJson(res, 200, fail(400, 'invalid dialect'))
          return
        }
        dbManager.setDefaultDialect(dialect)
        sendJson(res, 200, ok({ defaultDialect: dbManager.defaultDialect }))
        return
      }

      if (pathname === '/api/spec/list' && method === 'GET') {
        const dialect = getDialectFromRequest(req, dbManager)
        const page = Number(url.searchParams.get('page') || 1)
        const pageSize = Number(url.searchParams.get('pageSize') || 10)
        const safePage = Number.isFinite(page) && page > 0 ? page : 1
        const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 200 ? pageSize : 10
        const offset = (safePage - 1) * safePageSize
        const query = {
          page: safePage,
          pageSize: safePageSize,
          name: url.searchParams.get('name') || '',
          code: url.searchParams.get('code') || '',
          type: url.searchParams.get('type') || '',
          level: url.searchParams.get('level') || '',
          status: url.searchParams.get('status') || '',
          keywords: url.searchParams.get('keywords') || ''
        }
        const data = await specService.list({ dialect, query, limit: safePageSize, offset })
        sendJson(res, 200, ok(data))
        return
      }

      if (pathname === '/api/specifications/latest' && method === 'GET') {
        const dialect = getDialectFromRequest(req, dbManager)
        const data = await specService.latest({ dialect, limit: 50 })
        sendJson(res, 200, ok(data))
        return
      }

      if (pathname === '/api/specifications' && method === 'DELETE') {
        const payload = await requireAuth({ req, config })
        const dialect = getDialectFromRequest(req, dbManager)
        const body = await readJson(req)
        const ids = Array.isArray(body) ? body : Array.isArray(body?.ids) ? body.ids : []
        const result = await specService.remove({ dialect, ids, actorUserId: String(payload.sub) })
        sendJson(res, 200, ok(result))
        return
      }

      const specDetailMatch = pathname.match(/^\/api\/spec\/detail\/([^/]+)$/)
      if (specDetailMatch && method === 'GET') {
        const dialect = getDialectFromRequest(req, dbManager)
        const id = specDetailMatch[1]
        const data = await specService.detail({ dialect, id })
        if (!data) {
          sendJson(res, 200, fail(404, 'not found'))
          return
        }
        sendJson(res, 200, ok(data))
        return
      }

      if (pathname === '/api/spec/upload' && method === 'POST') {
        const payload = await requireAuth({ req, config })
        const dialect = getDialectFromRequest(req, dbManager)
        const body = await readJson(req)
        if (!body || typeof body !== 'object') {
          sendJson(res, 200, fail(400, 'invalid body'))
          return
        }
        const created = await specService.create({ dialect, input: body, actorUserId: String(payload.sub) })
        sendJson(res, 200, ok(created))
        return
      }

      const specUpdateMatch = pathname.match(/^\/api\/spec\/update\/([^/]+)$/)
      if (specUpdateMatch && method === 'POST') {
        const payload = await requireAuth({ req, config })
        const dialect = getDialectFromRequest(req, dbManager)
        const id = specUpdateMatch[1]
        const body = await readJson(req)
        const version = Number(body?.version)
        const patch = body?.patch && typeof body.patch === 'object' ? body.patch : null
        if (!Number.isFinite(version) || !patch) {
          sendJson(res, 200, fail(400, 'invalid body'))
          return
        }
        await specService.update({ dialect, id, version, patch, actorUserId: String(payload.sub) })
        sendJson(res, 200, ok({ ok: true }))
        return
      }

      if (pathname === '/api/debug/tx/rollback' && method === 'POST') {
        const payload = await requireAuth({ req, config })
        if (payload.role !== 'admin') {
          sendJson(res, 200, fail(403, 'forbidden'))
          return
        }
        const dialect = getDialectFromRequest(req, dbManager)
        const db = dbManager.getDb(dialect)
        const body = await readJson(req)
        const name = String(body?.name || '')
        const code = String(body?.code || '')
        try {
          await db.transaction().execute(async (trx) => {
            await trx
              .insertInto('specs')
              .values({
                id: String(Date.now()),
                name,
                code,
                type: 'GB',
                level: 1,
                status: 1,
                implementation_date: null,
                compilation_unit: null,
                keywords: null,
                description: null,
                version: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .execute()
            throw new Error('rollback')
          })
        } catch {
        }
        sendJson(res, 200, ok({ rolledBack: true }))
        return
      }

      if (pathname === '/api/file/upload' && method === 'POST') {
        const payload = await requireAuth({ req, config })
        const dialect = getDialectFromRequest(req, dbManager)
        if (!minio.s3) {
          sendJson(res, 200, fail(503, 'minio disabled'))
          return
        }

        const bb = Busboy({ headers: req.headers })
        let tempPath = ''
        let originalName = ''
        let mimeType = ''

        const uploadPromise = new Promise((resolve, reject) => {
          bb.on('file', async (_name, file, info) => {
            originalName = info.filename || 'file'
            mimeType = info.mimeType || 'application/octet-stream'
            const dir = join(tmpdir(), 'specmaster-uploads')
            await mkdir(dir, { recursive: true })
            tempPath = join(dir, `${randomUUID()}-${originalName}`)
            const ws = createWriteStream(tempPath)
            file.pipe(ws)
            ws.on('error', reject)
            ws.on('close', resolve)
          })
          bb.on('error', reject)
        })

        req.pipe(bb)
        await uploadPromise

        const sha256 = await sha256File(tempPath)
        const objectKey = buildObjectKey({ sha256, originalName })
        const bucket = config.minio.bucket
        const sizeBytes = await fileSize(tempPath)

        await putObjectFromFile({ s3: minio.s3, bucket, filePath: tempPath, objectKey, mimeType })
        const meta = await fileService.uploadMetadata({
          dialect,
          meta: { sha256, bucket, objectKey, originalName, sizeBytes, mimeType, visibility: 'private' },
          actorUserId: String(payload.sub)
        })

        const url = await import('./storage/minio.mjs').then((m) =>
          m.presignGetObjectUrl({
            s3: minio.s3,
            bucket,
            objectKey,
            expiresSeconds: config.minio.presignExpiresSeconds,
            publicBaseUrl: config.minio.publicBaseUrl
          })
        )

        await cleanupTempFile(tempPath)
        sendJson(res, 200, ok({ meta, url }))
        return
      }

      if (pathname === '/api/file/list' && method === 'GET') {
        await requireAuth({ req, config })
        const dialect = getDialectFromRequest(req, dbManager)
        const query = {
          page: Number(url.searchParams.get('page') || 1),
          pageSize: Number(url.searchParams.get('pageSize') || 20),
          name: url.searchParams.get('name') || ''
        }
        const data = await fileService.list({ dialect, query })
        sendJson(res, 200, ok(data))
        return
      }

      const filePresignMatch = pathname.match(/^\/api\/file\/presign\/([^/]+)$/)
      if (filePresignMatch && method === 'GET') {
        await requireAuth({ req, config })
        const dialect = getDialectFromRequest(req, dbManager)
        if (!minio.s3) {
          sendJson(res, 200, fail(503, 'minio disabled'))
          return
        }
        const id = filePresignMatch[1]
        const data = await fileService.presignGetUrl({ dialect, id })
        if (!data) {
          sendJson(res, 200, fail(404, 'not found'))
          return
        }
        sendJson(res, 200, ok(data))
        return
      }

      const fileContentMatch = pathname.match(/^\/api\/file\/content\/([^/]+)$/)
      if (fileContentMatch && method === 'GET') {
        try {
          await requireAuth({ req, config })
        } catch {
          res.statusCode = 401
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('unauthorized')
          return
        }
        const dialect = getDialectFromRequest(req, dbManager)
        if (!minio.s3) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('minio disabled')
          return
        }
        const id = fileContentMatch[1]
        const data = await fileService.getContentStream({ dialect, id }).catch(() => null)
        if (!data) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('not found')
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', data.meta?.mime_type || 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(String(data.meta?.original_name || 'document.pdf'))}"`)
        data.stream.pipe(res)
        return
      }

      const cmapMatch = pathname.match(/^\/api\/pdfjs\/cmaps\/([^/]+)$/)
      if (cmapMatch && method === 'GET') {
        const fileName = decodeURIComponent(String(cmapMatch[1] || ''))
        if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\') || !fileName.endsWith('.bcmap')) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('bad request')
          return
        }
        const filePath = join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'cmaps', fileName)
        const buf = await readFile(filePath).catch(() => null)
        if (!buf) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('not found')
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        res.end(buf)
        return
      }

      const stdFontMatch = pathname.match(/^\/api\/pdfjs\/standard_fonts\/([^/]+)$/)
      if (stdFontMatch && method === 'GET') {
        const fileName = decodeURIComponent(String(stdFontMatch[1] || ''))
        if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('bad request')
          return
        }
        const filePath = join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'standard_fonts', fileName)
        const buf = await readFile(filePath).catch(() => null)
        if (!buf) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('not found')
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        res.end(buf)
        return
      }

      if (pathname.startsWith('/api/')) {
        sendJson(res, 200, fail(404, 'not found'))
        return
      }

      await serveSpa(req, res)
    } catch (e) {
      const status = e?.status || (e?.code === 'CONFLICT' ? 409 : 500)
      sendJson(res, 200, fail(status, e?.message || 'error'))
    } finally {
      const status = String(res.statusCode || 200)
      const duration = Date.now() - start
      metrics.httpRequestsTotal.labels(method, routeLabel, status).inc()
      metrics.httpRequestDurationMs.labels(method, routeLabel, status).observe(duration)
    }
  })

  await new Promise((resolve) => server.listen(config.port, config.host, resolve))
  process.stdout.write(`server listening on http://localhost:${config.port}\n`)

  return {
    config,
    stop: async () => {
      outboxPublisher.stop()
      cacheConsumer.stop()
      if (redis) await redis.quit().catch(() => {})
      await dbManager.destroy()
      await new Promise((resolve) => server.close(resolve))
      if (otel) await otel.stop().catch(() => {})
    }
  }
}

