/**
 * E2E tests for complete user journeys across the Parsify.dev platform
 * Tests end-to-end workflows from landing page to tool usage and completion
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// Test data fixtures
const testFixtures = {
  // JSON test data
  validJson: {
    simple: '{"name": "John Doe", "age": 30, "city": "New York"}',
    complex: `{
      "id": 123,
      "user": {
        "name": "Alice",
        "email": "alice@example.com",
        "preferences": {
          "theme": "dark",
          "notifications": true
        }
      },
      "orders": [
        {"id": "order-1", "total": 99.99, "items": ["item1", "item2"]},
        {"id": "order-2", "total": 149.99, "items": ["item3"]}
      ]
    }`,
    invalid: '{"name": "John", "age": 30, "city": "New York"',
  },

  // Code test data
  codeSamples: {
    javascript: `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const cart = [
  { name: 'Laptop', price: 999.99 },
  { name: 'Mouse', price: 29.99 }
];

console.log('Total:', calculateTotal(cart));`,
    python: `def calculate_total(items):
    return sum(item['price'] for item in items)

cart = [
    {'name': 'Laptop', 'price': 999.99},
    {'name': 'Mouse', 'price': 29.99}
]

print(f'Total: {calculate_total(cart)}')`,
  },

  // Hash test data
  hashInput: 'Hello, World! This is a test string for hash generation.',

  // Regex test data
  regexTests: [
    { pattern: '^\\d{3}-\\d{3}-\\d{4}$', testString: '555-123-4567', expectedMatch: true },
    { pattern: '^\\d{3}-\\d{3}-\\d{4}$', testString: 'invalid', expectedMatch: false },
    { pattern: '^[^@]+@[^@]+\\.[^@]+$', testString: 'test@example.com', expectedMatch: true },
  ],
};

// Helper functions
async function waitForPageLoad(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForFunction(() => document.readyState === 'complete');
}

async function takeScreenshotOnFailure(page: Page, testName: string) {
  try {
    await page.screenshot({
      path: `test-results/screenshots/${testName}-failure.png`,
      fullPage: true
    });
  } catch (error) {
    console.log('Could not take screenshot:', error);
  }
}

class ToolPageHelper {
  constructor(private page: Page) {}

  async navigateToTool(toolPath: string) {
    await this.page.goto(toolPath);
    await waitForPageLoad(this.page);

    // Wait for tool to be fully loaded
    await this.page.waitForSelector('[data-testid^="tool-"]', { timeout: 5000 });
  }

  async waitForToolOutput() {
    await this.page.waitForSelector('[data-testid*="output"], [data-testid*="result"]', {
      timeout: 10000
    });
  }

  async getInputArea() {
    return this.page.locator('[data-testid*="input"], textarea, [contenteditable="true"]').first();
  }

  async getOutputArea() {
    return this.page.locator('[data-testid*="output"], [data-testid*="result"]').first();
  }

  async clearInput() {
    const inputArea = await this.getInputArea();
    await inputArea.clear();
  }

  async typeInput(text: string, options?: { delay?: number }) {
    const inputArea = await this.getInputArea();
    await inputArea.fill(text, options);
  }

  async clickActionbutton(buttonTextOrTestid: string) {
    const button = this.page.locator(
      `button:has-text("${buttonTextOrTestid}"), [data-testid="${buttonTextOrTestid}"]`
    ).first();
    await button.click();
  }

  async waitForSuccessMessage() {
    await this.page.waitForSelector('[data-testid*="success"], .success-message', { timeout: 5000 });
  }

  async waitForErrorMessage() {
    await this.page.waitForSelector('[data-testid*="error"], .error-message', { timeout: 5000 });
  }

  async getErrorMessage() {
    const errorElement = await this.page.waitForSelector('[data-testid*="error"], .error-message');
    return errorElement.textContent();
  }
}

test.describe('Complete User Journeys', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.afterEach(async ({ browserName }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await takeScreenshotOnFailure(page, `${testInfo.title}-${browserName}`);
    }
  });

  test.describe('New User Discovery Journey', () => {
    test('should guide new user from homepage to tool usage', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      // Step 1: User lands on homepage
      await expect(page).toHaveTitle(/Parsify\.dev/);
      await expect(page.locator('h1')).toContainText('Developer Tools');

      // Step 2: User browses available tools
      await expect(page.locator('[data-testid="tools-grid"]')).toBeVisible();
      const toolCards = page.locator('[data-testid^="tool-"]');
      await expect(toolCards).toHaveCount.greaterThan(10);

      // Step 3: User searches for specific tool
      const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search"]');
      await searchInput.fill('json');

      await page.waitForTimeout(500); // Wait for debounced search

      // Should see JSON tools in results
      await expect(page.locator('[data-testid="tool-json-formatter"]')).toBeVisible();

      // Step 4: User clicks on JSON Formatter
      await page.locator('[data-testid="tool-json-formatter"] a').click();
      await toolHelper.waitForToolOutput();

      // Step 5: User uses the tool
      await toolHelper.clearInput();
      await toolHelper.typeInput(testFixtures.validJson.simple);
      await toolHelper.clickActionbutton('format');

      // Step 6: Verify tool works
      await toolHelper.waitForToolOutput();
      const output = await toolHelper.getOutputArea();
      const outputText = await output.inputValue();
      expect(outputText).toContain('  "name": "John Doe"');
      expect(outputText).toContain('  "age": 30');
    });

    test('should allow exploration through categories', async ({ page }) => {
      // User navigates through categories
      const categoryNavigation = page.locator('[data-testid="category-navigation"]');
      await expect(categoryNavigation).toBeVisible();

      // Click on JSON Processing category
      await page.locator('button:has-text("JSON Processing"), [data-testid="category-json-processing"]').click();

      // Should show only JSON tools
      await expect(page.locator('[data-testid="tool-json-formatter"]')).toBeVisible();
      await expect(page.locator('[data-testid="tool-json-validator"]')).toBeVisible();

      // Navigate to Code Execution
      await page.locator('button:has-text("Code Execution"), [data-testid="category-code-execution"]').click();

      // Should show code execution tools
      await expect(page.locator('[data-testid="tool-code-executor"]')).toBeVisible();
    });
  });

  test.describe('JSON Processing Workflows', () => {
    test('should complete JSON validation and formatting workflow', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      // Navigate to JSON Validator
      await toolHelper.navigateToTool('/tools/json/validator');

      // Test with valid JSON
      await toolHelper.typeInput(testFixtures.validJson.complex);
      await toolHelper.clickActionbutton('validate');

      await toolHelper.waitForSuccessMessage();

      // Navigate to JSON Formatter
      await page.locator('a[href*="/tools/json/formatter"]').click();
      await toolHelper.waitForToolOutput();

      // Format the same JSON
      await toolHelper.typeInput(testFixtures.validJson.complex);
      await toolHelper.clickActionbutton('format');

      await toolHelper.waitForToolOutput();
      const output = await toolHelper.getOutputArea();
      const outputText = await output.inputValue();

      // Verify formatting
      expect(outputText).toContain('  "id": 123');
      expect(outputText).toContain('    "name": "Alice"');
      expect(outputText).toContain('      "theme": "dark"');
    });

    test('should handle JSON errors gracefully', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/json/validator');

      // Input invalid JSON
      await toolHelper.typeInput(testFixtures.validJson.invalid);
      await toolHelper.clickActionbutton('validate');

      await toolHelper.waitForErrorMessage();

      const errorMessage = await toolHelper.getErrorMessage();
      expect(errorMessage).toContain('Invalid JSON');

      // Should show specific error details
      await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
    });

    test('should convert JSON to different formats', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/json/converter');

      // Input JSON
      await toolHelper.typeInput(testFixtures.validJson.simple);

      // Convert to XML
      await page.locator('[data-testid="format-select"]').selectOption('xml');
      await toolHelper.clickActionbutton('convert');

      await toolHelper.waitForToolOutput();
      let output = await toolHelper.getOutputArea();
      let outputText = await output.inputValue();
      expect(outputText).toContain('<?xml version="1.0"');
      expect(outputText).toContain('<name>John Doe</name>');

      // Convert to CSV
      await page.locator('[data-testid="format-select"]').selectOption('csv');
      await toolHelper.clickActionbutton('convert');

      await toolHelper.waitForToolOutput();
      output = await toolHelper.getOutputArea();
      outputText = await output.inputValue();
      expect(outputText).toContain('name,age,city');
      expect(outputText).toContain('John Doe,30,New York');
    });
  });

  test.describe('Code Execution Workflows', () => {
    test('should execute JavaScript code with output', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/code/executor');

      // Select JavaScript language
      await page.locator('[data-testid="language-select"]').selectOption('javascript');

      // Input JavaScript code
      await toolHelper.typeInput(testFixtures.codeSamples.javascript);

      // Execute code
      await toolHelper.clickActionbutton('run');

      await toolHelper.waitForToolOutput();

      // Check for output
      const output = await toolHelper.getOutputArea();
      const outputText = await output.inputValue();
      expect(outputText).toContain('Total: 1029.98');
    });

    test('should execute Python code correctly', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/code/executor');

      // Select Python language
      await page.locator('[data-testid="language-select"]').selectOption('python');

      // Input Python code
      await toolHelper.typeInput(testFixtures.codeSamples.python);

      // Execute code
      await toolHelper.clickActionbutton('run');

      await toolHelper.waitForToolOutput();

      // Check for output
      const output = await toolHelper.getOutputArea();
      const outputText = await output.inputValue();
      expect(outputText).toContain('Total: 1029.98');
    });

    test('should handle code execution errors', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/code/executor');

      // Input invalid code
      await toolHelper.typeInput('function invalid() { syntax error }');
      await toolHelper.clickActionbutton('run');

      await toolHelper.waitForErrorMessage();

      const errorMessage = await toolHelper.getErrorMessage();
      expect(errorMessage).toBeDefined();
    });
  });

  test.describe('Security Tools Workflows', () => {
    test('should generate multiple hash values', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/security/hash-generator');

      // Input text
      await toolHelper.typeInput(testFixtures.hashInput);

      // Select multiple hash algorithms
      await page.locator('[data-testid="algorithm-md5"]').check();
      await page.locator('[data-testid="algorithm-sha256"]').check();
      await page.locator('[data-testid="algorithm-sha512"]').check();

      // Generate hashes
      await toolHelper.clickActionbutton('generate');

      await toolHelper.waitForToolOutput();

      // Check for generated hashes
      await expect(page.locator('[data-testid="hash-md5"]')).toBeVisible();
      await expect(page.locator('[data-testid="hash-sha256"]')).toBeVisible();
      await expect(page.locator('[data-testid="hash-sha512"]')).toBeVisible();

      // Verify hash format (should be hexadecimal)
      const md5Hash = await page.locator('[data-testid="hash-md5"]').inputValue();
      expect(md5Hash).toMatch(/^[a-f0-9]{32}$/i);
    });

    test('should validate password strength', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/security/password-generator');

      // Test weak password
      await toolHelper.typeInput('password');
      await toolHelper.clickActionbutton('check-strength');

      await toolHelper.waitForToolOutput();
      await expect(page.locator('[data-testid="strength-weak"]')).toBeVisible();

      // Test strong password
      await toolHelper.clearInput();
      await toolHelper.typeInput('Str0ng!P@ssw0rd123');
      await toolHelper.clickActionbutton('check-strength');

      await toolHelper.waitForToolOutput();
      await expect(page.locator('[data-testid="strength-strong"]')).toBeVisible();
    });
  });

  test.describe('Regex Testing Workflows', () => {
    test('should test regex patterns against multiple strings', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/code/regex-tester');

      // Test email regex
      await toolHelper.typeInput(testFixtures.regexTests[2].pattern);

      // Add test string
      await page.locator('[data-testid="test-string-input"]').fill(testFixtures.regexTests[2].testString);
      await toolHelper.clickActionbutton('test');

      await toolHelper.waitForToolOutput();

      // Should show match
      await expect(page.locator('[data-testid="match-result"]')).toContainText('Match found');

      // Test with non-matching string
      await page.locator('[data-testid="test-string-input"]').fill('invalid-email');
      await toolHelper.clickActionbutton('test');

      await toolHelper.waitForToolOutput();
      await expect(page.locator('[data-testid="match-result"]')).toContainText('No match');
    });

    test('should explain regex pattern', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/code/regex-tester');

      // Input complex regex
      await toolHelper.typeInput('^(https?):\\/\\/(www\\.)?([^\\/]+)\\/?(.*)$');

      // Click explain button
      await toolHelper.clickActionbutton('explain');

      await toolHelper.waitForToolOutput();

      // Should show explanation
      await expect(page.locator('[data-testid="regex-explanation"]')).toBeVisible();
      await expect(page.locator('[data-testid="regex-explanation"]')).toContainText('protocol');
      await expect(page.locator('[data-testid="regex-explanation"]')).toContainText('domain');
    });
  });

  test.describe('File Processing Workflows', () => {
    test('should handle file upload and processing', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/file/converter');

      // Create test file
      const testFile = {
        name: 'test.json',
        mimeType: 'application/json',
        buffer: Buffer.from(testFixtures.validJson.simple),
      };

      // Upload file
      await page.locator('[data-testid="file-input"]').setInputFiles(testFile);

      // Should show file info
      await expect(page.locator('[data-testid="file-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-name"]')).toContainText('test.json');

      // Convert file
      await page.locator('[data-testid="convert-button"]').click();

      await toolHelper.waitForToolOutput();

      // Should show converted content
      const output = await toolHelper.getOutputArea();
      expect(output).toBeVisible();
    });

    test('should handle text processing', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/file/text-processor');

      // Input text
      const sampleText = `This is a sample text.
      It has multiple lines.
      Some lines have TRIMMING needed.
      And different CASES.`;

      await toolHelper.typeInput(sampleText);

      // Apply text transformations
      await page.locator('[data-testid="action-trim"]').check();
      await page.locator('[data-testid="action-lowercase"]').check();
      await toolHelper.clickActionbutton('process');

      await toolHelper.waitForToolOutput();

      const output = await toolHelper.getOutputArea();
      const outputText = await output.inputValue();

      // Verify transformations
      expect(outputText).not.toContain('      '); // No extra spaces
      expect(outputText).toContain('this is a sample text'); // Lowercase
    });
  });

  test.describe('Accessibility and Responsive Design', () => {
    test('should be accessible via keyboard navigation', async ({ page }) => {
      // Tab through main navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Navigate to search using keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="search-input"]:focus')).toBeVisible();

      // Search using keyboard
      await page.keyboard.fill('json');
      await page.keyboard.press('Enter');

      // Should navigate to first result
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('json');
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      await page.locator('[data-testid="mobile-menu-toggle"]').click();

      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

      // Check tool cards adapt to mobile
      await expect(page.locator('[data-testid="tools-grid"]')).toBeVisible();
      const toolCards = page.locator('[data-testid^="tool-"]');
      await expect(toolCards.first()).toBeVisible();

      // Navigate to tool on mobile
      await toolCards.first().click();
      await waitForPageLoad(page);

      // Tool should be usable on mobile
      await expect(page.locator('[data-testid^="tool-"]')).toBeVisible();
      await expect(page.locator('[data-testid*="input"]')).toBeVisible();
    });

    test('should support screen reader accessibility', async ({ page }) => {
      // Check ARIA labels
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toHaveAttribute('role', 'heading');

      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toHaveAttribute('aria-label');

      const toolCards = page.locator('[data-testid^="tool-"]');
      await expect(toolCards.first()).toHaveAttribute('aria-label');
    });
  });

  test.describe('Performance and Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      // Try to navigate to tool
      await page.goto('/tools/json/formatter');

      // Should show offline message or handle gracefully
      await expect(page.locator('[data-testid="offline-message"], [data-testid="error-state"]')).toBeVisible({ timeout: 5000 });
    });

    test('should handle large inputs efficiently', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/json/formatter');

      // Create large JSON (1MB+)
      const largeObject = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(100),
        }))
      };

      const largeJson = JSON.stringify(largeObject, null, 2);

      // Measure time
      const startTime = Date.now();

      await toolHelper.typeInput(largeJson, { delay: 10 });
      await toolHelper.clickActionbutton('format');

      await toolHelper.waitForToolOutput();

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time (30 seconds for very large data)
      expect(processingTime).toBeLessThan(30000);

      // Should show results
      const output = await toolHelper.getOutputArea();
      expect(output).toBeVisible();
    });

    test('should prevent XSS and security issues', async ({ page }) => {
      const toolHelper = new ToolPageHelper(page);

      await toolHelper.navigateToTool('/tools/json/formatter');

      // Try XSS payload
      const xssPayload = '{"name": "<script>alert(\'xss\')</script>", "html": "<img src=x onerror=alert(\'xss\')>"}';

      await toolHelper.typeInput(xssPayload);
      await toolHelper.clickActionbutton('format');

      await toolHelper.waitForToolOutput();

      // Script should not execute
      await page.waitForTimeout(2000);

      // Check that no alerts were triggered
      const alertHandled = await page.evaluate(() => {
        return (window as any).alertTriggered || false;
      });

      expect(alertHandled).toBe(false);

      // Output should be escaped
      const output = await toolHelper.getOutputArea();
      const outputText = await output.inputValue();
      expect(outputText).not.toContain('<script>');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work consistently across different browsers', async ({ page, browserName }) => {
      const toolHelper = new ToolPageHelper(page);

      // Test basic workflow
      await toolHelper.navigateToTool('/tools/json/formatter');
      await toolHelper.typeInput(testFixtures.validJson.simple);
      await toolHelper.clickActionbutton('format');

      await toolHelper.waitForToolOutput();

      const output = await toolHelper.getOutputArea();
      const outputText = await output.inputValue();

      // Results should be consistent across browsers
      expect(outputText).toContain('  "name": "John Doe"');
      expect(outputText).toContain('  "age": 30');

      console.log(`Test passed on ${browserName}`);
    });
  });
});
