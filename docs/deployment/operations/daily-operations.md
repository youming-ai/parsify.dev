# Daily Operations Procedures

This document outlines the standard daily operating procedures for the Parsify platform operations team.

## Daily Operations Schedule

### Shift Coverage

#### Primary Shift (UTC Times)
- **Hours**: 9:00 AM - 5:00 PM UTC
- **Coverage**: Full operations coverage
- **Responsibilities**: All operational tasks

#### Extended Coverage (UTC Times)
- **Hours**: 5:00 PM - 9:00 AM UTC
- **Coverage**: On-call coverage only
- **Responsibilities**: Critical issues and emergencies only

### Daily Checklist Timeline

#### Morning Routine (9:00 AM - 10:00 AM UTC)

**9:00 AM - Handover Review**
```bash
#!/bin/bash
# morning-handover.sh

echo "=== Morning Handover - $(date) ==="

# Review overnight alerts
echo "Reviewing overnight alerts..."
# Check monitoring dashboard for overnight alerts
# Review any automated notifications
# Check email for overnight incidents

# Review system status
echo "Checking system status..."
curl -f https://api.parsify.dev/health
curl -f https://parsify.dev/api/health

# Check error rates
ERROR_COUNT=$(wrangler tail --env production --since=8h | grep -c ERROR)
echo "Overnight error count: $ERROR_COUNT"

# Review backup status
echo "Checking backup completion..."
# Verify overnight backups completed successfully

# Check resource utilization
echo "Reviewing resource utilization..."
# Check CPU, memory, storage usage

echo "=== Handover Review Complete ==="
```

**9:15 AM - System Health Assessment**
```bash
#!/bin/bash
# system-health-check.sh

echo "=== System Health Assessment - $(date) ==="

# API Health Check
echo "Checking API health..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.parsify.dev/health)
if [ $API_STATUS -eq 200 ]; then
    echo "✅ API Health: OK"
else
    echo "❌ API Health: FAILED (HTTP $API_STATUS)"
fi

# Frontend Health Check
echo "Checking Frontend health..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://parsify.dev/api/health)
if [ $WEB_STATUS -eq 200 ]; then
    echo "✅ Frontend Health: OK"
else
    echo "❌ Frontend Health: FAILED (HTTP $WEB_STATUS)"
fi

# Database Health Check
echo "Checking Database health..."
DB_RESPONSE=$(curl -s https://api.parsify.dev/health/database)
DB_STATUS=$(echo "$DB_RESPONSE" | jq -r '.status // "unknown"')
if [ "$DB_STATUS" == "ok" ]; then
    echo "✅ Database Health: OK"
else
    echo "❌ Database Health: $DB_STATUS"
fi

# Performance Check
echo "Checking performance..."
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://api.parsify.dev/health)
if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
    echo "✅ Performance: OK (${RESPONSE_TIME}s)"
else
    echo "⚠️ Performance: SLOW (${RESPONSE_TIME}s)"
fi

echo "=== System Health Assessment Complete ==="
```

**9:30 AM - Security Review**
```bash
#!/bin/bash
# security-review.sh

echo "=== Security Review - $(date) ==="

# Check for security alerts
echo "Reviewing security alerts..."
# Check security monitoring dashboard
# Review any security alerts from overnight

# Access review
echo "Reviewing recent access..."
# Check for unusual access patterns
# Review new user accounts
# Check for privilege escalations

# Vulnerability scan results
echo "Checking vulnerability scan results..."
# Review latest vulnerability scan results
# Check for new critical vulnerabilities

# SSL certificate expiry
echo "Checking SSL certificates..."
# Check SSL certificate expiry dates
# Alert if certificates expiring soon

echo "=== Security Review Complete ==="
```

**9:45 AM - Performance Analysis**
```bash
#!/bin/bash
# performance-analysis.sh

echo "=== Performance Analysis - $(date) ==="

# Response time analysis
echo "Analyzing response times..."
# Check p50, p95, p99 response times
# Compare against performance baselines

# Error rate analysis
echo "Analyzing error rates..."
# Calculate error rate for last 24 hours
# Compare against acceptable thresholds

# Throughput analysis
echo "Analyzing throughput..."
# Check requests per second
# Analyze traffic patterns

# Resource utilization
echo "Analyzing resource utilization..."
# Check CPU, memory usage
# Monitor database performance

echo "=== Performance Analysis Complete ==="
```

#### Mid-Day Monitoring (12:00 PM - 1:00 PM UTC)

