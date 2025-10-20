-- Initial database schema for Online Developer Tools Platform
-- Version: 1.0
-- Date: 2025-10-09

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  preferences TEXT, -- JSON string
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

-- Auth identities table
CREATE TABLE IF NOT EXISTS auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github', 'oauth2')),
  provider_uid TEXT NOT NULL,
  provider_data TEXT, -- JSON string
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_uid)
);

-- Indexes for auth_identities
CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id ON auth_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_identities_provider ON auth_identities(provider);

-- Tools table
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('json', 'formatting', 'execution', 'text', 'image', 'network', 'crypto')),
  description TEXT,
  config TEXT NOT NULL, -- JSON string
  enabled BOOLEAN DEFAULT true,
  beta BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for tools
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_enabled ON tools(enabled);
CREATE INDEX IF NOT EXISTS idx_tools_sort ON tools(sort_order);
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);

-- Tool usage table
CREATE TABLE IF NOT EXISTS tool_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  tool_id TEXT NOT NULL,
  input_size INTEGER DEFAULT 0,
  output_size INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tool_id) REFERENCES tools(id)
);

-- Indexes for tool_usage
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created_at ON tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_tool_usage_status ON tool_usage(status);
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_date ON tool_usage(user_id, created_at);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  tool_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_data TEXT, -- JSON string
  output_data TEXT, -- JSON string
  input_ref TEXT,
  output_ref TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tool_id) REFERENCES tools(id)
);

-- Indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_tool_id ON jobs(tool_id);
CREATE INDEX IF NOT EXISTS idx_jobs_pending ON jobs(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_running ON jobs(status, started_at) WHERE status = 'running';

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  r2_key TEXT NOT NULL,
  checksum TEXT, -- SHA-256 hash
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'completed', 'expired', 'failed')),
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for file_uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status);
CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_r2_key ON file_uploads(r2_key);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);

-- Quota counters table
CREATE TABLE IF NOT EXISTS quota_counters (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  quota_type TEXT NOT NULL CHECK (quota_type IN ('api_requests', 'file_uploads', 'execution_time', 'bandwidth', 'storage', 'jobs_per_hour', 'file_size')),
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
  limit_count INTEGER NOT NULL CHECK (limit_count > 0),
  ip_address TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, quota_type, period_start, ip_address)
);

-- Indexes for quota_counters
CREATE INDEX IF NOT EXISTS idx_quota_counters_user_id ON quota_counters(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_counters_period ON quota_counters(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_quota_counters_type ON quota_counters(quota_type);
CREATE INDEX IF NOT EXISTS idx_quota_counters_ip_address ON quota_counters(ip_address);
CREATE INDEX IF NOT EXISTS idx_quota_counters_expires ON quota_counters(period_end);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'register', 'tool_execute', 'file_upload', 'file_download', 'job_create', 'job_complete', 'job_fail', 'quota_exceeded', 'auth_failure', 'permission_denied', 'admin_action', 'data_export', 'data_delete', 'config_change', 'api_access', 'rate_limit_hit', 'security_event', 'error_occurred')),
  resource_type TEXT CHECK (resource_type IN ('user', 'auth_identity', 'tool', 'tool_usage', 'job', 'file_upload', 'quota_counter', 'session', 'api_key', 'system_config', 'admin_log')),
  resource_id TEXT,
  old_values TEXT, -- JSON string
  new_values TEXT, -- JSON string
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Insert default tools
INSERT OR IGNORE INTO tools (id, slug, name, category, description, config, enabled, beta, sort_order, created_at, updated_at) VALUES
-- JSON Tools
('550e8400-e29b-41d4-a716-446655440001', 'json-format', 'JSON Formatter', 'json', 'Format and pretty-print JSON data', '{"inputSchema":{"type":"object","properties":{"json":{"type":"string","description":"JSON string to format"},"indent":{"type":"number","default":2,"description":"Indentation spaces"},"sort_keys":{"type":"boolean","default":false,"description":"Sort object keys alphabetically"}},"required":["json"]},"outputSchema":{"type":"object","properties":{"formatted":{"type":"string","description":"Formatted JSON string"},"valid":{"type":"boolean","description":"Whether input was valid JSON"},"errors":{"type":"array","items":{"type":"string"},"description":"Validation errors if any"}}},"executionMode":"sync","quotas":{"maxInputSize":1048576,"maxExecutionTime":1000,"requiresAuth":false}}', true, false, 1, strftime('%s', 'now'), strftime('%s', 'now')),

('550e8400-e29b-41d4-a716-446655440002', 'json-validate', 'JSON Validator', 'json', 'Validate JSON data against schema', '{"inputSchema":{"type":"object","properties":{"json":{"type":"string","description":"JSON string to validate"},"schema":{"type":"object","description":"JSON schema to validate against"}},"required":["json"]},"outputSchema":{"type":"object","properties":{"valid":{"type":"boolean","description":"Whether JSON is valid"},"errors":{"type":"array","items":{"type":"string"},"description":"Validation errors"}}},"executionMode":"sync","quotas":{"maxInputSize":1048576,"maxExecutionTime":2000,"requiresAuth":false}}', true, false, 2, strftime('%s', 'now'), strftime('%s', 'now')),

('550e8400-e29b-41d4-a716-446655440003', 'json-convert', 'JSON Converter', 'json', 'Convert JSON to other formats', '{"inputSchema":{"type":"object","properties":{"json":{"type":"string","description":"JSON string to convert"},"format":{"type":"string","enum":["xml","csv","yaml","properties"],"description":"Target format"}},"required":["json","format"]},"outputSchema":{"type":"object","properties":{"converted":{"type":"string","description":"Converted data"},"format":{"type":"string","description":"Output format"},"errors":{"type":"array","items":{"type":"string"},"description":"Conversion errors if any"}}},"executionMode":"sync","quotas":{"maxInputSize":1048576,"maxExecutionTime":3000,"requiresAuth":false}}', true, false, 3, strftime('%s', 'now'), strftime('%s', 'now')),

