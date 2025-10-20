import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js useRouter
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  }
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) =>
    <div data-testid="chevron-down" className={className} />,
  ChevronRight: ({ className }: { className?: string }) =>
    <div data-testid="chevron-right" className={className} />,
  Copy: ({ className }: { className?: string }) =>
    <div data-testid="copy-icon" className={className} />,
  Download: ({ className }: { className?: string }) =>
    <div data-testid="download-icon" className={className} />,
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
})

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock crypto.randomUUID if not available
if (!global.crypto?.randomUUID) {
  Object.defineProperty(global, 'crypto', {
    value: {
      ...global.crypto,
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    },
  })
}
