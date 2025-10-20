# Health Check Procedures

This document outlines the comprehensive health check procedures for monitoring the Parsify platform's health and availability.

## Health Check Overview

### Health Check Types

1. **Basic Health Checks**: Simple availability checks
2. **Detailed Health Checks**: Comprehensive system status
3. **Component Health Checks**: Individual component validation
4. **Business Health Checks**: User-facing functionality tests

### Health Check Schedule

- **Continuous**: Automated health monitoring
- **Every 5 minutes**: Basic health checks
- **Every 30 minutes**: Detailed health checks
- **Every 2 hours**: Component health checks
- **Daily**: Comprehensive business health checks

## Health Check Endpoints

### API Health Endpoints

#### Basic Health Check
```bash
# Endpoint: GET /health
curl -X GET https://api.parsify.dev/health

# Expected Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "uptime": "72h 30m 15s"
}
```

#### Detailed Health Check
```bash
# Endpoint: GET /health/detailed
curl -X GET https://api.parsify.dev/health/detailed

# Expected Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "uptime": "72h 30m 15s",
  "services": {
    "database": {
      "status": "ok",
      "response_time": "15ms",
      "connections": 5,
      "max_connections": 100
    },
    "cache": {
      "status": "ok",
      "response_time": "5ms",
      "hit_rate": "95%"
    },
    "storage": {
      "status": "ok",
      "response_time": "25ms",
      "available_space": "500GB"
    },
    "queue": {
      "status": "ok",
      "pending_jobs": 10,
      "processing_jobs": 2
    }
  },
  "metrics": {
    "requests_per_minute": 150,
    "error_rate": "0.1%",
    "average_response_time": "150ms",
    "p95_response_time": "300ms"
  }
}
```

#### Component-Specific Health Checks

##### Database Health Check
```bash
# Endpoint: GET /health/database
curl -X GET https://api.parsify.dev/health/database

# Expected Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": {
    "status": "ok",
    "response_time": "15ms",
    "connections": 5,
    "max_connections": 100,
    "queries_per_second": 25,
    "slow_queries": 0
  }
}
```

##### Cache Health Check
```bash
# Endpoint: GET /health/cache
curl -X GET https://api.parsify.dev/health/cache

# Expected Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "cache": {
    "status": "ok",
    "response_time": "5ms",
    "hit_rate": "95%",
    "memory_usage": "60%",
    "total_items": 10000,
    "evictions_per_hour": 50
  }
}
```

##### Storage Health Check
```bash
# Endpoint: GET /health/storage
curl -X GET https://api.parsify.dev/health/storage

# Expected Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "storage": {
    "status": "ok",
    "response_time": "25ms",
    "available_space": "500GB",
    "total_space": "1TB",
    "usage_percentage": "50%",
    "upload_success_rate": "99.9%"
  }
}
```

### Frontend Health Endpoints

#### Frontend Health Check
```bash
# Endpoint: GET /api/health
curl -X GET https://parsify.dev/api/health

# Expected Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "build": "abc123",
  "cdn_status": "ok",
  "asset_loading": "ok"
}
```

## Health Check Implementation

### API Health Check Implementation

