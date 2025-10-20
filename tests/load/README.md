# Load Testing Framework for Concurrent Users

This comprehensive load testing framework validates system performance under realistic concurrent user scenarios, ensuring scalability and identifying performance bottlenecks.

## Overview

The load testing framework simulates realistic user behavior patterns and tests system performance under various concurrent user loads. It integrates with the existing T082 performance testing framework and provides comprehensive reporting and analysis capabilities.

## Features

- **Realistic User Simulation**: Simulates authentic user behavior patterns including tool usage, file operations, and session management
- **Concurrent User Testing**: Tests system performance with 10, 50, 100, 500+, and 1000+ concurrent users
- **Resource Monitoring**: Monitors CPU, memory, network, and database performance during tests
- **Comprehensive Reporting**: Generates HTML, JSON, CSV, and Markdown reports with detailed performance analysis
- **Stress and Endurance Testing**: Includes both short-duration stress tests and long-duration endurance tests
- **Integration with T082**: Seamlessly integrates with existing performance testing framework

## Directory Structure

```
tests/load/
├── config/
│   └── load-test-config.ts        # Load testing configuration and scenarios
├── scenarios/
│   ├── concurrent-auth-load.test.ts    # Authentication load testing scenarios
│   ├── simultaneous-tools-load.test.ts # Tool execution load testing scenarios
│   └── file-operations-load.test.ts    # File upload/download load testing scenarios
├── utils/
│   ├── user-simulator.ts          # User behavior simulation
│   ├── resource-monitor.ts        # System resource monitoring
│   └── load-test-reporter.ts      # Report generation and analysis
├── reports/                       # Generated test reports (auto-created)
└── comprehensive-load-test.test.ts # Main load test runner
```

## Quick Start

### Prerequisites

- Node.js 18+
- API server running on `http://localhost:8787` (default)
- Sufficient system resources for high-concurrency testing

### Running Load Tests

#### 1. Quick Smoke Test (10 users)
```bash
pnpm test:load:smoke
```
Runs basic load test with 10 concurrent users for quick validation.

#### 2. Quick Load Test (Multiple scenarios)
```bash
pnpm test:load:quick
```
Runs small team (10 users), medium team (50 users), and developer workflow scenarios.

#### 3. Full Load Test Suite
```bash
pnpm test:load:full
```
Comprehensive load testing across all scenarios (may take 30+ minutes).

#### 4. Stress and Endurance Testing
```bash
pnpm test:load:stress
```
Runs stress test (1000 users) and endurance test (100 users, 1 hour).

#### 5. Tool-Specific Load Testing
```bash
pnpm test:load:tools
```
Focused testing of simultaneous tool execution scenarios.

#### 6. Authentication Load Testing
```bash
pnpm test:load:auth
```
Focused testing of concurrent authentication flows.

### Environment Configuration

Set the API base URL:
```bash
export API_BASE_URL=http://localhost:8787
```

## Load Testing Scenarios

### Core Scenarios

#### Small Team (10 users)
- **Duration**: 5 minutes
- **Ramp-up**: 1 minute
- **Behavior**: Moderate tool usage
- **Requirements**: P95 < 300ms, 98% success rate

#### Medium Team (50 users)
- **Duration**: 10 minutes
- **Ramp-up**: 2 minutes
- **Behavior**: Moderate tool usage
- **Requirements**: P95 < 500ms, 95% success rate

#### Large Team (100 users)
- **Duration**: 15 minutes
- **Ramp-up**: 3 minutes
- **Behavior**: Heavy tool usage
- **Requirements**: P95 < 750ms, 90% success rate

#### Enterprise Scale (500 users)
- **Duration**: 20 minutes
- **Ramp-up**: 5 minutes
- **Behavior**: Moderate tool usage
- **Requirements**: P95 < 1000ms, 85% success rate

### Specialized Scenarios

#### Developer Workflow (25 users)
- **Focus**: Code formatting and execution
- **Duration**: 7.5 minutes
- **Behavior**: Code-heavy usage pattern

#### Analyst Workflow (15 users)
- **Focus**: JSON processing and data conversion
- **Duration**: 10 minutes
- **Behavior**: Data-heavy usage pattern

#### Stress Test (1000 users)
- **Focus**: Maximum system load
- **Duration**: 10 minutes
- **Ramp-up**: 10 minutes gradual
- **Requirements**: P95 < 2000ms, 70% success rate

#### Endurance Test (100 users, 1 hour)
- **Focus**: Long-term stability
- **Duration**: 60 minutes
- **Requirements**: P95 < 600ms, 92% success rate

## User Behavior Patterns

### Light Usage
- **Session Duration**: 15 minutes
- **Request Interval**: 30 seconds
- **Tool Focus**: JSON formatting (60%), validation (30%), conversion (10%)
- **File Operations**: 2 uploads, 3 downloads (small files)

### Moderate Usage
- **Session Duration**: 30 minutes
- **Request Interval**: 15 seconds
- **Tool Focus**: Balanced tool usage across all features
- **File Operations**: 5 uploads, 8 downloads (medium files)

### Heavy Usage
- **Session Duration**: 60 minutes
- **Request Interval**: 5 seconds
- **Tool Focus**: Intensive usage of all tools
- **File Operations**: 10 uploads, 15 downloads (large files)

### Developer Pattern
- **Session Duration**: 45 minutes
- **Request Interval**: 8 seconds
- **Tool Focus**: Code formatting (90%), execution (70%)
- **File Operations**: 8 uploads, 12 downloads (medium files)

### Analyst Pattern
- **Session Duration**: 90 minutes
- **Request Interval**: 10 seconds
- **Tool Focus**: JSON processing (80-90%)
- **File Operations**: 15 uploads, 20 downloads (large files)

## Performance Metrics

