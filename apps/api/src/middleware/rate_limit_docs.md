# Rate Limiting Middleware Documentation

## Overview

The rate limiting middleware provides comprehensive rate limiting capabilities for Hono applications with support for multiple strategies, distributed rate limiting via Cloudflare KV, and integration with the existing RateLimitService. It supports user-based and IP-based rate limiting with different limits per subscription tier.

## Features

- **Multiple Rate Limiting Strategies**: Token bucket, sliding window, and fixed window algorithms
- **Distributed Rate Limiting**: Integration with Cloudflare KV for multi-instance deployments
- **User-based Rate Limiting**: Different limits for anonymous, free, pro, and enterprise users
- **Route-specific Configuration**: Custom limits and weights for different endpoints
- **Authentication Integration**: Works seamlessly with the existing auth middleware
- **Custom Error Handling**: Configurable error responses and retry-after headers
- **Performance Optimized**: Fails open and includes caching for high-performance scenarios
- **Comprehensive Monitoring**: Built-in headers and logging for rate limit monitoring

## Installation

The middleware is located at `apps/api/src/middleware/rate_limit.ts` and can be imported directly:

```typescript
import { 
  rateLimitMiddleware,
  createApiRateLimit,
  createFileUploadRateLimit,
  createJobExecutionRateLimit,
  createAuthRateLimit
} from '../middleware/rate_limit'
```

## Basic Usage

### Simple Rate Limiting

```typescript
import { Hono } from 'hono'
import { rateLimitMiddleware, RateLimitStrategy } from '../middleware/rate_limit'

const app = new Hono()

// Apply basic rate limiting to all routes
app.use('*', rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600 // 1 hour
}))
```

### Using Presets

```typescript
// API endpoints with default limits
app.use('/api/v1/*', createApiRateLimit())

// File upload endpoints with stricter limits
app.use('/api/v1/upload', createFileUploadRateLimit())

// Job execution endpoints
app.use('/api/v1/jobs', createJobExecutionRateLimit())

// Authentication endpoints with very strict limits
app.use('/api/v1/auth/*', createAuthRateLimit())
```

## Configuration Options

### RateLimitMiddlewareConfig

```typescript
interface RateLimitMiddlewareConfig {
  // Rate limiting strategy
  strategy?: RateLimitStrategy
  
  // Basic limits
  requests?: number
  window?: number // in seconds
  
  // User tier limits
  limits?: {
    anonymous?: number
    free?: number
    pro?: number
    enterprise?: number
  }
  
  // Route-specific configuration
  route?: {
    path?: string
    method?: string
    weight?: number // cost of this request
  }
  
  // Rate limit type for service integration
  quotaType?: string
  
  // Period for quota
  period?: 'minute' | 'hour' | 'day' | 'week' | 'month'
  
  // Custom key generator
  keyGenerator?: (c: Context) => string | Promise<string>
  
  // Skip rate limiting for certain conditions
  skip?: (c: Context) => boolean | Promise<boolean>
  
  // Custom error handler
  onError?: (c: Context, check: RateLimitCheck) => Response | Promise<Response>
  
  // Enable distributed rate limiting via Cloudflare KV
  distributed?: boolean
  
  // Cache TTL for distributed rate limiting (in seconds)
  cacheTTL?: number
  
  // Bypass rate limiting for certain users
  bypassUsers?: string[]
  
  // Enable headers in response
  headers?: boolean
}
```

## Rate Limiting Strategies

### Token Bucket Strategy

The token bucket algorithm allows for bursts of requests while maintaining an average rate. It's ideal for APIs that need to handle occasional traffic spikes.

```typescript
app.use('/api/v1/*', rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 1000,
  window: 3600, // 1 hour
  refillRate: 1000 / 3600, // tokens per second (calculated automatically)
  maxTokens: 1000
}))
```

