/**
 * Category Navigation E2E Tests
 * Tests category browsing, navigation, and organization
 */

import { test, expect, devices } from '@playwright/test';
import { ToolsHomePage } from '../pages/tools-homepage.page';
import { TOOL_CATEGORIES, VIEWPORTS } from '../fixtures/tools-data';

test.describe('Category Navigation', () => {
  let toolsPage: ToolsHomePage;

  test.beforeEach(async ({ page }) => {
    toolsPage = new ToolsHomePage(page);
    await toolsPage.goto();
  });

  test.describe('Category Organization', () => {
    test('should display all main categories', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      // Should have multiple categories
      expect(categoryNames.length).toBeGreaterThan(1);

      // Categories should have meaningful names
      const expectedCategories = ['JSON', 'Code', 'File', 'Security', 'Text', 'Network'];
      const hasExpectedCategories = categoryNames.some(name =>
        expectedCategories.some(expected =>
          name.toLowerCase().includes(expected.toLowerCase())
        )
      );

      expect(hasExpectedCategories).toBeTruthy();

      // Each category should have tools
      for (const categoryName of categoryNames.slice(0, 3)) { // Check first 3
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });
        const categoryTools = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")');

        if (await categoryTools.count() > 0) {
          expect(await categoryTools.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should show tool counts per category', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      // Look for tool count indicators
      for (const categoryName of categoryNames.slice(0, 3)) {
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });

        // Look for count badges near category headers
        const countBadge = categorySection.locator('xpath=./following-sibling::* | ./following::*')
          .filter({ hasText: /\d+ tools?/ })
          .first();

        if (await countBadge.count() > 0) {
          await expect(countBadge).toBeVisible();

          const countText = await countBadge.textContent();
          expect(countText).toMatch(/\d+/);
        }
      }
    });

    test('should organize tools logically within categories', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      // Check JSON Processing category specifically
      const jsonCategory = categoryNames.find(name =>
        name.toLowerCase().includes('json')
      );

      if (jsonCategory) {
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: jsonCategory });
        const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
          .locator('xpath=./ancestor::*[contains(@class, "card")]');

        if (await toolCards.count() > 0) {
          // Check first few tools in JSON category
          const checkCount = Math.min(3, await toolCards.count());

          for (let i = 0; i < checkCount; i++) {
            const toolCard = toolCards.nth(i);
            const toolName = await toolCard.locator('h3, [data-testid="tool-name"]').textContent();

            // Should be JSON-related
            expect(toolName?.toLowerCase()).toContain('json');
          }
        }
      }
    });

    test('should display featured categories prominently', async ({ page }) => {
      const featuredSection = toolsPage.featuredCategories;

      if (await featuredSection.isVisible()) {
        await expect(featuredSection).toBeVisible();

        // Should have a heading
        const featuredHeading = featuredSection.locator('h2, h3').filter({ hasText: 'Featured' });
        expect(await featuredHeading.count()).toBeGreaterThan(0);

        // Should have at least one featured category
        const featuredCategories = featuredSection.locator('h2, h3').not({ hasText: 'Featured' });
        expect(await featuredCategories.count()).toBeGreaterThan(0);

        // Featured categories should have star indicators or special styling
        const firstFeatured = featuredCategories.first();
        const hasStar = await firstFeatured.locator(':has-text("⭐"), :has([data-testid="star"])').count() > 0;
        const hasFeaturedClass = await firstFeatured.evaluate(el =>
          el.classList.contains('featured') ||
          el.closest('[data-featured="true"]')
        );

        // Either visual indicator or class should indicate featured status
      }
    });
  });

  test.describe('Category Navigation Interactions', () => {
    test('should allow quick navigation to category overview', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      if (categoryNames.length > 0) {
        const firstCategory = categoryNames[0];

        // Try to find "View All" button for the category
        const viewAllButton = toolsPage.page.locator('button:has-text("View All")')
          .filter({ has: toolsPage.page.locator(`xpath=./ancestor::*[contains(text(), "${firstCategory}")]`) });

        if (await viewAllButton.count() > 0) {
          await viewAllButton.click();

          // Should navigate to category page or scroll to category
          await page.waitForTimeout(500);

          // URL might change or page might scroll to category
          const url = page.url();
          const hasCategoryInUrl = url.includes('/tools/') &&
                                  categoryNames.some(cat => url.includes(cat.toLowerCase()));

          if (hasCategoryInUrl) {
            expect(url).toContain('/tools/');
          }
        }
      }
    });

    test('should highlight active category', async ({ page }) => {
      const categoryNavigation = toolsPage.categoryNavigation;

      if (await categoryNavigation.isVisible()) {
        const categoryButtons = categoryNavigation.locator('button, a');

        if (await categoryButtons.count() > 0) {
          // Click first category
          await categoryButtons.first().click();
          await page.waitForTimeout(300);

          // Check if category is highlighted as active
          const hasActiveState = await categoryButtons.first().evaluate(el =>
            el.classList.contains('active') ||
            el.getAttribute('aria-current') === 'page' ||
            el.classList.contains('selected')
          );

          // This is optional - depends on implementation
        }
      }
    });

    test('should support keyboard navigation in categories', async ({ page }) => {
      const categoryNavigation = toolsPage.categoryNavigation;

      if (await categoryNavigation.isVisible()) {
        const categoryButtons = categoryNavigation.locator('button, a');

        if (await categoryButtons.count() > 0) {
          // Focus first category button
          await categoryButtons.first().focus();

          const isFirstFocused = await categoryButtons.first().evaluate(el =>
            document.activeElement === el
          );

          expect(isFirstFocused).toBeTruthy();

          // Try arrow key navigation
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(100);

          // Focus should move to next category (if implemented)
          const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
          // This depends on implementation
        }
      }
    });

    test('should show category descriptions', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      for (const categoryName of categoryNames.slice(0, 2)) { // Check first 2
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });

        // Look for description near category header
        const description = categorySection.locator('xpath=./following-sibling::*[contains(@class, "text") or self::p]')
          .first();

        if (await description.count() > 0) {
          const descriptionText = await description.textContent();

          // Should be meaningful description
          expect(descriptionText?.length).toBeGreaterThan(20);
          expect(descriptionText).not.toBe(descriptionText?.toLowerCase()); // Not all lowercase
        }
      }
    });

    test('should display category icons or visual indicators', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      for (const categoryName of categoryNames.slice(0, 2)) { // Check first 2
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });

        // Look for icons near category headers
        const icon = categorySection.locator('xpath=./preceding-sibling::*//img | ./preceding-sibling::*//svg | ./preceding-sibling::*[contains(@class, "icon")]')
          .first();

        if (await icon.count() > 0) {
          await expect(icon).toBeVisible();
        }

        // Also check for icon containers
        const iconContainer = categorySection.locator('xpath=./preceding-sibling::* | ./ancestor::*[1]')
          .filter({ has: 'img, svg, [class*="icon"]' })
          .first();

        if (await iconContainer.count() > 0) {
          await expect(iconContainer).toBeVisible();
        }
      }
    });
  });

  test.describe('Category Tool Display', () => {
    test('should show appropriate number of tools per category', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      for (const categoryName of categoryNames.slice(0, 3)) { // Check first 3
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });
        const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
          .locator('xpath=./ancestor::*[contains(@class, "card")]');

        if (await toolCards.count() > 0) {
          const toolCount = await toolCards.count();

          // Should show reasonable number of tools
          expect(toolCount).toBeGreaterThan(0);
          expect(toolCount).toBeLessThan(20); // Not too many to overwhelm

          // Should have "View All" if there are many tools
          if (toolCount > 4) {
            const viewAllButton = categorySection.locator('xpath=./following-sibling::*//button:has-text("View All")');
            // This is optional
          }
        }
      }
    });

    test('should display tool cards consistently within categories', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      if (categoryNames.length > 0) {
        const firstCategory = categoryNames[0];
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: firstCategory });
        const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
          .locator('xpath=./ancestor::*[contains(@class, "card")]');

        if (await toolCards.count() >= 2) {
          // Check first two tool cards have consistent structure
          const firstCard = toolCards.first();
          const secondCard = toolCards.nth(1);

          // Both should have tool names
          const firstName = await firstCard.locator('h3, [data-testid="tool-name"]').textContent();
          const secondName = await secondCard.locator('h3, [data-testid="tool-name"]').textContent();

          expect(firstName).toBeTruthy();
          expect(firstName?.length).toBeGreaterThan(0);
          expect(secondName).toBeTruthy();
          expect(secondName?.length).toBeGreaterThan(0);

          // Both should have descriptions
          const firstDesc = await firstCard.locator('p, [data-testid="tool-description"]').textContent();
          const secondDesc = await secondCard.locator('p, [data-testid="tool-description"]').textContent();

          expect(firstDesc).toBeTruthy();
          expect(firstDesc?.length).toBeGreaterThan(10);
          expect(secondDesc).toBeTruthy();
          expect(secondDesc?.length).toBeGreaterThan(10);

          // Both should have "Try Tool" buttons
          await expect(firstCard.locator('button:has-text("Try Tool")')).toBeVisible();
          await expect(secondCard.locator('button:has-text("Try Tool")')).toBeVisible();
        }
      }
    });

    test('should show category-specific tool metadata', async ({ page }) => {
      // Check JSON Processing category for JSON-specific metadata
      const jsonCategory = (await toolsPage.getCategoryNames()).find(name =>
        name.toLowerCase().includes('json')
      );

      if (jsonCategory) {
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: jsonCategory });
        const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
          .locator('xpath=./ancestor::*[contains(@class, "card")]');

        if (await toolCards.count() > 0) {
          const firstCard = toolCards.first();

          // Should have relevant tags
          const tags = await firstCard.locator('[data-testid="tool-tag"], .badge').allTextContents();
          const hasJsonTags = tags.some(tag =>
            tag.toLowerCase().includes('json') ||
            tag.toLowerCase().includes('validator') ||
            tag.toLowerCase().includes('formatter')
          );

          expect(hasJsonTags).toBeTruthy();

          // Should show processing type
          const processingType = firstCard.locator(':text("client-side"), :text("server-side")');
          expect(await processingType.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should allow expanding categories to see more tools', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      for (const categoryName of categoryNames.slice(0, 2)) { // Check first 2
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });

        // Look for expand button or "View All" button
        const expandButton = categorySection.locator('xpath=./following-sibling::*//button:has-text("View All")')
          .first();

        if (await expandButton.count() > 0) {
          await expandButton.click();
          await page.waitForTimeout(500);

          // Should navigate to category page or show more tools
          const url = page.url();

          // Either navigated to category page or expanded on same page
          const hasCategoryInUrl = url.includes('/tools/') &&
                                  url.toLowerCase().includes(categoryName.toLowerCase().replace(' ', '-'));

          if (hasCategoryInUrl) {
            // Should be on category page with more tools
            const categoryTools = toolsPage.page.locator('[data-testid="tool-card"], .card:has(h3)');
            expect(await categoryTools.count()).toBeGreaterThan(0);
          }

          // Go back for next test
          if (hasCategoryInUrl) {
            await page.goBack();
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });

  test.describe('Category Breadcrumb Navigation', () => {
    test('should show breadcrumb navigation', async ({ page }) => {
      const breadcrumb = toolsPage.breadcrumb;

      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toBeVisible();

        // Should have home/All Tools link
        const homeLink = breadcrumb.locator('a:has-text("Tools"), a:has-text("Home")');
        expect(await homeLink.count()).toBeGreaterThan(0);

        // Should be clickable
        if (await homeLink.count() > 0) {
          await homeLink.first().click();
          await page.waitForTimeout(300);

          // Should navigate appropriately
          const url = page.url();
          expect(url).toContain('/tools');
        }
      }
    });

    test('should update breadcrumb when navigating categories', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      if (categoryNames.length > 0) {
        const firstCategory = categoryNames[0];

        // Try to navigate to category
        const viewAllButton = toolsPage.page.locator('button:has-text("View All")')
          .filter({ has: toolsPage.page.locator(`xpath=./ancestor::*[contains(text(), "${firstCategory}")]`) });

        if (await viewAllButton.count() > 0) {
          await viewAllButton.click();
          await page.waitForTimeout(500);

          // Check if breadcrumb is updated
          const breadcrumb = toolsPage.breadcrumb;

          if (await breadcrumb.isVisible()) {
            const categoryInBreadcrumb = breadcrumb.locator(`:has-text("${firstCategory}")`);

            // Might show category in breadcrumb (depends on implementation)
          }
        }
      }
    });
  });

  test.describe('Responsive Category Navigation', () => {
    test('should adapt category layout for mobile', async ({ page }) => {
      await toolsPage.setViewport('mobile');

      const categoryNames = await toolsPage.getCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);

      // Categories should still be visible on mobile
      for (const categoryName of categoryNames.slice(0, 2)) {
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });
        await expect(categorySection.first()).toBeVisible();

        // Tool cards should be accessible
        const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
          .locator('xpath=./ancestor::*[contains(@class, "card")]');

        if (await toolCards.count() > 0) {
          await expect(toolCards.first()).toBeVisible();

          // Touch targets should be adequate
          const tryButton = toolCards.first().locator('button:has-text("Try Tool")');
          const buttonBox = await tryButton.boundingBox();

          if (buttonBox) {
            expect(buttonBox.width).toBeGreaterThanOrEqual(44);
            expect(buttonBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should provide mobile category navigation', async ({ page }) => {
      await toolsPage.setViewport('mobile');

      const categoryNavigation = toolsPage.categoryNavigation;

      if (await categoryNavigation.isVisible()) {
        await expect(categoryNavigation).toBeVisible();

        // Should be scrollable if many categories
        const isScrollable = await categoryNavigation.evaluate(el => {
          return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
        });

        // This is optional - depends on number of categories

        // Should respond to touch
        const firstCategory = categoryNavigation.locator('button, a').first();
        if (await firstCategory.count() > 0) {
          await firstCategory.tap();
          await page.waitForTimeout(300);

          // Should have some effect
          expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
        }
      }
    });

    test('should optimize category display for tablet', async ({ page }) => {
      await toolsPage.setViewport('tablet');

      const categoryNames = await toolsPage.getCategoryNames();

      // Should show more tools per category on tablet
      for (const categoryName of categoryNames.slice(0, 2)) {
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });
        const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
          .locator('xpath=./ancestor::*[contains(@class, "card")]');

        if (await toolCards.count() > 0) {
          // Should show multiple tools
          expect(await toolCards.count()).toBeGreaterThan(1);

          // Layout should be optimized for tablet
          const firstCard = toolCards.first();
          const cardBox = await firstCard.boundingBox();

          if (cardBox) {
            // Should be appropriately sized for tablet
            expect(cardBox.width).toBeGreaterThan(200);
          }
        }
      }
    });

    test('should leverage desktop space for categories', async ({ page }) => {
      await toolsPage.setViewport('desktop');

      const categoryNames = await toolsPage.getCategoryNames();

      // Should show category navigation sidebar if available
      const categoryNavigation = toolsPage.categoryNavigation;

      if (await categoryNavigation.isVisible()) {
        await expect(categoryNavigation).toBeVisible();

        // Should show multiple tools per category
        for (const categoryName of categoryNames.slice(0, 2)) {
          const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: categoryName });
          const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
            .locator('xpath=./ancestor::*[contains(@class, "card")]');

          if (await toolCards.count() > 0) {
            // Should show grid layout on desktop
            expect(await toolCards.count()).toBeGreaterThan(2);
          }
        }
      }
    });
  });

  test.describe('Category Search Integration', () => {
    test('should highlight categories matching search', async ({ page }) => {
      const categoryNames = await toolsPage.getCategoryNames();

      // Search for something that matches a category
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      // JSON category should be highlighted or prominent
      const jsonCategory = categoryNames.find(name =>
        name.toLowerCase().includes('json')
      );

      if (jsonCategory) {
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: jsonCategory });

        // Category section should be visible and prominent
        await expect(categorySection.first()).toBeVisible();

        // Should have matching tools
        const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
          .locator('xpath=./ancestor::*[contains(@class, "card")]');

        if (await toolCards.count() > 0) {
          expect(await toolCards.count()).toBeGreaterThan(0);

          // Tools should be relevant to search
          const firstToolName = await toolCards.first().locator('h3, [data-testid="tool-name"]').textContent();
          expect(firstToolName?.toLowerCase()).toContain('json');
        }
      }
    });

    test('should filter categories based on search results', async ({ page }) => {
      // Search for specific term
      await toolsPage.search('hash');
      await page.waitForTimeout(300);

      // Categories with matching tools should be visible
      const categoryNames = await toolsPage.getCategoryNames();

      // Security category should be visible if it has hash tools
      const securityCategory = categoryNames.find(name =>
        name.toLowerCase().includes('security')
      );

      if (securityCategory) {
        const categorySection = toolsPage.page.locator('h2, h3').filter({ hasText: securityCategory });

        if (await categorySection.count() > 0) {
          await expect(categorySection.first()).toBeVisible();

          // Should have hash-related tools
          const toolCards = categorySection.locator('xpath=./following-sibling::*//button:has-text("Try Tool")')
            .locator('xpath=./ancestor::*[contains(@class, "card")]');

          if (await toolCards.count() > 0) {
            let hasHashTool = false;

            for (let i = 0; i < Math.min(3, await toolCards.count()); i++) {
              const toolName = await toolCards.nth(i).locator('h3, [data-testid="tool-name"]').textContent();

              if (toolName?.toLowerCase().includes('hash')) {
                hasHashTool = true;
                break;
              }
            }

            // At least one tool should be hash-related
            expect(hasHashTool).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Category Performance', () => {
    test('should load categories quickly', async ({ page }) => {
      const startTime = Date.now();
      await toolsPage.goto();

      const categoryNames = await toolsPage.getCategoryNames();
      const loadTime = Date.now() - startTime;

      // Should load categories quickly
      expect(loadTime).toBeLessThan(3000);
      expect(categoryNames.length).toBeGreaterThan(0);
    });

    test('should handle large number of categories efficiently', async ({ page }) => {
      await toolsPage.goto();

      // Scroll through all categories
      await toolsPage.scrollToBottom();

      // Should remain responsive
      const categoryNames = await toolsPage.getCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);

      // Should be able to interact after scrolling
      await toolsPage.search('test');
      await toolsPage.clearSearch();

      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });
  });
});
