-- NATHA META OS — D1 foundation schema
-- Tokens are encrypted by the Worker before insertion. Never store plaintext tokens.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  email_verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','agent','viewer')),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('meta_instagram')),
  redirect_uri TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS instagram_accounts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  account_type TEXT,
  token_ciphertext TEXT NOT NULL,
  token_iv TEXT NOT NULL,
  token_key_version INTEGER NOT NULL DEFAULT 1,
  token_expires_at INTEGER,
  scopes_json TEXT NOT NULL DEFAULT '[]',
  connected_by TEXT NOT NULL REFERENCES users(id),
  connected_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (workspace_id, instagram_user_id)
);
CREATE INDEX IF NOT EXISTS idx_ig_accounts_workspace ON instagram_accounts(workspace_id);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  instagram_account_id TEXT NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  platform_conversation_id TEXT NOT NULL,
  participant_id TEXT,
  participant_username TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','closed')),
  assigned_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  last_message_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (instagram_account_id, platform_conversation_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_updated ON conversations(workspace_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  platform_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  sender_id TEXT,
  message_text TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'received' CHECK (delivery_status IN ('received','queued','sent','failed')),
  is_ai_generated INTEGER NOT NULL DEFAULT 0 CHECK (is_ai_generated IN (0,1)),
  created_at INTEGER NOT NULL,
  UNIQUE (conversation_id, platform_message_id)
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS reply_settings (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  instagram_account_id TEXT NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  ai_enabled INTEGER NOT NULL DEFAULT 0 CHECK (ai_enabled IN (0,1)),
  approval_required INTEGER NOT NULL DEFAULT 1 CHECK (approval_required IN (0,1)),
  tone TEXT NOT NULL DEFAULT 'friendly',
  language TEXT NOT NULL DEFAULT 'auto',
  business_hours_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT REFERENCES users(id),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (workspace_id, instagram_account_id)
);

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual','url','faq')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledge_workspace ON knowledge_sources(workspace_id, is_active);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_workspace_time ON audit_events(workspace_id, created_at DESC);
