# Error Handling Middleware

This document provides comprehensive guidance on using the error handling middleware in the Parsify API.

## Overview

The error handling middleware provides centralized error management for Hono applications with the following features:

- **Centralized error handling** - Catch and handle all errors in one place
- **Error classification** - Automatic categorization and severity assessment
- **HTTP status code mapping** - Proper HTTP response codes for different error types
- **Logging and monitoring integration** - Built-in logging with Cloudflare integration
- **Production safety** - Sanitized error responses in production
- **Error correlation IDs** - Unique IDs for tracking errors across requests
- **Metrics and analytics** - Built-in error tracking and statistics

## Installation

The error middleware is already included in the project. Simply import it from the middleware directory:

```typescript
import { errorMiddleware } from './middleware/error'
```

## Basic Usage

### 1. Global Error Handling

Add the error middleware to your Hono app to handle all errors globally:

```typescript
import { Hono } from 'hono'
import { errorMiddleware } from './middleware/error'

const app = new Hono()

// Add error middleware (should be added early)
app.use('*', errorMiddleware())

// Your routes
app.get('/api/users', async (c) => {
  // Any error thrown here will be caught by the middleware
  const users = await userService.getUsers()
  return c.json({ users })
})

export default app
```

### 2. Throwing Custom Errors

Use the provided error classes for better error handling:

```typescript
import { 
  ValidationError, 
  AuthenticationError, 
  DatabaseError,
  createValidationError 
} from './middleware/error'

// Using classes
app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  
  if (!id || isNaN(Number(id))) {
    throw new ValidationError('Invalid user ID', 'id', { value: id })
  }
  
  // ... rest of the handler
})

// Using utility functions
app.post('/api/users', async (c) => {
  const data = await c.req.json()
  
  if (!data.email) {
    throw createValidationError('Email is required', 'email')
  }
  
  // ... rest of the handler
})
```

## Error Types

### Built-in Error Classes

The middleware provides several error classes for different scenarios:

#### ValidationError
- **Status Code**: 400
- **Category**: validation
- **Severity**: low
- **Use Case**: Invalid input data, missing required fields

```typescript
throw new ValidationError('Invalid email format', 'email', { value: 'invalid' })
throw createValidationError('Name is required', 'name')
```

#### AuthenticationError
- **Status Code**: 401
- **Category**: authentication
- **Severity**: medium
- **Use Case**: Missing or invalid authentication

```typescript
throw new AuthenticationError('Invalid token')
throw createAuthenticationError('Session expired')
```

#### AuthorizationError
- **Status Code**: 403
- **Category**: authorization
- **Severity**: medium
- **Use Case**: Insufficient permissions

```typescript
throw new AuthorizationError('Premium subscription required')
```

#### DatabaseError
- **Status Code**: 500
- **Category**: database
- **Severity**: high
- **Use Case**: Database connection or query failures

```typescript
throw new DatabaseError('Connection timeout', { query: 'SELECT * FROM users' })
throw createDatabaseError('Failed to save user', { userId })
```

#### RateLimitError
- **Status Code**: 429
- **Category**: rate_limit
- **Severity**: medium
- **Use Case**: Rate limiting violations

```typescript
throw new RateLimitError('Too many requests', 60) // 60 seconds retry after
throw createRateLimitError('API quota exceeded', 300, { userId, limit: 1000 })
```

#### TimeoutError
- **Status Code**: 408
- **Category**: timeout
- **Severity**: medium
- **Use Case**: Operation timeouts

```typescript
throw new TimeoutError('Database query timeout', 30000)
throw createTimeoutError('External API timeout', 10000, { service: 'payment' })
```

#### ConfigurationError
- **Status Code**: 500
- **Category**: configuration
- **Severity**: critical
- **Use Case**: Missing or invalid configuration

```typescript
throw new ConfigurationError('Missing DATABASE_URL')
```

#### ExternalServiceError
- **Status Code**: 502
- **Category**: external_service
- **Severity**: medium
- **Use Case**: Third-party service failures

```typescript
throw new ExternalServiceError('Payment service unavailable', 'payment-service')
```

### Automatic Error Classification

The middleware automatically classifies common error patterns:

```typescript
// These are automatically classified:
throw new Error('Request timed out')        // -> TimeoutError
throw new Error('Rate limit exceeded')       // -> RateLimitError
throw new Error('Unauthorized access')       // -> AuthenticationError
throw new Error('Database connection failed') // -> DatabaseError
```

## Advanced Usage

### 1. Service Layer Error Handling