**12:00 PM - Mid-Day Health Check**
```bash
#!/bin/bash
# midday-health-check.sh

echo "=== Mid-Day Health Check - $(date) ==="

# Quick health status
curl -f https://api.parsify.dev/health
curl -f https://parsify.dev/api/health

# Error rate check (last hour)
ERROR_COUNT=$(wrangler tail --env production --since=1h | grep -c ERROR)
echo "Error rate (last hour): $ERROR_COUNT"

# Performance check
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://api.parsify.dev/health)
echo "Response time: ${RESPONSE_TIME}s"

# User activity check
echo "Checking user activity..."
# Monitor active user count
# Check for unusual activity patterns

echo "=== Mid-Day Health Check Complete ==="
```

**12:30 PM - Capacity Check**
```bash
#!/bin/bash
# capacity-check.sh

echo "=== Capacity Check - $(date) ==="

# Database capacity
echo "Checking database capacity..."
# Monitor database size
# Check storage utilization

# Application capacity
echo "Checking application capacity..."
# Monitor worker utilization
# Check memory usage

# Network capacity
echo "Checking network capacity..."
# Monitor bandwidth usage
# Check for any network bottlenecks

# Cache capacity
echo "Checking cache capacity..."
# Monitor cache hit rates
# Check cache memory usage

echo "=== Capacity Check Complete ==="
```

#### Afternoon Routine (2:00 PM - 3:00 PM UTC)

**2:00 PM - Issue Review**
```bash
#!/bin/bash
# issue-review.sh

echo "=== Issue Review - $(date) ==="

# Review open issues
echo "Reviewing open issues..."
# Check for any open support tickets
# Review any reported bugs
# Check for any unresolved incidents

# Review recent deployments
echo "Reviewing recent deployments..."
# Check for any recent deployments
# Monitor for any deployment-related issues

# Review system logs
echo "Reviewing system logs..."
# Check for any unusual log entries
# Look for patterns in errors

echo "=== Issue Review Complete ==="
```

**2:30 PM - Backup Verification**
```bash
#!/bin/bash
# backup-verification.sh

echo "=== Backup Verification - $(date) ==="

# Verify last backup
echo "Verifying last backup..."
# Check if last backup completed successfully
# Verify backup integrity

# Check backup schedule
echo "Checking backup schedule..."
# Verify backup schedule is running correctly
# Check for any missed backups

# Test restore capability
echo "Testing restore capability..."
# Periodic test of backup restoration
# Verify restore procedures work

echo "=== Backup Verification Complete ==="
```

#### Evening Routine (5:00 PM - 6:00 PM UTC)

**5:00 PM - Daily Summary**
```bash
#!/bin/bash
# daily-summary.sh

echo "=== Daily Summary - $(date) ==="

# System status summary
echo "System Status Summary:"
echo "====================="
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.parsify.dev/health)
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://parsify.dev/api/health)
ERROR_COUNT=$(wrangler tail --env production --since=24h | grep -c ERROR)
AVG_RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://api.parsify.dev/health)

echo "API Status: $API_STATUS"
echo "Web Status: $WEB_STATUS"
echo "Error Count (24h): $ERROR_COUNT"
echo "Avg Response Time: ${AVG_RESPONSE_TIME}s"

# Performance summary
echo ""
echo "Performance Summary:"
echo "===================="
# Calculate performance metrics for the day
# Compare against performance targets

# Incident summary
echo ""
echo "Incident Summary:"
echo "=================="
# List any incidents that occurred during the day
# Note resolution status

echo "=== Daily Summary Complete ==="
```

**5:30 PM - Handover Preparation**
```bash
#!/bin/bash
# handover-preparation.sh

echo "=== Handover Preparation - $(date) ==="

# Prepare handover notes
echo "Preparing handover notes..."
cat > handover-notes-$(date +%Y%m%d).md << EOF
# Handover Notes - $(date +%Y-%m-%d)

## System Status
- API Status: $(curl -s -o /dev/null -w "%{http_code}" https://api.parsify.dev/health)
- Web Status: $(curl -s -o /dev/null -w "%{http_code}" https://parsify.dev/api/health)
- Error Count (24h): $(wrangler tail --env production --since=24h | grep -c ERROR)

## Issues Identified
- [List any issues identified during the day]
- [Note any ongoing investigations]

## Pending Actions
- [List any pending actions]
- [Note any follow-up required]

## Tomorrow's Priorities
- [List priorities for tomorrow]
- [Note any scheduled activities]

EOF

# Prepare on-call handover
echo "Preparing on-call handover..."
# Update on-call documentation
# Notify on-call engineer of any issues

echo "=== Handover Preparation Complete ==="
```

## Daily Operating Procedures

### 1. System Monitoring

