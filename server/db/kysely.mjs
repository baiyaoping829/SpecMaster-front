import { Kysely } from 'kysely'
import { PostgresDialect } from 'kysely'
import { MysqlDialect } from 'kysely'
import { SqliteDialect } from 'kysely'
import pg from 'pg'
import mysql from 'mysql2'
import Database from 'better-sqlite3'

export const createKysely = ({ dialect, sqliteFile, pg: pgConfig, mysql: mysqlConfig }) => {
  if (dialect === 'postgres') {
    const pool = new pg.Pool({
      host: pgConfig.host,
      port: pgConfig.port,
      database: pgConfig.database,
      user: pgConfig.user,
      password: pgConfig.password,
      ssl: pgConfig.ssl ? { rejectUnauthorized: false } : undefined
    })
    return new Kysely({
      dialect: new PostgresDialect({ pool })
    })
  }

  if (dialect === 'mysql') {
    const pool = mysql.createPool({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      database: mysqlConfig.database,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      connectionLimit: 10,
      waitForConnections: true
    })
    return new Kysely({
      dialect: new MysqlDialect({ pool })
    })
  }

  const db = new Database(sqliteFile)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return new Kysely({
    dialect: new SqliteDialect({ database: db })
  })
}

