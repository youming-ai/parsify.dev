# WASM Modules Unit Tests

This directory contains comprehensive unit tests for all WASM modules in the Parsify platform.

## Test Coverage

### Core Services
- **JSON Formatter** (`test_json_formatter.ts`) - Tests JSON formatting, validation, error handling, and performance
- **JSON Validator** (`test_json_validator.ts`) - Tests JSON schema validation, syntax checking, and custom rules
- **JSON Converter** (`test_json_converter.ts`) - Tests data format conversion between JSON, XML, YAML, CSV, and TOML
- **Code Formatter** (`test_code_formatter.ts`) - Tests code formatting for multiple programming languages
- **Code Executor** (`test_code_executor.ts`) - Tests secure code execution with sandboxing

### Infrastructure
- **WASM Modules** (`test_wasm_modules.ts`) - Tests module loading, registry, error handling, and lifecycle management

## Test Structure

```
tests/unit/wasm/
├── index.ts                    # Test suite entry point and utilities
├── test-setup.ts              # Test configuration and common utilities
├── mocks/
│   └── wasm-mocks.ts          # Mock implementations for WASM modules
├── test_json_formatter.ts     # JSON formatter tests
├── test_json_validator.ts     # JSON validator tests
├── test_json_converter.ts     # JSON converter tests
├── test_code_formatter.ts     # Code formatter tests
├── test_code_executor.ts      # Code executor tests
└── test_wasm_modules.ts       # WASM infrastructure tests
```

## Running Tests

```bash
# Run all WASM tests
npm test tests/unit/wasm/

# Run with coverage
npm run test:coverage tests/unit/wasm/

# Run specific test file
npm test tests/unit/wasm/test_json_formatter.ts

# Run tests in watch mode
npm run test tests/unit/wasm/ -- --watch
```

## Test Features

### Comprehensive Coverage
- ✅ **Unit Tests**: Individual function and method testing
- ✅ **Integration Tests**: Cross-module functionality testing
- ✅ **Error Handling**: Failure scenarios and edge cases
- ✅ **Performance Tests**: Memory usage and execution time
- ✅ **Security Tests**: Input validation and sandboxing

### Mocking Strategy
- **WASM Module Mocks**: Simulate WASM behavior when actual modules aren't available
- **Performance API Mocks**: Mock timing and performance measurements
- **Crypto API Mocks**: Mock UUID generation and random values
- **Network Mocks**: Mock fetch and other network operations

### Test Utilities
- **Data Generators**: Create test data of various sizes and complexities
- **Mock Factories**: Generate mock modules and results
- **Assertion Helpers**: Custom assertions for common test patterns
- **Performance Measurement**: Measure execution time and memory usage

## Test Categories

### 1. Functionality Tests
- Basic functionality verification
- Input/output validation
- Configuration options
- Language-specific features

### 2. Error Handling Tests
- Invalid inputs
- Malformed data
- Network failures
- Resource limits
- Security violations

### 3. Performance Tests
- Large data processing
- Memory usage limits
- Execution time constraints
- Concurrent operations

### 4. Security Tests
- Input sanitization
- Code injection prevention
- Resource isolation
- Privilege escalation prevention

### 5. Integration Tests
- Cross-module interactions
- End-to-end workflows
- Dependency resolution
- Lifecycle management

## Configuration

### Test Environment
- **Node.js**: Test execution environment
- **Vitest**: Test runner and assertion library
- **vi.fn()**: Mock function creation
- **Fake Timers**: Time-based test control

### Coverage Configuration
- **Provider**: v8 (Chrome's coverage tool)
- **Threshold**: 80% for all metrics
- **Reporters**: text, json, html
- **Exclusions**: node_modules, tests, config files

## Best Practices

### Test Organization
- Group related tests with `describe`
- Use descriptive test names with `it`
- Setup/teardown with `beforeEach`/`afterEach`
- Share common setup with `beforeAll`/`afterAll`

### Mock Usage
- Mock external dependencies
- Use consistent mock data
- Reset mocks between tests
- Verify mock interactions when necessary

### Assertion Style
- Use specific matchers (`toContain`, `toBeGreaterThan`)
- Test both positive and negative cases
- Include meaningful error messages
- Test edge cases and boundaries

### Performance Considerations
- Use timeouts for long-running tests
- Test with various data sizes
- Monitor memory usage
- Test concurrent operations

## Debugging

### Test Failures
- Check console output for detailed error messages
- Use `console.log` for debugging test flow
- Run tests individually to isolate issues
- Use VSCode debugger for step-through debugging

### Mock Issues
- Verify mock implementations
- Check mock call counts and arguments
- Ensure proper mock setup/teardown
- Validate mock return values

### Performance Problems
- Check test timeout settings
- Profile slow tests
- Optimize test data generation
- Consider test parallelization

## Continuous Integration

### GitHub Actions
- Tests run on every push and pull request
- Coverage reports generated and uploaded
- Performance benchmarks tracked
- Security scans included

### Coverage Reporting
- Coverage reports uploaded to Codecov
- PR coverage checks enforced
- Historical coverage tracking
- Coverage badges displayed

## Future Enhancements

### Planned Improvements
- [ ] Visual regression testing for code formatting
- [ ] Load testing for high-volume scenarios
- [ ] Fuzz testing for security validation
- [ ] Contract testing for API compatibility

### Test Tools
- [ ] Property-based testing with fast-check
- [ ] Visual diff comparison for formatted output
- [ ] Performance benchmarking and regression detection
- [ ] Security vulnerability scanning

## Contributing

When adding new tests:

1. **Follow existing patterns** - Use the same structure and naming conventions
2. **Include comprehensive coverage** - Test happy paths, edge cases, and error conditions
3. **Add meaningful assertions** - Ensure tests provide real value and catch actual issues
4. **Document complex scenarios** - Add comments for non-obvious test logic
5. **Keep tests independent** - Avoid dependencies between test cases
6. **Update documentation** - Keep this README current with new test additions

## Troubleshooting

### Common Issues

**Tests timeout**
- Increase timeout in test configuration
- Check for infinite loops or blocking operations
- Verify mock implementations aren't causing delays

**Mock not working**
- Ensure mocks are properly imported and configured
- Check that mocks are reset between tests
- Verify mock implementation matches expected interface

**Coverage gaps**
- Identify uncovered code paths
- Add tests for edge cases and error conditions
- Review test assertions for completeness

**Environment issues**
- Ensure all required APIs are available or mocked
- Check Node.js version compatibility
- Verify dependency versions are correct

For additional help, refer to the [Vitest documentation](https://vitest.dev/) or create an issue in the project repository.