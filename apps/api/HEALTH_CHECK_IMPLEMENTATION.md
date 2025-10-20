# Comprehensive Health Check Implementation

This document describes the comprehensive health check system implemented for task T087, including endpoints, monitoring, and container orchestration integration.

## Overview

The health check system provides:
- **Database connectivity monitoring** (D1)
- **Cache health checks** (KV)
- **Storage health checks** (R2, Images)
- **External service dependency monitoring**
- **Readiness and liveness probes** for container orchestration
- **Health check dashboard** with real-time status
- **Metrics collection** and reporting
- **Health check alerts** and notifications

## Implementation Architecture

### Core Components

1. **Health Check Routes** (`/apps/api/src/routes/health.ts`)
   - Basic health endpoint (`/`)
   - Detailed health report (`/detailed`)
   - Metrics endpoint (`/metrics`)
   - Alerts endpoint (`/alerts`)
   - Readiness probe (`/ready`)
   - Liveness probe (`/live`)
   - Health dashboard (`/dashboard`)

2. **Service Health Monitoring**
   - Database health monitoring via `DatabaseHealthMonitor`
   - Cache health monitoring via `KVCacheService.healthCheck()`
   - Storage health monitoring via `R2StorageService.getHealthStatus()`
   - External dependency health checks

3. **System Health Aggregation**
   - Combines all service health statuses
   - Calculates overall system health score
   - Generates alerts and recommendations
   - Provides dashboard-ready data

## API Endpoints

### Basic Health Check
```
GET /health
```
Returns overall system health with service status summary.

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": 1703123456789,
  "responseTime": 45,
  "services": {
    "database": "healthy",
    "cache": "healthy", 
    "storage": "healthy"
  },
  "uptime": 86400000
}
```

### Detailed Health Report
```
GET /health/detailed
Authorization: Bearer <auth-key> (if auth enabled)
```
Returns comprehensive health report with metrics and alerts.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1703123456789,
  "uptime": 86400000,
  "services": {
    "database": {
      "name": "database",
      "status": "healthy",
      "responseTime": 25,
      "lastCheck": 1703123456789,
      "details": {
        "consecutiveFailures": 0,
        "uptime": 86400000
      }
    },
    "cache": {
      "name": "cache",
      "status": "healthy", 
      "responseTime": 12,
      "lastCheck": 1703123456789,
      "details": { ... }
    },
    "storage": {
      "name": "storage",
      "status": "healthy",
      "responseTime": 89,
      "lastCheck": 1703123456789,
      "details": { ... }
    }
  },
  "dependencies": [...],
  "metrics": {
    "system": {
      "totalServices": 3,
      "healthyServices": 3,
      "degradedServices": 0,
      "unhealthyServices": 0,
      "averageResponseTime": 42
    },
    "database": { ... },
    "cache": { ... },
    "storage": { ... }
  },
  "alerts": [...],
  "recommendations": [...]
}
```

### Health Dashboard
```
GET /health/dashboard
Authorization: Bearer <auth-key> (if auth enabled)
```
Returns dashboard-formatted health data with charts and visualizations.

**Response:**
```json
{
  "overview": {
    "status": "healthy",
    "timestamp": 1703123456789,
    "uptime": 86400000,
    "healthScore": 95
  },
  "services": { ... },
  "dependencies": [...],
  "metrics": { ... },
  "alerts": [...],
  "recommendations": [...],
  "charts": {
    "responseTime": {
      "database": 25,
      "cache": 12,
      "storage": 89
    },
    "statusCounts": {
      "healthy": 3,
      "degraded": 0,
      "unhealthy": 0
    }
  }
}
```

### Container Orchestration Probes

#### Readiness Probe
```
GET /health/ready
```
Indicates if the service is ready to accept traffic.

#### Liveness Probe  
```
GET /health/live
```
Indicates if the service is alive and functioning.

### Metrics and Alerts

#### Metrics Endpoint
```
GET /health/metrics
Authorization: Bearer <auth-key> (if auth enabled)
```

#### Alerts Endpoint
```
GET /health/alerts?limit=50
Authorization: Bearer <auth-key> (if auth enabled)
```

#### Clear Alerts
```
POST /health/alerts/clear
Authorization: Bearer <auth-key> (if auth enabled)
```

## Configuration

### Environment Variables

```bash
# Enable health checks
ENABLE_HEALTH_CHECKS=true

# Health check authentication (production)
HEALTH_CHECK_AUTH_KEY=your-secret-key

# External service URLs for dependency monitoring
EXTERNAL_API_URL=https://api.external-service.com
PAYMENT_PROVIDER_URL=https://api.stripe.com
NOTIFICATION_SERVICE_URL=https://api.twilio.com
```

### Health Check Options

```typescript
const healthOptions = {
  healthMonitor: databaseHealthMonitor,
  cacheService: kvCacheService,
  storageService: r2StorageService,
  cloudflareService: cloudflareService,
  includeMetrics: true,
  includeAlerts: true,
  authEnabled: process.env.NODE_ENV === 'production',
  authKey: process.env.HEALTH_CHECK_AUTH_KEY,
  dependencies: [
    {
      name: 'external-api',
      check: async () => {
        // Custom health check implementation
      }
    }
  ]
}
```

## Integration Examples

### 1. Basic Integration

