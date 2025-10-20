# Rollback Procedures

This document outlines the procedures for rolling back deployments and reverting system changes during emergencies.

## Table of Contents

- [Quick Rollback](#quick-rollback)
- [Full System Rollback](#full-system-rollback)
- [Database Rollback](#database-rollback)
- [Configuration Rollback](#configuration-rollback)
- [Validation Procedures](#validation-procedures)
- [Rollback Decision Criteria](#rollback-decision-criteria)

## Quick Rollback Commands

### API Rollback
```bash
# Navigate to API directory
cd apps/api

# Check deployment history
wrangler deployments list --env production

# Rollback to previous deployment
wrangler rollback --env production

# Verify rollback success
wrangler deployments list --env production
curl -f https://api.parsify.dev/health
```

### Frontend Rollback
```bash
# Navigate to web directory
cd apps/web

# Check deployment history
vercel ls --scope parsify-dev

# Rollback to previous deployment
vercel rollback --scope parsify-dev --prod

# Verify rollback success
vercel ls --scope parsify-dev
curl -f https://parsify.dev/
```

## Full System Rollback

### When to Use Full Rollback

- **Critical Errors**: > 5% error rate
- **Performance Issues**: Response times > 2 seconds
- **Security Vulnerabilities**: Confirmed security issues
- **Data Corruption**: Data integrity issues
- **User Impact**: > 25% of users affected

### Step-by-Step Procedure

#### Step 1: Assessment (0-5 minutes)

```bash
# Verify system health
curl -f https://api.parsify.dev/health || echo "API Unhealthy"
curl -f https://parsify.dev/api/health || echo "Frontend Unhealthy"

# Check error rates
wrangler tail --env production --since=1m | grep -c ERROR

# Assess business impact
echo "Checking user impact..."
# Check monitoring dashboard for user metrics
```

#### Step 2: Preparation (5-10 minutes)

```bash
# Create rollback branch
git checkout -b emergency-rollback-$(date +%Y%m%d-%H%M%S)

# Backup current state
wrangler d1 export parsify-prod --output=pre-rollback-backup.sql

# Notify team
echo "ROLLBACK INITIATED at $(date)" | tee rollback.log
```

#### Step 3: API Rollback (10-15 minutes)

```bash
cd apps/api

# Get last known good deployment
LAST_GOOD=$(wrangler deployments list --env production | head -2 | tail -1 | awk '{print $1}')

# Rollback to last good deployment
wrangler rollback --env production --deployment-id $LAST_GOOD

# Verify API health
sleep 10
curl -f https://api.parsify.dev/health || echo "API Rollback Failed"

# Check API functionality
curl -X POST https://api.parsify.dev/json/validate \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' || echo "API Functionality Failed"
```

#### Step 4: Frontend Rollback (15-20 minutes)

```bash
cd apps/web

# Get last known good deployment
LAST_GOOD=$(vercel ls --scope parsify-dev --prod | head -2 | tail -1 | awk '{print $2}')

# Rollback to last good deployment
vercel rollback --scope parsify.dev --prod --url $LAST_GOOD

# Verify frontend health
sleep 10
curl -f https://parsify.dev/ || echo "Frontend Rollback Failed"

# Check frontend functionality
curl -f https://parsify.dev/tools/json-formatter || echo "Frontend Functionality Failed"
```

#### Step 5: Validation (20-25 minutes)

```bash
# Run smoke tests
pnpm run test:smoke --baseUrl=https://parsify.dev

# Check critical user flows
curl -f https://parsify.dev/
curl -f https://api.parsify.dev/health

# Verify error rates are acceptable
sleep 30
ERROR_COUNT=$(wrangler tail --env production --since=1m | grep -c ERROR)
if [ $ERROR_COUNT -gt 5 ]; then
  echo "High error rate after rollback: $ERROR_COUNT"
else
  echo "Error rate acceptable: $ERROR_COUNT"
fi
```

#### Step 6: Communication (25-30 minutes)

```bash
# Update status page
echo "System rollback completed at $(date)" >> rollback.log

# Notify stakeholders
echo "Rollback completed successfully. System health restored." | \
  mail -s "ROLLBACK COMPLETED: Parsify Service" engineering@parsify.dev

# Update incident channel
echo "✅ Rollback completed. System health restored." | \
  curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"'$TEXT'"}' $SLACK_WEBHOOK_URL
```

## Database Rollback

### When Database Rollback is Needed

- **Schema Migration Failure**: Migration caused data corruption
- **Data Integrity Issues**: Inconsistent or corrupted data
- **Performance Degradation**: Query performance severely impacted
- **Data Loss**: Accidental data deletion

### Database Rollback Procedure

#### Step 1: Assess Database State

```bash
# Check database connectivity
wrangler d1 info parsify-prod --env production

# Check table integrity
wrangler d1 execute parsify-prod --command="
  SELECT name, sql FROM sqlite_master 
  WHERE type = 'table' AND name NOT LIKE 'sqlite_%';
" --env production

# Check recent changes
wrangler d1 execute parsify-prod --command="
  SELECT 'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'files' as table_name, COUNT(*) as count FROM files
  UNION ALL
  SELECT 'sessions' as table_name, COUNT(*) as count FROM sessions;
" --env production
```

#### Step 2: Create Database Backup

```bash
# Create immediate backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
wrangler d1 export parsify-prod --output=emergency-backup-$TIMESTAMP.sql

# Verify backup was created
ls -la emergency-backup-$TIMESTAMP.sql
```

#### Step 3: Restore from Backup

```bash
# Identify last known good backup
GOOD_BACKUP="backup-YYYYMMDD-HHMMSS.sql"

# Verify backup file exists
if [ -f "$GOOD_BACKUP" ]; then
  echo "Restoring from backup: $GOOD_BACKUP"
  
  # Restore database
  wrangler d1 execute parsify-prod --file=$GOOD_BACKUP --env production
  
  # Verify restoration
  wrangler d1 execute parsify-prod --command="SELECT COUNT(*) FROM users;" --env production
else
  echo "Backup file not found: $GOOD_BACKUP"
  exit 1
fi
```

#### Step 4: Validate Database

```bash
# Check data integrity
wrangler d1 execute parsify-prod --command="
  PRAGMA integrity_check;
" --env production

# Verify data consistency
wrangler d1 execute parsify-prod --command="
  SELECT 'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'files' as table_name, COUNT(*) as count FROM files;
" --env production

# Test basic functionality
curl -f https://api.parsify.dev/health/database || echo "Database health check failed"
```

## Configuration Rollback

### Environment Variable Rollback

```bash
# List current environment variables
wrangler secret list --env production

# Identify problematic variable
echo "Check recent changes to environment variables"

# Rollback specific variable
wrangler secret put VARIABLE_NAME --env production
# Enter the previous value when prompted

# Or rollback all variables from backup
wrangler secret bulk --env production --file=secrets-backup.json
```

### Configuration File Rollback

```bash
# Check git history for configuration changes
git log --oneline -10 apps/api/wrangler.toml

# Rollback configuration file
git checkout [previous-commit] apps/api/wrangler.toml

# Redeploy with old configuration
wrangler deploy --env production
```

## Validation Procedures

### Health Checks

```bash
# API health checks
echo "Checking API health..."
curl -f https://api.parsify.dev/health || echo "❌ API Health Check Failed"

# Frontend health checks
echo "Checking Frontend health..."
curl -f https://parsify.dev/api/health || echo "❌ Frontend Health Check Failed"

# Database health checks
echo "Checking Database health..."
curl -f https://api.parsify.dev/health/database || echo "❌ Database Health Check Failed"
```

### Functional Tests

```bash
# Test core functionality
echo "Testing JSON validation..."
curl -X POST https://api.parsify.dev/json/validate \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' | jq .

# Test file upload
echo "Testing file upload..."
curl -X POST https://api.parsify.dev/upload \
  -F "file=@test.json" \
  -F "type=json" || echo "❌ File Upload Test Failed"

# Test authentication
echo "Testing authentication..."
curl -X POST https://api.parsify.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test"}' || echo "❌ Authentication Test Failed"
```

### Performance Validation

```bash
# Check response times
echo "Checking response times..."
for i in {1..10}; do
  response_time=$(curl -o /dev/null -s -w '%{time_total}' https://api.parsify.dev/health)
  echo "Request $i: ${response_time}s"
done

# Run performance test
pnpm run test:performance:quick --url=https://api.parsify.dev
```

## Rollback Decision Criteria

### Immediate Rollback Triggers

- **Service Unavailable**: API returns 500+ errors
- **Data Corruption**: Data integrity checks fail
- **Security Issues**: Confirmed vulnerability exploitation
- **Performance Severe**: Response times > 5 seconds
- **User Impact**: > 50% of users cannot access service

### Consider Rollback When

- **High Error Rate**: > 10% of requests failing
- **Performance Degradation**: Response times > 2 seconds
- **Broken Functionality**: Core features not working
- **User Complaints**: Significant user feedback about issues

### Monitor Before Rollback

- **Error Rate Trend**: Is it increasing or decreasing?
- **System Resources**: CPU, memory usage
- **External Dependencies**: Are third-party services available?
- **Recent Changes**: Can you identify the problematic change?

## Post-Rollback Procedures

### Immediate Actions

1. **Verify System Health**: All health checks passing
2. **Monitor Error Rates**: Ensure they return to normal
3. **Check User Experience**: Verify core functionality works
4. **Communicate Status**: Notify stakeholders of successful rollback

### Documentation

```bash
# Create rollback report
cat > rollback-report-$(date +%Y%m%d-%H%M%S).md << EOF
# Rollback Report

## Time
- Started: $(date)
- Completed: $(date)

## Reason
[Description of why rollback was initiated]

## Actions Taken
- API Rollback: [Version/Deployment ID]
- Frontend Rollback: [Version/Deployment ID]
- Database Changes: [Description]
- Configuration Changes: [Description]

## Validation
- Health Checks: [Status]
- Functional Tests: [Status]
- Performance: [Status]

## Next Steps
- [Root cause investigation]
- [Fix development]
- [Testing procedures]
- [Deployment schedule]
EOF
```

### Root Cause Investigation

1. **Analyze Logs**: Review error logs before rollback
2. **Check Changes**: Review recent code/configuration changes
3. **Performance Data**: Analyze metrics from affected period
4. **User Reports**: Review user feedback and support tickets

## Emergency Contact Information

- **On-call Engineer**: [Phone Number]
- **Engineering Lead**: [Phone Number]
- **DevOps Team**: [Slack Channel]
- **Database Administrator**: [Phone Number]

## Related Documents

- [Incident Response](./incident-response.md)
- [Disaster Recovery](./disaster-recovery.md)
- [Data Recovery](./data-recovery.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md)