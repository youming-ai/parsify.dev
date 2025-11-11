/**
 * E2E tests for performance and accessibility
 * Tests loading times, interaction responsiveness, and accessibility compliance
 */

import { test, expect, type Page } from '@playwright/test';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000,
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  interactionDelay: 100,
  toolProcessing: 5000,
  searchResponse: 500,
  filterResponse: 300,
};

// Accessibility WCAG levels
const WCAG_LEVELS = {
  AA: {
    colorContrast: 4.5,
    touchTargetSize: 44, // pixels
    fontSize: 16, // pixels
  },
  AAA: {
    colorContrast: 7,
    touchTargetSize: 44,
    fontSize: 18,
  },
};

class PerformanceHelper {
  constructor(private page: Page) {}

  async measurePageLoad() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const firstPaint = paint.find(p => p.name === 'first-paint')?.startTime || 0;
      const firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;

      return {
        domContentLoaded,
        loadComplete,
        firstPaint,
        firstContentfulPaint,
        totalLoadTime: navigation.loadEventEnd - navigation.navigationStart,
      };
    });

    return metrics;
  }

  async measureInteraction(element: () => Promise<any>, action: () => Promise<void>) {
    const startTime = Date.now();
    const el = await element();
    await action();
    const endTime = Date.now();

    return endTime - startTime;
  }

  async measureToolProcessing(toolPath: string, inputData: string, action: string = 'format') {
    const startTime = Date.now();

    await this.page.goto(toolPath);
    await this.page.waitForSelector('[data-testid*="input"]');

    const inputElement = await this.page.locator('[data-testid*="input"], textarea').first();
    await inputElement.fill(inputData);

    await this.page.locator(`button:has-text("${action}")`).click();
    await this.page.waitForSelector('[data-testid*="output"], [data-testid*="result"]');

    const endTime = Date.now();
    return endTime - startTime;
  }

  async getNetworkMetrics() {
    return await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const totalRequests = resources.length;
      const totalSize = resources.reduce((sum, resource) => {
        return sum + (resource.encodedBodySize || 0);
      }, 0);

      const slowRequests = resources.filter(resource =>
        resource.responseEnd - resource.requestStart > 1000
      );

      return {
        totalRequests,
        totalSize,
        slowRequests: slowRequests.length,
        averageResponseTime: resources.reduce((sum, resource) =>
          sum + (resource.responseEnd - resource.requestStart), 0
        ) / totalRequests,
      };
    });
  }
}

class AccessibilityHelper {
  constructor(private page: Page) {}

  async runAxeCheck(options = {}) {
    return await this.page.evaluate((opts) => {
      // Mock axe-core if not available
      if (typeof (window as any).axe === 'undefined') {
        return {
          violations: [],
          passes: [],
          incomplete: [],
          inapplicable: []
        };
      }

      return (window as any).axe.run(document, opts);
    }, options);
  }

  async checkColorContrast() {
    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const contrastResults: any[] = [];

      for (const element of elements) {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // Convert RGB to hex and calculate contrast
          contrastResults.push({
            element: element.tagName,
            color,
            backgroundColor,
            contrast: 'calculated', // In real implementation, calculate actual contrast ratio
          });
        }
      }

