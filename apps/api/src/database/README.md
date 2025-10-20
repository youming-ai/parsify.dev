# Database Module

This module provides a comprehensive database abstraction layer for Cloudflare D1 with connection pooling, retry logic, health monitoring, and metrics collection.

## Features

- **Connection Pooling**: Efficient database connection management
- **Retry Logic**: Automatic retry with exponential backoff
- **Query Caching**: Built-in caching for SELECT queries
- **Transaction Support**: Database transactions with rollback
- **Health Monitoring**: Continuous health checks and alerts
- **Metrics Collection**: Query performance and usage metrics
- **Error Handling**: Comprehensive error handling and logging

## Usage

### Basic Setup

```typescript
import { createDatabaseService, createDatabaseHealthMonitor } from './database'

// Create database service
const dbService = createDatabaseService(env.DB, {
  poolSize: 5,
  enableMetrics: true,
  enableHealthCheck: true
})

// Create health monitor
const healthMonitor = createDatabaseHealthMonitor(dbService, {
  intervalMs: 30000,
  alertThresholds: {
    queryTime: 1000,
    errorRate: 0.05
  }
})
```

### Using Database Client

```typescript
import { createDatabaseClient } from './database'

const client = createDatabaseClient(env.DB, {
  maxConnections: 10,
  retryAttempts: 3
})

// Simple query
const users = await client.query('SELECT * FROM users WHERE active = ?', [true])

// Single result
const user = await client.queryFirst('SELECT * FROM users WHERE id = ?', [userId])

// Execute statement
const result = await client.execute('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com'])
```

### Using Transactions

```typescript
const result = await client.transaction(async (tx) => {
  await tx.execute('INSERT INTO users (name) VALUES (?)', ['John'])
  await tx.execute('INSERT INTO profiles (user_id, bio) VALUES (?, ?)', [userId, 'Developer'])
  return { success: true }
})
```

### Health Monitoring

```typescript
// Get health status
const status = healthMonitor.getHealthStatus()

// Get detailed health report
const report = await healthMonitor.getHealthReport()

// Get recent alerts
const alerts = healthMonitor.getAlerts(10)
```

## API Endpoints

The module provides health check API endpoints:

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health report
- `GET /health/metrics` - Database metrics
- `GET /health/alerts` - Recent alerts
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## Configuration

### Database Service Configuration

```typescript
interface DatabaseServiceConfig {
  poolSize?: number
  maxConnections?: number
  connectionTimeoutMs?: number
  retryAttempts?: number
  enableMetrics?: boolean
  enableHealthCheck?: boolean
  healthCheckIntervalMs?: number
  enableQueryCache?: boolean
  queryCacheTtlMs?: number
  slowQueryThresholdMs?: number
}
```

### Health Monitor Configuration

```typescript
interface HealthCheckConfig {
  enabled?: boolean
  intervalMs?: number
  timeoutMs?: number
  failureThreshold?: number
  successThreshold?: number
  alertThresholds?: {
    queryTime?: number
    errorRate?: number
    connectionPoolUtilization?: number
  }
}
```

## Service Integration

All services have been updated to use the new database client:

### UserService

```typescript
const userService = new UserService({
  db: env.DB,
  auditEnabled: true,
  databaseConfig: {
    maxConnections: 5,
    enableMetrics: true
  }
})
```

### AuthService

```typescript
const authService = new AuthService({
  db: env.DB,
  kv: env.KV,
  jwtSecret: env.JWT_SECRET,
  databaseConfig: {
    maxConnections: 3,
    retryAttempts: 2
  }
})
```

### ToolService

```typescript
const toolService = new ToolService({
  db: env.DB,
  kv: env.KV,
  auditEnabled: true,
  enableBetaFeatures: false,
  databaseConfig: {
    maxConnections: 5,
    enableMetrics: true
  }
})
```

### JobService

```typescript
const jobService = new JobService({
  db: env.DB,
  kv: env.KV,
  auditEnabled: true,
  maxConcurrentJobs: 10,
  databaseConfig: {
    maxConnections: 3,
    retryAttempts: 3
  }
})
```

### FileService

```typescript
const fileService = new FileService({
  db: env.DB,
  r2: env.R2,
  kv: env.KV,
  auditEnabled: true,
  databaseConfig: {
    maxConnections: 5,
    enableMetrics: true
  }
})
```

## Monitoring and Alerting

The health monitoring system provides:

- **Automatic Health Checks**: Periodic database health verification
- **Performance Alerts**: Warnings for slow queries and high error rates
- **Connection Pool Monitoring**: Alerts for connection pool exhaustion
- **Metrics Collection**: Detailed query performance metrics
- **Recommendations**: Automated performance recommendations

### Alert Types

- `slow_query`: Query response time exceeds threshold
- `high_error_rate`: Database error rate exceeds threshold
- `connection_pool_exhausted`: Connection pool utilization is high
- `database_unavailable`: Health checks are failing

## Best Practices

1. **Connection Pooling**: Configure appropriate pool sizes based on your workload
2. **Retry Logic**: Set reasonable retry attempts and delays
3. **Health Monitoring**: Enable health checks in production
4. **Query Optimization**: Monitor slow queries and optimize them
5. **Error Handling**: Implement proper error handling and logging
6. **Metrics Collection**: Enable metrics for performance monitoring

## Migration Notes

All services have been migrated from direct D1Database usage to the new database client. The changes include:

- Replaced `db.prepare().bind().run()` with `client.execute()`
- Replaced `db.prepare().bind().first()` with `client.queryFirst()`
- Replaced `db.prepare().bind().all()` with `client.query()`
- Added database configuration options to all service constructors
- Maintained backward compatibility for all service methods

## Performance Considerations

- Use connection pooling to reduce connection overhead
- Enable query caching for frequently accessed data
- Monitor connection pool utilization
- Set appropriate timeout values
- Use transactions for multi-step operations
- Implement retry logic for transient errors