import { vi } from 'vitest';
import type { Tool, SearchState } from '@/types/tools';

// Mock Next.js router
export const mockNextRouter = {
	push: vi.fn(),
	replace: vi.fn(),
	back: vi.fn(),
	forward: vi.fn(),
	refresh: vi.fn(),
	prefetch: vi.fn(),
	beforePopState: vi.fn(),
	events: {
		on: vi.fn(),
		off: vi.fn(),
		emit: vi.fn(),
	},
	isFallback: false,
	isLocaleDomain: true,
	isReady: true,
	isPreview: false,
	pathname: '/tools',
	query: {},
	asPath: '/tools',
	basePath: '',
	locale: 'en',
	locales: ['en'],
	defaultLocale: 'en',
	isDomainLocale: false,
};

// Mock window object
export const mockWindow = {
	...global.window,
	innerWidth: 1024,
	innerHeight: 768,
	scrollX: 0,
	scrollY: 0,
	pageXOffset: 0,
	pageYOffset: 0,
	screen: {
		width: 1920,
		height: 1080,
		availWidth: 1920,
		availHeight: 1040,
		colorDepth: 24,
		pixelDepth: 24,
		orientation: {
			type: 'landscape-primary',
			angle: 0,
		},
	},
	navigator: {
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
		language: 'en-US',
		languages: ['en-US', 'en'],
		platform: 'MacIntel',
		cookieEnabled: true,
		onLine: true,
		vibrate: vi.fn(),
		getGamepads: vi.fn(() => []),
		getStorageUpdates: vi.fn(),
		getUserMedia: vi.fn(),
		locks: {
			request: vi.fn(),
			query: vi.fn(),
		},
		scheduling: {
			isInputPending: vi.fn(() => false),
			postTask: vi.fn(),
		},
		permissions: {
			query: vi.fn(),
		},
		clipboard: {
			writeText: vi.fn(),
			readText: vi.fn(() => Promise.resolve('')),
		},
	},
	document: {
		...global.document,
		hidden: false,
		visibilityState: 'visible',
		readyState: 'complete',
		activeElement: null,
		body: {
			...global.document?.body,
			scrollIntoView: vi.fn(),
			getBoundingClientRect: vi.fn(() => ({
				top: 0,
				left: 0,
				bottom: 0,
				right: 0,
				width: 1024,
				height: 768,
				x: 0,
				y: 0,
			})),
		},
		documentElement: {
			scrollHeight: 1000,
			scrollWidth: 1024,
			clientHeight: 768,
			clientWidth: 1024,
		},
	},
	localStorage: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
		length: 0,
		key: vi.fn(),
	},
	sessionStorage: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
		length: 0,
		key: vi.fn(),
	},
};

// Mock IntersectionObserver
export const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
	observe: vi.fn((element) => {
		callback([
			{
				target: element,
				isIntersecting: true,
				intersectionRatio: 1,
				boundingClientRect: {
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					width: 0,
					height: 0,
					x: 0,
					y: 0,
				},
				intersectionRect: {
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					width: 0,
					height: 0,
					x: 0,
					y: 0,
				},
				rootBounds: null,
				time: Date.now(),
			},
		]);
	}),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
	root: null,
	rootMargin: '',
	thresholds: [],
}));

// Mock ResizeObserver
export const mockResizeObserver = vi.fn().mockImplementation((callback) => ({
	observe: vi.fn((element) => {
		callback([
			{
				target: element,
				contentRect: {
					x: 0,
					y: 0,
					width: 1024,
					height: 768,
					top: 0,
					left: 0,
					bottom: 768,
					right: 1024,
				},
				borderBoxSize: [{ blockSize: 768, inlineSize: 1024 }],
				contentBoxSize: [{ blockSize: 768, inlineSize: 1024 }],
				devicePixelContentBoxSize: [{ blockSize: 768, inlineSize: 1024 }],
			},
		]);
	}),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock MediaQueryList
export const mockMediaQueryList = {
	matches: false,
	media: '(max-width: 768px)',
	onchange: null,
	addListener: vi.fn(),
	removeListener: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn(),
};

// Mock matchMedia
export const mockMatchMedia = vi.fn().mockImplementation((query) => ({
	...mockMediaQueryList,
	media: query,
	matches: query.includes('max-width'),
}));

// Mock crypto API
export const mockCrypto = {
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
		unwrapKey: vi.fn(() => Promise.resolve({})),
	},
	randomUUID: vi.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	})),
};

// Mock fetch API
export const mockFetch = vi.fn().mockImplementation(() =>
	Promise.resolve({
		ok: true,
		status: 200,
		statusText: 'OK',
		headers: new Headers(),
		json: () => Promise.resolve({}),
		text: () => Promise.resolve(''),
		blob: () => Promise.resolve(new Blob()),
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
		formData: () => Promise.resolve(new FormData()),
		clone: vi.fn(),
		bodyUsed: false,
		body: null,
		redirected: false,
		type: 'basic',
		url: 'https://example.com',
	})
);

// Mock File and Blob
export const mockFile = {
	name: 'test.json',
	size: 1024,
	type: 'application/json',
	lastModified: Date.now(),
	text: () => Promise.resolve('{"test": "data"}'),
	arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
	slice: vi.fn(),
	stream: () => new ReadableStream(),
};

export const mockBlob = {
	size: 1024,
	type: 'application/json',
	text: () => Promise.resolve('{"test": "data"}'),
	arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
	slice: vi.fn(),
	stream: () => new ReadableStream(),
};