**Characteristics:**
- Allows bursts up to the maximum token count
- Smoothly refills tokens over time
- Good for APIs with variable traffic patterns

### Sliding Window Strategy

The sliding window algorithm tracks requests within a rolling time window, providing more precise control over request patterns.

```typescript
app.use('/api/v1/upload', rateLimitMiddleware({
  strategy: RateLimitStrategy.SLIDING_WINDOW,
  requests: 50,
  window: 3600, // 1 hour sliding window
  windowSizeMs: 3600000
}))
```

**Characteristics:**
- More precise request tracking
- Prevents traffic bursts at window boundaries
- Better for strict rate limiting requirements

### Fixed Window Strategy

The fixed window algorithm tracks requests within discrete time intervals, making it simple and efficient.

```typescript
app.use('/api/v1/jobs', rateLimitMiddleware({
  strategy: RateLimitStrategy.FIXED_WINDOW,
  requests: 20,
  window: 3600, // 1 hour fixed window
  windowStart: Math.floor(Date.now() / 3600000) * 3600000
}))
```

**Characteristics:**
- Simple implementation
- Low memory usage
- Can allow traffic bursts at window boundaries

## User-based Rate Limiting

The middleware automatically applies different limits based on user subscription tiers:

```typescript
app.use('/api/v1/premium', rateLimitMiddleware({
  requests: 100,
  window: 3600,
  limits: {
    anonymous: 10,    // 10 requests per hour for anonymous users
    free: 100,        // 100 requests per hour for free users
    pro: 1000,        // 1000 requests per hour for pro users
    enterprise: 10000 // 10000 requests per hour for enterprise users
  }
}))
```

### Bypass Users

Certain users can be exempted from rate limiting:

```typescript
app.use('/api/v1/admin', rateLimitMiddleware({
  requests: 100,
  window: 3600,
  bypassUsers: ['admin-user-1', 'system-service-user']
}))
```

## Route-specific Configuration

### Request Weighting

Different endpoints can consume different amounts of the rate limit budget:

```typescript
// Light operations
app.use('/api/v1/users', rateLimitMiddleware({
  requests: 1000,
  window: 3600,
  route: { weight: 1 }
}))

// Heavy operations
app.use('/api/v1/analytics', rateLimitMiddleware({
  requests: 1000,
  window: 3600,
  route: { weight: 10 } // Each request costs 10 tokens
}))
```

### Custom Key Generation

Advanced scenarios can use custom rate limit keys:

```typescript
app.use('/api/v1/webhooks/:webhookId', rateLimitMiddleware({
  requests: 100,
  window: 3600,
  keyGenerator: async (c) => {
    const auth = c.get('auth')
    const userId = auth.user?.id || 'anonymous'
    const webhookId = c.req.param('webhookId')
    return `webhook:${userId}:${webhookId}`
  }
}))
```

## Distributed Rate Limiting

For multi-instance deployments, enable distributed rate limiting using Cloudflare KV:

```typescript
app.use('/api/v1/*', rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 1000,
  window: 3600,
  distributed: true,        // Enable distributed rate limiting
  cacheTTL: 300           // Cache state for 5 minutes
}))
```

### KV Storage Structure

The middleware stores rate limit state in Cloudflare KV with the following structure:

```
token_bucket:rate_limit:user:user-123 -> {"tokens": 950, "lastRefill": 1640995200000, ...}
sliding_window:rate_limit:ip:192.168.1.1 -> {"requests": [...], "windowSizeMs": 3600000, ...}
fixed_window:rate_limit:user:user-456 -> {"count": 15, "windowStart": 1640995200000, ...}
```

## Integration with Authentication

The middleware integrates seamlessly with the authentication middleware:

```typescript
app.use('/api/v1/*', 
  authMiddleware({ required: false }), // Optional authentication
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 100,
    window: 3600,
    // Automatically uses user info from auth context
  })
)
```

### Subscription Tier Integration

