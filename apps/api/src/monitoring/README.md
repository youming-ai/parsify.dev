# Sentry Error Tracking and Performance Monitoring

This directory contains the Sentry integration for the Parsify API, providing comprehensive error tracking, performance monitoring, and debugging capabilities.

## Overview

The Sentry implementation includes:

- **Error Tracking**: Automatic capture and reporting of errors with rich context
- **Performance Monitoring**: Transaction tracing for API endpoints and database operations
- **User Context Tracking**: Automatic user context enrichment for better debugging
- **Custom Breadcrumbs**: Detailed operation tracking for database, file, and external service calls
- **Release Management**: Automated source map upload and release tracking

## Architecture

### Core Components

1. **`sentry.ts`**: Main Sentry client and middleware configuration
2. **`sentry-utils.ts`**: Custom error handlers, breadcrumbs, and monitoring utilities
3. **Integration Points**: Middleware integration in the main application and auth module

### Environment Configuration

Sentry is configured through environment variables in `wrangler.toml`:

```toml
# Core configuration
SENTRY_DSN = "https://your-dsn-here.ingest.sentry.io/project-id"
SENTRY_ENVIRONMENT = "development"
SENTRY_RELEASE = "v1.0.0"

# Performance monitoring
SENTRY_TRACES_SAMPLE_RATE = "0.1"
SENTRY_PROFILES_SAMPLE_RATE = "0.1"
SENTRY_ENABLE_PERFORMANCE = "true"

# Session replay (optional)
SENTRY_ENABLE_REPLAY = "false"
SENTRY_REPLAY_SESSION_SAMPLE_RATE = "0.1"
SENTRY_REPLAY_ERROR_SAMPLE_RATE = "1.0"
```

## Configuration

### Development Environment

```bash
# Set your Sentry DSN
export SENTRY_DSN="https://your-dsn-here.ingest.sentry.io/project-id"

# For source map uploads
export SENTRY_AUTH_TOKEN="your-auth-token"
export SENTRY_ORG="your-org"
export SENTRY_PROJECT="your-project"
```

### Production Configuration

Production uses lower sample rates to control costs:

```toml
[env.production.vars]
SENTRY_TRACES_SAMPLE_RATE = "0.05"
SENTRY_PROFILES_SAMPLE_RATE = "0.05"
SENTRY_ENABLE_REPLAY = "true"
```

## Usage

### Basic Error Tracking

Errors are automatically captured through the middleware integration:

```typescript
// Errors thrown in routes are automatically captured
app.get('/api/data', async (c) => {
  throw new Error('Something went wrong') // Automatically sent to Sentry
})
```

### Custom Error Reporting

```typescript
import { reportCustomError, CustomErrorType } from '../monitoring/sentry-utils'

// Report custom business logic errors
reportCustomError(
  CustomErrorType.QUOTA_EXCEEDED,
  'User quota exceeded for API calls',
  {
    userId: 'user123',
    quotaType: 'api_calls',
    currentUsage: 1000,
    limit: 500
  }
)
```

### Adding Custom Breadcrumbs

```typescript
import { 
  addCustomBreadcrumb, 
  BreadcrumbCategory,
  monitorDatabaseOperation 
} from '../monitoring/sentry-utils'

// Manual breadcrumb
addCustomBreadcrumb(
  BreadcrumbCategory.DATABASE,
  'User profile updated',
  'info',
  { userId: 'user123', fields: ['email', 'name'] }
)

// Automatic operation monitoring
const result = await monitorDatabaseOperation(
  'update',
  'users',
  () => db.update('users', { id: 'user123', email: 'new@email.com' })
)
```

### User Context Tracking

User context is automatically set through the auth middleware:

```typescript
// User context includes:
// - User ID, email, username
// - Subscription tier
// - IP address and user agent
// - Session information
```

## Performance Monitoring

### Automatic Transaction Tracking

All API requests are automatically traced with performance data:

- Request duration
- Database query times
- External service calls
- Response sizes

### Custom Performance Monitoring

```typescript
import { getSentryClient } from '../monitoring/sentry'

// Create custom transaction
const transaction = getSentryClient()?.startTransaction(
  'file-processing',
  'custom.operation',
  { fileType: 'pdf', fileSize: 1024000 }
)

// Do work...
const result = await processFile(file)

// Finish transaction
getSentryClient()?.finishTransaction(transaction, 'ok', {
  processedPages: result.pages,
  processingTime: result.duration
})
```

## Release Management

### Creating Releases and Uploading Source Maps

```bash
# Create release and upload source maps
npm run sentry:all

# Or individual steps
npm run sentry:release
npm run sentry:sourcemaps
npm run sentry:deploy
```

### Build Pipeline Integration

```bash
# In your CI/CD pipeline
npm run build
npm run sentry:all production
npm run deploy
```

## Error Categories

The implementation includes several custom error categories:

- **Database**: Connection failures, query timeouts, constraint violations
- **Cache**: Cache misses, invalidation errors
- **File Upload**: Processing failures, size limits, format errors
- **External Service**: API failures, timeouts, rate limits
- **Business Logic**: Quota exceeded, subscription limits
- **Security**: Authentication failures, authorization violations
- **WASM**: Compilation failures, runtime errors

