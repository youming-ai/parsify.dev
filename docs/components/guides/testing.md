# Component Testing Guidelines

This guide covers the testing approach and best practices for the Parsify.dev component library. The components are tested with Vitest and React Testing Library.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Setup and Configuration](#setup-and-configuration)
- [Testing Patterns](#testing-patterns)
  - [Component Rendering](#component-rendering)
  - [User Interactions](#user-interactions)
  - [Prop Testing](#prop-testing)
  - [Variant Testing](#variant-testing)
  - [Accessibility Testing](#accessibility-testing)
  - [Mocking Dependencies](#mocking-dependencies)
- [Component Testing Examples](#component-testing-examples)
  - [Button Component](#button-component)
  - [Input Component](#input-component)
  - [Card Component](#card-component)
  - [Tabs Component](#tabs-component)
  - [Form Components](#form-components)
  - [Async Components](#async-components)
- [Tool Component Testing](#tool-component-testing)
  - [JSON Validator](#json-validator)
  - [Code Editor](#code-editor)
  - [File Upload](#file-upload)
- [Integration Testing](#integration-testing)
- [Performance Testing](#performance-testing)
- [Visual Regression Testing](#visual-regression-testing)
- [Best Practices](#best-practices)

## Overview

The testing strategy focuses on:

- **Behavior Testing**: Test what users see and interact with
- **Accessibility**: Ensure components work for all users
- **Component Variants**: Test all component states and variations
- **User Interactions**: Verify interactive elements work correctly
- **Error Handling**: Test edge cases and error states

## Testing Stack

### Core Tools

```json
{
  "vitest": "^1.0.0",                    // Test runner
  "@testing-library/react": "^16.3.0",   // React testing utilities
  "@testing-library/jest-dom": "^6.9.1", // Custom matchers
  "@testing-library/user-event": "^14.6.1", // User simulation
  "jsdom": "^23.2.0"                    // DOM environment
}
```

### Configuration Files

```js
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Setup MSW server
beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())
```

## Setup and Configuration

### Test File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── button.test.tsx
│   │   ├── input.tsx
│   │   └── input.test.tsx
│   └── tools/
│       ├── json/
│       │   ├── json-validator.tsx
│       │   └── json-validator.test.tsx
├── test/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   └── utils/
│       ├── test-utils.tsx
│       └── accessibility.ts
```

### Test Utilities

```tsx
// src/test/utils/test-utils.tsx
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Custom render function
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

```tsx
// src/test/utils/accessibility.ts
import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'

expect.extend(toHaveNoViolations)

export const testAccessibility = async (Component: React.ReactElement) => {
  const { container } = render(Component)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}
```

## Testing Patterns

### Component Rendering

```tsx
import { render, screen } from '@/test/utils'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})
```

### User Interactions

```tsx
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button interactions', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    )
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

### Prop Testing

```tsx
import { render, screen } from '@/test/utils'
import { Input } from '@/components/ui/input'

describe('Input props', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('renders with value', () => {
    render(<Input value="test value" readOnly />)
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies required attribute', () => {
    render(<Input required />)
    expect(screen.getByRole('textbox')).toBeRequired()
  })
})
```

### Variant Testing

```tsx
import { render, screen } from '@/test/utils'
import { Button } from '@/components/ui/button'

describe('Button variants', () => {
  const variants = [
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
  ] as const

  variants.forEach(variant => {
    it(`renders ${variant} variant`, () => {
      render(<Button variant={variant}>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // Add specific variant class tests
    })
  })

  const sizes = ['default', 'sm', 'lg', 'icon'] as const

  sizes.forEach(size => {
    it(`renders ${size} size`, () => {
      render(<Button size={size}>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // Add specific size class tests
    })
  })
})
```

### Accessibility Testing

```tsx
import { testAccessibility } from '@/test/utils/accessibility'
import { Button } from '@/components/ui/button'

describe('Button accessibility', () => {
  it('should be accessible', async () => {
    await testAccessibility(<Button>Accessible Button</Button>)
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Button</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()
    
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    await user.keyboard('{ }') // Space key
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('has proper ARIA attributes', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })
})
```

### Mocking Dependencies

```tsx
// src/test/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  // Mock API endpoints
  rest.get('/api/user', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      })
    )
  }),

  rest.post('/api/upload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'file-1',
        name: 'test-file.txt',
        url: 'https://example.com/file-1',
      })
    )
  }),
]

// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

## Component Testing Examples

### Button Component

```tsx
// components/ui/button.test.tsx
import { render, screen, fireEvent } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('renders with text content', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not trigger click when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Button</Button>)
    const button = screen.getByRole('button')
    
    button.focus()
    await user.keyboard('{Enter}')
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders all variants', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    
    variants.forEach(variant => {
      const { unmount } = render(<Button variant={variant}>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders all sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const
    
    sizes.forEach(size => {
      const { unmount } = render(<Button size={size}>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount()
    })
  })
})
```

### Input Component

```tsx
// components/ui/input.test.tsx
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles value changes', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<Input onChange={handleChange} />)
    await user.type(screen.getByRole('textbox'), 'Hello')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be controlled', () => {
    render(<Input value="controlled" readOnly />)
    expect(screen.getByDisplayValue('controlled')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies required attribute', () => {
    render(<Input required />)
    expect(screen.getByRole('textbox')).toBeRequired()
  })

  it('supports different input types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url']
    
    types.forEach(type => {
      const { unmount } = render(<Input type={type} />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      unmount()
    })
  })
})
```

### Card Component

```tsx
// components/ui/card.test.tsx
import { render, screen } from '@/test/utils'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card'

describe('Card components', () => {
  it('renders card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Card content</CardContent>
        <CardFooter>Card footer</CardFooter>
      </Card>
    )

    expect(screen.getByRole('heading', { name: /card title/i })).toBeInTheDocument()
    expect(screen.getByText('Card content')).toBeInTheDocument()
    expect(screen.getByText('Card footer')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Card className="custom-card">Content</Card>)
    expect(screen.getByText('Content').parentElement).toHaveClass('custom-card')
  })

  it('renders card header with title and description', () => {
    render(
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
    )
    
    expect(screen.getByRole('heading', { name: /title/i })).toBeInTheDocument()
  })

  it('renders card content', () => {
    render(
      <CardContent>
        <p>Content paragraph</p>
      </CardContent>
    )
    
    expect(screen.getByText('Content paragraph')).toBeInTheDocument()
  })
})
```

### Tabs Component

```tsx
// components/ui/tabs.test.tsx
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

describe('Tabs', () => {
  it('renders tabs with triggers and content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByRole('tab', { name: /tab 1/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument()
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
  })

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    await user.click(screen.getByRole('tab', { name: /tab 2/i }))
    
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
  })

  it('supports controlled mode', async () => {
    const user = userEvent.setup()
    
    render(
      <Tabs value="tab1" onValueChange={vi.fn()}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const tab2 = screen.getByRole('tab', { name: /tab 2/i })
    await user.click(tab2)
    
    // In controlled mode, content doesn't change unless value prop changes
    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const tab1 = screen.getByRole('tab', { name: /tab 1/i })
    tab1.focus()
    
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /tab 2/i })).toHaveFocus()
    
    await user.keyboard('{Enter}')
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })
})
```

### Form Components

```tsx
// components/forms/contact-form.test.tsx
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { ContactForm } from './contact-form'

describe('ContactForm', () => {
  it('renders all form fields', () => {
    render(<ContactForm />)
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    
    render(<ContactForm />)
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/message is required/i)).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<ContactForm onSubmit={handleSubmit} />)
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/message/i), 'Hello world')
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello world',
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    
    render(<ContactForm />)
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/message/i), 'Hello world')
    
    // Mock form submission to be async
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    expect(screen.getByText(/submitting/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })
})
```

### Async Components

```tsx
// components/async/data-loader.test.tsx
import { render, screen, waitFor } from '@/test/utils'
import { DataLoader } from './data-loader'

// Mock the API module
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn(),
}))

import { fetchData } from '@/lib/api'

describe('DataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(fetchData).mockImplementation(() => new Promise(() => {}))
    
    render(<DataLoader />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays data when loaded successfully', async () => {
    const mockData = { id: 1, name: 'Test Data' }
    vi.mocked(fetchData).mockResolvedValue(mockData)
    
    render(<DataLoader />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Data')).toBeInTheDocument()
    })
    
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  it('shows error message when load fails', async () => {
    const mockError = new Error('Failed to load data')
    vi.mocked(fetchData).mockRejectedValue(mockError)
    
    render(<DataLoader />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument()
    })
    
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  it('allows retry after error', async () => {
    const mockError = new Error('Failed to load data')
    const mockData = { id: 1, name: 'Test Data' }
    
    vi.mocked(fetchData)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockData)
    
    render(<DataLoader />)
    
    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument()
    })
    
    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i })
    await userEvent.click(retryButton)
    
    // Should show loading then success
    await waitFor(() => {
      expect(screen.getByText('Test Data')).toBeInTheDocument()
    })
  })
})
```

## Tool Component Testing

### JSON Validator

```tsx
// components/tools/json/json-validator.test.tsx
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { JsonValidator } from './json-validator'

describe('JsonValidator', () => {
  it('validates correct JSON', async () => {
    const onValidationChange = vi.fn()
    const validJson = '{"name": "test", "value": 123}'
    
    render(
      <JsonValidator
        input={validJson}
        onValidationChange={onValidationChange}
      />
    )
    
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith({
        isValid: true,
        errors: [],
      })
    })
    
    expect(screen.getByText(/valid json/i)).toBeInTheDocument()
  })

  it('shows errors for invalid JSON', async () => {
    const onValidationChange = vi.fn()
    const invalidJson = '{"name": "test",}'
    
    render(
      <JsonValidator
        input={invalidJson}
        onValidationChange={onValidationChange}
      />
    )
    
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('JSON'),
          }),
        ]),
      })
    })
    
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })

  it('shows statistics', () => {
    const json = '{"line1": 1,\n"line2": 2}'
    
    render(
      <JsonValidator
        input={json}
        onValidationChange={vi.fn()}
      />
    )
    
    expect(screen.getByText(/lines: 2/i)).toBeInTheDocument()
    expect(screen.getByText(/characters: \d+/i)).toBeInTheDocument()
  })

  it('supports manual revalidation', async () => {
    const onValidationChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <JsonValidator
        input='{"test": "data"}'
        onValidationChange={onValidationChange}
      />
    )
    
    const revalidateButton = screen.getByRole('button', { name: /revalidate/i })
    await user.click(revalidateButton)
    
    expect(onValidationChange).toHaveBeenCalled()
  })
})
```

### Code Editor

```tsx
// components/tools/code/code-editor.test.tsx
import { render, screen } from '@/test/utils'
import { CodeEditor } from './code-editor'

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}))

describe('CodeEditor', () => {
  it('renders with initial value', () => {
    render(
      <CodeEditor
        value="console.log('hello');"
        language="javascript"
        onChange={vi.fn()}
        onLanguageChange={vi.fn()}
      />
    )
    
    expect(screen.getByDisplayValue(/console\.log/i)).toBeInTheDocument()
  })

  it('handles value changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <CodeEditor
        value=""
        language="javascript"
        onChange={onChange}
        onLanguageChange={vi.fn()}
      />
    )
    
    await user.type(screen.getByTestId('monaco-editor'), 'new code')
    expect(onChange).toHaveBeenCalledWith('new code')
  })

  it('handles language changes', async () => {
    const onLanguageChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <CodeEditor
        value="some code"
        language="javascript"
        onChange={vi.fn()}
        onLanguageChange={onLanguageChange}
      />
    )
    
    // Mock language selector
    const languageSelector = screen.getByRole('combobox')
    await user.selectOptions(languageSelector, 'python')
    
    expect(onLanguageChange).toHaveBeenCalledWith('python')
  })

  it('applies read-only mode', () => {
    render(
      <CodeEditor
        value="readonly code"
        language="javascript"
        onChange={vi.fn()}
        onLanguageChange={vi.fn()}
        readOnly={true}
      />
    )
    
    expect(screen.getByDisplayValue(/readonly code/i)).toHaveAttribute('readOnly')
  })
})
```

### File Upload

```tsx
// components/file-upload/file-upload-component.test.tsx
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { FileUploadComponent } from './file-upload-component'

// Mock file API
Object.defineProperty(window, 'File', {
  writable: true,
  value: class File {
    constructor(public chunks: BlobPart[], public name: string, public options?: FilePropertyBag) {}
  },
})

describe('FileUploadComponent', () => {
  it('renders drop zone', () => {
    render(<FileUploadComponent />)
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument()
  })

  it('handles file selection', async () => {
    const onFilesChange = vi.fn()
    const user = userEvent.setup()
    
    render(<FileUploadComponent onFilesChange={onFilesChange} />)
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/file input/i) as HTMLInputElement
    
    await user.upload(input, file)
    
    expect(onFilesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'test.txt',
          size: 12,
          type: 'text/plain',
        }),
      ])
    )
  })

  it('validates file size', async () => {
    const onFilesChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <FileUploadComponent
        config={{ maxSize: 10 }} // 10 bytes
        onFilesChange={onFilesChange}
      />
    )
    
    const largeFile = new File(['x'.repeat(100)], 'large.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/file input/i) as HTMLInputElement
    
    await user.upload(input, largeFile)
    
    expect(screen.getByText(/file too large/i)).toBeInTheDocument()
  })

  it('validates file types', async () => {
    const onFilesChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <FileUploadComponent
        config={{ accept: ['.json'] }}
        onFilesChange={onFilesChange}
      />
    )
    
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/file input/i) as HTMLInputElement
    
    await user.upload(input, invalidFile)
    
    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument()
  })

  it('shows upload progress', async () => {
    const user = userEvent.setup()
    
    render(<FileUploadComponent />)
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/file input/i) as HTMLInputElement
    
    await user.upload(input, file)
    
    // Mock upload progress
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
    })
  })
})
```

## Integration Testing

### Component Integration

```tsx
// test/integration/tool-workflow.test.tsx
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { JsonToolPage } from '@/app/tools/json/page'

describe('JSON Tool Workflow', () => {
  it('completes full JSON validation workflow', async () => {
    const user = userEvent.setup()
    
    render(<JsonToolPage />)
    
    // Find JSON input area
    const jsonInput = screen.getByLabelText(/json input/i)
    expect(jsonInput).toBeInTheDocument()
    
    // Enter valid JSON
    await user.type(jsonInput, '{"name": "test", "value": 123}')
    
    // Check validation result
    await waitFor(() => {
      expect(screen.getByText(/valid json/i)).toBeInTheDocument()
    })
    
    // Format the JSON
    const formatButton = screen.getByRole('button', { name: /format/i })
    await user.click(formatButton)
    
    // Check formatted output
    await waitFor(() => {
      expect(screen.getByDisplayText(/{\s+"name": "test",\s+"value": 123\s*}/)).toBeInTheDocument()
    })
  })

  it('handles JSON conversion workflow', async () => {
    const user = userEvent.setup()
    
    render(<JsonToolPage />)
    
    // Switch to converter tab
    const converterTab = screen.getByRole('tab', { name: /converter/i })
    await user.click(converterTab)
    
    // Enter JSON data
    const jsonInput = screen.getByLabelText(/json input/i)
    await user.type(jsonInput, '{"users": [{"name": "John"}, {"name": "Jane"}]}')
    
    // Select XML output format
    const formatSelect = screen.getByLabelText(/output format/i)
    await user.selectOptions(formatSelect, 'xml')
    
    // Convert
    const convertButton = screen.getByRole('button', { name: /convert/i })
    await user.click(convertButton)
    
    // Check XML output
    await waitFor(() => {
      expect(screen.getByDisplayValue(/<users>/)).toBeInTheDocument()
    })
  })
})
```

## Performance Testing

### Component Performance

```tsx
// test/performance/component-performance.test.tsx
import { render, screen } from '@/test/utils'
import { LargeDataList } from '@/components/large-data-list'

describe('Component Performance', () => {
  it('renders large list efficiently', () => {
    const startTime = performance.now()
    
    render(<LargeDataList items={Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }))} />)
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render within reasonable time
    expect(renderTime).toBeLessThan(1000) // 1 second
    
    // Should render all items
    expect(screen.getAllByText(/item \d+/i)).toHaveLength(10000)
  })

  it('handles rapid state changes without memory leaks', () => {
    const { unmount } = render(<Counter />)
    
    // Simulate rapid state changes
    for (let i = 0; i < 1000; i++) {
      const incrementButton = screen.getByRole('button', { name: /increment/i })
      incrementButton.click()
    }
    
    // Should not crash and show correct value
    expect(screen.getByText('1000')).toBeInTheDocument()
    
    // Cleanup
    unmount()
  })
})
```

## Visual Regression Testing

### Component Screenshots

```tsx
// test/visual/button-visual.test.tsx
import { render, screen } from '@/test/utils'
import { Button } from '@/components/ui/button'

describe('Button Visual Tests', () => {
  const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
  const sizes = ['default', 'sm', 'lg', 'icon'] as const

  variants.forEach(variant => {
    sizes.forEach(size => {
      it(`matches snapshot for ${variant} variant and ${size} size`, () => {
        const { container } = render(
          <Button variant={variant} size={size}>
            {size === 'icon' ? '🚀' : 'Button'}
          </Button>
        )
        
        expect(container).toMatchSnapshot()
      })
    })
  })

  it('matches snapshot for disabled state', () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    expect(container).toMatchSnapshot()
  })

  it('matches snapshot for loading state', () => {
    const { container } = render(<Button loading>Loading</Button>)
    expect(container).toMatchSnapshot()
  })
})
```

## Best Practices

### 1. Test Structure

- **Arrange, Act, Assert**: Structure tests clearly
- **Descriptive Names**: Use clear test names that describe behavior
- **Single Responsibility**: Each test should verify one behavior
- **Test Scenarios**: Cover happy path, edge cases, and error conditions

### 2. Component Testing

```tsx
// Good test example
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is accessible', async () => {
    await testAccessibility(<Button>Accessible Button</Button>)
  })
})
```

### 3. Mocking Strategy

- **Mock External Dependencies**: Mock APIs and external modules
- **Use Realistic Data**: Use data that represents real usage
- **Reset Mocks**: Clean up mocks between tests
- **Avoid Over-Mocking**: Only mock what's necessary

### 4. User Interaction Testing

- **Use userEvent**: Prefer userEvent over fireEvent for more realistic interactions
- **Test All Interactions**: Test clicks, keyboard, and form submissions
- **Verify State Changes**: Ensure interactions update component state correctly
- **Test Async Behavior**: Handle promises and loading states properly

### 5. Accessibility Testing

- **Automated Tests**: Use axe-core for automated accessibility testing
- **Keyboard Navigation**: Test all interactive elements with keyboard
- **Screen Reader Support**: Test with screen reader announcements
- **Color Contrast**: Ensure sufficient color contrast

### 6. Performance Testing

- **Render Performance**: Test component render times
- **Large Datasets**: Test with realistic data sizes
- **Memory Leaks**: Check for memory leaks in component lifecycle
- **Bundle Size**: Monitor component impact on bundle size

### 7. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 8. Test Coverage

- **Aim for High Coverage**: Target 80%+ test coverage
- **Focus on Critical Paths**: Prioritize testing important user flows
- **Test Error Cases**: Don't forget to test error conditions
- **Review Coverage Reports**: Regularly review coverage reports for gaps