```typescript
export class UserService {
  async getUserById(id: string) {
    try {
      const user = await this.database.findUser(id)
      if (!user) {
        throw createValidationError('User not found', 'id', { value: id })
      }
      return user
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error // Re-throw known errors
      }
      
      if (error.message.includes('timeout')) {
        throw createTimeoutError('Database timeout', 30000, { operation: 'findUser' })
      }
      
      throw createDatabaseError('Failed to fetch user', { id, originalError: error })
    }
  }
}
```

### 2. Route Handler Wrapper

Use the `handleAsyncError` wrapper for async route handlers:

```typescript
import { handleAsyncError } from './middleware/error'

app.post('/api/users', handleAsyncError(async (c) => {
  const userData = await c.req.json()
  const user = await userService.createUser(userData)
  return c.json({ user }, 201)
}))
```

### 3. Input Validation with Zod

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(18, 'Must be at least 18 years old')
})

app.post('/api/users/validated', 
  zValidator('json', createUserSchema),
  handleAsyncError(async (c) => {
    const userData = c.req.valid('json')
    const user = await userService.createUser(userData)
    return c.json({ user }, 201)
  })
)
```

### 4. WASM Error Handling

WASM errors are automatically handled and classified:

```typescript
app.post('/api/format-json', handleAsyncError(async (c) => {
  const { json, options } = await c.req.json()
  
  // WASM errors are automatically caught and classified
  const formatted = await wasmFormatter.format(json, options)
  return c.json({ formatted })
}))
```

## Error Response Format

All error responses follow this consistent format:

```typescript
{
  "error": "ValidationError",           // Error class name
  "message": "Invalid email format",    // Human-readable message
  "code": "VALIDATION_ERROR",           // Error code
  "requestId": "uuid-v4",               // Correlation ID
  "timestamp": "2023-01-01T00:00:00Z", // ISO timestamp
  "category": "validation",             // Error category
  "severity": "low",                    // Error severity
  "recoverable": true,                  // Whether error is recoverable
  "suggestions": [                      // Suggested actions (optional)
    "Check the request parameters",
    "Verify the input data format"
  ],
  "context": {                          // Additional context (development only)
    "endpoint": "/api/users",
    "method": "POST",
    "field": "email"
  },
  "stack": "Error stack trace"          // Stack trace (development only)
}
```

## Error Context

The middleware automatically includes contextual information:

- **Request ID**: Unique identifier for tracking
- **User ID**: From authentication context (if available)
- **Session ID**: From authentication context (if available)
- **IP Address**: Client IP address
- **User Agent**: Request user agent
- **Endpoint**: Request path
- **Method**: HTTP method
- **Timestamp**: Error occurrence time

## Environment-Specific Behavior

### Development Environment
- Includes full stack traces
- Includes detailed error context
- Shows all error details for debugging

### Production Environment
- Sanitized error responses
- No stack traces exposed
- Limited context information
- Security-focused error messages

## Logging and Monitoring

### Automatic Logging
Errors are automatically logged with appropriate severity levels:

```typescript
// Console output examples
[ERROR] {
  requestId: "uuid-v4",
  error: { name: "ValidationError", message: "Invalid email", ... },
  context: { endpoint: "/api/users", method: "POST", ... }
}

[CRITICAL] {
  requestId: "uuid-v4", 
  error: { name: "ConfigurationError", message: "Missing DATABASE_URL", ... }
}
```

### Cloudflare Integration
Error data is automatically stored in Cloudflare KV for monitoring:

```typescript
// Stored in ANALYTICS KV namespace
error_detail:{requestId}     // Full error details (7-30 days based on severity)
error_count:{category}:{code} // Error counts (resets daily)
```

### Error Metrics
Access error metrics programmatically:

```typescript
import { getErrorMetrics } from './middleware/error'

const metrics = getErrorMetrics()
console.log(metrics)
// {
//   totalErrors: 15,
//   errorsByCategory: { validation: 8, database: 3, authentication: 4 },
//   errorsBySeverity: { low: 8, medium: 5, high: 2 },
//   errorsByCode: { 'VALIDATION_ERROR': 8, 'DATABASE_ERROR': 3 },
//   recentErrors: [/* last 100 errors */]
// }
```

## Best Practices

### 1. Use Specific Error Types
```typescript
// Good
throw createValidationError('Email is required', 'email')

// Avoid
throw new Error('Something went wrong')
```

### 2. Include Relevant Context
```typescript
// Good
throw createValidationError('Invalid user ID', 'id', { 
  value: userId, 
  min: 1, 
  max: 999999 
})

// Less useful
throw new ValidationError('Invalid ID')
```

### 3. Handle Errors Appropriately
```typescript
// Good - handle specific errors
try {
  const user = await userService.getUserById(id)
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors differently
  }
  throw error // Re-throw for middleware to handle
}
```

### 4. Use Async Wrapper for Routes
```typescript
// Good
app.post('/api/users', handleAsyncError(async (c) => {
  // Your async code here
}))

