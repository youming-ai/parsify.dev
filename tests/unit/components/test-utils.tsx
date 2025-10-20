import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Test wrapper with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Export renderHook for testing hooks
export { renderHook } from '@testing-library/react'

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  ...overrides,
})

export const createMockFile = (overrides = {}) => ({
  id: 'test-file-1',
  name: 'test.json',
  size: 1024,
  type: 'application/json',
  content: '{"test": true}',
  uploadedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockJob = (overrides = {}) => ({
  id: 'test-job-1',
  status: 'completed',
  result: { success: true },
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  ...overrides,
})

// Common test data
export const SAMPLE_JSON = {
  name: 'Application',
  version: '1.0.0',
  settings: {
    theme: 'dark',
    autoSave: true,
    features: ['search', 'export', 'import'],
  },
  users: [
    { id: 1, name: 'Alice', active: true },
    { id: 2, name: 'Bob', active: false },
  ],
}

export const SAMPLE_CODE = `function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome, \${name}\`;
}

greet('World');`
