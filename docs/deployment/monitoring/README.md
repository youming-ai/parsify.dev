# Monitoring and Health Checks

This section contains procedures for monitoring system health, performance, and availability of the Parsify platform.

## Table of Contents

- [Health Checks](./health-checks.md)
- [Performance Monitoring](./performance-monitoring.md)
- [Log Management](./log-management.md)
- [Alert Configuration](./alerts.md)
- [Metrics Collection](./metrics-collection.md)
- [Dashboard Setup](./dashboards.md)

## Monitoring Overview

### System Components Monitored

- **API Services** (Cloudflare Workers): Backend functionality
- **Web Application** (Vercel): Frontend user interface
- **Database** (Cloudflare D1): Data storage and retrieval
- **Storage** (Cloudflare R2): File storage
- **Cache** (Cloudflare KV): Caching layer
- **CDN** (Cloudflare): Content delivery

### Key Performance Indicators (KPIs)

#### Availability Metrics
- **Uptime**: Service availability percentage
- **Error Rate**: Percentage of failed requests
- **Response Time**: API response times
- **Throughput**: Requests per second

#### Performance Metrics
- **Latency**: End-to-end response times
- **CPU Usage**: Worker CPU utilization
- **Memory Usage**: Worker memory utilization
- **Database Performance**: Query response times

#### Business Metrics
- **Active Users**: Number of active users
- **File Processing**: Number of files processed
- **API Usage**: API call volume and patterns
- **User Satisfaction**: Error rates and user feedback

## Monitoring Tools and Services

### Application Performance Monitoring (APM)

- **Primary**: [APM Service Name]
- **URL**: [Dashboard URL]
- **Metrics**: Response times, error rates, throughput
- **Alerting**: Configured thresholds

### Error Tracking

- **Service**: Sentry
- **URL**: [Sentry Dashboard URL]
- **Scope**: Application errors, exceptions
- **Integration**: Slack notifications

### Infrastructure Monitoring

- **Service**: Cloudflare Analytics
- **URL**: [Cloudflare Dashboard URL]
- **Metrics**: Edge performance, security events
- **Features**: Real-time analytics

### Log Management

- **Service**: Wrangler Tail
- **URL**: Command-line access
- **Scope**: Application logs, debugging
- **Retention**: Real-time streaming

## Health Check Procedures

### Automated Health Checks

```bash
# API Health Check
curl -f https://api.parsify.dev/health

# Frontend Health Check
curl -f https://parsify.dev/api/health

# Database Health Check
curl -f https://api.parsify.dev/health/database

# Comprehensive Health Check
curl -f https://api.parsify.dev/health/detailed
```

### Health Check Endpoints

#### Basic Health Check
```
GET /health
Response: {"status": "ok", "timestamp": "2024-01-01T00:00:00Z"}
```

#### Detailed Health Check
```
GET /health/detailed
Response: {
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "ok",
    "cache": "ok",
    "storage": "ok"
  },
  "metrics": {
    "uptime": "99.9%",
    "error_rate": "0.1%",
    "response_time": "250ms"
  }
}
```

#### Database Health Check
```
GET /health/database
Response: {
  "status": "ok",
  "connections": 5,
  "response_time": "15ms"
}
```

### Manual Health Check Procedures

#### Daily Health Check (Every 8 hours)

```bash
#!/bin/bash
# daily-health-check.sh

echo "=== Daily Health Check - $(date) ==="

# Check API health
echo "Checking API health..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.parsify.dev/health)
if [ $API_STATUS -eq 200 ]; then
  echo "✅ API Health: OK"
else
  echo "❌ API Health: FAILED (HTTP $API_STATUS)"
fi

# Check Frontend health
echo "Checking Frontend health..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://parsify.dev/api/health)
if [ $WEB_STATUS -eq 200 ]; then
  echo "✅ Frontend Health: OK"
else
  echo "❌ Frontend Health: FAILED (HTTP $WEB_STATUS)"
fi

# Check response times
echo "Checking response times..."
API_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://api.parsify.dev/health)
if (( $(echo "$API_TIME < 1.0" | bc -l) )); then
  echo "✅ API Response Time: ${API_TIME}s"
else
  echo "❌ API Response Time: ${API_TIME}s (SLOW)"
fi

# Check error rate
echo "Checking error rate..."
ERROR_COUNT=$(wrangler tail --env production --since=1h | grep -c ERROR)
if [ $ERROR_COUNT -lt 10 ]; then
  echo "✅ Error Rate: $ERROR_COUNT errors/hour"
else
  echo "❌ Error Rate: $ERROR_COUNT errors/hour (HIGH)"
fi

echo "=== Health Check Complete ==="
```

