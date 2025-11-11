import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	isMobileDevice,
	isTabletDevice,
	isDesktopDevice,
	getDeviceType,
	getScreenSize,
	getOrientation,
	isTouchDevice,
	getViewportDimensions,
	getSafeAreaInsets,
	getDevicePixelRatio,
	getUserAgent,
	parseUserAgent,
	detectBrowser,
	detectOS,
	isLandscape,
	isPortrait,
	getBreakpoint,
	applyResponsiveStyles,
	createMediaQuery,
	debounceResize,
	throttleScroll,
	handleTouchGestures,
	optimizeForMobile,
	getMobileOptimizations,
	createMobileLayout,
	adaptForDevice,
	preventZoom,
	handleScrollLock,
	createTouchFriendlyInterface,
	testMobileCompatibility,
	getMobilePerformanceMetrics,
	optimizeImagesForMobile,
	lazyLoadForMobile,
	createMobileNavigation,
	adaptTypographyForMobile,
	createMobileForm,
	handleMobileKeyboard,
	createMobileGestureHandlers,
} from '@/lib/mobile-utils';

describe('mobile-utils', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Setup default window mock
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
		Object.defineProperty(window, 'navigator', {
			writable: true,
			configurable: true,
			value: {
				userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
			},
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe('Device Detection', () => {
		describe('isMobileDevice', () => {
			it('should detect mobile device', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
				});
				expect(isMobileDevice()).toBe(true);
			});

			it('should not detect desktop as mobile', () => {
				expect(isMobileDevice()).toBe(false);
			});

			it('should detect Android device', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F)',
				});
				expect(isMobileDevice()).toBe(true);
			});
		});

		describe('isTabletDevice', () => {
			it('should detect iPad', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)',
				});
				expect(isTabletDevice()).toBe(true);
			});

			it('should detect Android tablet', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (Linux; Android 10; SM-T870)',
				});
				expect(isTabletDevice()).toBe(true);
			});

			it('should not detect phone as tablet', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
				});
				expect(isTabletDevice()).toBe(false);
			});
		});

		describe('isDesktopDevice', () => {
			it('should detect desktop device', () => {
				expect(isDesktopDevice()).toBe(true);
			});

			it('should not detect mobile as desktop', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
				});
				expect(isDesktopDevice()).toBe(false);
			});
		});

		describe('getDeviceType', () => {
			it('should return mobile for phone', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
				});
				expect(getDeviceType()).toBe('mobile');
			});

			it('should return tablet for iPad', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)',
				});
				expect(getDeviceType()).toBe('tablet');
			});

			it('should return desktop for desktop', () => {
				expect(getDeviceType()).toBe('desktop');
			});
		});
	});

	describe('Screen and Viewport', () => {
		describe('getScreenSize', () => {
			it('should return current screen dimensions', () => {
				Object.defineProperty(window, 'innerWidth', { value: 375 });
				Object.defineProperty(window, 'innerHeight', { value: 667 });

				const size = getScreenSize();
				expect(size.width).toBe(375);
				expect(size.height).toBe(667);
			});
		});

		describe('getViewportDimensions', () => {
			it('should return viewport dimensions', () => {
				const dimensions = getViewportDimensions();
				expect(dimensions).toHaveProperty('width');
				expect(dimensions).toHaveProperty('height');
				expect(dimensions.width).toBe(window.innerWidth);
				expect(dimensions.height).toBe(window.innerHeight);
			});
		});

		describe('getOrientation', () => {
			it('should return portrait for portrait orientation', () => {
				Object.defineProperty(window, 'innerWidth', { value: 375 });
				Object.defineProperty(window, 'innerHeight', { value: 667 });
				expect(getOrientation()).toBe('portrait');
			});

			it('should return landscape for landscape orientation', () => {
				Object.defineProperty(window, 'innerWidth', { value: 667 });
				Object.defineProperty(window, 'innerHeight', { value: 375 });
				expect(getOrientation()).toBe('landscape');
			});
		});

		describe('isLandscape', () => {
			it('should return true for landscape orientation', () => {
				Object.defineProperty(window, 'innerWidth', { value: 1024 });
				Object.defineProperty(window, 'innerHeight', { value: 768 });
				expect(isLandscape()).toBe(true);
			});

			it('should return false for portrait orientation', () => {
				Object.defineProperty(window, 'innerWidth', { value: 375 });
				Object.defineProperty(window, 'innerHeight', { value: 667 });
				expect(isLandscape()).toBe(false);
			});
		});

		describe('isPortrait', () => {
			it('should return true for portrait orientation', () => {
				Object.defineProperty(window, 'innerWidth', { value: 375 });
				Object.defineProperty(window, 'innerHeight', { value: 667 });
				expect(isPortrait()).toBe(true);
			});

			it('should return false for landscape orientation', () => {
				Object.defineProperty(window, 'innerWidth', { value: 1024 });
				Object.defineProperty(window, 'innerHeight', { value: 768 });
				expect(isPortrait()).toBe(false);
			});
		});

		describe('getBreakpoint', () => {
			it('should return mobile breakpoint for mobile width', () => {
				Object.defineProperty(window, 'innerWidth', { value: 375 });
				expect(getBreakpoint()).toBe('mobile');
			});

			it('should return tablet breakpoint for tablet width', () => {
				Object.defineProperty(window, 'innerWidth', { value: 768 });
				expect(getBreakpoint()).toBe('tablet');
			});

			it('should return desktop breakpoint for desktop width', () => {
				Object.defineProperty(window, 'innerWidth', { value: 1024 });
				expect(getBreakpoint()).toBe('desktop');
			});
		});
	});

	describe('Touch and Interaction', () => {
		describe('isTouchDevice', () => {
			it('should detect touch device', () => {
				Object.defineProperty(window, 'ontouchstart', {
					value: () => {},
					writable: true,
				});
				expect(isTouchDevice()).toBe(true);
			});

			it('should not detect non-touch device', () => {
				Object.defineProperty(window, 'ontouchstart', {
					value: undefined,
					writable: true,
				});
				expect(isTouchDevice()).toBe(false);
			});
		});

		describe('handleTouchGestures', () => {
			it('should create gesture handlers', () => {
				const element = document.createElement('div');
				const handlers = handleTouchGestures(element, {
					onSwipeLeft: vi.fn(),
					onSwipeRight: vi.fn(),
					onPinch: vi.fn(),
				});

				expect(handlers).toHaveProperty('onTouchStart');
				expect(handlers).toHaveProperty('onTouchMove');
				expect(handlers).toHaveProperty('onTouchEnd');
			});
		});
	});

	describe('User Agent and Browser Detection', () => {
		describe('getUserAgent', () => {
			it('should return user agent string', () => {
				const ua = getUserAgent();
				expect(typeof ua).toBe('string');
				expect(ua.length).toBeGreaterThan(0);
			});
		});

		describe('parseUserAgent', () => {
			it('should parse user agent components', () => {
				const parsed = parseUserAgent();
				expect(parsed).toHaveProperty('browser');
				expect(parsed).toHaveProperty('os');
				expect(parsed).toHaveProperty('device');
			});

			it('should parse mobile user agent', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
				});
				const parsed = parseUserAgent();
				expect(parsed.device.type).toBe('mobile');
				expect(parsed.os.name).toBe('iOS');
			});
		});

		describe('detectBrowser', () => {
			it('should detect Chrome', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				});
				expect(detectBrowser()).toBe('Chrome');
			});

			it('should detect Safari', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
				});
				expect(detectBrowser()).toBe('Safari');
			});
		});

		describe('detectOS', () => {
			it('should detect iOS', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
				});
				expect(detectOS()).toBe('iOS');
			});

			it('should detect Android', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F)',
				});
				expect(detectOS()).toBe('Android');
			});

			it('should detect Windows', () => {
				Object.defineProperty(window.navigator, 'userAgent', {
					value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
				});
				expect(detectOS()).toBe('Windows');
			});
		});
	});

	describe('Responsive Utilities', () => {
		describe('applyResponsiveStyles', () => {
			it('should apply mobile styles for mobile device', () => {
				const styles = applyResponsiveStyles({
					mobile: { fontSize: '14px' },
					tablet: { fontSize: '16px' },
					desktop: { fontSize: '18px' },
				});

				expect(styles).toHaveProperty('fontSize');
			});
		});

		describe('createMediaQuery', () => {
			it('should create media query string', () => {
				const query = createMediaQuery('mobile');
				expect(query).toContain('max-width');
			});

			it('should create custom media query', () => {
				const query = createMediaQuery('(max-width: 768px)');
				expect(query).toBe('(max-width: 768px)');
			});
		});
	});

	describe('Performance and Optimization', () => {
		describe('debounceResize', () => {
			it('should debounce resize events', () => {
				const mockFn = vi.fn();
				const debouncedFn = debounceResize(mockFn, 100);

				// Call multiple times
				for (let i = 0; i < 5; i++) {
					debouncedFn();
				}

				expect(mockFn).not.toHaveBeenCalled();
				vi.advanceTimersByTime(100);
				expect(mockFn).toHaveBeenCalledTimes(1);
			});
		});

		describe('throttleScroll', () => {
			it('should throttle scroll events', () => {
				const mockFn = vi.fn();
				const throttledFn = throttleScroll(mockFn, 100);

				// Call multiple times
				for (let i = 0; i < 5; i++) {
					throttledFn();
				}

				expect(mockFn).toHaveBeenCalledTimes(1);
			});
		});

		describe('optimizeForMobile', () => {
			it('should return mobile optimizations', () => {
				const optimizations = optimizeForMobile();
				expect(optimizations).toHaveProperty('imageOptimization');
				expect(optimizations).toHaveProperty('lazyLoading');
				expect(optimizations).toHaveProperty('touchOptimization');
			});
		});

		describe('getMobilePerformanceMetrics', () => {
			it('should return performance metrics', () => {
				const metrics = getMobilePerformanceMetrics();
				expect(metrics).toHaveProperty('deviceMemory');
				expect(metrics).toHaveProperty('connectionType');
				expect(metrics).toHaveProperty('renderTime');
			});
		});
	});

	describe('Layout and UI Components', () => {
		describe('createMobileLayout', () => {
			it('should create mobile layout configuration', () => {
				const layout = createMobileLayout({
					enableSwipeGestures: true,
					enableBottomNavigation: true,
					enablePullToRefresh: false,
				});

				expect(layout).toHaveProperty('navigation');
				expect(layout).toHaveProperty('gestures');
				expect(layout.gestures.swipe).toBe(true);
			});
		});

		describe('createMobileNavigation', () => {
			it('should create mobile navigation config', () => {
				const nav = createMobileNavigation({
					type: 'bottom',
					items: ['Home', 'Tools', 'Settings'],
					enableHamburger: true,
				});

				expect(nav.type).toBe('bottom');
				expect(nav.items).toHaveLength(3);
				expect(nav.enableHamburger).toBe(true);
			});
		});

		describe('adaptTypographyForMobile', () => {
			it('should adapt typography for mobile', () => {
				const typography = adaptTypographyForMobile({
					baseFontSize: '16px',
					lineHeight: 1.5,
					scale: 1.2,
				});

				expect(typography).toHaveProperty('mobile');
				expect(typography).toHaveProperty('tablet');
				expect(typography).toHaveProperty('desktop');
			});
		});

		describe('createMobileForm', () => {
			it('should create mobile-optimized form', () => {
				const form = createMobileForm({
					enableAutoFocus: false,
					enableInputMode: true,
					enableValidation: true,
				});

				expect(form).toHaveProperty('inputProps');
				expect(form).toHaveProperty('validation');
				expect(form.inputProps.autoFocus).toBe(false);
			});
		});
	});

	describe('Advanced Features', () => {
		describe('getSafeAreaInsets', () => {
			it('should return safe area insets', () => {
				const insets = getSafeAreaInsets();
				expect(insets).toHaveProperty('top');
				expect(insets).toHaveProperty('right');
				expect(insets).toHaveProperty('bottom');
				expect(insets).toHaveProperty('left');
			});
		});

		describe('getDevicePixelRatio', () => {
			it('should return device pixel ratio', () => {
				const ratio = getDevicePixelRatio();
				expect(typeof ratio).toBe('number');
				expect(ratio).toBeGreaterThan(0);
			});
		});

		describe('preventZoom', () => {
			it('should prevent zoom on input focus', () => {
				const input = document.createElement('input');
				const cleanup = preventZoom(input);

				expect(typeof cleanup).toBe('function');
				cleanup();
			});
		});

		describe('handleScrollLock', () => {
			it('should lock and unlock scroll', () => {
				const lock = handleScrollLock();

				// Lock scroll
				const unlock = lock();
				expect(typeof unlock).toBe('function');

				// Unlock scroll
				unlock();
			});
		});

		describe('testMobileCompatibility', () => {
			it('should test mobile compatibility', () => {
				const results = testMobileCompatibility();
				expect(results).toHaveProperty('touchSupport');
				expect(results).toHaveProperty('orientationSupport');
				expect(results).toHaveProperty('viewportSupport');
				expect(results).toHaveProperty('overallScore');
			});
		});
	});

	describe('Error Handling and Edge Cases', () => {
		it('should handle missing window object', () => {
			const originalWindow = global.window;
			delete (global as any).window;

			expect(() => getScreenSize()).not.toThrow();
			expect(() => getDeviceType()).not.toThrow();
			expect(() => isMobileDevice()).not.toThrow();

			global.window = originalWindow;
		});

		it('should handle invalid user agent', () => {
			Object.defineProperty(window.navigator, 'userAgent', {
				value: '',
			});

			expect(() => parseUserAgent()).not.toThrow();
			expect(() => detectBrowser()).not.toThrow();
			expect(() => detectOS()).not.toThrow();
		});

		it('should handle zero dimensions', () => {
			Object.defineProperty(window, 'innerWidth', { value: 0 });
			Object.defineProperty(window, 'innerHeight', { value: 0 });

			const size = getScreenSize();
			expect(size.width).toBe(0);
			expect(size.height).toBe(0);
		});
	});

	describe('Integration Tests', () => {
		it('should handle complete mobile detection workflow', () => {
			// Set mobile user agent
			Object.defineProperty(window.navigator, 'userAgent', {
				value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
			});
			Object.defineProperty(window, 'innerWidth', { value: 375 });
			Object.defineProperty(window, 'innerHeight', { value: 667 });
			Object.defineProperty(window, 'ontouchstart', { value: () => {} });

			// Test device detection
			expect(isMobileDevice()).toBe(true);
			expect(isTabletDevice()).toBe(false);
			expect(isDesktopDevice()).toBe(false);
			expect(getDeviceType()).toBe('mobile');

			// Test screen detection
			expect(isPortrait()).toBe(true);
			expect(isLandscape()).toBe(false);
			expect(getBreakpoint()).toBe('mobile');

			// Test touch detection
			expect(isTouchDevice()).toBe(true);

			// Test browser/OS detection
			const parsed = parseUserAgent();
			expect(parsed.device.type).toBe('mobile');
			expect(detectOS()).toBe('iOS');
		});

		it('should handle responsive adaptation', () => {
			const config = {
				mobile: { columns: 1, fontSize: '14px' },
				tablet: { columns: 2, fontSize: '16px' },
				desktop: { columns: 3, fontSize: '18px' },
			};

			// Test mobile adaptation
			Object.defineProperty(window, 'innerWidth', { value: 375 });
			const mobileConfig = adaptForDevice(config);
			expect(mobileConfig.columns).toBe(1);
			expect(mobileConfig.fontSize).toBe('14px');

			// Test desktop adaptation
			Object.defineProperty(window, 'innerWidth', { value: 1024 });
			const desktopConfig = adaptForDevice(config);
			expect(desktopConfig.columns).toBe(3);
			expect(desktopConfig.fontSize).toBe('18px');
		});
	});
});
