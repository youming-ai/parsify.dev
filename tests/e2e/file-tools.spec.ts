import { test, expect } from '@playwright/test';

test.describe('File Tools E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the tools page
		await page.goto('/tools');
	});

	test.describe('File Converter', () => {
		test('should convert JSON to CSV', async ({ page }) => {
			// Navigate to file converter
			await page.click('a[href="/tools/file/converter"]');
			await page.waitForLoadState('networkidle');

			// Input JSON data
			const jsonData = '[{"name":"John","age":30,"city":"New York"},{"name":"Jane","age":25,"city":"Boston"}]';
			await page.fill('textarea[placeholder*="input"]', jsonData);

			// Select conversion types
			await page.selectOption('select[name="source-format"]', 'json');
			await page.selectOption('select[name="target-format"]', 'csv');

			// Click convert button
			await page.click('button:has-text("Convert")');

			// Wait for result
			await page.waitForSelector('textarea[readonly]');

			const result = await page.inputValue('textarea[readonly]');
			expect(result).toContain('name,age,city');
			expect(result).toContain('John,30,New York');
			expect(result).toContain('Jane,25,Boston');
		});

		test('should convert CSV to JSON', async ({ page }) => {
			await page.click('a[href="/tools/file/converter"]');
			await page.waitForLoadState('networkidle');

			const csvData = 'name,age,city\\nJohn,30,New York\\nJane,25,Boston';
			await page.fill('textarea[placeholder*="input"]', csvData);

			await page.selectOption('select[name="source-format"]', 'csv');
			await page.selectOption('select[name="target-format"]', 'json');

			await page.click('button:has-text("Convert")');

			const result = await page.inputValue('textarea[readonly]');
			expect(result).toContain('"name":"John"');
			expect(result).toContain('"age":30');
			expect(result).toContain('"city":"New York"');
		});

		test('should handle conversion errors gracefully', async ({ page }) => {
			await page.click('a[href="/tools/file/converter"]');
			await page.waitForLoadState('networkidle');

			// Input invalid JSON
			const invalidJson = '{"name":"John","age":30,}';
			await page.fill('textarea[placeholder*="input"]', invalidJson);
			await page.selectOption('select[name="source-format"]', 'json');
			await page.selectOption('select[name="target-format"]', 'yaml');

			await page.click('button:has-text("Convert")');

			// Should show error message
			await expect(page.locator('text=Conversion failed')).toBeVisible();
			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
		});
	});

	test.describe('Text Processor', () => {
		test('should process text with various operations', async ({ page }) => {
			await page.click('a[href="/tools/file/text-processor"]');
			await page.waitForLoadState('networkidle');

			const text = 'Hello World! This is a TEST.';
			await page.fill('textarea[placeholder*="text"]', text);

			// Test uppercase conversion
			await page.selectOption('select[name="operation"]', 'uppercase');
			await page.click('button:has-text("Process")');

			let result = await page.inputValue('textarea[readonly]');
			expect(result).toBe('HELLO WORLD! THIS IS A TEST.');

			// Test lowercase conversion
			await page.selectOption('select[name="operation"]', 'lowercase');
			await page.click('button:has-text("Process")');

			result = await page.inputValue('textarea[readonly]');
			expect(result).toBe('hello world! this is a test.');
		});

		test('should handle text replacement', async ({ page }) => {
			await page.click('a[href="/tools/file/text-processor"]');
			await page.waitForLoadState('networkidle');

			const text = 'Hello World! Hello Universe!';
			await page.fill('textarea[placeholder*="text"]', text);

			await page.selectOption('select[name="operation"]', 'replace');
			await page.fill('input[placeholder*="find"]', 'Hello');
			await page.fill('input[placeholder*="replace"]', 'Hi');
			await page.click('button:has-text("Process")');

			const result = await page.inputValue('textarea[readonly]');
			expect(result).toBe('Hi World! Hi Universe!');
		});

		test('should remove extra whitespace', async ({ page }) => {
			await page.click('a[href="/tools/file/text-processor"]');
			await page.waitForLoadState('networkidle');

			const text = '  Hello    World!  \\n  This   has   extra   spaces.  ';
			await page.fill('textarea[placeholder*="text"]', text);

			await page.selectOption('select[name="operation"]', 'normalize');
			await page.click('button:has-text("Process")');

			const result = await page.inputValue('textarea[readonly]');
			expect(result).toBe('Hello World! This has extra spaces.');
		});
	});

	test.describe('CSV Processor', () => {
		test('should parse and display CSV data', async ({ page }) => {
			await page.click('a[href="/tools/file/csv-processor"]');
			await page.waitForLoadState('networkidle');

			const csvData = 'Name,Age,City\\nJohn,30,New York\\nJane,25,Boston\\nBob,35,Chicago';
			await page.fill('textarea[placeholder*="CSV"]', csvData);

			await page.click('button:has-text("Parse")');

			// Should display table with data
			await expect(page.locator('table')).toBeVisible();
			await expect(page.locator('text=John')).toBeVisible();
			await expect(page.locator('text=30')).toBeVisible();
			await expect(page.locator('text=New York')).toBeVisible();
		});

		test('should handle CSV with different delimiters', async ({ page }) => {
			await page.click('a[href="/tools/file/csv-processor"]');
			await page.waitForLoadState('networkidle');

			const csvData = 'Name;Age;City\\nJohn;30;New York\\nJane;25;Boston';
			await page.fill('textarea[placeholder*="CSV"]', csvData);
			await page.selectOption('select[name="delimiter"]', ';');

			await page.click('button:has-text("Parse")');

			await expect(page.locator('table')).toBeVisible();
			await expect(page.locator('text=John')).toBeVisible();
		});

		test('should export CSV data', async ({ page }) => {
			await page.click('a[href="/tools/file/csv-processor"]');
			await page.waitForLoadState('networkidle');

			const csvData = 'Name,Age,City\\nJohn,30,New York';
			await page.fill('textarea[placeholder*="CSV"]', csvData);
			await page.click('button:has-text("Parse")');

			// Export to JSON
			await page.click('button:has-text("Export to JSON")');

			// Should show JSON export
			await expect(page.locator('[data-testid="export-result"]')).toBeVisible();
			await expect(page.locator('text=[{"Name":"John","Age":30,"City":"New York"}]')).toBeVisible();
		});
	});

	test.describe('Image Compressor', () => {
		test('should compress images with quality adjustment', async ({ page }) => {
			await page.click('a[href="/tools/file/image-compressor"]');
			await page.waitForLoadState('networkidle');

			// Create a mock file input
			const fileInput = page.locator('input[type="file"]');

			// Mock file upload (in real E2E, you'd use actual image files)
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['mock-image-data'], 'test.jpg', { type: 'image/jpeg' });

				// Create data transfer
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;

				// Dispatch change event
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			// Wait for image to load
			await page.waitForSelector('[data-testid="image-preview"]');

			// Adjust quality
			await page.fill('input[type="range"][name="quality"]', '60');

			// Click compress button
			await page.click('button:has-text("Compress")');

			// Should show compression results
			await expect(page.locator('[data-testid="compression-stats"]')).toBeVisible();
			await expect(page.locator('text=Original size')).toBeVisible();
			await expect(page.locator('text=Compressed size')).toBeVisible();
			await expect(page.locator('text=Compression ratio')).toBeVisible();
		});

		test('should resize images', async ({ page }) => {
			await page.click('a[href="/tools/file/image-compressor"]');
			await page.waitForLoadState('networkidle');

			// Mock file upload
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['mock-large-image'], 'large.jpg', { type: 'image/jpeg' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			await page.waitForSelector('[data-testid="image-preview"]');

			// Set custom dimensions
			await page.fill('input[name="width"]', '300');
			await page.fill('input[name="height"]', '200');

			await page.click('button:has-text("Compress")');

			// Should show new dimensions
			await expect(page.locator('text=New dimensions: 300x200')).toBeVisible();
		});

		test('should show before/after comparison', async ({ page }) => {
			await page.click('a[href="/tools/file/image-compressor"]');
			await page.waitForLoadState('networkidle');

			// Mock file upload
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['mock-before-image'], 'before.jpg', { type: 'image/jpeg' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			await page.waitForSelector('[data-testid="image-preview"]');

			await page.click('button:has-text("Compress")');

			// Should show before/after comparison
			await expect(page.locator('[data-testid="before-after-comparison"]')).toBeVisible();
			await expect(page.locator('[data-testid="original-image"]')).toBeVisible();
			await expect(page.locator('[data-testid="compressed-image"]')).toBeVisible();
		});
	});

	test.describe('QR Generator', () => {
		test('should generate QR code from text', async ({ page }) => {
			await page.click('a[href="/tools/file/qr-generator"]');
			await page.waitForLoadState('networkidle');

			const text = 'https://parsify.dev';
			await page.fill('textarea[placeholder*="text or URL"]', text);

			await page.click('button:has-text("Generate")');

			// Should show QR code
			await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
			await expect(page.locator('img[alt="QR Code"]')).toBeVisible();
		});

		test('should customize QR code appearance', async ({ page }) => {
			await page.click('a[href="/tools/file/qr-generator"]');
			await page.waitForLoadState('networkidle');

			await page.fill('textarea[placeholder*="text or URL"]', 'Test QR Code');

			// Customize colors
			await page.fill('input[name="foreground-color"]', '#FF0000');
			await page.fill('input[name="background-color"]', '#00FF00');

			// Adjust size
			await page.fill('input[name="size"]', '300');

			await page.click('button:has-text("Generate")');

			// Should show customized QR code
			await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
			await expect(page.locator('[data-testid="qr-settings"]')).toBeVisible();
			await expect(page.locator('text=Size: 300px')).toBeVisible();
		});

		test('should adjust error correction level', async ({ page }) => {
			await page.click('a[href="/tools/file/qr-generator"]');
			await page.waitForLoadState('networkidle');

			await page.fill('textarea[placeholder*="text or URL"]', 'Test with high error correction');

			// Select high error correction
			await page.selectOption('select[name="error-correction"]', 'H');

			await page.click('button:has-text("Generate")');

			await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
			await expect(page.locator('text=Error Correction: High')).toBeVisible();
		});

		test('should download QR code', async ({ page }) => {
			await page.click('a[href="/tools/file/qr-generator"]');
			await page.waitForLoadState('networkidle');

			await page.fill('textarea[placeholder*="text or URL"]', 'Download test');
			await page.click('button:has-text("Generate")');

			await page.waitForSelector('[data-testid="qr-code"]');

			// Click download button
			const downloadPromise = page.waitForEvent('download');
			await page.click('button:has-text("Download")');
			const download = await downloadPromise;

			// Verify download
			expect(download.suggestedFilename()).toContain('qr-code');
		});

		test('should handle large text input', async ({ page }) => {
			await page.click('a[href="/tools/file/qr-generator"]');
			await page.waitForLoadState('networkidle');

			const longText = 'A'.repeat(1000);
			await page.fill('textarea[placeholder*="text or URL"]', longText);

			await page.click('button:has-text("Generate")');

			// Should either generate successfully or show capacity warning
			const qrCode = page.locator('[data-testid="qr-code"]');
			const warning = page.locator('text=Data too long for QR code');

			expect((await qrCode.isVisible()) || (await warning.isVisible())).toBe(true);
		});
	});

	test.describe('OCR Tool', () => {
		test('should extract text from images', async ({ page }) => {
			await page.click('a[href="/tools/file/ocr"]');
			await page.waitForLoadState('networkidle');

			// Mock file upload with text image
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['mock-image-with-text'], 'text-image.png', { type: 'image/png' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			await page.waitForSelector('[data-testid="image-preview"]');

			// Select language
			await page.selectOption('select[name="language"]', 'eng');

			await page.click('button:has-text("Extract Text")');

			// Should show loading progress
			await expect(page.locator('[data-testid="ocr-progress"]')).toBeVisible();

			// Wait for results
			await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 15000 });

			// Should show extracted text
			await expect(page.locator('[data-testid="extracted-text"]')).toBeVisible();
			await expect(page.locator('text=Confidence')).toBeVisible();
		});

		test('should handle multiple languages', async ({ page }) => {
			await page.click('a[href="/tools/file/ocr"]');
			await page.waitForLoadState('networkidle');

			// Mock file upload
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['mock-french-text-image'], 'french-text.jpg', { type: 'image/jpeg' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			await page.waitForSelector('[data-testid="image-preview"]');

			// Select French language
			await page.selectOption('select[name="language"]', 'fra');

			await page.click('button:has-text("Extract Text")');

			await expect(page.locator('[data-testid="ocr-progress"]')).toBeVisible();
		});

		test('should show OCR confidence scores', async ({ page }) => {
			await page.click('a[href="/tools/file/ocr"]');
			await page.waitForLoadState('networkidle');

			// Mock file upload
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['mock-clear-text-image'], 'clear-text.png', { type: 'image/png' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			await page.waitForSelector('[data-testid="image-preview"]');

			await page.click('button:has-text("Extract Text")');

			await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 15000 });

			// Should show confidence metrics
			await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
			await expect(page.locator('text=Overall Confidence')).toBeVisible();
			await expect(page.locator('text=Word Count')).toBeVisible();
			await expect(page.locator('text=Line Count')).toBeVisible();
		});

		test('should handle OCR errors gracefully', async ({ page }) => {
			await page.click('a[href="/tools/file/ocr"]');
			await page.waitForLoadState('networkidle');

			// Mock file upload with corrupted image
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['corrupted-image-data'], 'corrupted.jpg', { type: 'image/jpeg' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			await page.click('button:has-text("Extract Text")');

			// Should show error message after timeout
			await page.waitForSelector('[data-testid="ocr-error"]', { timeout: 15000 });
			await expect(page.locator('text=OCR processing failed')).toBeVisible();
			await expect(page.locator('text=Try uploading a clearer image')).toBeVisible();
		});

		test('should allow copying extracted text', async ({ page }) => {
			await page.click('a[href="/tools/file/ocr"]');
			await page.waitForLoadState('networkidle');

			// Mock successful OCR
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['mock-ocr-success'], 'success.png', { type: 'image/png' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			await page.click('button:has-text("Extract Text")');
			await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 15000 });

			// Click copy button
			await page.click('button:has-text("Copy Text")');

			// Should show success message
			await expect(page.locator('text=Text copied to clipboard')).toBeVisible();
		});
	});

	test.describe('Cross-tool functionality', () => {
		test('should maintain consistency across file tools', async ({ page }) => {
			const testText = 'Sample text for file processing tools';

			// Test in text processor
			await page.click('a[href="/tools/file/text-processor"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.selectOption('select[name="operation"]', 'uppercase');
			await page.click('button:has-text("Process")');
			await expect(page.locator('textarea[readonly]')).toBeVisible();

			// Test in CSV processor
			await page.click('a[href="/tools/file/csv-processor"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="CSV"]', 'Header1,Header2\\nValue1,Value2');
			await page.click('button:has-text("Parse")');
			await expect(page.locator('table')).toBeVisible();

			// Test in file converter
			await page.click('a[href="/tools/file/converter"]');
			await page.waitForLoadState('networkidle');
			await page.fill('textarea[placeholder*="input"]', '{"key":"value"}');
			await page.click('button:has-text("Convert")');
			await expect(page.locator('textarea[readonly]')).toBeVisible();
		});
	});

	test.describe('Performance tests', () => {
		test('should handle large file uploads efficiently', async ({ page }) => {
			await page.click('a[href="/tools/file/text-processor"]');
			await page.waitForLoadState('networkidle');

			// Generate large text
			const largeText = 'Sample text line.\\n'.repeat(10000);
			await page.fill('textarea[placeholder*="text"]', largeText);

			const startTime = Date.now();
			await page.click('button:has-text("Process")');
			await page.waitForSelector('textarea[readonly]');
			const endTime = Date.now();

			const duration = endTime - startTime;

			// Should complete within reasonable time
			expect(duration).toBeLessThan(5000); // 5 seconds
		});

		test('should complete operations within reasonable time', async ({ page }) => {
			await page.click('a[href="/tools/file/csv-processor"]');
			await page.waitForLoadState('networkidle');

			const startTime = Date.now();

			const csvData = 'Name,Age,City\\nJohn,30,NYC\\nJane,25,BOS';
			await page.fill('textarea[placeholder*="CSV"]', csvData);
			await page.click('button:has-text("Parse")');

			await page.waitForSelector('table');

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should complete within 3 seconds
			expect(duration).toBeLessThan(3000);
		});
	});

	test.describe('Error handling and validation', () => {
		test('should validate file formats', async ({ page }) => {
			await page.click('a[href="/tools/file/csv-processor"]');
			await page.waitForLoadState('networkidle');

			// Input invalid CSV
			const invalidCSV = 'Name,Age\\nJohn,30,Extra,Column,Here';
			await page.fill('textarea[placeholder*="CSV"]', invalidCSV);
			await page.click('button:has-text("Parse")');

			// Should show validation error
			await expect(page.locator('text=CSV parsing error')).toBeVisible();
			await expect(page.locator('text=Inconsistent column count')).toBeVisible();
		});

		test('should handle empty inputs gracefully', async ({ page }) => {
			await page.click('a[href="/tools/file/text-processor"]');
			await page.waitForLoadState('networkidle');

			// Don't input any text and try to process
			await page.click('button:has-text("Process")');

			// Should handle gracefully
			const result = await page.inputValue('textarea[readonly]');
			expect(result).toBe('');
		});

		test('should provide helpful error messages', async ({ page }) => {
			await page.click('a[href="/tools/file/converter"]');
			await page.waitForLoadState('networkidle');

			// Input invalid data
			await page.fill('textarea[placeholder*="input"]', 'not valid json or csv');
			await page.click('button:has-text("Convert")');

			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
			await expect(page.locator('text=Unable to parse input')).toBeVisible();
			await expect(page.locator('text=Please check your data format')).toBeVisible();
		});
	});

	test.describe('UI/UX tests', () => {
		test('should show loading states during processing', async ({ page }) => {
			await page.click('a[href="/tools/file/ocr"]');
			await page.waitForLoadState('networkidle');

			// Mock file upload
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['mock-processing-image'], 'processing.png', { type: 'image/png' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			await page.click('button:has-text("Extract Text")');

			// Should show loading state
			await expect(page.locator('[data-testid="loading"]')).toBeVisible();
			await expect(page.locator('text=Processing...')).toBeVisible();
		});

		test('should support drag and drop file upload', async ({ page }) => {
			await page.click('a[href="/tools/file/image-compressor"]');
			await page.waitForLoadState('networkidle');

			// Test drag and drop zone
			const dropZone = page.locator('[data-testid="drop-zone"]');

			// Simulate drag and drop
			await dropZone.dispatchEvent('dragenter');
			await dropZone.dispatchEvent('dragover');
			await dropZone.dispatchEvent('drop');

			// Should show drop zone active state
			await expect(dropZone).toHaveClass(/active|drag-over/);
		});

		test('should show file preview when uploaded', async ({ page }) => {
			await page.click('a[href="/tools/file/qr-generator"]');
			await page.waitForLoadState('networkidle');

			// Mock file upload
			await page.evaluate(() => {
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				const file = new File(['test-qr-data'], 'qr-input.txt', { type: 'text/plain' });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			});

			// Should show file info
			await expect(page.locator('[data-testid="file-info"]')).toBeVisible();
			await expect(page.locator('text=qr-input.txt')).toBeVisible();
		});
	});
});
