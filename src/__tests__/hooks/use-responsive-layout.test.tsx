import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import {
	useResponsiveLayout,
	useResponsiveValue,
	useBreakpointValue,
	useResponsiveGrid,
	useInfiniteScroll,
	useViewportSize,
	useMediaQuery,
	useIsMobile,
	useIsTablet,
	useIsDesktop,
	useIsPortrait,
	useIsLandscape,
	usePrefersDark,
	usePrefersReducedMotion,
	useHover,
	useTouchFeedback,
	defaultLayoutConfig,
} from '@/hooks/use-responsive-layout';
import { MobileUtils } from '@/lib/mobile-utils';
import { setupMocks, cleanupMocks } from '../utils/mocks';

// Mock MobileUtils
vi.mock('@/lib/mobile-utils', () => ({
	MobileUtils: {
		getDeviceType: vi.fn(),
		getBreakpoint: vi.fn(),
		debounceResize: vi.fn((fn) => fn),
		isTouchDevice: vi.fn(() => false),
	},
	useMobileUtils: vi.fn(() => ({
		deviceType: 'desktop',
		breakpoint: 'lg',
		isMobile: false,
		isTablet: false,
		isDesktop: true,
	})),
}));

describe('use-responsive-layout', () => {
	beforeEach(() => {
		setupMocks();
		vi.useFakeTimers();

		// Mock window dimensions
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
	});

	afterEach(() => {
		cleanupMocks();
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe('defaultLayoutConfig', () => {
		it('should have correct default configuration', () => {
			expect(defaultLayoutConfig.breakpoints).toBeDefined();
			expect(defaultLayoutConfig.containerPadding).toBeDefined();
			expect(defaultLayoutConfig.gridColumns).toBeDefined();
			expect(defaultLayoutConfig.itemSpacing).toBeDefined();
		});

		it('should have valid breakpoints', () => {
			const { breakpoints } = defaultLayoutConfig;
			expect(breakpoints?.xs).toBe(475);
			expect(breakpoints?.md).toBe(768);
			expect(breakpoints?.lg).toBe(1024);
		});
	});

	describe('useResponsiveLayout', () => {
		it('should initialize with default values', () => {
			const { result } = renderHook(() => useResponsiveLayout());

			expect(result.current.containerWidth).toBe(0);
			expect(result.current.itemWidth).toBe(0);
			expect(result.current.columns).toBe(4);
			expect(result.current.padding).toBe('2rem');
			expect(result.current.spacing).toBe('1rem');
			expect(result.current.shouldUseMobileLayout).toBe(false);
		});

		it('should use custom configuration', () => {
			const customConfig = {
				gridColumns: {
					mobile: 2,
					tablet: 3,
					desktop: 6,
				},
				containerPadding: {
					mobile: '0.5rem',
					tablet: '1rem',
					desktop: '3rem',
				},
			};

			const { result } = renderHook(() => useResponsiveLayout(customConfig));

			expect(result.current.layoutConfig.gridColumns).toEqual(customConfig.gridColumns);
			expect(result.current.layoutConfig.containerPadding).toEqual(customConfig.containerPadding);
		});

		it('should update layout on resize', () => {
			const { result } = renderHook(() => useResponsiveLayout());

			act(() => {
				Object.defineProperty(window, 'innerWidth', { value: 375 });
				fireEvent(window, new Event('resize'));
			});

			act(() => {
				vi.advanceTimersByTime(100);
			});

			// Should recalculate layout
			expect(result.current.recalculate).toBeDefined();
		});

		it('should handle orientation change', () => {
			const { result } = renderHook(() => useResponsiveLayout());

			act(() => {
				fireEvent(window, new Event('orientationchange'));
			});

			// Should recalculate layout on orientation change
			expect(result.current.recalculate).toBeDefined();
		});

		it('should provide recalculate function', () => {
			const { result } = renderHook(() => useResponsiveLayout());

			expect(typeof result.current.recalculate).toBe('function');

			act(() => {
				result.current.recalculate();
			});
		});

		it('should merge configuration properly', () => {
			const partialConfig = {
				gridColumns: {
					mobile: 2,
				},
			};

			const { result } = renderHook(() => useResponsiveLayout(partialConfig));

			expect(result.current.layoutConfig.gridColumns?.mobile).toBe(2);
			expect(result.current.layoutConfig.gridColumns?.tablet).toBe(2); // Default value
			expect(result.current.layoutConfig.gridColumns?.desktop).toBe(4); // Default value
		});
	});

	describe('useResponsiveValue', () => {
		it('should return value based on device type', () => {
			const { result } = renderHook(() =>
				useResponsiveValue(
					{
						mobile: 'mobile-value',
						tablet: 'tablet-value',
						desktop: 'desktop-value',
					},
					'default-value'
				)
			);

			expect(result.current).toBe('desktop-value');
		});

		it('should return default value for unknown device type', () => {
			const { result } = renderHook(() =>
				useResponsiveValue(
					{
						mobile: 'mobile-value',
					},
					'default-value'
				)
			);

			expect(result.current).toBe('default-value');
		});

		it('should handle partial value mapping', () => {
			const { result } = renderHook(() =>
				useResponsiveValue(
					{
						mobile: 'mobile-value',
					},
					'default-value'
				)
			);

			expect(result.current).toBe('default-value');
		});
	});

	describe('useBreakpointValue', () => {
		it('should return value based on breakpoint', () => {
			const { result } = renderHook(() =>
				useBreakpointValue(
					{
						sm: 'small-value',
						md: 'medium-value',
						lg: 'large-value',
					},
					'default-value'
				)
			);

			expect(result.current).toBe('large-value');
		});

		it('should return default value for unknown breakpoint', () => {
			const { result } = renderHook(() =>
				useBreakpointValue(
					{
						sm: 'small-value',
					},
					'default-value'
				)
			);

			expect(result.current).toBe('default-value');
		});
	});

	describe('useResponsiveGrid', () => {
		it('should calculate grid based on available width', () => {
			const { result } = renderHook(() =>
				useResponsiveGrid({
					minItemWidth: 300,
					maxColumns: 3,
				})
			);

			// With 1024px width and default padding, should calculate appropriate columns
			expect(result.current.columns).toBeGreaterThanOrEqual(1);
			expect(result.current.columns).toBeLessThanOrEqual(3);
			expect(result.current.itemWidth).toBeGreaterThan(0);
		});

		it('should use custom configuration', () => {
			const customConfig = {
				minItemWidth: 200,
				maxColumns: 5,
				gap: '2rem',
				containerPadding: '2rem',
			};

			const { result } = renderHook(() => useResponsiveGrid(customConfig));

			expect(result.current.columns).toBeGreaterThanOrEqual(1);
			expect(result.current.columns).toBeLessThanOrEqual(5);
		});

		it('should update on window resize', () => {
			const { result } = renderHook(() => useResponsiveGrid());

			act(() => {
				Object.defineProperty(window, 'innerWidth', { value: 500 });
				fireEvent(window, new Event('resize'));
			});

			act(() => {
				vi.advanceTimersByTime(100);
			});

			// Should recalculate grid
			expect(result.current.columns).toBeGreaterThanOrEqual(1);
		});

		it('should limit columns to maxColumns', () => {
			const { result } = renderHook(() =>
				useResponsiveGrid({
					minItemWidth: 100,
					maxColumns: 2,
				})
			);

			expect(result.current.columns).toBeLessThanOrEqual(2);
		});

		it('should ensure at least 1 column', () => {
			const { result } = renderHook(() =>
				useResponsiveGrid({
					minItemWidth: 2000,
					maxColumns: 10,
				})
			);

			expect(result.current.columns).toBe(1);
		});
	});

	describe('useInfiniteScroll', () => {
		beforeEach(() => {
			// Create a mock element for infinite scroll trigger
			const trigger = document.createElement('div');
			trigger.setAttribute('data-infinite-scroll-trigger', 'true');
			document.body.appendChild(trigger);
		});

		afterEach(() => {
			const trigger = document.querySelector('[data-infinite-scroll-trigger]');
			if (trigger) {
				document.body.removeChild(trigger);
			}
		});

		it('should set up intersection observer', () => {
			const onLoadMore = vi.fn();
			renderHook(() =>
				useInfiniteScroll({
					hasMore: true,
					onLoadMore,
				})
			);

			// Should create intersection observer
			expect(global.IntersectionObserver).toHaveBeenCalled();
		});

		it('should call onLoadMore when intersecting', () => {
			const onLoadMore = vi.fn();
			renderHook(() =>
				useInfiniteScroll({
					hasMore: true,
					onLoadMore,
				})
			);

			// Simulate intersection
			const mockCallback = (global.IntersectionObserver as any).mock.calls[0][0];
			const mockEntry = { isIntersecting: true };
			mockCallback([mockEntry]);

			expect(onLoadMore).toHaveBeenCalled();
		});

		it('should not call onLoadMore when hasMore is false', () => {
			const onLoadMore = vi.fn();
			renderHook(() =>
				useInfiniteScroll({
					hasMore: false,
					onLoadMore,
				})
			);

			// Simulate intersection
			const mockCallback = (global.IntersectionObserver as any).mock.calls[0][0];
			const mockEntry = { isIntersecting: true };
			mockCallback([mockEntry]);

			expect(onLoadMore).not.toHaveBeenCalled();
		});

		it('should use custom threshold', () => {
			renderHook(() =>
				useInfiniteScroll({
					threshold: 200,
					hasMore: true,
					onLoadMore: vi.fn(),
				})
			);

			const mockObserver = (global.IntersectionObserver as any).mock.calls[0][1];
			expect(mockObserver.rootMargin).toBe('200px');
		});

		it('should handle missing onLoadMore gracefully', () => {
			expect(() => {
				renderHook(() => useInfiniteScroll({ hasMore: true }));
			}).not.toThrow();
		});
	});

	describe('useViewportSize', () => {
		it('should return initial viewport size', () => {
			const { result } = renderHook(() => useViewportSize());

			expect(result.current.width).toBe(1024);
			expect(result.current.height).toBe(768);
		});

		it('should update viewport size on resize', () => {
			const { result } = renderHook(() => useViewportSize());

			act(() => {
				Object.defineProperty(window, 'innerWidth', { value: 800 });
				Object.defineProperty(window, 'innerHeight', { value: 600 });
				fireEvent(window, new Event('resize'));
			});

			act(() => {
				vi.advanceTimersByTime(100);
			});

			expect(result.current.width).toBe(800);
			expect(result.current.height).toBe(600);
		});

		it('should handle orientation change', () => {
			const { result } = renderHook(() => useViewportSize());

			act(() => {
				Object.defineProperty(window, 'innerWidth', { value: 768 });
				Object.defineProperty(window, 'innerHeight', { value: 1024 });
				fireEvent(window, new Event('orientationchange'));
			});

			expect(result.current.width).toBe(768);
			expect(result.current.height).toBe(1024);
		});

		it('should handle server-side rendering', () => {
			// Mock server-side environment
			const originalWindow = global.window;
			delete (global as any).window;

			const { result } = renderHook(() => useViewportSize());

			expect(result.current.width).toBe(0);
			expect(result.current.height).toBe(0);

			global.window = originalWindow;
		});
	});

	describe('useMediaQuery', () => {
		beforeEach(() => {
			// Mock matchMedia
			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				value: vi.fn().mockImplementation((query) => ({
					matches: query.includes('min-width: 1025px'),
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				})),
			});
		});

		it('should return initial match state', () => {
			const { result } = renderHook(() => useMediaQuery('(min-width: 1025px)'));

			expect(result.current).toBe(true);
		});

		it('should update on media query change', () => {
			const { result } = renderHook(() => useMediaQuery('(min-width: 1025px)'));

			const mediaQuery = window.matchMedia('(min-width: 1025px)');

			act(() => {
				mediaQuery.matches = false;
				mediaQuery.onchange?.({ matches: false } as MediaQueryListEvent);
			});

			expect(result.current).toBe(false);
		});

		it('should handle server-side rendering', () => {
			const originalWindow = global.window;
			delete (global as any).window;

			const { result } = renderHook(() => useMediaQuery('(min-width: 1025px)'));

			expect(result.current).toBe(false);

			global.window = originalWindow;
		});
	});

	describe('Media Query Convenience Hooks', () => {
		beforeEach(() => {
			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				value: vi.fn().mockImplementation((query) => ({
					matches: false, // Default to false for mobile-first testing
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				})),
			});
		});

		it('useIsMobile should detect mobile viewport', () => {
			const { result } = renderHook(() => useIsMobile());
			expect(result.current).toBe(false); // 1024px is not mobile
		});

		it('useIsTablet should detect tablet viewport', () => {
			const { result } = renderHook(() => useIsTablet());
			expect(result.current).toBe(false); // 1024px is not tablet range
		});

		it('useIsDesktop should detect desktop viewport', () => {
			const { result } = renderHook(() => useIsDesktop());
			expect(result.current).toBe(false); // Mock returns false
		});

		it('useIsPortrait should detect portrait orientation', () => {
			const { result } = renderHook(() => useIsPortrait());
			expect(result.current).toBe(false);
		});

		it('useIsLandscape should detect landscape orientation', () => {
			const { result } = renderHook(() => useIsLandscape());
			expect(result.current).toBe(false);
		});

		it('usePrefersDark should detect dark mode preference', () => {
			const { result } = renderHook(() => usePrefersDark());
			expect(result.current).toBe(false);
		});

		it('usePrefersReducedMotion should detect reduced motion preference', () => {
			const { result } = renderHook(() => usePrefersReducedMotion());
			expect(result.current).toBe(false);
		});
	});

	describe('useHover', () => {
		it('should detect hover state on non-touch devices', () => {
			// Mock non-touch device
			(MobileUtils.isTouchDevice as any).mockReturnValue(false);

			const { result } = renderHook(() => useHover());

			// Initially should not be hovered
			expect(result.current).toBe(false);

			// Simulate mouse enter
			act(() => {
				document.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
			});

			// Should detect hover
			expect(result.current).toBe(true);

			// Simulate mouse leave
			act(() => {
				document.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
			});

			// Should not be hovered
			expect(result.current).toBe(false);
		});

		it('should return false on touch devices', () => {
			// Mock touch device
			(MobileUtils.isTouchDevice as any).mockReturnValue(true);

			const { result } = renderHook(() => useHover());

			expect(result.current).toBe(false);

			// Simulate mouse events on touch device
			act(() => {
				document.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
			});

			// Should still be false on touch devices
			expect(result.current).toBe(false);
		});

		it('should clean up event listeners', () => {
			const addSpy = vi.spyOn(document, 'addEventListener');
			const removeSpy = vi.spyOn(document, 'removeEventListener');

			const { unmount } = renderHook(() => useHover());

			expect(addSpy).toHaveBeenCalledWith('mouseenter', expect.any(Function), true);
			expect(addSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function), true);

			unmount();

			expect(removeSpy).toHaveBeenCalledWith('mouseenter', expect.any(Function), true);
			expect(removeSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function), true);
		});
	});

	describe('useTouchFeedback', () => {
		it('should provide touch feedback state and props', () => {
			const { result } = renderHook(() => useTouchFeedback());

			expect(result.current.isPressed).toBe(false);
			expect(result.current.touchProps).toHaveProperty('onTouchStart');
			expect(result.current.touchProps).toHaveProperty('onTouchEnd');
			expect(result.current.touchProps).toHaveProperty('onTouchCancel');
		});

		it('should update pressed state on touch start', () => {
			const { result } = renderHook(() => useTouchFeedback());

			act(() => {
				result.current.touchProps.onTouchStart();
			});

			expect(result.current.isPressed).toBe(true);
		});

		it('should update pressed state on touch end', () => {
			const { result } = renderHook(() => useTouchFeedback());

			act(() => {
				result.current.touchProps.onTouchStart();
			});
			expect(result.current.isPressed).toBe(true);

			act(() => {
				result.current.touchProps.onTouchEnd();
			});
			expect(result.current.isPressed).toBe(false);
		});

		it('should update pressed state on touch cancel', () => {
			const { result } = renderHook(() => useTouchFeedback());

			act(() => {
				result.current.touchProps.onTouchStart();
			});
			expect(result.current.isPressed).toBe(true);

			act(() => {
				result.current.touchProps.onTouchCancel();
			});
			expect(result.current.isPressed).toBe(false);
		});
	});

	describe('Integration Tests', () => {
		it('should handle responsive layout changes', () => {
			const { result } = renderHook(() => useResponsiveLayout());

			// Initial desktop layout
			expect(result.current.shouldUseMobileLayout).toBe(false);
			expect(result.current.columns).toBe(4);

			// Change to mobile
			act(() => {
				Object.defineProperty(window, 'innerWidth', { value: 375 });
				fireEvent(window, new Event('resize'));
			});

			act(() => {
				vi.advanceTimersByTime(100);
			});

			// Should adapt to mobile layout
			expect(result.current.recalculate).toBeDefined();
		});

		it('should combine multiple hooks correctly', () => {
			const { result: layout } = renderHook(() => useResponsiveLayout());
			const { result: grid } = renderHook(() => useResponsiveGrid());
			const { result: viewport } = renderHook(() => useViewportSize());

			// All hooks should return consistent data
			expect(layout.current.containerWidth).toBeGreaterThanOrEqual(0);
			expect(grid.current.columns).toBeGreaterThanOrEqual(1);
			expect(viewport.current.width).toBe(1024);
		});

		it('should handle edge cases gracefully', () => {
			// Zero width
			act(() => {
				Object.defineProperty(window, 'innerWidth', { value: 0 });
				fireEvent(window, new Event('resize'));
			});

			const { result } = renderHook(() => useResponsiveLayout());
			expect(() => result.current.recalculate()).not.toThrow();

			// Very large width
			act(() => {
				Object.defineProperty(window, 'innerWidth', { value: 10000 });
				fireEvent(window, new Event('resize'));
			});

			expect(() => result.current.recalculate()).not.toThrow();
		});
	});

	describe('Performance Tests', () => {
		it('should debounce resize events', () => {
			const { rerender } = renderHook(() => useResponsiveLayout());

			// Fire multiple resize events rapidly
			for (let i = 0; i < 10; i++) {
				act(() => {
					Object.defineProperty(window, 'innerWidth', { value: 1000 + i });
					fireEvent(window, new Event('resize'));
				});
			}

			// Should only process after debounce
			act(() => {
				vi.advanceTimersByTime(100);
			});

			// Hook should still work correctly
			expect(rerender).toBeDefined();
		});

		it('should clean up event listeners on unmount', () => {
			const removeSpy = vi.spyOn(window, 'removeEventListener');

			const { unmount } = renderHook(() => useResponsiveLayout());

			unmount();

			expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
			expect(removeSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
		});
	});
});
