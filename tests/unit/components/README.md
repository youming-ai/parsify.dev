# Unit Tests for React Components

This directory contains comprehensive unit tests for all React components in the Parsify.dev application.

## Test Structure

```
tests/unit/components/
├── ui/                          # UI component tests
│   ├── button.test.tsx         # Button component tests
│   ├── input.test.tsx          # Input component tests
│   ├── card.test.tsx           # Card component tests
│   └── alert.test.tsx          # Alert component tests
├── auth/                       # Authentication component tests
│   ├── login-form.test.tsx     # LoginForm component tests
│   └── auth-guard.test.tsx     # AuthGuard component tests
├── json/                       # JSON tool component tests
│   ├── json-viewer.test.tsx    # JsonViewer component tests
│   ├── json-formatter.test.tsx # JsonFormatter component tests
│   └── json-validator.test.tsx # JsonValidator component tests
├── file-upload/                # File upload component tests
│   └── file-drop-zone.test.tsx # FileDropZone component tests
├── layout/                     # Layout component tests
│   ├── main-layout.test.tsx    # MainLayout component tests
│   └── sidebar.test.tsx        # Sidebar component tests
├── accessibility.test.tsx      # Accessibility tests
├── test-utils.tsx              # Test utilities and mocks
├── test-setup.tsx              # Global test setup
└── README.md                   # This file
```

## Test Coverage

### UI Components

1. **Button Component** (`ui/button.test.tsx`)
   - Renders with different variants (default, destructive, outline, secondary, ghost, link)
   - Handles different sizes (sm, default, lg, icon)
   - Supports click events and keyboard interactions
   - Handles disabled state
   - Supports custom className and ref forwarding
   - Tests accessibility attributes and focus indicators

2. **Input Component** (`ui/input.test.tsx`)
   - Renders different input types (text, password, email, number, file)
   - Handles value changes and form events
   - Supports focus and blur events
   - Handles disabled state
   - Supports custom className and ref forwarding
   - Tests form integration and validation attributes

