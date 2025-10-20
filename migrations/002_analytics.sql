-- Analytics Database Schema
-- Migration: 002_analytics.sql
-- Description: Add tables for Cloudflare Analytics data storage

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  url TEXT NOT NULL,
  user_agent TEXT,
  user_id TEXT,
  session_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON data
  properties TEXT, -- JSON properties
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for performance
  INDEX idx_analytics_events_timestamp (timestamp),
  INDEX idx_analytics_events_name (name),
  INDEX idx_analytics_events_user_id (user_id),
  INDEX idx_analytics_events_session_id (session_id),
  INDEX idx_analytics_events_url (url),
  INDEX idx_analytics_events_composite (name, timestamp)
);

-- Analytics sessions table
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  start_time DATETIME NOT NULL,
  last_activity DATETIME NOT NULL,
  page_views INTEGER DEFAULT 0,
  tool_usage INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  exit_page TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_analytics_sessions_user_id (user_id),
  INDEX idx_analytics_sessions_start_time (start_time),
  INDEX idx_analytics_sessions_last_activity (last_activity),
  INDEX idx_analytics_sessions_composite (user_id, start_time)
);

-- Aggregated analytics metrics table
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  hour INTEGER, -- 0-23, for hourly aggregation
  metric_type TEXT NOT NULL, -- 'page_views', 'tool_usage', 'performance', etc.
  metric_name TEXT, -- specific metric name (tool name, performance metric, etc.)
  metric_value REAL NOT NULL,
  count INTEGER DEFAULT 1,
  properties TEXT, -- JSON for additional properties
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint to prevent duplicates
  UNIQUE(date, hour, metric_type, metric_name),

  -- Indexes
  INDEX idx_analytics_metrics_date (date),
  INDEX idx_analytics_metrics_type (metric_type),
  INDEX idx_analytics_metrics_composite (date, metric_type),
  INDEX idx_analytics_metrics_hourly (date, hour, metric_type)
);

-- Tool usage analytics table
CREATE TABLE IF NOT EXISTS analytics_tool_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'execute', 'validate', 'format', 'convert', 'error'
  processing_time INTEGER, -- in milliseconds
  input_size INTEGER, -- in bytes
  output_size INTEGER, -- in bytes
  error_message TEXT,
  user_id TEXT,
  session_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  metrics TEXT, -- JSON for additional metrics
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key references
  FOREIGN KEY (event_id) REFERENCES analytics_events(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_analytics_tool_usage_tool_id (tool_id),
  INDEX idx_analytics_tool_usage_action (action),
  INDEX idx_analytics_tool_usage_timestamp (timestamp),
  INDEX idx_analytics_tool_usage_user_id (user_id),
  INDEX idx_analytics_tool_usage_composite (tool_id, action, timestamp)
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS analytics_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  lcp REAL, -- Largest Contentful Paint
  fid REAL, -- First Input Delay
  cls REAL, -- Cumulative Layout Shift
  fcp REAL, -- First Contentful Paint
  ttfb REAL, -- Time to First Byte
  dom_content_loaded INTEGER, -- in milliseconds
  load INTEGER, -- in milliseconds
  connection_type TEXT,
  effective_type TEXT,
  downlink REAL,
  rtt INTEGER,
  user_id TEXT,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key reference
  FOREIGN KEY (event_id) REFERENCES analytics_events(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_analytics_performance_timestamp (timestamp),
  INDEX idx_analytics_performance_lcp (lcp),
  INDEX idx_analytics_performance_fid (fid),
  INDEX idx_analytics_performance_cls (cls),
  INDEX idx_analytics_performance_url (url),
  INDEX idx_analytics_performance_composite (session_id, timestamp)
);

-- API usage analytics table
CREATE TABLE IF NOT EXISTS analytics_api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL, -- in milliseconds
  request_size INTEGER, -- in bytes
  response_size INTEGER, -- in bytes
  error_message TEXT,
  user_id TEXT,
  session_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key reference
  FOREIGN KEY (event_id) REFERENCES analytics_events(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_analytics_api_usage_endpoint (endpoint),
  INDEX idx_analytics_api_usage_method (method),
  INDEX idx_analytics_api_usage_status_code (status_code),
  INDEX idx_analytics_api_usage_timestamp (timestamp),
  INDEX idx_analytics_api_usage_response_time (response_time),
  INDEX idx_analytics_api_usage_composite (endpoint, method, timestamp)
);

-- User engagement metrics table
CREATE TABLE IF NOT EXISTS analytics_engagement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  engagement_type TEXT NOT NULL, -- 'scroll', 'click', 'dwell_time', etc.
  engagement_value REAL,
  target_element TEXT,
  scroll_depth INTEGER, -- percentage
  dwell_time INTEGER, -- in milliseconds
  user_id TEXT,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  properties TEXT, -- JSON for additional properties
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key reference
  FOREIGN KEY (event_id) REFERENCES analytics_events(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_analytics_engagement_type (engagement_type),
  INDEX idx_analytics_engagement_timestamp (timestamp),
  INDEX idx_analytics_engagement_scroll_depth (scroll_depth),
  INDEX idx_analytics_engagement_composite (session_id, engagement_type, timestamp)
);

-- Analytics consent tracking table
CREATE TABLE IF NOT EXISTS analytics_consent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  consent_analytics BOOLEAN NOT NULL,
  consent_performance BOOLEAN NOT NULL,
  consent_interactions BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT, -- Anonymized IP for compliance
  user_agent TEXT,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_analytics_consent_user_id (user_id),
  INDEX idx_analytics_consent_timestamp (timestamp),
  INDEX idx_analytics_consent_composite (user_id, timestamp)
);

