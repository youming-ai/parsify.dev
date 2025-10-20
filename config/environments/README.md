# Environment Configuration

This directory contains comprehensive environment configurations for the Parsify platform across different deployment environments.

## Structure

```
config/environments/
├── staging.ts                   # Staging environment configuration
├── production.ts                # Production environment configuration
├── .env.example                 # Environment variables template
├── .env.staging.example         # Staging-specific environment variables
├── .env.production.example      # Production-specific environment variables
├── dns-config.json              # DNS configuration for all environments
├── dns-setup.ts                 # DNS configuration management utilities
├── health-check.ts              # Health check system
├── deploy-staging.sh            # Staging deployment script
├── deploy-production.sh         # Production deployment script
└── README.md                    # This file
```

## Environments

### Development
- **Domain**: `localhost`
- **API**: `http://localhost:8787`
- **Web**: `http://localhost:3000`
- **Features**: Debug mode enabled, source maps, test data

### Staging
- **Domain**: `staging.parsify.dev`
- **API**: `https://api-staging.parsify.dev`
- **Web**: `https://staging.parsify.dev`
- **Features**: Full feature set, debug mode, higher monitoring levels

### Production
- **Domain**: `parsify.dev`
- **API**: `https://api.parsify.dev`
- **Web**: `https://parsify.dev`
- **Features**: Optimized performance, high availability, multi-region

## Environment Variables

### Setup

1. Copy the appropriate environment template:
   ```bash
   # For local development
   cp .env.example .env.local

   # For staging
   cp .env.staging.example .env.staging

   # For production
   cp .env.production.example .env.production
   ```

2. Fill in the actual values for your environment. Never commit secrets to version control.

### Required Variables

#### Security
- `JWT_SECRET`: JWT signing secret (minimum 32 characters)
- `ENCRYPTION_KEY`: Data encryption key (minimum 32 characters)
- `SESSION_SECRET`: Session management secret

#### Database
- `DATABASE_ID`: Cloudflare D1 database ID
- `DATABASE_NAME`: Database name

#### Storage
- `R2_FILES_BUCKET_ID`: R2 bucket ID for file storage
- `KV_CACHE_ID`: KV namespace ID for caching
- `KV_SESSIONS_ID`: KV namespace ID for sessions

#### External Services
- `SENTRY_DSN`: Sentry error tracking DSN
- `EMAIL_API_KEY`: Email service API key
- `CLOUDFLARE_ZONE_ID`: Cloudflare zone ID

## Deployment

### Staging Deployment

```bash
# Deploy to staging (runs tests first)
./deploy-staging.sh

# Skip tests
./deploy-staging.sh --skip-tests

# Force deployment even if health checks fail
./deploy-staging.sh --force
```

### Production Deployment

```bash
# Deploy to production (requires manual approval)
./deploy-production.sh

# Skip tests (not recommended for production)
./deploy-production.sh --skip-tests

# Force deployment (not recommended for production)
./deploy-production.sh --force

# Rollback to previous deployment
./deploy-production.sh --rollback

# Dry run (checks without deploying)
./deploy-production.sh --dry-run
```

## DNS Configuration

DNS is managed through the `dns-config.json` file and `dns-setup.ts` utilities.

### Viewing DNS Configuration

```typescript
import { getDNSConfig } from './dns-setup'

const stagingDns = getDNSConfig('staging')
const productionDns = getDNSConfig('production')
```

### Validating DNS Configuration

```typescript
import { validateDNSConfig } from './dns-setup'

const validation = validateDNSConfig('production')
if (!validation.valid) {
  console.error('DNS validation errors:', validation.errors)
}
```

## Health Checks

The health check system monitors all environment components:

### Running Health Checks

```typescript
import { checkEnvironmentHealth } from './health-check'

const health = await checkEnvironmentHealth('production')
console.log('Overall health:', health.overall)
console.log('Services:', Object.keys(health.services))
```

### Health Monitoring

```typescript
import { HealthMonitor } from './health-check'

const monitor = new HealthMonitor('production', 30000) // Check every 30 seconds

monitor.onHealthChange((health) => {
  if (health.overall !== 'healthy') {
    // Send alert
    console.error('Health issue detected:', health.overall)
  }
})

monitor.start()
```

### Health Check Endpoints

- `/health` - Basic health check
- `/api/v1/health` - API health check
- `/api/v1/health/database` - Database health check
- `/api/v1/health/storage` - Storage health check
- `/api/v1/health/cache` - Cache health check
- `/api/v1/health/performance` - Performance metrics

## Configuration Validation

### Environment Configuration Validation

```typescript
import { validateStagingConfig } from './staging'
import { validateProductionConfig } from './production'

// Validate staging
if (!validateStagingConfig()) {
  console.error('Staging configuration is invalid')
}

// Validate production
if (!validateProductionConfig()) {
  console.error('Production configuration is invalid')
}
```

### Health Check Validation

```typescript
import { validateEnvironmentConfig } from './health-check'

const validation = validateEnvironmentConfig('production')
if (!validation.valid) {
  console.error('Environment validation errors:', validation.errors)
}
```

## Security Considerations

1. **Never commit secrets**: Always use environment variables for sensitive data
2. **Use strong secrets**: Generate cryptographically secure secrets
3. **Rotate secrets regularly**: Implement secret rotation policies
4. **Limit access**: Restrict access to production configurations
5. **Audit changes**: Track all configuration changes

## Monitoring and Alerts

### Sentry Integration

All environments are configured with Sentry for error tracking:

- **Development**: Full debug mode, high sampling rates
- **Staging**: Debug enabled, medium sampling rates
- **Production**: Optimized for production, low sampling rates

### Performance Monitoring

- Response time monitoring
- Error rate tracking
- Throughput metrics
- Resource usage monitoring

### Alerting

- Email alerts for critical issues
- Slack integration for team notifications
- Automatic escalation for unresolved issues

## Backup and Recovery

### Automated Backups

- Database backups every 6 hours
- File storage backups daily
- Configuration backups on deployment

### Recovery Procedures

1. Identify the issue through health checks
2. Use deployment rollback if needed
3. Restore from backups if necessary
4. Verify system health after recovery

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   - Check that `.env` files are properly configured
   - Verify all required variables are set

2. **Health Checks Failing**
   - Check service logs
   - Verify external service connectivity
   - Review configuration changes

3. **Deployment Failures**
   - Check deployment script logs
   - Verify build process completed successfully
   - Review Cloudflare deployment status

4. **DNS Issues**
   - Validate DNS configuration
   - Check Cloudflare zone settings
   - Verify SSL certificate status

### Getting Help

1. Check the logs in your deployment platform
2. Review the health check results
3. Consult the runbooks for specific issues
4. Contact the DevOps team for assistance

## Best Practices

1. **Always test in staging** before deploying to production
2. **Monitor health checks** regularly for early issue detection
3. **Keep configurations updated** with the latest security settings
4. **Document changes** to maintain clear deployment history
5. **Use automation** to reduce manual deployment errors