```typescript
import { setupHealthMonitoring } from './routes/health'

// Setup comprehensive health monitoring
setupHealthMonitoring(app, healthMonitor, {
  routePrefix: '/health',
  includeMetrics: true,
  includeAlerts: true,
  authEnabled: true,
  authKey: process.env.HEALTH_CHECK_AUTH_KEY,
  cacheService: kvCacheService,
  storageService: r2StorageService,
  dependencies: externalDependencies
})
```

### 2. Container Orchestration

#### Kubernetes Deployment

The system includes Kubernetes-ready health check configuration:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 30
```

#### Docker Compose

```yaml
version: '3.8'
services:
  api:
    image: parsify/api:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 3. Prometheus Metrics

```typescript
// Prometheus metrics endpoint
app.get('/metrics', createPrometheusHealthMetrics(healthMonitor))
```

Prometheus metrics include:
- Application health status
- Database response times
- Query success rates  
- Connection pool metrics
- Health check timestamps

## Service Health Checks

### Database (D1)

The database health monitor:
- Performs periodic connection tests
- Monitors query performance
- Tracks connection pool utilization
- Generates alerts for slow queries or high error rates

### Cache (KV)

The cache health check:
- Tests read/write operations in each namespace
- Monitors cache hit rates and response times
- Validates cache entry expiration
- Checks namespace accessibility

### Storage (R2)

The storage health check:
- Tests bucket accessibility and permissions
- Monitors upload/download performance
- Validates storage configurations
- Checks CDN availability

### External Dependencies

External service health checks:
- Test HTTP endpoints with configurable timeouts
- Monitor response times and status codes
- Track service availability over time
- Generate alerts for service outages

## Alerting and Notifications

### Alert Types

- **Critical**: Service down, database unavailable
- **Error**: High error rates, connection failures  
- **Warning**: Slow responses, degraded performance
- **Info**: Service status changes, maintenance events

### Alert Channels

The system supports integration with:
- Email notifications
- Slack webhooks
- PagerDuty alerts
- Custom webhook endpoints

## Dashboard Integration

The health dashboard provides:
- Real-time system health overview
- Service status visualization
- Performance metrics charts
- Alert history and trends
- System recommendations

### Dashboard Features

1. **Overview Panel**
   - Overall health score
   - System uptime
   - Active alerts count

2. **Service Status**
   - Individual service health
   - Response time trends
   - Error rates

3. **Dependency Monitoring**
   - External service status
   - Network latency
   - Service availability

4. **Performance Metrics**
   - Query performance
   - Cache efficiency
   - Storage utilization

## Best Practices

### 1. Health Check Configuration

- Set appropriate timeouts based on service response times
- Configure failure thresholds to balance sensitivity and stability
- Use different intervals for different service types
- Enable authentication for production environments

### 2. Container Orchestration

- Use separate readiness and liveness probes
- Configure appropriate startup probes for slow-starting services
- Set proper termination grace periods
- Implement graceful shutdown procedures

### 3. Monitoring Integration

- Export metrics to Prometheus or similar systems
- Set up alerting rules based on health check failures
- Create dashboards for health status visualization
- Integrate with incident management systems

### 4. External Dependencies

- Monitor all critical external services
- Implement circuit breakers for unreliable dependencies
- Set appropriate timeouts for external health checks
- Plan for external service outages

## Troubleshooting

### Common Issues

1. **Health Check Timeouts**
   - Increase timeout values for slow services
   - Check network connectivity issues
   - Verify service performance

2. **Flapping Health Status**
   - Increase failure thresholds
   - Implement health check hysteresis
   - Investigate intermittent issues

3. **Dependency Failures**
   - Verify external service availability
   - Check network configurations
   - Review authentication settings

### Debugging

Enable debug logging to troubleshoot health check issues:

```bash
# Set log level to debug
LOG_LEVEL=debug

# Enable detailed health check logging
HEALTH_CHECK_DEBUG=true
```

## Security Considerations

1. **Authentication**
   - Require authentication for detailed health endpoints
   - Use separate auth keys for different environments
   - Implement rate limiting for health endpoints

2. **Information Disclosure**
   - Limit sensitive information in basic health endpoints
   - Use role-based access for detailed metrics
   - Sanitize error messages in responses

3. **Network Security**
   - Restrict access to internal health endpoints
   - Use VPN or private networks for admin access
   - Implement proper firewall rules

## Performance Optimization

1. **Health Check Efficiency**
   - Use lightweight health checks for liveness probes
   - Cache health check results where appropriate
   - Implement async health checks for external services

2. **Resource Usage**
   - Monitor health check resource consumption
   - Optimize database queries used in health checks
   - Use connection pooling for health check connections

3. **Scaling Considerations**
   - Design health checks to work in distributed environments
   - Implement proper load balancing for health endpoints
   - Consider regional health monitoring for global deployments

## Future Enhancements

1. **Advanced Monitoring**
   - Distributed tracing integration
   - Machine learning-based anomaly detection
   - Predictive health monitoring

2. **Visualization**
   - Interactive health dashboards
   - Real-time health maps
   - Historical health trend analysis

3. **Automation**
   - Automated remediation based on health status
   - Dynamic scaling based on health metrics
   - Intelligent failover mechanisms

This comprehensive health check system provides robust monitoring and alerting capabilities for the Parsify API, ensuring high availability and reliability in production environments.