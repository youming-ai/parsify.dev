import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Mock IntersectionObserver for component tests
global.IntersectionObserver = class IntersectionObserver implements IntersectionObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	unobserve() {}
	root = null;
	rootMargin = '';
	thresholds = [];
	takeRecords() {
		return [];
	}
} as any;

// Mock ResizeObserver for component tests
global.ResizeObserver = class ResizeObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => {},
	}),
});

// Mock fetch API if needed
beforeAll(() => {
	// Global test setup
});

afterEach(() => {
	// Clean up after each test
});

afterAll(() => {
	// Global cleanup
});
