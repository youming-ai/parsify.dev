# Production Deployment Procedure

This procedure outlines the steps to deploy the Parsify platform to the production environment.

## Overview

The production environment is the live environment serving end users. Production deployments require careful planning, testing, and coordination.

## Environment Details

- **Environment**: Production
- **API URL**: `https://api.parsify.dev`
- **Web URL**: `https://parsify.dev`
- **Database**: `parsify-prod` (Cloudflare D1)
- **Access**: Public access with rate limiting

## Prerequisites

### Access Requirements

- [ ] Production Cloudflare account access
- [ ] Production Vercel account access
- [ ] GitHub repository main branch access
- [ ] Production secrets access
- [ ] On-call approval

### Pre-deployment Requirements

- [ ] Staging deployment completed and verified
- [ ] QA testing completed and passed
- [ ] Performance testing completed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Change request approved
- [ ] Stakeholder notification sent
- [ ] Maintenance window scheduled

### Risk Assessment

- [ ] Impact assessment completed
- [ ] Rollback plan documented
- [ ] Critical business functions identified
- [ ] Monitoring and alerting configured
- [ ] Communication plan prepared

## Deployment Timeline

### Pre-deployment (T-2 hours)

- [ ] Send final deployment notification
- [ ] Verify backup availability
- [ ] Prepare monitoring dashboards
- [ ] Assemble deployment team
- [ ] Verify communication channels

### Deployment (T-30 minutes to T+30 minutes)

- [ ] Put application in maintenance mode (if required)
- [ ] Execute deployment steps
- [ ] Run verification tests
- [ ] Monitor system health
- [ ] Remove maintenance mode

### Post-deployment (T+30 minutes to T+2 hours)

- [ ] Extended monitoring
- [ ] Performance validation
- [ ] User feedback collection
- [ ] Documentation updates

## Deployment Steps

### 1. Final Preparation

```bash
# Ensure you're on the correct branch
git checkout main
git pull origin main

# Verify no uncommitted changes
git status

# Verify latest commit is the one to deploy
git log -1 --oneline

# Install dependencies
pnpm install

# Run full test suite
pnpm run test
pnpm run test:e2e
pnpm run test:performance
```

### 2. Backup Production State

```bash
# Backup database
cd apps/api
wrangler d1 export parsify-prod --output=backup-$(date +%Y%m%d-%H%M%S).sql

# Backup KV namespaces
wrangler kv:namespace list
wrangler kv:namespace export CACHE --env production
wrangler kv:namespace export SESSIONS --env production

# Create deployment tag
git tag -a production-deploy-$(date +%Y%m%d-%H%M%S) -m "Production deployment $(date)"
git push origin production-deploy-$(date +%Y%m%d-%H%M%S)
```

### 3. Environment Verification

```bash
# Verify production environment variables
cat .env.production

# Test database connectivity
wrangler d1 info parsify-prod --env production

# Verify service health
curl -f https://api.parsify.dev/health
curl -f https://parsify.dev/api/health
```

Required production environment variables:
```bash
# Environment
ENVIRONMENT=production
LOG_LEVEL=info

# API Configuration
API_BASE_URL=https://api.parsify.dev
WEB_URL=https://parsify.dev

# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your-production-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Database
D1_DATABASE_ID=your-production-database-id

# KV Namespaces
KV_CACHE_ID=your-production-cache-id
KV_SESSIONS_ID=your-production-sessions-id
KV_UPLOADS_ID=your-production-uploads-id
KV_ANALYTICS_ID=your-production-analytics-id

# R2 Storage
R2_BUCKET_NAME=parsify-files-prod

# External Services
SENTRY_DSN=your-production-sentry-dsn
JWT_SECRET=your-production-jwt-secret
RATE_LIMIT_ENABLED=true
```

### 4. Build Applications

```bash
# Build for production
NODE_ENV=production pnpm run build

# Verify builds completed successfully
ls -la apps/api/dist
ls -la apps/web/dist
```

### 5. Deploy Backend Services

```bash
cd apps/api

# Deploy to production
wrangler deploy --env production

# Verify deployment success
wrangler deployments list --env production
wrangler status --env production
```

### 6. Database Migration

```bash
# Run database migrations (if any)
wrangler d1 execute parsify-prod --file=./migrations/001_initial.sql --env production

# Verify migration success
wrangler d1 migrations list parsify-prod --env production
```

### 7. Deploy Frontend

```bash
cd apps/web

# Deploy to production
vercel --prod --env ENVIRONMENT=production

# Get production deployment URL
PROD_URL=$(vercel ls --scope parsify-dev --prod | grep parsify-dev | awk '{print $2}')
echo "Production URL: $PROD_URL"
```

### 8. Post-deployment Verification

```bash
# Health checks
curl -f https://api.parsify.dev/health || exit 1
curl -f https://parsify.dev/api/health || exit 1

# Run smoke tests
pnpm run test:smoke --baseUrl=https://parsify.dev

# Performance validation
pnpm run test:performance:ci --url=https://api.parsify.dev

# Load testing (light)
pnpm run test:load:quick --baseUrl=https://parsify.dev
```

