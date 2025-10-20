# Cloudflare Services Configuration

This directory contains the comprehensive configuration and service abstractions for all Cloudflare services used in the Parsify API application.

## Overview

The Cloudflare integration includes:

- **D1 Database**: Serverless SQLite database for persistent data storage
- **KV Storage**: Distributed key-value store for caching and session management
- **R2 Object Storage**: S3-compatible object storage for file uploads and assets
- **Durable Objects**: Stateful objects for real-time collaboration and session management

## Architecture

```
apps/api/src/
├── config/cloudflare/
│   ├── d1-config.ts          # D1 database configuration
│   ├── kv-config.ts          # KV storage configuration
│   ├── r2-config.ts          # R2 object storage configuration
│   └── durable-objects-config.ts  # Durable Objects configuration
├── services/cloudflare/
│   ├── index.ts              # Main exports and types
│   ├── cloudflare-service.ts # Unified service wrapper
│   ├── database-service.ts   # Database operations abstraction
│   ├── cache-service.ts      # Cache operations abstraction
│   └── README.md             # This documentation
└── index.ts                  # Main application entry point
```

## Features

### 🗄️ D1 Database Service
- Connection pooling and management
- Query optimization and caching
- Transaction support
- Health monitoring
- Automatic retries with exponential backoff
- Migration system
- Comprehensive error handling

### 🗃️ KV Storage Service
- Multi-namespace support (cache, sessions, uploads, analytics)
- Intelligent cache invalidation
- Tag-based cache management
- Session persistence and cleanup
- Compression and metadata support
- Health monitoring and metrics

### 📦 R2 Object Storage
- File upload/download with progress tracking
- Multi-format support with validation
- CDN integration
- Automatic compression
- Metadata and tagging
- Lifecycle management
- Health monitoring

### 🔗 Durable Objects
- Real-time session management
- WebSocket connection handling
- Stateful collaboration features
- Automatic cleanup and garbage collection
- Health monitoring and metrics

## Configuration

### Environment Variables

The following environment variables are used:

```bash
# Core configuration
ENVIRONMENT=development|staging|production
API_VERSION=v1
ENABLE_METRICS=true
LOG_LEVEL=debug|info|warn|error
ENABLE_HEALTH_CHECKS=true

# D1 Database
CLOUDFLARE_D1_DATABASE_ID=your-database-id

# KV Namespaces
CLOUDFLARE_KV_CACHE_ID=your-cache-namespace-id
CLOUDFLARE_KV_SESSIONS_ID=your-sessions-namespace-id
CLOUDFLARE_KV_UPLOADS_ID=your-uploads-namespace-id
CLOUDFLARE_KV_ANALYTICS_ID=your-analytics-namespace-id

# R2 Storage
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_CDN_URL=your-cdn-url
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### Wrangler Configuration

The `wrangler.toml` file contains all necessary Cloudflare service bindings:

```toml
# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "parsify-dev"
database_id = "local"

# KV Namespaces
[[kv_namespaces]]
binding = "CACHE"
id = "local"
preview_id = "local"

# R2 Buckets
[[r2_buckets]]
binding = "FILES"
bucket_name = "parsify-files-dev"

# Durable Objects
[[durable_objects.bindings]]
name = "SESSION_MANAGER"
class_name = "SessionManagerDurableObject"
```

## Usage

### Basic Service Integration

```typescript
import { createCloudflareService, CloudflareService } from './services/cloudflare'

// Initialize service
const cloudflare = createCloudflareService(env, {
  environment: 'production',
  enableHealthMonitoring: true,
  enableCaching: true,
  enableMetrics: true,
  logLevel: 'info'
})

// Start health monitoring
await cloudflare.startHealthMonitoring()
```

### Database Operations

```typescript
import { DatabaseService, createDatabaseService } from './services/cloudflare'

const db = createDatabaseService(cloudflare)

// Simple query
const users = await db.query('SELECT * FROM users WHERE active = ?', [true])

