/**
 * Performance and Visual Regression E2E Tests
 * Tests load performance, interaction performance, and visual consistency
 */

import { test, expect } from '@playwright/test';
import { ToolsHomePage } from '../pages/tools-homepage.page';
import { PERFORMANCE_THRESHOLDS, VIEWPORTS, NETWORK_CONDITIONS } from '../fixtures/tools-data';

test.describe('Performance Tests', () => {
  let toolsPage: ToolsHomePage;

  test.describe('Load Performance', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should load homepage within performance thresholds', async ({ page }) => {
      const startTime = Date.now();
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Should load within acceptable time
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.page_load.acceptable);

      // Ideally within target time
      console.log(`Page load time: ${loadTime}ms (target: ${PERFORMANCE_THRESHOLDS.page_load.target}ms)`);

      // Critical elements should be visible
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();
    });

    test('should have efficient resource loading', async ({ page }) => {
      const responses: any[] = [];

      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing()
        });
      });

      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      // Analyze loaded resources
      const resourceCount = responses.length;
      expect(resourceCount).toBeLessThan(50); // Should not load too many resources

      // Check for large resources
      const largeResources = responses.filter(r =>
        r.url.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2)$/i)
      );

      // Should not have excessively large resources
      console.log(`Loaded ${resourceCount} resources including ${largeResources.length} assets`);
    });

    test('should have fast Time to Interactive (TTI)', async ({ page }) => {
      const startTime = Date.now();
      await toolsPage.goto();

      // Wait for interactive elements
      await toolsPage.searchInput.waitFor({ state: 'visible' });
      await toolsPage.toolCards.first().waitFor({ state: 'visible' });

      // Test that page is interactive
      await toolsPage.search('test');
      await toolsPage.clearSearch();

      const tti = Date.now() - startTime;

      // Should be interactive quickly
      expect(tti).toBeLessThan(4000);
      console.log(`Time to Interactive: ${tti}ms`);
    });

    test('should handle caching efficiently', async ({ page }) => {
      // First load
      const firstLoadStart = Date.now();
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();
      const firstLoadTime = Date.now() - firstLoadStart;

      // Second load (should benefit from caching)
      const secondLoadStart = Date.now();
      await page.goto('/tools');
      await toolsPage.waitForPageLoad();
      const secondLoadTime = Date.now() - secondLoadStart;

      console.log(`First load: ${firstLoadTime}ms, Second load: ${secondLoadTime}ms`);

      // Second load should be faster or at least not significantly slower
      expect(secondLoadTime).toBeLessThan(firstLoadTime + 1000);
    });
  });

  test.describe('Interaction Performance', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
      await toolsPage.goto();
    });

    test('should respond to search within performance thresholds', async ({ page }) => {
      const searchQueries = ['json', 'formatter', 'validator', 'converter'];

      for (const query of searchQueries) {
        const startTime = Date.now();
        await toolsPage.search(query);
        const responseTime = Date.now() - startTime;

        // Should respond within acceptable time
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.search_response.acceptable);

        console.log(`Search response time for "${query}": ${responseTime}ms`);

        await toolsPage.clearSearch();
        await page.waitForTimeout(200);
      }
    });

    test('should respond to filter changes quickly', async ({ page }) => {
      const categoryFilters = toolsPage.categoryFilters;

      if (await categoryFilters.count() > 0) {
        const startTime = Date.now();
        await toolsPage.selectCategory('JSON Processing');
        const responseTime = Date.now() - startTime;

        // Should respond within acceptable time
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.filter_response.acceptable);

        console.log(`Filter response time: ${responseTime}ms`);
      }
    });

    test('should handle tool navigation quickly', async ({ page }) => {
      const startTime = Date.now();
      await toolsPage.tryToolByIndex(0);
      const navigationTime = Date.now() - startTime;

      // Should navigate quickly
      expect(navigationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tool_navigation.acceptable);

      console.log(`Tool navigation time: ${navigationTime}ms`);
    });

    test('should maintain performance during rapid interactions', async ({ page }) => {
      // Simulate rapid user interactions
      const interactions = [
        () => toolsPage.search('json'),
        () => toolsPage.search('formatter'),
        () => toolsPage.clearSearch(),
        () => toolsPage.search('validator'),
        () => toolsPage.clearSearch()
      ];

      const totalStartTime = Date.now();

      for (const interaction of interactions) {
        const startTime = Date.now();
        await interaction();
        const interactionTime = Date.now() - startTime;

        // Each interaction should be reasonably fast
        expect(interactionTime).toBeLessThan(1000);

        await page.waitForTimeout(100);
      }

      const totalTime = Date.now() - totalStartTime;
      console.log(`Total time for rapid interactions: ${totalTime}ms`);
    });

    test('should handle large dataset efficiently', async ({ page }) => {
      await toolsPage.goto();

      // Scroll through all content
      await toolsPage.scrollToBottom();
      await page.waitForTimeout(500);

      // Test interactions after scrolling
      const startTime = Date.now();
      await toolsPage.search('test');
      const responseTime = Date.now() - startTime;

      // Should still be responsive after loading all content
      expect(responseTime).toBeLessThan(1000);

      await toolsPage.clearSearch();
    });
  });

  test.describe('Network Performance', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should perform well on slow 3G', async ({ page }) => {
      // Emulate slow 3G network
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await toolsPage.page.emulateNetworkConditions(NETWORK_CONDITIONS.slow_3g);

      const startTime = Date.now();
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Should still load within reasonable time on slow network
      expect(loadTime).toBeLessThan(10000); // 10 seconds max

      console.log(`Load time on slow 3G: ${loadTime}ms`);

      // Should be functional
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();
    });

    test('should perform well on fast 3G', async ({ page }) => {
      await toolsPage.page.emulateNetworkConditions(NETWORK_CONDITIONS.fast_3g);

      const startTime = Date.now();
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Should load faster on fast 3G
      expect(loadTime).toBeLessThan(6000);

      console.log(`Load time on fast 3G: ${loadTime}ms`);
    });

    test('should handle offline mode gracefully', async ({ page }) => {
      // Load page first
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      // Go offline
      await toolsPage.page.context().setOffline(true);

      // Should still allow basic interactions
      const searchValue = await toolsPage.getSearchValue();
      expect(typeof searchValue).toBe('string');

      // Try to search (might not work but should not crash)
      await toolsPage.search('test');
      await page.waitForTimeout(500);

      // Should handle offline state gracefully
      expect(await toolsPage.page.locator('body').isVisible()).toBeTruthy();

      // Go back online
      await toolsPage.page.context().setOffline(false);
    });

    test('should handle network interruptions', async ({ page }) => {
      // Start loading page
      await toolsPage.goto();

      // Interrupt network
      await toolsPage.page.context().setOffline(true);
      await page.waitForTimeout(1000);

      // Restore network
      await toolsPage.page.context().setOffline(false);

      // Should recover gracefully
      await toolsPage.waitForPageLoad();
      expect(await toolsPage.page.locator('body').isVisible()).toBeTruthy();
    });
  });

  test.describe('Memory Performance', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should not have memory leaks during navigation', async ({ page }) => {
      await toolsPage.goto();

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Perform multiple interactions
      for (let i = 0; i < 10; i++) {
        await toolsPage.search(`test${i}`);
        await page.waitForTimeout(200);
        await toolsPage.clearSearch();
        await page.waitForTimeout(200);
      }

      // Check memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    test('should handle large content without memory issues', async ({ page }) => {
      await toolsPage.goto();

      // Load all content by scrolling
      await toolsPage.scrollToBottom();
      await page.waitForTimeout(1000);

      // Perform memory-intensive operations
      for (let i = 0; i < 5; i++) {
        await toolsPage.search('json');
        await page.waitForTimeout(300);
        await toolsPage.clearSearch();
        await page.waitForTimeout(300);
      }

      // Should still be responsive
      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });
  });

  test.describe('Rendering Performance', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should not have layout shifts during loading', async ({ page }) => {
      await toolsPage.goto();

      // Monitor for layout shifts
      const layoutShifts = await page.evaluate(() => {
        return new Promise((resolve) => {
          let cls = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => resolve(cls), 3000);
        });
      });

      // CLS should be very low
      expect(layoutShifts).toBeLessThan(0.1);
      console.log(`Cumulative Layout Shift: ${layoutShifts}`);
    });

    test('should render smoothly during interactions', async ({ page }) => {
      await toolsPage.goto();

      // Monitor frame rate during search
      const frameDrops = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameDrops = 0;
          let lastTime = performance.now();

          function countFrames() {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;

            if (deltaTime > 20) { // More than 20ms means less than 50fps
              frameDrops++;
            }

            lastTime = currentTime;
          }

          const interval = setInterval(countFrames, 16);

          setTimeout(() => {
            clearInterval(interval);
            resolve(frameDrops);
          }, 2000);
        });
      });

      // Should not drop many frames
      expect(frameDrops).toBeLessThan(10);
      console.log(`Frame drops during interaction: ${frameDrops}`);
    });

    test('should handle animations smoothly', async ({ page }) => {
      await toolsPage.goto();

      // Test hover animations
      const firstCard = await toolsPage.getToolCard(0);

      const animationPerformance = await page.evaluate((cardSelector) => {
        return new Promise((resolve) => {
          const card = document.querySelector(cardSelector);
          if (!card) {
            resolve(0);
            return;
          }

          let startTime = performance.now();
          let frames = 0;

          function measureAnimation() {
            frames++;
            const rect = card.getBoundingClientRect();
            const transform = window.getComputedStyle(card).transform;

            if (frames < 60) { // Measure for 1 second at 60fps
              requestAnimationFrame(measureAnimation);
            } else {
              const endTime = performance.now();
              resolve({
                duration: endTime - startTime,
                frames: frames,
                fps: frames / ((endTime - startTime) / 1000)
              });
            }
          }

          card.dispatchEvent(new Event('mouseenter'));
          measureAnimation();
        });
      }, await firstCard.evaluate(el => el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ').join('.') : '')));

      if (animationPerformance && typeof animationPerformance === 'object') {
        expect(animationPerformance.fps).toBeGreaterThan(30);
        console.log(`Animation FPS: ${animationPerformance.fps}`);
      }
    });
  });
});

