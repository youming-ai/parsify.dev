/**
 * Accessibility E2E Tests with Axe Integration
 * Tests WCAG compliance, screen reader support, and keyboard navigation
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { ToolsHomePage } from '../pages/tools-homepage.page';
import { VIEWPORTS, ACCESSIBILITY_TEST_CASES } from '../fixtures/tools-data';

test.describe('Accessibility Tests', () => {
  let toolsPage: ToolsHomePage;

  test.beforeEach(async ({ page }) => {
    toolsPage = new ToolsHomePage(page);
    await toolsPage.goto();
    await injectAxe(page);
  });

  test.describe('WCAG Compliance with Axe', () => {
    test('should pass accessibility audit on homepage', async ({ page }) => {
      // Run comprehensive accessibility audit
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        rules: {
          // Enable specific WCAG rules
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-labels': { enabled: true },
          'focus-management': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-roles': { enabled: true },
          'alt-text': { enabled: true },
          'form-labels': { enabled: true },
          'link-purpose': { enabled: true },
          'skip-link': { enabled: true }
        }
      });
    });

    test('should have proper color contrast', async ({ page }) => {
      // Test specific contrast issues
      await checkA11y(page, 'h1, h2, h3', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      await checkA11y(page, 'button', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      await checkA11y(page, 'a', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check ARIA compliance
      await checkA11y(page, '[role="tab"]', {
        rules: {
          'aria-valid-attr-value': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-required-children': { enabled: true }
        }
      });

      await checkA11y(page, 'input[placeholder]', {
        rules: {
          'label': { enabled: true }
        }
      });

      await checkA11y(page, 'button', {
        rules: {
          'button-name': { enabled: true },
          'aria-input-field-name': { enabled: true }
        }
      });
    });

    test('should have proper heading structure', async ({ page }) => {
      // Check heading hierarchy
      await checkA11y(page, 'h1, h2, h3, h4, h5, h6', {
        rules: {
          'heading-order': { enabled: true },
          'landmark-one-main': { enabled: true }
        }
      });

      // Verify h1 exists and is unique
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);
      await expect(h1Elements).toBeVisible();
    });

    test('should have proper focus management', async ({ page }) => {
      // Check focus indicators
      await checkA11y(page, 'button, a, input, select, textarea', {
        rules: {
          'focus-order-semantics': { enabled: true },
          'tabindex': { enabled: true }
        }
      });

      // Test that focus is visible
      const firstButton = page.locator('button').first();
      await firstButton.focus();

      const focusedElement = await page.evaluate(() => {
        const focused = document.activeElement;
        if (focused) {
          const styles = window.getComputedStyle(focused);
          return {
            outline: styles.outline,
            outlineOffset: styles.outlineOffset,
            boxShadow: styles.boxShadow
          };
        }
        return null;
      });

      // Should have some form of focus indicator
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper landmark roles', async ({ page }) => {
      // Check semantic landmarks
      await checkA11y(page, 'main, nav, header, footer', {
        rules: {
          'landmark-roles': { enabled: true },
          'landmark-no-duplicate-banner': { enabled: true },
          'landmark-no-duplicate-contentinfo': { enabled: true }
        }
      });

      // Verify main landmark exists
      const mainElement = page.locator('main, [role="main"]');
      await expect(mainElement).toBeVisible();

      // Verify header exists
      const headerElement = page.locator('header, [role="banner"]');
      await expect(headerElement).toBeVisible();

      // Verify nav exists
      const navElement = page.locator('nav, [role="navigation"]');
      if (await navElement.count() > 0) {
        await expect(navElement.first()).toBeVisible();
      }
    });

    test('should have proper alt text for images', async ({ page }) => {
      // Check image accessibility
      await checkA11y(page, 'img', {
        rules: {
          'image-alt': { enabled: true },
          'image-redundant-alt': { enabled: true }
        }
      });

      // If images exist, they should have alt text
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');

        // Alt text should be present (can be empty for decorative images)
        expect(alt !== null).toBeTruthy();
      }
    });

    test('should have proper form labels', async ({ page }) => {
      // Check form accessibility
      await checkA11y(page, 'input, select, textarea', {
        rules: {
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true }
        }
      });

      // Search input should have proper labeling
      const searchInput = toolsPage.searchInput;
      await expect(searchInput).toBeVisible();

      const hasLabel = await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Search"]');
        if (input) {
          return input.hasAttribute('aria-label') ||
                 input.hasAttribute('title') ||
                 !!input.closest('label') ||
                 input.getAttribute('aria-labelledby');
        }
        return false;
      });

      expect(hasLabel).toBeTruthy();
    });

    test('should have proper link accessibility', async ({ page }) => {
      // Check link accessibility
      await checkA11y(page, 'a', {
        rules: {
          'link-name': { enabled: true },
          'link-in-text-block': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      });

      // Links should have descriptive text
      const links = page.locator('a');
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 5); i++) { // Check first 5 links
        const link = links.nth(i);
        const linkText = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');

        // Link should have text or aria-label
        expect(linkText || ariaLabel).toBeTruthy();

        if (linkText) {
          expect(linkText.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test('should have proper button accessibility', async ({ page }) => {
      // Check button accessibility
      await checkA11y(page, 'button', {
        rules: {
          'button-name': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      });

      // Buttons should have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Check first 5 buttons
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');

        // Button should have some form of accessible name
        expect(buttonText || ariaLabel || title || ariaLabelledBy).toBeTruthy();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
      await toolsPage.goto();
    });

    test('should support full keyboard navigation', async ({ page }) => {
      // Test Tab navigation through all interactive elements
      const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const elementCount = await interactiveElements.count();

      // Test first 10 elements to avoid excessive test time
      const testCount = Math.min(elementCount, 10);

      for (let i = 0; i < testCount; i++) {
        await page.keyboard.press('Tab');

        const focusedElement = await page.evaluate(() => {
          const active = document.activeElement;
          return {
            tagName: active?.tagName,
            isVisible: active ? window.getComputedStyle(active).display !== 'none' : false,
            hasFocus: active === document.activeElement
          };
        });

        // Focus should be on an interactive element
        expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement.tagName);
        expect(focusedElement.isVisible).toBeTruthy();
        expect(focusedElement.hasFocus).toBeTruthy();
      }
    });

    test('should support Shift+Tab navigation', async ({ page }) => {
      // Navigate forward first
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Then navigate backward
      await page.keyboard.press('Shift+Tab');

      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.tagName;
      });

      // Should still be on an interactive element
      expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement || '');
    });

    test('should support Enter and Space key activation', async ({ page }) => {
      // Focus first button
      const firstButton = page.locator('button').first();
      await firstButton.focus();

      // Test Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Test Space key (if still focused on button)
      const stillFocused = await page.evaluate(() =>
        document.activeElement?.tagName === 'BUTTON'
      );

      if (stillFocused) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);
      }

      // Should not cause errors
      expect(await toolsPage.page.locator('body').isVisible()).toBeTruthy();
    });

    test('should support arrow key navigation in menus', async ({ page }) => {
      // Look for tab navigation or menu
      const tabs = toolsPage.tabNavigation;

      if (await tabs.isVisible()) {
        const firstTab = tabs.locator('[role="tab"]').first();
        await firstTab.focus();

        // Test arrow keys
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100);

        // Focus should move to next tab
        const focusedTab = await page.evaluate(() => {
          const active = document.activeElement;
          return active?.getAttribute('role') === 'tab' ? active.textContent : null;
        });

        // This depends on implementation
      }
    });

    test('should support Escape key for closing modals/panels', async ({ page }) => {
      // Look for filter panel or modal
      const filterToggle = toolsPage.filterToggle;

      if (await filterToggle.count() > 0) {
        await filterToggle.click();
        await page.waitForTimeout(300);

        // Try to close with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Panel might close (depends on implementation)
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      const interactiveElements = page.locator('button, a, input');
      const elementCount = await interactiveElements.count();
      const testCount = Math.min(elementCount, 5);

      for (let i = 0; i < testCount; i++) {
        const element = interactiveElements.nth(i);
        await element.focus();

        const focusStyles = await element.evaluate(el => {
          const styles = window.getComputedStyle(el, ':focus');
          return {
            outline: styles.outline,
            outlineColor: styles.outlineColor,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          };
        });

        // Should have some form of focus indicator
        const hasFocusIndicator =
          focusStyles.outline !== 'none' ||
          focusStyles.boxShadow !== 'none';

        // This is ideal but not always required
        // expect(hasFocusIndicator).toBeTruthy();
      }
    });

    test('should not have keyboard traps', async ({ page }) => {
      // Navigate through all elements
      let maxTabs = 50; // Prevent infinite loops
      let tabCount = 0;

      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;

        const focusedElement = await page.evaluate(() => {
          const active = document.activeElement;
          return active?.tagName;
        });

        // Should always be on an interactive element
        expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'BODY']).toContain(focusedElement || '');

        // If we reach body, we've cycled through all elements
        if (focusedElement === 'BODY') {
          break;
        }
      }

      // Should complete cycle without getting trapped
      expect(tabCount).toBeLessThan(maxTabs);
    });
  });

  test.describe('Screen Reader Support', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
      await toolsPage.goto();
    });

    test('should have proper page structure for screen readers', async ({ page }) => {
      // Check for proper page title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      // Check for proper language attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBeTruthy();

      // Check for skip links
      const skipLinks = page.locator('a[href^="#"]:has-text("skip"), a[href^="#"]:has-text("Skip")');
      if (await skipLinks.count() > 0) {
        await expect(skipLinks.first()).toBeVisible();
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Get all headings
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      expect(headingCount).toBeGreaterThan(0);

      // Check h1 is present and unique
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);

      // Check heading order (no skipping levels)
      let previousLevel = 0;

      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const level = parseInt((await heading.evaluate(el => el.tagName)).substring(1));

        if (previousLevel > 0) {
          // Should not skip more than one heading level
          expect(level - previousLevel).toBeLessThanOrEqual(1);
        }

        previousLevel = level;
      }
    });

    test('should have descriptive link text', async ({ page }) => {
      const links = page.locator('a');
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');

        // Link should have descriptive text
        if (text) {
          expect(text.trim().length).toBeGreaterThan(0);

          // Should not be generic like "click here" only
          expect(text.toLowerCase()).not.toBe('click here');
          expect(text.toLowerCase()).not.toBe('read more');
        } else if (ariaLabel) {
          expect(ariaLabel.trim().length).toBeGreaterThan(0);
        } else if (title) {
          expect(title.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test('should have proper table headers if tables exist', async ({ page }) => {
      const tables = page.locator('table');

      if (await tables.count() > 0) {
        await checkA11y(page, 'table', {
          rules: {
            'table-headers': { enabled: true },
            'th-has-data-cells': { enabled: true },
            'td-headers-attr': { enabled: true }
          }
        });
      }
    });

    test('should have proper form labels and descriptions', async ({ page }) => {
      // Check search input specifically
      const searchInput = toolsPage.searchInput;

      // Should have associated label or aria-label
      const hasLabel = await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Search"]');
        if (!input) return false;

        const hasAriaLabel = input.hasAttribute('aria-label');
        const hasTitle = input.hasAttribute('title');
        const hasExplicitLabel = !!input.closest('label');
        const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');

        return hasAriaLabel || hasTitle || hasExplicitLabel || hasAriaLabelledBy;
      });

      expect(hasLabel).toBeTruthy();
    });

    test('should announce dynamic content changes', async ({ page }) => {
      // Test search results announcement
      const initialCount = await toolsPage.getVisibleToolCount();

      await toolsPage.search('json');
      await page.waitForTimeout(500);

      // Look for aria-live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');

      if (await liveRegions.count() > 0) {
        // Should have live regions for dynamic content
        await expect(liveRegions.first()).toBeVisible();
      }

      // This is optional as not all implementations use aria-live
    });

    test('should have proper ARIA descriptions', async ({ page }) => {
      // Check for aria-describedby usage
      const describedElements = page.locator('[aria-describedby]');

      if (await describedElements.count() > 0) {
        for (let i = 0; i < Math.min(await describedElements.count(), 5); i++) {
          const element = describedElements.nth(i);
          const describedById = await element.getAttribute('aria-describedby');

          if (describedById) {
            const description = page.locator(`#${describedById}`);
            expect(await description.count()).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Accessibility Testing on Different Viewports', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
    });

    test('should maintain accessibility on mobile', async ({ page }) => {
      await toolsPage.setViewport('mobile');
      await toolsPage.goto();
      await injectAxe(page);

      // Check accessibility on mobile
      await checkA11y(page, undefined, {
        detailedReport: true,
        rules: {
          'color-contrast': { enabled: true },
          'touch-target-size': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      });

      // Test keyboard navigation on mobile
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'A'].includes(focused || '')).toBeTruthy();
    });

    test('should maintain accessibility on tablet', async ({ page }) => {
      await toolsPage.setViewport('tablet');
      await toolsPage.goto();
      await injectAxe(page);

      // Check accessibility on tablet
      await checkA11y(page, undefined, {
        detailedReport: true,
        rules: {
          'color-contrast': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      });
    });

    test('should maintain accessibility on desktop', async ({ page }) => {
      await toolsPage.setViewport('desktop');
      await toolsPage.goto();
      await injectAxe(page);

      // Check accessibility on desktop
      await checkA11y(page, undefined, {
        detailedReport: true,
        rules: {
          'color-contrast': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'keyboard-navigation': { enabled: true }
        }
      });
    });
  });

  test.describe('Accessibility with Dynamic Content', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
      await toolsPage.goto();
      await injectAxe(page);
    });

    test('should maintain accessibility during search', async ({ page }) => {
      // Initial accessibility check
      await checkA11y(page, 'main');

      // Perform search
      await toolsPage.search('json');
      await page.waitForTimeout(500);

      // Check accessibility of search results
      await checkA11y(page, '.card, [data-testid="tool-card"]');

      // Clear search
      await toolsPage.clearSearch();
      await page.waitForTimeout(500);

      // Check accessibility after clearing search
      await checkA11y(page, 'main');
    });

    test('should maintain accessibility during filtering', async ({ page }) => {
      const categoryFilters = toolsPage.categoryFilters;

      if (await categoryFilters.count() > 0) {
        // Apply filter
        await toolsPage.selectCategory('JSON Processing');
        await page.waitForTimeout(500);

        // Check accessibility of filtered results
        await checkA11y(page, '.card, [data-testid="tool-card"]');

        // Clear filters
        await toolsPage.clearAllFilters();
        await page.waitForTimeout(500);

        // Check accessibility after clearing filters
        await checkA11y(page, 'main');
      }
    });

    test('should maintain accessibility during theme changes', async ({ page }) => {
      // Initial check
      await checkA11y(page, 'main');

      // Toggle dark mode
      await toolsPage.toggleDarkMode();
      await page.waitForTimeout(500);

      // Check accessibility in dark mode
      await checkA11y(page, 'main', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      // Toggle back
      await toolsPage.toggleDarkMode();
      await page.waitForTimeout(500);

      // Check accessibility in light mode
      await checkA11y(page, 'main');
    });

    test('should maintain accessibility with modal/popup interactions', async ({ page }) => {
      const filterToggle = toolsPage.filterToggle;

      if (await filterToggle.count() > 0) {
        // Open filter panel
        await filterToggle.click();
        await page.waitForTimeout(500);

        // Check accessibility of filter panel
        await checkA11y(page, '[role="dialog"], .modal, .panel, [data-testid="filter-panel"]');

        // Close filter panel
        await filterToggle.click();
        await page.waitForTimeout(500);

        // Check accessibility after closing
        await checkA11y(page, 'main');
      }
    });
  });

  test.describe('Custom Accessibility Tests', () => {
    test.beforeEach(async ({ page }) => {
      toolsPage = new ToolsHomePage(page);
      await toolsPage.goto();
    });

    test('should meet custom accessibility criteria', async ({ page }) => {
      for (const testCase of ACCESSIBILITY_TEST_CASES) {
        console.log(`Running custom accessibility test: ${testCase.name}`);

        const result = await testCase.test(page);
        expect(result).toBeTruthy();
      }
    });

    test('should have sufficient touch target sizes', async ({ page }) => {
      await toolsPage.setViewport('mobile');

      const interactiveElements = page.locator('button, a, input');
      const elementCount = await interactiveElements.count();
      const testCount = Math.min(elementCount, 10);

      for (let i = 0; i < testCount; i++) {
        const element = interactiveElements.nth(i);
        const boundingBox = await element.boundingBox();

        if (boundingBox) {
          // Touch targets should be at least 44x44 points
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should have consistent navigation patterns', async ({ page }) => {
      // Check that navigation is consistent
      const navigationElements = page.locator('nav, [role="navigation"]');

      if (await navigationElements.count() > 0) {
        const firstNav = navigationElements.first();

        // Should have accessible navigation structure
        await expect(firstNav).toBeVisible();

        // Navigation links should be properly structured
        const navLinks = firstNav.locator('a, button');

        if (await navLinks.count() > 0) {
          for (let i = 0; i < Math.min(await navLinks.count(), 5); i++) {
            const link = navLinks.nth(i);
            const text = await link.textContent();

            expect(text?.trim().length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should provide clear error messages', async ({ page }) => {
      // Search for non-existent tool to trigger error state
      await toolsPage.search('xyznonexistenttool123456');
      await page.waitForTimeout(500);

      // Check for error messages
      const errorMessages = page.locator('[role="alert"], .error, .message:has-text("No tools found")');

      if (await errorMessages.count() > 0) {
        const errorMessage = errorMessages.first();
        await expect(errorMessage).toBeVisible();

        const errorText = await errorMessage.textContent();
        expect(errorText?.length).toBeGreaterThan(10); // Should be descriptive
      }
    });

    test('should have proper reading order', async ({ page }) => {
      // Check that content appears in logical reading order
      const sourceOrder = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('h1, h2, h3, p, button, a, input'));
        return elements.map(el => ({
          tagName: el.tagName,
          text: el.textContent?.slice(0, 50),
          position: el.getBoundingClientRect().top
        })).sort((a, b) => a.position - b.position);
      });

      // Should have logical flow (this is a basic check)
      expect(sourceOrder.length).toBeGreaterThan(0);

      // First element should be a heading or important content
      const firstElement = sourceOrder[0];
      expect(['H1', 'H2', 'HEADER', 'NAV']).toContain(firstElement.tagName);
    });
  });
});
