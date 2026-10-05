CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')), created_at TEXT NOT NULL, reviewed_at TEXT);
CREATE INDEX IF NOT EXISTS posts_status_created ON posts(status,created_at);
CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 1);
CREATE INDEX IF NOT EXISTS rates_day ON rate_limits(day);
