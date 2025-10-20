# Staging Deployment Procedure

This procedure outlines the steps to deploy the Parsify platform to the staging environment.

## Overview

The staging environment is used for:
- Testing new features before production release
- Validating configuration changes
- Performance testing
- User acceptance testing (UAT)
- Integration testing

## Environment Details

- **Environment**: Staging
- **API URL**: `https://api-staging.parsify.dev`
- **Web URL**: `https://staging.parsify.dev`
- **Database**: `parsify-staging` (Cloudflare D1)
- **Access**: Requires authentication

## Prerequisites

### Access Requirements

- [ ] Cloudflare account with Worker access
- [ ] Vercel account with project access
- [ ] GitHub repository write access
- [ ] Access to staging environment secrets

### Tools Required

- [ ] Node.js 18+ installed
- [ ] PNPM package manager
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Git configured

### Pre-deployment Checks

- [ ] All tests passing in target branch
- [ ] Code review completed and approved
- [ ] Documentation updated
- [ ] Staging environment variables configured
- [ ] Backup of current staging state (optional)
- [ ] Deployment window scheduled with team

## Deployment Steps

### 1. Preparation

```bash
# Clone the latest code
git fetch origin
git checkout main
git pull origin main

# Switch to deployment branch
git checkout -b deploy-staging-$(date +%Y%m%d-%H%M%S)

# Install dependencies
pnpm install

# Run type checking
pnpm run type-check

# Run linting
pnpm run lint

# Run tests
pnpm run test
```

### 2. Environment Configuration

```bash
# Set environment to staging
export NODE_ENV=staging

# Verify staging environment variables
cat .env.staging
```

Required staging environment variables:
```bash
# Environment
ENVIRONMENT=staging
LOG_LEVEL=debug

# API Configuration
API_BASE_URL=https://api-staging.parsify.dev
WEB_URL=https://staging.parsify.dev

# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your-staging-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Database
D1_DATABASE_ID=your-staging-database-id

# KV Namespaces
KV_CACHE_ID=your-staging-cache-id
KV_SESSIONS_ID=your-staging-sessions-id
KV_UPLOADS_ID=your-staging-uploads-id
KV_ANALYTICS_ID=your-staging-analytics-id

# R2 Storage
R2_BUCKET_NAME=parsify-files-staging

# External Services
SENTRY_DSN=your-staging-sentry-dsn
JWT_SECRET=your-staging-jwt-secret
```

### 3. Build Applications

```bash
# Build all applications
pnpm run build

# Build API specifically
cd apps/api
pnpm run build

# Build web application
cd ../web
pnpm run build
```

### 4. Deploy Backend Services

```bash
# Navigate to API directory
cd apps/api

# Deploy to staging
wrangler deploy --env staging

# Verify deployment
wrangler whoami
wrangler status
```

### 5. Deploy Frontend

```bash
# Navigate to web directory
cd apps/web

# Deploy to staging
vercel --env ENVIRONMENT=staging

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --scope parsify-dev | grep staging | awk '{print $2}')
echo "Staging deployment URL: $DEPLOYMENT_URL"
```

### 6. Database Migration

```bash
# Run database migrations (if any)
cd apps/api
wrangler d1 execute parsify-staging --file=./migrations/001_initial.sql --env staging

# Verify database schema
wrangler d1 execute parsify-staging --command="SELECT name FROM sqlite_master WHERE type='table';" --env staging
```

### 7. Post-deployment Verification

```bash
# Health checks
curl -f https://api-staging.parsify.dev/health || exit 1
curl -f https://staging.parsify.dev/api/health || exit 1

# Run smoke tests
pnpm run test:smoke --baseUrl=https://staging.parsify.dev

# Run integration tests
pnpm run test:integration --baseUrl=https://api-staging.parsify.dev
```

### 8. Manual Testing Checklist

- [ ] Application loads without errors
- [ ] User authentication works
- [ ] File upload functionality works
- [ ] JSON parsing and validation work
- [ ] Search functionality works
- [ ] API endpoints respond correctly
- [ ] Error handling works properly
- [ ] Performance is acceptable
- [ ] Mobile responsiveness works

## Verification Commands

### API Health Check

```bash
# Basic health check
curl https://api-staging.parsify.dev/health

# Detailed health check
curl https://api-staging.parsify.dev/health/detailed

# Version information
curl https://api-staging.parsify.dev/version

# Database connectivity test
curl https://api-staging.parsify.dev/health/database
```

### Web Application Tests

```bash
# Load testing (light)
pnpm run test:load:quick --baseUrl=https://staging.parsify.dev

# Performance tests
pnpm run test:performance:smoke --url=https://staging.parsify.dev

# E2E tests
pnpm run test:e2e --baseUrl=https://staging.parsify.dev
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   pnpm store prune
   rm -rf node_modules
   pnpm install
   pnpm run build
   ```

2. **Deployment Failures**
   ```bash
   # Check Wrangler configuration
   wrangler whoami
   wrangler list
   
   # Check environment variables
   wrangler secret list --env staging
   ```

3. **Database Issues**
   ```bash
   # Check database connection
   wrangler d1 info parsify-staging --env staging
   
   # Verify migrations
   wrangler d1 migrations list parsify-staging --env staging
   ```

## Rollback Procedure

If staging deployment fails:

1. **Immediate Actions**
   ```bash
   # Stop any running deployments
   pkill -f "wrangler|vercel"
   
   # Check last successful deployment
   wrangler deployments list --env staging
   vercel ls --scope parsify-dev
   ```

2. **Rollback API**
   ```bash
   cd apps/api
   wrangler rollback --env staging
   ```

3. **Rollback Frontend**
   ```bash
   cd apps/web
   vercel rollback --scope parsify-dev
   ```

## Post-Deployment Tasks

- [ ] Update deployment documentation
- [ ] Notify team of successful deployment
- [ ] Create deployment record
- [ ] Schedule testing with QA team
- [ ] Monitor system for 24 hours

## Testing Instructions

### For QA Team

1. **Functional Testing**
   - Test all user flows
   - Validate new features
   - Regression testing for existing features

2. **Performance Testing**
   - Load testing with expected traffic
   - Response time validation
   - Resource usage monitoring

3. **Security Testing**
   - Authentication and authorization
   - Input validation
   - XSS and CSRF protection

4. **Browser Compatibility**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers
   - Accessibility compliance

## Contacts

- **Deployment Lead**: [Contact Information]
- **QA Team Lead**: [Contact Information]
- **DevOps Team**: [Contact Information]
- **Product Manager**: [Contact Information]

## Related Documents

- [Production Deployment Procedure](./production-deployment.md)
- [Environment Setup Guide](./environment-setup.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md)
- [Emergency Response Procedures](../emergency/incident-response.md)