-- Code Tools
('550e8400-e29b-41d4-a716-446655440004', 'code-execute', 'Code Executor', 'execution', 'Execute code in various programming languages', '{"inputSchema":{"type":"object","properties":{"code":{"type":"string","description":"Code to execute"},"language":{"type":"string","enum":["javascript","typescript","python"],"description":"Programming language"},"input":{"type":"string","description":"Standard input for the code"},"timeout":{"type":"number","default":5000,"description":"Execution timeout in milliseconds"}},"required":["code","language"]},"outputSchema":{"type":"object","properties":{"output":{"type":"string","description":"Program output"},"error":{"type":"string","description":"Error output if any"},"exit_code":{"type":"number","description":"Program exit code"},"execution_time":{"type":"number","description":"Execution time in milliseconds"},"memory_usage":{"type":"number","description":"Memory usage in bytes"}}},"executionMode":"async","quotas":{"maxInputSize":102400,"maxExecutionTime":10000,"requiresAuth":true}}', true, false, 10, strftime('%s', 'now'), strftime('%s', 'now')),

('550e8400-e29b-41d4-a716-446655440005', 'code-format', 'Code Formatter', 'formatting', 'Format code according to language standards', '{"inputSchema":{"type":"object","properties":{"code":{"type":"string","description":"Code to format"},"language":{"type":"string","enum":["javascript","typescript","python"],"description":"Programming language"},"options":{"type":"object","description":"Formatting options"}},"required":["code","language"]},"outputSchema":{"type":"object","properties":{"formatted":{"type":"string","description":"Formatted code"},"language":{"type":"string","description":"Code language"},"options":{"type":"object","description":"Applied formatting options"}}},"executionMode":"sync","quotas":{"maxInputSize":1048576,"maxExecutionTime":2000,"requiresAuth":false}}', true, false, 11, strftime('%s', 'now'), strftime('%s', 'now'));

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tools_updated_at
  AFTER UPDATE ON tools
  FOR EACH ROW
  BEGIN
    UPDATE tools SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS jobs_updated_at
  AFTER UPDATE ON jobs
  FOR EACH ROW
  BEGIN
    UPDATE jobs SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS quota_counters_updated_at
  AFTER UPDATE ON quota_counters
  FOR EACH ROW
  BEGIN
    UPDATE quota_counters SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
  END;

-- Create views for common queries
CREATE VIEW IF NOT EXISTS user_tool_usage_stats AS
SELECT
  u.id as user_id,
  u.email,
  t.id as tool_id,
  t.name as tool_name,
  COUNT(tu.id) as usage_count,
  AVG(tu.execution_time_ms) as avg_execution_time,
  SUM(tu.input_size) as total_input_size,
  SUM(tu.output_size) as total_output_size,
  MAX(tu.created_at) as last_used
FROM users u
JOIN tool_usage tu ON u.id = tu.user_id
JOIN tools t ON tu.tool_id = t.id
WHERE tu.created_at >= strftime('%s', 'now', '-30 days')
GROUP BY u.id, t.id;

CREATE VIEW IF NOT EXISTS tool_performance_stats AS
SELECT
  t.id as tool_id,
  t.name as tool_name,
  t.category,
  COUNT(tu.id) as total_usage,
  COUNT(CASE WHEN tu.status = 'success' THEN 1 END) as successful_usage,
  COUNT(CASE WHEN tu.status = 'error' THEN 1 END) as failed_usage,
  COUNT(CASE WHEN tu.status = 'timeout' THEN 1 END) as timeout_usage,
  AVG(tu.execution_time_ms) as avg_execution_time,
  MAX(tu.execution_time_ms) as max_execution_time,
  AVG(tu.input_size) as avg_input_size,
  AVG(tu.output_size) as avg_output_size
FROM tools t
LEFT JOIN tool_usage tu ON t.id = tu.tool_id
WHERE tu.created_at >= strftime('%s', 'now', '-7 days')
GROUP BY t.id, t.name, t.category;

CREATE VIEW IF NOT EXISTS job_stats AS
SELECT
  t.id as tool_id,
  t.name as tool_name,
  COUNT(j.id) as total_jobs,
  COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_jobs,
  COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as failed_jobs,
  COUNT(CASE WHEN j.status = 'running' THEN 1 END) as running_jobs,
  COUNT(CASE WHEN j.status = 'pending' THEN 1 END) as pending_jobs,
  AVG(CASE WHEN j.completed_at IS NOT NULL AND j.started_at IS NOT NULL THEN (j.completed_at - j.started_at) END) as avg_duration,
  MAX(j.created_at) as last_job_created
FROM tools t
LEFT JOIN jobs j ON t.id = j.tool_id
GROUP BY t.id, t.name;

-- Create stored procedures for common operations
-- Note: SQLite doesn't support stored procedures in the same way as other databases
-- These are implemented as application logic instead

-- Database optimization settings
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456; -- 256MB

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE auth_identities IS 'External authentication provider identities';
COMMENT ON TABLE tools IS 'Available developer tools and their configurations';
COMMENT ON TABLE tool_usage IS 'Tool usage analytics and metrics';
COMMENT ON TABLE jobs IS 'Asynchronous job processing records';
COMMENT ON TABLE file_uploads IS 'File upload tracking and metadata';
COMMENT ON TABLE quota_counters IS 'Rate limiting and quota enforcement';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';

-- Migration completed
-- Version: 001_initial
-- Created: 2025-10-09
-- Description: Initial database schema for MVP release