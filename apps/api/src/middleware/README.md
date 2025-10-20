# Error Handling Middleware

Comprehensive error handling middleware for Hono applications with Cloudflare Workers integration.

## Features

- **Centralized Error Handling**: Single point of error handling for all API routes
- **Error Classification**: Automatic classification of errors into categories (validation, authentication, database, etc.)
- **HTTP Status Code Mapping**: Automatic mapping of error types to appropriate HTTP status codes
- **Production/Development Modes**: Sanitized error responses for production, detailed debug info for development
- **Error Correlation IDs**: Unique request IDs for tracking errors across the system
- **Logging and Monitoring**: Integrated with Cloudflare analytics for error tracking
- **Error Metrics**: Built-in error tracking and statistics
- **WASM Error Support**: Special handling for WASM module errors
- **TypeScript Support**: Full TypeScript support with proper type definitions

## Installation

The error middleware is already included in this project. To use it in your Hono application:

```typescript
import { errorMiddleware } from './middleware/error'
```

## Basic Usage

### Global Error Handling

```typescript
import { Hono } from 'hono'
import { errorMiddleware } from './middleware/error'

const app = new Hono()

// Add error middleware globally (should be added first)
app.use('*', errorMiddleware())

// Your routes here
app.get('/api/users/:id', async (c) => {
  const userId = c.req.param('id')
  
  if (!userId) {
    throw new ValidationError('User ID is required', 'id')
  }
  
  return c.json({ userId })
})
```

### Route-Level Error Handling

```typescript
import { handleAsyncError } from './middleware/error'

app.post('/api/users', handleAsyncError(async (c) => {
  const userData = await c.req.json()
  
  // Validation
  if (!userData.email) {
    throw new ValidationError('Email is required', 'email')
  }
  
  // Database operation
  const user = await createUser(userData)
  return c.json({ user }, 201)
}))
```

## Error Types

### Built-in Error Classes

```typescript
// Validation errors (400)
throw new ValidationError('Invalid email format', 'email', { value: 'invalid' })

// Authentication errors (401)
throw new AuthenticationError('Invalid token')

// Authorization errors (403)
throw new AuthorizationError('Insufficient permissions')

// Database errors (500)
throw new DatabaseError('Connection failed')

// Network errors (503)
throw new NetworkError('Service unavailable')

// Rate limit errors (429)
throw new RateLimitError('Too many requests', 60) // 60 seconds retry after

// Timeout errors (408)
throw new TimeoutError('Request timed out', 30000) // 30 second timeout

// Configuration errors (500)
throw new ConfigurationError('Missing environment variable')

// External service errors (502)
throw new ExternalServiceError('Payment service down', 'payment-service')
```

### Utility Functions

```typescript
import {
  createValidationError,
  createAuthenticationError,
  createDatabaseError,
  createRateLimitError
} from './middleware/error'

// Create errors with utility functions
throw createValidationError('Invalid input', 'field-name')
throw createAuthenticationError('Token expired')
throw createDatabaseError('Query failed', { query: 'SELECT * FROM users' })
throw createRateLimitError('Rate limit exceeded', 120) // 2 minutes
```

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "ValidationError",
  "message": "Invalid email format",
  "code": "VALIDATION_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-10-19T10:30:00.000Z",
  "category": "validation",
  "severity": "low",
  "recoverable": true,
  "suggestions": [
    "Check the request parameters",
    "Verify the input data format",
    "Review the API documentation"
  ],
  "context": {
    "endpoint": "/api/users",
    "method": "POST",
    "userId": "123"
  }
}
```

### Development vs Production

**Development Mode** (`ENVIRONMENT=development`):
- Includes stack traces
- Detailed error context
- Full error information

**Production Mode** (`ENVIRONMENT=production`):
- Sanitized error messages
- No stack traces
- Limited error context
- Focus on security

## Integration with Other Systems

### Authentication Integration

```typescript
import { authMiddleware } from './middleware/auth'

app.use('/api/protected/*', authMiddleware({ required: true }))

app.get('/api/protected/user', handleAsyncError(async (c) => {
  const user = c.get('auth').user
  
  if (!user) {
    throw createAuthenticationError('User not authenticated')
  }
  
  return c.json({ user })
}))
```

### Database Integration

```typescript
app.get('/api/users/:id', handleAsyncError(async (c) => {
  const userId = c.req.param('id')
  
  try {
    const user = await db.select().from(users).where(eq(users.id, userId))
    
    if (!user.length) {
      throw createValidationError('User not found', 'id', { value: userId })
    }
    
    return c.json({ user: user[0] })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    
    throw createDatabaseError('Failed to fetch user', {
      userId,
      originalError: error
    })
  }
}))
```

### WASM Module Integration

```typescript
import { WasmError } from '../wasm/modules/core/wasm-error-handler'

