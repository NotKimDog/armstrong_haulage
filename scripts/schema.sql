-- Armstrong Haulage Database Schema for Cloudflare D1
-- Initialize with: wrangler d1 execute armstrong-haulage --file ./scripts/schema.sql

-- Users Table: Core user information
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  displayName TEXT,
  photoURL TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  bannerURL TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Settings Table: App preferences and privacy settings
CREATE TABLE IF NOT EXISTS user_settings (
  userId TEXT PRIMARY KEY,
  emailNotifications BOOLEAN DEFAULT true,
  pushNotifications BOOLEAN DEFAULT false,
  marketingEmails BOOLEAN DEFAULT false,
  publicProfile BOOLEAN DEFAULT true,
  showStats BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'dark',
  accentColor TEXT DEFAULT 'blue',
  showUserId BOOLEAN DEFAULT false,
  showEmail BOOLEAN DEFAULT false,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_settings_user FOREIGN KEY(userId) REFERENCES users(id)
);

-- User Stats Table: Driver statistics and metrics
CREATE TABLE IF NOT EXISTS user_stats (
  userId TEXT PRIMARY KEY,
  distance REAL DEFAULT 0,
  deliveries INTEGER DEFAULT 0,
  earnings REAL DEFAULT 0,
  rating REAL DEFAULT 0,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_stats_user FOREIGN KEY(userId) REFERENCES users(id)
);

-- Auth Sessions Table: Active user sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_user FOREIGN KEY(userId) REFERENCES users(id)
);

-- Files/Media Table: Track uploaded files
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  key TEXT NOT NULL,
  fileName TEXT,
  mimeType TEXT,
  size INTEGER,
  url TEXT,
  uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_files_user FOREIGN KEY(userId) REFERENCES users(id)
);

-- Audit Log Table: Track user actions for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  userId TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  resourceId TEXT,
  changes TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_logs_user FOREIGN KEY(userId) REFERENCES users(id)
);

-- Indices for Performance

-- User lookup by email (authentication)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Session token lookup (authentication)
CREATE INDEX IF NOT EXISTS idx_sessions_token ON auth_sessions(token);

-- Session expiry cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON auth_sessions(expiresAt);

-- File lookups by user
CREATE INDEX IF NOT EXISTS idx_files_userId ON files(userId);

-- Audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_userId ON audit_logs(userId);
CREATE INDEX IF NOT EXISTS idx_audit_createdAt ON audit_logs(createdAt);

-- Settings lookups
CREATE INDEX IF NOT EXISTS idx_settings_userId ON user_settings(userId);

-- Stats lookups
CREATE INDEX IF NOT EXISTS idx_stats_userId ON user_stats(userId);