#### Continuous Monitoring
```bash
# continuous-monitoring.sh - Runs every 5 minutes
#!/bin/bash

while true; do
    # Health checks
    API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.parsify.dev/health)
    WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://parsify.dev/api/health)
    
    # Alert if health checks fail
    if [ $API_HEALTH -ne 200 ] || [ $WEB_HEALTH -ne 200 ]; then
        echo "$(date): Health check failure detected"
        # Send alert notification
    fi
    
    # Check error rate
    ERROR_RATE=$(wrangler tail --env production --since=5m | grep -c ERROR)
    if [ $ERROR_RATE -gt 10 ]; then
        echo "$(date): High error rate detected: $ERROR_RATE"
        # Send alert notification
    fi
    
    sleep 300  # 5 minutes
done
```

#### Performance Monitoring
```bash
# performance-monitoring.sh - Runs every hour
#!/bin/bash

echo "=== Performance Monitoring - $(date) ==="

# Collect performance metrics
API_RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://api.parsify.dev/health)
DATABASE_RESPONSE_TIME=$(curl -s https://api.parsify.dev/health/database | jq -r '.response_time')

# Log metrics
echo "$(date),API,$API_RESPONSE_TIME" >> /var/log/api-response-times.log
echo "$(date),DATABASE,$DATABASE_RESPONSE_TIME" >> /var/log/db-response-times.log

# Check for performance issues
if (( $(echo "$API_RESPONSE_TIME > 1.0" | bc -l) )); then
    echo "Alert: API response time high: ${API_RESPONSE_TIME}s"
fi

echo "=== Performance Monitoring Complete ==="
```

### 2. Log Management

#### Log Review
```bash
# log-review.sh - Runs every 2 hours
#!/bin/bash

echo "=== Log Review - $(date) ==="

# Review error logs
echo "Reviewing error logs..."
wrangler tail --env production --since=2h | grep ERROR > /tmp/error-log-$(date +%H%M).log
ERROR_COUNT=$(wc -l < /tmp/error-log-$(date +%H%M).log)

if [ $ERROR_COUNT -gt 0 ]; then
    echo "Found $ERROR_COUNT errors in the last 2 hours"
    
    # Analyze error patterns
    echo "Top error types:"
    cat /tmp/error-log-$(date +%H%M).log | jq -r '.message' | sort | uniq -c | sort -nr | head -5
fi

# Review access logs
echo "Reviewing access logs..."
# Analyze access patterns
# Check for unusual activity

echo "=== Log Review Complete ==="
```

#### Log Rotation
```bash
# log-rotation.sh - Runs daily at midnight
#!/bin/bash

echo "=== Log Rotation - $(date) ==="

# Rotate application logs
find /var/log -name "*.log" -mtime +7 -delete

# Archive old logs
find /var/log -name "*.log" -mtime +1 -gzip

# Clean up temporary files
find /tmp -name "*" -mtime +1 -delete

echo "=== Log Rotation Complete ==="
```

### 3. Backup Operations

#### Automated Backup
```bash
# automated-backup.sh - Runs daily at 2 AM UTC
#!/bin/bash

echo "=== Automated Backup - $(date) ==="

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Database backup
echo "Creating database backup..."
wrangler d1 export parsify-prod --output=$BACKUP_DIR/database.sql

# Configuration backup
echo "Creating configuration backup..."
cp -r /etc/parsify $BACKUP_DIR/config/

# Verify backup
echo "Verifying backup..."
if [ -f $BACKUP_DIR/database.sql ] && [ -d $BACKUP_DIR/config ]; then
    echo "✅ Backup completed successfully"
else
    echo "❌ Backup failed"
    # Send alert notification
fi

# Cleanup old backups (keep 30 days)
find /backups -type d -mtime +30 -exec rm -rf {} \;

echo "=== Automated Backup Complete ==="
```

#### Backup Verification
```bash
# backup-verification.sh - Runs daily after backup
#!/bin/bash

echo "=== Backup Verification - $(date) ==="

BACKUP_DIR="/backups/$(date +%Y%m%d)"

# Verify database backup
echo "Verifying database backup..."
if [ -f $BACKUP_DIR/database.sql ]; then
    # Check database backup integrity
    DB_SIZE=$(wc -c < $BACKUP_DIR/database.sql)
    if [ $DB_SIZE -gt 1000 ]; then
        echo "✅ Database backup verified (Size: $DB_SIZE bytes)"
    else
        echo "❌ Database backup too small (Size: $DB_SIZE bytes)"
    fi
else
    echo "❌ Database backup file not found"
fi

# Test restore capability (weekly)
if [ $(date +%u) -eq 1 ]; then  # Monday
    echo "Testing backup restore..."
    # Test restore to temporary database
    # Verify restore functionality
fi

echo "=== Backup Verification Complete ==="
```

### 4. Security Operations

