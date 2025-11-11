# Test Suite for Tools Homepage

This directory contains comprehensive unit tests for the tools homepage and its related components. The test suite ensures high code quality, reliability, and maintainability of the Parsify.dev tools homepage.

## 📁 Test Structure

```
src/__tests__/
├── app/                           # Next.js App Router tests
│   └── tools/
│       ├── tools-page.test.tsx    # Main tools homepage tests
│       └── test-utils.tsx         # Page-specific test utilities
├── components/                    # Component tests
│   └── tools/
│       ├── tool-search.test.tsx   # Search component tests
│       ├── tool-filters.test.tsx  # Filter component tests
│       ├── category-navigation.test.tsx  # Navigation tests
│       ├── breadcrumb-navigation.test.tsx  # Breadcrumb tests
│       └── category-overview.test.tsx     # Category overview tests
├── hooks/                         # React hook tests
│   └── use-responsive-layout.test.tsx    # Responsive layout hook tests
├── lib/                          # Utility function tests
│   ├── search-utils.test.ts       # Search utility tests
│   ├── category-utils.test.ts     # Category utility tests
│   └── mobile-utils.test.ts       # Mobile utility tests
├── utils/                        # Test utilities and mocks
│   ├── test-data.ts              # Mock data fixtures
│   ├── mocks.ts                  # Mock implementations
│   └── test-utils.tsx            # Custom render functions and helpers
├── scripts/                      # Test scripts
│   └── run-tests.sh              # Comprehensive test runner
├── coverage.config.ts            # Coverage configuration
├── vitest.setup.ts               # Global test setup
└── README.md                     # This file
```

## 🧪 Test Categories

### 1. Homepage Tests (`app/tools/tools-page.test.tsx`)
- **Rendering**: Page structure, hero section, headers
- **Search**: Search functionality, results display
- **Filters**: Filter application, active filters display
- **Navigation**: Category navigation, breadcrumbs
- **Responsive**: Mobile/desktop layouts
- **Interactions**: Tool cards, category selection
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Large datasets, rapid interactions

### 2. Component Tests

#### Search Component (`components/tools/tool-search.test.tsx`)
- Input handling and debouncing
- Search suggestions and keyboard navigation
- Tool selection and navigation
- Mobile optimization
- Error handling and edge cases

#### Filters Component (`components/tools/tool-filters.test.tsx`)
- Filter section rendering and expansion
- Checkbox interactions and state management
- Active filters display and removal
- Category counts and statistics
- Mobile overlay behavior

#### Navigation Components
- **Category Navigation** (`category-navigation.test.tsx`): Category selection, subcategories, mobile menu
- **Breadcrumb Navigation** (`breadcrumb-navigation.test.tsx`): Path navigation, current page indication
- **Category Overview** (`category-overview.test.tsx`): Category display, tool grids, view all functionality

### 3. Hook Tests (`hooks/use-responsive-layout.test.tsx`)
- Responsive layout calculations
- Breakpoint detection
- Viewport size monitoring
- Mobile/tablet/desktop adaptation
- Performance optimization

### 4. Utility Tests

#### Search Utils (`lib/search-utils.test.ts`)
- Search algorithms and filtering
- Relevance scoring and sorting
- Query processing and suggestions
- Performance optimization

#### Category Utils (`lib/category-utils.test.ts`)
- Category management and statistics
- Tool categorization
- Metadata processing
- Data transformation

#### Mobile Utils (`lib/mobile-utils.test.ts`)
- Device detection
- Touch interaction handling
- Mobile-specific utilities
- Performance optimization

## 🎯 Test Coverage Goals

### Coverage Thresholds
- **Global**: 80% minimum for all metrics
- **Critical Components**: 85-90% coverage
- **Utilities**: 90-95% coverage

### Key Areas Covered
- ✅ Component rendering and lifecycle
- ✅ User interactions and events
- ✅ Responsive behavior
- ✅ Accessibility compliance
- ✅ Error handling and edge cases
- ✅ Performance scenarios
- ✅ Integration workflows

## 🛠️ Running Tests

### Quick Start
```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Using the Test Runner Script
```bash
# Make the script executable
chmod +x src/__tests__/scripts/run-tests.sh

# Run all tests
./src/__tests__/scripts/run-tests.sh test

# Run tests with coverage
./src/__tests__/scripts/run-tests.sh coverage

# Run specific test suite
./src/__tests__/scripts/run-tests.sh suite homepage

# Run tests in watch mode
./src/__tests__/scripts/run-tests.sh watch

# Generate coverage report
./src/__tests__/scripts/run-tests.sh report

# Clean test artifacts
./src/__tests__/scripts/run-tests.sh clean

# Check test setup
./src/__tests__/scripts/run-tests.sh check
```

### Running Specific Tests
```bash
# Run homepage tests only
pnpm vitest run src/__tests__/app/tools/tools-page.test.tsx