### Key Performance Indicators

- **P95 Response Time**: 95th percentile response time
- **Success Rate**: Percentage of successful requests
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Resource Utilization**: CPU, memory, network, database usage

### Performance Thresholds

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| P95 Response Time | < 100ms | < 200ms | < 500ms | > 1000ms |
| Success Rate | > 99% | > 95% | > 90% | < 80% |
| Throughput | > 1000 req/s | > 500 req/s | > 200 req/s | < 100 req/s |

## Reports and Analysis

### Report Formats

#### HTML Reports
- Interactive visual reports with charts and graphs
- Performance grade assessment (A-F)
- Bottleneck identification and recommendations
- Resource utilization trends

#### JSON Reports
- Complete raw data for further analysis
- Detailed metrics and timestamps
- Machine-readable format for automation

#### CSV Reports
- Tabular data for spreadsheet analysis
- Summary metrics for quick comparisons
- Compatible with data analysis tools

#### Markdown Reports
- Human-readable summary reports
- Key findings and recommendations
- Suitable for documentation and sharing

### Performance Analysis

The framework provides:
- **Bottleneck Identification**: Automatically detects performance bottlenecks
- **Trend Analysis**: Tracks performance metrics over time
- **Resource Correlation**: Correlates performance with resource usage
- **Recommendations**: Generates actionable improvement suggestions

### Performance Grades

- **A (Excellent)**: P95 < 200ms, 99%+ success rate
- **B (Good)**: P95 < 300ms, 95%+ success rate
- **C (Fair)**: P95 < 500ms, 90%+ success rate
- **D (Poor)**: P95 < 1000ms, 80%+ success rate
- **F (Fail)**: Below acceptable thresholds

## Integration with CI/CD

### GitHub Actions Integration

```yaml
- name: Run Load Tests
  run: |
    pnpm test:load:quick
  env:
    API_BASE_URL: http://localhost:8787
```

### Performance Gates

- **Pull Requests**: Run quick load tests (no blocking)
- **Main Branch**: Run full load test suite (blocking on failure)
- **Scheduled Runs**: Daily comprehensive testing with alerts

## Troubleshooting

### Common Issues

#### Test Failures
1. **API Server Not Available**:
   ```bash
   curl http://localhost:8787/health
   ```

2. **Resource Exhaustion**:
   - Monitor system resources during tests
   - Reduce concurrent user count if needed
   - Ensure sufficient memory and CPU

3. **Network Timeouts**:
   - Check network connectivity
   - Verify firewall settings
   - Increase timeout values if needed

#### Performance Issues

1. **High Response Times**:
   - Check database query performance
   - Monitor resource utilization
   - Review application logs

2. **Low Success Rates**:
   - Check for rate limiting
   - Review error handling
   - Verify request validation

3. **Memory Issues**:
   - Monitor for memory leaks
   - Check garbage collection
   - Review caching strategies

### Debug Mode

Enable verbose logging:
```bash
DEBUG=load:* pnpm test:load:smoke
```

## Configuration

### Custom Scenarios

Create custom load test scenarios by modifying `tests/load/config/load-test-config.ts`:

```typescript
{
  name: 'custom-scenario',
  description: 'Custom load test scenario',
  userCount: 75,
  duration: 600000, // 10 minutes
  rampUpTime: 120000, // 2 minutes
  behavior: USER_BEHAVIOR_PATTERNS.moderate,
  requirements: {
    maxP95ResponseTime: 400,
    minSuccessRate: 0.96,
    minThroughput: 120,
    maxErrorRate: 0.04
  }
}
```

### Environment Variables

```bash
# API Configuration
API_BASE_URL=http://localhost:8787

# Test Configuration
LOAD_TEST_TIMEOUT=30000
LOAD_TEST_RETRY_COUNT=3

# Reporting Configuration
LOAD_TEST_REPORT_DIR=./tests/load/reports
LOAD_TEST_INCLUDE_CHARTS=true
```

## Best Practices

### Test Design

1. **Gradual Scaling**: Start with small user counts and gradually increase
2. **Realistic Scenarios**: Use authentic user behavior patterns
3. **Consistent Environment**: Use consistent testing environment
4. **Baseline Establishment**: Establish performance baselines for comparison

### Performance Optimization

1. **Monitor Resources**: Track CPU, memory, and network usage
2. **Database Optimization**: Monitor query performance and connections
3. **Caching Strategy**: Implement appropriate caching mechanisms
4. **Load Balancing**: Distribute load effectively across resources

### Test Execution

1. **Warm-up Period**: Allow system to warm up before measurements
2. **Steady State**: Measure performance during steady-state operation
3. **Resource Cleanup**: Clean up resources between test runs
4. **Result Validation**: Validate test results and investigate anomalies

## Contributing

### Adding New Load Tests

1. Create test file in appropriate directory
2. Follow existing test patterns and naming conventions
3. Include proper assertions and error handling
4. Add documentation for new test scenarios
5. Update configuration if needed

### Performance Requirements

When adding new features:

1. **Define Performance Targets**: Establish P95, success rate, and throughput targets
2. **Create Load Tests**: Add comprehensive test coverage
3. **Baseline Establishment**: Record initial performance metrics
4. **Monitoring Setup**: Configure ongoing monitoring
5. **Documentation**: Update load testing documentation

## Support

For questions or issues with the load testing framework:

1. Check this README for common solutions
2. Review test output logs for specific error details
3. Check existing issues for known problems
4. Create new issue with detailed information including:
   - Test scenario and configuration
   - System specifications
   - Error messages and logs
   - Performance metrics and reports

---

**Note**: This load testing framework is designed to ensure system performance meets requirements under realistic concurrent user loads. Regular execution and monitoring of these tests helps maintain optimal system performance and scalability.