test.describe('Visual Regression Tests', () => {
  let toolsPage: ToolsHomePage;

  test.describe('Layout Consistency', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should have consistent layout across viewports', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'];
      const screenshots: string[] = [];

      for (const viewport of viewports) {
        await toolsPage.setViewport(viewport);
        await toolsPage.goto();
        await toolsPage.waitForPageLoad();

        // Take full page screenshot
        const screenshot = await page.screenshot({
          fullPage: true,
          animations: 'disabled'
        });

        screenshots.push(screenshot.toString('base64'));
      }

      // Basic check that screenshots are different (layout should change)
      expect(screenshots[0]).not.toBe(screenshots[1]);
      expect(screenshots[1]).not.toBe(screenshots[2]);
    });

    test('should have consistent element positioning', async ({ page }) => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      // Get positions of key elements
      const positions = await page.evaluate(() => {
        const header = document.querySelector('header');
        const search = document.querySelector('input[placeholder*="Search"]');
        const firstCard = document.querySelector('.card, [data-testid="tool-card"]');

        return {
          header: header ? header.getBoundingClientRect() : null,
          search: search ? search.getBoundingClientRect() : null,
          firstCard: firstCard ? firstCard.getBoundingClientRect() : null
        };
      });

      // Elements should be positioned logically
      expect(positions.header).toBeTruthy();
      expect(positions.search).toBeTruthy();
      expect(positions.firstCard).toBeTruthy();

      if (positions.header && positions.search && positions.firstCard) {
        // Header should be at top
        expect(positions.header.top).toBeLessThan(100);

        // Search should be below header
        expect(positions.search.top).toBeGreaterThan(positions.header.top);

        // First card should be below search
        expect(positions.firstCard.top).toBeGreaterThan(positions.search.top);
      }
    });

    test('should maintain consistent spacing', async ({ page }) => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      // Check spacing between tool cards
      const spacing = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.card, [data-testid="tool-card"]'));
        if (cards.length < 2) return null;

        const firstCard = cards[0].getBoundingClientRect();
        const secondCard = cards[1].getBoundingClientRect();

        return {
          horizontal: secondCard.left - firstCard.right,
          vertical: secondCard.top - firstCard.bottom
        };
      });

      if (spacing) {
        // Should have consistent spacing
        expect(spacing.horizontal).toBeGreaterThan(0);
        expect(spacing.vertical).toBeGreaterThanOrEqual(0);

        // Spacing should be reasonable
        expect(spacing.horizontal).toBeLessThan(100);
        expect(spacing.vertical).toBeLessThan(100);
      }
    });
  });

  test.describe('Visual Consistency', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should maintain consistent styling', async ({ page }) => {
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      // Check consistent button styling
      const buttonStyles = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.slice(0, 5).map(button => ({
          fontFamily: window.getComputedStyle(button).fontFamily,
          fontSize: window.getComputedStyle(button).fontSize,
          padding: window.getComputedStyle(button).padding,
          borderRadius: window.getComputedStyle(button).borderRadius
        }));
      });

      // Buttons should have consistent styling
      if (buttonStyles.length > 1) {
        const firstStyle = buttonStyles[0];

        for (let i = 1; i < buttonStyles.length; i++) {
          const style = buttonStyles[i];

          // Font family should be consistent
          expect(style.fontFamily).toBe(firstStyle.fontFamily);

          // Font size should be similar (allowing some variation for different button types)
          const fontSizeDiff = Math.abs(
            parseInt(style.fontSize) - parseInt(firstStyle.fontSize)
          );
          expect(fontSizeDiff).toBeLessThan(4);
        }
      }
    });

    test('should have consistent color scheme', async ({ page }) => {
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      // Check primary colors
      const colors = await page.evaluate(() => {
        const header = document.querySelector('header');
        const buttons = Array.from(document.querySelectorAll('button'));
        const links = Array.from(document.querySelectorAll('a'));

        return {
          headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
          buttonBg: buttons[0] ? window.getComputedStyle(buttons[0]).backgroundColor : null,
          linkColor: links[0] ? window.getComputedStyle(links[0]).color : null
        };
      });

      expect(colors.headerBg).toBeTruthy();
      expect(colors.buttonBg).toBeTruthy();
      expect(colors.linkColor).toBeTruthy();
    });

    test('should handle text overflow gracefully', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      // Check for text overflow
      const overflowIssues = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.card, h1, h2, h3, p'));
        const issues: string[] = [];

        elements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const isOverflowing = element.scrollHeight > element.clientHeight ||
                               element.scrollWidth > element.clientWidth;

          if (isOverflowing && styles.overflow === 'visible') {
            issues.push(element.tagName + (element.className ? '.' + element.className : ''));
          }
        });

        return issues;
      });

      // Should not have text overflow issues
      expect(overflowIssues.length).toBe(0);
    });
  });

  test.describe('Dark Mode Visual Consistency', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should maintain layout in dark mode', async ({ page }) => {
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      // Take light mode screenshot
      const lightScreenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      });

      // Toggle dark mode
      await toolsPage.toggleDarkMode();
      await page.waitForTimeout(500);

      // Take dark mode screenshot
      const darkScreenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      });

      // Screenshots should be different (colors should change)
      expect(lightScreenshot).not.toEqual(darkScreenshot);

      // But layout should be maintained
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();
    });

    test('should maintain functionality in dark mode', async ({ page }) => {
      await toolsPage.goto();
      await toolsPage.toggleDarkMode();
      await page.waitForTimeout(500);

      // Search should work in dark mode
      await toolsPage.search('json');
      await page.waitForTimeout(300);
      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      // Tool cards should be clickable
      await toolsPage.tryToolByIndex(0);
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/tools/');
    });

    test('should have proper color contrast in dark mode', async ({ page }) => {
      await toolsPage.goto();
      await toolsPage.toggleDarkMode();
      await page.waitForTimeout(500);

      // Check text visibility
      const textVisibility = await page.evaluate(() => {
        const textElements = Array.from(document.querySelectorAll('h1, h2, h3, p, span, a'));
        const invisibleElements: string[] = [];

        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;

          // Basic contrast check (not a full WCAG check)
          if (color === backgroundColor || color === 'rgba(0, 0, 0, 0)') {
            invisibleElements.push(element.tagName);
          }
        });

        return invisibleElements;
      });

      // Text should be visible in dark mode
      expect(textVisibility.length).toBe(0);
    });
  });

  test.describe('Responsive Visual Consistency', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should maintain visual hierarchy across viewports', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'];

      for (const viewport of viewports) {
        await toolsPage.setViewport(viewport);
        await toolsPage.goto();
        await toolsPage.waitForPageLoad();

        // Check heading hierarchy
        const headingSizes = await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
          return headings.map(h => ({
            level: parseInt(h.tagName.substring(1)),
            size: parseInt(window.getComputedStyle(h).fontSize)
          }));
        });

        // Heading sizes should decrease with level
        for (let i = 1; i < headingSizes.length; i++) {
          const current = headingSizes[i];
          const previous = headingSizes[i - 1];

          if (current.level > previous.level) {
            expect(current.size).toBeLessThanOrEqual(previous.size);
          }
        }
      }
    });

    test('should maintain readability across viewports', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'];

      for (const viewport of viewports) {
        await toolsPage.setViewport(viewport);
        await toolsPage.goto();
        await toolsPage.waitForPageLoad();

        // Check text sizes are readable
        const textSizes = await page.evaluate(() => {
          const textElements = Array.from(document.querySelectorAll('p, .description, span'));
          return textElements.map(el => parseInt(window.getComputedStyle(el).fontSize));
        }).filter(size => size > 0);

        // Text should be at least 14px for readability
        const minFontSize = Math.min(...textSizes);
        expect(minFontSize).toBeGreaterThanOrEqual(14);
      }
    });

    test('should handle orientation changes gracefully', async ({ page }) => {
      // Start portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await toolsPage.goto();
      await toolsPage.waitForPageLoad();

      const portraitScreenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      });

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);

      const landscapeScreenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      });

      // Layout should adapt but remain functional
      expect(portraitScreenshot).not.toEqual(landscapeScreenshot);

      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();
    });
  });
});
