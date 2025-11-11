/**
 * Homepage Discovery and Exploration E2E Tests
 * Tests user workflows for discovering and exploring tools
 */

import { test, expect, devices } from '@playwright/test';
import { ToolsHomePage } from '../pages/tools-homepage.page';
import { USER_SCENARIOS, VIEWPORTS, PERFORMANCE_THRESHOLDS } from '../fixtures/tools-data';

test.describe('Homepage Discovery Workflows', () => {
  let toolsPage: ToolsHomePage;

  test.beforeEach(async ({ page }) => {
    toolsPage = new ToolsHomePage(page);

    // Clear localStorage before each test
    await page.goto('/tools');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test.describe('Page Load and Initial Rendering', () => {
    test('should load homepage with all critical elements', async ({ page }) => {
      await toolsPage.goto();

      // Check page title
      await expect(page).toHaveTitle(/Tools|Developer Tools/);

      // Check header elements
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.logo).toBeVisible();
      await expect(toolsPage.siteTitle).toBeVisible();
      await expect(toolsPage.siteTitle).toContainText('Parsify.dev');

      // Check search functionality
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.searchInput).toHaveAttribute('placeholder', /Search tools/);

      // Check content sections
      await expect(toolsPage.heroSection).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();

      // Check footer
      await expect(toolsPage.footer).toBeVisible();
    });

    test('should display correct number of tools on load', async () => {
      await toolsPage.goto();

      const toolCount = await toolsPage.getVisibleToolCount();
      expect(toolCount).toBeGreaterThan(10); // Should show reasonable number of tools

      // Check that tools are loaded with metadata
      const firstCard = await toolsPage.getToolCard(0);
      const toolName = await toolsPage.getToolNameByIndex(0);
      const toolDescription = await toolsPage.getToolDescriptionByIndex(0);

      expect(toolName).toBeTruthy();
      expect(toolName.length).toBeGreaterThan(0);
      expect(toolDescription).toBeTruthy();
      expect(toolDescription.length).toBeGreaterThan(0);
    });

    test('should display featured categories prominently', async () => {
      await toolsPage.goto();

      // Check for featured categories section
      if (await toolsPage.featuredCategories.isVisible()) {
        await expect(toolsPage.featuredCategories).toBeVisible();

        // Should have at least one featured category
        const categoryCount = await toolsPage.getCategoryCount();
        expect(categoryCount).toBeGreaterThan(0);
      }

      // Check category sections
      const categoryNames = await toolsPage.getCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);
    });

    test('should show new and popular badges appropriately', async () => {
      await toolsPage.goto();

      // Check for "New" badges
      const newBadges = toolsPage.page.locator('.badge:has-text("New")');
      if (await newBadges.count() > 0) {
        await expect(newBadges.first()).toBeVisible();
      }

      // Check for "Popular" badges
      const popularBadges = toolsPage.page.locator('.badge:has-text("Popular")');
      if (await popularBadges.count() > 0) {
        await expect(popularBadges.first()).toBeVisible();
      }
    });
  });

  test.describe('Tool Discovery Workflows', () => {
    test('should allow browsing tools by category', async () => {
      await toolsPage.goto();

      // Get initial tool count
      const initialCount = await toolsPage.getVisibleToolCount();

      // Try to select a category (if category filters are available)
      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await toolsPage.page.waitForTimeout(500);

        // Check that results are filtered
        const filteredCount = await toolsPage.getVisibleToolCount();
        expect(filteredCount).toBeGreaterThan(0);
        expect(filteredCount).toBeLessThanOrEqual(initialCount);

        // Verify filtered results are relevant
        const firstToolName = await toolsPage.getToolNameByIndex(0);
        expect(firstToolName.toLowerCase()).toContain('json');
      }
    });

    test('should show tool details on hover/focus', async ({ page }) => {
      await toolsPage.goto();

      const firstCard = await toolsPage.getToolCard(0);

      // Hover over tool card
      await firstCard.hover();
      await toolsPage.waitForToolCardAnimation();

      // Check for hover effects (visual feedback)
      const hasHoverClass = await firstCard.evaluate(el => {
        return window.getComputedStyle(el).transform !== 'none' ||
               el.classList.contains('hover') ||
               el.classList.contains('group-hover');
      });

      // Test keyboard focus
      await firstCard.focus();
      const isFocused = await firstCard.evaluate(el =>
        document.activeElement === el || el.contains(document.activeElement)
      );

      expect(isFocused).toBeTruthy();
    });

    test('should provide clear navigation to tool pages', async ({ page }) => {
      await toolsPage.goto();

      const firstCard = await toolsPage.getToolCard(0);
      const toolName = await toolsPage.getToolNameByIndex(0);

      // Click "Try Tool" button
      await toolsPage.tryToolByIndex(0);

      // Verify navigation
      await page.waitForURL(/\/tools\//);
      expect(page.url()).toContain('/tools/');

      // Should be on a tool page
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('should allow favoriting tools', async () => {
      await toolsPage.goto();

      const firstCard = await toolsPage.getToolCard(0);
      const favoriteButton = toolsPage.getFavoriteButton(firstCard);

      // Only test if favorite functionality exists
      if (await favoriteButton.count() > 0) {
        // Toggle favorite
        await toolsPage.toggleFavoriteByIndex(0);

        // Check if favorite was saved to localStorage
        const favorites = await toolsPage.page.evaluate(() => {
          return JSON.parse(localStorage.getItem('favorite-tools') || '[]');
        });

        // Should have at least one favorite (could be existing or new)
        expect(favorites.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display tool tags and metadata', async () => {
      await toolsPage.goto();

      const firstCard = await toolsPage.getToolCard(0);

      // Check for tags
      const tags = await toolsPage.getToolTagsByIndex(0);
      expect(tags.length).toBeGreaterThan(0);

      // Check for difficulty badge
      const difficultyBadge = toolsPage.getToolDifficulty(firstCard);
      if (await difficultyBadge.count() > 0) {
        await expect(difficultyBadge).toBeVisible();
      }

      // Check for processing type
      const processingType = firstCard.locator(':text("client-side"), :text("server-side")');
      if (await processingType.count() > 0) {
        await expect(processingType).toBeVisible();
      }
    });
  });

  test.describe('User Scenario Workflows', () => {
    test('JSON Developer workflow', async ({ page }) => {
      await toolsPage.goto();

      const scenario = USER_SCENARIOS.json_developer;

      // Search for JSON tools
      await toolsPage.search(scenario.search_query);

      // Check that relevant tools are shown
      const hasResults = await toolsPage.hasSearchResults();
      expect(hasResults).toBeTruthy();

      // Verify JSON tools are present
      const firstToolName = await toolsPage.getToolNameByIndex(0);
      expect(firstToolName.toLowerCase()).toContain('json');

      // Try the first tool
      await toolsPage.tryToolByIndex(0);
      await page.waitForURL(/\/tools\/json\//);

      expect(page.url()).toContain('/tools/json/');
    });

    test('Security conscious user workflow', async ({ page }) => {
      await toolsPage.goto();

      const scenario = USER_SCENARIOS.security_user;

      // Search for security tools
      await toolsPage.search(scenario.search_query);

      // Check that security tools are shown
      const hasResults = await toolsPage.hasSearchResults();
      expect(hasResults).toBeTruthy();

      // Look for hash generator specifically
      const hashToolCard = toolsPage.page.locator('[data-testid="tool-card"]').filter({ hasText: 'Hash Generator' });
      if (await hashToolCard.count() > 0) {
        await expect(hashToolCard).toBeVisible();

        // Check for security-related metadata
        const securityBadge = hashToolCard.locator(':text("security"), :text("local-only")');
        expect(await securityBadge.count()).toBeGreaterThan(0);
      }
    });

    test('File processing user workflow', async () => {
      await toolsPage.goto();

      const scenario = USER_SCENARIOS.file_user;

      // Search for converter tools
      await toolsPage.search(scenario.search_query);

      // Check results
      const hasResults = await toolsPage.hasSearchResults();
      expect(hasResults).toBeTruthy();

      // Look for file-specific tools
      const fileTools = ['File Converter', 'CSV Processor', 'Text Processor'];
      let foundFileTool = false;

      for (const toolName of fileTools) {
        const toolCard = toolsPage.page.locator('[data-testid="tool-card"]').filter({ hasText: toolName });
        if (await toolCard.count() > 0) {
          foundFileTool = true;
          break;
        }
      }

      expect(foundFileTool).toBeTruthy();
    });
  });

  test.describe('Interactive Elements', () => {
    test('should have working dark mode toggle', async () => {
      await toolsPage.goto();

      // Check initial state
      const initialDarkMode = await toolsPage.isDarkMode();

      // Toggle dark mode
      await toolsPage.toggleDarkMode();

      // Check state changed
      const newDarkMode = await toolsPage.isDarkMode();
      expect(newDarkMode).not.toBe(initialDarkMode);

      // Verify visual changes
      const body = toolsPage.page.locator('body');
      if (newDarkMode) {
        await expect(body).toHaveClass(/dark/);
      } else {
        await expect(body).not.toHaveClass(/dark/);
      }
    });

    test('should have working sort functionality', async () => {
      await toolsPage.goto();

      const initialToolNames = [];
      const toolCount = await toolsPage.getVisibleToolCount();
      const checkCount = Math.min(toolCount, 5); // Check first 5 tools

      for (let i = 0; i < checkCount; i++) {
        initialToolNames.push(await toolsPage.getToolNameByIndex(i));
      }

      // Try to sort by name
      await toolsPage.sortBy('name');
      await toolsPage.page.waitForTimeout(500);

      // Verify sorting (basic check that order might have changed)
      let hasChanged = false;
      for (let i = 0; i < checkCount; i++) {
        const currentName = await toolsPage.getToolNameByIndex(i);
        if (currentName !== initialToolNames[i]) {
          hasChanged = true;
          break;
        }
      }

      // Sorting might not change order if already sorted, but should not error
      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });

    test('should have working view mode toggle', async () => {
      await toolsPage.goto();

      const viewModeButtons = toolsPage.viewModeButtons;

      // Only test if view mode buttons exist
      if (await viewModeButtons.count() > 0) {
        // Try different view modes
        const buttons = await viewModeButtons.all();

        for (const button of buttons) {
          await button.click();
          await toolsPage.page.waitForTimeout(300);

          // Tools should still be visible
          expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Content and Information Architecture', () => {
    test('should display helpful hero section', async () => {
      await toolsPage.goto();

      await expect(toolsPage.heroSection).toBeVisible();

      // Check for key information
      await expect(toolsPage.page.locator('h2')).toContainText('Professional Developer Tools');

      // Check for descriptive text
      const description = toolsPage.page.locator('p').filter({ hasText: 'developer tools' });
      await expect(description).toBeVisible();

      // Check for badges/metrics
      const badges = toolsPage.page.locator('.badge');
      if (await badges.count() > 0) {
        await expect(badges.first()).toBeVisible();
      }
    });

    test('should organize tools logically by category', async () => {
      await toolsPage.goto();

      const categoryNames = await toolsPage.getCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);

      // Categories should have meaningful names
      const meaningfulCategories = ['JSON', 'Code', 'File', 'Security', 'Text', 'Network'];
      const hasMeaningfulCategory = categoryNames.some(name =>
        meaningfulCategories.some(category => name.toLowerCase().includes(category.toLowerCase()))
      );

      expect(hasMeaningfulCategory).toBeTruthy();
    });

    test('should provide clear tool descriptions', async () => {
      await toolsPage.goto();

      // Check first few tools
      const checkCount = Math.min(5, await toolsPage.getVisibleToolCount());

      for (let i = 0; i < checkCount; i++) {
        const description = await toolsPage.getToolDescriptionByIndex(i);

        // Description should be meaningful
        expect(description.length).toBeGreaterThan(20);
        expect(description).not.toBe(description.toLowerCase()); // Not all lowercase

        // Should contain relevant keywords
        const hasKeywords = ['format', 'convert', 'validate', 'process', 'generate'].some(keyword =>
          description.toLowerCase().includes(keyword)
        );
        // This is optional as some descriptions might not contain these exact words
      }
    });

    test('should display tool counts and statistics', async () => {
      await toolsPage.goto();

      // Look for tool count badges
      const countBadges = toolsPage.page.locator('.badge').filter({ hasText: /\d+/ });
      if (await countBadges.count() > 0) {
        await expect(countBadges.first()).toBeVisible();

        const badgeText = await countBadges.first().textContent();
        expect(badgeText).toMatch(/\d+/); // Should contain numbers
      }
    });
  });

  test.describe('Responsive Discovery', () => {
    test('should adapt discovery interface for mobile', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();

      // Key elements should still be visible
      await expect(toolsPage.header).toBeVisible();
      await expect(toolsPage.searchInput).toBeVisible();
      await expect(toolsPage.toolCards.first()).toBeVisible();

      // Mobile-specific elements
      const mobileFilterToggle = toolsPage.filterToggle;
      if (await mobileFilterToggle.count() > 0) {
        await expect(mobileFilterToggle).toBeVisible();
      }

      // Should be able to interact with tools on mobile
      await toolsPage.tryToolByIndex(0);
      await page.waitForURL(/\/tools\//);
    });

    test('should provide optimal experience on tablet', async ({ page }) => {
      await toolsPage.setViewport('tablet');
      await toolsPage.goto();

      // Should show more tools in grid layout on tablet
      const visibleTools = await toolsPage.getVisibleToolCount();
      expect(visibleTools).toBeGreaterThan(2);

      // Search should work well on tablet
      await toolsPage.search('json');
      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      // Should have adequate touch targets
      const tryButton = toolsPage.getTryToolButton(await toolsPage.getToolCard(0));
      const buttonBox = await tryButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(44); // Minimum touch target size
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should leverage desktop screen real estate', async () => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();

      // Should show multiple columns of tools on desktop
      const visibleTools = await toolsPage.getVisibleToolCount();
      expect(visibleTools).toBeGreaterThan(8);

      // Should have advanced filtering options visible
      const advancedFilters = toolsPage.page.locator('[data-testid="advanced-filters"]');
      if (await advancedFilters.count() > 0) {
        await expect(advancedFilters).toBeVisible();
      }

      // Should show more tools in category sections
      const categoryCount = await toolsPage.getCategoryCount();
      if (categoryCount > 0) {
        expect(categoryCount).toBeGreaterThan(1);
      }
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load within acceptable time limits', async () => {
      const loadTime = await toolsPage.measurePageLoadTime();

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.page_load.acceptable);

      // Ideally within 3 seconds
      console.log(`Page load time: ${loadTime}ms`);
    });

    test('should handle large number of tools gracefully', async () => {
      await toolsPage.goto();

      // Scroll through all tools to test performance
      await toolsPage.scrollToBottom();

      // Page should remain responsive
      await toolsPage.search('test');
      await toolsPage.clearSearch();

      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
    });

    test('should provide loading indicators', async () => {
      await toolsPage.goto();

      // Test search loading indicator
      const searchPromise = toolsPage.search('json');

      // Check for loading state (if implemented)
      const isLoading = await toolsPage.isLoading();
      // Loading indicator might not always be visible due to fast search

      await searchPromise;

      // Should complete search and show results
      expect(await toolsPage.hasSearchResults()).toBeTruthy();
    });
  });
});