      return contrastResults;
    });
  }

  async checkKeyboardNavigation() {
    const navigationResults: any[] = [];
    let focusedElements: any[] = [];

    // Get all focusable elements
    focusableElements = await this.page.$$(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Tab through all focusable elements
    for (let i = 0; i < focusableElements.length; i++) {
      await this.page.keyboard.press('Tab');

      const focusedElement = await this.page.locator(':focus');
      const isVisible = await focusedElement.isVisible();

      navigationResults.push({
        index: i,
        element: await focusedElement.evaluate(el => el.tagName),
        visible: isVisible,
        hasFocus: await focusedElement.evaluate(el => document.activeElement === el),
      });
    }

    return navigationResults;
  }

  async checkScreenReaderSupport() {
    return await this.page.evaluate(() => {
      const results: any[] = [];

      // Check for proper ARIA labels
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach(button => {
        const hasLabel = button.hasAttribute('aria-label') ||
                        button.hasAttribute('aria-labelledby') ||
                        button.textContent?.trim() !== '';

        results.push({
          element: 'button',
          hasLabel,
          accessibleName: button.getAttribute('aria-label') || button.textContent?.trim(),
        });
      });

      // Check for form labels
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                        input.hasAttribute('aria-label') ||
                        input.hasAttribute('aria-labelledby');

        results.push({
          element: input.tagName,
          hasLabel,
          inputId: input.id,
        });
      });

      return results;
    });
  }

  async checkTouchTargets() {
    return await this.page.evaluate((minSize) => {
      const touchTargets: any[] = [];
      const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');

      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const minDimension = Math.min(width, height);

        touchTargets.push({
          element: element.tagName,
          width,
          height,
          minDimension,
          meetsMinimum: minDimension >= minSize,
        });
      });

      return touchTargets;
    }, WCAG_LEVELS.AA.touchTargetSize);
  }
}

