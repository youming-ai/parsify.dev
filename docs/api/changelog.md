# API Changelog

This document tracks changes to the Parsify API, including new features, bug fixes, and breaking changes.

## [Unreleased]

### Added
- Comprehensive API documentation
- OpenAPI 3.0 specification
- Enhanced error handling and response codes
- Rate limiting improvements
- Security best practices guide

### Changed
- Improved error message consistency
- Enhanced authentication middleware
- Better rate limit headers

### Fixed
- Token refresh edge cases
- File upload validation issues
- Rate limiting edge cases

## [1.0.0] - 2023-12-01

### Added
- Initial API release
- JSON formatting, validation, and conversion tools
- Code execution and formatting tools
- File upload and management
- Job processing system
- User management and profiles
- Authentication and authorization
- Rate limiting and usage quotas
- Health monitoring and metrics

### Core Features

#### JSON Tools
- **Format JSON**: Beautify JSON with custom indentation and key sorting
- **Validate JSON**: Syntax validation and JSON schema validation
- **Convert JSON**: Convert JSON to CSV, XML, and other formats

#### Code Tools
- **Execute Code**: Run JavaScript and Python code in secure sandbox
- **Format Code**: Format and beautify code in multiple languages

#### File Management
- **Upload Files**: Secure file upload with presigned URLs
- **File Status**: Track upload progress and status
- **File Processing**: Use uploaded files with other API tools

#### Job Processing
- **Create Jobs**: Asynchronous processing of large tasks
- **Job Status**: Monitor job progress and results
- **Job Management**: List, update, and delete jobs

#### User Management
- **User Profiles**: Manage user information and preferences
- **User Statistics**: Track usage and quota information
- **Subscription Management**: Handle subscription tiers and quotas

#### Authentication
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Handle user sessions and refresh tokens
- **Rate Limiting**: Tier-based rate limiting and usage quotas

### Security Features
- JWT-based authentication
- API key management
- Rate limiting and quota enforcement
- Secure file upload with presigned URLs
- Input validation and sanitization
- Error handling without information leakage

### Rate Limits

#### Anonymous Users
- 100 requests/hour
- 10MB max file size
- Basic JSON tools only

#### Free Tier
- 1,000 requests/hour
- 10MB max file size
- All JSON tools
- Basic code formatting (JavaScript)

#### Pro Tier
- 5,000 requests/hour
- 50MB max file size
- All JSON tools
- Code execution (JavaScript, Python)
- Advanced code formatting
- Priority processing

#### Enterprise Tier
- 50,000 requests/hour
- 500MB max file size
- All features
- Custom execution environments
- Dedicated resources
- Advanced analytics

### API Endpoints

#### Root Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /metrics` - System metrics (admin)

#### Tools Endpoints
- `GET /api/v1/tools` - List available tools
- `POST /api/v1/tools/json/format` - Format JSON
- `POST /api/v1/tools/json/validate` - Validate JSON
- `POST /api/v1/tools/json/convert` - Convert JSON
- `POST /api/v1/tools/code/execute` - Execute code
- `POST /api/v1/tools/code/format` - Format code

#### File Upload Endpoints
- `POST /api/v1/upload/sign` - Get upload URL
- `GET /api/v1/upload/status/{fileId}` - Get upload status
- `POST /api/v1/upload/confirm/{fileId}` - Confirm upload
- `DELETE /api/v1/upload/{fileId}` - Delete upload

#### Jobs Endpoints
- `GET /api/v1/jobs` - List jobs
- `POST /api/v1/jobs` - Create job
- `GET /api/v1/jobs/{jobId}` - Get job
- `PATCH /api/v1/jobs/{jobId}` - Update job
- `DELETE /api/v1/jobs/{jobId}` - Delete job

