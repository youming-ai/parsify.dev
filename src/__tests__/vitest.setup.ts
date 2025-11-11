import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test setup
global.describe = describe;
global.it = it;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.vi = vi;

// Mock Next.js router
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	usePathname: () => '/tools',
}));

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
	__esModule: true,
	default: (fn: () => Promise<any>) => {
		const Component = fn();
		Component.preload = vi.fn();
		return Component;
	},
}));

// Mock environment variables
process.env.NODE_ENV = 'test';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
	constructor() {}
	observe() {}
	unobserve() {}
	disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
	constructor() {}
	observe() {}
	unobserve() {}
	disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
	writable: true,
	value: vi.fn(),
});

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
	writable: true,
	value: vi.fn(() => ({
		getPropertyValue: vi.fn(() => ''),
	})),
});

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
const sessionStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	length: 0,
	key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
	value: sessionStorageMock,
});

// Mock crypto
Object.defineProperty(global, 'crypto', {
	value: {
		getRandomValues: vi.fn((arr: Uint8Array) => {
			for (let i = 0; i < arr.length; i++) {
				arr[i] = Math.floor(Math.random() * 256);
			}
			return arr;
		}),
		subtle: {
			digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
			encrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
			decrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
			sign: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
			verify: vi.fn(() => Promise.resolve(true)),
			importKey: vi.fn(() => Promise.resolve({})),
			exportKey: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
			generateKey: vi.fn(() => Promise.resolve({})),
			deriveKey: vi.fn(() => Promise.resolve({})),
			deriveBits: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
			wrapKey: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
			unwrapKey: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
		},
		randomUUID: vi.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		})),
	},
});

// Mock fetch
global.fetch = vi.fn() as any;

// Mock URL and URLSearchParams
global.URL = class URL {
	constructor(public href: string, base?: string) {}
	toString() { return this.href; }
	toJSON() { return this.href; }
	origin = ''
	protocol = ''
	username = ''
	password = ''
	host = ''
	hostname = ''
	port = ''
	pathname = ''
	search = ''
	searchParams = new URLSearchParams()
	hash = ''
};

global.URLSearchParams = class URLSearchParams {
	constructor(init?: string | URLSearchParams | Record<string, string> | string[][] | null) {}
	append() {}
	delete() {}
	get() { return null; }
	getAll() { return []; }
	has() { return false; }
	set() {}
	sort() {}
	toString() { return ''; }
	entries() { return []; }
	keys() { return []; }
	values() { return []; }
	forEach() {}
};

// Mock Blob
global.Blob = class Blob {
	constructor(data?: any[], options?: BlobPropertyBag) {}
	size = 0
	type = ''
	text() { return Promise.resolve(''); }
	arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
	slice() { return new Blob(); }
	stream() { return new ReadableStream(); }
};

// Mock File
global.File = class File extends Blob {
	constructor(data: any[], filename: string, options?: FilePropertyBag) {
		super(data, options);
		this.name = filename;
	}
	name = ''
	lastModified = Date.now()
};

// Mock FormData
global.FormData = class FormData {
	append() {}
	delete() {}
	get() { return null; }
	getAll() { return []; }
	has() { return false; }
	set() {}
	entries() { return []; }
	keys() { return []; }
	values() { return []; }
	forEach() {}
};

// Mock DOMParser
global.DOMParser = class DOMParser {
	parseFromString() {
		return {
			documentElement: {},
		};
	}
};

// Mock performance API
Object.defineProperty(global, 'performance', {
	value: {
		now: vi.fn(() => Date.now()),
		timing: {
			navigationStart: Date.now(),
		},
		memory: {
			usedJSHeapSize: 1024 * 1024,
			totalJSHeapSize: 2048 * 1024,
			jsHeapSizeLimit: 4096 * 1024,
		},
	},
});

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
Object.defineProperty(console, 'log', {
	value: vi.fn(),
	writable: true,
});
Object.defineProperty(console, 'warn', {
	value: vi.fn(),
	writable: true,
});
Object.defineProperty(console, 'error', {
	value: vi.fn(),
	writable: true,
});

// Test cleanup
afterEach(() => {
	vi.clearAllMocks();
	localStorageMock.getItem.mockClear();
	localStorageMock.setItem.mockClear();
	localStorageMock.removeItem.mockClear();
	localStorageMock.clear.mockClear();
});

// Global test utilities
global.testUtils = {
	// Helper to create mock events
	createEvent: (type: string, properties: any = {}) => {
		const event = new Event(type, { bubbles: true, cancelable: true });
		Object.assign(event, properties);
		return event;
	},

	// Helper to create mock keyboard events
	createKeyboardEvent: (type: string, key: string, properties: any = {}) => {
		return new KeyboardEvent(type, { key, bubbles: true, ...properties });
	},

	// Helper to create mock mouse events
	createMouseEvent: (type: string, properties: any = {}) => {
		return new MouseEvent(type, { bubbles: true, cancelable: true, ...properties });
	},

	// Helper to wait for next tick
	waitForTick: () => new Promise(resolve => setTimeout(resolve, 0)),

	// Helper to mock async operations
	mockAsync: (value: any, delay: number = 0) =>
		new Promise(resolve => setTimeout(() => resolve(value), delay)),

	// Helper to mock timers
	mockTimers: () => {
		vi.useFakeTimers();
		return {
			restore: () => vi.useRealTimers(),
			advance: (ms: number) => vi.advanceTimersByTime(ms),
		};
	},
};

// Type declarations for global test utilities
declare global {
	var testUtils: {
		createEvent: (type: string, properties?: any) => Event;
		createKeyboardEvent: (type: string, key: string, properties?: any) => KeyboardEvent;
		createMouseEvent: (type: string, properties?: any) => MouseEvent;
		waitForTick: () => Promise<void>;
		mockAsync: <T>(value: T, delay?: number) => Promise<T>;
		mockTimers: () => { restore: () => void; advance: (ms: number) => void };
	};
}
