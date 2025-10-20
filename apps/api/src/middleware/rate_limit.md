# Rate Limiting Middleware

A comprehensive rate limiting middleware for Hono applications with support for multiple strategies, distributed rate limiting via Cloudflare KV, and integration with the existing RateLimitService.

## Features

- **Multiple Rate Limiting Strategies**:
  - Token Bucket: Smooth rate limiting with token refill
  - Sliding Window: Precise rate limiting over a rolling time window
  - Fixed Window: Simple rate limiting with fixed time periods

- **User-based Rate Limiting**:
  - Different limits for anonymous, free, pro, and enterprise users
  - IP-based rate limiting for unauthenticated users
  - User ID-based rate limiting for authenticated users

- **Distributed Rate Limiting**:
  - Cloudflare KV integration for multi-instance deployments
  - Synchronized rate limits across edge locations
  - Graceful fallback when distributed storage is unavailable

- **Flexible Configuration**:
  - Per-route rate limiting with custom weights
  - Custom key generation for complex scenarios
  - Conditional rate limiting with skip functions
  - Custom error handlers

- **Integration Features**:
  - Seamless integration with RateLimitService
  - Authentication middleware compatibility
  - Proper HTTP headers (X-Rate-Limit-*, Retry-After)
  - Comprehensive error handling

## Installation

The middleware is located at `apps/api/src/middleware/rate_limit.ts`.

```typescript
import { 
  rateLimitMiddleware,
  createApiRateLimit,
  createFileUploadRateLimit,
  createJobExecutionRateLimit,
  createAuthRateLimit
} from './middleware/rate_limit'
```

## Basic Usage

### Simple Rate Limiting

```typescript
import { Hono } from 'hono'
import { rateLimitMiddleware, RateLimitStrategy } from './middleware/rate_limit'

const app = new Hono()

// Apply basic rate limiting to all routes
app.use('*', rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,      // 100 requests
  window: 3600,       // per hour
  limits: {
    anonymous: 10,    // 10 requests for anonymous users
    free: 100,        // 100 requests for free users
    pro: 500,         // 500 requests for pro users
    enterprise: 5000  // 5000 requests for enterprise users
  }
}))
```

### Route-specific Rate Limiting

```typescript
// Heavy operations with stricter limits
app.use('/api/v1/tools/execute', 
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 50,
    window: 3600,
    route: {
      path: '/api/v1/tools/execute',
      method: 'POST',
      weight: 5  // Each execution costs 5 tokens
    },
    quotaType: 'execution_time',
    period: 'hour'
  })
)

// File uploads with sliding window
app.use('/api/v1/upload',
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    requests: 25,
    window: 3600,
    quotaType: 'file_uploads'
  })
)
```

### Using Presets

```typescript
// API endpoints
app.use('/api/v1/*', createApiRateLimit())

// File uploads
app.use('/api/v1/upload', createFileUploadRateLimit())

// Job execution
app.use('/api/v1/jobs', createJobExecutionRateLimit())

// Authentication endpoints
app.post('/api/v1/auth/login', createAuthRateLimit())
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
    weight?: number // cost of this request in tokens/points
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

### Rate Limiting Strategies

#### Token Bucket Strategy
- Smooth rate limiting with token refill
- Allows bursts up to bucket capacity
- Good for APIs with variable request patterns

```typescript
rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600,
  distributed: true
})
```

#### Sliding Window Strategy
- Precise rate limiting over a rolling time window
- More accurate for strict rate limits
- Good for APIs requiring precise control

```typescript
rateLimitMiddleware({
  strategy: RateLimitStrategy.SLIDING_WINDOW,
  requests: 100,
  window: 3600,
  distributed: true
})
```

#### Fixed Window Strategy
- Simple rate limiting with fixed time periods
- Easy to understand and implement
- Good for basic rate limiting needs

```typescript
rateLimitMiddleware({
  strategy: RateLimitStrategy.FIXED_WINDOW,
  requests: 100,
  window: 3600,
  distributed: true
})
```

## Advanced Usage

### Custom Key Generation

```typescript
rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600,
  keyGenerator: async (c) => {
    const auth = c.get('auth')
    const userId = auth.user?.id || 'anonymous'
    const endpoint = c.req.path
    const method = c.req.method
    
    return `custom:${userId}:${endpoint}:${method}`
  }
})
```

### Conditional Rate Limiting

```typescript
rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600,
  // Skip rate limiting for enterprise users
  skip: async (c) => {
    const auth = c.get('auth')
    return auth.user?.subscription_tier === 'enterprise'
  }
})
```

### Custom Error Handling

```typescript
rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600,
  onError: async (c, check) => {
    return c.json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: check.retryAfter ? Math.ceil(check.retryAfter / 1000) : undefined,
      resetTime: new Date(check.resetTime).toISOString(),
      limit: check.limit,
      strategy: RateLimitStrategy.TOKEN_BUCKET
    }, 429)
  }
})
```

### Route-specific Weights

```typescript
// Light operations
app.use('/api/v1/status', rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 1000,
  window: 3600,
  route: { weight: 1 }
}))