```typescript
// apps/api/src/health.ts
import { corsHeaders } from './cors';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: string;
  services?: ServiceHealth;
  metrics?: HealthMetrics;
}

interface ServiceHealth {
  database: DatabaseHealth;
  cache: CacheHealth;
  storage: StorageHealth;
  queue: QueueHealth;
}

interface HealthMetrics {
  requests_per_minute: number;
  error_rate: string;
  average_response_time: string;
  p95_response_time: string;
}

export async function handleHealthCheck(request: Request): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Check basic service availability
    const basicHealth = await checkBasicHealth();
    
    if (request.url.includes('/detailed')) {
      // Perform detailed health check
      const detailedHealth = await checkDetailedHealth();
      return new Response(JSON.stringify(detailedHealth), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (request.url.includes('/database')) {
      // Check database health
      const dbHealth = await checkDatabaseHealth();
      return new Response(JSON.stringify(dbHealth), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (request.url.includes('/cache')) {
      // Check cache health
      const cacheHealth = await checkCacheHealth();
      return new Response(JSON.stringify(cacheHealth), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (request.url.includes('/storage')) {
      // Check storage health
      const storageHealth = await checkStorageHealth();
      return new Response(JSON.stringify(storageHealth), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Basic health check
    const response: HealthResponse = {
      status: basicHealth.status,
      timestamp: new Date().toISOString(),
      version: process.env.VERSION || '1.0.0',
      uptime: getUptime()
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResponse: HealthResponse = {
      status: 'down',
      timestamp: new Date().toISOString(),
      version: process.env.VERSION || '1.0.0',
      uptime: getUptime()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function checkBasicHealth(): Promise<{ status: 'ok' | 'degraded' | 'down' }> {
  // Check basic service functionality
  const checks = [
    checkDatabaseConnection(),
    checkCacheConnection(),
    checkStorageConnection()
  ];
  
  const results = await Promise.allSettled(checks);
  const failed = results.filter(r => r.status === 'rejected').length;
  
  if (failed === 0) return { status: 'ok' };
  if (failed <= 1) return { status: 'degraded' };
  return { status: 'down' };
}

async function checkDetailedHealth(): Promise<HealthResponse> {
  const startTime = Date.now();
  
  const [dbHealth, cacheHealth, storageHealth, queueHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkCacheHealth(),
    checkStorageHealth(),
    checkQueueHealth()
  ]);
  
  const metrics = await getHealthMetrics();
  
  // Determine overall status
  const services = [dbHealth, cacheHealth, storageHealth, queueHealth];
  const failedServices = services.filter(s => s.status !== 'ok').length;
  
  let status: 'ok' | 'degraded' | 'down';
  if (failedServices === 0) status = 'ok';
  else if (failedServices <= 1) status = 'degraded';
  else status = 'down';
  
  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '1.0.0',
    uptime: getUptime(),
    services: {
      database: dbHealth,
      cache: cacheHealth,
      storage: storageHealth,
      queue: queueHealth
    },
    metrics
  };
}

async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await env.DB.prepare('SELECT 1').first();
    
    const responseTime = Date.now() - startTime;
    
    // Get database metrics
    const metrics = await getDatabaseMetrics();
    
    return {
      status: responseTime < 100 ? 'ok' : 'degraded',
      response_time: `${responseTime}ms`,
      connections: metrics.connections,
      max_connections: metrics.max_connections,
      queries_per_second: metrics.queries_per_second,
      slow_queries: metrics.slow_queries
    };
    
  } catch (error) {
    return {
      status: 'down',
      response_time: 'N/A',
      connections: 0,
      max_connections: 100,
      queries_per_second: 0,
      slow_queries: 0
    };
  }
}

// Additional helper functions would be implemented here...
```

### Frontend Health Check Implementation

```typescript
// apps/web/src/utils/healthCheck.ts
interface FrontendHealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  build: string;
  cdn_status: 'ok' | 'degraded' | 'down';
  asset_loading: 'ok' | 'degraded' | 'down';
}

export async function checkFrontendHealth(): Promise<FrontendHealthResponse> {
  const startTime = Date.now();
  
  try {
    // Check CDN status
    const cdnStatus = await checkCDNStatus();
    
    // Check asset loading
    const assetStatus = await checkAssetLoading();
    
    // Determine overall status
    const checks = [cdnStatus, assetStatus];
    const failed = checks.filter(c => c !== 'ok').length;
    
    let status: 'ok' | 'degraded' | 'down';
    if (failed === 0) status = 'ok';
    else if (failed <= 1) status = 'degraded';
    else status = 'down';
    
    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      build: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      cdn_status: cdnStatus,
      asset_loading: assetStatus
    };
    
  } catch (error) {
    console.error('Frontend health check failed:', error);
    
    return {
      status: 'down',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      build: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      cdn_status: 'down',
      asset_loading: 'down'
    };
  }
}

async function checkCDNStatus(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    // Check CDN endpoint
    const response = await fetch('/_next/static/chunks/main.js', { 
      method: 'HEAD' 
    });
    
    if (response.ok) return 'ok';
    if (response.status >= 500) return 'down';
    return 'degraded';
    
  } catch (error) {
    return 'down';
  }
}

async function checkAssetLoading(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    // Check critical assets
    const assets = [
      '/_next/static/css/app.css',
      '/favicon.ico'
    ];
    
    const results = await Promise.allSettled(
      assets.map(asset => fetch(asset, { method: 'HEAD' }))
    );
    
    const failed = results.filter(r => r.status === 'rejected' || !r.value.ok).length;
    
    if (failed === 0) return 'ok';
    if (failed <= assets.length / 2) return 'degraded';
    return 'down';
    
  } catch (error) {
    return 'down';
  }
}
```

