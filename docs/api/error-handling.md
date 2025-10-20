# Error Handling & Response Codes

This guide covers error handling in the Parsify API, including common error codes, response formats, and best practices for handling errors in your applications.

## Overview

The Parsify API uses standard HTTP status codes and provides detailed error information to help you debug issues quickly. All error responses follow a consistent format with helpful information for troubleshooting.

## HTTP Status Codes

### Success Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200 OK` | Success | Request completed successfully |
| `201 Created` | Created | Resource was successfully created |
| `202 Accepted` | Accepted | Request accepted for processing (async operations) |
| `204 No Content` | No Content | Request successful, no content returned |

### Client Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `400 Bad Request` | Bad Request | Invalid request parameters or format |
| `401 Unauthorized` | Unauthorized | Authentication required or failed |
| `403 Forbidden` | Forbidden | Insufficient permissions |
| `404 Not Found` | Not Found | Resource not found |
| `409 Conflict` | Conflict | Resource conflict (e.g., duplicate) |
| `413 Payload Too Large` | Too Large | Request exceeds size limits |
| `415 Unsupported Media Type` | Unsupported | Invalid content type |
| `422 Unprocessable Entity` | Validation Error | Valid format but semantic errors |
| `429 Too Many Requests` | Rate Limited | Rate limit exceeded |

### Server Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `500 Internal Server Error` | Server Error | Unexpected server error |
| `502 Bad Gateway` | Bad Gateway | Invalid response from upstream |
| `503 Service Unavailable` | Unavailable | Service temporarily unavailable |
| `504 Gateway Timeout` | Timeout | Request timed out |

## Error Response Format

### Standard Error Response

```json
{
  "error": "Error Type",
  "message": "Detailed error description",
  "requestId": "uuid-for-tracking",
  "timestamp": "2023-12-01T12:00:00Z",
  "path": "/api/v1/tools/json/format",
  "method": "POST"
}
```

### Validation Error Response

```json
{
  "error": "Validation Failed",
  "message": "Request validation failed",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z",
  "validation_errors": [
    {
      "field": "json",
      "message": "This field is required",
      "code": "required"
    },
    {
      "field": "indent",
      "message": "Value must be between 0 and 8",
      "code": "out_of_range",
      "value": 15
    }
  ]
}
```

