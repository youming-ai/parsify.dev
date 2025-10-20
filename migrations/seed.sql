-- Seed data for Online Developer Tools Platform
-- Version: 1.0
-- Date: 2025-10-09

-- This file contains initial data for development and testing
-- Run this after the initial migration to populate the database

-- Note: UUIDs are generated deterministically for consistency
-- In production, these would be generated randomly

-- Insert additional tools
INSERT OR IGNORE INTO tools (id, slug, name, category, description, config, enabled, beta, sort_order, created_at, updated_at) VALUES
-- Text Tools
('550e8400-e29b-41d4-a716-446655440010', 'text-minify', 'Text Minifier', 'text', 'Minify text content by removing whitespace', '{"inputSchema":{"type":"object","properties":{"text":{"type":"string","description":"Text to minify"},"preserve_newlines":{"type":"boolean","default":false,"description":"Preserve line breaks"}},"required":["text"]},"outputSchema":{"type":"object","properties":{"minified":{"type":"string","description":"Minified text"},"original_length":{"type":"number","description":"Original text length"},"minified_length":{"type":"number","description":"Minified text length"},"compression_ratio":{"type":"number","description":"Compression percentage"}}},"executionMode":"sync","quotas":{"maxInputSize":1048576,"maxExecutionTime":500,"requiresAuth":false}}', true, false, 20, strftime('%s', 'now'), strftime('%s', 'now')),

('550e8400-e29b-41d4-a716-446655440011', 'text-word-count', 'Word Counter', 'text', 'Count words, characters, and other text statistics', '{"inputSchema":{"type":"object","properties":{"text":{"type":"string","description":"Text to analyze"}},"required":["text"]},"outputSchema":{"type":"object","properties":{"word_count":{"type":"number","description":"Number of words"},"character_count":{"type":"number","description":"Number of characters"},"character_count_no_spaces":{"type":"number","description":"Characters excluding spaces"},"paragraph_count":{"type":"number","description":"Number of paragraphs"},"sentence_count":{"type":"number","description":"Number of sentences"}}},"executionMode":"sync","quotas":{"maxInputSize":1048576,"maxExecutionTime":300,"requiresAuth":false}}', true, false, 21, strftime('%s', 'now'), strftime('%s', 'now')),

-- Network Tools
('550e8400-e29b-41d4-a716-446655440020', 'url-encode', 'URL Encoder', 'network', 'Encode and decode URLs', '{"inputSchema":{"type":"object","properties":{"text":{"type":"string","description":"Text to encode/decode"},"action":{"type":"string","enum":["encode","decode"],"description":"Encode or decode action"}},"required":["text","action"]},"outputSchema":{"type":"object","properties":{"result":{"type":"string","description":"Encoded or decoded text"},"action":{"type":"string","description":"Action performed"}}},"executionMode":"sync","quotas":{"maxInputSize":10240,"maxExecutionTime":200,"requiresAuth":false}}', true, false, 30, strftime('%s', 'now'), strftime('%s', 'now')),

('550e8400-e29b-41d4-a716-446655440021', 'base64-encode', 'Base64 Encoder', 'network', 'Encode and decode Base64', '{"inputSchema":{"type":"object","properties":{"text":{"type":"string","description":"Text to encode/decode"},"action":{"type":"string","enum":["encode","decode"],"description":"Encode or decode action"}},"required":["text","action"]},"outputSchema":{"type":"object","properties":{"result":{"type":"string","description":"Encoded or decoded text"},"action":{"type":"string","description":"Action performed"}}},"executionMode":"sync","quotas":{"maxInputSize":1048576,"maxExecutionTime":500,"requiresAuth":false}}', true, false, 31, strftime('%s', 'now'), strftime('%s', 'now')),

-- Crypto Tools
('550e8400-e29b-41d4-a716-446655440030', 'hash-generator', 'Hash Generator', 'crypto', 'Generate various hash algorithms', '{"inputSchema":{"type":"object","properties":{"text":{"type":"string","description":"Text to hash"},"algorithms":{"type":"array","items":{"type":"string","enum":["md5","sha1","sha256","sha512"]},"description":"Hash algorithms to generate"}},"required":["text","algorithms"]},"outputSchema":{"type":"object","properties":{"hashes":{"type":"object","description":"Generated hashes by algorithm"}}},"executionMode":"sync","quotas":{"maxInputSize":1048576,"maxExecutionTime":1000,"requiresAuth":false}}', true, false, 40, strftime('%s', 'now'), strftime('%s', 'now')),