## Health Check Scripts

### Automated Health Check Script

```bash
#!/bin/bash
# health-check.sh - Comprehensive health monitoring

set -euo pipefail

# Configuration
API_URL="https://api.parsify.dev"
WEB_URL="https://parsify.dev"
LOG_FILE="/var/log/parsify-health-check.log"
ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Alert function
send_alert() {
    local message="$1"
    local severity="$2"
    
    curl -X POST "$ALERT_WEBHOOK" \
        -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 $severity Alert: $message\"}"
}

# Health check functions
check_api_health() {
    local response
    local status_code
    local response_time
    
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
                   -X GET "$API_URL/health" 2>/dev/null || echo "failed\n000\n0")
    
    status_code=$(echo "$response" | tail -n2 | head -n1)
    response_time=$(echo "$response" | tail -n1)
    
    if [[ "$status_code" == "200" ]]; then
        if (( $(echo "$response_time < 1.0" | bc -l) )); then
            log "✅ API Health: OK (${response_time}s)"
            return 0
        else
            log "⚠️  API Health: SLOW (${response_time}s)"
            return 1
        fi
    else
        log "❌ API Health: FAILED (HTTP $status_code)"
        return 2
    fi
}

check_web_health() {
    local response
    local status_code
    local response_time
    
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
                   -X GET "$WEB_URL/api/health" 2>/dev/null || echo "failed\n000\n0")
    
    status_code=$(echo "$response" | tail -n2 | head -n1)
    response_time=$(echo "$response" | tail -n1)
    
    if [[ "$status_code" == "200" ]]; then
        if (( $(echo "$response_time < 2.0" | bc -l) )); then
            log "✅ Web Health: OK (${response_time}s)"
            return 0
        else
            log "⚠️  Web Health: SLOW (${response_time}s)"
            return 1
        fi
    else
        log "❌ Web Health: FAILED (HTTP $status_code)"
        return 2
    fi
}

check_database_health() {
    local response
    local db_status
    local response_time
    
    response=$(curl -s -X GET "$API_URL/health/database" 2>/dev/null || echo '{}')
    
    db_status=$(echo "$response" | jq -r '.status // "unknown"')
    response_time=$(echo "$response" | jq -r '.response_time // "unknown"')
    
    if [[ "$db_status" == "ok" ]]; then
        log "✅ Database Health: OK ($response_time)"
        return 0
    elif [[ "$db_status" == "degraded" ]]; then
        log "⚠️  Database Health: DEGRADED ($response_time)"
        return 1
    else
        log "❌ Database Health: FAILED"
        return 2
    fi
}

check_error_rate() {
    local error_count
    local time_range="5m"
    
    error_count=$(wrangler tail --env production --since="$time_range" 2>/dev/null | \
                   grep -c ERROR || echo "0")
    
    if [[ $error_count -lt 5 ]]; then
        log "✅ Error Rate: OK ($error_count errors/$time_range)"
        return 0
    elif [[ $error_count -lt 20 ]]; then
        log "⚠️  Error Rate: ELEVATED ($error_count errors/$time_range)"
        return 1
    else
        log "❌ Error Rate: HIGH ($error_count errors/$time_range)"
        return 2
    fi
}

check_functionality() {
    local test_payload='{"test": "data"}'
    local response
    
    response=$(curl -s -X POST "$API_URL/json/validate" \
                   -H "Content-Type: application/json" \
                   -d "$test_payload" 2>/dev/null || echo '{}')
    
    local is_valid=$(echo "$response" | jq -r '.valid // false')
    
    if [[ "$is_valid" == "true" ]]; then
        log "✅ Functionality: OK"
        return 0
    else
        log "❌ Functionality: FAILED"
        return 2
    fi
}

# Main health check function
run_health_check() {
    log "=== Starting Health Check ==="
    
    local overall_status=0
    
    # Run all health checks
    check_api_health || overall_status=$?
    check_web_health || overall_status=$?
    check_database_health || overall_status=$?
    check_error_rate || overall_status=$?
    check_functionality || overall_status=$?
    
    log "=== Health Check Complete (Status: $overall_status) ==="
    
    # Send alerts if needed
    if [[ $overall_status -eq 2 ]]; then
        send_alert "Critical health check failures detected" "CRITICAL"
    elif [[ $overall_status -eq 1 ]]; then
        send_alert "Health check warnings detected" "WARNING"
    fi
    
    return $overall_status
}

# Run health check if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_health_check
fi
```

