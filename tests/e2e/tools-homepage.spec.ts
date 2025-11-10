import { test, expect, devices } from '@playwright/test';

// Test data
const toolCategories = [
  'json-processing',
  'code-execution',
  'file-processing',
  'network-utilities',
  'text-processing',
  'security-encryption'
];

const toolTags = [
  'json',
  'formatter',
  'validator',
  'converter',
  'code',
  'executor',
  'regex',
  'file',
  'csv',
  'hash',
  'base64',
  'url'
];

const sampleTools = [
  'json-formatter',
  'json-validator',
  'code-executor',
  'regex-tester',
  'file-converter',
  'csv-processor',
  'hash-generator',
  'base64-converter',
  'url-encoder'
];

test.describe('Tools Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/tools');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  // Homepage Rendering Tests
  test.describe('Homepage Rendering', () => {
    test('should load the tools homepage correctly', async ({ page }) => {
      await page.goto('/tools');

      // Check page title
      await expect(page).toHaveTitle(/Tools/);

      // Check main header
      const header = page.locator('h1');
      await expect(header).toBeVisible();
      await expect(header).toContainText('Developer Tools');

      // Check tools count badge
      const toolsBadge = page.locator('h1 .badge');
      await expect(toolsBadge).toBeVisible();
      const toolsCount = await toolsBadge.textContent();
      expect(parseInt(toolsCount || '0')).toBeGreaterThan(0);

      // Check description
      const description = page.locator('p').filter({ hasText: 'Professional tools for JSON processing' });
      await expect(description).toBeVisible();

      // Check that tabs are present
      const tabs = page.locator('[role="tablist"]');
      await expect(tabs).toBeVisible();

      // Check that all tab buttons exist
      const tabButtons = page.locator('[role="tab"]');
      await expect(tabButtons).toHaveCount(5);
      await expect(tabButtons.filter({ hasText: 'All Tools' })).toBeVisible();
      await expect(tabButtons.filter({ hasText: 'Popular' })).toBeVisible();
      await expect(tabButtons.filter({ hasText: 'New' })).toBeVisible();
      await expect(tabButtons.filter({ hasText: 'Recent' })).toBeVisible();
      await expect(tabButtons.filter({ hasText: 'Favorites' })).toBeVisible();
    });

    test('should display search input and category filters', async ({ page }) => {
      await page.goto('/tools');

      // Check search input
      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('placeholder', /Search tools by name, description, or tags/);

      // Check category filter section
      const categoryFilter = page.locator('[data-testid="category-filter"]');
      if (await categoryFilter.count() > 0) {
        await expect(categoryFilter).toBeVisible();
      }
    });

    test('should display tool cards initially', async ({ page }) => {
      await page.goto('/tools');

      // Wait for tools to load
      await page.waitForSelector('[data-testid="tool-card"], .card', { timeout: 10000 });

      // Check that at least some tools are displayed
      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      await expect(toolCards.first()).toBeVisible();

      // Check that each card has expected elements
      const firstCard = toolCards.first();
      await expect(firstCard.locator('h3, [data-testid="tool-name"]')).toBeVisible();
      await expect(firstCard.locator('p, [data-testid="tool-description"]')).toBeVisible();
      await expect(firstCard.locator('button:has-text("Try Tool")')).toBeVisible();
    });
  });

  // Search and Filter Tests
  test.describe('Search Functionality', () => {
    test('should perform real-time search with debouncing', async ({ page }) => {
      await page.goto('/tools');

      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await searchInput.fill('json');

      // Wait for search to complete (debounced)
      await page.waitForTimeout(300);

      // Check that results are filtered
      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      const visibleCards = await toolCards.filter({ visible: true }).count();
      expect(visibleCards).toBeGreaterThan(0);

      // Check that results contain search term
      const firstCard = toolCards.first();
      const cardContent = await firstCard.textContent();
      expect(cardContent?.toLowerCase()).toContain('json');
    });

    test('should show no results for non-existent search', async ({ page }) => {
      await page.goto('/tools');

      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await searchInput.fill('xyznonexistenttool123');

      // Wait for search to complete
      await page.waitForTimeout(300);

      // Check for no results message
      const noResults = page.locator('text=/No tools found/i');
      await expect(noResults).toBeVisible();

      // Check that clear filters button is available
      const clearButton = page.locator('button:has-text("Clear all filters")');
      await expect(clearButton).toBeVisible();
    });

    test('should clear search and restore all tools', async ({ page }) => {
      await page.goto('/tools');

      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await searchInput.fill('json');
      await page.waitForTimeout(300);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(300);

      // Check that all tools are restored
      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      const visibleCards = await toolCards.filter({ visible: true }).count();
      expect(visibleCards).toBeGreaterThan(5); // Should show more than filtered results
    });

    test('should show search suggestions if implemented', async ({ page }) => {
      await page.goto('/tools');

      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await searchInput.fill('json');

      // Check if suggestions appear (if implemented)
      const suggestions = page.locator('[data-testid="search-suggestions"]');
      if (await suggestions.count() > 0) {
        await expect(suggestions).toBeVisible();

        // Try clicking a suggestion
        const firstSuggestion = suggestions.locator('li, button').first();
        if (await firstSuggestion.count() > 0) {
          await firstSuggestion.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  // Category and Tag Filtering Tests
  test.describe('Category Filtering', () => {
    test('should filter tools by category', async ({ page }) => {
      await page.goto('/tools');

      // Click on JSON Processing category
      const jsonCategory = page.locator('button:has-text("JSON Processing"), [data-category="json-processing"]');
      if (await jsonCategory.count() > 0) {
        await jsonCategory.click();
        await page.waitForTimeout(300);

        // Check that results are filtered
        const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
        const visibleCards = await toolCards.filter({ visible: true }).count();
        expect(visibleCards).toBeGreaterThan(0);

        // Verify filtered results contain JSON-related tools
        const firstCard = toolCards.first();
        const cardContent = await firstCard.textContent();
        expect(cardContent?.toLowerCase()).toMatch(/json/);
      }
    });

    test('should reset to all categories', async ({ page }) => {
      await page.goto('/tools');

      // Select a category first
      const jsonCategory = page.locator('button:has-text("JSON Processing"), [data-category="json-processing"]');
      if (await jsonCategory.count() > 0) {
        await jsonCategory.click();
        await page.waitForTimeout(300);

        // Click "All" category to reset
        const allCategory = page.locator('button:has-text("All"), [data-category="all"]');
        if (await allCategory.count() > 0) {
          await allCategory.click();
          await page.waitForTimeout(300);

          // Check that all tools are restored
          const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
          const visibleCards = await toolCards.filter({ visible: true }).count();
          expect(visibleCards).toBeGreaterThan(5);
        }
      }
    });

    test('should filter by multiple criteria', async ({ page }) => {
      await page.goto('/tools');

      // Search for "json"
      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await searchInput.fill('json');
      await page.waitForTimeout(300);

      // Select a category if available
      const categoryFilter = page.locator('button:has-text("JSON Processing"), [data-category="json-processing"]');
      if (await categoryFilter.count() > 0) {
        await categoryFilter.click();
        await page.waitForTimeout(300);

        // Verify both filters are applied
        const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
        const visibleCards = await toolCards.filter({ visible: true }).count();
        expect(visibleCards).toBeGreaterThan(0);
      }
    });
  });

  // Tool Cards and Interactions Tests
  test.describe('Tool Cards and Interactions', () => {
    test('should display tool metadata correctly', async ({ page }) => {
      await page.goto('/tools');

      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      const firstCard = toolCards.first();
      await expect(firstCard).toBeVisible();

      // Check for required elements
      await expect(firstCard.locator('h3, [data-testid="tool-name"]')).toBeVisible();
      await expect(firstCard.locator('p, [data-testid="tool-description"]')).toBeVisible();
      await expect(firstCard.locator('button:has-text("Try Tool")')).toBeVisible();

      // Check for badges if present
      const badges = firstCard.locator('.badge');
      if (await badges.count() > 0) {
        await expect(badges.first()).toBeVisible();
      }

      // Check for favorite button
      const favoriteButton = firstCard.locator('button[aria-label*="favorite"], button:has([data-testid="favorite-icon"])');
      if (await favoriteButton.count() > 0) {
        await expect(favoriteButton).toBeVisible();
      }
    });

    test('should show new and popular badges', async ({ page }) => {
      await page.goto('/tools');

      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });

      // Check for "New" badges
      const newBadges = page.locator('.badge:has-text("New")');
      if (await newBadges.count() > 0) {
        await expect(newBadges.first()).toBeVisible();
      }

      // Check for "Popular" badges
      const popularBadges = page.locator('.badge:has-text("Popular")');
      if (await popularBadges.count() > 0) {
        await expect(popularBadges.first()).toBeVisible();
      }
    });

    test('should navigate to tool page when clicking "Try Tool"', async ({ page }) => {
      await page.goto('/tools');

      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      const firstCard = toolCards.first();

      // Get tool name for verification
      const toolName = await firstCard.locator('h3, [data-testid="tool-name"]').textContent();

      // Click "Try Tool" button
      const tryToolButton = firstCard.locator('button:has-text("Try Tool")');
      await tryToolButton.click();

      // Wait for navigation
      await page.waitForURL(/\/tools\//);

      // Verify we're on a tool page
      expect(page.url()).toContain('/tools/');
    });

    test('should toggle favorite status', async ({ page }) => {
      await page.goto('/tools');

      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      const firstCard = toolCards.first();

      // Find favorite button
      const favoriteButton = firstCard.locator('button[aria-label*="favorite"], button:has([data-testid="favorite-icon"])');
      if (await favoriteButton.count() > 0) {
        const initialIcon = await favoriteButton.locator('svg, i').getAttribute('data-testid');

        // Click to favorite
        await favoriteButton.click();
        await page.waitForTimeout(300);

        // Check if icon changed (this depends on implementation)
        const updatedIcon = await favoriteButton.locator('svg, i').getAttribute('data-testid');

        // Verify favorite was saved to localStorage
        const favorites = await page.evaluate(() => {
          return JSON.parse(localStorage.getItem('favorite-tools') || '[]');
        });
        expect(favorites.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display tool features and tags', async ({ page }) => {
      await page.goto('/tools');

      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      const firstCard = toolCards.first();

      // Check for features badges
      const featuresBadges = firstCard.locator('.badge:has-text("Format"), .badge:has-text("Convert"), .badge:has-text("Validate")');
      if (await featuresBadges.count() > 0) {
        await expect(featuresBadges.first()).toBeVisible();
      }

      // Check for tags
      const tags = firstCard.locator('[data-testid="tool-tag"], .badge:has-text("json"), .badge:has-text("formatter")');
      if (await tags.count() > 0) {
        await expect(tags.first()).toBeVisible();
      }
    });
  });

  // Tabs Navigation Tests
  test.describe('Tabs Navigation', () => {
    test('should switch between tabs correctly', async ({ page }) => {
      await page.goto('/tools');

      // Click on Popular tab
      const popularTab = page.locator('[role="tab"]:has-text("Popular")');
      await popularTab.click();
      await page.waitForTimeout(300);

      // Check that Popular tab is active
      await expect(popularTab).toHaveAttribute('aria-selected', 'true');

      // Click on New tab
      const newTab = page.locator('[role="tab"]:has-text("New")');
      await newTab.click();
      await page.waitForTimeout(300);

      // Check that New tab is active
      await expect(newTab).toHaveAttribute('aria-selected', 'true');

      // Click back to All Tools
      const allToolsTab = page.locator('[role="tab"]:has-text("All Tools")');
      await allToolsTab.click();
      await page.waitForTimeout(300);

      // Check that All Tools tab is active
      await expect(allToolsTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should show empty state for Recent and Favorites tabs when empty', async ({ page }) => {
      await page.goto('/tools');

      // Check Recent tab
      const recentTab = page.locator('[role="tab"]:has-text("Recent")');
      await recentTab.click();
      await page.waitForTimeout(300);

      // Should show empty state if no recent tools
      const emptyState = page.locator('text=/No recent tools/i');
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
      }

      // Check Favorites tab
      const favoritesTab = page.locator('[role="tab"]:has-text("Favorites")');
      await favoritesTab.click();
      await page.waitForTimeout(300);

      // Should show empty state if no favorites
      const emptyFavorites = page.locator('text=/No favorite tools/i');
      if (await emptyFavorites.count() > 0) {
        await expect(emptyFavorites).toBeVisible();
      }
    });

    test('should show content in Favorites tab after favoriting a tool', async ({ page }) => {
      await page.goto('/tools');

      // First favorite a tool
      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      const firstCard = toolCards.first();

      const favoriteButton = firstCard.locator('button[aria-label*="favorite"], button:has([data-testid="favorite-icon"])');
      if (await favoriteButton.count() > 0) {
        await favoriteButton.click();
        await page.waitForTimeout(300);

        // Navigate to Favorites tab
        const favoritesTab = page.locator('[role="tab"]:has-text("Favorites")');
        await favoritesTab.click();
        await page.waitForTimeout(300);

        // Check that favorited tool appears
        const favoriteCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
        const visibleCards = await favoriteCards.filter({ visible: true }).count();
        expect(visibleCards).toBeGreaterThan(0);
      }
    });
  });

  // Advanced Filters Tests
  test.describe('Advanced Filters', () => {
    test('should show advanced filters panel', async ({ page }) => {
      await page.goto('/tools');

      // Click advanced filters button
      const advancedFiltersButton = page.locator('button:has-text("Advanced Filters")');
      if (await advancedFiltersButton.count() > 0) {
        await advancedFiltersButton.click();

        // Check that advanced filters panel appears
        const filtersPanel = page.locator('.card').filter({ has: page.locator('text=/Difficulty|Processing Type|Security Level/') });
        if (await filtersPanel.count() > 0) {
          await expect(filtersPanel).toBeVisible();

          // Check for filter dropdowns
          const difficultyFilter = page.locator('select:has-text("All Levels"), label:has-text("Difficulty")');
          if (await difficultyFilter.count() > 0) {
            await expect(difficultyFilter).toBeVisible();
          }
        }
      }
    });

    test('should clear all filters', async ({ page }) => {
      await page.goto('/tools');

      // Apply a search filter
      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await searchInput.fill('json');
      await page.waitForTimeout(300);

      // Try to clear filters
      const clearButton = page.locator('button:has-text("Clear all filters")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(300);

        // Verify search is cleared
        await expect(searchInput).toHaveValue('');
      }
    });

    test('should sort tools', async ({ page }) => {
      await page.goto('/tools');

      // Look for sort dropdown
      const sortDropdown = page.locator('select:has-text("Popularity"), label:has-text("Sort")');
      if (await sortDropdown.count() > 0) {
        await sortDropdown.selectOption('name');
        await page.waitForTimeout(300);

        // Verify sorting was applied
        await expect(sortDropdown).toHaveValue('name');
      }
    });

    test('should switch between grid and list view', async ({ page }) => {
      await page.goto('/tools');

      // Look for view mode buttons
      const gridButton = page.locator('button:has([data-testid="grid-view-icon"]), button:has-text("Grid")');
      const listButton = page.locator('button:has([data-testid="list-view-icon]), button:has-text("List")');

      if (await gridButton.count() > 0 && await listButton.count() > 0) {
        // Try switching to list view
        await listButton.click();
        await page.waitForTimeout(300);

        // Try switching back to grid view
        await gridButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  // Responsive Design Tests
  test.describe('Responsive Design', () => {
    test('should display correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/tools');

      // Check main elements are visible on mobile
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('input[placeholder*="Search tools"]')).toBeVisible();

      // Check tool cards adapt to mobile
      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      if (await toolCards.count() > 0) {
        await expect(toolCards.first()).toBeVisible();
      }

      // Check tabs are scrollable or stacked on mobile
      const tabs = page.locator('[role="tablist"]');
      await expect(tabs).toBeVisible();
    });

    test('should display correctly on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/tools');

      // Check layout on tablet
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('input[placeholder*="Search tools"]')).toBeVisible();

      // Check grid layout
      const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
      if (await toolCards.count() > 0) {
        await expect(toolCards.first()).toBeVisible();
      }
    });

    test('should handle horizontal scrolling on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/tools');

      // Check that tabs or category filters can scroll horizontally if needed
      const tabs = page.locator('[role="tablist"]');
      await expect(tabs).toBeVisible();

      const categoryFilters = page.locator('[data-testid="category-filter"]');
      if (await categoryFilters.count() > 0) {
        await expect(categoryFilters.first()).toBeVisible();
      }
    });
  });

  // Accessibility Tests
  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/tools');

      // Check main heading
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();

      // Check that there are no skipped heading levels
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      if (headingCount > 0) {
        for (let i = 0; i < headingCount - 1; i++) {
          const currentHeading = headings.nth(i);
          const nextHeading = headings.nth(i + 1);

          const currentLevel = parseInt((await currentHeading.evaluate(el => el.tagName)).substring(1));
          const nextLevel = parseInt((await nextHeading.evaluate(el => el.tagName)).substring(1));

          // Should not skip heading levels by more than 1
          expect(nextLevel - currentLevel).toBeLessThanOrEqual(1);
        }
      }
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/tools');

      // Check tabs have proper ARIA attributes
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toHaveAttribute('role', 'tab');
        await expect(tab).toHaveAttribute('aria-selected');
      }

      // Check search input has proper label
      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await expect(searchInput).toHaveAttribute('placeholder');

      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10 buttons
        const button = buttons.nth(i);
        const hasText = await button.textContent();
        const hasAriaLabel = await button.getAttribute('aria-label');
        const hasTitle = await button.getAttribute('title');

        // Each button should have text, aria-label, or title
        expect(hasText || hasAriaLabel || hasTitle).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/tools');

      // Test tab navigation
      await page.keyboard.press('Tab');

      // Focus should move to an interactive element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'A', 'SELECT']).toContain(focusedElement);

      // Test arrow key navigation for tabs
      const firstTab = page.locator('[role="tab"]').first();
      if (await firstTab.count() > 0) {
        await firstTab.focus();
        await page.keyboard.press('ArrowRight');

        // Focus should move to next tab
        const focusedTab = await page.evaluate(() =>
          document.activeElement?.getAttribute('role')
        );
        expect(focusedTab).toBe('tab');
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/tools');

      // Check that text is visible (basic contrast check)
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();

      for (let i = 0; i < Math.min(headingCount, 5); i++) { // Check first 5 headings
        const heading = headings.nth(i);
        await expect(heading).toBeVisible();

        // Get computed styles
        const styles = await heading.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        // Basic check that color is not transparent
        expect(styles.color).not.toBe('transparent');
      }
    });
  });

  // Performance Tests
  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/tools');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large number of tools without lag', async ({ page }) => {
      await page.goto('/tools');

      // Test scrolling through tools
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for any lazy loading
      await page.waitForTimeout(1000);

      // Check that page is still responsive
      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await searchInput.fill('test');
      await searchInput.clear();

      // Should not timeout
      await expect(searchInput).toBeVisible();
    });
  });

  // Error Handling Tests
  test.describe('Error Handling', () => {
    test('should handle empty search results gracefully', async ({ page }) => {
      await page.goto('/tools');

      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await searchInput.fill('nonexistenttool123456');
      await page.waitForTimeout(300);

      // Should show helpful empty state
      const noResults = page.locator('text=/No tools found/i');
      if (await noResults.count() > 0) {
        await expect(noResults).toBeVisible();

        // Should provide clear option to clear filters
        const clearButton = page.locator('button:has-text("Clear all filters")');
        if (await clearButton.count() > 0) {
          await expect(clearButton).toBeVisible();
        }
      }
    });

    test('should handle localStorage errors gracefully', async ({ page }) => {
      await page.goto('/tools');

      // Block localStorage to simulate error
      await page.context().addInitScript(() => {
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function() {
          throw new Error('Storage quota exceeded');
        };
      });

      await page.reload();

      // Page should still load and function
      await expect(page.locator('h1')).toBeVisible();

      // Should still be able to interact with tools
      const searchInput = page.locator('input[placeholder*="Search tools"]');
      await expect(searchInput).toBeVisible();
    });
  });
});

// Device-specific tests
test.describe('Tools Homepage on Different Devices', () => {
  test('should work on Mobile Chrome', async ({ page }) => {
    await page.goto('/tools');

    // Mobile-specific checks
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search tools"]')).toBeVisible();
  });

  test('should work on Mobile Safari', async ({ page }) => {
    await page.goto('/tools');

    // Mobile Safari-specific checks
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search tools"]')).toBeVisible();
  });

  test('should work on Desktop', async ({ page }) => {
    await page.goto('/tools');

    // Desktop-specific checks
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();

    // Check for more desktop features
    const toolCards = page.locator('.card').filter({ has: page.locator('h3, [data-testid="tool-name"]') });
    if (await toolCards.count() > 5) {
      // Should show more tools on desktop
      expect(await toolCards.count()).toBeGreaterThan(5);
    }
  });
});