## Debugging and Monitoring

### Sentry Dashboard

Monitor errors and performance in your Sentry dashboard:

1. **Error Overview**: View error trends and impact
2. **Performance**: Track transaction times and bottlenecks
3. **User Sessions**: Understand user context for errors
4. **Release Tracking**: Monitor deployment health

### Custom Tags and Filters

Errors are automatically tagged for better filtering:

- `error_category`: Type of error (database, auth, etc.)
- `user_subscription_tier`: User's subscription level
- `endpoint`: API endpoint where error occurred
- `environment`: Development, staging, or production

### Breadcrumbs

Detailed breadcrumbs provide context for debugging:

- Authentication events
- Database operations
- File uploads and processing
- External API calls
- Rate limit checks

## Best Practices

### Error Handling

1. **Always include context**: Provide relevant data when reporting errors
2. **Use appropriate severity levels**: Differentiate between warnings and critical errors
3. **Add custom breadcrumbs**: Track important operations for debugging
4. **Monitor business logic**: Track quota usage and subscription limits

### Performance Monitoring

1. **Sample rates**: Adjust based on traffic and cost considerations
2. **Custom transactions**: Track important business operations
3. **Resource monitoring**: Monitor memory and CPU usage in Cloudflare Workers
4. **External service tracking**: Monitor all third-party API calls

### Release Management

1. **Always upload source maps**: Essential for debugging production errors
2. **Semantic versioning**: Use consistent version numbers
3. **Environment tracking**: Separate releases by environment
4. **Automated deployment**: Integrate with CI/CD pipeline

## Configuration Examples

### High-Traffic Production

```toml
[env.production.vars]
SENTRY_TRACES_SAMPLE_RATE = "0.01"  # Very low for high traffic
SENTRY_PROFILES_SAMPLE_RATE = "0.01"
SENTRY_ENABLE_REPLAY = "false"      # Disable to reduce costs
```

### Development/Testing

```toml
[env.staging.vars]
SENTRY_TRACES_SAMPLE_RATE = "1.0"   # Full sampling for testing
SENTRY_PROFILES_SAMPLE_RATE = "1.0"
SENTRY_DEBUG = "true"                # Enable debug logging
```

### Feature-Rich Monitoring

```typescript
// Enable comprehensive monitoring for premium features
import { 
  monitorBusinessEvent,
  monitorQuotaUsage,
  monitorSubscriptionLimits 
} from '../monitoring/sentry-utils'

// Track important business events
monitorBusinessEvent('premium_feature_used', {
  userId: 'user123',
  feature: 'advanced-analytics',
  timestamp: new Date().toISOString()
})

// Monitor quota usage
monitorQuotaUsage('user123', 'api_calls', 950, 1000, 'daily')

// Track subscription limits
monitorSubscriptionLimits('user123', 'pro', 'projects', 8, 10)
```

## Troubleshooting

### Common Issues

1. **Source maps not working**: Ensure sourcemaps are uploaded before deployment
2. **Missing user context**: Check auth middleware integration
3. **High sampling costs**: Adjust `SENTRY_TRACES_SAMPLE_RATE`
4. **Missing environment variables**: Verify all required Sentry env vars are set

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
export SENTRY_DEBUG=true
```

## Security Considerations

- **Sensitive data**: Never include passwords, tokens, or PII in Sentry data
- **IP addresses**: User IPs are automatically handled according to privacy settings
- **Data retention**: Configure appropriate data retention policies in Sentry
- **Access control**: Limit access to Sentry dashboard based on user roles

## Integration Examples

### Custom Middleware

```typescript
import { addCustomBreadcrumb, BreadcrumbCategory } from '../monitoring/sentry-utils'

export const customMiddleware = async (c: Context, next: Next) => {
  // Add breadcrumb for middleware start
  addCustomBreadcrumb(
    BreadcrumbCategory.API,
    'Custom middleware started',
    'info',
    { path: c.req.path, method: c.req.method }
  )

  await next()

  // Add breadcrumb for middleware completion
  addCustomBreadcrumb(
    BreadcrumbCategory.API,
    'Custom middleware completed',
    'info',
    { status: c.res.status, duration: Date.now() - startTime }
  )
}
```

### Database Integration

```typescript
import { monitorDatabaseOperation } from '../monitoring/sentry-utils'

// Monitor all database operations
const users = await monitorDatabaseOperation(
  'query',
  'users',
  () => db.select().from('users').where('active', true)
)
```

### External API Integration

```typescript
import { monitorExternalServiceCall } from '../monitoring/sentry-utils'

// Monitor external API calls
const response = await monitorExternalServiceCall(
  'stripe',
  '/v1/customers',
  'POST',
  () => fetch('https://api.stripe.com/v1/customers', { ... })
)
```

This comprehensive Sentry implementation provides detailed error tracking, performance monitoring, and debugging capabilities for the Parsify API, enabling efficient issue resolution and performance optimization.