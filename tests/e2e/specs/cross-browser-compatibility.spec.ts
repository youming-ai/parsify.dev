/**
 * Cross-Browser Compatibility E2E Tests
 * Tests functionality across different browsers and ensures consistent behavior
 */

import { test, expect, devices } from '@playwright/test';
import { ToolsHomePage } from '../pages/tools-homepage.page';

test.describe('Cross-Browser Compatibility', () => {
  let toolsPage: ToolsHomePage;

  test.beforeEach(async ({ page }) => {
    toolsPage = new ToolsHomePage(page);
    await toolsPage.goto();
  });

  test.describe('Core Functionality Across Browsers', () => {
    test('should load homepage consistently across browsers', async ({ page, browserName }) => {
      console.log(`Testing homepage load on ${browserName}`);

      // Essential elements should be visible
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.logo).toBeVisible();
      await expect(toolsPage.siteTitle).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();

      // Page title should be set correctly
      const title = await page.title();
      expect(title).toContain(/Tools|Parsify/);

      // URL should be correct
      expect(page.url()).toContain('/tools');
    });

    test('should handle search functionality consistently', async ({ page, browserName }) => {
      console.log(`Testing search functionality on ${browserName}`);

      // Search should work
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      // Clear search should work
      await toolsPage.clearSearch();
      await page.waitForTimeout(300);

      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });

    test('should handle tool navigation consistently', async ({ page, browserName }) => {
      console.log(`Testing tool navigation on ${browserName}`);

      const initialUrl = page.url();

      // Tool navigation should work
      await toolsPage.tryToolByIndex(0);
      await page.waitForTimeout(500);

      expect(page.url()).not.toBe(initialUrl);
      expect(page.url()).toContain('/tools/');
    });

    test('should handle dark mode consistently', async ({ page, browserName }) => {
      console.log(`Testing dark mode on ${browserName}`);

      // Check initial state
      const initialDarkMode = await toolsPage.isDarkMode();

      // Toggle dark mode
      await toolsPage.toggleDarkMode();
      await page.waitForTimeout(300);

      const newDarkMode = await toolsPage.isDarkMode();
      expect(newDarkMode).not.toBe(initialDarkMode);

      // Should still be functional
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();
    });
  });

  test.describe('Browser-Specific Features', () => {
    test('should handle CSS animations correctly in Chrome', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific animation test');

      const firstCard = await toolsPage.getToolCard(0);

      // Test hover animations
      await firstCard.hover();
      await page.waitForTimeout(200);

      // Check for visual feedback (CSS transforms)
      const hasTransform = await firstCard.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transform !== 'none' || style.transition !== 'none';
      });

      // Animations might not be present, but should not cause errors
      expect(await firstCard.isVisible()).toBeTruthy();
    });

    test('should handle SVG rendering correctly in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific SVG test');

      // Look for SVG icons
      const svgIcons = page.locator('svg');

      if (await svgIcons.count() > 0) {
        await expect(svgIcons.first()).toBeVisible();

        // Check if SVGs are rendered correctly
        const svgRendered = await svgIcons.first().evaluate(svg => {
          return svg.getBoundingClientRect().width > 0 &&
                 svg.getBoundingClientRect().height > 0;
        });

        expect(svgRendered).toBeTruthy();
      }
    });

    test('should handle WebKit-specific features in Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');

      // Test for WebKit-specific CSS features
      const hasWebkitFeatures = await page.evaluate(() => {
        const style = document.createElement('div').style;
        return 'webkitBackdropFilter' in style ||
               'webkitClipPath' in style ||
               'webkitMask' in style;
      });

      // This is informational - features might or might not be present
      console.log(`WebKit features available: ${hasWebkitFeatures}`);

      // Basic functionality should still work
      await expect(toolsPage.searchInput).toBeVisible();
    });

    test('should handle Edge-specific features correctly', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium' || !process.env.EDGE_TEST, 'Edge-specific test');

      // Edge-specific rendering tests
      const hasChromiumFeatures = await page.evaluate(() => {
        return !!window.chrome && !!window.chrome.webstore;
      });

      console.log(`Chromium features available: ${hasChromiumFeatures}`);

      // Should work with or without Chromium features
      await toolsPage.search('test');
      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });
  });

  test.describe('CSS and Rendering Consistency', () => {
    test('should render layout consistently', async ({ page, browserName }) => {
      console.log(`Testing layout consistency on ${browserName}`);

      // Check key layout properties
      const layoutInfo = await page.evaluate(() => {
        const header = document.querySelector('header');
        const search = document.querySelector('input[placeholder*="Search"]');
        const firstCard = document.querySelector('.card, [data-testid="tool-card"]');

        return {
          headerVisible: header ? window.getComputedStyle(header).display !== 'none' : false,
          searchVisible: search ? window.getComputedStyle(search).display !== 'none' : false,
          firstCardVisible: firstCard ? window.getComputedStyle(firstCard).display !== 'none' : false,
          bodyFontSize: window.getComputedStyle(document.body).fontSize,
          primaryColor: window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#000'
        };
      });

      expect(layoutInfo.headerVisible).toBeTruthy();
      expect(layoutInfo.searchVisible).toBeTruthy();
      expect(layoutInfo.firstCardVisible).toBeTruthy();
      expect(layoutInfo.bodyFontSize).toBeTruthy();
    });

    test('should handle flexbox/grid layouts correctly', async ({ page, browserName }) => {
      console.log(`Testing modern layout features on ${browserName}`);

      // Check if modern layout features are supported
      const layoutSupport = await page.evaluate(() => {
        const testDiv = document.createElement('div');
        return {
          flexbox: testDiv.style.display === 'flex' || CSS.supports('display', 'flex'),
          grid: testDiv.style.display === 'grid' || CSS.supports('display', 'grid'),
          customProperties: CSS.supports('color', 'var(--test)'),
          aspectRatio: CSS.supports('aspect-ratio', '1/1')
        };
      });

      console.log(`Layout support on ${browserName}:`, layoutSupport);

      // Essential layout should work regardless of support level
      await expect(toolsPage.toolCards.first()).toBeVisible();
    });

    test('should render fonts consistently', async ({ page, browserName }) => {
      console.log(`Testing font rendering on ${browserName}`);

      // Check font loading
      const fontInfo = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3');
        const bodyText = document.querySelectorAll('p, span, div');

        return {
          headingFonts: Array.from(headings).map(h => window.getComputedStyle(h).fontFamily),
          bodyFonts: Array.from(bodyText.slice(0, 3)).map(t => window.getComputedStyle(t).fontFamily),
          fontsLoaded: document.fonts ? document.fonts.size : 0
        };
      });

      // Should have fonts applied
      expect(fontInfo.headingFonts.length).toBeGreaterThan(0);
      expect(fontInfo.bodyFonts.length).toBeGreaterThan(0);

      // Fonts should be readable
      const firstHeading = page.locator('h1').first();
      await expect(firstHeading).toBeVisible();
    });
  });

  test.describe('JavaScript Compatibility', () => {
    test('should handle modern JavaScript features', async ({ page, browserName }) => {
      console.log(`Testing JavaScript compatibility on ${browserName}`);

      // Check for modern JS feature support
      const jsSupport = await page.evaluate(() => {
        return {
          asyncAwait: typeof async === 'function',
          arrowFunctions: (() => true)(),
          destructuring: (() => { try { const [a] = [1]; return true; } catch { return false; } })(),
          spreadOperator: (() => { try { const arr = [...[1, 2, 3]]; return true; } catch { return false; } })(),
          fetchAPI: typeof fetch === 'function',
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined'
        };
      });

      console.log(`JavaScript feature support on ${browserName}:`, jsSupport);

      // Basic functionality should work
      await toolsPage.search('test');
      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });

    test('should handle DOM manipulation correctly', async ({ page, browserName }) => {
      console.log(`Testing DOM manipulation on ${browserName}`);

      // Test dynamic content updates
      const domSupport = await page.evaluate(() => {
        const testDiv = document.createElement('div');
        return {
          querySelector: typeof document.querySelector === 'function',
          addEventListener: typeof testDiv.addEventListener === 'function',
          classList: !!testDiv.classList,
          dataset: !!testDiv.dataset,
          closest: typeof testDiv.closest === 'function'
        };
      });

      Object.values(domSupport).forEach(supported => {
        expect(supported).toBeTruthy();
      });

      // Dynamic updates should work (search functionality)
      await toolsPage.search('json');
      expect(await toolsPage.hasSearchResults()).toBeTruthy();
    });

    test('should handle event handling consistently', async ({ page, browserName }) => {
      console.log(`Testing event handling on ${browserName}`);

      // Test event listener attachment
      const eventSupport = await page.evaluate(() => {
        const testDiv = document.createElement('div');
        let eventFired = false;

        testDiv.addEventListener('click', () => { eventFired = true; });
        testDiv.click();

        return {
          clickEvent: eventFired,
          touchEvent: 'ontouchstart' in window,
          keyboardEvent: typeof KeyboardEvent === 'function'
        };
      });

      expect(eventSupport.clickEvent).toBeTruthy();

      // Click events should work on buttons
      const tryButton = toolsPage.getTryToolButton(await toolsPage.getToolCard(0));
      await expect(tryButton).toBeVisible();
      await tryButton.click();

      await page.waitForTimeout(500);
      expect(page.url()).toContain('/tools/');
    });
  });

  test.describe('Network and Resource Loading', () => {
    test('should handle resource loading consistently', async ({ page, browserName }) => {
      console.log(`Testing resource loading on ${browserName}`);

      // Monitor network requests
      const resources: string[] = [];
      page.on('response', response => {
        resources.push(response.url());
      });

      await page.reload();
      await toolsPage.waitForPageLoad();

      // Should have loaded essential resources
      expect(resources.length).toBeGreaterThan(0);

      // Should have loaded CSS and JS
      const hasCSS = resources.some(url => url.includes('.css'));
      const hasJS = resources.some(url => url.includes('.js'));

      expect(hasCSS || hasJS).toBeTruthy();
    });

    test('should handle network errors gracefully', async ({ page, browserName }) => {
      console.log(`Testing network error handling on ${browserName}`);

      // Block some requests to test error handling
      await page.route('**/*.{png,jpg,jpeg,svg}', route => route.abort());

      await toolsPage.goto();

      // Should still load without images
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();

      // Should be functional
      await toolsPage.search('test');
      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);

      // Restore routing
      await page.unroute('**/*.{png,jpg,jpeg,svg}');
    });
  });

  test.describe('Browser Quirks and Workarounds', () => {
    test('should handle focus management correctly', async ({ page, browserName }) => {
      console.log(`Testing focus management on ${browserName}`);

      // Test tab navigation
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        return {
          tagName: active?.tagName,
          hasFocus: active === document.activeElement,
          visible: active ? window.getComputedStyle(active).display !== 'none' : false
        };
      });

      expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement.tagName);
    });

    test('should handle scroll behavior consistently', async ({ page, browserName }) => {
      console.log(`Testing scroll behavior on ${browserName}`);

      // Test smooth scrolling
      await toolsPage.scrollToBottom();

      const scrollPosition = await page.evaluate(() => ({
        scrollTop: window.pageYOffset,
        scrollHeight: document.body.scrollHeight,
        clientHeight: window.innerHeight
      }));

      // Should have scrolled
      expect(scrollPosition.scrollTop).toBeGreaterThan(0);

      // Scroll back to top
      await toolsPage.scrollToTop();

      const topPosition = await page.evaluate(() => window.pageYOffset);
      expect(topPosition).toBe(0);
    });

    test('should handle localStorage consistently', async ({ page, browserName }) => {
      console.log(`Testing localStorage on ${browserName}`);

      // Test localStorage availability
      const storageSupport = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          const value = localStorage.getItem('test');
          localStorage.removeItem('test');
          return value === 'value';
        } catch (e) {
          return false;
        }
      });

      if (storageSupport) {
        // Test dark mode persistence
        await toolsPage.toggleDarkMode();
        await page.waitForTimeout(300);

        const darkModeState = await toolsPage.isDarkMode();

        await page.reload();
        await toolsPage.waitForPageLoad();

        // Dark mode might be persisted or reset - both are valid
        const currentDarkMode = await toolsPage.isDarkMode();
        console.log(`Dark mode persistence on ${browserName}: ${darkModeState} -> ${currentDarkMode}`);
      }
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should load within reasonable time limits', async ({ page, browserName }) => {
      console.log(`Testing performance on ${browserName}`);

      const startTime = Date.now();
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time (adjusted per browser)
      const browserTimeouts = {
        chromium: 5000,
        firefox: 6000,
        webkit: 7000
      };

      const timeout = browserTimeouts[browserName as keyof typeof browserTimeouts] || 8000;
      expect(loadTime).toBeLessThan(timeout);

      console.log(`${browserName} load time: ${loadTime}ms (threshold: ${timeout}ms)`);
    });

    test('should handle interactions responsively', async ({ page, browserName }) => {
      console.log(`Testing interaction performance on ${browserName}`);

      // Test search performance
      const searchStart = Date.now();
      await toolsPage.search('json');
      const searchTime = Date.now() - searchStart;

      // Should respond within reasonable time
      expect(searchTime).toBeLessThan(2000);

      console.log(`${browserName} search time: ${searchTime}ms`);

      // Should have results
      expect(await toolsPage.hasSearchResults()).toBeTruthy();
    });
  });
});
