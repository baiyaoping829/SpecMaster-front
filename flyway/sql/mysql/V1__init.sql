create table if not exists users (
  id varchar(64) primary key,
  username varchar(128) unique not null,
  password_hash varchar(512) not null,
  role varchar(64) not null,
  created_at datetime(3) not null
) engine=InnoDB;

create table if not exists specs (
  id varchar(64) primary key,
  name varchar(256) not null,
  code varchar(128) not null,
  type varchar(32) not null,
  level int not null,
  status int not null,
  implementation_date varchar(32),
  compilation_unit varchar(256),
  keywords varchar(512),
  description text,
  uploader_user_id varchar(64),
  file_object_id varchar(64),
  version int not null default 0,
  created_at datetime(3) not null,
  updated_at datetime(3) not null
) engine=InnoDB;

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
  version int not null default 0,
  created_at datetime(3) not null,
  deleted_at datetime(3) null,
  index idx_file_objects_sha256 (sha256),
  index idx_file_objects_created_at (created_at)
) engine=InnoDB;

create table if not exists outbox_events (
  id varchar(64) primary key,
  event_type varchar(128) not null,
  aggregate_type varchar(64) not null,
  aggregate_id varchar(64) not null,
  payload text not null,
  status varchar(32) not null,
  created_at datetime(3) not null,
  index idx_outbox_status_created_at (status, created_at)
) engine=InnoDB;
