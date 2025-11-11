import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import { setupMocks } from './mocks';
import { mockData } from './test-data';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
	// Add any additional options here
}

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	return <>{children}</>;
};

// Custom render function
export const customRender = (
	ui: React.ReactElement,
	options: CustomRenderOptions = {}
): RenderResult => {
	// Setup mocks before rendering
	setupMocks();

	return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Helper functions for common testing patterns

// Wait for a specific condition
export const waitForCondition = async (
	condition: () => boolean,
	timeout: number = 5000,
	interval: number = 100
): Promise<void> => {
	const startTime = Date.now();
	while (Date.now() - startTime < timeout) {
		if (condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}
	throw new Error(`Condition not met within ${timeout}ms`);
};

// Mock user interactions
export const mockUserInteraction = {
	// Simulate typing with delays
	typeText: async (element: HTMLElement, text: string, delay: number = 50) => {
		element.focus();
		for (const char of text) {
			element.dispatchEvent(
				new KeyboardEvent('keydown', { key: char, bubbles: true })
			);
			element.dispatchEvent(
				new InputEvent('input', { data: char, bubbles: true })
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	},

	// Simulate keyboard navigation
	navigateWithKeyboard: async (
		element: HTMLElement,
		keys: string[],
		delay: number = 100
	) => {
		element.focus();
		for (const key of keys) {
			element.dispatchEvent(
				new KeyboardEvent('keydown', { key, bubbles: true })
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	},

	// Simulate mouse hover
	hover: async (element: HTMLElement) => {
		element.dispatchEvent(
			new MouseEvent('mouseenter', { bubbles: true, relatedTarget: document.body })
		);
		await new Promise((resolve) => setTimeout(resolve, 50));
	},

	// Simulate mouse leave
	unhover: async (element: HTMLElement) => {
		element.dispatchEvent(
			new MouseEvent('mouseleave', { bubbles: true, relatedTarget: document.body })
		);
		await new Promise((resolve) => setTimeout(resolve, 50));
	},
};

// Helper functions for assertions

// Assert element has specific text content
export const assertTextContent = (
	element: HTMLElement,
	expectedText: string,
	exact: boolean = false
) => {
	if (exact) {
		expect(element.textContent).toBe(expectedText);
	} else {
		expect(element.textContent).toContain(expectedText);
	}
};

// Assert element has specific attributes
export const assertAttributes = (
	element: HTMLElement,
	attributes: Record<string, string>
) => {
	Object.entries(attributes).forEach(([attr, value]) => {
		expect(element.getAttribute(attr)).toBe(value);
	});
};

// Assert element has specific CSS classes
export const assertClasses = (
	element: HTMLElement,
	expectedClasses: string[],
	mode: 'all' | 'any' = 'all'
) => {
	const elementClasses = Array.from(element.classList);

	if (mode === 'all') {
		expectedClasses.forEach((cls) => {
			expect(elementClasses).toContain(cls);
		});
	} else {
		const hasAnyClass = expectedClasses.some((cls) => elementClasses.includes(cls));
		expect(hasAnyClass).toBe(true);
	}
};

// Assert element is visible
export const assertVisible = (element: HTMLElement) => {
	expect(element).toBeInTheDocument();
	expect(element).toBeVisible();
};

// Assert element is hidden
export const assertHidden = (element: HTMLElement) => {
	expect(element).toBeInTheDocument();
	expect(element).not.toBeVisible();
};

// Assert element does not exist
export const assertNotExists = (element: HTMLElement | null) => {
	expect(element).not.toBeInTheDocument();
};

// Accessibility helpers

// Assert accessibility attributes
export const assertAccessibility = (element: HTMLElement, attributes: {
	role?: string;
	'aria-label'?: string;
	'aria-labelledby'?: string;
	'aria-describedby'?: string;
	'aria-expanded'?: string;
	'aria-selected'?: string;
	tabIndex?: number;
}) => {
	Object.entries(attributes).forEach(([attr, value]) => {
		expect(element.getAttribute(attr)).toBe(value);
	});
};

// Assert keyboard navigation
export const assertKeyboardNavigation = (container: HTMLElement) => {
	const focusableElements = container.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);

	// Ensure there are focusable elements
	expect(focusableElements.length).toBeGreaterThan(0);

	// Test tab navigation
	const firstElement = focusableElements[0] as HTMLElement;
	firstElement.focus();
	expect(document.activeElement).toBe(firstElement);
};

// Performance helpers

// Measure render performance
export const measureRenderPerformance = async (
	renderFn: () => RenderResult,
	iterations: number = 10
) => {
	const times: number[] = [];

	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		renderFn().unmount();
		const end = performance.now();
		times.push(end - start);
	}

	const average = times.reduce((sum, time) => sum + time, 0) / times.length;
	const min = Math.min(...times);
	const max = Math.max(...times);

	return { average, min, max, times };
};

// Memory leak detection
export const detectMemoryLeaks = async (
	operation: () => void | Promise<void>,
	iterations: number = 100
) => {
	const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

	for (let i = 0; i < iterations; i++) {
		await operation();

		// Force garbage collection if available
		if ((global as any).gc) {
			(global as any).gc();
		}
	}

	const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
	const memoryIncrease = finalMemory - initialMemory;

	return {
		initialMemory,
		finalMemory,
		memoryIncrease,
		isLeak: memoryIncrease > 1024 * 1024, // 1MB threshold
	};
};

// Responsive testing helpers

// Mock different screen sizes
export const mockScreenSize = (width: number, height: number = 800) => {
	Object.defineProperty(window, 'innerWidth', {
		writable: true,
		configurable: true,
		value: width,
	});

	Object.defineProperty(window, 'innerHeight', {
		writable: true,
		configurable: true,
		value: height,
	});

	// Trigger resize event
	window.dispatchEvent(new Event('resize'));
};

// Test mobile view
export const testMobileView = async (component: React.ReactElement) => {
	mockScreenSize(375); // iPhone width
	const { container } = customRender(component);

	// Assert mobile-specific elements are present
	const mobileElements = container.querySelectorAll('[data-mobile]');
	expect(mobileElements.length).toBeGreaterThan(0);

	return { container };
};

// Test desktop view
export const testDesktopView = async (component: React.ReactElement) => {
	mockScreenSize(1024); // Desktop width
	const { container } = customRender(component);

	// Assert desktop-specific elements are present
	const desktopElements = container.querySelectorAll('[data-desktop]');
	expect(desktopElements.length).toBeGreaterThan(0);

	return { container };
};

// Search testing helpers

// Test search functionality
export const testSearchFunctionality = async (
	searchComponent: React.ReactElement,
	query: string,
	expectedResults: number
) => {
	const { getByPlaceholderText, queryAllByRole } = customRender(searchComponent);

	const searchInput = getByPlaceholderText(/search/i);
	await mockUserInteraction.typeText(searchInput, query);

	// Wait for debounced search
	await new Promise((resolve) => setTimeout(resolve, 350));

	const results = queryAllByRole('listitem');
	expect(results.length).toBe(expectedResults);
};

// Test filter functionality
export const testFilterFunctionality = async (
	filterComponent: React.ReactElement,
	filterValues: Record<string, string[]>,
	expectedResults: number
) => {
	const { container, queryAllByRole } = customRender(filterComponent);

	// Apply filters
	for (const [filterName, values] of Object.entries(filterValues)) {
		for (const value of values) {
			const filterOption = container.querySelector(
				`[data-filter="${filterName}"][data-value="${value}"]`
			);
			if (filterOption) {
				filterOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			}
		}
	}

	// Wait for filter application
	await new Promise((resolve) => setTimeout(resolve, 100));

	const results = queryAllByRole('listitem');
	expect(results.length).toBe(expectedResults);
};

// Export mock data for easy access
export { mockData };

// Export common test patterns
export const testPatterns = {
	render: customRender,
	interaction: mockUserInteraction,
	assertion: {
		text: assertTextContent,
		attributes: assertAttributes,
		classes: assertClasses,
		visible: assertVisible,
		hidden: assertHidden,
		notExists: assertNotExists,
	},
	accessibility: {
		attributes: assertAccessibility,
		keyboard: assertKeyboardNavigation,
	},
	performance: {
		render: measureRenderPerformance,
		memory: detectMemoryLeaks,
	},
	responsive: {
		mobile: testMobileView,
		desktop: testDesktopView,
		screenSize: mockScreenSize,
	},
	search: testSearchFunctionality,
	filter: testFilterFunctionality,
};