3. **Card Component** (`ui/card.test.tsx`)
   - Renders complete card structure (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
   - Supports custom className and ref forwarding
   - Tests semantic HTML structure and accessibility
   - Handles different content types and compositions

4. **Alert Component** (`ui/alert.test.tsx`)
   - Renders all alert variants (default, destructive, warning, success, info)
   - Supports proper ARIA roles and live regions
   - Handles alert titles and descriptions
   - Tests accessibility and screen reader support

### Authentication Components

1. **LoginForm Component** (`auth/login-form.test.tsx`)
   - Renders OAuth provider options (Google, GitHub)
   - Handles email/password form display and interaction
   - Tests form validation and submission
   - Handles loading states and error display
   - Supports keyboard navigation and accessibility

2. **AuthGuard Component** (`auth/auth-guard.test.tsx`)
   - Handles authentication state checking
   - Redirects unauthenticated users from protected routes
   - Redirects authenticated users from guest-only routes
   - Supports custom loading components and fallbacks
   - Tests HOC patterns and route access hooks

### JSON Tool Components

1. **JsonViewer Component** (`json/json-viewer.test.tsx`)
   - Renders JSON data in tree structure
   - Handles expand/collapse functionality
   - Tests copy to clipboard and download features
   - Supports different data types and nested structures
   - Tests keyboard navigation and accessibility

2. **JsonFormatter Component** (`json/json-formatter.test.tsx`)
   - Formats JSON with various options (indent, sort keys, compact mode)
   - Handles settings panel and option changes
   - Tests copy, download, and notification features
   - Supports auto-formatting and real-time updates

3. **JsonValidator Component** (`json/json-validator.test.tsx`)
   - Validates JSON syntax and provides error feedback
   - Handles debouncing during input changes
   - Displays statistics and status indicators
   - Tests error display and revalidation functionality

### File Upload Components

1. **FileDropZone Component** (`file-upload/file-drop-zone.test.tsx`)
   - Handles drag and drop file upload
   - Supports file filtering by type and size
   - Tests multiple file handling
   - Handles keyboard navigation and accessibility
   - Supports custom children and styling

### Layout Components

1. **MainLayout Component** (`layout/main-layout.test.tsx`)
   - Renders layout with optional sidebar
   - Tests DOM structure and semantic HTML
   - Handles different content types
   - Supports responsive design classes

2. **Sidebar Component** (`layout/sidebar.test.tsx`)
   - Renders navigation with collapsible categories
   - Handles category expansion and tool selection
   - Tests keyboard navigation and accessibility
   - Supports active state highlighting

### Accessibility Tests

1. **Comprehensive Accessibility Testing** (`accessibility.test.tsx`)
   - Tests semantic HTML and ARIA attributes
   - Validates keyboard navigation support
   - Tests focus management and screen reader support
   - Validates color contrast and visual accessibility
   - Tests proper landmark elements and heading structure

## Test Utilities

### Test Setup (`test-setup.tsx`)
- Global mocks for Next.js, React Router, and icons
- Mocks for clipboard API and browser APIs
- Setup for ResizeObserver and IntersectionObserver
- Mock for crypto.randomUUID

### Test Utils (`test-utils.tsx`)
- Custom render function with providers (React Query, Router)
- Mock data generators for users, files, and jobs
- Sample JSON and code data for testing
- Re-exports all testing library functions

## Running Tests

### Install Dependencies
```bash
pnpm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Run Tests
```bash
# Run all component tests
pnpm test tests/unit/components/

# Run tests in watch mode
pnpm test tests/unit/components/ --watch

# Run tests with coverage
pnpm test tests/unit/components/ --coverage

# Run specific test file
pnpm test tests/unit/components/ui/button.test.tsx
```

## Test Configuration

The tests are configured in `vitest.config.ts`:
- Environment: jsdom (for React component testing)
- Setup files: `tests/setup.ts` and `tests/unit/components/test-setup.tsx`
- File patterns: `tests/**/*.{test,spec}.{js,ts,jsx,tsx}`
- Path aliases configured for easy imports

## Mock Strategy

### Component Mocks
- External libraries (Next.js, React Router) are mocked
- Icons are mocked with simple div elements
- API calls and services are mocked with vi.fn()

### Data Mocks
- User data: `createMockUser()`
- File data: `createMockFile()`
- Job data: `createMockJob()`
- Sample JSON: `SAMPLE_JSON`
- Sample code: `SAMPLE_CODE`

## Best Practices

1. **Test Behavior, Not Implementation**: Tests focus on what components do, not how they do it
2. **Use Testing Library**: Tests query the DOM like a user would
3. **Mock External Dependencies**: All external dependencies are mocked
4. **Test Accessibility**: All components include accessibility tests
5. **Test Edge Cases**: Tests cover error states, loading states, and empty states
6. **Use Descriptive Test Names**: Test names clearly describe what is being tested
7. **Group Related Tests**: Tests are grouped in describe blocks for organization
8. **Cleanup After Tests**: Each test cleans up mocks and state

## Coverage Goals

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

Coverage reports are generated in HTML, JSON, and text formats.

## Future Enhancements

1. **Visual Testing**: Add visual regression tests with tools like Percy or Chromatic
2. **E2E Testing**: Add end-to-end tests with Playwright or Cypress
3. **Performance Testing**: Add performance tests for complex components
4. **Component Storybook**: Integrate with Storybook for visual documentation
5. **Contract Testing**: Add contract tests for API integrations

## Troubleshooting

### Import Resolution Issues
If you encounter import resolution errors, ensure:
1. Path aliases are correctly configured in `vitest.config.ts`
2. All mock files are properly set up
3. Dependencies are installed correctly

### Test Environment Issues
If tests fail due to environment issues:
1. Ensure jsdom environment is configured
2. Check that all browser APIs are properly mocked
3. Verify that React testing library is properly installed

### Component Rendering Issues
If components don't render correctly in tests:
1. Check that all providers are properly set up
2. Verify that all dependencies are mocked
3. Ensure component props are correctly passed