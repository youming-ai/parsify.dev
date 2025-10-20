# Performance Test Suite

This comprehensive performance test suite ensures all API endpoints meet the <200ms p95 response time target and can handle concurrent load effectively.

## Overview

The performance test suite includes:

- **Individual endpoint testing** for all API routes (tools, auth, users, jobs, upload)
- **Load testing** with configurable concurrency and request counts
- **Performance metrics collection** and detailed reporting
- **CI/CD integration** with automated regression detection
- **Real-time monitoring** and alerting for performance issues

## Performance Targets

- **P95 Response Time**: < 200ms for all endpoints
- **Success Rate**: > 95% for all tests
- **Throughput**: > 10 requests per second minimum
- **Concurrent Load**: Support for 20+ concurrent requests

## Directory Structure

```
tests/performance/
├── utils/
│   ├── performance-utils.ts     # Core performance testing utilities
│   └── endpoint-configs.ts     # API endpoint configurations
├── load/
│   └── load-scenarios.test.ts  # Comprehensive load testing scenarios
├── metrics/
│   └── performance-collector.ts # Metrics collection and analysis
├── tools.performance.test.ts   # Tools API performance tests
├── auth.performance.test.ts    # Auth API performance tests
├── users.performance.test.ts   # Users API performance tests
├── jobs.performance.test.ts    # Jobs API performance tests
├── upload.performance.test.ts  # Upload API performance tests
├── runner.js                   # CLI performance test runner
└── README.md                   # This file
```

## Quick Start

### Prerequisites

- Node.js 18+
- API server running on `http://localhost:8787` (default)

### Running Performance Tests

#### 1. Quick Smoke Test
```bash
pnpm test:performance:smoke
```
Runs basic performance tests with light load (5 concurrent, 25 requests per endpoint).

#### 2. Full Performance Test
```bash
pnpm test:performance:full
```
Comprehensive performance tests with higher load (20 concurrent, 100 requests per endpoint).
Fails if performance thresholds are not met.

#### 3. Custom Performance Test
```bash
node tests/performance/runner.js \
  --url http://localhost:8787 \
  --concurrency 15 \
  --requests 75 \
  --output ./my-reports \
  --format all \
  --fail-on-threshold
```

#### 4. Run Individual Test Files
```bash
# Test specific API endpoints
pnpm test tests/performance/tools.performance.test.ts
pnpm test tests/performance/auth.performance.test.ts

# Run comprehensive load scenarios
pnpm test tests/performance/load/load-scenarios.test.ts
```

## CLI Options

The performance test runner supports the following options:

```bash
node tests/performance/runner.js [options]

Options:
  -u, --url <url>                Base URL for API testing (default: http://localhost:8787)
  -o, --output <dir>             Output directory for reports (default: ./performance-reports)
  -f, --format <format>          Report format: json, csv, html, all (default: all)
  -v, --verbose                  Verbose output
  --fail-on-threshold            Fail if performance thresholds are not met
  --max-p95 <ms>                 Maximum acceptable P95 response time (default: 200)
  --min-success-rate <rate>      Minimum acceptable success rate 0-1 (default: 0.95)
  --min-rps <rps>                Minimum acceptable requests per second (default: 10)
  -c, --concurrency <number>     Concurrent requests per test (default: 10)
  -r, --requests <number>        Total requests per test (default: 50)
  -d, --duration <ms>            Test duration in milliseconds (default: 30000)
```

## Test Coverage

### Tools API (`/tools/*`)
- GET `/tools` - List available tools
- POST `/tools/json/format` - Format JSON with various data sizes
- POST `/tools/json/validate` - Validate JSON
- POST `/tools/json/convert` - Convert JSON to CSV/XML
- POST `/tools/code/format` - Format JavaScript/Python code

### Auth API (`/auth/*`)
- GET `/auth/validate` - Session validation (various auth states)
- POST `/auth/refresh` - Token refresh
- POST `/auth/logout` - User logout

