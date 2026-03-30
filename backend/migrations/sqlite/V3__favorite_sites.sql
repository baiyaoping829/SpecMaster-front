CREATE TABLE IF NOT EXISTS favorite_sites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  site_url TEXT NOT NULL,
  site_name TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite_sites_user_url ON favorite_sites(user_id, site_url);
CREATE INDEX IF NOT EXISTS idx_favorite_sites_user_id ON favorite_sites(user_id);

