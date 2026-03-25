import { sql } from 'kysely'
import { createKysely } from './kysely.mjs'

export class DataSourceManager {
  constructor(config) {
    this.config = config
    this.instances = new Map()
    this.defaultDialect = config.db.defaultDialect
    this.readIsolationLevel = config.db.readIsolationLevel

    const configured = Array.isArray(config.datasources) ? config.datasources : null
    if (configured?.length) {
      for (const ds of configured) {
        if (!ds?.dialect) continue
        this.instances.set(ds.dialect, createKysely({ dialect: ds.dialect, ...this._dialectConfig(ds.dialect, ds) }))
      }
    } else {
      this.instances.set(
        this.defaultDialect,
        createKysely({
          dialect: this.defaultDialect,
          sqliteFile: config.db.sqliteFile,
          pg: config.db.pg,
          mysql: config.db.mysql
        })
      )
      this.instances.set(
        'postgres',
        createKysely({ dialect: 'postgres', sqliteFile: config.db.sqliteFile, pg: config.db.pg, mysql: config.db.mysql })
      )
      this.instances.set('mysql', createKysely({ dialect: 'mysql', sqliteFile: config.db.sqliteFile, pg: config.db.pg, mysql: config.db.mysql }))
      this.instances.set(
        'sqlite',
        createKysely({ dialect: 'sqlite', sqliteFile: config.db.sqliteFile, pg: config.db.pg, mysql: config.db.mysql })
      )
    }
  }

  _dialectConfig(dialect, ds) {
    if (dialect === 'sqlite') {
      return { sqliteFile: ds.sqliteFile || this.config.db.sqliteFile, pg: this.config.db.pg, mysql: this.config.db.mysql }
    }
    if (dialect === 'postgres') {
      return { sqliteFile: this.config.db.sqliteFile, pg: { ...this.config.db.pg, ...(ds.pg || {}) }, mysql: this.config.db.mysql }
    }
    if (dialect === 'mysql') {
      return { sqliteFile: this.config.db.sqliteFile, pg: this.config.db.pg, mysql: { ...this.config.db.mysql, ...(ds.mysql || {}) } }
    }
    return { sqliteFile: this.config.db.sqliteFile, pg: this.config.db.pg, mysql: this.config.db.mysql }
  }

  setDefaultDialect(dialect) {
    if (!this.instances.has(dialect)) throw new Error(`unknown dialect: ${dialect}`)
    this.defaultDialect = dialect
  }

  getDb(dialect) {
    const key = dialect || this.defaultDialect
    const db = this.instances.get(key)
    if (!db) throw new Error(`db not configured: ${key}`)
    return db
  }

  async ping(dialect) {
    const db = this.getDb(dialect)
    await sql`select 1`.execute(db)
    return true
  }

  async health() {
    const results = []
    for (const [dialect, db] of this.instances.entries()) {
      try {
        await sql`select 1`.execute(db)
        results.push({ dialect, ok: true })
      } catch {
        results.push({ dialect, ok: false })
      }
    }
    return results
  }

  async destroy() {
    for (const db of this.instances.values()) {
      await db.destroy()
    }
  }
}

