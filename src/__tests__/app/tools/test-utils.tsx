import type { Tool, ToolCategory, ToolDifficulty, ProcessingType, SecurityType } from '@/types/tools';

// Mock tools data for testing
export const mockTools: Tool[] = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, beautify, and validate JSON data with customizable indentation and sorting options',
    category: 'JSON Processing',
    icon: 'FileJson',
    features: ['Format & Beautify', 'Syntax Validation', 'Custom Indentation', 'Key Sorting', 'Error Detection'],
    tags: ['json', 'formatter', 'validator', 'beautifier'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/formatter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-validator',
    name: 'JSON Validator',
    description: 'Comprehensive JSON validation with detailed error messages and schema support',
    category: 'JSON Processing',
    icon: 'FileJson',
    features: ['Syntax Validation', 'Schema Validation', 'Detailed Errors', 'Real-time Validation'],
    tags: ['json', 'validator', 'schema', 'error-detection'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/validator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'code-executor',
    name: 'Code Executor',
    description: 'Execute JavaScript, Python, and other programming languages in a secure sandbox',
    category: 'Code Execution',
    icon: 'Code',
    features: ['Multi-language Support', 'Live Execution', 'Syntax Highlighting', 'Error Handling'],
    tags: ['code', 'javascript', 'python', 'executor', 'sandbox'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/code/executor',
    isPopular: true,
    processingType: 'hybrid',
    security: 'secure-sandbox',
  },
  {
    id: 'file-converter',
    name: 'File Converter',
    description: 'Convert between different file formats including images, documents, and data files',
    category: 'File Processing',
    icon: 'FileConverter',
    features: ['Multiple Formats', 'Batch Conversion', 'Custom Mapping', 'Preview Mode'],
    tags: ['file', 'converter', 'batch', 'image', 'document'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/file/converter',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate various hash types including MD5, SHA-1, SHA-256, and more',
    category: 'Security & Encryption',
    icon: 'Hash',
    features: ['Multiple Hash Types', 'File Hashing', 'Text Hashing', 'Comparison Tool'],
    tags: ['hash', 'security', 'encryption', 'md5', 'sha256'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data/hash-generator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'base64-converter',
    name: 'Base64 Converter',
    description: 'Encode and decode Base64 strings and files',
    category: 'Text Processing',
    icon: 'TextFormat',
    features: ['Text Encoding', 'File Encoding', 'Batch Processing', 'Validation'],
    tags: ['base64', 'encoding', 'text', 'file', 'converter'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/utilities/base64-converter',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'http-client',
    name: 'HTTP Client',
    description: 'Test REST APIs with customizable headers, body, and authentication',
    category: 'Network Utilities',
    icon: 'Cloud',
    features: ['REST API Testing', 'Custom Headers', 'Authentication', 'Response Analysis'],
    tags: ['http', 'api', 'rest', 'testing', 'network'],
    difficulty: 'advanced',
    status: 'stable',
    href: '/tools/network/http-client',
    isNew: true,
    processingType: 'hybrid',
    security: 'network-required',
  },
];

// Mock categories for testing
export const mockCategories = [
  {
    id: 'json-processing',
    name: 'JSON Processing',
    description: 'JSON validation, conversion, and manipulation tools',
    icon: 'CATEGORY_JSON',
    color: 'green',
    count: 11,
    trending: true,
    new: false,
    featured: true,
  },
  {
    id: 'code-execution',
    name: 'Code Execution',
    description: 'Code execution, formatting, and analysis tools',
    icon: 'CATEGORY_CODE',
    color: 'blue',
    count: 8,
    trending: true,
    new: false,
    featured: true,
  },
  {
    id: 'file-processing',
    name: 'File Processing',
    description: 'File conversion, compression, and media processing tools',
    icon: 'CATEGORY_FILE',
    color: 'orange',
    count: 8,
    trending: true,
    new: true,
    featured: true,
  },
  {
    id: 'network-utilities',
    name: 'Network Utilities',
    description: 'Network testing, IP analysis, and connectivity tools',
    icon: 'CATEGORY_NETWORK',
    color: 'cyan',
    count: 6,
    trending: true,
    new: true,
    featured: true,
  },
];

// Mock search suggestions
export const mockSearchSuggestions = [
  {
    id: 'tool-json-formatter',
    text: 'JSON Formatter',
    type: 'tool' as const,
    icon: 'FileJson',
    description: 'Format, beautify, and validate JSON data',
    score: 95,
  },
  {
    id: 'category-json-processing',
    text: 'JSON Processing',
    type: 'category' as const,
    icon: 'CATEGORY_JSON',
    description: 'JSON validation, conversion, and manipulation tools',
    score: 88,
  },
  {
    id: 'tag-json',
    text: 'json',
    type: 'tag' as const,
    icon: 'TAG',
    description: 'Filter by json tag',
    score: 75,
  },
];

// Mock localStorage
export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

// Mock resize observer for responsive tests
export const createMockResizeObserver = () => {
  const observers = new Set<{
    callback: ResizeObserverCallback;
    elements: Set<Element>;
  }>();

  return {
    observe: vi.fn((element: Element, options?: ResizeObserverOptions) => {
      // Find the observer that should handle this element
      observers.forEach(observer => {
        observer.elements.add(element);
        // Simulate an immediate resize call
        observer.callback([], observer);
      });
    }),
    unobserve: vi.fn((element: Element) => {
      observers.forEach(observer => {
        observer.elements.delete(element);
      });
    }),
    disconnect: vi.fn(() => {
      observers.forEach(observer => {
        observer.elements.clear();
      });
      observers.clear();
    }),
    // Helper to trigger resize for tests
    triggerResize: vi.fn((entries: ResizeObserverEntry[] = []) => {
      observers.forEach(observer => {
        observer.callback(entries, observer);
      });
    }),
  };
};

// Mock intersection observer for visibility tests
export const createMockIntersectionObserver = () => {
  const observers = new Set<{
    callback: IntersectionObserverCallback;
    elements: Set<Element>;
  }>();

  return {
    observe: vi.fn((element: Element) => {
      observers.forEach(observer => {
        observer.elements.add(element);
        // Simulate element being visible immediately
        observer.callback(
          [
            {
              target: element,
              isIntersecting: true,
              intersectionRatio: 1,
              boundingClientRect: element.getBoundingClientRect(),
              intersectionRect: element.getBoundingClientRect(),
              rootBounds: null,
              time: Date.now(),
            },
          ],
          observer as any
        );
      });
    }),
    unobserve: vi.fn((element: Element) => {
      observers.forEach(observer => {
        observer.elements.delete(element);
      });
    }),
    disconnect: vi.fn(() => {
      observers.forEach(observer => {
        observer.elements.clear();
      });
      observers.clear();
    }),
    // Helper to trigger intersection changes for tests
    triggerIntersection: vi.fn((isIntersecting: boolean = true) => {
      observers.forEach(observer => {
        observer.callback(
          Array.from(observer.elements).map(element => ({
            target: element,
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
            boundingClientRect: element.getBoundingClientRect(),
            intersectionRect: isIntersecting ? element.getBoundingClientRect() : {
              bottom: 0,
              height: 0,
              left: 0,
              right: 0,
              top: 0,
              width: 0,
              x: 0,
              y: 0,
              toJSON: vi.fn(),
            },
            rootBounds: null,
            time: Date.now(),
          })),
          observer as any
        );
      });
    }),
  };
};

// Wait for debounced functions
export const waitForDebounce = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to test async state changes
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock user interactions helpers
export const mockUserEvent = {
  type: async (element: HTMLElement, text: string) => {
    element.focus();
    for (const char of text) {
      element.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
      element.dispatchEvent(new KeyboardEvent('input', { inputType: 'insertText', data: char }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      await flushPromises();
    }
  },
  click: async (element: HTMLElement) => {
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
  },
  hover: async (element: HTMLElement) => {
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await flushPromises();
  },
  unhover: async (element: HTMLElement) => {
    element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    await flushPromises();
  },
};

// Mock environment variables
export const mockEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

// Mock analytics tracking
export const mockAnalytics = {
  track: vi.fn(),
  page: vi.fn(),
  identify: vi.fn(),
};

// Mock error boundary
export const mockErrorBoundary = {
  componentDidCatch: vi.fn(),
  resetErrorBoundary: vi.fn(),
};
