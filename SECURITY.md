# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Parsify, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Send an email to **ikashue@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix or mitigation**: Depends on severity, typically within 2 weeks

### What to Expect

- We will acknowledge receipt of your report
- We will work with you to understand the issue
- We will keep you informed of our progress
- We will credit you in the fix (unless you prefer to remain anonymous)

## Security Measures

### API Key Protection

- `DEEPSEEK_API_KEY` and `JINA_API_KEY` are read from `process.env` only
- Keys are never sent from the browser
- Keys are never logged
- Keys are never persisted (no database, no cache, no file)
- Keys are never echoed in API responses
- pino logger redacts `*.apiKey`, `*.headers.authorization`, `*.headers.cookie`

### SSRF Protection

The `parseRequestSchema` includes an SSRF guard that rejects:
- Loopback addresses (127.x, ::1, localhost)
- Private networks (10.x, 172.16-31.x, 192.168.x)
- Link-local addresses (169.254.x)

### Rate Limiting

- `/api/agent` is rate-limited to 20 requests per 15 minutes per IP
- Single-container deployment assumption

### Input Validation

- All API inputs are validated using Zod schemas
- URL validation includes scheme checking (http/https only)
- Markdown content is size-limited (1 MB for agent, 5 MB for parse response)

## Supported Versions

| Version | Supported |
|---|---|
| Latest | ✅ |
| Older | ❌ |

We only provide security updates for the latest version.