# Run search component tests
pnpm vitest run src/__tests__/components/tools/tool-search.test.tsx

# Run all utility tests
pnpm vitest run src/__tests__/lib/*.test.ts

# Run tests matching a pattern
pnpm vitest run --grep "search"
```

## 📊 Coverage Reports

After running tests with coverage:

1. **HTML Report**: Open `coverage/lcov-report/index.html` in your browser
2. **Terminal Report**: View coverage summary in the terminal
3. **JSON Report**: Find detailed data in `coverage/coverage-summary.json`

### Coverage Configuration
- **Thresholds**: Defined in `src/__tests__/coverage.config.ts`
- **Exclusions**: Test files, types, configs, stories
- **Reporting**: Text, JSON, HTML, LCOV formats
- **Requirements**: Per-component thresholds for critical areas

## 🔧 Test Configuration

### Vitest Setup (`vitest.config.ts`)
- **Environment**: jsdom for DOM testing
- **Setup**: Global test configuration in `vitest.setup.ts`
- **Coverage**: Comprehensive coverage settings
- **Aliases**: Path aliases for clean imports
- **Optimization**: Dependency pre-bundling

### Global Setup (`vitest.setup.ts`)
- **Mock Implementations**: Next.js router, browser APIs
- **Test Utilities**: Custom helpers and factories
- **Environment**: Consistent test environment
- **Cleanup**: Automatic cleanup between tests

## 🏗️ Test Architecture

### Test Utilities (`utils/`)

#### Mock Data (`test-data.ts`)
- Comprehensive mock data for all scenarios
- Tool, category, and search state fixtures
- Performance and error scenario mocks
- Responsive test data

#### Mocks (`mocks.ts`)
- Browser API mocks (localStorage, fetch, etc.)
- Next.js router mocks
- React Testing Library utilities
- Performance and timing mocks

#### Test Utils (`test-utils.tsx`)
- Custom render functions with providers
- User interaction helpers
- Assertion utilities
- Responsive testing helpers
- Performance testing utilities

### Best Practices

1. **Descriptive Tests**: Clear test names and descriptions
2. **Arrange-Act-Assert**: Consistent test structure
3. **Mocking**: Proper isolation and controlled dependencies
4. **Edge Cases**: Comprehensive error scenario testing
5. **Accessibility**: ARIA compliance and keyboard navigation
6. **Performance**: Load and interaction performance testing
7. **Responsive**: Mobile, tablet, and desktop testing

## 🐛 Debugging Tests

### Common Issues

1. **Mock Failures**: Check mock implementations in `mocks.ts`
2. **Async Tests**: Use `waitFor` and proper async handling
3. **Timer Issues**: Use fake timers and proper cleanup
4. **DOM Issues**: Verify jsdom setup and element selection
5. **Import Issues**: Check path aliases and module resolution

### Debugging Tools
```bash
# Run with verbose output
pnpm vitest run --reporter=verbose

# Debug specific test
pnpm vitest run --reporter=verbose --no-coverage src/__tests__/path/to/test.test.tsx

# Run with Node inspector
node --inspect-brk node_modules/.bin/vitest run src/__tests__/path/to/test.test.tsx
```

## 📈 Performance Testing

### Load Testing
- Large tool datasets (100+ items)
- Complex filter combinations
- Rapid search input scenarios
- Memory leak detection

### Interaction Testing
- Debounced search performance
- Filter application timing
- Responsive layout calculations
- Touch interaction optimization

## 🔄 Continuous Integration

### GitHub Actions
```yaml
# Example CI workflow
- name: Run Tests
  run: |
    chmod +x src/__tests__/scripts/run-tests.sh
    ./src/__tests__/scripts/run-tests.sh coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Coverage Badges
- Display coverage status in README
- Track coverage trends over time
- Set minimum coverage requirements
- Monitor critical component coverage

## 📚 Learning Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Matchers](https://jestjs.io/docs/using-matchers)
- [Testing Best Practices](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

## 🤝 Contributing

When adding new tests:

1. **Follow Patterns**: Use existing test structure and naming
2. **Mock Appropriately**: Isolate dependencies effectively
3. **Cover Scenarios**: Include happy path, edge cases, and errors
4. **Test Accessibility**: Include ARIA and keyboard navigation tests
5. **Document**: Add comments for complex test scenarios
6. **Update Coverage**: Ensure new code meets coverage requirements

## 📞 Support

For test-related questions or issues:
- Check existing test files for examples
- Review Vitest documentation
- Consult the test utilities and mocks
- Reach out in project discussions

---

**Note**: This test suite is designed to ensure the reliability and quality of the tools homepage. Regular execution and maintenance of tests is essential for long-term code health.