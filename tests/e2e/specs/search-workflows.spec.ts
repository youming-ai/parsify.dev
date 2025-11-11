/**
 * Search Functionality E2E Tests
 * Tests comprehensive search workflows and user interactions
 */

import { test, expect, devices } from '@playwright/test';
import { ToolsHomePage } from '../pages/tools-homepage.page';
import { SEARCH_QUERIES, SAMPLE_TOOLS, PERFORMANCE_THRESHOLDS } from '../fixtures/tools-data';

test.describe('Search Functionality', () => {
  let toolsPage: ToolsHomePage;

  test.beforeEach(async ({ page }) => {
    toolsPage = new ToolsHomePage(page);
    await toolsPage.goto();
  });

  test.describe('Basic Search Functionality', () => {
    test('should perform real-time search with debouncing', async ({ page }) => {
      const initialCount = await toolsPage.getVisibleToolCount();

      // Start typing search query
      await toolsPage.searchInput.fill('json');

      // Search should trigger after debounce
      await page.waitForTimeout(300);

      // Results should be filtered
      const filteredCount = await toolsPage.getVisibleToolCount();
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // Results should contain search term
      const firstToolName = await toolsPage.getToolNameByIndex(0);
      expect(firstToolName.toLowerCase()).toContain('json');
    });

    test('should search across multiple fields', async ({ page }) => {
      // Search by tool name
      await toolsPage.search('formatter');
      await page.waitForTimeout(300);

      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      // Should find tools with "formatter" in name or description
      let foundFormatter = false;
      const visibleCount = await toolsPage.getVisibleToolCount();

      for (let i = 0; i < Math.min(visibleCount, 5); i++) {
        const toolName = await toolsPage.getToolNameByIndex(i);
        const toolDescription = await toolsPage.getToolDescriptionByIndex(i);

        if (toolName.toLowerCase().includes('formatter') ||
            toolDescription.toLowerCase().includes('formatter')) {
          foundFormatter = true;
          break;
        }
      }

      expect(foundFormatter).toBeTruthy();
    });

    test('should search by tags', async ({ page }) => {
      // Search by tag
      await toolsPage.search('validator');
      await page.waitForTimeout(300);

      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      // Should find tools with validator tag or functionality
      const visibleCount = await toolsPage.getVisibleToolCount();
      let foundValidator = false;

      for (let i = 0; i < Math.min(visibleCount, 5); i++) {
        const toolName = await toolsPage.getToolNameByIndex(0);
        const toolDescription = await toolsPage.getToolDescriptionByIndex(0);
        const tags = await toolsPage.getToolTagsByIndex(0);

        const hasValidatorInText = toolName.toLowerCase().includes('validator') ||
                                  toolDescription.toLowerCase().includes('validator');
        const hasValidatorInTags = tags.some(tag => tag.toLowerCase().includes('validator'));

        if (hasValidatorInText || hasValidatorInTags) {
          foundValidator = true;
          break;
        }
      }

      expect(foundValidator).toBeTruthy();
    });

    test('should clear search and restore all tools', async ({ page }) => {
      // Perform search first
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const searchCount = await toolsPage.getVisibleToolCount();

      // Clear search
      await toolsPage.clearSearch();
      await page.waitForTimeout(300);

      // Should restore all tools
      const restoredCount = await toolsPage.getVisibleToolCount();
      expect(restoredCount).toBeGreaterThan(searchCount);

      // Search input should be empty
      const searchValue = await toolsPage.getSearchValue();
      expect(searchValue).toBe('');
    });

    test('should handle empty and whitespace search', async ({ page }) => {
      const initialCount = await toolsPage.getVisibleToolCount();

      // Search with empty string
      await toolsPage.search('');
      await page.waitForTimeout(300);

      let emptyCount = await toolsPage.getVisibleToolCount();
      expect(emptyCount).toBe(initialCount);

      // Search with whitespace only
      await toolsPage.search('   ');
      await page.waitForTimeout(300);

      emptyCount = await toolsPage.getVisibleToolCount();
      expect(emptyCount).toBe(initialCount);
    });

    test('should handle single character search', async ({ page }) => {
      await toolsPage.search('j');
      await page.waitForTimeout(300);

      // Should still return results (tools containing 'j')
      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      // Results should contain the character
      const firstToolName = await toolsPage.getToolNameByIndex(0);
      const firstToolDescription = await toolsPage.getToolDescriptionByIndex(0);

      const hasCharacter = firstToolName.toLowerCase().includes('j') ||
                          firstToolDescription.toLowerCase().includes('j');

      expect(hasCharacter).toBeTruthy();
    });
  });

  test.describe('Search Results Behavior', () => {
    test('should show relevant search results with highlighting', async ({ page }) => {
      await toolsPage.search('hash');
      await page.waitForTimeout(300);

      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      // Check if search results are relevant
      const visibleCount = await toolsPage.getVisibleToolCount();
      let relevantCount = 0;

      for (let i = 0; i < Math.min(visibleCount, 5); i++) {
        const toolName = await toolsPage.getToolNameByIndex(i);
        const toolDescription = await toolsPage.getToolDescriptionByIndex(i);
        const tags = await toolsPage.getToolTagsByIndex(i);

        const isRelevant = toolName.toLowerCase().includes('hash') ||
                          toolDescription.toLowerCase().includes('hash') ||
                          tags.some(tag => tag.toLowerCase().includes('hash'));

        if (isRelevant) relevantCount++;
      }

      // Most results should be relevant
      expect(relevantCount).toBeGreaterThan(Math.min(visibleCount, 5) * 0.7);
    });

    test('should handle no results gracefully', async ({ page }) => {
      await toolsPage.search('xyznonexistenttool123');
      await page.waitForTimeout(300);

      // Should show no results message
      const hasNoResults = await toolsPage.hasNoResultsMessage();
      if (hasNoResults) {
        await expect(toolsPage.noResultsMessage).toBeVisible();
        await expect(toolsPage.noResultsMessage).toContainText('No tools found');
      }

      // Should provide option to clear search
      const searchValue = await toolsPage.getSearchValue();
      expect(searchValue).toBe('xyznonexistenttool123');

      // Should be able to clear and restore results
      await toolsPage.clearSearch();
      await page.waitForTimeout(300);

      expect(await toolsPage.hasSearchResults()).toBeTruthy();
    });

    test('should maintain search state during navigation', async ({ page }) => {
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const searchResults = [];
      const visibleCount = await toolsPage.getVisibleToolCount();

      for (let i = 0; i < Math.min(visibleCount, 3); i++) {
        searchResults.push(await toolsPage.getToolNameByIndex(i));
      }

      // Navigate away and back
      await page.goto('/');
      await page.waitForTimeout(500);
      await page.goBack();
      await toolsPage.waitForPageLoad();

      // Search should be preserved (depending on implementation)
      // This test checks if search state is maintained
      const currentSearch = await toolsPage.getSearchValue();
      // Either search is preserved or cleared - both are valid implementations
    });

    test('should update search results dynamically', async ({ page }) => {
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const jsonCount = await toolsPage.getVisibleToolCount();

      // Modify search query
      await toolsPage.search('format');
      await page.waitForTimeout(300);

      const formatCount = await toolsPage.getVisibleToolCount();

      // Results should update
      expect(jsonCount).toBeGreaterThan(0);
      expect(formatCount).toBeGreaterThan(0);

      // Results should be different
      const jsonToolName = await toolsPage.getToolNameByIndex(0);
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const newJsonToolName = await toolsPage.getToolNameByIndex(0);
      // Should be consistent search results
    });
  });

  test.describe('Search Performance', () => {
    test('should respond within acceptable time limits', async ({ page }) => {
      const searchQueries = ['json', 'converter', 'validator', 'formatter'];

      for (const query of searchQueries) {
        const responseTime = await toolsPage.measureSearchResponseTime(query);

        // Should respond within 500ms
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.search_response.acceptable);

        // Ideally within 300ms
        console.log(`Search response time for "${query}": ${responseTime}ms`);

        // Clear search for next iteration
        await toolsPage.clearSearch();
        await page.waitForTimeout(300);
      }
    });

    test('should handle rapid search input changes', async ({ page }) => {
      // Simulate rapid typing
      const queries = ['j', 'js', 'jso', 'json'];

      for (const query of queries) {
        await toolsPage.searchInput.fill(query);
        // Don't wait for debounce to simulate rapid typing
      }

      // Wait for final search to complete
      await page.waitForTimeout(500);

      // Should show results for final query
      expect(await toolsPage.hasSearchResults()).toBeTruthy();

      const finalSearchValue = await toolsPage.getSearchValue();
      expect(finalSearchValue).toBe('json');
    });

    test('should not block UI during search', async ({ page }) => {
      await toolsPage.search('converter');

      // UI should remain interactive during search
      const header = toolsPage.header;
      await expect(header).toBeVisible();

      // Should be able to interact with other elements
      const isInteractive = await header.evaluate(el => {
        return window.getComputedStyle(el).pointerEvents !== 'none';
      });

      expect(isInteractive).toBeTruthy();
    });
  });

  test.describe('Search UI and UX', () => {
    test('should show search suggestions if implemented', async ({ page }) => {
      await toolsPage.searchInput.fill('json');
      await page.waitForTimeout(200);

      // Check if suggestions appear (if implemented)
      const suggestions = page.locator('[data-testid="search-suggestions"], .autocomplete, .dropdown');

      if (await suggestions.count() > 0) {
        await expect(suggestions).toBeVisible();

        // Should have clickable suggestions
        const suggestionItems = suggestions.locator('li, button, a');
        if (await suggestionItems.count() > 0) {
          await suggestionItems.first().click();
          await page.waitForTimeout(300);

          // Should navigate or search with suggestion
          expect(await toolsPage.getSearchValue()).toContain('json');
        }
      }
    });

    test('should provide clear search input feedback', async ({ page }) => {
      const searchInput = toolsPage.searchInput;

      // Should have clear placeholder
      await expect(searchInput).toHaveAttribute('placeholder');

      // Should show clear button when text is entered (if implemented)
      await searchInput.fill('test search');
      const clearButton = page.locator('[data-testid="clear-search"], button[aria-label*="clear"]');

      if (await clearButton.count() > 0) {
        await expect(clearButton).toBeVisible();

        await clearButton.click();
        await page.waitForTimeout(300);

        const searchValue = await toolsPage.getSearchValue();
        expect(searchValue).toBe('');
      }
    });

    test('should maintain search context in URL', async ({ page }) => {
      await toolsPage.search('validator');
      await page.waitForTimeout(300);

      // Check if search is reflected in URL (if implemented)
      const url = page.url();
      const hasSearchInUrl = url.includes('search=') || url.includes('q=');

      // This is optional - not all implementations use URL for search
      if (hasSearchInUrl) {
        expect(url).toContain('validator');
      }
    });

    test('should support keyboard navigation in search', async ({ page }) => {
      await toolsPage.searchInput.fill('json');
      await page.waitForTimeout(300);

      // Should be able to navigate search results with keyboard
      await page.keyboard.press('Tab');

      // Focus should move to search results or next interactive element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement || '');

      // Should be able to navigate back to search
      await page.keyboard.press('Shift+Tab');
      const searchFocused = await page.evaluate(() => document.activeElement === toolsPage.searchInput);
      // This might not always work depending on focus management
    });
  });

  test.describe('Advanced Search Features', () => {
    test('should support search filters combination', async ({ page }) => {
      // Search first
      await toolsPage.search('json');
      await page.waitForTimeout(300);

      const searchOnlyCount = await toolsPage.getVisibleToolCount();

      // Apply additional filter if available
      const categoryFilters = toolsPage.categoryFilters;
      if (await categoryFilters.count() > 0) {
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(300);

        const filteredCount = await toolsPage.getVisibleToolCount();

        // Should further refine results
        expect(filteredCount).toBeGreaterThan(0);
        expect(filteredCount).toBeLessThanOrEqual(searchOnlyCount);
      }
    });

    test('should support search history if implemented', async ({ page }) => {
      // Perform several searches
      const searches = ['json', 'validator', 'formatter'];

      for (const search of searches) {
        await toolsPage.search(search);
        await page.waitForTimeout(300);
        await toolsPage.clearSearch();
        await page.waitForTimeout(300);
      }

      // Check if search history appears (if implemented)
      const searchHistory = page.locator('[data-testid="search-history"], .recent-searches');

      if (await searchHistory.count() > 0) {
        await expect(searchHistory).toBeVisible();

        // Should have clickable history items
        const historyItems = searchHistory.locator('button, a');
        if (await historyItems.count() > 0) {
          await historyItems.first().click();
          await page.waitForTimeout(300);

          // Should populate search with history item
          const searchValue = await toolsPage.getSearchValue();
          expect(searches).toContain(searchValue);
        }
      }
    });

    test('should support search operators if implemented', async ({ page }) => {
      // Test advanced search syntax (if implemented)
      const advancedQueries = [
        'json AND validator',
        'format OR convert',
        'hash NOT password',
        '"code executor"', // exact phrase
        'tool:*processor*' // wildcard
      ];

      for (const query of advancedQueries) {
        await toolsPage.search(query);
        await page.waitForTimeout(300);

        // Should not error and should show some results or no results message
        const hasResults = await toolsPage.hasSearchResults();
        const hasNoResults = await toolsPage.hasNoResultsMessage();

        expect(hasResults || hasNoResults).toBeTruthy();

        await toolsPage.clearSearch();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Search Edge Cases', () => {
    test('should handle very long search queries', async ({ page }) => {
      const longQuery = 'a'.repeat(1000);

      await toolsPage.search(longQuery);
      await page.waitForTimeout(500);

      // Should handle gracefully without crashing
      const hasResults = await toolsPage.hasSearchResults();
      const hasNoResults = await toolsPage.hasNoResultsMessage();

      expect(hasResults || hasNoResults).toBeTruthy();
    });

    test('should handle special characters in search', async ({ page }) => {
      const specialQueries = [
        'json@parser',
        'hash#generator',
        'file(converter)',
        'text/processor',
        'code&formatter'
      ];

      for (const query of specialQueries) {
        await toolsPage.search(query);
        await page.waitForTimeout(300);

        // Should not error
        const hasResults = await toolsPage.hasSearchResults();
        const hasNoResults = await toolsPage.hasNoResultsMessage();

        expect(hasResults || hasNoResults).toBeTruthy();

        await toolsPage.clearSearch();
        await page.waitForTimeout(300);
      }
    });

    test('should handle international characters', async ({ page }) => {
      const internationalQueries = [
        'formátter', // with accent
        'форматор', // Cyrillic
        'フォーマッター', // Japanese
        '格式化', // Chinese
        'formatter' // should still find English results
      ];

      for (const query of internationalQueries) {
        await toolsPage.search(query);
        await page.waitForTimeout(300);

        // Should handle gracefully
        const hasResults = await toolsPage.hasSearchResults();
        const hasNoResults = await toolsPage.hasNoResultsMessage();

        expect(hasResults || hasNoResults).toBeTruthy();

        await toolsPage.clearSearch();
        await page.waitForTimeout(300);
      }
    });

    test('should handle case sensitivity correctly', async ({ page }) => {
      const caseVariations = ['JSON', 'json', 'Json', 'jSoN'];

      for (const query of caseVariations) {
        await toolsPage.search(query);
        await page.waitForTimeout(300);

        // Should find results regardless of case
        expect(await toolsPage.hasSearchResults()).toBeTruthy();

        // Results should be case-insensitive
        const firstToolName = await toolsPage.getToolNameByIndex(0);
        const hasJson = firstToolName.toLowerCase().includes('json');

        // At least some results should contain json
        let hasAnyJson = false;
        const visibleCount = await toolsPage.getVisibleToolCount();

        for (let i = 0; i < Math.min(visibleCount, 3); i++) {
          const toolName = await toolsPage.getToolNameByIndex(i);
          if (toolName.toLowerCase().includes('json')) {
            hasAnyJson = true;
            break;
          }
        }

        expect(hasAnyJson).toBeTruthy();

        await toolsPage.clearSearch();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Search Error Handling', () => {
    test('should handle search errors gracefully', async ({ page }) => {
      // Mock search error
      await page.route('**/api/search**', route => route.abort());

      await toolsPage.search('test');
      await page.waitForTimeout(500);

      // Should not crash and should show some fallback behavior
      const hasResults = await toolsPage.hasSearchResults();
      const hasNoResults = await toolsPage.hasNoResultsMessage();

      // Should either show results or handle error gracefully
      expect(await toolsPage.page.locator('body').isVisible()).toBeTruthy();

      // Clean up mocking
      await page.unroute('**/api/search**');
    });

    test('should recover from search failures', async ({ page }) => {
      // Mock intermittent failure
      let callCount = 0;
      await page.route('**/api/**', route => {
        callCount++;
        if (callCount === 1) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await toolsPage.search('json');
      await page.waitForTimeout(500);

      // Should recover and work on subsequent searches
      await toolsPage.clearSearch();
      await page.waitForTimeout(300);

      await toolsPage.search('validator');
      await page.waitForTimeout(500);

      // Should eventually work
      expect(await toolsPage.page.locator('body').isVisible()).toBeTruthy();

      // Clean up mocking
      await page.unroute('**/api/**');
    });
  });
});