// Avoid
app.post('/api/users', async (c) => {
  // Forgetting try/catch can cause unhandled rejections
})
```

### 5. Validate Input Early
```typescript
// Good - validate input at route level
app.post('/api/users', 
  zValidator('json', userSchema),
  handleAsyncError(async (c) => {
    const userData = c.req.valid('json') // Already validated
    return await userService.createUser(userData)
  })
)
```

## Testing Error Handling

### Test Error Responses
```typescript
import { test, expect } from 'vitest'

test('should handle validation errors', async () => {
  const res = await app.request('/api/users', {
    method: 'POST',
    body: JSON.stringify({ email: 'invalid' })
  })
  
  expect(res.status).toBe(400)
  
  const data = await res.json()
  expect(data.error).toBe('ValidationError')
  expect(data.code).toBe('VALIDATION_ERROR')
  expect(data.category).toBe('validation')
  expect(data.requestId).toBeDefined()
})
```

### Test Error Classification
```typescript
test('should classify timeout errors', async () => {
  const error = new Error('Request timed out')
  const classified = errorHandler.classifyError(error, {} as ErrorContext)
  
  expect(classified).toBeInstanceOf(TimeoutError)
  expect(classified.statusCode).toBe(408)
})
```

## Monitoring and Alerting

### Health Check Integration
```typescript
app.get('/api/health/error-status', async (c) => {
  const metrics = getErrorMetrics()
  const recentCritical = metrics.recentErrors.filter(
    e => e.timestamp > new Date(Date.now() - 300000) // Last 5 minutes
  ).length
  
  return c.json({
    status: recentCritical > 5 ? 'critical' : 
            recentCritical > 0 ? 'degraded' : 'healthy',
    recentCriticalErrors: recentCritical,
    totalErrors: metrics.totalErrors
  })
})
```

### Error Threshold Alerting
```typescript
// Example: Alert on high error rates
setInterval(() => {
  const metrics = getErrorMetrics()
  const recentErrors = metrics.recentErrors.filter(
    e => e.timestamp > new Date(Date.now() - 300000)
  ).length
  
  if (recentErrors > 10) {
    // Send alert to monitoring system
    alertService.send('High error rate detected', { 
      recentErrors,
      totalErrors: metrics.totalErrors 
    })
  }
}, 60000) // Check every minute
```

## Migration Guide

### From Basic Error Handling
```typescript
// Before
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message }, 500)
})

// After
app.use('*', errorMiddleware())
// No need for custom onError handler
```

### From Manual Try/Catch
```typescript
// Before
app.get('/api/users/:id', async (c) => {
  try {
    const user = await userService.getUserById(c.req.param('id'))
    return c.json({ user })
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// After
app.get('/api/users/:id', handleAsyncError(async (c) => {
  const user = await userService.getUserById(c.req.param('id'))
  return c.json({ user })
}))
```

## Troubleshooting

### Common Issues

1. **Errors not being caught**: Ensure `errorMiddleware()` is added early in the middleware chain
2. **Missing context**: Make sure authentication middleware sets user data in context
3. **No metrics in production**: Check that Cloudflare services are properly configured
4. **Stack traces in production**: Verify `ENVIRONMENT` is set to 'production'

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your environment:

```typescript
// This will include detailed error information in logs
console.debug('Error Details:', {
  error: errorInfo.error,
  classification: errorInfo.classification,
  context: errorInfo.context
})
```

## API Reference

### Main Functions

- `errorMiddleware()` - Global error handling middleware
- `handleAsyncError()` - Wrapper for async route handlers
- `getErrorHandler()` - Get error handler instance
- `getErrorMetrics()` - Get error statistics

### Error Classes

- `ApiError` - Base error class
- `ValidationError` - Input validation errors
- `AuthenticationError` - Authentication failures
- `AuthorizationError` - Permission errors
- `DatabaseError` - Database operation errors
- `NetworkError` - Network connectivity errors
- `RateLimitError` - Rate limiting violations
- `TimeoutError` - Operation timeouts
- `ConfigurationError` - Configuration issues
- `ExternalServiceError` - Third-party service failures

### Utility Functions

- `createValidationError()` - Create validation errors
- `createAuthenticationError()` - Create authentication errors
- `createDatabaseError()` - Create database errors
- `createRateLimitError()` - Create rate limit errors
- `createTimeoutError()` - Create timeout errors
- `createExternalServiceError()` - Create external service errors

For more examples, see `error-examples.ts` in the same directory.