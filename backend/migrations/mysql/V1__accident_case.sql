create table if not exists accident_cases (
  id varchar(64) primary key,
  title varchar(256) not null,
  content longtext not null,
  attachment_keys longtext not null,
  version int not null default 0,
  created_at varchar(32) not null,
  updated_at varchar(32) not null,
  deleted_at varchar(32) null,
  index idx_accident_cases_created_at (created_at),
  index idx_accident_cases_deleted_at (deleted_at)
) engine=InnoDB;

create table if not exists accident_spec_refs (
  id varchar(64) primary key,
  accident_id varchar(64) not null,
  spec_id varchar(64) not null,
  created_at varchar(32) not null,
  deleted_at varchar(32) null,
  index idx_accident_spec_refs_accident_id (accident_id),
  index idx_accident_spec_refs_spec_id (spec_id),
  index idx_accident_spec_refs_deleted_at (deleted_at),
  constraint fk_accident_spec_refs_accident_id foreign key (accident_id) references accident_cases(id) on delete cascade,
  constraint fk_accident_spec_refs_spec_id foreign key (spec_id) references specs(id) on delete cascade
) engine=InnoDB;

