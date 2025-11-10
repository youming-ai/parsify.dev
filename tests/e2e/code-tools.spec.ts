import { test, expect } from '@playwright/test';

test.describe('Code Tools E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the tools page
		await page.goto('/tools');
	});

	test.describe('Code Executor', () => {
		test('should execute JavaScript code', async ({ page }) => {
			// Navigate to code executor
			await page.click('a[href="/tools/code/executor"]');
			await page.waitForLoadState('networkidle');

			// Input JavaScript code
			const jsCode = 'console.log("Hello World");\\nconst result = 2 + 3;\\nconsole.log(result);';
			await page.fill('textarea[placeholder*="code"]', jsCode);

			// Select JavaScript language
			await page.selectOption('select[name="language"]', 'javascript');

			// Click execute button
			await page.click('button:has-text("Execute")');

			// Wait for result
			await page.waitForSelector('[data-testid="execution-output"]');

			// Check if output contains expected results
			const output = await page.locator('[data-testid="execution-output"]').textContent();
			expect(output).toContain('Hello World');
			expect(output).toContain('5');
		});

		test('should handle execution errors gracefully', async ({ page }) => {
			await page.click('a[href="/tools/code/executor"]');
			await page.waitForLoadState('networkidle');

			// Input invalid JavaScript
			const invalidCode = 'function invalid( { return; }';
			await page.fill('textarea[placeholder*="code"]', invalidCode);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Execute")');

			// Should show error message
			await expect(page.locator('text=Error')).toBeVisible();
			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
		});

		test('should support multiple languages', async ({ page }) => {
			await page.click('a[href="/tools/code/executor"]');
			await page.waitForLoadState('networkidle');

			// Test Python code
			const pythonCode = 'print("Hello from Python")\\nx = 10 + 5\\nprint(f"Result: {x}")';
			await page.fill('textarea[placeholder*="code"]', pythonCode);
			await page.selectOption('select[name="language"]', 'python');
			await page.click('button:has-text("Execute")');

			// Wait for result
			await page.waitForSelector('[data-testid="execution-output"]', { timeout: 10000 });

			const output = await page.locator('[data-testid="execution-output"]').textContent();
			expect(output).toContain('Hello from Python');
			expect(output).toContain('Result: 15');
		});
	});

	test.describe('Code Formatter', () => {
		test('should format JavaScript code', async ({ page }) => {
			await page.click('a[href="/tools/code/formatter"]');
			await page.waitForLoadState('networkidle');

			// Input unformatted code
			const unformattedCode = 'function test(){if(true){console.log("hello");}else{console.log("goodbye");}}';
			await page.fill('textarea[placeholder*="code"]', unformattedCode);

			// Select JavaScript and click format
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Format")');

			// Wait for result
			await page.waitForSelector('textarea[readonly]');

			const formatted = await page.inputValue('textarea[readonly]');
			expect(formatted).toContain('function test() {');
			expect(formatted).toContain('if (true) {');
			expect(formatted).toContain('console.log("hello");');
			expect(formatted).toContain('} else {');
			expect(formatted).toContain('console.log("goodbye");');
		});

		test('should format CSS code', async ({ page }) => {
			await page.click('a[href="/tools/code/formatter"]');
			await page.waitForLoadState('networkidle');

			const unformattedCSS =
				'.container{display:flex;justify-content:center;align-items:center;margin:20px;padding:15px;}';
			await page.fill('textarea[placeholder*="code"]', unformattedCSS);
			await page.selectOption('select[name="language"]', 'css');
			await page.click('button:has-text("Format")');

			const formatted = await page.inputValue('textarea[readonly]');
			expect(formatted).toContain('.container {');
			expect(formatted).toContain('display: flex;');
			expect(formatted).toContain('justify-content: center;');
			expect(formatted).toContain('align-items: center;');
		});

		test('should format HTML code', async ({ page }) => {
			await page.click('a[href="/tools/code/formatter"]');
			await page.waitForLoadState('networkidle');

			const unformattedHTML = '<div class="container"><h1>Hello</h1><p>World</p></div>';
			await page.fill('textarea[placeholder*="code"]', unformattedHTML);
			await page.selectOption('select[name="language"]', 'html');
			await page.click('button:has-text("Format")');

			const formatted = await page.inputValue('textarea[readonly]');
			expect(formatted).toContain('<div class="container">');
			expect(formatted).toContain('  <h1>Hello</h1>');
			expect(formatted).toContain('  <p>World</p>');
			expect(formatted).toContain('</div>');
		});
	});

	test.describe('Code Minifier', () => {
		test('should minify JavaScript code', async ({ page }) => {
			await page.click('a[href="/tools/code/minifier"]');
			await page.waitForLoadState('networkidle');

			// Input code with comments and extra whitespace
			const code = `
        // This is a comment
        function calculateSum(a, b) {
          const result = a + b; // Another comment
          return result;
        }

        // This function multiplies two numbers
        function multiply(x, y) {
          return x * y;
        }
      `;

			await page.fill('textarea[placeholder*="code"]', code);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Minify")');

			const minified = await page.inputValue('textarea[readonly]');

			// Comments should be removed
			expect(minified).not.toContain('This is a comment');
			expect(minified).not.toContain('Another comment');

			// Extra whitespace should be removed
			expect(minified).toContain('function calculateSum(a,b)');
			expect(minified).toContain('function multiply(x,y)');
		});

		test('should show compression statistics', async ({ page }) => {
			await page.click('a[href="/tools/code/minifier"]');
			await page.waitForLoadState('networkidle');

			const code = 'function test() { return "Hello World"; }';
			await page.fill('textarea[placeholder*="code"]', code);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Minify")');

			// Should show compression stats
			await expect(page.locator('[data-testid="compression-stats"]')).toBeVisible();
			await expect(page.locator('text=Original size')).toBeVisible();
			await expect(page.locator('text=Minified size')).toBeVisible();
			await expect(page.locator('text=Compression ratio')).toBeVisible();
		});
	});

	test.describe('Code Obfuscator', () => {
		test('should obfuscate JavaScript code', async ({ page }) => {
			await page.click('a[href="/tools/code/obfuscator"]');
			await page.waitForLoadState('networkidle');

			const code = `
        function calculateTotal(price, quantity) {
          const subtotal = price * quantity;
          const tax = subtotal * 0.1;
          return subtotal + tax;
        }
      `;

			await page.fill('textarea[placeholder*="code"]', code);
			await page.selectOption('select[name="language"]', 'javascript');

			// Set obfuscation level
			await page.selectOption('select[name="obfuscation-level"]', 'medium');

			await page.click('button:has-text("Obfuscate")');

			const obfuscated = await page.inputValue('textarea[readonly]');

			// Variable names should be changed
			expect(obfuscated).toMatch(/function\s+_\d+\s*\(/);

			// API names should be preserved
			expect(obfuscated).toContain('Math'); // if Math was used
		});

		test('should handle different obfuscation levels', async ({ page }) => {
			await page.click('a[href="/tools/code/obfuscator"]');
			await page.waitForLoadState('networkidle');

			const code = 'function test() { const message = "Hello"; return message; }';
			await page.fill('textarea[placeholder*="code"]', code);
			await page.selectOption('select[name="language"]', 'javascript');

			// Test high-level obfuscation
			await page.selectOption('select[name="obfuscation-level"]', 'high');
			await page.click('button:has-text("Obfuscate")');

			const obfuscated = await page.inputValue('textarea[readonly]');

			// High level should be more aggressive
			expect(obfuscated).toMatch(/function\s+_\d+/);
		});
	});

	test.describe('Code Comparator', () => {
		test('should compare two pieces of code', async ({ page }) => {
			await page.click('a[href="/tools/code/comparator"]');
			await page.waitForLoadState('networkidle');

			const code1 = 'function calculate(a, b) { return a + b; }';
			const code2 = 'function calculate(a, b) { return a * b; }';

			await page.fill('textarea[placeholder*="original code"]', code1);
			await page.fill('textarea[placeholder*="compare code"]', code2);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Compare")');

			// Wait for diff results
			await page.waitForSelector('[data-testid="diff-results"]');

			// Should show modified lines
			await expect(page.locator('[data-testid="modified-lines"]')).toBeVisible();
			await expect(page.locator('text=return a + b')).toBeVisible();
			await expect(page.locator('text=return a * b')).toBeVisible();
		});

		test('should show added and removed lines', async ({ page }) => {
			await page.click('a[href="/tools/code/comparator"]');
			await page.waitForLoadState('networkidle');

			const code1 = 'function test() { return 1; }';
			const code2 = 'function test() { console.log("testing"); return 2; }';

			await page.fill('textarea[placeholder*="original code"]', code1);
			await page.fill('textarea[placeholder*="compare code"]', code2);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Compare")');

			// Should show added lines
			await expect(page.locator('[data-testid="added-lines"]')).toBeVisible();
			await expect(page.locator('text=console.log("testing")')).toBeVisible();
		});

		test('should ignore whitespace when requested', async ({ page }) => {
			await page.click('a[href="/tools/code/comparator"]');
			await page.waitForLoadState('networkidle');

			const code1 = 'function test() { return 1; }';
			const code2 = 'function test() {\\n  return 1;\\n}';

			await page.fill('textarea[placeholder*="original code"]', code1);
			await page.fill('textarea[placeholder*="compare code"]', code2);
			await page.selectOption('select[name="language"]', 'javascript');

			// Enable ignore whitespace option
			await page.check('input[name="ignore-whitespace"]');

			await page.click('button:has-text("Compare")');

			// Should show no differences
			await expect(page.locator('text=No differences found')).toBeVisible();
		});
	});

	test.describe('Regex Tester', () => {
		test('should test regular expressions', async ({ page }) => {
			await page.click('a[href="/tools/code/regex"]');
			await page.waitForLoadState('networkidle');

			const testString = 'Contact us at support@example.com or admin@company.org';
			const regex = '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g';

			await page.fill('input[placeholder*="test text"]', testString);
			await page.fill('input[placeholder*="regular expression"]', regex);
			await page.click('button:has-text("Test")');

			// Wait for results
			await page.waitForSelector('[data-testid="regex-results"]');

			// Should show matches
			await expect(page.locator('text=support@example.com')).toBeVisible();
			await expect(page.locator('text=admin@company.org')).toBeVisible();
		});

		test('should show match groups', async ({ page }) => {
			await page.click('a[href="/tools/code/regex"]');
			await page.waitForLoadState('networkidle');

			const testString = 'Name: John Doe, Age: 30';
			const regex = '/Name: ([A-Za-z]+) ([A-Za-z]+), Age: (\\d+)/';

			await page.fill('input[placeholder*="test text"]', testString);
			await page.fill('input[placeholder*="regular expression"]', regex);
			await page.click('button:has-text("Test")');

			// Should show groups
			await expect(page.locator('[data-testid="match-groups"]')).toBeVisible();
			await expect(page.locator('text=John')).toBeVisible();
			await expect(page.locator('text=Doe')).toBeVisible();
			await expect(page.locator('text=30')).toBeVisible();
		});

		test('should handle invalid regex gracefully', async ({ page }) => {
			await page.click('a[href="/tools/code/regex"]');
			await page.waitForLoadState('networkidle');

			await page.fill('input[placeholder*="test text"]', 'test string');
			await page.fill('input[placeholder*="regular expression"]', '[invalid regex');
			await page.click('button:has-text("Test")');

			// Should show error message
			await expect(page.locator('text=Invalid regular expression')).toBeVisible();
		});
	});

	test.describe('Cross-tool functionality', () => {
		test('should maintain consistency across code tools', async ({ page }) => {
			const testCode = 'function example() { return 42; }';

			// Test in formatter
			await page.click('a[href="/tools/code/formatter"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="code"]', testCode);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Format")');
			await expect(page.locator('textarea[readonly]')).toBeVisible();

			// Test in minifier
			await page.click('a[href="/tools/code/minifier"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="code"]', testCode);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Minify")');
			await expect(page.locator('textarea[readonly]')).toBeVisible();

			// Test in obfuscator
			await page.click('a[href="/tools/code/obfuscator"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="code"]', testCode);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Obfuscate")');
			await expect(page.locator('textarea[readonly]')).toBeVisible();
		});
	});

	test.describe('Performance tests', () => {
		test('should handle large code files efficiently', async ({ page }) => {
			await page.click('a[href="/tools/code/formatter"]');
			await page.waitForLoadState('networkidle');

			// Generate large code file
			const largeCode = Array.from({ length: 1000 }, (_, i) => `function func${i}() { return ${i}; }`).join('\\n');

			const startTime = Date.now();

			await page.fill('textarea[placeholder*="code"]', largeCode);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Format")');

			// Wait for completion
			await page.waitForSelector('textarea[readonly]');

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should complete within reasonable time
			expect(duration).toBeLessThan(10000); // 10 seconds
		});

		test('should complete operations within reasonable time', async ({ page }) => {
			await page.click('a[href="/tools/code/minifier"]');
			await page.waitForLoadState('networkidle');

			const startTime = Date.now();

			const testCode = 'function test() { return "performance test"; }';
			await page.fill('textarea[placeholder*="code"]', testCode);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Minify")');

			await page.waitForSelector('textarea[readonly]');

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should complete within 5 seconds
			expect(duration).toBeLessThan(5000);
		});
	});

	test.describe('Error handling', () => {
		test('should handle empty inputs gracefully', async ({ page }) => {
			await page.click('a[href="/tools/code/formatter"]');
			await page.waitForLoadState('networkidle');

			// Don't input any code and try to format
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Format")');

			// Should handle gracefully
			const result = await page.inputValue('textarea[readonly]');
			expect(result).toBe('');
		});

		test('should show helpful error messages', async ({ page }) => {
			await page.click('a[href="/tools/code/executor"]');
			await page.waitForLoadState('networkidle');

			// Input code that will cause an error
			const errorCode = 'throw new Error("Test error");';
			await page.fill('textarea[placeholder*="code"]', errorCode);
			await page.selectOption('select[name="language"]', 'javascript');
			await page.click('button:has-text("Execute")');

			// Should show error details
			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
			await expect(page.locator('text=Test error')).toBeVisible();
		});
	});

	test.describe('UI/UX tests', () => {
		test('should show loading states during processing', async ({ page }) => {
			await page.click('a[href="/tools/code/formatter"]');
			await page.waitForLoadState('networkidle');

			const code = 'function test() { return 1; }';
			await page.fill('textarea[placeholder*="code"]', code);
			await page.selectOption('select[name="language"]', 'javascript');

			// Click format and check for loading state
			await page.click('button:has-text("Format")');

			// Should show loading indicator
			await expect(page.locator('[data-testid="loading"]')).toBeVisible();

			// Wait for completion
			await page.waitForSelector('textarea[readonly]');

			// Loading should be gone
			await expect(page.locator('[data-testid="loading"]')).not.toBeVisible();
		});

		test('should support keyboard shortcuts', async ({ page }) => {
			await page.click('a[href="/tools/code/formatter"]');
			await page.waitForLoadState('networkidle');

			await page.fill('textarea[placeholder*="code"]', 'function test() { return 1; }');
			await page.selectOption('select[name="language"]', 'javascript');

			// Test Ctrl/Cmd + Enter to format
			if (process.platform === 'darwin') {
				await page.keyboard.press('Meta+Enter');
			} else {
				await page.keyboard.press('Control+Enter');
			}

			// Should format the code
			await page.waitForSelector('textarea[readonly]');
			const result = await page.inputValue('textarea[readonly]');
			expect(result).toContain('function test() {');
		});
	});
});