#### Security Monitoring
```bash
# security-monitoring.sh - Runs continuously
#!/bin/bash

echo "=== Security Monitoring - $(date) ==="

# Monitor failed login attempts
FAILED_LOGINS=$(wrangler tail --env production --since=1h | grep -c "FAILED_LOGIN")
if [ $FAILED_LOGINS -gt 50 ]; then
    echo "Alert: High number of failed login attempts: $FAILED_LOGINS"
fi

# Monitor for suspicious activity
echo "Checking for suspicious activity..."
# Look for unusual access patterns
# Check for data access anomalies

# Monitor file integrity
echo "Checking file integrity..."
# Verify critical files haven't been modified
# Check for unauthorized changes

echo "=== Security Monitoring Complete ==="
```

#### Vulnerability Scanning
```bash
# vulnerability-scan.sh - Runs daily
#!/bin/bash

echo "=== Vulnerability Scan - $(date) ==="

# Application vulnerability scan
echo "Scanning application vulnerabilities..."
pnpm audit --audit-level=moderate > /tmp/vuln-scan-$(date +%Y%m%d).log

# Infrastructure vulnerability scan
echo "Scanning infrastructure vulnerabilities..."
# Run infrastructure security scan
# Check for known vulnerabilities

# Report results
VULN_COUNT=$(grep -c "vulnerabilities found" /tmp/vuln-scan-$(date +%Y%m%d).log)
if [ $VULN_COUNT -gt 0 ]; then
    echo "Alert: $VULN_COUNT vulnerabilities found"
    # Send alert notification
fi

echo "=== Vulnerability Scan Complete ==="
```

## Daily Reporting

### Daily Operations Report

```bash
# daily-operations-report.sh - Runs at 6 PM UTC
#!/bin/bash

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="/reports/daily-operations-$REPORT_DATE.md"

cat > $REPORT_FILE << EOF
# Daily Operations Report - $REPORT_DATE

## Executive Summary
[System status summary for the day]

## System Health
- API Availability: [Percentage]
- Web Availability: [Percentage]
- Database Status: [Status]
- Overall Health: [Status]

## Performance Metrics
- Average Response Time: [Time]
- P95 Response Time: [Time]
- Error Rate: [Percentage]
- Throughput: [Requests per second]

## Incidents
- Total Incidents: [Number]
- Critical Incidents: [Number]
- Average Resolution Time: [Time]
- Incidents Resolved: [Number]

## Security
- Security Events: [Number]
- Vulnerabilities Identified: [Number]
- Failed Login Attempts: [Number]

## Maintenance Activities
- Scheduled Maintenance: [Completed/Failed]
- Emergency Maintenance: [Completed/Failed]
- Updates Applied: [List]

## Resource Utilization
- CPU Usage: [Percentage]
- Memory Usage: [Percentage]
- Storage Usage: [Percentage]
- Network Usage: [Percentage]

## Issues and Concerns
[List any issues or concerns identified during the day]

## Tomorrow's Priorities
[List priorities for tomorrow]

## Recommendations
[Any recommendations for improvement]

EOF

echo "Daily operations report generated: $REPORT_FILE"
```

## Daily Operations Contacts

### Primary Contacts
- **Operations Lead**: [Phone Number]
- **On-call Engineer**: [Phone Number]
- **System Administrator**: [Phone Number]
- **Database Administrator**: [Phone Number]

### Escalation Contacts
- **Engineering Lead**: [Phone Number]
- **DevOps Team**: [Slack Channel]
- **Security Team**: [Email Address]

### External Contacts
- **Cloudflare Support**: [Contact Information]
- **Vercel Support**: [Contact Information]
- **Third-party Vendors**: [Contact List]

## Daily Operations Tools

### Required Tools
- **Monitoring Dashboard**: [Dashboard URL]
- **Log Analysis Tools**: [Tool List]
- **SSH/Remote Access**: [Access Information]
- **Communication Tools**: Slack, Email, Phone

### Automation Scripts
- **Health Monitoring**: [Script Location]
- **Backup Scripts**: [Script Location]
- **Alert Scripts**: [Script Location]
- **Report Generation**: [Script Location]

## Daily Operations Best Practices

### 1. Consistency
- Follow the same procedures every day
- Use standardized checklists and scripts
- Maintain consistent documentation
- Regular communication with team members

### 2. Proactive Monitoring
- Don't wait for alerts to check system health
- Monitor trends and patterns
- Identify potential issues before they become critical
- Regular capacity and performance reviews

### 3. Documentation
- Document all activities and observations
- Keep runbooks and procedures up to date
- Share knowledge with team members
- Maintain comprehensive logs

### 4. Communication
- Regular communication with team members
- Clear and concise status updates
- Timely notification of issues
- Effective handover procedures

## Related Documents

- [Operations Overview](./README.md)
- [Incident Response](../emergency/incident-response.md)
- [Monitoring Procedures](../monitoring/health-checks.md)
- [Backup Procedures](./backup-procedures.md)
- [Security Operations](./security-operations.md)