import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Mock WebAssembly APIs for WASM runtime testing
beforeAll(() => {
  // Mock WebAssembly for testing
  global.WebAssembly = {
    instantiate: vi.fn(),
    instantiateStreaming: vi.fn(),
    compile: vi.fn(),
    validate: vi.fn(),
  } as any;

  // Mock crypto APIs for security tools
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: {
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        sign: vi.fn(),
        verify: vi.fn(),
        digest: vi.fn(),
        generateKey: vi.fn(),
        deriveKey: vi.fn(),
        importKey: vi.fn(),
        exportKey: vi.fn(),
      },
      getRandomValues: vi.fn((arr) => arr.map(() => Math.floor(Math.random() * 256))),
    },
    writable: true,
  });

  // Mock performance APIs for performance monitoring
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
    },
    writable: true,
  });

  // Mock localStorage for testing
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

  // Mock IndexedDB for testing
  const indexedDBMock = {
    open: vi.fn(() => ({
      onsuccess: vi.fn(),
      onerror: vi.fn(),
      onupgradeneeded: vi.fn(),
    })),
    deleteDatabase: vi.fn(),
    databases: vi.fn(() => Promise.resolve([])),
  };
  Object.defineProperty(window, 'indexedDB', {
    value: indexedDBMock,
  });

  // Mock Canvas APIs for image processing tools
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4).fill(0) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4).fill(0) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }));

  // Mock FileReader for file upload testing
  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    addEventListener: vi.fn(),
    result: null,
    error: null,
    readyState: 0,
  })) as any;

  // Mock URL.createObjectURL
  Object.defineProperty(global, 'URL', {
    value: {
      createObjectURL: vi.fn(() => 'mock-url'),
      revokeObjectURL: vi.fn(),
    },
    writable: true,
  });
});

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset localStorage
  localStorage.clear();
});

// Clean up after all tests
afterAll(() => {
  // Reset any global state
  vi.resetAllMocks();
});
