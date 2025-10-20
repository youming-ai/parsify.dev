import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement, ReactNode } from 'react'
import { AuthProvider } from '@/web/components/auth/auth-context'
import { BrowserRouter } from 'react-router-dom'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from Testing Library
export * from '@testing-library/react'
export { customRender as renderWithProviders }

// Mock data generators for testing
export const createMockJsonData = () => ({
  name: 'Test Application',
  version: '1.0.0',
  settings: {
    theme: 'dark',
    autoSave: true,
    features: ['search', 'export', 'import']
  },
  users: [
    { id: 1, name: 'Alice', active: true, email: 'alice@example.com' },
    { id: 2, name: 'Bob', active: false, email: 'bob@example.com' }
  ]
})

export const createMockUser = () => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  provider: 'google' as const,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString()
})

export const createMockFile = () => ({
  id: 'file-123',
  name: 'test-file.json',
  size: 1024,
  type: 'application/json',
  content: '{"test": true}',
  uploadedAt: new Date().toISOString(),
  userId: 'user-123'
})

export const createMockCodeExecution = () => ({
  id: 'exec-123',
  code: 'console.log("Hello, World!");',
  language: 'javascript',
  output: 'Hello, World!',
  status: 'success' as const,
  executionTime: 150,
  createdAt: new Date().toISOString()
})

// Mock API responses
export const mockApiSuccess = <T>(data: T) => ({
  data,
  status: 200,
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

export const mockApiError = (message: string, status = 400) => ({
  data: { error: message },
  status,
  ok: false,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message }),
})

// Test utilities
export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0))

export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  ...overrides
})

export const createMockDragEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  dataTransfer: {
    files: [],
    items: [],
    types: [],
    setData: vi.fn(),
    getData: vi.fn(),
    clearData: vi.fn(),
  },
  ...overrides
})