app.post('/api/format/json', handleAsyncError(async (c) => {
  const { json, options } = await c.req.json()
  
  try {
    // WASM module call
    const result = await jsonFormatter.format(json, options)
    return c.json({ result })
  } catch (error) {
    // WASM errors are automatically classified
    if (error instanceof WasmError) {
      throw error // Will be handled by middleware
    }
    
    throw new Error('JSON formatting failed')
  }
}))
```

## Error Monitoring

### Getting Error Metrics

```typescript
import { getErrorMetrics, getErrorHandler } from './middleware/error'

// Get error statistics
const metrics = getErrorMetrics()
console.log('Total errors:', metrics.totalErrors)
console.log('Errors by category:', metrics.errorsByCategory)
console.log('Recent errors:', metrics.recentErrors)

// Clear metrics
getErrorHandler().clearMetrics()
```

### Error Monitoring Endpoint

```typescript
app.get('/api/admin/errors', async (c) => {
  // Admin authentication check here
  
  const metrics = getErrorMetrics()
  const summary = {
    total: metrics.totalErrors,
    byCategory: metrics.errorsByCategory,
    bySeverity: metrics.errorsBySeverity,
    recent: metrics.recentErrors.slice(0, 20)
  }
  
  return c.json(summary)
})
```

## Configuration

### Environment Variables

```bash
# Error handling configuration
ENVIRONMENT=development          # development | production
LOG_LEVEL=debug                 # debug | info | warn | error
ENABLE_METRICS=true             # Enable error metrics tracking
```

### Custom Error Handling

```typescript
import { ApiError } from './middleware/error'

// Custom error class
export class BusinessLogicError extends ApiError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      422, // Unprocessable Entity
      'validation',
      'medium',
      context,
      true,
      ['Review business rules', 'Check data constraints']
    )
    this.name = 'BusinessLogicError'
  }
}

// Use in routes
app.post('/api/orders', handleAsyncError(async (c) => {
  const orderData = await c.req.json()
  
  if (orderData.amount <= 0) {
    throw new BusinessLogicError('Order amount must be positive', {
      amount: orderData.amount
    })
  }
  
  // Process order...
}))
```

## Testing

### Testing Error Handling

```typescript
import { describe, it, expect } from 'vitest'
import { ValidationError } from '../middleware/error'

describe('Error Handling', () => {
  it('should handle validation errors', async () => {
    const app = new Hono()
    app.use('*', errorMiddleware())
    
    app.get('/test', () => {
      throw new ValidationError('Invalid input')
    })
    
    const res = await app.request('/test')
    expect(res.status).toBe(400)
    
    const data = await res.json()
    expect(data.error).toBe('ValidationError')
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.category).toBe('validation')
  })
})
```

## Best Practices

### 1. Error Classification

- Use specific error types for different scenarios
- Include relevant context information
- Provide helpful suggestions for recovery

### 2. Error Messages

- Be descriptive but not overly technical
- Include what went wrong and why
- Avoid exposing sensitive information

### 3. Error Context

- Include relevant request information
- Add user context when available
- Provide debugging information in development

### 4. Error Recovery

- Mark errors as recoverable when possible
- Provide actionable suggestions
- Include retry information when applicable

### 5. Monitoring

- Track error patterns and frequencies
- Monitor critical errors in production
- Set up alerts for error spikes

## Troubleshooting

### Common Issues

1. **Errors not being caught**: Ensure error middleware is added first
2. **Missing request IDs**: Check that request ID middleware is properly configured
3. **No error metrics**: Verify that metrics are enabled in configuration
4. **Production showing stack traces**: Check ENVIRONMENT variable is set to 'production'

### Debug Mode

Enable debug logging for detailed error information:

```typescript
// In development
app.use('*', errorMiddleware())

// Add debug logging
app.use('*', async (c, next) => {
  console.log('Request:', c.req.method, c.req.path)
  await next()
  console.log('Response status:', c.res.status)
})
```

## API Reference

### Error Classes

- `ApiError` - Base error class
- `ValidationError` - Input validation errors (400)
- `AuthenticationError` - Authentication failures (401)
- `AuthorizationError` - Permission errors (403)
- `DatabaseError` - Database operation errors (500)
- `NetworkError` - Network connectivity errors (503)
- `RateLimitError` - Rate limiting errors (429)
- `TimeoutError` - Request timeout errors (408)
- `ConfigurationError` - Configuration errors (500)
- `ExternalServiceError` - External service errors (502)

### Utility Functions

- `createValidationError()` - Create validation errors
- `createAuthenticationError()` - Create authentication errors
- `createDatabaseError()` - Create database errors
- `createRateLimitError()` - Create rate limit errors
- `handleAsyncError()` - Wrap async route handlers
- `getErrorHandler()` - Get error handler instance
- `getErrorMetrics()` - Get error statistics

### Middleware

- `errorMiddleware()` - Global error handling middleware

## Contributing

When adding new error types or modifying the error handling:

1. Follow the existing error class patterns
2. Include proper TypeScript types
3. Add comprehensive tests
4. Update documentation
5. Consider backward compatibility

## License

This error handling middleware is part of the Parsify.dev project.