### Users API (`/users/*`)
- GET `/users/profile` - Get user profile
- PUT `/users/profile` - Update user profile
- GET `/users/stats` - Get user statistics
- GET `/users/:id` - Get public user info
- POST `/users/subscription` - Update subscription

### Jobs API (`/jobs/*`)
- POST `/jobs` - Create new job
- GET `/jobs` - List jobs
- GET `/jobs/:id` - Get job details
- PATCH `/jobs/:id` - Update job
- DELETE `/jobs/:id` - Delete job

### Upload API (`/upload/*`)
- POST `/upload/sign` - Get presigned upload URL
- GET `/upload/status/:fileId` - Check upload status
- POST `/upload/confirm/:fileId` - Confirm upload
- GET `/upload/download/:fileId` - Get download URL
- DELETE `/upload/:fileId` - Delete upload
- GET `/upload/` - List uploads

## Load Testing Scenarios

### 1. Smoke Test
- **Purpose**: Quick health check for critical endpoints
- **Load**: 1 concurrent, 10 requests per endpoint
- **Duration**: ~30 seconds
- **Requirements**: P95 < 50ms, 100% success rate

### 2. Tools Basic Load
- **Purpose**: Test read-only tools operations
- **Load**: 5 concurrent, 50 requests per endpoint
- **Duration**: ~2 minutes
- **Requirements**: P95 < 150ms, 98% success rate

### 3. Tools Intensive Load
- **Purpose**: Test write-intensive tools operations
- **Load**: 10 concurrent, 100 requests per endpoint
- **Duration**: ~5 minutes
- **Requirements**: P95 < 300ms, 95% success rate

### 4. Concurrency Stress Test
- **Purpose**: Test performance under varying concurrency levels
- **Load**: 1, 5, 10, 25, 50, 100, 200 concurrent requests
- **Requirements**: Maintain reasonable performance degradation

### 5. Full System Load Test
- **Purpose**: Comprehensive system performance test
- **Load**: Mixed load across all endpoints
- **Duration**: ~10 minutes
- **Requirements**: P95 < 500ms, 90% success rate

### 6. Sustained Load Test
- **Purpose**: Test performance over extended duration
- **Load**: Continuous load for 30 seconds
- **Requirements**: Stable performance over time

## Reports and Metrics

### Report Formats

1. **JSON**: Complete raw data for further analysis
2. **CSV**: Tabular data for spreadsheet analysis
3. **HTML**: Visual report with charts and graphs
4. **Markdown**: Summary report for documentation

### Key Metrics

- **Response Time**: P50, P90, P95, P99 percentiles
- **Success Rate**: Percentage of successful requests
- **Throughput**: Requests per second
- **Error Analysis**: Categorized error counts
- **Performance Trends**: Historical performance data

### Example Report Output

```
Performance Test Report
=======================
URL: http://localhost:8787/health (GET)
Total Requests: 50
Successful: 50 (100.0%)
Failed: 0

Response Times:
- Average: 12.45ms
- Min: 8.12ms
- Max: 25.67ms
- P50: 11.23ms
- P90: 18.45ms
- P95: 22.34ms
- P99: 24.89ms

Throughput:
- Requests/sec: 125.45
```

## CI/CD Integration

### GitHub Actions Workflow

The performance test suite integrates with GitHub Actions for:

- **Automated Testing**: Run on every push and PR
- **Scheduled Testing**: Daily performance monitoring
- **Regression Detection**: Compare with baseline performance
- **Alerting**: Create issues for performance regressions
- **Reporting**: Generate and archive performance reports

### CI Configuration

```yaml
# Example CI usage
- name: Run Performance Tests
  run: |
    pnpm test:performance:ci
  env:
    API_BASE_URL: http://localhost:8787
```

### Performance Gates

- **Pull Requests**: Performance tests run but don't block merge
- **Main Branch**: Full performance tests with failure on threshold breach
- **Scheduled Runs**: Comprehensive monitoring and alerting

## Performance Monitoring

### Real-time Monitoring

The suite includes real-time monitoring capabilities:

- **Performance Thresholds**: Configurable alerting
- **Trend Analysis**: Track performance over time
- **Anomaly Detection**: Identify unusual performance patterns
- **Baseline Comparison**: Compare with historical performance

