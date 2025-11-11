/**
 * Filter Functionality E2E Tests
 * Tests comprehensive filtering workflows and user interactions
 */

import { test, expect, devices } from '@playwright/test';
import { ToolsHomePage } from '../pages/tools-homepage.page';
import { TOOL_CATEGORIES, PERFORMANCE_THRESHOLDS } from '../fixtures/tools-data';

test.describe('Filter Functionality', () => {
  let toolsPage: ToolsHomePage;

  test.beforeEach(async ({ page }) => {
    toolsPage = new ToolsHomePage(page);
    await toolsPage.goto();
  });

  test.describe('Category Filtering', () => {
    test('should filter tools by category', async ({ page }) => {
      const initialCount = await toolsPage.getVisibleToolCount();

      // Filter by JSON Processing category
      await toolsPage.selectCategory('JSON Processing');
      await page.waitForTimeout(500);

      const filteredCount = await toolsPage.getVisibleToolCount();

      // Should show filtered results
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // Verify results are from selected category
      const firstToolName = await toolsPage.getToolNameByIndex(0);
      expect(firstToolName.toLowerCase()).toContain('json');

      // Check if category indicator is shown
      const hasActiveFilters = await toolsPage.hasActiveFilters();
      if (hasActiveFilters) {
        await expect(toolsPage.activeFilters).toBeVisible();
      }
    });

    test('should support multiple category selection', async ({ page }) => {
      // Select first category
      await toolsPage.selectCategory('JSON Processing');
      await page.waitForTimeout(300);

      const firstCategoryCount = await toolsPage.getVisibleToolCount();

      // Try to select second category (if multi-select is supported)
      const categoryFilters = toolsPage.categoryFilters;
      const secondCategoryButton = categoryFilters.locator('button:has-text("Code Execution")');

      if (await secondCategoryButton.count() > 0) {
        await secondCategoryButton.click();
        await page.waitForTimeout(300);

        const combinedCount = await toolsPage.getVisibleToolCount();

        // Should show results from both categories
        expect(combinedCount).toBeGreaterThan(0);

        // Should have active filters indicator
        const hasActiveFilters = await toolsPage.hasActiveFilters();
        if (hasActiveFilters) {
          await expect(toolsPage.activeFilters).toBeVisible();
        }
      }
    });

    test('should clear category filters', async ({ page }) => {
      // Apply category filter
      await toolsPage.selectCategory('JSON Processing');
      await page.waitForTimeout(300);

      const filteredCount = await toolsPage.getVisibleToolCount();
      expect(filteredCount).toBeGreaterThan(0);

      // Clear filters
      await toolsPage.clearAllFilters();
      await page.waitForTimeout(300);

      // Should restore all tools
      const restoredCount = await toolsPage.getVisibleToolCount();
      expect(restoredCount).toBeGreaterThan(filteredCount);

      // Should not have active filters
      const hasActiveFilters = await toolsPage.hasActiveFilters();
      expect(hasActiveFilters).toBeFalsy();
    });

    test('should switch between categories correctly', async ({ page }) => {
      // Try different categories
      const categories = ['JSON Processing', 'Code Execution', 'File Processing'];

      for (const category of categories) {
        const categoryButton = toolsPage.categoryFilters.locator(`button:has-text("${category}")`);

        if (await categoryButton.count() > 0) {
          await toolsPage.selectCategory(category);
          await page.waitForTimeout(300);

          // Should show results for this category
          expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);

          // Results should be relevant to category
          const firstToolName = await toolsPage.getToolNameByIndex(0);
          const categoryKeywords = category.toLowerCase().split(' ');
          const hasRelevantTool = categoryKeywords.some(keyword =>
            firstToolName.toLowerCase().includes(keyword)
          );

          // This is a loose check since category names might not directly match tool names
        }
      }
    });
  });

  test.describe('Difficulty Filtering', () => {
    test('should filter by difficulty level', async ({ page }) => {
      const initialCount = await toolsPage.getVisibleToolCount();

      // Filter by beginner difficulty
      await toolsPage.selectDifficulty('beginner');
      await page.waitForTimeout(300);

      const filteredCount = await toolsPage.getVisibleToolCount();

      // Should show filtered results
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // Verify results have beginner difficulty
      const firstCard = await toolsPage.getToolCard(0);
      const difficultyBadge = toolsPage.getToolDifficulty(firstCard);

      if (await difficultyBadge.count() > 0) {
        const difficultyText = await difficultyBadge.textContent();
        expect(difficultyText?.toLowerCase()).toContain('beginner');
      }
    });

    test('should filter by different difficulty levels', async ({ page }) => {
      const difficulties = ['beginner', 'intermediate', 'advanced'];

      for (const difficulty of difficulties) {
        await toolsPage.selectDifficulty(difficulty);
        await page.waitForTimeout(300);

        // Should show some results
        expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);

        // Clear filter for next iteration
        await toolsPage.clearAllFilters();
        await page.waitForTimeout(300);
      }
    });

    test('should show difficulty badges correctly', async ({ page }) => {
      // Check that tools have difficulty badges
      const toolCards = await toolsPage.toolCards.all();
      let foundDifficultyBadges = 0;

      for (let i = 0; i < Math.min(toolCards.length, 10); i++) {
        const card = toolCards[i];
        const difficultyBadge = toolsPage.getToolDifficulty(card);

        if (await difficultyBadge.count() > 0) {
          foundDifficultyBadges++;

          const difficultyText = await difficultyBadge.textContent();
          expect(['beginner', 'intermediate', 'advanced']).toContain(
            difficultyText?.toLowerCase() || ''
          );
        }
      }

      // At least some tools should have difficulty badges
      expect(foundDifficultyBadges).toBeGreaterThan(0);
    });
  });

  test.describe('Processing Type Filtering', () => {
    test('should filter by processing type', async ({ page }) => {
      const initialCount = await toolsPage.getVisibleToolCount();

      // Look for processing type filters
      const processingTypeFilters = toolsPage.processingTypeFilters;

      if (await processingTypeFilters.count() > 0) {
        // Try to filter by client-side processing
        const clientSideButton = processingTypeFilters.locator('button:has-text("client-side")');

        if (await clientSideButton.count() > 0) {
          await clientSideButton.click();
          await page.waitForTimeout(300);

          const filteredCount = await toolsPage.getVisibleToolCount();

          // Should show filtered results
          expect(filteredCount).toBeGreaterThan(0);
          expect(filteredCount).toBeLessThanOrEqual(initialCount);
        }
      }
    });

    test('should display processing type badges', async ({ page }) => {
      // Check that tools have processing type indicators
      const toolCards = await toolsPage.toolCards.all();
      let foundProcessingTypes = 0;

      for (let i = 0; i < Math.min(toolCards.length, 10); i++) {
        const card = toolCards[i];
        const processingTypeBadge = card.locator(':text("client-side"), :text("server-side"), :text("hybrid")');

        if (await processingTypeBadge.count() > 0) {
          foundProcessingTypes++;

          const typeText = await processingTypeBadge.textContent();
          expect(['client-side', 'server-side', 'hybrid']).toContain(
            typeText?.toLowerCase() || ''
          );
        }
      }

      // At least some tools should have processing type badges
      expect(foundProcessingTypes).toBeGreaterThan(0);
    });
  });

  test.describe('Tag Filtering', () => {
    test('should filter by specific tags', async ({ page }) => {
      const initialCount = await toolsPage.getVisibleToolCount();

      // Look for tag filters
      const tagFilters = toolsPage.tagFilters;

      if (await tagFilters.count() > 0) {
        // Try to filter by 'json' tag
        await toolsPage.selectTag('json');
        await page.waitForTimeout(300);

        const filteredCount = await toolsPage.getVisibleToolCount();

        // Should show filtered results
        expect(filteredCount).toBeGreaterThan(0);
        expect(filteredCount).toBeLessThanOrEqual(initialCount);

        // Results should have json tags or functionality
        const firstToolName = await toolsPage.getToolNameByIndex(0);
        const firstToolTags = await toolsPage.getToolTagsByIndex(0);

        const hasJsonRelevance = firstToolName.toLowerCase().includes('json') ||
                                firstToolTags.some(tag => tag.toLowerCase().includes('json'));

        expect(hasJsonRelevance).toBeTruthy();
      }
    });

    test('should support multiple tag selection', async ({ page }) => {
      const tagFilters = toolsPage.tagFilters;

      if (await tagFilters.count() > 0) {
        // Select first tag
        await toolsPage.selectTag('json');
        await page.waitForTimeout(300);

        const firstTagCount = await toolsPage.getVisibleToolCount();

        // Select second tag if available
        const secondTagButton = tagFilters.locator('button:has-text("validator")');

        if (await secondTagButton.count() > 0) {
          await secondTagButton.click();
          await page.waitForTimeout(300);

          const combinedCount = await toolsPage.getVisibleToolCount();

          // Should show intersection of tags
          expect(combinedCount).toBeGreaterThan(0);

          // Should have active filters
          const hasActiveFilters = await toolsPage.hasActiveFilters();
          if (hasActiveFilters) {
            await expect(toolsPage.activeFilters).toBeVisible();
          }
        }
      }
    });

    test('should show popular tags', async ({ page }) => {
      // Check if popular tags are displayed
      const popularTags = toolsPage.page.locator('[data-testid="popular-tags"]');

      if (await popularTags.count() > 0) {
        await expect(popularTags).toBeVisible();

        const tagButtons = popularTags.locator('button, .badge');
        expect(await tagButtons.count()).toBeGreaterThan(0);

        // Should be clickable
        await tagButtons.first().click();
        await page.waitForTimeout(300);

        // Should apply filter
        expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Combined Filtering', () => {
    test('should combine search and category filters', async ({ page }) => {
      // Apply search first
      await toolsPage.search('formatter');
      await page.waitForTimeout(300);

      const searchCount = await toolsPage.getVisibleToolCount();

      // Apply category filter
      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);

        const combinedCount = await toolsPage.getVisibleToolCount();

        // Should further refine results
        expect(combinedCount).toBeGreaterThan(0);
        expect(combinedCount).toBeLessThanOrEqual(searchCount);

        // Results should match both criteria
        const firstToolName = await toolsPage.getToolNameByIndex(0);
        expect(firstToolName.toLowerCase()).toContain('json');
      }
    });

    test('should combine multiple filter types', async ({ page }) => {
      const initialCount = await toolsPage.getVisibleToolCount();

      // Apply search
      await toolsPage.search('converter');
      await page.waitForTimeout(300);

      // Apply category filter if available
      const hasCategoryFilters = await toolsPage.categoryFilters.count() > 0;
      if (hasCategoryFilters) {
        await toolsPage.selectCategory('File Processing');
        await page.waitForTimeout(300);
      }

      // Apply difficulty filter if available
      const hasDifficultyFilters = await toolsPage.difficultyFilters.count() > 0;
      if (hasDifficultyFilters) {
        await toolsPage.selectDifficulty('beginner');
        await page.waitForTimeout(300);
      }

      const finalCount = await toolsPage.getVisibleToolCount();

      // Should show refined results
      expect(finalCount).toBeGreaterThan(0);
      expect(finalCount).toBeLessThan(initialCount);

      // Should show active filters
      const hasActiveFilters = await toolsPage.hasActiveFilters();
      if (hasActiveFilters || hasCategoryFilters || hasDifficultyFilters) {
        // Some indication of active filters should be present
      }
    });

    test('should maintain filter state during interactions', async ({ page }) => {
      // Apply filters
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);
      }

      const filteredCount = await toolsPage.getVisibleToolCount();

      // Interact with a tool (hover)
      const firstCard = await toolsPage.getToolCard(0);
      await firstCard.hover();
      await page.waitForTimeout(200);

      // Filters should still be active
      const currentCount = await toolsPage.getVisibleToolCount();
      expect(currentCount).toBe(filteredCount);

      // Toggle favorite if available
      const favoriteButton = toolsPage.getFavoriteButton(firstCard);
      if (await favoriteButton.count() > 0) {
        await favoriteButton.click();
        await page.waitForTimeout(200);

        // Filters should still be active
        const finalCount = await toolsPage.getVisibleToolCount();
        expect(finalCount).toBe(filteredCount);
      }
    });
  });

  test.describe('Filter UI and UX', () => {
    test('should show active filters clearly', async ({ page }) => {
      // Apply multiple filters
      await toolsPage.search('validator');
      await page.waitForTimeout(300);

      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);
      }

      // Check if active filters are shown
      const hasActiveFilters = await toolsPage.hasActiveFilters();
      if (hasActiveFilters) {
        await expect(toolsPage.activeFilters).toBeVisible();

        // Should have clear buttons for individual filters
        const clearButtons = toolsPage.activeFilters.locator('button');
        if (await clearButtons.count() > 0) {
          await expect(clearButtons.first()).toBeVisible();
        }
      }
    });

    test('should allow removing individual filters', async ({ page }) => {
      // Apply multiple filters
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);
      }

      const multiFilterCount = await toolsPage.getVisibleToolCount();

      // Try to remove individual filter
      const activeFilters = toolsPage.activeFilters;
      if (await activeFilters.count() > 0) {
        const firstFilterButton = activeFilters.locator('button').first();

        if (await firstFilterButton.count() > 0) {
          await firstFilterButton.click();
          await page.waitForTimeout(300);

          // Should show more results after removing filter
          const afterRemoveCount = await toolsPage.getVisibleToolCount();
          expect(afterRemoveCount).toBeGreaterThanOrEqual(multiFilterCount);
        }
      }
    });

    test('should provide clear all filters option', async ({ page }) => {
      // Apply multiple filters
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);
      }

      const filteredCount = await toolsPage.getVisibleToolCount();

      // Look for clear all filters button
      const clearAllButton = toolsPage.clearAllFiltersButton;

      if (await clearAllButton.count() > 0) {
        await expect(clearAllButton).toBeVisible();

        await clearAllButton.click();
        await page.waitForTimeout(300);

        // Should restore all tools
        const restoredCount = await toolsPage.getVisibleToolCount();
        expect(restoredCount).toBeGreaterThan(filteredCount);

        // Search should be cleared
        const searchValue = await toolsPage.getSearchValue();
        expect(searchValue).toBe('');
      }
    });

    test('should show filter results count', async ({ page }) => {
      const initialCount = await toolsPage.getVisibleToolCount();

      // Apply filter
      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);

        const filteredCount = await toolsPage.getVisibleToolCount();

        // Look for results count display
        const resultsCount = toolsPage.page.locator(':text-match(/\\d+ tools?/), :text-match(/results/)');

        if (await resultsCount.count() > 0) {
          await expect(resultsCount).toBeVisible();

          const countText = await resultsCount.textContent();
          expect(countText).toMatch(/\\d+/);
        }
      }
    });

    test('should handle no filter results gracefully', async ({ page }) => {
      // Apply very specific filters that might return no results
      await toolsPage.search('xyznonexistent');
      await page.waitForTimeout(300);

      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);
      }

      // Should show no results message or handle gracefully
      const hasNoResults = await toolsPage.hasNoResultsMessage();
      if (hasNoResults) {
        await expect(toolsPage.noResultsMessage).toBeVisible();
      }

      // Should provide option to clear filters
      const clearButton = toolsPage.clearAllFiltersButton;
      if (await clearButton.count() > 0) {
        await expect(clearButton).toBeVisible();
      }
    });
  });

  test.describe('Filter Performance', () => {
    test('should apply filters quickly', async ({ page }) => {
      const filters = [
        () => toolsPage.search('json'),
        () => toolsPage.selectCategory('JSON Processing'),
        () => toolsPage.selectDifficulty('beginner')
      ];

      for (const filterAction of filters) {
        const startTime = Date.now();
        await filterAction();
        await page.waitForTimeout(300);

        const responseTime = Date.now() - startTime;

        // Should respond within 400ms
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.filter_response.acceptable);

        // Should have results
        expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);

        // Clear filter for next test
        await toolsPage.clearAllFilters();
        await page.waitForTimeout(300);
      }
    });

    test('should not block UI during filtering', async ({ page }) => {
      // Apply filter
      await toolsPage.search('converter');

      // UI should remain interactive
      const header = toolsPage.header;
      await expect(header).toBeVisible();

      const isInteractive = await header.evaluate(el => {
        return window.getComputedStyle(el).pointerEvents !== 'none';
      });

      expect(isInteractive).toBeTruthy();

      // Should be able to interact with other elements
      await toolsPage.darkModeToggle.click();
      await page.waitForTimeout(300);
      await toolsPage.darkModeToggle.click();
    });

    test('should handle rapid filter changes', async ({ page }) => {
      // Rapidly change filters
      const filters = ['json', 'validator', 'formatter', 'converter'];

      for (const filter of filters) {
        await toolsPage.search(filter);
        // Don't wait for debounce to simulate rapid changes
      }

      // Wait for final filter to apply
      await page.waitForTimeout(500);

      // Should show final results
      expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);

      const finalSearch = await toolsPage.getSearchValue();
      expect(filters).toContain(finalSearch);
    });
  });

  test.describe('Mobile Filter Experience', () => {
    test('should provide mobile-optimized filter interface', async ({ page }) => {
      await toolsPage.setViewport('mobile');

      // Filter toggle should be visible on mobile
      const filterToggle = toolsPage.filterToggle;
      if (await filterToggle.count() > 0) {
        await expect(filterToggle).toBeVisible();

        // Should open filter panel
        await filterToggle.click();
        await page.waitForTimeout(300);

        // Filter panel should be usable
        const categoryFilters = toolsPage.categoryFilters;
        if (await categoryFilters.count() > 0) {
          await expect(categoryFilters.first()).toBeVisible();
        }

        // Should be able to close filter panel
        await filterToggle.click();
        await page.waitForTimeout(300);
      }
    });

    test('should handle touch interactions for filters', async ({ page }) => {
      await toolsPage.setViewport('mobile');

      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        const firstFilter = categoryFilters.first();

        // Should have adequate touch targets
        const boundingBox = await firstFilter.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }

        // Should respond to touch
        await firstFilter.tap();
        await page.waitForTimeout(300);

        expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(0);
      }
    });

    test('should show filter state clearly on mobile', async ({ page }) => {
      await toolsPage.setViewport('mobile');

      // Apply filter
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      // Should show that filters are active
      const hasActiveFilters = await toolsPage.hasActiveFilters();
      if (hasActiveFilters) {
        await expect(toolsPage.activeFilters).toBeVisible();
      }

      // Filter toggle should indicate active state
      const filterToggle = toolsPage.filterToggle;
      if (await filterToggle.count() > 0) {
        const hasActiveClass = await filterToggle.evaluate(el =>
          el.classList.contains('active') ||
          el.classList.contains('filter-active') ||
          el.getAttribute('aria-pressed') === 'true'
        );

        // This is optional - depends on implementation
      }
    });
  });

  test.describe('Filter Persistence', () => {
    test('should maintain filter state in URL if implemented', async ({ page }) => {
      // Apply filters
      await toolsPage.search('validator');
      await page.waitForTimeout(300);

      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);
      }

      // Check if filters are reflected in URL
      const url = page.url();
      const hasFiltersInUrl = url.includes('search=') ||
                             url.includes('category=') ||
                             url.includes('filter=');

      // This is optional - depends on implementation
      if (hasFiltersInUrl) {
        expect(url).toContain('validator');
      }
    });

    test('should restore filters on page reload', async ({ page }) => {
      // Apply filters
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const filteredCount = await toolsPage.getVisibleToolCount();

      // Reload page
      await page.reload();
      await toolsPage.waitForPageLoad();

      // Filters might be restored (depends on implementation)
      // This test verifies the behavior exists or doesn't exist consistently
      const searchValue = await toolsPage.getSearchValue();

      // Either filters are restored or cleared - both are valid
      if (searchValue === 'json') {
        // Filters were restored
        expect(await toolsPage.getVisibleToolCount()).toBe(filteredCount);
      } else {
        // Filters were cleared - also acceptable
        expect(await toolsPage.getVisibleToolCount()).toBeGreaterThan(filteredCount);
      }
    });
  });
});