### 9. Comprehensive Testing

#### API Testing
```bash
# Test all critical endpoints
curl -X GET https://api.parsify.dev/version
curl -X GET https://api.parsify.dev/health/detailed
curl -X POST https://api.parsify.dev/json/validate \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

#### Web Application Testing
```bash
# Test main functionality
curl -f https://parsify.dev/
curl -f https://parsify.dev/tools/json-formatter
curl -f https://parsify.dev/tools/json-validator
```

#### Integration Testing
```bash
# End-to-end user flows
pnpm run test:e2e --baseUrl=https://parsify.dev --headed=false

# Critical path testing
pnpm run test:e2e --spec=tests/e2e/critical-paths.spec.ts
```

## Monitoring During Deployment

### Key Metrics to Watch

- **API Response Time**: < 500ms for p95
- **Error Rate**: < 1%
- **Throughput**: Expected transaction volume
- **Database Performance**: Query times < 100ms
- **Memory Usage**: < 80% of allocation
- **CPU Usage**: < 70%

### Monitoring Dashboard URLs

- **Application Performance**: [APM Dashboard URL]
- **Infrastructure Metrics**: [Infrastructure Dashboard URL]
- **Error Tracking**: [Sentry Dashboard URL]
- **User Analytics**: [Analytics Dashboard URL]

### Alert Thresholds

- **Error Rate**: > 5% triggers alert
- **Response Time**: > 1s triggers alert
- **Database Connections**: > 80% triggers alert
- **Memory Usage**: > 90% triggers alert

## Rollback Triggers

Immediately rollback if:

- [ ] Error rate exceeds 5%
- [ ] Response time exceeds 2 seconds
- [ ] Critical functionality is broken
- [ ] Database corruption detected
- [ ] Security vulnerabilities identified
- [ ] User complaints increase significantly

## Rollback Procedure

### Immediate Rollback (Critical Issues)

```bash
# Rollback API
cd apps/api
wrangler rollback --env production

# Rollback Frontend
cd apps/web
vercel rollback --scope parsify-dev --prod

# Verify rollback success
curl -f https://api.parsify.dev/health
curl -f https://parsify.dev/api/health
```

### Database Rollback (if needed)

```bash
# Restore database from backup
wrangler d1 execute parsify-prod --file=backup-YYYYMMDD-HHMMSS.sql --env production

# Verify database integrity
wrangler d1 execute parsify-prod --command="SELECT COUNT(*) FROM users;" --env production
```

## Post-Deployment Tasks

### Immediate (T+0 to T+30 minutes)

- [ ] Monitor error rates and response times
- [ ] Verify all critical user journeys work
- [ ] Check social media for user feedback
- [ ] Send deployment success notification

### Short-term (T+30 minutes to T+2 hours)

- [ ] Extended performance monitoring
- [ ] Review application logs for issues
- [ ] Validate business metrics
- [ ] Update deployment documentation

### Long-term (T+2 hours to T+24 hours)

- [ ] Continue monitoring system health
- [ ] Analyze performance trends
- [ ] Collect user feedback
- [ ] Plan for any necessary hotfixes

## Communication Plan

### Pre-deployment

- **2 hours before**: Send preparation notification
- **30 minutes before**: Send deployment start notification

### During Deployment

- **Start**: "Deployment starting - ETA 30 minutes"
- **Complete**: "Deployment completed - Verification in progress"
- **Verified**: "Deployment verified - Monitoring active"

### Post-deployment

- **Success**: "Production deployment successful"
- **Issues**: "Production deployment issues detected - Investigation in progress"

## Incident Response

If critical issues are detected during deployment:

1. **Stop Deployment**: Immediately halt deployment process
2. **Assess Impact**: Determine severity and affected users
3. **Communicate**: Notify stakeholders and users if necessary
4. **Rollback**: Execute rollback procedures if needed
5. **Investigate**: Determine root cause of issues
6. **Document**: Record all actions and decisions

## Checklist Summary

### Pre-deployment
- [ ] All tests passing
- [ ] QA approval received
- [ ] Stakeholders notified
- [ ] Backup completed
- [ ] Rollback plan prepared
- [ ] Monitoring configured

### Deployment
- [ ] Backend services deployed
- [ ] Database migrated
- [ ] Frontend deployed
- [ ] Health checks passing
- [ ] Smoke tests passing

### Post-deployment
- [ ] Critical functionality verified
- [ ] Performance within thresholds
- [ ] Error rates acceptable
- [ ] Users notified
- [ ] Documentation updated

## Contacts

- **On-call Engineer**: [Phone Number]
- **Engineering Lead**: [Phone Number]
- **DevOps Team**: [Slack Channel]
- **Product Manager**: [Email Address]
- **Support Team**: [Email Address]

## Related Documents

- [Staging Deployment Procedure](./staging-deployment.md)
- [Emergency Response Procedures](../emergency/incident-response.md)
- [Rollback Procedures](../emergency/rollback.md)
- [Monitoring Procedures](../monitoring/health-checks.md)
- [Change Management Policy](../operations/change-management.md)