User subscription tiers are automatically detected from the authentication context:

```typescript
app.use('/api/v1/premium', 
  authMiddleware({ required: true }),
  requirePremium(), // Only pro and enterprise users
  rateLimitMiddleware({
    requests: 5000,
    window: 3600,
    limits: {
      pro: 5000,
      enterprise: 50000
    }
  })
)
```

## Error Handling

### Default Error Response

When rate limits are exceeded, the middleware returns a 429 status code:

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 300,
  "limit": 1000,
  "remaining": 0,
  "resetTime": 1640998800000,
  "strategy": "token_bucket",
  "requestId": "req-123456789"
}
```

### Custom Error Handling

Provide custom error responses:

```typescript
app.use('/api/v1/custom', rateLimitMiddleware({
  requests: 100,
  window: 3600,
  onError: async (c, check) => {
    return c.json({
      error: 'Custom Rate Limit Message',
      details: {
        limit: check.limit,
        used: check.limit - check.remaining,
        resetTime: new Date(check.resetTime).toISOString(),
        strategy: RateLimitStrategy.TOKEN_BUCKET
      },
      requestId: c.get('requestId')
    }, 429)
  }
}))
```

## Response Headers

When headers are enabled, the middleware includes rate limit information:

```
X-Rate-Limit-Limit: 1000
X-Rate-Limit-Remaining: 950
X-Rate-Limit-Reset: 1640998800000
X-Rate-Limit-Strategy: token_bucket
Retry-After: 300 (only when rate limited)
```

## Presets Configuration

### API Default Preset

```typescript
export const API_DEFAULT = {
  requests: 1000,
  window: 3600, // 1 hour
  limits: {
    anonymous: 100,
    free: 1000,
    pro: 5000,
    enterprise: 50000
  },
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  quotaType: 'api_requests',
  period: 'hour'
}
```

### File Upload Preset

```typescript
export const FILE_UPLOAD = {
  requests: 50,
  window: 3600, // 1 hour
  limits: {
    anonymous: 5,
    free: 50,
    pro: 250,
    enterprise: 2500
  },
  strategy: RateLimitStrategy.SLIDING_WINDOW,
  quotaType: 'file_uploads',
  period: 'hour'
}
```

### Job Execution Preset

```typescript
export const JOB_EXECUTION = {
  requests: 20,
  window: 3600, // 1 hour
  limits: {
    anonymous: 2,
    free: 20,
    pro: 100,
    enterprise: 1000
  },
  strategy: RateLimitStrategy.FIXED_WINDOW,
  quotaType: 'jobs_per_hour',
  period: 'hour'
}
```

## Advanced Examples

### Conditional Rate Limiting

```typescript
app.use('/api/v1/dynamic', rateLimitMiddleware({
  requests: 100,
  window: 3600,
  // Skip rate limiting during maintenance mode
  skip: async (c) => {
    const isMaintenanceMode = await checkMaintenanceStatus()
    return isMaintenanceMode
  }
}))
```

### Load-based Rate Limiting

```typescript
app.use('/api/v1/adaptive', rateLimitMiddleware({
  requests: 100,
  window: 3600,
  keyGenerator: async (c) => {
    const systemLoad = await getSystemLoad()
    const auth = c.get('auth')
    const userId = auth.user?.id || 'anonymous'
    
    if (systemLoad > 0.8) {
      return `adaptive:high_load:${userId}`
    } else {
      return `adaptive:normal_load:${userId}`
    }
  }
}))
```

### Multi-tier Rate Limiting

```typescript
app.use('/api/v1/multi-tier', rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600,
  limits: {
    anonymous: 10,
    free: 100,
    pro: 1000,
    enterprise: 10000
  },
  route: {
    weight: async (c) => {
      // Dynamic weight based on request complexity
      const complexity = await calculateRequestComplexity(c)
      return complexity
    }
  }
}))
```

## Performance Considerations

### Memory Usage

- **Token Bucket**: O(1) memory per rate limit key
- **Sliding Window**: O(n) memory where n is requests in window
- **Fixed Window**: O(1) memory per rate limit key

### Distributed Rate Limiting

- Use appropriate cache TTL values (5-15 minutes)
- Monitor KV storage costs and performance
- Consider using local caching for frequently accessed keys

### Fail-open Behavior

The middleware is designed to fail open - if rate limiting services are unavailable, requests are allowed to ensure service availability.

## Monitoring and Analytics

### Metrics Collection

The middleware integrates with the existing monitoring system:

```typescript
// Rate limit events are automatically logged
console.log('Rate limit exceeded:', {
  path: c.req.path,
  method: c.req.method,
  userId: c.get('auth')?.user?.id,
  limit: check.limit,
  used: check.limit - check.remaining,
  requestId: c.get('requestId')
})
```

### Health Checks

Rate limiting health can be monitored through the `/health` endpoint:

```typescript
app.get('/health', async (c) => {
  const cloudflare = c.get('cloudflare')
  const health = await cloudflare.getHealthStatus()
  
  return c.json({
    rateLimiting: {
      status: health.kv.cache?.status || 'unknown',
      responseTime: health.kv.cache?.responseTime || 0
    }
  })
})
```

## Best Practices

1. **Choose the Right Strategy**: Use token bucket for APIs, sliding window for strict limits, fixed window for simplicity
2. **Set Appropriate Limits**: Consider your infrastructure capacity and user needs
3. **Use Distributed Rate Limiting**: Enable for multi-instance deployments
4. **Monitor Rate Limiting**: Track rate limit violations and system performance
5. **Provide Clear Error Messages**: Help users understand when they're rate limited
6. **Use Custom Keys**: Create meaningful rate limit keys for your use case
7. **Set Proper TTL Values**: Balance between performance and consistency
8. **Test Thoroughly**: Test rate limiting under various load conditions
9. **Document Limits**: Clearly communicate rate limits to API users
10. **Handle Edge Cases**: Consider what happens when services are unavailable

## Troubleshooting

### Common Issues

1. **Rate Limiting Not Working**: Check if distributed mode is enabled and KV is accessible
2. **Users Getting Rate Limited Unexpectedly**: Verify key generation and user tier detection
3. **Performance Issues**: Consider using fixed window strategy or reducing distributed mode usage
4. **High Memory Usage**: Use fixed window or token bucket instead of sliding window
5. **KV Storage Costs**: Optimize cache TTL and key structure

### Debug Mode

Enable debug logging to troubleshoot rate limiting issues:

```typescript
app.use('/api/v1/debug', rateLimitMiddleware({
  requests: 100,
  window: 3600,
  // Add debug logging
  keyGenerator: async (c) => {
    const key = generateDefaultRateLimitKey(c, c.get('auth'), getClientIP(c))
    console.log('Rate limit key:', key)
    return key
  }
}))
```

## Migration Guide

### From Simple Rate Limiting

```typescript
// Old approach
app.use('*', async (c, next) => {
  const clientIP = getClientIP(c)
  const current = await redis.get(`rate_limit:${clientIP}`)
  
  if (current > 100) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  
  await redis.incr(`rate_limit:${clientIP}`)
  await next()
})

// New approach
app.use('*', createApiRateLimit())
```

### From Custom Implementation

1. Replace custom rate limiting logic with middleware
2. Configure appropriate strategy and limits
3. Update error handling to use new response format
4. Add response headers for better client experience
5. Enable distributed rate limiting if needed

## Contributing

When contributing to the rate limiting middleware:

1. Add comprehensive tests for new features
2. Update documentation for any configuration changes
3. Consider performance implications
4. Test with different strategies and configurations
5. Ensure backward compatibility when possible

## License

This middleware is part of the Parsify API project and follows the same license terms.