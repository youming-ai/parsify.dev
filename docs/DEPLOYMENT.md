# Parsify.dev Deployment System

This document describes the comprehensive deployment preparation and staging system for the Parsify.dev developer tools platform.

## Overview

The deployment system provides:
- Production-ready build optimization and preparation
- Staging environment setup and management
- Automated deployment pipelines
- Environment management and configuration
- Deployment testing and validation
- Production deployment processes
- Post-deployment monitoring and rollback mechanisms

## Architecture

The deployment system consists of several key components:

1. **Production Build Optimizer** (`scripts/deploy/production-build.js`)
2. **Staging Environment Setup** (`scripts/deploy/staging-setup.js`)
3. **Deployment Pipeline** (`scripts/deploy/deployment-pipeline.js`)
4. **Environment Manager** (`scripts/deploy/environment-manager.js`)
5. **Deployment Testing** (`scripts/deploy/deployment-testing.js`)
6. **Production Deployer** (`scripts/deploy/production-deploy.js`)
7. **Monitoring System** (`scripts/deploy/monitoring-system.js`)

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Vercel CLI (install with `npm i -g vercel`)
- Vercel account with appropriate permissions

### Initial Setup

1. **Set up environments:**
   ```bash
   # Create staging environment
   pnpm staging:create
   
   # Create production environment
   pnpm production:create
   ```

2. **Validate environments:**
   ```bash
   # Validate staging
   pnpm staging:validate
   
   # Validate production
   pnpm production:validate
   ```

3. **Deploy to staging:**
   ```bash
   pnpm deploy:staging
   ```

## Available Commands

### Environment Management

```bash
# Environment manager
pnpm deploy:env                    # Show environment manager help
pnpm deploy:env create <env>       # Create environment configuration
pnpm deploy:env validate <env>     # Validate environment
pnpm deploy:env switch <env>       # Switch to environment
pnpm deploy:env list               # List all environments
pnpm deploy:env info <env>         # Show environment info
pnpm deploy:env clean <env>        # Clean environment files
pnpm deploy:env report             # Generate environment report

# Staging shortcuts
pnpm staging:create                 # Create staging environment
pnpm staging:validate               # Validate staging
pnpm staging:switch                 # Switch to staging
pnpm staging:test                   # Test staging deployment

# Production shortcuts
pnpm production:create              # Create production environment
pnpm production:validate            # Validate production
pnpm production:switch              # Switch to production
pnpm production:test                # Test production deployment
```

### Building and Testing

```bash
# Build optimization
pnpm deploy:build                   # Production build with optimization
pnpm build:prod                     # Alias for production build

# Testing
pnpm deploy:test                    # Run deployment tests
pnpm test:deployment                # Alias for deployment tests
pnpm test:e2e:staging              # Run E2E tests against staging
pnpm test:e2e:production           # Run E2E tests against production
```

### Deployment

```bash
# Automated deployment pipeline
pnpm deploy:pipe                    # Run automated deployment pipeline
DEPLOY_TARGET=staging pnpm deploy:pipe    # Deploy to staging
DEPLOY_TARGET=production pnpm deploy:pipe # Deploy to production

# Manual deployment
pnpm deploy:staging                 # Deploy to staging environment
pnpm deploy:production              # Deploy to production (with approval)
pnpm deploy:rollback                # Manual rollback
```

### Monitoring

```bash
# Start monitoring
pnpm monitor:start                  # Start monitoring (requires deployment ID)
pnpm monitor:staging               # Monitor staging deployment
pnpm monitor:production            # Monitor production deployment
```

## Environments

### Development

- **Domain**: `localhost:3000`
- **API**: `http://localhost:8787`
- **Features**: Hot reload, debug mode, local testing
- **Use case**: Local development

### Staging

- **Domain**: `parsify-staging.vercel.app`
- **API**: `https://api-staging.parsify.dev`
- **Features**: Debug mode, error reporting, testing
- **Use case**: Pre-production testing

### Production

- **Domain**: `parsify.dev`
- **API**: `https://api.parsify.dev`
- **Features**: Performance optimization, analytics
- **Use case**: Live production environment

## Deployment Process

### Staging Deployment

1. **Code is pushed to `develop` branch**
2. **Automated CI/CD triggers staging deployment**
3. **Build and test pipeline runs**
4. **Deployment to staging environment**
5. **Automated testing against staging**
6. **Manual verification**

### Production Deployment

1. **Code is merged to `main` branch**
2. **Create pull request for production deployment**
3. **Run pre-deployment validation**
4. **Get approval for production deployment**
5. **Execute production deployment**
6. **Monitor deployment health**
7. **Run post-deployment checks**
8. **Start monitoring window**

## Configuration

### Environment Variables

Create the following environment files:

