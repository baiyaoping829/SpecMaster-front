CREATE TABLE IF NOT EXISTS favorite_sites (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  site_url VARCHAR(2048) NOT NULL,
  site_name VARCHAR(256) NOT NULL DEFAULT '',
  tags TEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  deleted_at VARCHAR(32) NULL,
  UNIQUE KEY uq_favorite_sites_user_url (user_id, site_url),
  KEY idx_favorite_sites_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