### Rate Limit Error Response

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again later.",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z",
  "retryAfter": 300,
  "limit": 1000,
  "remaining": 0,
  "resetTime": 1701388800,
  "strategy": "token_bucket"
}
```

### Authentication Error Response

```json
{
  "error": "Authentication Required",
  "message": "Authorization header with Bearer token is required",
  "code": "MISSING_TOKEN",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

## Common Error Types

### 1. Authentication Errors (401)

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `MISSING_TOKEN` | Authorization header with Bearer token is required | No authentication token provided | Include valid Bearer token in Authorization header |
| `INVALID_TOKEN` | The provided token is invalid or malformed | Token format is incorrect or corrupted | Check token format and ensure it's not modified |
| `EXPIRED_TOKEN` | The provided token has expired | Token has reached its expiration time | Refresh the token or obtain a new one |
| `SESSION_NOT_FOUND` | The session associated with this token could not be found | Session was deleted or expired | Authenticate again to create new session |
| `USER_NOT_FOUND` | The user associated with this session could not be found | User account was deleted or suspended | Contact support for account issues |

### 2. Authorization Errors (403)

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `INSUFFICIENT_PERMISSIONS` | You do not have the required permissions to access this resource | Subscription tier doesn't include feature | Upgrade to appropriate subscription tier |
| `SUBSCRIPTION_EXPIRED` | Your subscription has expired | Subscription period has ended | Renew your subscription |
| `ACCOUNT_SUSPENDED` | Your account has been suspended | Violation of terms of service | Contact support |

### 3. Validation Errors (400, 422)

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `MISSING_PARAMETER` | Missing required parameter: {field} | Required parameter not provided | Include the required parameter |
| `INVALID_PARAMETER` | Invalid value for parameter: {field} | Parameter value is invalid | Use valid value for the parameter |
| `OUT_OF_RANGE` | Value must be between {min} and {max} | Parameter value outside allowed range | Use value within specified range |
| `INVALID_FORMAT` | Invalid format for parameter: {field} | Parameter format is incorrect | Use correct format (e.g., valid JSON) |
| `UNSUPPORTED_TYPE` | Unsupported content type: {type} | File or content type not supported | Use supported content types |

### 4. Resource Errors (404)

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `RESOURCE_NOT_FOUND` | The requested resource was not found | Resource ID doesn't exist | Verify the resource ID and try again |
| `FILE_NOT_FOUND` | File upload not found | File ID doesn't exist or expired | Upload the file again |
| `JOB_NOT_FOUND` | Job not found | Job ID doesn't exist | Check job ID or create new job |

### 5. Rate Limit Errors (429)

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Request limit exceeded | Wait and retry after reset time |
| `QUOTA_EXCEEDED` | Daily/monthly quota exceeded | Quota limit reached | Upgrade plan or wait for quota reset |

### 6. Server Errors (500, 503)

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `INTERNAL_ERROR` | An unexpected error occurred | Server-side issue | Retry request or contact support |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | Maintenance or outage | Check status page and retry later |
| `TIMEOUT_ERROR` | Request timeout | Processing took too long | Reduce request complexity or increase timeout |

## Error Handling Best Practices

### 1. Check HTTP Status Codes

```javascript
async function makeAPIRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error; // Re-throw API errors
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

class APIError extends Error {
  constructor(status, data) {
    super(data.message || 'API request failed');
    this.status = status;
    this.code = data.code;
    this.requestId = data.requestId;
    this.timestamp = data.timestamp;
    this.retryAfter = data.retryAfter;
  }

  isRetryable() {
    return this.status === 429 || this.status >= 500;
  }

  getRetryDelay() {
    if (this.retryAfter) {
      return this.retryAfter * 1000; // Convert to milliseconds
    }
    
    // Exponential backoff for retryable errors
    return Math.min(1000 * Math.pow(2, 3), 30000); // Max 30 seconds
  }
}
```

### 2. Implement Retry Logic

```javascript
async function makeRequestWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await makeAPIRequest(url, options);
    } catch (error) {
      lastError = error;
      
      if (!error.isRetryable() || attempt === maxRetries) {
        throw error;
      }
      
      const delay = error.getRetryDelay();
      console.log(`Request failed (attempt ${attempt}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

### 3. Handle Specific Error Types

```javascript
function handleAPIError(error) {
  if (error.status === 401) {
    // Authentication error - redirect to login
    window.location.href = '/login';
    return;
  }
  
  if (error.status === 403) {
    // Authorization error - show upgrade prompt
    showUpgradeModal();
    return;
  }
  
  if (error.status === 429) {
    // Rate limit error - show retry information
    const retryTime = Math.ceil(error.retryAfter / 60);
    showError(`Rate limit exceeded. Try again in ${retryTime} minutes.`);
    return;
  }
  
  if (error.status >= 500) {
    // Server error - show generic error message
    showError('Service temporarily unavailable. Please try again later.');
    return;
  }
  
  // Client error - show specific error message
  showError(error.message);
}
```

### 4. Log Errors for Debugging

```javascript
function logAPIError(error, requestInfo) {
  const errorData = {
    timestamp: new Date().toISOString(),
    requestId: error.requestId,
    status: error.status,
    code: error.code,
    message: error.message,
    url: requestInfo.url,
    method: requestInfo.method,
    userAgent: navigator.userAgent,
    userId: getCurrentUserId() // If authenticated
  };
  
  // Send to error tracking service
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      extra: errorData
    });
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', errorData);
  }
  
  // Send to custom logging endpoint
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData)
  }).catch(() => {
    // Ignore logging errors
  });
}
```

## Error Response Examples by Endpoint

### JSON Formatter Errors

```json
// Missing required parameter
{
  "error": "Missing required parameter: json",
  "message": "The json parameter is required for formatting",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-12-01T12:00:00Z"
}

// Invalid JSON input (returned as 200 with validation errors)
{
  "valid": false,
  "formatted": null,
  "errors": [
    {
      "line": 1,
      "column": 15,
      "message": "Expected property name or '}' in JSON at position 15"
    }
  ],
  "size": 30
}
```

### Code Executor Errors

```json
// Authentication required
{
  "error": "Authentication Required",
  "message": "This endpoint requires authentication with a Pro or Enterprise subscription",
  "code": "MISSING_TOKEN",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-12-01T12:00:00Z"
}

// Insufficient permissions
{
  "error": "Insufficient Permissions",
  "message": "Code execution requires a Pro subscription or higher",
  "code": "INSUFFICIENT_PERMISSIONS",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

### File Upload Errors

```json
// File too large
{
  "error": "File size 104857600 bytes exceeds maximum allowed size of 10485760 bytes",
  "message": "File too large for your subscription tier. Upgrade to upload larger files.",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-12-01T12:00:00Z",
  "suggestion": "Upgrade to Pro plan for 50MB limit or Enterprise for 500MB limit"
}

// Unsupported content type
{
  "error": "Content type application/pdf is not allowed",
  "message": "Only JSON, CSV, XML, and plain text files are supported",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-12-01T12:00:00Z",
  "allowed_types": ["application/json", "text/csv", "application/xml", "text/plain"]
}
```

## Monitoring and Alerting

### Error Rate Monitoring

```javascript
class ErrorMonitor {
  constructor() {
    this.errorCounts = {};
    this.errorThreshold = 10; // Alert after 10 errors of the same type
  }

  trackError(error) {
    const errorKey = `${error.status}:${error.code || 'UNKNOWN'}`;
    
    this.errorCounts[errorKey] = (this.errorCounts[errorKey] || 0) + 1;
    
    if (this.errorCounts[errorKey] >= this.errorThreshold) {
      this.sendAlert(errorKey, this.errorCounts[errorKey]);
    }
  }

  sendAlert(errorKey, count) {
    // Send alert to monitoring system
    fetch('/api/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'error_threshold_exceeded',
        errorKey,
        count,
        timestamp: new Date().toISOString()
      })
    });
  }

  getErrorStats() {
    return this.errorCounts;
  }

  reset() {
    this.errorCounts = {};
  }
}
```

### Health Check Integration

```javascript
async function checkAPIHealth() {
  try {
    const response = await fetch('/health');
    const health = await response.json();
    
    if (health.status !== 'healthy') {
      console.warn('API health degraded:', health);
      // Show warning to users
      showHealthWarning(health);
    }
    
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    showHealthError();
    return { status: 'unhealthy', error: error.message };
  }
}
```

## Client-Side Error Handling Patterns

### React Example

```jsx
import React, { useState, useEffect } from 'react';
import { useAPI } from './hooks/useAPI';

function JSONFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { formatJSON } = useAPI();

  const handleFormat = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await formatJSON(input);
      setOutput(result.formatted);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (error?.isRetryable()) {
      handleFormat();
    }
  };

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter JSON to format..."
      />
      
      <button onClick={handleFormat} disabled={loading}>
        {loading ? 'Formatting...' : 'Format JSON'}
      </button>
      
      {error && (
        <div className="error">
          <h4>Error: {error.message}</h4>
          {error.status === 429 && (
            <p>Rate limit exceeded. Try again in {Math.ceil(error.retryAfter / 60)} minutes.</p>
          )}
          {error.isRetryable() && (
            <button onClick={handleRetry}>Retry</button>
          )}
        </div>
      )}
      
      {output && (
        <pre>{output}</pre>
      )}
    </div>
  );
}
```

### Python Example

```python
import requests
import time
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ParsifyAPIError(Exception):
    def __init__(self, response: requests.Response):
        self.status = response.status_code
        self.data = response.json() if response.content else {}
        self.request_id = self.data.get('requestId')
        self.retry_after = self.data.get('retryAfter')
        super().__init__(self.data.get('message', 'API request failed'))

    def is_retryable(self) -> bool:
        return self.status == 429 or self.status >= 500

    def get_retry_delay(self) -> float:
        if self.retry_after:
            return self.retry_after
        # Exponential backoff
        return min(2 ** 3, 30)  # Max 30 seconds

class ParsifyClient:
    def __init__(self, api_token: Optional[str] = None, base_url: str = "https://api.parsify.dev/api/v1"):
        self.api_token = api_token
        self.base_url = base_url
        self.session = requests.Session()
        
        if api_token:
            self.session.headers.update({
                'Authorization': f'Bearer {api_token}'
            })

    def make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error = ParsifyAPIError(e.response)
            logger.error(f"API error: {error}", extra={
                'status': error.status,
                'request_id': error.request_id,
                'url': url
            })
            raise error

    def make_request_with_retry(self, method: str, endpoint: str, max_retries: int = 3, **kwargs) -> Dict[str, Any]:
        last_error = None
        
        for attempt in range(1, max_retries + 1):
            try:
                return self.make_request(method, endpoint, **kwargs)
            except ParsifyAPIError as error:
                last_error = error
                
                if not error.is_retryable() or attempt == max_retries:
                    raise error
                
                delay = error.get_retry_delay()
                logger.info(f"Request failed (attempt {attempt}), retrying in {delay}s...")
                time.sleep(delay)
        
        raise last_error

    def format_json(self, json_str: str, indent: int = 2) -> Dict[str, Any]:
        return self.make_request_with_retry(
            'POST', 
            '/tools/json/format',
            json={'json': json_str, 'indent': indent}
        )

# Usage with error handling
def safe_format_json(client: ParsifyClient, json_str: str) -> Optional[str]:
    try:
        result = client.format_json(json_str)
        return result.get('formatted')
    except ParsifyAPIError as error:
        if error.status == 400:
            print(f"Invalid JSON: {error.message}")
        elif error.status == 429:
            print(f"Rate limited. Try again in {error.retry_after} seconds.")
        elif error.status >= 500:
            print("Server error. Please try again later.")
        else:
            print(f"API error: {error.message}")
        return None
```

## Debugging Tools

### Request ID Tracking

All API responses include a `requestId` for debugging. Include this ID when reporting issues:

```javascript
function reportIssue(error, description) {
  const issueData = {
    description,
    requestId: error.requestId,
    status: error.status,
    code: error.code,
    message: error.message,
    timestamp: error.timestamp,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.log('Issue Report:', issueData);
  
  // Send to support or logging service
  fetch('/support/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(issueData)
  });
}
```

### Response Headers for Debugging

The API includes helpful headers for debugging:

```javascript
function logResponseInfo(response) {
  console.log('Response Headers:', {
    'X-Request-ID': response.headers.get('X-Request-ID'),
    'X-Rate-Limit-Limit': response.headers.get('X-Rate-Limit-Limit'),
    'X-Rate-Limit-Remaining': response.headers.get('X-Rate-Limit-Remaining'),
    'X-Rate-Limit-Reset': response.headers.get('X-Rate-Limit-Reset'),
    'X-Response-Time': response.headers.get('X-Response-Time')
  });
}
```

This comprehensive error handling guide should help you build robust applications that gracefully handle all types of API errors and provide excellent user experiences.