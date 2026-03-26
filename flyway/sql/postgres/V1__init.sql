create table if not exists users (
  id varchar(64) primary key,
  username varchar(128) unique not null,
  password_hash varchar(512) not null,
  role varchar(64) not null,
  created_at timestamptz not null
);

create table if not exists specs (
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
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists file_objects (
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
  created_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_file_objects_sha256 on file_objects (sha256);
create index if not exists idx_file_objects_created_at on file_objects (created_at);

create table if not exists outbox_events (
  id varchar(64) primary key,
  event_type varchar(128) not null,
  aggregate_type varchar(64) not null,
  aggregate_id varchar(64) not null,
  payload text not null,
  status varchar(32) not null,
  created_at timestamptz not null
);

create index if not exists idx_outbox_status_created_at on outbox_events (status, created_at);