#### `.env.development`
```env
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

#### `.env.staging`
```env
NODE_ENV=staging
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_API_BASE_URL=https://api-staging.parsify.dev
NEXT_PUBLIC_STAGING_MODE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
```

#### `.env.production`
```env
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_API_BASE_URL=https://api.parsify.dev
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
```

### Vercel Configuration

The system uses `vercel.json` for basic configuration and creates environment-specific configurations for staging and production.

## Testing

### Pre-Deployment Tests

- **Unit Tests**: `pnpm test`
- **Type Checking**: `pnpm type-check`
- **Linting**: `pnpm lint`
- **Bundle Budget**: `pnpm budget:validate`
- **E2E Tests**: `pnpm test:e2e`

### Deployment Tests

The deployment testing suite includes:

- **Health Checks**: API and page accessibility
- **Functionality Tests**: Critical user flows
- **Security Tests**: Headers and CORS configuration
- **Performance Tests**: Core Web Vitals
- **Accessibility Tests**: a11y compliance

### Running Tests

```bash
# Test staging deployment
DEPLOY_TARGET=staging pnpm deploy:test

# Test production deployment
DEPLOY_TARGET=production pnpm deploy:test

# Test specific URL
DEPLOY_URL=https://example.com pnpm deploy:test
```

## Monitoring

### Health Checks

The monitoring system continuously checks:

- **Main Page**: `https://parsify.dev/`
- **API Health**: `https://parsify.dev/api/health`
- **Tools Page**: `https://parsify.dev/tools`
- **Search API**: `https://parsify.dev/api/search`

### Performance Metrics

- **Response Time**: < 5 seconds
- **Error Rate**: < 5%
- **Memory Usage**: < 90%
- **CPU Usage**: < 80%

### Rollback Triggers

Automatic rollback is triggered when:

- Critical health checks fail
- Failure threshold exceeded (default: 5 consecutive failures)
- Performance thresholds exceeded
- Within rollback window (default: 1 hour)

### Starting Monitoring

```bash
# Monitor a specific deployment
pnpm monitor:start <deployment-id>

# Monitor latest staging deployment
pnpm monitor:staging

# Monitor latest production deployment
pnpm monitor:production
```

## Rollback Procedures

### Automatic Rollback

The monitoring system can automatically rollback when:

1. **Health check failures exceed threshold**
2. **Performance metrics degrade**
3. **Error rates increase significantly**

### Manual Rollback

```bash
# Rollback to previous deployment
pnpm deploy:rollback

# Or use the rollback script directly
./scripts/rollback.sh
```

### Emergency Rollback

If automatic rollback fails:

1. **Access Vercel Dashboard**: https://vercel.com/dashboard
2. **Navigate to project**: parsify-dev
3. **Go to Deployments tab**
4. **Find previous stable deployment**
5. **Click "..." and select "Promote to Production"**

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check build logs
pnpm build

# Validate environment
pnpm production:validate

# Check bundle budget
pnpm budget:validate
```

#### Deployment Failures

```bash
# Check Vercel authentication
vercel whoami

# Validate deployment configuration
pnpm deploy:env validate production

# Run deployment tests
pnpm production:test
```

#### Post-Deployment Issues

```bash
# Check deployment health
curl -f https://parsify.dev/api/health

# Run monitoring
pnpm monitor:production

# Check logs
vercel logs
```

### Getting Help

1. **Check deployment logs**: `vercel logs`
2. **Review test reports**: `reports/` directory
3. **Check monitoring reports**: `reports/monitoring-*.json`
4. **Review environment configuration**: `pnpm deploy:env info <env>`

## Best Practices

### Before Deployment

1. **Test thoroughly in staging**
2. **Validate all environments**
3. **Check bundle size and performance**
4. **Review security configurations**
5. **Have rollback plan ready**

### During Deployment

1. **Monitor deployment progress**
2. **Check health endpoints**
3. **Verify critical functionality**
4. **Watch error rates**
5. **Keep monitoring active**

### After Deployment

1. **Continue monitoring for at least 1 hour**
2. **Check user analytics**
3. **Monitor performance metrics**
4. **Review error logs**
5. **Document any issues**

## Security Considerations

- **Environment variables**: Never commit sensitive data
- **API keys**: Use Vercel environment variables for production
- **Access control**: Limit production deployment permissions
- **Rollback access**: Ensure team can rollback quickly
- **Monitoring**: Set up alerts for critical failures

## CI/CD Integration

The deployment system is designed to integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Deploy to Staging
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Deploy to staging
        run: pnpm deploy:staging
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
```

## Contributing

When modifying the deployment system:

1. **Test in staging first**
2. **Update documentation**
3. **Add appropriate tests**
4. **Consider backwards compatibility**
5. **Review security implications**

## Support

For deployment-related issues:

1. **Check this documentation**
2. **Review deployment logs**
3. **Consult troubleshooting section**
4. **Contact the DevOps team**

---

**Last Updated**: December 2024  
**Version**: 1.0.0