### Health Check Cron Configuration

```bash
# Add to crontab for automated health checks
# crontab -e

# Check health every 5 minutes
*/5 * * * * /path/to/health-check.sh

# Comprehensive health check every hour
0 * * * * /path/to/comprehensive-health-check.sh

# Daily health report
0 8 * * * /path/to/daily-health-report.sh
```

## Health Check Monitoring

### Health Check Metrics

#### Response Time Thresholds
- **API Health**: < 1 second (ok), 1-2 seconds (degraded), > 2 seconds (down)
- **Database Health**: < 100ms (ok), 100-500ms (degraded), > 500ms (down)
- **Cache Health**: < 50ms (ok), 50-200ms (degraded), > 200ms (down)
- **Storage Health**: < 200ms (ok), 200-1000ms (degraded), > 1000ms (down)

#### Error Rate Thresholds
- **Acceptable**: < 1% error rate
- **Warning**: 1-5% error rate
- **Critical**: > 5% error rate

#### Availability Thresholds
- **Excellent**: 99.9%+ uptime
- **Good**: 99.5-99.9% uptime
- **Poor**: < 99.5% uptime

### Health Check Dashboard

```yaml
# Health Check Dashboard Configuration
dashboard:
  name: "Parsify Health Status"
  refresh_interval: "1m"
  
  panels:
    - title: "Overall System Health"
      type: "status"
      indicators:
        - api_health
        - web_health
        - database_health
        - cache_health
        
    - title: "Response Times"
      type: "graph"
      metrics:
        - api_response_time
        - database_response_time
        - cache_response_time
      thresholds:
        ok: 1.0
        warning: 2.0
        critical: 5.0
        
    - title: "Error Rates"
      type: "graph"
      metrics:
        - error_rate_percentage
      thresholds:
        ok: 1.0
        warning: 5.0
        critical: 10.0
        
    - title: "Service Availability"
      type: "uptime"
      services:
        - api_service
        - web_service
        - database_service
```

## Health Check Procedures

### During Normal Operations

1. **Continuous Monitoring**: Automated health checks every 5 minutes
2. **Daily Reviews**: Manual health check review during business hours
3. **Weekly Analysis**: Trend analysis and performance review
4. **Monthly Assessment**: Comprehensive health check evaluation

### During Deployments

1. **Pre-deployment**: Baseline health check
2. **During deployment**: Real-time health monitoring
3. **Post-deployment**: Comprehensive health validation
4. **Follow-up**: Extended monitoring for 24 hours

### During Incidents

1. **Increased Frequency**: Health checks every 30 seconds
2. **Expanded Scope**: All system components monitored
3. **Enhanced Logging**: Detailed health check logs
4. **Continuous Updates**: Real-time status communication

## Troubleshooting Health Check Failures

### Common Health Check Issues

1. **API Health Check Failures**
   - Check API service status
   - Verify network connectivity
   - Review API logs for errors

2. **Database Health Check Failures**
   - Check database connectivity
   - Verify database performance
   - Review query performance

3. **Cache Health Check Failures**
   - Check cache service status
   - Verify cache configuration
   - Review cache performance metrics

4. **Frontend Health Check Failures**
   - Check CDN status
   - Verify asset availability
   - Review build and deployment status

### Health Check Debugging Procedures

```bash
# Debug API health check issues
curl -v https://api.parsify.dev/health
wrangler tail --env production --since=10m

# Debug database health issues
wrangler d1 info parsify-prod --env production
wrangler d1 execute parsify-prod --command="SELECT 1;" --env production

# Debug cache health issues
wrangler kv:namespace list --env production
wrangler kv:namespace get test-key --env production

# Debug frontend health issues
curl -v https://parsify.dev/api/health
curl -I https://parsify.dev/_next/static/css/app.css
```

## Related Documents

- [Monitoring Overview](./README.md)
- [Performance Monitoring](./performance-monitoring.md)
- [Alert Configuration](./alerts.md)
- [Emergency Response](../emergency/incident-response.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md)