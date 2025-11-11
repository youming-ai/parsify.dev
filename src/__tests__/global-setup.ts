import { setup, teardown } from 'vitest/fixtures';
import { beforeAll, afterAll } from 'vitest';

/**
 * Global test setup for comprehensive testing suite
 * Configures test environment, mocks, and shared utilities
 */

// Global test configuration
global.__TEST_CONFIG__ = {
  timeouts: {
    default: 5000,
    network: 10000,
    rendering: 3000,
  },
  retry: {
    default: 2,
    flaky: 3,
  },
};

// Mock browser APIs that aren't available in jsdom
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
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock fetch for network tests
global.fetch = vi.fn();

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock File and Blob APIs
global.File = class File {
  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + (chunk.length || 0), 0);
    this.type = options.type || '';
    this.lastModified = Date.now();
  }

  name: string;
  size: number;
  type: string;
  lastModified: number;

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }

  text() {
    return Promise.resolve('');
  }

  slice() {
    return new File([], this.name);
  }

  stream() {
    return new ReadableStream();
  }
};

global.Blob = class Blob {
  constructor(chunks: any[] = [], options: any = {}) {
    this.size = chunks.reduce((acc, chunk) => acc + (chunk.length || 0), 0);
    this.type = options.type || '';
  }

  size: number;
  type: string;

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }

  text() {
    return Promise.resolve('');
  }

  slice() {
    return new Blob();
  }

  stream() {
    return new ReadableStream();
  }
};

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor() {
    this.readyState = WebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.({} as Event);
    }, 100);
  }

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number;
  onopen?: ((event: Event) => void) | null;
  onclose?: ((event: CloseEvent) => void) | null;
  onmessage?: ((event: MessageEvent) => void) | null;
  onerror?: ((event: Event) => void) | null;

  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

// Mock RequestIdleCallback
Object.defineProperty(window, 'requestIdleCallback', {
  writable: true,
  value: vi.fn((callback) => {
    const idleDeadline = {
      didTimeout: false,
      timeRemaining: () => 50,
    };
    setTimeout(() => callback(idleDeadline), 1);
  }),
});

// Mock Performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    ...performance,
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Test utilities
export function setupTestEnvironment() {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();

  // Reset fetch
  (global.fetch as any).mockClear();

  // Reset timers
  vi.useFakeTimers();

  // Reset DOM
  document.body.innerHTML = '';

  // Set up default viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
}

export function cleanupTestEnvironment() {
  // Restore real timers
  vi.useRealTimers();

  // Clear DOM
  document.body.innerHTML = '';

  // Clear all mocks
  vi.clearAllMocks();
}

// Global setup function
export async function setup() {
  console.log('🚀 Setting up test environment...');

  // Set up test environment
  setupTestEnvironment();

  // Log test configuration
  console.log('📋 Test configuration:', {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    ci: process.env.CI || false,
    testTimeout: global.__TEST_CONFIG__.timeouts,
  });

  return setup;
}

// Global teardown function
export async function teardown() {
  console.log('🧹 Cleaning up test environment...');

  // Cleanup test environment
  cleanupTestEnvironment();

  // Clear global state
  delete (global as any).__TEST_CONFIG__;

  return teardown;
}

// Export for use in tests
export { setupTestEnvironment as default, cleanupTestEnvironment };
