import { test, expect } from '@playwright/test';

test.describe('JSON Tools E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the tools page
		await page.goto('/tools');
	});

	test.describe('JSON Formatter', () => {
		test('should format JSON correctly', async ({ page }) => {
			// Navigate to JSON formatter
			await page.click('a[href="/tools/json/formatter"]');
			await page.waitForLoadState('networkidle');

			// Input unformatted JSON
			const unformattedJSON = '{"name":"John","age":30,"city":"New York"}';
			await page.fill('textarea[placeholder*="JSON"]', unformattedJSON);

			// Click format button
			await page.click('button:has-text("Format")');

			// Wait for result
			await page.waitForSelector('textarea[readonly]');

			// Check if formatted
			const formatted = await page.inputValue('textarea[readonly]');
			expect(formatted).toContain('{');
			expect(formatted).toContain('  "name": "John"');
			expect(formatted).toContain('  "age": 30');
			expect(formatted).toContain('  "city": "New York"');
		});

		test('should handle invalid JSON gracefully', async ({ page }) => {
			await page.click('a[href="/tools/json/formatter"]');
			await page.waitForLoadState('networkidle');

			// Input invalid JSON
			const invalidJSON = '{"name":"John","age":30,}';
			await page.fill('textarea[placeholder*="JSON"]', invalidJSON);

			// Click format button
			await page.click('button:has-text("Format")');

			// Should show error message
			await expect(page.locator('text=Invalid JSON')).toBeVisible();
		});
	});

	test.describe('JSON Validator', () => {
		test('should validate valid JSON', async ({ page }) => {
			await page.click('a[href="/tools/json/validator"]');
			await page.waitForLoadState('networkidle');

			const validJSON = '{"name":"John","age":30,"hobbies":["reading","coding"]}';
			await page.fill('textarea[placeholder*="JSON"]', validJSON);

			await page.click('button:has-text("Validate")');

			// Should show success message
			await expect(page.locator('text=Valid JSON')).toBeVisible();
		});

		test('should detect invalid JSON', async ({ page }) => {
			await page.click('a[href="/tools/json/validator"]');
			await page.waitForLoadState('networkidle');

			const invalidJSON = '{"name":"John","age":30,}';
			await page.fill('textarea[placeholder*="JSON"]', invalidJSON);

			await page.click('button:has-text("Validate")');

			// Should show error message
			await expect(page.locator('text=Invalid JSON')).toBeVisible();
			await expect(page.locator('text=Parse error')).toBeVisible();
		});
	});

	test.describe('JSON Converter', () => {
		test('should convert JSON to YAML', async ({ page }) => {
			await page.click('a[href="/tools/json/converter"]');
			await page.waitForLoadState('networkidle');

			const jsonData = '{"name":"John","age":30,"active":true}';
			await page.fill('textarea[placeholder*="JSON"]', jsonData);

			// Select YAML as target format
			await page.selectOption('select', 'yaml');

			await page.click('button:has-text("Convert")');

			// Wait for result
			await page.waitForSelector('textarea[readonly]');

			const result = await page.inputValue('textarea[readonly]');
			expect(result).toContain('name: John');
			expect(result).toContain('age: 30');
			expect(result).toContain('active: true');
		});

		test('should convert JSON to CSV', async ({ page }) => {
			await page.click('a[href="/tools/json/converter"]');
			await page.waitForLoadState('networkidle');

			const jsonArrayData = '[{"name":"John","age":30},{"name":"Jane","age":25}]';
			await page.fill('textarea[placeholder*="JSON"]', jsonArrayData);

			// Select CSV as target format
			await page.selectOption('select', 'csv');

			await page.click('button:has-text("Convert")');

			const result = await page.inputValue('textarea[readonly]');
			expect(result).toContain('name,age');
			expect(result).toContain('John,30');
			expect(result).toContain('Jane,25');
		});
	});

	test.describe('JSONPath Queries', () => {
		test('should execute JSONPath queries', async ({ page }) => {
			await page.click('a[href="/tools/json/path-queries"]');
			await page.waitForLoadState('networkidle');

			const jsonData =
				'{"store":{"book":[{"category":"reference","author":"Nigel Rees","title":"Sayings of the Century","price":8.95},{"category":"fiction","author":"Evelyn Waugh","title":"Sword of Honour","price":12.99}],"bicycle":{"color":"red","price":19.95}}}';
			await page.fill('textarea[placeholder*="JSON"]', jsonData);

			// Enter JSONPath query
			await page.fill('input[placeholder*="JSONPath"]', '$.store.book[*].author');

			await page.click('button:has-text("Query")');

			// Wait for results
			await page.waitForSelector('text=Query Results');

			const results = await page.locator('[data-testid="query-results"]').textContent();
			expect(results).toContain('Nigel Rees');
			expect(results).toContain('Evelyn Waugh');
		});
	});

	test.describe('JSON Sorter', () => {
		test('should sort JSON keys alphabetically', async ({ page }) => {
			await page.click('a[href="/tools/json/sorter"]');
			await page.waitForLoadState('networkidle');

			const unsortedJSON = '{"z":1,"a":2,"m":3,"b":4}';
			await page.fill('textarea[placeholder*="JSON"]', unsortedJSON);

			await page.click('button:has-text("Sort")');

			const result = await page.inputValue('textarea[readonly]');
			const lines = result.split('\n').filter((line) => line.trim());

			// Check if keys are sorted
			expect(lines[1].trim()).toContain('"a"');
			expect(lines[2].trim()).toContain('"b"');
			expect(lines[3].trim()).toContain('"m"');
			expect(lines[4].trim()).toContain('"z"');
		});
	});

	test.describe('JWT Decoder', () => {
		test('should decode JWT tokens', async ({ page }) => {
			await page.click('a[href="/tools/json/jwt-decoder"]');
			await page.waitForLoadState('networkidle');

			// Sample JWT token (for testing only)
			const jwtToken =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

			await page.fill('textarea[placeholder*="JWT"]', jwtToken);
			await page.click('button:has-text("Decode")');

			// Wait for results
			await page.waitForSelector('[data-testid="jwt-header"]');
			await page.waitForSelector('[data-testid="jwt-payload"]');

			// Check header
			const headerContent = await page.locator('[data-testid="jwt-header"]').textContent();
			expect(headerContent).toContain('alg');
			expect(headerContent).toContain('typ');

			// Check payload
			const payloadContent = await page.locator('[data-testid="jwt-payload"]').textContent();
			expect(payloadContent).toContain('sub');
			expect(payloadContent).toContain('name');
			expect(payloadContent).toContain('1234567890');
			expect(payloadContent).toContain('John Doe');
		});

		test('should handle invalid JWT tokens', async ({ page }) => {
			await page.click('a[href="/tools/json/jwt-decoder"]');
			await page.waitForLoadState('networkidle');

			const invalidJWT = 'invalid.jwt.token';
			await page.fill('textarea[placeholder*="JWT"]', invalidJWT);
			await page.click('button:has-text("Decode")');

			// Should show error message
			await expect(page.locator('text=Invalid JWT format')).toBeVisible();
		});
	});

	test.describe('JSON Schema Generator', () => {
		test('should generate JSON schema', async ({ page }) => {
			await page.click('a[href="/tools/json/schema-generator"]');
			await page.waitForLoadState('networkidle');

			const sampleJSON = '{"name":"John","age":30,"active":true,"tags":["developer","javascript"]}';
			await page.fill('textarea[placeholder*="JSON"]', sampleJSON);

			await page.click('button:has-text("Generate Schema")');

			const result = await page.inputValue('textarea[readonly]');
			const schema = JSON.parse(result);

			expect(schema).toHaveProperty('$schema');
			expect(schema).toHaveProperty('type', 'object');
			expect(schema.properties).toHaveProperty('name', { type: 'string' });
			expect(schema.properties).toHaveProperty('age', { type: 'integer' });
			expect(schema.properties).toHaveProperty('active', { type: 'boolean' });
			expect(schema.properties).toHaveProperty('tags');
		});
	});

	test.describe('JSON5 Parser', () => {
		test('should parse JSON5 with comments', async ({ page }) => {
			await page.click('a[href="/tools/json/json5-parser"]');
			await page.waitForLoadState('networkidle');

			const json5Input = `{
        // This is a comment
        "name": "John", /* Another comment */
        "age": 30,
        "hobbies": ["coding", "reading",],
      }`;

			await page.fill('textarea[placeholder*="JSON5"]', json5Input);
			await page.click('button:has-text("Parse")');

			const result = await page.inputValue('textarea[readonly]');
			const parsed = JSON.parse(result);

			expect(parsed.name).toBe('John');
			expect(parsed.age).toBe(30);
			expect(parsed.hobbies).toContain('coding');
			expect(parsed.hobbies).toContain('reading');
		});
	});

	test.describe('JSON Minifier', () => {
		test('should minify JSON', async ({ page }) => {
			await page.click('a[href="/tools/json/minifier"]');
			await page.waitForLoadState('networkidle');

			const formattedJSON = `{
        "name": "John",
        "age": 30,
        "active": true
      }`;

			await page.fill('textarea[placeholder*="JSON"]', formattedJSON);
			await page.click('button:has-text("Minify")');

			const result = await page.inputValue('textarea[readonly]');
			expect(result).toBe('{"name":"John","age":30,"active":true}');
		});
	});

	test.describe('Cross-tool functionality', () => {
		test('should maintain consistency across tools', async ({ page }) => {
			const testJSON = '{"name":"John","age":30,"active":true}';

			// Test in formatter
			await page.click('a[href="/tools/json/formatter"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="JSON"]', testJSON);
			await page.click('button:has-text("Format")');
			await expect(page.locator('textarea[readonly]')).toBeVisible();

			// Test in validator
			await page.click('a[href="/tools/json/validator"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="JSON"]', testJSON);
			await page.click('button:has-text("Validate")');
			await expect(page.locator('text=Valid JSON')).toBeVisible();

			// Test in minifier
			await page.click('a[href="/tools/json/minifier"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="JSON"]', testJSON);
			await page.click('button:has-text("Minify")');
			await expect(page.locator('textarea[readonly]')).toBeVisible();
		});
	});

	test.describe('Error handling', () => {
		test('should handle large JSON files gracefully', async ({ page }) => {
			await page.click('a[href="/tools/json/formatter"]');
			await page.waitForLoadState('networkidle');

			// Generate large JSON
			const largeJSON = JSON.stringify({
				data: Array.from({ length: 1000 }, (_, i) => ({
					id: i,
					name: `Item ${i}`,
					description: `This is a description for item ${i}`,
					metadata: {
						created: new Date().toISOString(),
						updated: new Date().toISOString(),
						tags: [`tag${i}`, `category${i % 10}`],
					},
				})),
			});

			await page.fill('textarea[placeholder*="JSON"]', largeJSON);
			await page.click('button:has-text("Format")');

			// Should still work with large JSON
			await expect(page.locator('textarea[readonly]')).toBeVisible();

			const result = await page.inputValue('textarea[readonly]');
			expect(result).toContain('"data"');
			expect(result).toContain('"id"');
		});

		test('should handle malformed UTF-8 characters', async ({ page }) => {
			await page.click('a[href="/tools/json/validator"]');
			await page.waitForLoadState('networkidle');

			const malformedJSON = '{"name":"John\\uD800Invalid","age":30}';
			await page.fill('textarea[placeholder*="JSON"]', malformedJSON);
			await page.click('button:has-text("Validate")');

			// Should handle gracefully
			await expect(page.locator('text=Invalid JSON')).toBeVisible();
		});
	});

	test.describe('Performance tests', () => {
		test('should complete operations within reasonable time', async ({ page }) => {
			await page.click('a[href="/tools/json/formatter"]');
			await page.waitForLoadState('networkidle');

			const startTime = Date.now();

			const testJSON = '{"nested":{"deep":{"value":{}}}}';
			await page.fill('textarea[placeholder*="JSON"]', testJSON);
			await page.click('button:has-text("Format")');

			// Wait for completion
			await page.waitForSelector('textarea[readonly]');

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should complete within 5 seconds
			expect(duration).toBeLessThan(5000);
		});
	});
});
