import { readFile } from 'node:fs/promises'

const parseBool = (value, fallback = false) => {
  if (value == null) return fallback
  const v = String(value).toLowerCase()
  if (v === '1' || v === 'true' || v === 'yes') return true
  if (v === '0' || v === 'false' || v === 'no') return false
  return fallback
}

const parseIntSafe = (value, fallback) => {
  if (value == null) return fallback
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : fallback
}

const loadJsonEnv = async (value) => {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed)
  }
  const raw = await readFile(trimmed, 'utf8')
  return JSON.parse(raw)
}

export const loadConfig = async () => {
  const port = parseIntSafe(process.env.PORT, 3001)
  const host = process.env.HOST || '0.0.0.0'

  const datasources = (await loadJsonEnv(process.env.DATASOURCES_JSON)) || null

  const defaultDialect = process.env.DB_DIALECT || 'sqlite'
  const sqliteFile = process.env.SQLITE_FILE || 'server/dev.sqlite'

  const pg = {
    host: process.env.PG_HOST || '127.0.0.1',
    port: parseIntSafe(process.env.PG_PORT, 5432),
    database: process.env.PG_DATABASE || 'specmaster',
    user: process.env.PG_USER || 'specmaster_rw',
    password: process.env.PG_PASSWORD || 'specmaster',
    ssl: parseBool(process.env.PG_SSL, false)
  }

  const mysql = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseIntSafe(process.env.MYSQL_PORT, 3306),
    database: process.env.MYSQL_DATABASE || 'specmaster',
    user: process.env.MYSQL_USER || 'specmaster_rw',
    password: process.env.MYSQL_PASSWORD || 'specmaster'
  }

  const redis = {
    enabled: parseBool(process.env.REDIS_ENABLED, true),
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    tls: parseBool(process.env.REDIS_TLS, false)
  }

  const minio = {
    enabled: parseBool(process.env.MINIO_ENABLED, true),
    endpoint: process.env.MINIO_ENDPOINT || 'http://127.0.0.1:9000',
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'specmaster-docs',
    region: process.env.MINIO_REGION || 'us-east-1',
    publicBaseUrl: process.env.MINIO_PUBLIC_BASE_URL || '',
    presignExpiresSeconds: parseIntSafe(process.env.MINIO_PRESIGN_EXPIRES_SECONDS, 300)
  }

  const auth = {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    tokenTtlSeconds: parseIntSafe(process.env.JWT_TTL_SECONDS, 3600)
  }

  const db = {
    defaultDialect,
    sqliteFile,
    pg,
    mysql,
    readIsolationLevel: process.env.DB_READ_ISOLATION || 'read committed'
  }

  const features = {
    autoMigrate: parseBool(process.env.AUTO_MIGRATE, true),
    autoMigrateAll: parseBool(process.env.AUTO_MIGRATE_ALL, false)
  }

  return { port, host, datasources, db, redis, minio, auth, features }
}