#### User Endpoints
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/stats` - Get user statistics
- `POST /api/v1/users/subscription` - Update subscription
- `GET /api/v1/users/{userId}` - Get public user info
- `GET /api/v1/users/admin/dashboard` - Admin dashboard

#### Authentication Endpoints
- `POST /api/v1/auth/session` - Create session
- `GET /api/v1/auth/validate` - Validate session
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Response Formats

#### Success Responses
All successful responses follow consistent formats:

```json
{
  "data": { /* response data */ },
  "timestamp": "2023-12-01T12:00:00Z",
  "requestId": "uuid-here"
}
```

#### Error Responses
All error responses include detailed information:

```json
{
  "error": "Error Type",
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

### HTTP Status Codes

#### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing

#### Client Error Codes
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `413 Payload Too Large` - Request exceeds size limits
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded

#### Server Error Codes
- `500 Internal Server Error` - Unexpected server error
- `503 Service Unavailable` - Service temporarily unavailable

### Headers

#### Standard Headers
- `Content-Type: application/json` - All API responses use JSON
- `X-Request-ID: uuid` - Unique request identifier for debugging

#### Rate Limit Headers
- `X-Rate-Limit-Limit: 1000` - Total requests allowed
- `X-Rate-Limit-Remaining: 999` - Requests remaining in window
- `X-Rate-Limit-Reset: 1701388800` - Window reset timestamp
- `X-Rate-Limit-Strategy: token_bucket` - Rate limiting algorithm used

### Authentication

#### Bearer Token Authentication
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.parsify.dev/api/v1/users/profile
```

#### Rate Limits by Subscription
Different subscription tiers have different rate limits:

| Tier | Requests/Hour | Max File Size | Features |
|------|---------------|---------------|----------|
| Anonymous | 100 | 10MB | Basic JSON tools |
| Free | 1,000 | 10MB | All JSON tools, basic code formatting |
| Pro | 5,000 | 50MB | Code execution, advanced features |
| Enterprise | 50,000 | 500MB | All features, priority support |

### SDKs and Libraries

#### Official SDKs
- JavaScript/TypeScript (npm: `@parsify/api-client`)
- Python (pip: `parsify-api`)
- Coming soon: Go, Java, Ruby, PHP

#### Community Libraries
- Various third-party libraries available
- Check GitHub for community contributions

### Support and Resources

#### Documentation
- [API Documentation](https://docs.parsify.dev/api)
- [OpenAPI Specification](https://api.parsify.dev/openapi.yaml)
- [Examples and Tutorials](https://docs.parsify.dev/examples)

#### Support
- [API Status](https://status.parsify.dev)
- [Support Portal](https://support.parsify.dev)
- [Email Support](mailto:support@parsify.dev)

#### Community
- [GitHub Discussions](https://github.com/parsify/api/discussions)
- [Discord Community](https://discord.gg/parsify)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/parsify-api)

---

## Upcoming Features

### [v1.1.0] - Planned

#### New Features
- Webhook support for job completion notifications
- Batch processing endpoints
- Advanced JSON schema validation
- Custom code execution environments
- Real-time collaboration features
- Advanced analytics and reporting

#### Enhancements
- Improved error messages
- Additional code language support
- Enhanced file format support
- Performance optimizations
- Better rate limiting controls

#### New Endpoints
- `POST /api/v1/webhooks` - Create webhook
- `GET /api/v1/webhooks` - List webhooks
- `POST /api/v1/batch/process` - Batch processing
- `GET /api/v1/analytics/usage` - Usage analytics

---

## Deprecation Policy

### Version Support
- Current stable version: 1.0.x
- Previous versions supported for 12 months after deprecation
- Security patches provided for all supported versions

### Deprecation Process
1. **Announcement**: 6 months notice before deprecation
2. **Warning Period**: 3 months with deprecation warnings
3. **End of Life**: Version no longer supported
4. **Migration Support**: Documentation and tools provided

### Breaking Changes
Breaking changes will only occur in major version updates and will include:
- Detailed migration guides
- Compatibility periods
- Support for legacy endpoints
- Automated migration tools where possible

---

## Security Updates

### Security Advisories
- Critical security issues fixed within 48 hours
- Security advisories published within 7 days
- Patch releases for supported versions only
- Security mailing list for notifications

### Vulnerability Disclosure
- Responsible disclosure policy
- Bug bounty program
- Security team contact information
- Public disclosure timeline

---

For questions about this changelog or API changes, please contact [support@parsify.dev](mailto:support@parsify.dev).