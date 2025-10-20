# Deployment Scripts

This directory contains comprehensive deployment, monitoring, and maintenance scripts for the Parsify platform. These scripts automate the entire deployment pipeline, from building applications to rolling back in case of issues.

## Overview

The scripts are designed to work with a monorepo structure and support multiple environments (development, staging, production). They handle:

- Application building and packaging
- Environment configuration
- Database migrations
- Cloudflare deployment
- Health checks and monitoring
- Rollback and recovery procedures

## Available Scripts

### 1. Build Script (`build.js`)

Handles the build process for both frontend and backend components.

```bash
# Build all applications
node scripts/build.js

# Build specific components
node scripts/build.js api
node scripts/build.js web
node scripts/build.js packages

# Clean build directory
node scripts/build.js clean

# Generate build report
node scripts/build.js report
```

**Features:**
- Builds packages in dependency order
- Type checking and linting
- Optimized production builds
- Build artifact validation
- Performance metrics

### 2. Environment Setup (`setup-env.js`)

Configures environment variables and infrastructure settings.

```bash
# Initialize environment configuration
node scripts/setup-env.js init

# Set up specific environment
node scripts/setup-env.js setup development
node scripts/setup-env.js setup staging
node scripts/setup-env.js setup production

# Load environment variables
node scripts/setup-env.js load production

# Validate environment configuration
node scripts/setup-env.js validate production
```

**Features:**
- Interactive environment setup
- Secure secret generation
- Environment validation
- Configuration templates

### 3. Database Management (`database.js`)

Handles database migrations, seeding, and backups.

```bash
# Run migrations
node scripts/database.js migrate development
node scripts/database.js migrate production

# Create new migration
node scripts/database.js create add_users_table

# Rollback migrations
node scripts/database.js rollback production 2

# Seed database
node scripts/database.js seed development

# Create database backup
node scripts/database.js backup production

# Restore from backup
node scripts/database.js restore production backup-file.sql

# Reset database
node scripts/database.js reset development

# Check database status
node scripts/database.js status production
```

**Features:**
- Migration tracking and execution
- Database seeding
- Backup and restore
- Schema validation
- Rollback support

### 4. Cloudflare Deployment (`deploy.js`)

Automates deployment to Cloudflare Workers and related services.

```bash
# Deploy full application
node scripts/deploy.js deploy staging
node scripts/deploy.js deploy production --domain api.parsify.dev

# Deploy specific components
node scripts/deploy.js api development
node scripts/deploy.js web staging

# Set up infrastructure
node scripts/deploy.js infra production

# Configure custom domain
node scripts/deploy.js domain production api.parsify.dev

# Perform health check
node scripts/deploy.js health https://api.parsify.dev
```

**Features:**
- Worker deployment
- D1 database setup
- KV namespace configuration
- R2 bucket management
- Custom domain setup
- Health checks

### 5. Monitoring (`monitoring.js`)

Sets up monitoring, health checks, and alerting.

```bash
# Set up monitoring stack
node scripts/monitoring.js setup

# Run health checks
node scripts/monitoring.js health https://api.parsify.dev

# Start continuous monitoring
node scripts/monitoring.js monitor https://api.parsify.dev 30000

# Send manual alert
node scripts/monitoring.js alert high_error_rate "Error rate exceeded 5%"

# Start/stop monitoring stack
node scripts/monitoring.js start
node scripts/monitoring.js stop
```

**Features:**
- Prometheus configuration
- Grafana dashboards
- Alert rules
- Health checks
- Continuous monitoring

### 6. Rollback and Recovery (`rollback.js`)

Handles rollback operations and disaster recovery.

```bash
# Create pre-deployment backup
node scripts/rollback.js backup production

# Rollback to previous deployment
node scripts/rollback.js rollback production

# Restore from backup
node scripts/rollback.js restore backup-id-123 production

# List deployment history
node scripts/rollback.js list

# List available backups
node scripts/rollback.js list-backups

# Clean up old backups
node scripts/rollback.js cleanup 30

# Create disaster recovery plan
node scripts/rollback.js disaster-plan
```

**Features:**
- Automated backups
- Deployment rollback
- Disaster recovery
- Backup management
- Recovery procedures

## Deployment Workflow

### Full Deployment Process

1. **Set up environment** (first time only)
   ```bash
   node scripts/setup-env.js setup production
   ```

2. **Build applications**
   ```bash
   node scripts/build.js
   ```

3. **Create backup**
   ```bash
   node scripts/rollback.js backup production
   ```