// Heavy operations
app.use('/api/v1/export', rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600,
  route: { weight: 50 }
}))
```

## Integration with Authentication

The middleware integrates seamlessly with the authentication middleware:

```typescript
import { authMiddleware } from './middleware/auth'

app.use('/api/v1/*', authMiddleware({ required: false }))

app.use('/api/v1/*', rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600,
  limits: {
    anonymous: 10,  // IP-based for anonymous users
    free: 100,      // User-based for authenticated users
    pro: 500,
    enterprise: 5000
  }
}))
```

## Distributed Rate Limiting

For distributed applications, enable Cloudflare KV integration:

```typescript
rateLimitMiddleware({
  strategy: RateLimitStrategy.TOKEN_BUCKET,
  requests: 100,
  window: 3600,
  distributed: true,
  cacheTTL: 300, // 5 minutes
  // KV namespace is automatically configured from environment
})
```

## Response Headers

When `headers: true` (default), the middleware adds these headers:

- `X-Rate-Limit-Limit`: The rate limit ceiling for the request
- `X-Rate-Limit-Remaining`: The number of requests remaining in the current window
- `X-Rate-Limit-Reset`: The time when the rate limit window resets (UTC epoch seconds)
- `X-Rate-Limit-Strategy`: The rate limiting strategy used
- `Retry-After`: Seconds to wait before making another request (when rate limited)

## Error Response Format

When rate limits are exceeded:

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 300,
  "limit": 100,
  "remaining": 0,
  "resetTime": 1640995200000,
  "strategy": "token_bucket",
  "requestId": "req-123456789"
}
```

## Presets

### API Default
```typescript
createApiRateLimit()
// 1000 requests/hour, token bucket, user tier multipliers
```

### File Upload
```typescript
createFileUploadRateLimit()
// 50 uploads/hour, sliding window, stricter limits
```

### Job Execution
```typescript
createJobExecutionRateLimit()
// 20 jobs/hour, fixed window, weighted requests
```

### Authentication
```typescript
createAuthRateLimit()
// 10 requests/15min, sliding window, IP-based
```

## Best Practices

1. **Choose the Right Strategy**:
   - Token bucket for APIs with variable request patterns
   - Sliding window for strict rate limits
   - Fixed window for simple use cases

2. **Set Appropriate Limits**:
   - Consider your infrastructure capacity
   - Account for different user tiers
   - Implement gradual limits (anonymous < free < pro < enterprise)

3. **Use Distributed Rate Limiting**:
   - Enable `distributed: true` for multi-instance deployments
   - Set appropriate `cacheTTL` based on your requirements
   - Monitor KV usage and costs

4. **Handle Errors Gracefully**:
   - The middleware fails open (allows requests) when rate limiting fails
   - Implement custom error handlers for better user experience
   - Log rate limit violations for monitoring

5. **Monitor and Adjust**:
   - Track rate limit violations and adjust limits as needed
   - Monitor KV performance for distributed rate limiting
   - Consider different limits for different endpoints

## Environment Variables

The middleware uses these environment variables:

- `CACHE`: KV namespace for distributed rate limiting
- `DB`: D1 database for RateLimitService integration
- `ENVIRONMENT`: Environment (development, staging, production)

## Testing

Run the tests:

```bash
npm test -- rate_limit
```

Test files:
- `__tests__/rate_limit.test.ts`: Unit tests
- `__tests__/rate_limit.integration.test.ts`: Integration tests

## Troubleshooting

### Common Issues

1. **Rate limiting not working**: Ensure authentication middleware is properly configured and user context is available.

2. **KV errors**: Check that the `CACHE` environment variable is properly configured and the KV namespace exists.

3. **Performance issues**: Consider using `distributed: false` for high-traffic endpoints if KV performance is a concern.

4. **Rate limit too strict**: Adjust the `requests` and `window` values based on your actual usage patterns.

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your environment.

## Migration from Basic Rate Limiting

To migrate from the basic rate limiting in `index.ts`:

1. Replace the basic rate limiting middleware:
```typescript
// Remove this
app.use('*', basicRateLimitMiddleware)

// Add this
app.use('*', createApiRateLimit())
```

2. Update specific routes with appropriate rate limiting:
```typescript
// File uploads
app.use('/api/v1/upload', createFileUploadRateLimit())

// Job execution
app.use('/api/v1/jobs', createJobExecutionRateLimit())
```

3. Configure custom limits for your specific use cases.

## License

This middleware is part of the Parsify project and follows the same license terms.