('550e8400-e29b-41d4-a716-446655440031', 'password-generator', 'Password Generator', 'crypto', 'Generate secure passwords', '{"inputSchema":{"type":"object","properties":{"length":{"type":"number","default":16,"minimum":4,"maximum":128,"description":"Password length"},"include_uppercase":{"type":"boolean","default":true,"description":"Include uppercase letters"},"include_lowercase":{"type":"boolean","default":true,"description":"Include lowercase letters"},"include_numbers":{"type":"boolean","default":true,"description":"Include numbers"},"include_symbols":{"type":"boolean","default":true,"description":"Include symbols"}},"required":["length"]},"outputSchema":{"type":"object","properties":{"password":{"type":"string","description":"Generated password"},"entropy":{"type":"number","description":"Password entropy"}}},"executionMode":"sync","quotas":{"maxInputSize":100,"maxExecutionTime":100,"requiresAuth":false}}', true, false, 41, strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert sample user for testing (in production, this would be removed)
INSERT OR IGNORE INTO users (id, email, name, subscription_tier, preferences, created_at, updated_at, last_login_at) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'test@example.com', 'Test User', 'free', '{"theme":"light","defaultLanguage":"javascript","autoSave":true,"showAdvancedOptions":false}', strftime('%s', 'now', '-7 days'), strftime('%s', 'now', '-1 day'), strftime('%s', 'now', '-1 day'));

-- Insert sample tool usage data for testing
INSERT OR IGNORE INTO tool_usage (id, user_id, tool_id, input_size, output_size, execution_time_ms, status, ip_address, user_agent, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440100', '123e4567-e89b-12d3-a456-426614174000', '550e8400-e29b-41d4-a716-446655440001', 150, 180, 45, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', strftime('%s', 'now', '-2 hours')),