## Performance Monitoring

### Performance Metrics Collection

```bash
# Response time monitoring
curl -w "@curl-format.txt" -o /dev/null -s https://api.parsify.dev/health

# curl-format.txt content:
      time_namelookup:  %{time_namelookup}\n
         time_connect:  %{time_connect}\n
      time_appconnect:  %{time_appconnect}\n
     time_pretransfer:  %{time_pretransfer}\n
        time_redirect:  %{time_redirect}\n
   time_starttransfer:  %{time_starttransfer}\n
                      ----------\n
           time_total:  %{time_total}\n
```

### Performance Testing

```bash
# Load testing
pnpm run test:load:quick --baseUrl=https://parsify.dev

# Performance testing
pnpm run test:performance:ci --url=https://api.parsify.dev

# Concurrent user testing
pnpm run test:load:tools --concurrency=50 --duration=300s
```

### Performance Thresholds

- **API Response Time**: < 500ms (p95), < 1000ms (p99)
- **Frontend Load Time**: < 2 seconds
- **Database Query Time**: < 100ms (average)
- **File Upload Time**: < 30 seconds (for 10MB files)
- **Error Rate**: < 1% (total), < 0.1% (critical errors)

## Alert Configuration

### Alert Types

#### Critical Alerts
- **Service Down**: Service unavailable > 1 minute
- **High Error Rate**: Error rate > 5% for 5 minutes
- **Slow Response**: Response time > 2 seconds for 5 minutes
- **Database Issues**: Database unavailable or slow

#### Warning Alerts
- **Elevated Error Rate**: Error rate > 2% for 10 minutes
- **Slow Performance**: Response time > 1 second for 10 minutes
- **High Memory Usage**: Memory usage > 80%
- **High CPU Usage**: CPU usage > 70%

#### Informational Alerts
- **Scheduled Events**: Maintenance, deployments
- **Performance Trends**: Gradual performance changes
- **Usage Spikes**: Unusual traffic patterns

### Alert Configuration

```bash
# Example: Cloudflare Workers alerts
# Configure in Cloudflare dashboard or via API

# Health check alert
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/alerts" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Health Check",
    "description": "Alert when API health check fails",
    "condition": {
      "type": "health_check",
      "config": {
        "url": "https://api.parsify.dev/health",
        "expected_status": 200,
        "consecutive_failures": 2
      }
    },
    "actions": [
      {
        "type": "webhook",
        "url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
      }
    ]
  }'
```

## Log Management

### Log Collection

```bash
# Real-time log streaming
wrangler tail --env production --format=json

# Filter specific log types
wrangler tail --env production | grep ERROR
wrangler tail --env production | grep WARN

# Export logs for analysis
wrangler tail --env production --since=1h > logs-$(date +%Y%m%d-%H%M%S).log
```

### Log Analysis

```bash
# Error analysis
wrangler tail --env production --since=24h | grep ERROR | \
  jq '.message' | sort | uniq -c | sort -nr

# Performance analysis
wrangler tail --env production --since=24h | \
  jq -r '.duration' | awk '{sum+=$1; count++} END {print "Average:", sum/count}'

# Endpoint analysis
wrangler tail --env production --since=24h | \
  jq -r '.url' | sort | uniq -c | sort -nr
```

## Monitoring Dashboard Setup

### Essential Dashboards

#### 1. System Overview Dashboard
- Service availability status
- Real-time error rates
- Response time trends
- Active user count
- System health indicators

#### 2. Performance Dashboard
- API response time metrics
- Database performance metrics
- Cache hit rates
- File processing performance
- Resource utilization

#### 3. Error Dashboard
- Error rate trends
- Error categorization
- Critical error details
- Error frequency analysis
- Error impact assessment

#### 4. Business Metrics Dashboard
- User activity metrics
- Feature usage statistics
- File processing volume
- API usage patterns
- Conversion metrics