-- Analytics errors table for debugging
CREATE TABLE IF NOT EXISTS analytics_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  url TEXT NOT NULL,
  user_agent TEXT,
  user_id TEXT,
  session_id TEXT,
  timestamp DATETIME NOT NULL,
  properties TEXT, -- JSON for additional context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key reference (nullable)
  FOREIGN KEY (event_id) REFERENCES analytics_events(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_analytics_errors_type (error_type),
  INDEX idx_analytics_errors_timestamp (timestamp),
  INDEX idx_analytics_errors_user_id (user_id),
  INDEX idx_analytics_errors_composite (error_type, timestamp)
);

-- Funnel analytics table for tracking user journeys
CREATE TABLE IF NOT EXISTS analytics_funnels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  funnel_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completion_time INTEGER, -- time to complete this step in milliseconds
  timestamp DATETIME NOT NULL,
  properties TEXT, -- JSON for additional funnel properties
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key reference
  FOREIGN KEY (event_id) REFERENCES analytics_events(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_analytics_funnels_name (funnel_name),
  INDEX idx_analytics_funnels_step (step_name, step_order),
  INDEX idx_analytics_funnels_user_id (user_id),
  INDEX idx_analytics_funnels_composite (funnel_name, user_id, step_order)
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_analytics_sessions_updated_at
  AFTER UPDATE ON analytics_sessions
  FOR EACH ROW
  BEGIN
    UPDATE analytics_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_analytics_metrics_updated_at
  AFTER UPDATE ON analytics_metrics
  FOR EACH ROW
  BEGIN
    UPDATE analytics_metrics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_analytics_consent_updated_at
  AFTER UPDATE ON analytics_consent
  FOR EACH ROW
  BEGIN
    UPDATE analytics_consent SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Create views for common analytics queries
CREATE VIEW IF NOT EXISTS daily_summary AS
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN name = 'page_view' THEN 1 ELSE 0 END) as page_views,
  SUM(CASE WHEN name = 'tool_usage' THEN 1 ELSE 0 END) as tool_usage,
  SUM(CASE WHEN name = 'error' THEN 1 ELSE 0 END) as errors
FROM analytics_events
GROUP BY DATE(timestamp)
ORDER BY date DESC;

CREATE VIEW IF NOT EXISTS tool_performance_summary AS
SELECT
  DATE(ap.timestamp) as date,
  atu.tool_name,
  atu.action,
  COUNT(*) as usage_count,
  AVG(atu.processing_time) as avg_processing_time,
  AVG(atu.input_size) as avg_input_size,
  AVG(atu.output_size) as avg_output_size,
  SUM(CASE WHEN atu.error_message IS NOT NULL THEN 1 ELSE 0 END) as error_count,
  ROUND(AVG(ap.lcp), 2) as avg_lcp,
  ROUND(AVG(ap.fcp), 2) as avg_fcp,
  ROUND(AVG(ap.cls), 3) as avg_cls
FROM analytics_tool_usage atu
LEFT JOIN analytics_performance ap ON atu.session_id = ap.session_id
  AND DATE(atu.timestamp) = DATE(ap.timestamp)
GROUP BY DATE(ap.timestamp), atu.tool_name, atu.action
ORDER BY date DESC, usage_count DESC;

CREATE VIEW IF NOT EXISTS user_activity_summary AS
SELECT
  user_id,
  DATE(MIN(timestamp)) as first_seen,
  DATE(MAX(timestamp)) as last_seen,
  COUNT(DISTINCT DATE(timestamp)) as active_days,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(*) as total_events,
  AVG(tool_usage) as avg_session_tools,
  SUM(CASE WHEN name = 'page_view' THEN 1 ELSE 0 END) as total_page_views
FROM analytics_sessions
GROUP BY user_id
ORDER BY last_seen DESC;