('550e8400-e29b-41d4-a716-446655440101', '123e4567-e89b-12d3-a456-426614174000', '550e8400-e29b-41d4-a716-446655440002', 200, 50, 120, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', strftime('%s', 'now', '-3 hours')),

('550e8400-e29b-41d4-a716-446655440102', '123e4567-e89b-12d3-a456-426614174000', '550e8400-e29b-41d4-a716-446655440004', 500, 0, 5000, 'timeout', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', strftime('%s', 'now', '-1 day')),

('550e8400-e29b-41d4-a716-446655440103', '123e4567-e89b-12d3-a456-426614174000', '550e8400-e29b-41d4-a716-446655440005', 800, 750, 800, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', strftime('%s', 'now', '-5 hours'));

-- Insert sample jobs for testing
INSERT OR IGNORE INTO jobs (id, user_id, tool_id, status, input_data, output_data, progress, error_message, retry_count, started_at, completed_at, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440200', '123e4567-e89b-12d3-a456-426614174000', '550e8400-e29b-41d4-a716-446655440004', 'completed', '{"code":"console.log(''Hello, World!'');","language":"javascript","input":"","timeout":5000}', '{"output":"Hello, World!\n","error":null,"exit_code":0,"execution_time":45,"memory_usage":1024000}', 100, NULL, 0, strftime('%s', 'now', '-4 hours'), strftime('%s', 'now', '-4 hours'), strftime('%s', 'now', '-4 hours'), strftime('%s', 'now', '-4 hours')),

('550e8400-e29b-41d4-a716-446655440201', '123e4567-e89b-12d3-a456-426614174000', '550e8400-e29b-41d4-a716-446655440004', 'failed', '{"code":"invalid syntax here","language":"javascript","input":"","timeout":5000}', NULL, 0, 'SyntaxError: Unexpected identifier', 1, strftime('%s', 'now', '-6 hours'), strftime('%s', 'now', '-6 hours'), strftime('%s', 'now', '-6 hours'), strftime('%s', 'now', '-6 hours'));

-- Insert sample quota counters for testing
INSERT OR IGNORE INTO quota_counters (id, user_id, quota_type, period_start, period_end, used_count, limit_count, ip_address, created_at, updated_at) VALUES
-- Hourly API quota
('550e8400-e29b-41d4-a716-446655440300', '123e4567-e89b-12d3-a456-426614174000', 'api_requests', strftime('%s', 'now', '-1 hour') - (strftime('%s', 'now', '-1 hour') % 3600), strftime('%s', 'now', '-1 hour') - (strftime('%s', 'now', '-1 hour') % 3600) + 3600, 25, 100, NULL, strftime('%s', 'now', '-1 hour'), strftime('%s', 'now', '-10 minutes')),

-- Daily API quota
('550e8400-e29b-41d4-a716-446655440301', '123e4567-e89b-12d3-a456-426614174000', 'api_requests', strftime('%s', 'now', '-1 day') - (strftime('%s', 'now', '-1 day') % 86400), strftime('%s', 'now', '-1 day') - (strftime('%s', 'now', '-1 day') % 86400) + 86400, 150, 1000, NULL, strftime('%s', 'now', '-1 day'), strftime('%s', 'now', '-1 hour')),

-- Execution time quota
('550e8400-e29b-41d4-a716-446655440302', '123e4567-e89b-12d3-a456-426614174000', 'execution_time', strftime('%s', 'now', '-1 hour') - (strftime('%s', 'now', '-1 hour') % 3600), strftime('%s', 'now', '-1 hour') - (strftime('%s', 'now', '-1 hour') % 3600) + 3600, 10000, 30000, NULL, strftime('%s', 'now', '-1 hour'), strftime('%s', 'now', '-30 minutes')),

-- Anonymous IP quota
('550e8400-e29b-41d4-a716-446655440303', NULL, 'api_requests', strftime('%s', 'now', '-2 hours') - (strftime('%s', 'now', '-2 hours') % 3600), strftime('%s', 'now', '-2 hours') - (strftime('%s', 'now', '-2 hours') % 3600) + 3600, 15, 20, '203.0.113.1', strftime('%s', 'now', '-2 hours'), strftime('%s', 'now', '-2 hours'));

-- Insert sample audit logs for testing
INSERT OR IGNORE INTO audit_logs (id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, success, error_message, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440400', '123e4567-e89b-12d3-a456-426614174000', 'login', 'user', '123e4567-e89b-12d3-a456-426614174000', NULL, '{"last_login_at":' || strftime('%s', 'now', '-1 day') || '}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', true, NULL, strftime('%s', 'now', '-1 day')),

('550e8400-e29b-41d4-a716-446655440401', '123e4567-e89b-12d3-a456-426614174000', 'tool_execute', 'tool', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"input_size":150}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', true, NULL, strftime('%s', 'now', '-2 hours')),

('550e8400-e29b-41d4-a716-446655440402', '123e4567-e89b-12d3-a456-426614174000', 'tool_execute', 'tool', '550e8400-e29b-41d4-a716-446655440004', NULL, '{"input_size":500}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', false, 'Execution timeout', strftime('%s', 'now', '-1 day')),

('550e8400-e29b-41d4-a716-446655440403', NULL, 'auth_failure', 'user', NULL, NULL, '{"identifier":"bad@example.com","reason":"Invalid credentials"}', '203.0.113.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false, 'Invalid credentials', strftime('%s', 'now', '-3 hours')),

('550e8400-e29b-41d4-a716-446655440404', '123e4567-e89b-12d3-a456-426614174000', 'quota_exceeded', 'quota_counter', NULL, NULL, '{"quota_type":"api_requests"}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', false, 'API request quota exceeded', strftime('%s', 'now', '-6 hours'));

-- Insert sample file uploads for testing
INSERT OR IGNORE INTO file_uploads (id, user_id, filename, mime_type, size_bytes, r2_key, checksum, status, expires_at, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440500', '123e4567-e89b-12d3-a456-426614174000', 'test-data.json', 'application/json', 1024, 'users/123e4567-e89b-12d3-a456-426614174000/1696742400-test-data.json', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'completed', strftime('%s', 'now', '+3 days'), strftime('%s', 'now', '-2 days')),

('550e8400-e29b-41d4-a716-446655440501', NULL, 'anonymous-file.txt', 'text/plain', 512, 'anonymous/1696743000-anonymous-file.txt', 'f1e2d3c4b5a6978012345678901234567890abcdef1234567890abcdef123456', 'completed', strftime('%s', 'now', '+3 days'), strftime('%s', 'now', '-1 day')),

('550e8400-e29b-41d4-a716-446655440502', '123e4567-e89b-12d3-a456-426614174000', 'large-file.json', 'application/json', 5242880, 'users/123e4567-e89b-12d3-a456-426614174000/1696743600-large-file.json', NULL, 'uploading', strftime('%s', 'now', '+3 days'), strftime('%s', 'now', '-30 minutes'));

-- Seed completed
-- Version: 1.0
-- Created: 2025-10-09
-- Description: Initial seed data for development and testing