### Dashboard Configuration

```yaml
# Example dashboard configuration
dashboard:
  name: "Parsify System Overview"
  refresh_interval: "30s"
  
  panels:
    - title: "Service Status"
      type: "status"
      metrics:
        - api_health
        - web_health
        - database_health
      
    - title: "Error Rate"
      type: "graph"
      metrics:
        - error_rate_percentage
      time_range: "1h"
      
    - title: "Response Time"
      type: "graph"
      metrics:
        - api_response_time_p95
        - api_response_time_p99
      time_range: "1h"
```

## Monitoring Procedures

### Daily Monitoring Checklist

**Morning (9:00 AM UTC)**:
- [ ] Review overnight system health
- [ ] Check error rates and patterns
- [ ] Review performance metrics
- [ ] Analyze any alerts generated
- [ ] Check backup completion status

**Afternoon (2:00 PM UTC)**:
- [ ] Review mid-day performance
- [ ] Check resource utilization
- [ ] Monitor user activity patterns
- [ ] Review any ongoing issues

**Evening (7:00 PM UTC)**:
- [ ] Review daily metrics summary
- [ ] Check for any emerging issues
- [ ] Review alert performance
- [ ] Prepare daily monitoring report

### Weekly Monitoring Procedures

**Monday**:
- [ ] Weekly performance review
- [ ] Alert effectiveness analysis
- [ ] Capacity planning review
- [ ] Monitoring system health check

**Wednesday**:
- [ ] Mid-week performance analysis
- [ ] User behavior pattern review
- [ ] System optimization assessment
- [ ] Documentation updates

**Friday**:
- [ ] Weekly summary preparation
- [ ] Performance trend analysis
- [ ] Alert tuning review
- [ ] Next week monitoring planning

### Monthly Monitoring Procedures

- [ ] Comprehensive performance review
- [ ] Alert threshold optimization
- [ ] Monitoring tool assessment
- [ ] Capacity planning update
- [ ] Documentation maintenance
- [ ] Training and procedure updates

## Incident Response Monitoring

### Enhanced Monitoring During Incidents

When an incident is declared:

1. **Increase Monitoring Frequency**:
   - Health checks every 30 seconds
   - Error rate monitoring every minute
   - Performance metrics every 30 seconds

2. **Expanded Scope**:
   - Monitor all system components
   - Track user impact metrics
   - Monitor external dependencies

3. **Alert Adjustments**:
   - Lower alert thresholds
   - Increase alert frequency
   - Add additional alert conditions

### Incident Monitoring Procedures

```bash
# Enhanced monitoring script during incident
#!/bin/bash
# incident-monitoring.sh

echo "=== Incident Monitoring Started - $(date) ==="

while true; do
  # Health check
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.parsify.dev/health)
  echo "$(date): API Status: $API_STATUS"
  
  # Error rate check
  ERROR_RATE=$(wrangler tail --env production --since=1m | grep -c ERROR)
  echo "$(date): Error Rate: $ERROR_RATE/min"
  
  # Response time check
  RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://api.parsify.dev/health)
  echo "$(date): Response Time: ${RESPONSE_TIME}s"
  
  # Alert if thresholds exceeded
  if [ $API_STATUS -ne 200 ] || [ $ERROR_RATE -gt 10 ] || (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
    echo "🚨 ALERT: Threshold exceeded!"
    # Send alert notification
  fi
  
  sleep 30
done
```

## Monitoring Best Practices

### 1. Comprehensive Coverage
- Monitor all critical system components
- Track both technical and business metrics
- Include external dependencies

### 2. Meaningful Alerts
- Set appropriate thresholds
- Avoid alert fatigue
- Provide actionable alert information

### 3. Historical Analysis
- Maintain performance baselines
- Track trends over time
- Use historical data for capacity planning

### 4. Continuous Improvement
- Regularly review monitoring effectiveness
- Update procedures based on incidents
- Optimize alert configurations

## Related Documents

- [Health Checks](./health-checks.md)
- [Performance Monitoring](./performance-monitoring.md)
- [Alert Configuration](./alerts.md)
- [Log Management](./log-management.md)
- [Incident Response](../emergency/incident-response.md)