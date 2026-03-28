PRAGMA foreign_keys = ON;

create table if not exists accident_cases (
  id varchar(64) primary key,
  title varchar(256) not null,
  content text not null,
  attachment_keys text not null default '[]',
  version integer not null default 0,
  created_at varchar(32) not null,
  updated_at varchar(32) not null,
  deleted_at varchar(32) null
);

create table if not exists accident_spec_refs (
  id varchar(64) primary key,
  accident_id varchar(64) not null,
  spec_id varchar(64) not null,
  created_at varchar(32) not null,
  deleted_at varchar(32) null,
  foreign key (accident_id) references accident_cases(id) on delete cascade,
  foreign key (spec_id) references specs(id) on delete cascade
);

create index if not exists idx_accident_cases_created_at on accident_cases(created_at);
create index if not exists idx_accident_cases_deleted_at on accident_cases(deleted_at);
create index if not exists idx_accident_spec_refs_accident_id on accident_spec_refs(accident_id);
create index if not exists idx_accident_spec_refs_spec_id on accident_spec_refs(spec_id);
create index if not exists idx_accident_spec_refs_deleted_at on accident_spec_refs(deleted_at);