// Insert operation
const result = await db.insert('users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// Transaction
const txResult = await db.transaction([
  { sql: 'INSERT INTO users (name) VALUES (?)', params: ['Alice'] },
  { sql: 'INSERT INTO profiles (user_id, bio) VALUES (?, ?)', params: [1, 'Developer'] }
])
```

### Cache Operations

```typescript
import { CacheService, createCacheService } from './services/cloudflare'

const cache = createCacheService(cloudflare)

// Set cache
await cache.set('user:123', userData, {
  ttl: 3600,
  tags: ['user', 'profile']
})

// Get cache
const user = await cache.get('user:123')

// Get or set with fallback
const data = await cache.getOrSet('expensive:query', async () => {
  return await expensiveDatabaseQuery()
}, { ttl: 1800 })

// Invalidate by tags
await cache.invalidate({ tags: ['user'] })
```

### File Storage

```typescript
// Upload file
const fileMetadata = await cloudflare.uploadFile(
  userId,
  fileBuffer,
  'document.pdf',
  {
    contentType: 'application/pdf',
    metadata: { category: 'documents' }
  }
)

// Download file
const { file, metadata } = await cloudflare.getFile(fileMetadata.key)

// List user files
const userFiles = await cloudflare.listUserFiles(userId, {
  limit: 50,
  cursor: 'next-page-token'
})
```

### Session Management

```typescript
// Create session
await cloudflare.createSession(sessionId, {
  userId: 'user123',
  preferences: { theme: 'dark' }
}, {
  ttl: 86400,
  userId: 'user123'
})

// Get session
const session = await cloudflare.getSession(sessionId)

// Update session
await cloudflare.updateSession(sessionId, {
  lastActivity: Date.now()
})

// Delete session
await cloudflare.deleteSession(sessionId)
```

## Health Monitoring

All services include comprehensive health monitoring:

```typescript
// Get overall health status
const health = await cloudflare.getHealthStatus()

console.log(health)
// {
//   overall: 'healthy',
//   d1: { status: 'healthy', responseTime: 45 },
//   kv: { cache: { status: 'healthy', responseTime: 12 } },
//   r2: { status: 'healthy', responseTime: 78 },
//   timestamp: 1234567890
// }

// Get detailed metrics
const metrics = cloudflare.getMetrics()

console.log(metrics)
// {
//   d1: { queryCount: 1250, avgQueryTime: 45, errorCount: 2 },
//   kv: { cache: { operationsCount: 5600, cacheHitRate: 0.85 } },
//   r2: { uploadCount: 45, downloadCount: 230, bytesUploaded: 1048576 }
// }
```

## Error Handling

The services implement comprehensive error handling with automatic retries:

```typescript
try {
  const result = await cloudflare.query('SELECT * FROM users')
} catch (error) {
  if (error.code === 'TIMEOUT') {
    // Handle timeout
  } else if (error.code === 'CONNECTION_FAILED') {
    // Handle connection failure
  }
}
```

## Performance Optimization

### Query Caching

Enable query result caching for frequently accessed data:

```typescript
const users = await db.query('SELECT * FROM users WHERE active = ?', [true], {
  useCache: true,
  cacheTTL: 300 // 5 minutes
})
```

### Batch Operations

Use batch operations for better performance:

```typescript
const results = await db.batch([
  { sql: 'INSERT INTO users (name) VALUES (?)', params: ['Alice'] },
  { sql: 'INSERT INTO users (name) VALUES (?)', params: ['Bob'] },
  { sql: 'INSERT INTO users (name) VALUES (?)', params: ['Charlie'] }
])
```

### Connection Pooling

The D1 service automatically manages connection pooling:

```typescript
// Connections are automatically reused
const result1 = await db.query('SELECT * FROM table1')
const result2 = await db.query('SELECT * FROM table2') // Reuses connection
```

## Security

### Input Validation

All services include input validation:

```typescript
// File upload validation
await cloudflare.uploadFile(userId, file, filename, {
  contentType: 'application/pdf', // Validates MIME type
  metadata: { validated: true }
})
```

### Rate Limiting

Built-in rate limiting for API endpoints:

```typescript
// Automatically applied in middleware
// Configurable via environment variables
RATE_LIMIT_ENABLED=true
```

### Data Encryption

R2 uploads support automatic encryption:

```typescript
const fileMetadata = await cloudflare.uploadFile(userId, file, filename, {
  metadata: { encrypted: true } // Enables server-side encryption
})
```

## Development

### Local Development

For local development, use the `local` IDs provided in the configuration:

```bash
# Start local development
npm run dev

# This will use local emulators for all services
```

### Testing

The services are designed to be testable:

```typescript
import { createCloudflareService } from './services/cloudflare'

// Create mock environment for testing
const mockEnv = {
  DB: mockD1Database,
  CACHE: mockKVNamespace,
  FILES: mockR2Bucket,
  ENVIRONMENT: 'test'
}

const service = createCloudflareService(mockEnv, {
  enableHealthMonitoring: false,
  enableMetrics: false
})
```

### Debugging

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

## Deployment

### Production Deployment

1. Update production IDs in `wrangler.toml`
2. Set environment variables
3. Deploy:

```bash
npm run deploy
```

### Environment-Specific Configuration

Each environment (development, staging, production) has its own configuration:

```typescript
// Production uses real Cloudflare resources
const config = getD1Config('production')

// Development uses local emulators
const config = getD1Config('development')
```

## Monitoring and Analytics

### Metrics Collection

Enable metrics collection:

```typescript
const cloudflare = createCloudflareService(env, {
  enableMetrics: true
})

// Access metrics
const metrics = cloudflare.getMetrics()
```

### Health Checks

Regular health checks are performed automatically:

```typescript
// Manual health check
const health = await cloudflare.getHealthStatus()

// Health check endpoint
GET /health
```

### Analytics Data

Store analytics data in dedicated KV namespace:

```typescript
await cloudflare.cacheSet('analytics', `event:${timestamp}`, {
  type: 'api_call',
  endpoint: '/api/v1/users',
  userId: 'user123',
  timestamp: Date.now()
})
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**: Increase timeout values in configuration
2. **Cache Misses**: Check cache TTL and invalidation strategy
3. **Upload Failures**: Verify file size limits and MIME type restrictions
4. **Session Loss**: Check session TTL and cleanup configuration

### Debug Tools

Use the built-in debug endpoints:

```bash
# Health check
curl https://api.parsify.dev/health

# Metrics
curl https://api.parsify.dev/metrics

# Cache stats
curl -H "Authorization: Bearer $token" \
  https://api.parsify.dev/admin/cache/stats
```

## Best Practices

1. **Use appropriate TTL values** for different data types
2. **Implement proper error handling** with retries
3. **Monitor health metrics** regularly
4. **Use tagging for cache invalidation**
5. **Implement proper cleanup** for expired data
6. **Use batch operations** when possible
7. **Enable compression** for large files
8. **Implement proper logging** for debugging

## Contributing

When adding new features to the Cloudflare services:

1. Follow the existing code patterns
2. Add comprehensive error handling
3. Include health monitoring
4. Add appropriate tests
5. Update documentation
6. Consider performance implications

## Support

For issues and questions:

1. Check the health endpoints for service status
2. Review the logs for error details
3. Check the configuration in `wrangler.toml`
4. Verify environment variables are set correctly
5. Consult the Cloudflare documentation for specific service limits