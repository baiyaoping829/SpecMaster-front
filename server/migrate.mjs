import { sql } from 'kysely'

const tableDdl = [
  sql`create table if not exists users (
    id varchar(64) primary key,
    username varchar(128) unique not null,
    password_hash varchar(512) not null,
    role varchar(64) not null,
    created_at varchar(32) not null
  )`,
  sql`create table if not exists specs (
    id varchar(64) primary key,
    name varchar(256) not null,
    code varchar(128) not null,
    type varchar(32) not null,
    level integer not null,
    status integer not null,
    implementation_date varchar(32),
    compilation_unit varchar(256),
    keywords varchar(512),
    description text,
    uploader_user_id varchar(64),
    file_object_id varchar(64),
    version integer not null default 0,
    created_at varchar(32) not null,
    updated_at varchar(32) not null
  )`,
  sql`create table if not exists file_objects (
    id varchar(64) primary key,
    sha256 varchar(64) not null,
    bucket varchar(128) not null,
    object_key varchar(512) not null,
    original_name varchar(512) not null,
    size_bytes bigint not null,
    mime_type varchar(256) not null,
    uploader_user_id varchar(64) not null,
    visibility varchar(32) not null,
    version integer not null default 0,
    created_at varchar(32) not null,
    deleted_at varchar(32)
  )`,
  sql`create table if not exists outbox_events (
    id varchar(64) primary key,
    event_type varchar(128) not null,
    aggregate_type varchar(64) not null,
    aggregate_id varchar(64) not null,
    payload text not null,
    status varchar(32) not null,
    created_at varchar(32) not null
  )`
]

const indexDdl = {
  sqlite: [
    sql`create index if not exists idx_file_objects_sha256 on file_objects (sha256)`,
    sql`create index if not exists idx_file_objects_created_at on file_objects (created_at)`,
    sql`create index if not exists idx_outbox_status_created_at on outbox_events (status, created_at)`
  ],
  postgres: [
    sql`create index if not exists idx_file_objects_sha256 on file_objects (sha256)`,
    sql`create index if not exists idx_file_objects_created_at on file_objects (created_at)`,
    sql`create index if not exists idx_outbox_status_created_at on outbox_events (status, created_at)`
  ],
  mysql: [
    sql`create index idx_file_objects_sha256 on file_objects (sha256)`,
    sql`create index idx_file_objects_created_at on file_objects (created_at)`,
    sql`create index idx_outbox_status_created_at on outbox_events (status, created_at)`
  ]
}

export const runMigrations = async (db, dialect = 'sqlite') => {
  for (const stmt of tableDdl) {
    await stmt.execute(db)
  }

  const alterDdl =
    dialect === 'mysql'
      ? [
          sql`alter table users modify created_at varchar(32) not null`,
          sql`alter table specs modify created_at varchar(32) not null`,
          sql`alter table specs modify updated_at varchar(32) not null`,
          sql`alter table specs add column uploader_user_id varchar(64) null`,
          sql`alter table specs add column file_object_id varchar(64) null`,
          sql`alter table file_objects modify created_at varchar(32) not null`,
          sql`alter table file_objects modify deleted_at varchar(32) null`,
          sql`alter table outbox_events modify created_at varchar(32) not null`
        ]
      : dialect === 'postgres'
        ? [
            sql`alter table users alter column created_at type varchar(32)`,
            sql`alter table specs alter column created_at type varchar(32)`,
            sql`alter table specs alter column updated_at type varchar(32)`,
            sql`alter table specs add column if not exists uploader_user_id varchar(64)`,
            sql`alter table specs add column if not exists file_object_id varchar(64)`,
            sql`alter table file_objects alter column created_at type varchar(32)`,
            sql`alter table file_objects alter column deleted_at type varchar(32)`,
            sql`alter table outbox_events alter column created_at type varchar(32)`
          ]
        : [sql`alter table specs add column uploader_user_id varchar(64)`, sql`alter table specs add column file_object_id varchar(64)`]

  for (const stmt of alterDdl) {
    try {
      await stmt.execute(db)
    } catch {
    }
  }

  const idx = indexDdl[dialect] || []
  for (const stmt of idx) {
    try {
      await stmt.execute(db)
    } catch (e) {
      if (dialect === 'mysql' && (e?.code === 'ER_DUP_KEYNAME' || String(e?.message || '').includes('Duplicate key name'))) {
        continue
      }
      throw e
    }
  }
}

