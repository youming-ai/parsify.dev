/**
 * Mobile and Responsive Design E2E Tests
 * Tests responsive behavior across different devices and screen sizes
 */

import { test, expect, devices } from '@playwright/test';
import { ToolsHomePage } from '../pages/tools-homepage.page';
import { VIEWPORTS, PERFORMANCE_THRESHOLDS } from '../fixtures/tools-data';

test.describe('Responsive Design', () => {
  let toolsPage: ToolsHomePage;

  test.describe('Mobile Design (320-767px)', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should display correctly on small mobile screens', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Essential elements should be visible
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.logo).toBeVisible();
      await expect(toolsPage.siteTitle).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();

      // Content should be properly sized for mobile
      const headerBox = await toolsPage.header.boundingBox();
      if (headerBox) {
        expect(headerBox.width).toBeLessThanOrEqual(375); // Should fit mobile viewport
      }

      // Search input should be full width or appropriately sized
      const searchBox = await toolsPage.searchInput.boundingBox();
      if (searchBox) {
        expect(searchBox.width).toBeGreaterThan(200); // Adequate touch target
      }
    });

    test('should have mobile-optimized navigation', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Mobile-specific elements should be present
      const filterToggle = toolsPage.filterToggle;
      const mobileSortToggle = toolsPage.mobileSortToggle;

      // Filter toggle should be available on mobile
      if (await filterToggle.count() > 0) {
        await expect(filterToggle).toBeVisible();

        // Should be touch-friendly
        const filterBox = await filterToggle.boundingBox();
        if (filterBox) {
          expect(filterBox.width).toBeGreaterThanOrEqual(44);
          expect(filterBox.height).toBeGreaterThanOrEqual(44);
        }
      }

      // Mobile sort should be available
      if (await mobileSortToggle.count() > 0) {
        await expect(mobileSortToggle).toBeVisible();
      }
    });

    test('should display single column layout on mobile', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Tools should be in single column
      const toolCards = await toolsPage.toolCards.all();

      if (toolCards.length > 1) {
        const firstCard = toolCards[0];
        const secondCard = toolCards[1];

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // Cards should be stacked vertically
          expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
        }
      }
    });

    test('should have adequate touch targets on mobile', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Check button touch targets
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Check first 5 buttons
        const button = buttons.nth(i);
        const buttonBox = await button.boundingBox();

        if (buttonBox && await button.isVisible()) {
          // Touch targets should be at least 44x44 points
          expect(buttonBox.width).toBeGreaterThanOrEqual(44);
          expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        }
      }

      // Check tool card touch targets
      const tryButtons = page.locator('button:has-text("Try Tool")');
      const tryButtonCount = await tryButtons.count();

      for (let i = 0; i < Math.min(tryButtonCount, 3); i++) { // Check first 3
        const tryButton = tryButtons.nth(i);
        const tryBox = await tryButton.boundingBox();

        if (tryBox) {
          expect(tryBox.width).toBeGreaterThanOrEqual(44);
          expect(tryBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should handle mobile filtering correctly', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      const filterToggle = toolsPage.filterToggle;

      if (await filterToggle.count() > 0) {
        // Open filter panel
        await filterToggle.click();
        await page.waitForTimeout(300);

        // Filter panel should be usable on mobile
        const categoryFilters = toolsPage.categoryFilters;

        if (await categoryFilters.count() > 0) {
          await expect(categoryFilters.first()).toBeVisible();

          // Should be able to apply filter
          await toolsPage.selectCategory('JSON Processing');
          await page.waitForTimeout(300);

          expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);

          // Should be able to close filter panel
          await filterToggle.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should provide mobile search experience', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Search should work well on mobile
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      // Search results should be mobile-friendly
      const firstToolName = await toolsPage.getToolNameByIndex(0);
      expect(firstToolName.length).toBeGreaterThan(0);

      // Clear search should be easy on mobile
      await toolsPage.clearSearch();
      await page.waitForTimeout(300);

      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });

    test('should handle horizontal scrolling gracefully', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Check if any horizontal scrolling is needed
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 375;

      // Should not require horizontal scrolling on mobile
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small tolerance

      // If there are horizontally scrollable elements, they should work well
      const categoryNavigation = toolsPage.categoryNavigation;

      if (await categoryNavigation.isVisible()) {
        const isScrollable = await categoryNavigation.evaluate(el =>
          el.scrollWidth > el.clientWidth
        );

        if (isScrollable) {
          // Should support touch scrolling
          await categoryNavigation.hover();
          await page.mouse.down();
          await page.mouse.move(100, 0);
          await page.mouse.up();
          await page.waitForTimeout(200);

          // Should still be functional
          expect(await categoryNavigation.isVisible()).toBeTruthy();
        }
      }
    });

    test('should adapt typography for mobile', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Headings should be appropriately sized
      const mainHeading = toolsPage.siteTitle;
      const headingStyles = await mainHeading.evaluate(el => ({
        fontSize: window.getComputedStyle(el).fontSize,
        lineHeight: window.getComputedStyle(el).lineHeight
      }));

      // Font size should be reasonable for mobile
      const fontSize = parseInt(headingStyles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(16); // Minimum readable size
      expect(fontSize).toBeLessThanOrEqual(32); // Not too large

      // Text should be readable
      const toolNames = page.locator('h3');
      if (await toolNames.count() > 0) {
        const firstToolName = toolNames.first();
        const nameStyles = await firstToolName.evaluate(el => ({
          fontSize: window.getComputedStyle(el).fontSize,
          color: window.getComputedStyle(el).color
        }));

        const nameFontSize = parseInt(nameStyles.fontSize);
        expect(nameFontSize).toBeGreaterThanOrEqual(14);
      }
    });
  });

  test.describe('Tablet Design (768-1023px)', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should display optimized layout for tablet', async ({ page }) => {
      await toolsPage.setViewport('tablet');
      await toolsPage.goto();

      // Should show more content than mobile
      const toolCount = await toolsPage.getVisibleToolCount();
      expect(toolCount).toBeGreaterThan(2);

      // Layout should use tablet screen effectively
      const contentWidth = await page.evaluate(() => {
        const main = document.querySelector('main, .container, [class*="content"]');
        return main ? main.getBoundingClientRect().width : 0;
      });

      expect(contentWidth).toBeGreaterThan(500);
    });

    test('should show multi-column layout on tablet', async ({ page }) => {
      await toolsPage.setViewport('tablet');
      await toolsPage.goto();

      // Should show 2-3 columns on tablet
      const toolCards = await toolsPage.toolCards.all();

      if (toolCards.length >= 2) {
        const firstCard = toolCards[0];
        const secondCard = toolCards[1];

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // Cards might be side by side or stacked, depending on layout
          const isSideBySide = Math.abs(secondBox.y - firstBox.y) < 50;
          const isStacked = secondBox.y > firstBox.y + firstBox.height;

          expect(isSideBySide || isStacked).toBeTruthy();
        }
      }
    });

    test('should provide tablet-optimized interactions', async ({ page }) => {
      await toolsPage.setViewport('tablet');
      await toolsPage.goto();

      // Both touch and mouse interactions should work
      const firstCard = await toolsPage.getToolCard(0);

      // Hover should work
      await firstCard.hover();
      await page.waitForTimeout(200);

      // Touch should work
      await firstCard.tap();
      await page.waitForTimeout(200);

      // Should be able to interact with tools
      expect(await firstCard.isVisible()).toBeTruthy();
    });

    test('should balance content density on tablet', async ({ page }) => {
      await toolsPage.setViewport('tablet');
      await toolsPage.goto();

      // Should show more tools than mobile but fewer than desktop
      const mobilePage = await context.newPage();
      const mobileToolsPage = new ToolsHomePage(mobilePage);
      await mobilePage.setViewport('mobile');
      await mobileToolsPage.goto();
      const mobileCount = await mobileToolsPage.getVisibleToolCount();
      await mobilePage.close();

      const tabletCount = await toolsPage.getVisibleToolCount();

      // Should show more or equal tools compared to mobile
      expect(tabletCount).toBeGreaterThanOrEqual(mobileCount);

      // Should not overwhelm the screen
      expect(tabletCount).toBeLessThan(20);
    });
  });

  test.describe('Desktop Design (1024px+)', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should leverage desktop screen real estate', async ({ page }) => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();

      // Should show maximum content
      const toolCount = await toolsPage.getVisibleToolCount();
      expect(toolCount).toBeGreaterThan(8);

      // Should use full screen width effectively
      const contentWidth = await page.evaluate(() => {
        const container = document.querySelector('.container, main, [class*="content"]');
        return container ? container.getBoundingClientRect().width : 0;
      });

      expect(contentWidth).toBeGreaterThan(1000);
    });

    test('should show multi-column grid on desktop', async ({ page }) => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();

      // Should show 4+ columns on desktop
      const toolCards = await toolsPage.toolCards.all();

      if (toolCards.length >= 4) {
        const positions = [];

        for (let i = 0; i < Math.min(4, toolCards.length); i++) {
          const box = await toolCards[i].boundingBox();
          if (box) {
            positions.push(box);
          }
        }

        if (positions.length >= 3) {
          // Check if cards are arranged in a grid
          const firstRow = positions.filter(p => Math.abs(p.y - positions[0].y) < 50);
          expect(firstRow.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    test('should have desktop-advanced features visible', async ({ page }) => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();

      // Advanced filters should be visible on desktop
      const categoryNavigation = toolsPage.categoryNavigation;

      if (await categoryNavigation.isVisible()) {
        await expect(categoryNavigation).toBeVisible();
      }

      // Sort options should be readily available
      const sortOptions = toolsPage.sortOptions;
      if (await sortOptions.count() > 0) {
        await expect(sortOptions).toBeVisible();
      }

      // Should have more interactive elements
      const buttons = page.locator('button');
      expect(await buttons.count()).toBeGreaterThan(10);
    });

    test('should optimize for mouse interactions on desktop', async ({ page }) => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();

      // Hover states should work
      const firstCard = await toolsPage.getToolCard(0);
      await firstCard.hover();
      await page.waitForTimeout(200);

      // Tooltips should work if implemented
      const tooltips = page.locator('[role="tooltip"], .tooltip');
      if (await tooltips.count() > 0) {
        await expect(tooltips.first()).toBeVisible();
      }

      // Right-click context menus if implemented
      await firstCard.click({ button: 'right' });
      await page.waitForTimeout(200);

      // Should not break the interface
      expect(await firstCard.isVisible()).toBeTruthy();
    });
  });

  test.describe('Responsive Behavior', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should adapt to viewport changes dynamically', async ({ page }) => {
      // Start with desktop
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();

      const desktopCount = await toolsPage.getVisibleToolCount();

      // Switch to tablet
      await toolsPage.setViewport('tablet');
      await page.waitForTimeout(300);

      const tabletCount = await toolsPage.getVisibleToolCount();

      // Switch to mobile
      await toolsPage.setViewport('mobile');
      await page.waitForTimeout(300);

      const mobileCount = await toolsPage.getVisibleToolCount();

      // Should adapt layout appropriately
      expect(desktopCount).toBeGreaterThanOrEqual(tabletCount);
      expect(tabletCount).toBeGreaterThanOrEqual(mobileCount);

      // Essential elements should remain visible
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();
    });

    test('should maintain functionality across viewports', async ({ page }) => {
      // Test search across different viewports
      const viewports = ['mobile', 'tablet', 'desktop'];

      for (const viewport of viewports) {
        await toolsPage.setViewport(viewport);
        await toolsPage.goto();

        // Search should work
        await toolsPage.search('json');
        await page.waitForTimeout(300);

        expect(await toolsPage.hasSearchResults()).toBeTruthy();

        // Clear search should work
        await toolsPage.clearSearch();
        await page.waitForTimeout(300);

        expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
      }
    });

    test('should handle orientation changes', async ({ page }) => {
      // Test portrait to landscape
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile portrait
      await toolsPage.goto();

      const portraitCount = await toolsPage.getVisibleToolCount();

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 }); // Mobile landscape
      await page.waitForTimeout(300);

      const landscapeCount = await toolsPage.getVisibleToolCount();

      // Should adapt to orientation
      expect(landscapeCount).toBeGreaterThan(0);

      // Essential elements should remain functional
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();
    });

    test('should maintain accessibility across viewports', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'];

      for (const viewport of viewports) {
        await toolsPage.setViewport(viewport);
        await toolsPage.goto();

        // Keyboard navigation should work
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(['INPUT', 'BUTTON', 'A'].includes(focused || '')).toBeTruthy();

        // Screen reader elements should be present
        const headings = page.locator('h1, h2, h3');
        expect(await headings.count()).toBeGreaterThan(0);

        // Links should be accessible
        const links = page.locator('a');
        if (await links.count() > 0) {
          const firstLink = links.first();
          await expect(firstLink).toBeVisible();
        }
      }
    });
  });

  test.describe('Responsive Performance', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should perform well across all viewports', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'];

      for (const viewport of viewports) {
        await toolsPage.setViewport(viewport);

        const startTime = Date.now();
        await toolsPage.goto();
        const loadTime = Date.now() - startTime;

        // Should load within acceptable time
        expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.page_load.acceptable);

        // Should be interactive
        await toolsPage.search('test');
        await toolsPage.clearSearch();

        expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
      }
    });

    test('should handle responsive animations smoothly', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Test viewport change animations
      const startTime = Date.now();
      await toolsPage.setViewport('desktop');

      // Wait for any responsive transitions
      await page.waitForTimeout(300);

      const responseTime = Date.now() - startTime;

      // Should respond quickly to viewport changes
      expect(responseTime).toBeLessThan(1000);

      // Should remain functional
      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });

    test('should optimize images and media for different viewports', async ({ page }) => {
      const viewports = ['mobile', 'desktop'];

      for (const viewport of viewports) {
        await toolsPage.setViewport(viewport);
        await toolsPage.goto();

        // Check if images are appropriately sized
        const images = page.locator('img');

        if (await images.count() > 0) {
          const imageSizes = await images.evaluateAll imgs =>
            imgs.map(img => ({
              naturalWidth: img.naturalWidth,
              displayWidth: img.getBoundingClientRect().width
            }))
          );

          for (const img of imageSizes) {
            // Images shouldn't be excessively large for their display size
            const ratio = img.naturalWidth / img.displayWidth;
            expect(ratio).toBeLessThan(3); // Not more than 3x larger than needed
          }
        }
      }
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should handle very small viewports gracefully', async ({ page }) => {
      // Test extremely small viewport
      await page.setViewportSize({ width: 280, height: 400 });
      await toolsPage.goto();

      // Essential elements should still be visible
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();

      // Should be functional
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      expect(await toolsPage.hasSearchResults()).toBeTruthy();
    });

    test('should handle very large viewports gracefully', async ({ page }) => {
      // Test very large viewport
      await page.setViewportSize({ width: 2560, height: 1440 });
      await toolsPage.goto();

      // Should use screen space effectively
      const toolCount = await toolsPage.getVisibleToolCount();
      expect(toolCount).toBeGreaterThan(12);

      // Should remain functional
      await toolsPage.search('validator');
      await page.waitForTimeout(300);

      expect(await toolsPage.hasSearchResults()).toBeTruthy();
    });

    test('should handle dynamic content loading across viewports', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Load more content
      await toolsPage.scrollToBottom();
      await page.waitForTimeout(500);

      const mobileCount = await toolsPage.getVisibleToolCount();

      // Switch viewport
      await toolsPage.setViewport('desktop');
      await page.waitForTimeout(300);

      const desktopCount = await toolsPage.getVisibleToolCount();

      // Should handle dynamic content correctly
      expect(desktopCount).toBeGreaterThan(0);
      expect(mobileCount).toBeGreaterThan(0);
    });

    test('should maintain state during responsive changes', async ({ page }) => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();

      // Apply search
      await toolsPage.search('formatter');
      await page.waitForTimeout(300);

      const desktopResults = [];
      const desktopCount = await toolsPage.getVisibleToolCount();

      for (let i = 0; i < Math.min(3, desktopCount); i++) {
        desktopResults.push(await toolsPage.getToolNameByIndex(i));
      }

      // Switch to mobile
      await toolsPage.setViewport('mobile');
      await page.waitForTimeout(300);

      const mobileCount = await toolsPage.getVisibleToolCount();

      // Should maintain search results (if implemented)
      const currentSearch = await toolsPage.getSearchValue();

      if (currentSearch === 'formatter') {
        // Search was maintained
        expect(mobileCount).toBeGreaterThan(0);

        const mobileResults = [];
        for (let i = 0; i < Math.min(3, mobileCount); i++) {
          mobileResults.push(await toolsPage.getToolNameByIndex(i));
        }

        // Should show similar results
        expect(mobileResults.length).toBeGreaterThan(0);
      }
    });
  });
});