// Mock FormData
export const mockFormData = {
	append: vi.fn(),
	delete: vi.fn(),
	get: vi.fn(),
	getAll: vi.fn(),
	has: vi.fn(),
	set: vi.fn(),
	entries: vi.fn(() => []),
	keys: vi.fn(() => []),
	values: vi.fn(() => []),
	forEach: vi.fn(),
};

// Mock URL and URLSearchParams
export const mockURL = {
	href: 'https://example.com/path?query=value',
	origin: 'https://example.com',
	protocol: 'https:',
	username: '',
	password: '',
	host: 'example.com',
	hostname: 'example.com',
	port: '',
	pathname: '/path',
	search: '?query=value',
	searchParams: new URLSearchParams('query=value'),
	hash: '',
	toJSON: vi.fn(() => 'https://example.com/path?query=value'),
	toString: vi.fn(() => 'https://example.com/path?query=value'),
};

// Mock performance API
export const mockPerformance = {
	now: vi.fn(() => Date.now()),
	timing: {
		navigationStart: Date.now(),
		unloadEventStart: 0,
		unloadEventEnd: 0,
		redirectStart: 0,
		redirectEnd: 0,
		fetchStart: Date.now(),
		domainLookupStart: Date.now(),
		domainLookupEnd: Date.now(),
		connectStart: Date.now(),
		connectEnd: Date.now(),
		secureConnectionStart: Date.now(),
		requestStart: Date.now(),
		responseStart: Date.now(),
		responseEnd: Date.now(),
		domLoading: Date.now(),
		domInteractive: Date.now(),
		domContentLoadedEventStart: Date.now(),
		domContentLoadedEventEnd: Date.now(),
		domComplete: Date.now(),
		loadEventStart: 0,
		loadEventEnd: 0,
	},
	navigation: {
		type: 0,
		redirectCount: 0,
	},
	memory: {
		usedJSHeapSize: 1024 * 1024,
		totalJSHeapSize: 2048 * 1024,
		jsHeapSizeLimit: 4096 * 1024,
	},
	mark: vi.fn(),
	measure: vi.fn(),
	clearMarks: vi.fn(),
	clearMeasures: vi.fn(),
	getEntries: vi.fn(() => []),
	getEntriesByName: vi.fn(() => []),
	getEntriesByType: vi.fn(() => []),
};

// Mock console methods to avoid noise in tests
export const mockConsole = {
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	info: vi.fn(),
	debug: vi.fn(),
	trace: vi.fn(),
	group: vi.fn(),
	groupCollapsed: vi.fn(),
	groupEnd: vi.fn(),
	table: vi.fn(),
	count: vi.fn(),
	countReset: vi.fn(),
	time: vi.fn(),
	timeLog: vi.fn(),
	timeEnd: vi.fn(),
	dir: vi.fn(),
	dirxml: vi.fn(),
	assert: vi.fn(),
	clear: vi.fn(),
	profile: vi.fn(),
	profileEnd: vi.fn(),
	context: vi.fn(() => ({})),
	createTask: vi.fn(() => ({ run: vi.fn() })),
};

// Mock React hooks testing utilities
export const createMockHook = <T>(initialValue: T) => {
	let value = initialValue;
	const setValue = vi.fn((newValue) => {
		value = typeof newValue === 'function' ? newValue(value) : newValue;
		return value;
	});

	return [value, setValue];
};

// Mock debounced function
export const createMockDebouncedFunction = <T extends (...args: any[]) => any>(
	fn: T,
	delay: number = 300
) => {
	let timeoutId: NodeJS.Timeout;
	const mockFn = vi.fn(fn);

	const debounced = (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => mockFn(...args), delay);
	};

	debounced.cancel = () => clearTimeout(timeoutId);
	debounced.flush = () => {
		clearTimeout(timeoutId);
		mockFn();
	};
	debounced.pending = () => timeoutId !== null;

	return debounced;
};

// Mock scroll behavior
export const mockScrollIntoView = vi.fn();

// Mock focus and blur events
export const mockFocus = vi.fn();
export const mockBlur = vi.fn();

// Mock click events
export const mockClick = vi.fn();

// Setup function to apply all mocks
export const setupMocks = () => {
	vi.stubGlobal('window', mockWindow);
	vi.stubGlobal('document', mockWindow.document);
	vi.stubGlobal('navigator', mockWindow.navigator);
	vi.stubGlobal('localStorage', mockWindow.localStorage);
	vi.stubGlobal('sessionStorage', mockWindow.sessionStorage);
	vi.stubGlobal('crypto', mockCrypto);
	vi.stubGlobal('fetch', mockFetch);
	vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
	vi.stubGlobal('ResizeObserver', mockResizeObserver);
	vi.stubGlobal('matchMedia', mockMatchMedia);
	vi.stubGlobal('File', mockFile);
	vi.stubGlobal('Blob', mockBlob);
	vi.stubGlobal('FormData', mockFormData);
	vi.stubGlobal('URL', mockURL);
	vi.stubGlobal('performance', mockPerformance);
	vi.stubGlobal('console', mockConsole);

	// Mock Element.prototype methods
	Element.prototype.scrollIntoView = mockScrollIntoView;
	Element.prototype.focus = mockFocus;
	Element.prototype.blur = mockBlur;
};

// Cleanup function to restore all mocks
export const cleanupMocks = () => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
};