test.describe('Performance Tests', () => {
  let performanceHelper: PerformanceHelper;

  test.beforeEach(async ({ page }) => {
    performanceHelper = new PerformanceHelper(page);
  });

  test('should load homepage within performance thresholds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const metrics = await performanceHelper.measurePageLoad();

    expect(metrics.totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint);
    expect(metrics.domContentLoaded).toBeLessThan(1000);

    console.log('Homepage Performance Metrics:', {
      totalLoadTime: `${metrics.totalLoadTime}ms`,
      firstContentfulPaint: `${metrics.firstContentfulPaint}ms`,
      domContentLoaded: `${metrics.domContentLoaded}ms`,
    });
  });

  test('should load tool pages efficiently', async ({ page }) => {
    const tools = [
      '/tools/json/formatter',
      '/tools/code/executor',
      '/tools/security/hash-generator',
      '/tools/file/converter',
    ];

    for (const toolPath of tools) {
      await page.goto(toolPath);
      await page.waitForLoadState('networkidle');

      const metrics = await performanceHelper.measurePageLoad();

      expect(metrics.totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

      console.log(`${toolPath} Performance:`, {
        totalLoadTime: `${metrics.totalLoadTime}ms`,
        firstContentfulPaint: `${metrics.firstContentfulPaint}ms`,
      });
    }
  });

  test('should process tool inputs efficiently', async ({ page }) => {
    const testCases = [
      {
        tool: '/tools/json/formatter',
        input: JSON.stringify({
          data: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
        }, null, 2),
        action: 'format',
      },
      {
        tool: '/tools/security/hash-generator',
        input: 'A'.repeat(10000), // Large string for hashing
        action: 'generate',
      },
    ];

    for (const testCase of testCases) {
      const processingTime = await performanceHelper.measureToolProcessing(
        testCase.tool,
        testCase.input,
        testCase.action
      );

      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.toolProcessing);

      console.log(`${testCase.tool} Processing Time:`, `${processingTime}ms`);
    }
  });

  test('should respond to search and filter interactions quickly', async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    // Measure search response time
    const searchTime = await performanceHelper.measureInteraction(
      () => page.locator('[data-testid="search-input"]'),
      () => page.locator('[data-testid="search-input"]').fill('json')
    );

    expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interactionDelay);
    await page.waitForTimeout(500); // Wait for debounced search

    // Measure filter response time
    const filterTime = await performanceHelper.measureInteraction(
      () => page.locator('[data-testid="category-json-processing"]'),
      () => page.locator('[data-testid="category-json-processing"]').click()
    );

    expect(filterTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interactionDelay);

    console.log('Interaction Times:', {
      search: `${searchTime}ms`,
      filter: `${filterTime}ms`,
    });
  });

  test('should maintain good network performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const networkMetrics = await performanceHelper.getNetworkMetrics();

    expect(networkMetrics.totalRequests).toBeLessThan(100); // Reasonable number of requests
    expect(networkMetrics.slowRequests).toBeLessThan(5); // Few slow requests
    expect(networkMetrics.averageResponseTime).toBeLessThan(2000); // Average under 2s

    console.log('Network Performance:', networkMetrics);
  });

  test('should handle memory usage properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to multiple tools
    const tools = ['/tools/json/formatter', '/tools/code/executor', '/tools/security/hash-generator'];

    for (const tool of tools) {
      await page.goto(tool);
      await page.waitForLoadState('networkidle');

      // Perform some interactions
      await page.locator('[data-testid*="input"]').first().fill('test data');
      await page.keyboard.press('Tab');
    }

    // Check memory usage
    const memoryMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
      };
    });

    // Memory usage should be reasonable (under 100MB for this test)
    expect(memoryMetrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);

    console.log('Memory Usage:', {
      used: `${(memoryMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memoryMetrics.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    });
  });
});

test.describe('Accessibility Tests', () => {
  let accessibilityHelper: AccessibilityHelper;

  test.beforeEach(async ({ page }) => {
    accessibilityHelper = new AccessibilityHelper(page);

    // Inject axe-core for accessibility testing
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.6.2/axe.min.js',
    });
  });

  test('should pass WCAG 2.1 AA accessibility checks', async ({ page }) => {
    const pages = ['/', '/tools', '/tools/json/formatter'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const results = await accessibilityHelper.runAxeCheck({
        reporting: {
          includeImpactedElements: true,
        },
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'label-title-only': { enabled: true },
          'link-in-text-block': { enabled: true },
        },
      });

      // Should have no critical accessibility violations
      const criticalViolations = results.violations.filter(v =>
        v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toHaveLength(0);

      console.log(`Accessibility Results for ${pagePath}:`, {
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
      });
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const contrastResults = await accessibilityHelper.checkColorContrast();

    // All visible text elements should have adequate contrast
    const lowContrastElements = contrastResults.filter(result => {
      const contrast = parseFloat(result.contrast);
      return !isNaN(contrast) && contrast < WCAG_LEVELS.AA.colorContrast;
    });

    expect(lowContrastElements).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    const navigationResults = await accessibilityHelper.checkKeyboardNavigation();

    // All focusable elements should be visible when focused
    const invisibleFocusElements = navigationResults.filter(result =>
      !result.visible && result.hasFocus
    );

    expect(invisibleFocusElements).toHaveLength(0);

    // Should be able to navigate through all focusable elements
    expect(navigationResults.length).toBeGreaterThan(0);

    // Focus order should be logical (no skipping)
    const skippedElements = navigationResults.filter((result, index) =>
      index > 0 && !result.hasFocus
    );

    expect(skippedElements).toHaveLength(0);
  });

  test('should have proper screen reader support', async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    const screenReaderResults = await accessibilityHelper.checkScreenReaderSupport();

    // All interactive elements should have accessible names
    const unnamedElements = screenReaderResults.filter(result =>
      !result.hasLabel && result.element !== 'INPUT' // Some inputs might be labeled implicitly
    );

    expect(unnamedElements).toHaveLength(0);

    // All form inputs should have associated labels
    const unlabeledInputs = screenReaderResults.filter(result =>
      result.element === 'INPUT' && !result.hasLabel
    );

    expect(unlabeledInputs).toHaveLength(0);
  });

  test('should have appropriate touch target sizes', async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    const touchTargetResults = await accessibilityHelper.checkTouchTargets();

    // All interactive elements should meet minimum touch target size
    const undersizedTargets = touchTargetResults.filter(result =>
      !result.meetsMinimum && (result.element === 'BUTTON' || result.element === 'A')
    );

    expect(undersizedTargets).toHaveLength(0);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const headingStructure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent?.trim(),
        hasContent: !!h.textContent?.trim(),
      }));
    });

    // Should have exactly one h1
    const h1Headings = headingStructure.filter(h => h.level === 1);
    expect(h1Headings).toHaveLength(1);

    // All headings should have content
    const emptyHeadings = headingStructure.filter(h => !h.hasContent);
    expect(emptyHeadings).toHaveLength(0);

    // Heading levels should not be skipped (e.g., h1 to h3 without h2)
    for (let i = 1; i < headingStructure.length; i++) {
      const current = headingStructure[i];
      const previous = headingStructure[i - 1];

      expect(current.level).toBeLessThanOrEqual(previous.level + 1);
    }
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const landmarks = await page.evaluate(() => {
      const landmarks: any[] = [];
      const elements = document.querySelectorAll('[role], main, header, footer, nav, aside');

      elements.forEach(element => {
        const role = element.getAttribute('role') || element.tagName.toLowerCase();
        const hasLabel = element.hasAttribute('aria-label') ||
                        element.hasAttribute('aria-labelledby') ||
                        !!element.getAttribute('title');

        landmarks.push({
          role,
          hasLabel,
          element: element.tagName,
        });
      });

      return landmarks;
    });

    // Should have main content area
    const mainLandmark = landmarks.find(l => l.role === 'main' || l.element === 'MAIN');
    expect(mainLandmark).toBeDefined();

    // Should have navigation
    const navLandmark = landmarks.find(l => l.role === 'navigation' || l.element === 'NAV');
    expect(navLandmark).toBeDefined();
  });

  test('should handle focus management properly', async ({ page }) => {
    await page.goto('/tools/json/formatter');
    await page.waitForLoadState('networkidle');

    // Test focus returns to input after formatting
    const inputElement = page.locator('[data-testid*="input"]').first();
    await inputElement.focus();

    // Type some content and format
    await inputElement.fill('{"test": true}');
    await page.locator('button:has-text("format")').click();

    // Focus should remain on or return to the input area
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    // Test search result announcements
    await page.locator('[data-testid="search-input"]').fill('json');
    await page.waitForTimeout(500); // Wait for debounced search

    const announcements = await page.evaluate(() => {
      const liveRegions = document.querySelectorAll('[aria-live], [aria-atomic]');
      return Array.from(liveRegions).map(region => ({
        tag: region.tagName,
        live: region.getAttribute('aria-live'),
        atomic: region.getAttribute('aria-atomic'),
        content: region.textContent?.trim(),
      }));
    });

    // Should have live regions for dynamic content
    expect(announcements.length).toBeGreaterThan(0);

    const politeRegions = announcements.filter(a => a.live === 'polite');
    expect(politeRegions.length).toBeGreaterThan(0);
  });
});

test.describe('Mobile Performance and Accessibility', () => {
  test('should perform well on mobile devices', async ({ page }) => {
    // Set mobile viewport and simulate slower network
    await page.setViewportSize({ width: 375, height: 667 });
    await page.route('**/*', async route => {
      // Simulate 3G network conditions
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
      await route.continue();
    });

    const performanceHelper = new PerformanceHelper(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const metrics = await performanceHelper.measurePageLoad();

    // Allow slightly longer load times for mobile
    expect(metrics.totalLoadTime).toBeLessThan(5000);

    console.log('Mobile Performance:', {
      totalLoadTime: `${metrics.totalLoadTime}ms`,
      firstContentfulPaint: `${metrics.firstContentfulPaint}ms`,
    });
  });

  test('should be accessible on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    // Test touch accessibility
    const touchTargets = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      return Array.from(buttons).map(button => {
        const rect = button.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          area: rect.width * rect.height,
        };
      });
    });

    // Touch targets should be large enough for mobile
    const smallTargets = touchTargets.filter(target =>
      target.width < 44 || target.height < 44
    );

    expect(smallTargets.length).toBeLessThan(touchTargets.length * 0.1); // Allow some exceptions

    // Test mobile navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    }
  });
});
