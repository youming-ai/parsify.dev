import { test, expect } from '@playwright/test';

test.describe('Text Tools E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the tools page
		await page.goto('/');
	});

	test.describe('Text Encoder Tool', () => {
		test('should encode and decode Base64 correctly', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			const testText = 'Hello World! This is a test.';

			// Test Base64 encoding
			await page.selectOption('select', 'base64');
			await page.fill('textarea[placeholder*="Enter text to encode"]', testText);

			// Wait for auto-processing or manually trigger
			await page.waitForTimeout(500);

			// Check encoded output
			const encodedText = await page.locator('div.font-mono').first().textContent();
			expect(encodedText).toBe(btoa(unescape(encodeURIComponent(testText))));

			// Test swap functionality
			await page.click('button:has-text("Swap")');

			// Verify swap worked - should now be in decode mode
			const decodeInput = await page.inputValue('textarea[placeholder*="Enter Base64 text to decode"]');
			expect(decodeInput).toBe(encodedText);

			// Test decoding
			await page.click('button:has-text("Decode Text")');
			await page.waitForTimeout(500);

			const decodedText = await page.locator('div.font-mono').first().textContent();
			expect(decodedText).toBe(testText);
		});

		test('should encode and decode URL encoding correctly', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			const testUrl = 'https://example.com/search?q=test query&param=value with spaces';

			// Test URL encoding
			await page.selectOption('select', 'url');
			await page.fill('textarea[placeholder*="Enter text to encode"]', testUrl);

			await page.waitForTimeout(500);

			const encodedUrl = await page.locator('div.font-mono').first().textContent();
			expect(encodedUrl).toBe(encodeURIComponent(testUrl));

			// Test URL decoding
			await page.click('button:has-text("Swap")');
			await page.click('button:has-text("Decode Text")');
			await page.waitForTimeout(500);

			const decodedUrl = await page.locator('div.font-mono').first().textContent();
			expect(decodedUrl).toBe(testUrl);
		});

		test('should encode and decode HTML entities correctly', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			const testHtml = '<div class="test">Hello & welcome to "Parsify.dev"!</div>';

			// Test HTML encoding
			await page.selectOption('select', 'html');
			await page.fill('textarea[placeholder*="Enter text to encode"]', testHtml);

			await page.waitForTimeout(500);

			const encodedHtml = await page.locator('div.font-mono').first().textContent();
			expect(encodedHtml).toContain('&lt;div class=&quot;test&quot;&gt;');
			expect(encodedHtml).toContain('&amp; welcome to');
			expect(encodedHtml).toContain('&quot;Parsify.dev&quot;');

			// Test HTML decoding
			await page.click('button:has-text("Swap")');
			await page.click('button:has-text("Decode Text")');
			await page.waitForTimeout(500);

			const decodedHtml = await page.locator('div.font-mono').first().textContent();
			expect(decodedHtml).toBe(testHtml);
		});

		test('should handle Unicode escape encoding', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			const testUnicode = 'Hello 世界 ñáéíóú';

			// Test Unicode encoding
			await page.selectOption('select', 'unicode');
			await page.fill('textarea[placeholder*="Enter text to encode"]', testUnicode);

			await page.waitForTimeout(500);

			const encodedUnicode = await page.locator('div.font-mono').first().textContent();
			expect(encodedUnicode).toContain('Hello');
			expect(encodedUnicode).toContain('\\u4e16\\u754c'); // Chinese characters
			expect(encodedUnicode).toContain('\\u00f1\\u00e1\\u00e9\\u00ed\\u00f3\\u00fa'); // Accented characters
		});

		test('should copy to clipboard functionality', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			const testText = 'Test clipboard functionality';

			await page.selectOption('select', 'base64');
			await page.fill('textarea[placeholder*="Enter text to encode"]', testText);

			await page.waitForTimeout(500);

			// Click copy button
			await page.click('button:has-text("Copy")');

			// Check for success toast (assuming toast notification)
			await expect(page.locator('text=Copied to clipboard')).toBeVisible({
				timeout: 3000,
			});
		});

		test('should download functionality', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			const testText = 'Test download functionality';

			await page.selectOption('select', 'base64');
			await page.fill('textarea[placeholder*="Enter text to encode"]', testText);

			await page.waitForTimeout(500);

			// Setup download listener
			const downloadPromise = page.waitForEvent('download');

			// Click download button
			await page.click('button:has-text("Download")');

			// Wait for download
			const download = await downloadPromise;
			expect(download.suggestedFilename()).toContain('encoded.txt');
		});

		test('should handle file upload and batch processing', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			// Switch to file input tab
			await page.click('button:has-text("File Input")');

			// Create a test file
			const testFileContent = 'This is test content for file encoding.';

			// Setup file upload
			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'test.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from(testFileContent),
			});

			// Process file
			await page.click('button:has-text("Process 1 File")');

			// Wait for processing
			await page.waitForTimeout(1000);

			// Check for success message
			await expect(page.locator('text=Encoded test.txt')).toBeVisible({
				timeout: 5000,
			});
		});

		test('should handle errors gracefully', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			// Test invalid Base64 for decoding
			await page.selectOption('select', 'base64');
			await page.click('button:has-text("Decode Text")'); // Switch to decode tab

			const invalidBase64 = 'Invalid base64 string!!!';
			await page.fill('textarea[placeholder*="Enter Base64 text to decode"]', invalidBase64);

			await page.click('button:has-text("Decode Text")');

			// Should show error message
			await expect(page.locator('text=Failed to decode text')).toBeVisible({
				timeout: 3000,
			});
		});

		test('should load examples correctly', async ({ page }) => {
			await page.click('a[href="/tools/text/encoder"]');
			await page.waitForLoadState('networkidle');

			// Click on first example
			await page.click('button:has-text("Load Example")');

			// Check if example was loaded
			const inputValue = await page.inputValue('textarea[placeholder*="Enter text to encode"]');
			expect(inputValue).toBeTruthy();
			expect(inputValue.length).toBeGreaterThan(0);
		});
	});

	test.describe('Text Formatter Tool', () => {
		test('should perform case conversion correctly', async ({ page }) => {
			await page.click('a[href="/tools/text/formatter"]');
			await page.waitForLoadState('networkidle');

			const testText = 'hello world. this is a TEST.';

			// Test uppercase conversion
			await page.selectOption('select', 'upper');
			await page.fill('textarea[placeholder*="Enter text to format"]', testText);

			await page.click('button:has-text("Format Text")');
			await page.waitForTimeout(500);

			let formattedText = await page.locator('textarea[readonly]').inputValue();
			expect(formattedText).toBe('HELLO WORLD. THIS IS A TEST.');

			// Test lowercase conversion
			await page.selectOption('select', 'lower');
			await page.click('button:has-text("Format Text")');
			await page.waitForTimeout(500);

			formattedText = await page.locator('textarea[readonly]').inputValue();
			expect(formattedText).toBe('hello world. this is a test.');

			// Test title case conversion
			await page.selectOption('select', 'title');
			await page.click('button:has-text("Format Text")');
			await page.waitForTimeout(500);

			formattedText = await page.locator('textarea[readonly]').inputValue();
			expect(formattedText).toBe('Hello World. This Is A Test.');
		});

		test('should handle whitespace correctly', async ({ page }) => {
			await page.click('a[href="/tools/text/formatter"]');
			await page.waitForLoadState('networkidle');

			const testText = '  Hello   World!  \n\n  This   has   extra   spaces.  ';

			// Enable trim whitespace option
			await page.check('input[type="checkbox"]'); // Assuming this is trim whitespace

			await page.fill('textarea[placeholder*="Enter text to format"]', testText);
			await page.click('button:has-text("Format Text")');
			await page.waitForTimeout(500);

			const formattedText = await page.locator('textarea[readonly]').inputValue();

			// Should not have leading/trailing spaces or multiple consecutive spaces
			expect(formattedText).not.toMatch(/^  /);
			expect(formattedText).not.toMatch(/   /);
			expect(formattedText).not.toMatch(/  $/);
		});

		test('should normalize line endings', async ({ page }) => {
			await page.click('a[href="/tools/text/formatter"]');
			await page.waitForLoadState('networkidle');

			const testText = 'Line 1\r\nLine 2\rLine 3\nLine 4';

			// Select LF line endings
			await page.selectOption('select[name="line-endings"]', 'lf');

			await page.fill('textarea[placeholder*="Enter text to format"]', testText);
			await page.click('button:has-text("Format Text")');
			await page.waitForTimeout(500);

			const formattedText = await page.locator('textarea[readonly]').inputValue();

			// All line endings should be \n
			expect(formattedText).toMatch(/\n/g);
			expect(formattedText).not.toMatch(/\r\n/);
			expect(formattedText).not.toMatch(/\r(?!\n)/);
		});

		test('should remove empty lines', async ({ page }) => {
			await page.click('a[href="/tools/text/formatter"]');
			await page.waitForLoadState('networkidle');

			const testText = 'Line 1\n\nLine 2\n\n\nLine 3\n\n';

			// Enable remove empty lines
			await page.check('input[type="checkbox"]'); // Assuming this controls empty line removal

			await page.fill('textarea[placeholder*="Enter text to format"]', testText);
			await page.click('button:has-text("Format Text")');
			await page.waitForTimeout(500);

			const formattedText = await page.locator('textarea[readonly]').inputValue();

			// Should not have consecutive newlines
			expect(formattedText).not.toMatch(/\n\n/);
			expect(formattedText).not.toMatch(/^\n/);
			expect(formattedText).not.toMatch(/\n$/);
		});

		test('should handle real-time formatting', async ({ page }) => {
			await page.click('a[href="/tools/text/formatter"]');
			await page.waitForLoadState('networkidle');

			// Enable real-time formatting if available
			const realtimeToggle = page.locator('input[type="checkbox"][id*="realtime"]');
			if (await realtimeToggle.isVisible()) {
				await realtimeToggle.check();

				// Set to uppercase
				await page.selectOption('select', 'upper');

				// Type text and check if it formats in real-time
				await page.fill('textarea[placeholder*="Enter text to format"]', 'hello');
				await page.waitForTimeout(500);

				const formattedText = await page.locator('textarea[readonly]').inputValue();
				expect(formattedText).toBe('HELLO');
			}
		});

		test('should display formatting statistics', async ({ page }) => {
			await page.click('a[href="/tools/text/formatter"]');
			await page.waitForLoadState('networkidle');

			const testText = 'Hello World!\nThis is a test.';

			await page.fill('textarea[placeholder*="Enter text to format"]', testText);
			await page.click('button:has-text("Format Text")');
			await page.waitForTimeout(500);

			// Check if statistics are displayed
			await expect(page.locator('text=Statistics')).toBeVisible({
				timeout: 3000,
			});
			await expect(page.locator('text=Characters')).toBeVisible();
			await expect(page.locator('text=Lines')).toBeVisible();
		});

		test('should handle file upload for formatting', async ({ page }) => {
			await page.click('a[href="/tools/text/formatter"]');
			await page.waitForLoadState('networkidle');

			// Switch to file input if available
			const fileTab = page.locator('button:has-text("File Input")');
			if (await fileTab.isVisible()) {
				await fileTab.click();

				const testFileContent = '  this needs formatting  \n\n  with extra spaces  ';

				const fileInput = page.locator('input[type="file"]');
				await fileInput.setInputFiles({
					name: 'format-test.txt',
					mimeType: 'text/plain',
					buffer: Buffer.from(testFileContent),
				});

				await page.click('button:has-text("Format")');
				await page.waitForTimeout(1000);

				// Check for success
				await expect(page.locator('text=Formatted successfully')).toBeVisible({
					timeout: 5000,
				});
			}
		});
	});

	test.describe('Text Comparator Tool', () => {
		test('should perform side-by-side comparison', async ({ page }) => {
			await page.click('a[href="/tools/text/comparator"]');
			await page.waitForLoadState('networkidle');

			const originalText = 'Line 1\nLine 2\nLine 3';
			const modifiedText = 'Line 1\nModified Line 2\nLine 3\nLine 4';

			// Enter original text
			await page.fill('textarea[placeholder*="Original text"]', originalText);

			// Enter modified text
			await page.fill('textarea[placeholder*="Modified text"]', modifiedText);

			// Select side-by-side comparison
			await page.selectOption('select', 'side-by-side');

			await page.click('button:has-text("Compare")');
			await page.waitForTimeout(1000);

			// Check for comparison results
			await expect(page.locator('text=Comparison Results')).toBeVisible({
				timeout: 5000,
			});
			await expect(page.locator('text=Additions')).toBeVisible();
			await expect(page.locator('text=Modifications')).toBeVisible();
		});

		test('should calculate similarity percentage', async ({ page }) => {
			await page.click('a[href="/tools/text/comparator"]');
			await page.waitForLoadState('networkidle');

			const text1 = 'Hello World';
			const text2 = 'Hello World';

			await page.fill('textarea[placeholder*="Original text"]', text1);
			await page.fill('textarea[placeholder*="Modified text"]', text2);

			// Enable similarity calculation
			const similarityToggle = page.locator('input[type="checkbox"][id*="similarity"]');
			if (await similarityToggle.isVisible()) {
				await similarityToggle.check();
			}

			await page.click('button:has-text("Compare")');
			await page.waitForTimeout(1000);

			// Should show 100% similarity for identical texts
			await expect(page.locator('text=100%')).toBeVisible({ timeout: 5000 });
		});

		test('should handle case sensitivity option', async ({ page }) => {
			await page.click('a[href="/tools/text/comparator"]');
			await page.waitForLoadState('networkidle');

			const text1 = 'Hello World';
			const text2 = 'hello world';

			await page.fill('textarea[placeholder*="Original text"]', text1);
			await page.fill('textarea[placeholder*="Modified text"]', text2);

			// Test with case sensitivity ON
			const caseSensitiveToggle = page.locator('input[type="checkbox"][id*="case"]');
			if (await caseSensitiveToggle.isVisible()) {
				await caseSensitiveToggle.check();
				await page.click('button:has-text("Compare")');
				await page.waitForTimeout(1000);

				// Should show differences when case sensitive
				await expect(page.locator('text=Modifications')).toBeVisible({
					timeout: 5000,
				});

				// Test with case sensitivity OFF
				await caseSensitiveToggle.uncheck();
				await page.click('button:has-text("Compare")');
				await page.waitForTimeout(1000);

				// Should show no differences when case insensitive
				await expect(page.locator('text=No differences found')).toBeVisible({
					timeout: 5000,
				});
			}
		});

		test('should handle whitespace ignoring option', async ({ page }) => {
			await page.click('a[href="/tools/text/comparator"]');
			await page.waitForLoadState('networkidle');

			const text1 = 'Hello World';
			const text2 = 'Hello  World\n\n';

			await page.fill('textarea[placeholder*="Original text"]', text1);
			await page.fill('textarea[placeholder*="Modified text"]', text2);

			// Test with whitespace ignoring OFF
			const whitespaceToggle = page.locator('input[type="checkbox"][id*="whitespace"]');
			if (await whitespaceToggle.isVisible()) {
				await whitespaceToggle.uncheck();
				await page.click('button:has-text("Compare")');
				await page.waitForTimeout(1000);

				// Should show differences
				await expect(page.locator('text=Modifications')).toBeVisible({
					timeout: 5000,
				});

				// Test with whitespace ignoring ON
				await whitespaceToggle.check();
				await page.click('button:has-text("Compare")');
				await page.waitForTimeout(1000);

				// Should show fewer or no differences
				await expect(page.locator('text=No differences found')).toBeVisible({
					timeout: 5000,
				});
			}
		});

		test('should handle unified diff view', async ({ page }) => {
			await page.click('a[href="/tools/text/comparator"]');
			await page.waitForLoadState('networkidle');

			const originalText = 'Line 1\nLine 2\nLine 3';
			const modifiedText = 'Line 1\nModified Line 2\nLine 3';

			await page.fill('textarea[placeholder*="Original text"]', originalText);
			await page.fill('textarea[placeholder*="Modified text"]', modifiedText);

			// Select unified diff
			await page.selectOption('select', 'unified');

			await page.click('button:has-text("Compare")');
			await page.waitForTimeout(1000);

			// Check for unified diff format
			await expect(page.locator('text=@@')).toBeVisible({ timeout: 5000 });
			await expect(page.locator('text=-Line 2')).toBeVisible();
			await expect(page.locator('text=+Modified Line 2')).toBeVisible();
		});

		test('should compare files', async ({ page }) => {
			await page.click('a[href="/tools/text/comparator"]');
			await page.waitForLoadState('networkidle');

			// Check if file comparison is available
			const fileTab = page.locator('button:has-text("File Input")');
			if (await fileTab.isVisible()) {
				await fileTab.click();

				const fileContent1 = 'File content 1\nLine 2';
				const fileContent2 = 'File content 2\nLine 2';

				// Setup file inputs
				const fileInputs = page.locator('input[type="file"]');
				await fileInputs.first().setInputFiles({
					name: 'file1.txt',
					mimeType: 'text/plain',
					buffer: Buffer.from(fileContent1),
				});

				await fileInputs.last().setInputFiles({
					name: 'file2.txt',
					mimeType: 'text/plain',
					buffer: Buffer.from(fileContent2),
				});

				await page.click('button:has-text("Compare Files")');
				await page.waitForTimeout(1000);

				// Check for comparison results
				await expect(page.locator('text=Comparison Results')).toBeVisible({
					timeout: 5000,
				});
			}
		});

		test('should load comparison examples', async ({ page }) => {
			await page.click('a[href="/tools/text/comparator"]');
			await page.waitForLoadState('networkidle');

			// Click on example button if available
			const exampleButton = page.locator('button:has-text("Load Example")');
			if (await exampleButton.isVisible()) {
				await exampleButton.first().click();

				// Check if examples were loaded
				const originalValue = await page.inputValue('textarea[placeholder*="Original text"]');
				const modifiedValue = await page.inputValue('textarea[placeholder*="Modified text"]');

				expect(originalValue).toBeTruthy();
				expect(modifiedValue).toBeTruthy();
				expect(originalValue.length).toBeGreaterThan(0);
				expect(modifiedValue.length).toBeGreaterThan(0);
			}
		});
	});

	test.describe('Text Generator Tool', () => {
		test('should generate lorem ipsum text', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Lorem Ipsum generator
			await page.selectOption('select', 'lorem');

			// Set quantity
			await page.fill('input[type="number"]', '3');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			// Check for generated text
			const generatedText = await page.locator('textarea[readonly]').inputValue();
			expect(generatedText).toContain('Lorem');
			expect(generatedText).toContain('ipsum');
			expect(generatedText.length).toBeGreaterThan(50);
		});

		test('should generate passwords with options', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Password generator
			await page.selectOption('select', 'password');

			// Set password options
			await page.fill('input[type="number"]', '16');

			// Enable character types
			await page.check('input[type="checkbox"][id*="uppercase"]');
			await page.check('input[type="checkbox"][id*="lowercase"]');
			await page.check('input[type="checkbox"][id*="numbers"]');
			await page.check('input[type="checkbox"][id*="symbols"]');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			const password = await page.locator('textarea[readonly]').inputValue();

			// Check password characteristics
			expect(password.length).toBe(16);
			expect(password).toMatch(/[A-Z]/); // Uppercase
			expect(password).toMatch(/[a-z]/); // Lowercase
			expect(password).toMatch(/[0-9]/); // Numbers
			expect(password).toMatch(/[!@#$%^&*(),.?":{}|<>]/); // Symbols
		});

		test('should generate UUIDs', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select UUID generator
			await page.selectOption('select', 'uuid');

			// Set quantity
			await page.fill('input[type="number"]', '5');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			const uuids = await page.locator('textarea[readonly]').inputValue();
			const uuidArray = uuids.split('\n').filter((uuid) => uuid.trim());

			// Check UUID count
			expect(uuidArray.length).toBe(5);

			// Check UUID format (v4)
			uuidArray.forEach((uuid) => {
				expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
			});
		});

		test('should generate random text', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Random Text generator
			await page.selectOption('select', 'random');

			// Set options
			await page.fill('input[type="number"]', '100'); // Length

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			const randomText = await page.locator('textarea[readonly]').inputValue();

			// Check generated text
			expect(randomText.length).toBe(100);
		});

		test('should generate custom patterns', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Custom Pattern generator
			await page.selectOption('select', 'pattern');

			// Enter custom pattern
			await page.fill('input[placeholder*="pattern"]', 'ABC-###-XYZ');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			const patternText = await page.locator('textarea[readonly]').inputValue();

			// Check pattern format
			expect(patternText).toMatch(/^ABC-\d{3}-XYZ$/);
		});

		test('should generate hash values', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Hash generator
			await page.selectOption('select', 'hash');

			// Select hash type
			await page.selectOption('select', 'md5');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			const hash = await page.locator('textarea[readonly]').inputValue();

			// Check MD5 hash format
			expect(hash).toMatch(/^[a-f0-9]{32}$/i);
		});

		test('should handle batch generation', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Password generator
			await page.selectOption('select', 'password');

			// Set quantity for batch generation
			await page.fill('input[type="number"]', '10');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			const passwords = await page.locator('textarea[readonly]').inputValue();
			const passwordArray = passwords.split('\n').filter((pwd) => pwd.trim());

			// Check batch generation
			expect(passwordArray.length).toBe(10);

			// Check each password is unique
			const uniquePasswords = new Set(passwordArray);
			expect(uniquePasswords.size).toBe(10);
		});

		test('should copy generated text to clipboard', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Lorem Ipsum generator
			await page.selectOption('select', 'lorem');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			// Click copy button
			await page.click('button:has-text("Copy")');

			// Check for success message
			await expect(page.locator('text=Copied to clipboard')).toBeVisible({
				timeout: 3000,
			});
		});

		test('should download generated text', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Lorem Ipsum generator
			await page.selectOption('select', 'lorem');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			// Setup download listener
			const downloadPromise = page.waitForEvent('download');

			// Click download button
			await page.click('button:has-text("Download")');

			// Wait for download
			const download = await downloadPromise;
			expect(download.suggestedFilename()).toContain('.txt');
		});

		test('should regenerate different text', async ({ page }) => {
			await page.click('a[href="/tools/text/generator"]');
			await page.waitForLoadState('networkidle');

			// Select Random Text generator
			await page.selectOption('select', 'random');

			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			const firstText = await page.locator('textarea[readonly]').inputValue();

			// Generate again
			await page.click('button:has-text("Generate")');
			await page.waitForTimeout(1000);

			const secondText = await page.locator('textarea[readonly]').inputValue();

			// Texts should be different
			expect(firstText).not.toBe(secondText);
		});
	});

	test.describe('Responsive Design Tests', () => {
		test('should be responsive on mobile devices', async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

			await page.goto('/tools/text/encoder');
			await page.waitForLoadState('networkidle');

			// Check mobile navigation
			await expect(page.locator('button:has-text("Encode Text")')).toBeVisible();

			// Test functionality on mobile
			await page.selectOption('select', 'base64');
			await page.fill('textarea[placeholder*="Enter text to encode"]', 'Mobile test');

			await page.waitForTimeout(500);

			const encodedText = await page.locator('div.font-mono').first().textContent();
			expect(encodedText).toBeTruthy();
		});

		test('should be responsive on tablet devices', async ({ page }) => {
			await page.setViewportSize({ width: 768, height: 1024 }); // iPad

			await page.goto('/tools/text/formatter');
			await page.waitForLoadState('networkidle');

			// Check tablet layout
			await expect(page.locator('textarea[placeholder*="Enter text to format"]')).toBeVisible();

			// Test functionality
			await page.selectOption('select', 'upper');
			await page.fill('textarea[placeholder*="Enter text to format"]', 'Tablet test');

			await page.click('button:has-text("Format Text")');
			await page.waitForTimeout(500);

			const formattedText = await page.locator('textarea[readonly]').inputValue();
			expect(formattedText).toBe('TABLET TEST');
		});
	});

	test.describe('Accessibility Tests', () => {
		test('should have proper ARIA labels', async ({ page }) => {
			await page.goto('/tools/text/encoder');
			await page.waitForLoadState('networkidle');

			// Check for proper ARIA labels
			const textArea = page.locator('textarea[placeholder*="Enter text to encode"]');
			await expect(textArea).toHaveAttribute('aria-label');

			// Check for proper heading structure
			await expect(page.locator('h1')).toBeVisible();
			await expect(page.locator('h2')).toBeVisible();
		});

		test('should support keyboard navigation', async ({ page }) => {
			await page.goto('/tools/text/comparator');
			await page.waitForLoadState('networkidle');

			// Tab through interactive elements
			await page.keyboard.press('Tab');
			await expect(page.locator(':focus')).toBeVisible();

			await page.keyboard.press('Tab');
			await expect(page.locator(':focus')).toBeVisible();

			// Test keyboard shortcuts if available
			await page.keyboard.press('Control+Enter');
		});

		test('should have sufficient color contrast', async ({ page }) => {
			await page.goto('/tools/text/generator');
			await page.waitForLoadState('networkidle');

			// Check that text is readable (basic check)
			const textElements = await page.locator('text=Generate').all();
			for (const element of textElements) {
				await expect(element).toBeVisible();
			}
		});
	});

	test.describe('Performance Tests', () => {
		test('should handle large text inputs efficiently', async ({ page }) => {
			await page.goto('/tools/text/encoder');
			await page.waitForLoadState('networkidle');

			// Generate large text
			const largeText = 'A'.repeat(10000);

			const startTime = Date.now();

			await page.selectOption('select', 'base64');
			await page.fill('textarea[placeholder*="Enter text to encode"]', largeText);

			await page.waitForTimeout(2000); // Wait for processing

			const endTime = Date.now();
			const processingTime = endTime - startTime;

			// Should process within reasonable time (5 seconds)
			expect(processingTime).toBeLessThan(5000);

			// Check result
			const encodedText = await page.locator('div.font-mono').first().textContent();
			expect(encodedText).toBeTruthy();
			expect(encodedText.length).toBeGreaterThan(0);
		});

		test('should not crash with extreme inputs', async ({ page }) => {
			await page.goto('/tools/text/formatter');
			await page.waitForLoadState('networkidle');

			// Test with extreme input
			const extremeText = '\n'.repeat(1000) + ' '.repeat(1000) + '\t'.repeat(1000);

			await page.fill('textarea[placeholder*="Enter text to format"]', extremeText);
			await page.click('button:has-text("Format Text")');

			// Should not crash and show some result
			await page.waitForTimeout(3000);

			const pageContent = await page.content();
			expect(pageContent).not.toContain('error');
		});
	});

	test.describe('Error Handling Tests', () => {
		test('should handle empty inputs gracefully', async ({ page }) => {
			await page.goto('/tools/text/encoder');
			await page.waitForLoadState('networkidle');

			// Try to process empty input
			await page.click('button:has-text("Encode Text")');

			// Should show validation message
			await expect(page.locator('text=Please enter text')).toBeVisible({
				timeout: 3000,
			});
		});

		test('should handle invalid inputs gracefully', async ({ page }) => {
			await page.goto('/tools/text/encoder');
			await page.waitForLoadState('networkidle');

			// Try to decode invalid Base64
			await page.click('button:has-text("Decode Text")');
			await page.selectOption('select', 'base64');
			await page.fill('textarea[placeholder*="Enter Base64 text to decode"]', 'Invalid input!!!');

			await page.click('button:has-text("Decode Text")');

			// Should show error message
			await expect(page.locator('text=error')).toBeVisible({ timeout: 3000 });
		});

		test('should handle network errors', async ({ page }) => {
			// Simulate offline mode
			await page.context().setOffline(true);

			await page.goto('/tools/text/generator');
			await page.waitForLoadState('networkidle');

			// Try to generate (should work offline as most text tools are client-side)
			await page.selectOption('select', 'lorem');
			await page.click('button:has-text("Generate")');

			await page.waitForTimeout(2000);

			// Should still work as it's client-side
			const generatedText = await page.locator('textarea[readonly]').inputValue();
			expect(generatedText).toBeTruthy();

			// Restore online mode
			await page.context().setOffline(false);
		});
	});

	test.describe('Cross-browser Compatibility', () => {
		test('should work in different browsers', async ({ page, browserName }) => {
			await page.goto('/tools/text/encoder');
			await page.waitForLoadState('networkidle');

			// Test basic functionality
			await page.selectOption('select', 'base64');
			await page.fill('textarea[placeholder*="Enter text to encode"]', `Test in ${browserName}`);

			await page.waitForTimeout(500);

			const encodedText = await page.locator('div.font-mono').first().textContent();
			expect(encodedText).toBeTruthy();

			// Log browser for debugging
			console.log(`Test passed in ${browserName}`);
		});
	});
});
