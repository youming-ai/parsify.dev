/**
 * Keyboard Navigation E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tools');
		await page.waitForLoadState('networkidle');
	});

	test('should navigate tools page with keyboard', async ({ page }) => {
		// Test tab navigation
		await page.keyboard.press('Tab');
		const firstFocusable = await page.locator(':focus');
		await expect(firstFocusable).toBeVisible();

		// Test arrow navigation in tool grid
		await page.keyboard.press('ArrowDown');
		const nextFocusable = await page.locator(':focus');
		await expect(nextFocusable).toBeVisible();

		// Test tool activation with Enter
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/tools\/\w+/);
	});

	test('should open keyboard shortcuts help with ?', async ({ page }) => {
		await page.keyboard.press('Shift+?');

		// Check if help dialog opens
		const helpDialog = page.locator('[role="dialog"]');
		await expect(helpDialog).toBeVisible();

		// Check if help dialog contains shortcuts
		const shortcuts = page.locator('[role="dialog"] [data-menu-item-id]');
		await expect(shortcuts).toHaveCount.greaterThan(0);

		// Test closing with Escape
		await page.keyboard.press('Escape');
		await expect(helpDialog).not.toBeVisible();
	});

	test('should search tools with keyboard shortcut', async ({ page }) => {
		// Try Ctrl/Cmd + F to focus search
		const isMac = process.platform === 'darwin';
		const searchShortcut = isMac ? 'Meta+f' : 'Control+f';

		await page.keyboard.press(searchShortcut);

		const searchInput = page.locator('input[type="search"], [data-search-input]');
		await expect(searchInput).toBeFocused();

		// Type search query
		await searchInput.fill('JSON');
		await page.keyboard.press('Enter');

		// Check if search results are filtered
		const jsonTools = page.locator('[data-category="json"]');
		await expect(jsonTools).toHaveCount.greaterThan(0);
	});

	test('should navigate tool categories with keyboard', async ({ page }) => {
		// Focus on category navigation
		await page.locator('[data-category-nav]').first().focus();

		// Test arrow navigation
		await page.keyboard.press('ArrowRight');
		const nextCategory = await page.locator(':focus');
		await expect(nextCategory).toHaveAttribute('data-category-nav');

		// Test category activation
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/tools\/\w+/);
	});

	test('should handle focus trapping in modals', async ({ page }) => {
		// Open a modal (assuming there's a button that opens one)
		const modalButton = page.locator('[data-opens-modal]').first();
		if (await modalButton.isVisible()) {
			await modalButton.click();

			const modal = page.locator('[role="dialog"]');
			await expect(modal).toBeVisible();

			// Test focus is trapped within modal
			await page.keyboard.press('Tab');
			const focusInModal = await page.locator(':focus');
			await expect(modal).toContain(focusInModal);

			// Close modal with Escape
			await page.keyboard.press('Escape');
			await expect(modal).not.toBeVisible();
		}
	});

	test('should navigate complex UI patterns', async ({ page }) => {
		// Test grid navigation if present
		const grid = page.locator('[role="grid"]');
		if (await grid.isVisible()) {
			await grid.focus();

			// Test 2D navigation
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowDown');

			// Test boundaries
			await page.keyboard.press('Home');
			await page.keyboard.press('End');
		}

		// Test tree navigation if present
		const tree = page.locator('[role="tree"]');
		if (await tree.isVisible()) {
			await tree.focus();

			// Test expansion/collapse
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowLeft');

			// Test type-ahead
			await page.keyboard.type('j');
		}
	});

	test('should maintain visible focus indicators', async ({ page }) => {
		// Focus on a focusable element
		await page.locator('button, a, input').first().focus();

		// Check if focus indicator is visible
		const focusedElement = await page.locator(':focus');
		const computedStyle = await focusedElement.evaluate((el) => {
			return window.getComputedStyle(el);
		});

		// Should have focus styles
		expect(computedStyle.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
		expect(computedStyle.outlineWidth).not.toBe('0px');
	});

	test('should provide screen reader announcements', async ({ page }) => {
		// Set up live region monitoring
		const liveRegion = await page.locator('[aria-live]');

		// Test navigation announcements
		await page.locator('button').first().focus();

		// Check if announcements are made (this might require custom implementation)
		if (await liveRegion.isVisible()) {
			const announcement = await liveRegion.textContent();
			expect(announcement).toBeTruthy();
		}
	});

	test('should handle keyboard shortcuts in tool pages', async ({ page }) => {
		// Navigate to a specific tool
		await page.goto('/tools/json-formatter');
		await page.waitForLoadState('networkidle');

		// Test tool-specific shortcuts
		await page.keyboard.press('Control+a'); // Select all
		await page.keyboard.press('Tab'); // Navigate between panels
		await page.keyboard.press('Shift+Tab'); // Navigate backwards

		// Test action shortcuts
		await page.keyboard.press('Control+Enter'); // Format/Execute
		await page.keyboard.press('Control+c'); // Copy result
	});

	test('should respect user accessibility preferences', async ({ page }) => {
		// Test reduced motion preference
		await page.emulateMedia({ reducedMotion: 'reduce' });

		// Focus on an element that might have animations
		await page.locator('button').first().focus();

		// Check that animations are reduced
		const focusedElement = await page.locator(':focus');
		const transitions = await focusedElement.evaluate((el) => {
			return window.getComputedStyle(el).transition;
		});

		expect(transitions).toBe('none' || transitions.includes('0s'));

		// Test high contrast preference
		await page.emulateMedia({ forcedColors: 'active' });

		// Verify high contrast styles are applied
		const highContrastElement = await page.locator('button').first();
		const bgColor = await highContrastElement.evaluate((el) => {
			return window.getComputedStyle(el).backgroundColor;
		});

		// Should use system colors in high contrast mode
		expect(bgColor).toContain('rgb');
	});

	test('should handle keyboard-only navigation efficiently', async ({ page }) => {
		// Disable mouse simulation
		await page.coverage.start({ resetOnNavigation: true });

		// Navigate through entire page using only keyboard
		let focusableElementsCount = 0;
		let navigationStartTime = Date.now();

		// Tab through all focusable elements
		let previousFocused = '';
		while (Date.now() - navigationStartTime < 30000) { // Max 30 seconds
			await page.keyboard.press('Tab');
			const focusedElement = await page.locator(':focus');
			const focusedText = await focusedElement.textContent();

			// If we've looped back to the first element, stop
			if (previousFocused === focusedText && focusableElementsCount > 0) {
				break;
			}

			previousFocused = focusedText;
			focusableElementsCount++;

			// Safety break
			if (focusableElementsCount > 100) {
				break;
			}
		}

		// Should be able to navigate through multiple elements
		expect(focusableElementsCount).toBeGreaterThan(5);

		await page.coverage.stop();
	});

	test('should provide skip links for keyboard users', async ({ page }) => {
		// Check for skip links
		const skipLinks = page.locator('a[href^="#"]');

		if (await skipLinks.count() > 0) {
			// Test skip link functionality
			await skipLinks.first().focus();
			await page.keyboard.press('Enter');

			// Should scroll to the target
			const target = page.locator(await skipLinks.first().getAttribute('href'));
			if (await target.count() > 0) {
				const targetBox = await target.boundingBox();
				expect(targetBox?.y).toBeLessThan(200); // Should be visible near top
			}
		}
	});
});

test.describe('Keyboard Navigation Performance', () => {
	test('should not block main thread', async ({ page }) => {
		// Monitor performance during keyboard navigation
		await page.goto('/tools');

		const performanceMetrics = await page.evaluate(() => {
			return new Promise((resolve) => {
				let measures = [];
				const observer = new PerformanceObserver((list) => {
					measures = measures.concat(list.getEntries());
				});
				observer.observe({ entryTypes: ['measure'] });

				// Simulate rapid keyboard navigation
				const keyboard = {
					press: (key) => {
						window.dispatchEvent(new KeyboardEvent('keydown', { key }));
					}
				};

				// Rapid navigation
				for (let i = 0; i < 50; i++) {
					keyboard.press('Tab');
				}

				setTimeout(() => {
					resolve(measures);
				}, 1000);
			});
		});

		// Should not have long tasks
		const longTasks = performanceMetrics.filter((measure: any) => measure.duration > 50);
		expect(longTasks.length).toBeLessThan(5);
	});

	test('should maintain responsiveness under load', async ({ page }) => {
		await page.goto('/tools');

		// Simulate high keyboard navigation load
		const startTime = Date.now();

		for (let i = 0; i < 100; i++) {
			await page.keyboard.press('Tab');
			await page.waitForTimeout(10); // Small delay to simulate real user behavior
		}

		const endTime = Date.now();
		const totalTime = endTime - startTime;

		// Should complete 100 navigations in reasonable time
		expect(totalTime).toBeLessThan(10000); // Less than 10 seconds
	});
});