### Metrics Collection

```typescript
// Example metrics collection
import { performanceMonitor } from './tests/performance/metrics/performance-collector'

// Record performance data
await performanceMonitor.recordPerformance('api_endpoint_test', results)

// Generate performance report
const report = await performanceMonitor.generateReport()

// Get performance trends
const trends = await performanceMonitor.getPerformanceTrends('api_endpoint_test', 7) // 7 days
```

## Best Practices

### Test Design

1. **Realistic Load**: Test with realistic data sizes and request patterns
2. **Gradual Scaling**: Start with light load and gradually increase
3. **Multiple Scenarios**: Test different usage patterns and edge cases
4. **Consistent Environment**: Use consistent testing environment
5. **Baseline Establishment**: Establish performance baselines for comparison

### Performance Optimization

1. **Monitor Resource Usage**: CPU, memory, and network utilization
2. **Database Performance**: Query optimization and connection pooling
3. **Caching Strategy**: Implement appropriate caching mechanisms
4. **Load Balancing**: Distribute load effectively across resources
5. **Error Handling**: Graceful degradation under load

### Troubleshooting

1. **High Response Times**:
   - Check database query performance
   - Monitor resource utilization
   - Review code for optimization opportunities

2. **Low Success Rates**:
   - Check error logs and patterns
   - Verify rate limiting configuration
   - Test edge cases and invalid inputs

3. **Performance Degradation**:
   - Compare with historical baselines
   - Check for memory leaks or resource exhaustion
   - Review recent code changes

## Configuration

### Environment Variables

```bash
# API server URL
API_BASE_URL=http://localhost:8787

# Performance thresholds
MAX_P95_RESPONSE_TIME=200
MIN_SUCCESS_RATE=0.95
MIN_REQUESTS_PER_SECOND=10

# Test configuration
DEFAULT_CONCURRENCY=10
DEFAULT_REQUESTS=50
TEST_TIMEOUT=30000
```

### Custom Configuration

```typescript
// Custom performance test configuration
const customConfig = {
  baseUrl: 'https://api.example.com',
  thresholds: {
    maxP95ResponseTime: 150,
    minSuccessRate: 0.98,
    minRequestsPerSecond: 20
  },
  concurrency: 15,
  requests: 100,
  timeout: 45000
}
```

## Contributing

### Adding New Performance Tests

1. Create test file in appropriate directory
2. Follow existing test patterns and naming conventions
3. Include proper assertions and error handling
4. Add documentation for new test scenarios
5. Update CI configuration if needed

### Performance Requirements

When adding new endpoints or features:

1. **Define Performance Targets**: Establish P95, success rate, and throughput targets
2. **Create Performance Tests**: Add comprehensive test coverage
3. **Baseline Establishment**: Record initial performance metrics
4. **Monitoring Setup**: Configure ongoing monitoring
5. **Documentation**: Update performance documentation

## Troubleshooting Common Issues

### Test Failures

1. **Server Not Available**:
   ```bash
   # Ensure API server is running
   curl http://localhost:8787/health
   ```

2. **Permission Issues**:
   ```bash
   # Check output directory permissions
   mkdir -p ./performance-reports
   chmod 755 ./performance-reports
   ```

3. **Memory Issues**:
   ```bash
   # Increase Node.js memory limit
   node --max-old-space-size=4096 tests/performance/runner.js
   ```

### Performance Issues

1. **High Response Times**:
   - Check database query performance
   - Monitor system resource utilization
   - Review application logs for bottlenecks

2. **Low Success Rates**:
   - Check for rate limiting
   - Review error handling and edge cases
   - Verify request validation and processing

## Support

For questions or issues with the performance test suite:

1. Check this README for common solutions
2. Review test output logs for specific error details
3. Check GitHub Issues for known problems
4. Create new issue with detailed information

---

**Note**: This performance test suite is designed to ensure API endpoints meet the <200ms p95 response time target while maintaining high reliability under load. Regular execution and monitoring of these tests helps maintain optimal API performance.