4. **Deploy application**
   ```bash
   node scripts/deploy.js deploy production --domain api.parsify.dev
   ```

5. **Verify deployment**
   ```bash
   node scripts/monitoring.js health https://api.parsify.dev
   ```

### Rollback Process

1. **List deployment history**
   ```bash
   node scripts/rollback.js list
   ```

2. **Rollback to previous version**
   ```bash
   node scripts/rollback.js rollback production
   ```

3. **Verify rollback**
   ```bash
   node scripts/monitoring.js health https://api.parsify.dev
   ```

## Configuration

### Environment Variables

The scripts use environment variables defined in `.env/{environment}.env` files:

```bash
# Core application
ENVIRONMENT=production
NODE_ENV=production
API_VERSION=v1

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
DATABASE_ID=your-database-id

# Authentication
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### Script Configuration

Most scripts can be configured through command-line arguments:

```bash
# Skip build during deployment
node scripts/deploy.js deploy production --skip-build

# Skip database migrations
node scripts/deploy.js deploy production --skip-migrations

# Disable health checks
node scripts/deploy.js deploy production --no-health-check

# Specify custom domain
node scripts/deploy.js deploy production --domain api.parsify.dev

# Set monitoring interval
node scripts/monitoring.js monitor https://api.parsify.dev 30000
```

## Directory Structure

```
scripts/
├── build.js              # Build and packaging script
├── setup-env.js          # Environment configuration
├── database.js           # Database management
├── deploy.js             # Cloudflare deployment
├── monitoring.js         # Monitoring and health checks
├── rollback.js           # Rollback and recovery
├── sentry-release.js     # Sentry integration
└── README.md             # This file
```

## Prerequisites

### Required Tools

- **Node.js** (v18+)
- **pnpm** (v8+)
- **Wrangler CLI** (v3+)
- **Git**

### Installation

```bash
# Install Node.js (if not already installed)
# Install pnpm
npm install -g pnpm

# Install Wrangler CLI
npm install -g wrangler

# Install project dependencies
pnpm install
```

## Best Practices

### Before Deployment

1. **Test locally**
   ```bash
   node scripts/build.js
   node scripts/database.js migrate development
   ```

2. **Run tests**
   ```bash
   pnpm test
   pnpm test:e2e
   ```

3. **Create backup**
   ```bash
   node scripts/rollback.js backup production
   ```

### During Deployment

1. **Monitor deployment progress**
   - Watch script output for errors
   - Check deployment logs
   - Verify health checks

2. **Validate deployment**
   ```bash
   node scripts/monitoring.js health https://api.parsify.dev
   ```

### After Deployment

1. **Monitor system health**
   ```bash
   node scripts/monitoring.js monitor https://api.parsify.dev
   ```

2. **Check logs and metrics**
   - Monitor error rates
   - Check response times
   - Verify database performance

3. **Update documentation**
   - Update deployment notes
   - Record any issues
   - Document solutions

## Troubleshooting

### Common Issues

1. **Build failures**
   - Check Node.js version
   - Verify dependencies
   - Clean build directory

2. **Database migration errors**
   - Check database connection
   - Verify migration syntax
   - Review migration order

3. **Deployment failures**
   - Check Cloudflare credentials
   - Verify configuration
   - Review deployment logs

4. **Health check failures**
   - Check service status
   - Verify endpoints
   - Review error logs

### Getting Help

1. **Check script logs**
   ```bash
   DEBUG=true node scripts/deploy.js deploy production
   ```

2. **Validate configuration**
   ```bash
   node scripts/setup-env.js validate production
   ```

3. **Review error messages**
   - Check script output
   - Review service logs
   - Check error notifications

## Security Considerations

1. **Protect secrets**
   - Never commit environment files
   - Use secure secret management
   - Rotate secrets regularly

2. **Secure deployments**
   - Use HTTPS for all communications
   - Validate SSL certificates
   - Monitor for security issues

3. **Backup security**
   - Encrypt sensitive backups
   - Store backups securely
   - Test backup restoration

## Contributing

When modifying scripts:

1. **Test thoroughly**
   - Test in all environments
   - Verify edge cases
   - Check error handling

2. **Document changes**
   - Update this README
   - Add usage examples
   - Document new features

3. **Maintain compatibility**
   - Support existing workflows
   - Preserve command-line interface
   - Handle backward compatibility

## Support

For questions or issues:

1. Check this README
2. Review script documentation
3. Check deployment logs
4. Contact the development team