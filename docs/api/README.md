# Parsify API Documentation

Welcome to the Parsify API documentation. This API provides powerful tools for JSON processing, code execution, file management, and more.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [OpenAPI Specification](#openapi-specification)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Getting Started

### Base URL

```
https://api.parsify.dev
```

### API Version

The current API version is `v1`. All endpoints are prefixed with `/api/v1`.

### Making Requests

All API requests should be made using HTTPS. The API supports JSON request and response formats.

#### Example Request

```bash
curl -X POST https://api.parsify.dev/api/v1/tools/json/format \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"name\":\"John\",\"age\":30}",
    "indent": 2
  }'
```

## Authentication

The Parsify API uses JWT (JSON Web Token) based authentication. While some endpoints are available without authentication, authenticated users have access to higher limits and premium features.

### Authentication Methods

1. **Bearer Token (JWT)**: Include your JWT token in the Authorization header
2. **Session-based**: Session tokens for web applications

### Getting Started

1. Sign up for a Parsify account
2. Generate an API key from your dashboard
3. Include the API key in your requests

```bash
curl -X GET https://api.parsify.dev/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Endpoints

### Tools
- [JSON Formatter](./endpoints/json-formatter.md)
- [JSON Validator](./endpoints/json-validator.md)
- [JSON Converter](./endpoints/json-converter.md)
- [Code Executor](./endpoints/code-executor.md)
- [Code Formatter](./endpoints/code-formatter.md)

### File Management
- [File Upload](./endpoints/file-upload.md)
- [File Status](./endpoints/file-status.md)

### Jobs
- [Create Job](./endpoints/jobs-create.md)
- [Get Job Status](./endpoints/jobs-status.md)
- [List Jobs](./endpoints/jobs-list.md)

### Users
- [User Profile](./endpoints/users-profile.md)
- [User Stats](./endpoints/users-stats.md)

### Authentication
- [Session Management](./endpoints/auth-sessions.md)
- [Token Refresh](./endpoints/auth-refresh.md)

### Health & Monitoring
- [Health Check](./endpoints/health-check.md)
- [System Metrics](./endpoints/health-metrics.md)

## Rate Limiting

The API implements rate limiting to ensure fair usage. Rate limits vary based on:

- Authentication status
- Subscription tier (free, pro, enterprise)
- Endpoint type
- Request complexity

### Rate Limit Headers

All API responses include rate limit headers:

```
X-Rate-Limit-Limit: 1000
X-Rate-Limit-Remaining: 999
X-Rate-Limit-Reset: 1640995200
X-Rate-Limit-Strategy: token_bucket
```

## Error Handling

The API uses standard HTTP status codes and provides detailed error responses.

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "requestId": "uuid-for-tracking",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

### Common Error Codes

- `400` - Bad Request: Invalid request parameters
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server-side error

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:

- [OpenAPI YAML](./openapi.yaml)
- [OpenAPI JSON](./openapi.json)
- [Interactive Swagger UI](https://api.parsify.dev/docs)

## Examples

Check out our [examples](./examples/) directory for:

- [Getting Started Guide](./examples/getting-started.md)
- [Authentication Examples](./examples/authentication.md)
- [Tool Usage Examples](./examples/tools.md)
- [Error Handling Examples](./examples/error-handling.md)
- [Rate Limiting Examples](./examples/rate-limiting.md)

## Best Practices

- [API Usage Best Practices](./best-practices/usage.md)
- [Security Best Practices](./best-practices/security.md)
- [Performance Optimization](./best-practices/performance.md)
- [Error Handling Patterns](./best-practices/error-handling.md)

## Support

- [API Status](https://status.parsify.dev)
- [Support Documentation](https://docs.parsify.dev)
- [Contact Support](mailto:support@parsify.dev)

## Changelog

View the [API changelog](./changelog.md) for updates and breaking changes.