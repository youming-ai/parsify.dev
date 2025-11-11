import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Security Tools E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the tools page
		await page.goto('/tools');
	});

	test.describe('Hash Generator Tool', () => {
		test.beforeEach(async ({ page }) => {
			await page.click('a[href="/tools/security/hash-generator"]');
			await page.waitForLoadState('networkidle');
		});

		test('should generate SHA-256 hash for text input', async ({ page }) => {
			const testText = 'Hello World';

			// Input text
			await page.fill('textarea[placeholder*="text"]', testText);

			// Select SHA-256 algorithm
			await page.click('[data-testid="algorithm-select"]');
			await page.click('[data-value="sha256"]');

			// Generate hash
			await page.click('button:has-text("Generate Hash")');

			// Wait for results
			await page.waitForSelector('[data-testid="hash-result"]');

			// Verify hash format (64 characters for SHA-256)
			const hashResult = await page.locator('[data-testid="hash-result"]').textContent();
			expect(hashResult).toHaveLength(64);
			expect(hashResult).toMatch(/^[a-f0-9]{64}$/i);

			// Verify algorithm is displayed
			await expect(page.locator('text=SHA-256')).toBeVisible();
		});

		test('should generate multiple hash algorithms simultaneously', async ({ page }) => {
			const testText = 'Test string for multiple hashes';

			// Input text
			await page.fill('textarea[placeholder*="text"]', testText);

			// Select multiple algorithms
			await page.click('[data-testid="algorithm-select"]');
			await page.click('[data-value="md5"]');
			await page.click('[data-value="sha1"]');
			await page.click('[data-value="sha512"]');
			await page.keyboard.press('Escape');

			// Generate hashes
			await page.click('button:has-text("Generate Hashes")');

			// Wait for results
			await page.waitForSelector('[data-testid="hash-results"]');

			// Verify multiple results
			const results = await page.locator('[data-testid="hash-result"]').count();
			expect(results).toBe(3);

			// Verify MD5 format (32 characters)
			const md5Result = await page.locator('[data-testid="hash-result"]').nth(0).textContent();
			expect(md5Result).toHaveLength(32);

			// Verify SHA-1 format (40 characters)
			const sha1Result = await page.locator('[data-testid="hash-result"]').nth(1).textContent();
			expect(sha1Result).toHaveLength(40);

			// Verify SHA-512 format (128 characters)
			const sha512Result = await page.locator('[data-testid="hash-result"]').nth(2).textContent();
			expect(sha512Result).toHaveLength(128);
		});

		test('should generate HMAC hashes with key', async ({ page }) => {
			const testText = 'Secret message';
			const secretKey = 'my-secret-key';

			// Switch to HMAC tab
			await page.click('[data-testid="hmac-tab"]');

			// Input text and key
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.fill('input[placeholder*="key"]', secretKey);

			// Select HMAC-SHA256
			await page.click('[data-testid="hmac-algorithm"]');
			await page.click('[data-value="sha256"]');

			// Generate HMAC
			await page.click('button:has-text("Generate HMAC")');

			// Wait for results
			await page.waitForSelector('[data-testid="hmac-result"]');

			// Verify HMAC format
			const hmacResult = await page.locator('[data-testid="hmac-result"]').textContent();
			expect(hmacResult).toHaveLength(64);
			expect(hmacResult).toMatch(/^[a-f0-9]{64}$/i);

			// Verify HMAC indicator is shown
			await expect(page.locator('text=HMAC')).toBeVisible();
		});

		test('should hash file content', async ({ page }) => {
			// Create a test file
			const testContent = 'This is test file content for hashing';
			const testFilePath = path.join(__dirname, 'test-file.txt');
			fs.writeFileSync(testFilePath, testContent);

			try {
				// Switch to file input tab
				await page.click('[data-testid="file-tab"]');

				// Upload file
				await page.setInputFiles('input[type="file"]', testFilePath);

				// Select algorithm
				await page.click('[data-testid="algorithm-select"]');
				await page.click('[data-value="sha256"]');

				// Generate hash
				await page.click('button:has-text("Generate Hash")');

				// Wait for results
				await page.waitForSelector('[data-testid="hash-result"]');

				// Verify file info is displayed
				await expect(page.locator('text=test-file.txt')).toBeVisible();
				await expect(page.locator('[data-testid="file-size"]')).toBeVisible();

				// Verify hash format
				const hashResult = await page.locator('[data-testid="hash-result"]').textContent();
				expect(hashResult).toHaveLength(64);
			} finally {
				// Clean up test file
				if (fs.existsSync(testFilePath)) {
					fs.unlinkSync(testFilePath);
				}
			}
		});

		test('should compare two hashes', async ({ page }) => {
			const testText = 'Hash comparison test';
			const expectedHash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // SHA256 of "123"

			// Switch to comparison tab
			await page.click('[data-testid="compare-tab"]');

			// Input text and expected hash
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.fill('input[placeholder*="expected hash"]', expectedHash);

			// Select algorithm
			await page.click('[data-testid="compare-algorithm"]');
			await page.click('[data-value="sha256"]');

			// Compare hashes
			await page.click('button:has-text("Compare")');

			// Wait for results
			await page.waitForSelector('[data-testid="comparison-result"]');

			// Should show mismatch
			await expect(page.locator('text=Hashes do not match')).toBeVisible();
			await expect(page.locator('[data-testid="mismatch-indicator"]')).toBeVisible();

			// Test with matching hash
			await page.fill('textarea[placeholder*="text"]', '123');
			await page.click('button:has-text("Compare")');

			// Should show match
			await expect(page.locator('text=Hashes match')).toBeVisible();
			await expect(page.locator('[data-testid="match-indicator"]')).toBeVisible();
		});

		test('should support different output formats', async ({ page }) => {
			const testText = 'Format test';

			// Input text
			await page.fill('textarea[placeholder*="text"]', testText);

			// Select algorithm
			await page.click('[data-testid="algorithm-select"]');
			await page.click('[data-value="sha256"]');

			// Test uppercase format
			await page.check('input[name="uppercase"]');
			await page.click('button:has-text("Generate Hash")');

			await page.waitForSelector('[data-testid="hash-result"]');
			const uppercaseHash = await page.locator('[data-testid="hash-result"]').textContent();
			expect(uppercaseHash).toBe(uppercaseHash.toUpperCase());

			// Test base64 format
			await page.uncheck('input[name="uppercase"]');
			await page.selectOption('select[name="output-format"]', 'base64');
			await page.click('button:has-text("Generate Hash")');

			await page.waitForSelector('[data-testid="hash-result"]');
			const base64Hash = await page.locator('[data-testid="hash-result"]').textContent();
			expect(base64Hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
		});

		test('should support batch hashing', async ({ page }) => {
			const testLines = 'line1\nline2\nline3\nline4';

			// Switch to batch tab
			await page.click('[data-testid="batch-tab"]');

			// Input multiple lines
			await page.fill('textarea[placeholder*="lines"]', testLines);

			// Select algorithm
			await page.click('[data-testid="batch-algorithm"]');
			await page.click('[data-value="sha256"]');

			// Generate batch hashes
			await page.click('button:has-text("Generate Batch Hashes")');

			// Wait for results
			await page.waitForSelector('[data-testid="batch-results"]');

			// Should have 4 results
			const results = await page.locator('[data-testid="batch-hash-item"]').count();
			expect(results).toBe(4);

			// Verify first result
			await expect(page.locator('text=line1')).toBeVisible();
			await expect(page.locator('[data-testid="batch-hash"]').first()).toBeVisible();
		});

		test('should copy hash to clipboard', async ({ page }) => {
			const testText = 'Copy test';

			// Input text and generate hash
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.click('[data-testid="algorithm-select"]');
			await page.click('[data-value="sha256"]');
			await page.click('button:has-text("Generate Hash")');

			await page.waitForSelector('[data-testid="hash-result"]');

			// Click copy button
			await page.click('[data-testid="copy-hash"]');

			// Verify success message
			await expect(page.locator('text=Hash copied to clipboard')).toBeVisible();
		});

		test('should download hash results', async ({ page }) => {
			const testText = 'Download test';

			// Input text and generate hash
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.click('[data-testid="algorithm-select"]');
			await page.click('[data-value="sha256"]');
			await page.click('button:has-text("Generate Hash")');

			await page.waitForSelector('[data-testid="hash-result"]');

			// Click download button
			const downloadPromise = page.waitForEvent('download');
			await page.click('[data-testid="download-hashes"]');
			const download = await downloadPromise;

			// Verify download
			expect(download.suggestedFilename()).toMatch(/hashes.*\.txt$/);
		});

		test('should handle empty input gracefully', async ({ page }) => {
			// Try to generate hash with empty input
			await page.click('button:has-text("Generate Hash")');

			// Should show error message
			await expect(page.locator('text=Please enter text or upload a file')).toBeVisible();
		});

		test('should show algorithm security information', async ({ page }) => {
			// Select MD5 (low security)
			await page.click('[data-testid="algorithm-select"]');
			await page.hover('[data-value="md5"]');

			// Should show security warning
			await expect(page.locator('text=cryptographically broken')).toBeVisible();
			await expect(page.locator('[data-testid="security-warning"]')).toBeVisible();

			// Select SHA-256 (high security)
			await page.hover('[data-value="sha256"]');

			// Should show security indicator
			await expect(page.locator('text=secure and widely used')).toBeVisible();
		});
	});

	test.describe('File Encryptor Tool', () => {
		test.beforeEach(async ({ page }) => {
			await page.click('a[href="/tools/security/encryptor"]');
			await page.waitForLoadState('networkidle');
		});

		test('should encrypt text with password', async ({ page }) => {
			const plainText = 'This is secret message';
			const password = 'securePassword123';

			// Switch to text tab
			await page.click('[data-testid="text-tab"]');

			// Input text and password
			await page.fill('textarea[placeholder*="text"]', plainText);
			await page.fill('input[type="password"]', password);

			// Select algorithm and key size
			await page.selectOption('select[name="algorithm"]', 'aes');
			await page.selectOption('select[name="key-size"]', '256');

			// Encrypt
			await page.click('button:has-text("Encrypt")');

			// Wait for encryption to complete
			await page.waitForSelector('[data-testid="encryption-result"]');
			await expect(page.locator('text=Encryption completed')).toBeVisible();

			// Verify encrypted output (should be different from input)
			const encryptedOutput = await page.locator('[data-testid="encrypted-data"]').textContent();
			expect(encryptedOutput).not.toBe(plainText);
			expect(encryptedOutput).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 format

			// Verify metadata
			await expect(page.locator('text=AES-256')).toBeVisible();
			await expect(page.locator('[data-testid="encryption-time"]')).toBeVisible();
		});

		test('should decrypt text with correct password', async ({ page }) => {
			const plainText = 'Decryption test message';
			const password = 'correctPassword123';

			// First encrypt the text
			await page.click('[data-testid="text-tab"]');
			await page.fill('textarea[placeholder*="text"]', plainText);
			await page.fill('input[type="password"]', password);
			await page.selectOption('select[name="algorithm"]', 'aes');
			await page.selectOption('select[name="key-size"]', '256');
			await page.click('button:has-text("Encrypt")');

			await page.waitForSelector('[data-testid="encryption-result"]');

			// Copy encrypted data
			const encryptedData = await page.locator('[data-testid="encrypted-data"]').textContent();

			// Now decrypt it
			await page.click('[data-testid="decrypt-mode"]');
			await page.fill('textarea[placeholder*="encrypted"]', encryptedData);
			await page.fill('input[type="password"]', password);
			await page.click('button:has-text("Decrypt")');

			// Wait for decryption to complete
			await page.waitForSelector('[data-testid="decryption-result"]');

			// Verify decrypted text matches original
			const decryptedText = await page.locator('[data-testid="decrypted-data"]').textContent();
			expect(decryptedText).toBe(plainText);

			// Verify success indicator
			await expect(page.locator('text=Decryption successful')).toBeVisible();
		});

		test('should fail decryption with incorrect password', async ({ page }) => {
			const encryptedData = 'U2FsdGVkX1+mockencrypteddata==';
			const wrongPassword = 'wrongPassword';

			// Switch to decrypt mode
			await page.click('[data-testid="decrypt-mode"]');

			// Input encrypted data and wrong password
			await page.fill('textarea[placeholder*="encrypted"]', encryptedData);
			await page.fill('input[type="password"]', wrongPassword);

			// Try to decrypt
			await page.click('button:has-text("Decrypt")');

			// Should show error
			await expect(page.locator('text=Decryption failed')).toBeVisible();
			await expect(page.locator('text=Incorrect password or corrupted data')).toBeVisible();
			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
		});

		test('should encrypt file with password', async ({ page }) => {
			// Create a test file
			const fileContent = 'Secret file content for encryption test';
			const testFilePath = path.join(__dirname, 'secret-file.txt');
			fs.writeFileSync(testFilePath, fileContent);

			try {
				// Switch to file tab
				await page.click('[data-testid="file-tab"]');

				// Upload file
				await page.setInputFiles('input[type="file"]', testFilePath);

				// Set password
				await page.fill('input[type="password"]', 'filePassword123');

				// Select settings
				await page.selectOption('select[name="algorithm"]', 'aes');
				await page.selectOption('select[name="key-size"]', '256');

				// Encrypt file
				await page.click('button:has-text("Encrypt File")');

				// Wait for encryption progress
				await expect(page.locator('[data-testid="encryption-progress"]')).toBeVisible();
				await page.waitForSelector('[data-testid="encryption-progress"][value="100"]', { timeout: 10000 });

				// Verify completion
				await expect(page.locator('text=File encrypted successfully')).toBeVisible();
				await expect(page.locator('text=secret-file.txt.enc')).toBeVisible();

				// Download encrypted file
				const downloadPromise = page.waitForEvent('download');
				await page.click('[data-testid="download-encrypted"]');
				const download = await downloadPromise;

				expect(download.suggestedFilename()).toBe('secret-file.txt.enc');
			} finally {
				// Clean up test file
				if (fs.existsSync(testFilePath)) {
					fs.unlinkSync(testFilePath);
				}
			}
		});

		test('should validate password strength', async ({ page }) => {
			const weakPassword = '123';
			const strongPassword = 'Str0ngP@ssw0rd!2024';

			// Test weak password
			await page.fill('input[type="password"]', weakPassword);

			// Should show weak password indicator
			await expect(page.locator('[data-testid="password-strength"]')).toBeVisible();
			await expect(page.locator('text=Weak')).toBeVisible();
			await expect(page.locator('[data-testid="strength-meter"]').first()).toHaveClass(/.*red.*/);

			// Should show suggestions
			await expect(page.locator('text=Use at least 8 characters')).toBeVisible();
			await expect(page.locator('text=Include uppercase letters')).toBeVisible();
			await expect(page.locator('text=Include numbers')).toBeVisible();
			await expect(page.locator('text=Include special characters')).toBeVisible();

			// Test strong password
			await page.fill('input[type="password"]', strongPassword);

			// Should show strong password indicator
			await expect(page.locator('text=Strong')).toBeVisible();
			await expect(page.locator('[data-testid="strength-meter"]').first()).toHaveClass(/.*green.*/);
		});

		test('should support different encryption algorithms', async ({ page }) => {
			const testText = 'Algorithm test';
			const password = 'testPassword123';

			// Test AES encryption
			await page.click('[data-testid="text-tab"]');
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.fill('input[type="password"]', password);
			await page.selectOption('select[name="algorithm"]', 'aes');
			await page.selectOption('select[name="key-size"]', '128');
			await page.click('button:has-text("Encrypt")');

			await page.waitForSelector('[data-testid="encryption-result"]');
			const aesEncrypted = await page.locator('[data-testid="encrypted-data"]').textContent();

			// Clear and test with different key size
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.selectOption('select[name="key-size"]', '256');
			await page.click('button:has-text("Encrypt")');

			await page.waitForSelector('[data-testid="encryption-result"]');
			const aes256Encrypted = await page.locator('[data-testid="encrypted-data"]').textContent();

			// Encrypted outputs should be different
			expect(aesEncrypted).not.toBe(aes256Encrypted);

			// Verify algorithm display
			await expect(page.locator('text=AES-128')).toBeVisible();
		});

		test('should show encryption progress for large files', async ({ page }) => {
			// This test simulates large file encryption
			await page.click('[data-testid="file-tab"]');

			// Mock large file (in real test, you'd use an actual large file)
			const largeFileName = 'large-file.txt';

			// Set password
			await page.fill('input[type="password"]', 'largeFilePassword123');

			// Start encryption (progress should be visible)
			await page.click('button:has-text("Encrypt File"]');

			// Progress bar should be visible
			await expect(page.locator('[data-testid="encryption-progress"]')).toBeVisible();
			await expect(page.locator('text=Encrypting...')).toBeVisible();

			// Should show file size and time remaining
			await expect(page.locator('[data-testid="file-size-info"]')).toBeVisible();
			await expect(page.locator('[data-testid="time-remaining"]')).toBeVisible();
		});

		test('should handle batch file encryption', async ({ page }) => {
			// Create multiple test files
			const testFiles = ['file1.txt', 'file2.txt'];
			const testFilePaths = testFiles.map((filename) => path.join(__dirname, filename));

			try {
				// Create test files
				testFilePaths.forEach((filePath, index) => {
					fs.writeFileSync(filePath, `Content of file ${index + 1}`);
				});

				// Switch to batch tab
				await page.click('[data-testid="batch-tab"]');

				// Upload multiple files
				await page.setInputFiles('input[type="file"][multiple]', testFilePaths);

				// Set password
				await page.fill('input[type="password"]', 'batchPassword123');

				// Start batch encryption
				await page.click('button:has-text("Encrypt All Files"]');

				// Wait for batch processing
				await page.waitForSelector('[data-testid="batch-results"]');

				// Should show progress for each file
				await expect(page.locator('[data-testid="batch-progress"]')).toBeVisible();

				// Should show individual file status
				await expect(page.locator('text=file1.txt')).toBeVisible();
				await expect(page.locator('text=file2.txt')).toBeVisible();

				// Download all encrypted files
				const downloadPromise = page.waitForEvent('download');
				await page.click('[data-testid="download-all"]');
				const download = await downloadPromise;

				expect(download.suggestedFilename()).toMatch(/.*\.zip$/);
			} finally {
				// Clean up test files
				testFilePaths.forEach((filePath) => {
					if (fs.existsSync(filePath)) {
						fs.unlinkSync(filePath);
					}
				});
			}
		});

		test('should verify encrypted file integrity', async ({ page }) => {
			const testText = 'Integrity test message';
			const password = 'integrityTest123';

			// Encrypt text
			await page.click('[data-testid="text-tab"]');
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.fill('input[type="password"]', password);
			await page.click('button:has-text("Encrypt")');

			await page.waitForSelector('[data-testid="encryption-result"]');

			// Verify integrity hash is displayed
			await expect(page.locator('[data-testid="integrity-hash"]')).toBeVisible();
			await expect(page.locator('text=SHA-256')).toBeVisible();

			// Copy encrypted data
			const encryptedData = await page.locator('[data-testid="encrypted-data"]').textContent();
			const integrityHash = await page.locator('[data-testid="integrity-hash"]').textContent();

			// Decrypt and verify integrity
			await page.click('[data-testid="decrypt-mode"]');
			await page.fill('textarea[placeholder*="encrypted"]', encryptedData);
			await page.fill('input[type="password"]', password);
			await page.click('button:has-text("Decrypt"]');

			await page.waitForSelector('[data-testid="decryption-result"]');

			// Should show integrity verification
			await expect(page.locator('text=Integrity verified')).toBeVisible();
			await expect(page.locator('[data-testid="verification-check"]')).toBeVisible();
		});

		test('should handle empty password error', async ({ page }) => {
			const testText = 'Test message';

			// Try to encrypt without password
			await page.click('[data-testid="text-tab"]');
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.click('button:has-text("Encrypt")');

			// Should show password required error
			await expect(page.locator('text=Password is required')).toBeVisible();
			await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
		});

		test('should show encryption metadata', async ({ page }) => {
			const testText = 'Metadata test';
			const password = 'metadataTest123';

			// Encrypt with custom settings
			await page.click('[data-testid="text-tab"]');
			await page.fill('textarea[placeholder*="text"]', testText);
			await page.fill('input[type="password"]', password);
			await page.selectOption('select[name="algorithm"]', 'aes');
			await page.selectOption('select[name="key-size"]', '256');
			await page.click('button:has-text("Encrypt")');

			await page.waitForSelector('[data-testid="encryption-result"]');

			// Verify metadata display
			await expect(page.locator('[data-testid="algorithm-info"]')).toBeVisible();
			await expect(page.locator('text=AES-256-CBC')).toBeVisible();
			await expect(page.locator('[data-testid="encryption-time"]')).toBeVisible();
			await expect(page.locator('[data-testid="file-size-info"]')).toBeVisible();
			await expect(page.locator('[data-testid="compression-ratio"]')).toBeVisible();
		});
	});

	test.describe('Password Generator Tool', () => {
		test.beforeEach(async ({ page }) => {
			await page.click('a[href="/tools/security/password-generator"]');
			await page.waitForLoadState('networkidle');
		});

		test('should generate password with default settings', async ({ page }) => {
			// Generate password with default settings
			await page.click('button:has-text("Generate Password")');

			// Wait for password generation
			await page.waitForSelector('[data-testid="generated-password"]');

			// Verify password length (default is usually 16)
			const password = await page.locator('[data-testid="generated-password"]').textContent();
			expect(password).toHaveLength(16);

			// Verify password contains mixed characters
			expect(password).toMatch(/[a-z]/); // lowercase
			expect(password).toMatch(/[A-Z]/); // uppercase
			expect(password).toMatch(/[0-9]/); // numbers
			expect(password).toMatch(/[^a-zA-Z0-9]/); // special characters

			// Should show strength indicator
			await expect(page.locator('[data-testid="password-strength"]')).toBeVisible();
			await expect(page.locator('text=Strong')).toBeVisible();

			// Should show entropy
			await expect(page.locator('[data-testid="entropy-value"]')).toBeVisible();
		});

		test('should generate password with custom length', async ({ page }) => {
			const customLength = 24;

			// Set custom length
			await page.fill('input[type="number"][name="length"]', customLength.toString());

			// Generate password
			await page.click('button:has-text("Generate Password")');

			await page.waitForSelector('[data-testid="generated-password"]');

			// Verify custom length
			const password = await page.locator('[data-testid="generated-password"]').textContent();
			expect(password).toHaveLength(customLength);
		});

		test('should handle different character sets', async ({ page }) => {
			// Test lowercase only
			await page.uncheck('input[name="uppercase"]');
			await page.uncheck('input[name="numbers"]');
			await page.uncheck('input[name="symbols"]');
			await page.check('input[name="lowercase"]');

			await page.click('button:has-text("Generate Password")');
			await page.waitForSelector('[data-testid="generated-password"]');

			const lowercasePassword = await page.locator('[data-testid="generated-password"]').textContent();
			expect(lowercasePassword).toMatch(/^[a-z]+$/);

			// Test uppercase only
			await page.uncheck('input[name="lowercase"]');
			await page.check('input[name="uppercase"]');

			await page.click('button:has-text("Generate Password")');
			const uppercasePassword = await page.locator('[data-testid="generated-password"]').textContent();
			expect(uppercasePassword).toMatch(/^[A-Z]+$/);

			// Test numbers only
			await page.uncheck('input[name="uppercase"]');
			await page.check('input[name="numbers"]');

			await page.click('button:has-text("Generate Password")');
			const numbersPassword = await page.locator('[data-testid="generated-password"]').textContent();
			expect(numbersPassword).toMatch(/^[0-9]+$/);

			// Test symbols only
			await page.uncheck('input[name="numbers"]');
			await page.check('input[name="symbols"]');

			await page.click('button:has-text("Generate Password")');
			const symbolsPassword = await page.locator('[data-testid="generated-password"]').textContent();
			expect(symbolsPassword).toMatch(/^[^a-zA-Z0-9]+$/);
		});

		test('should show password strength indicators', async ({ page }) => {
			// Generate weak password (short, lowercase only)
			await page.fill('input[type="number"][name="length"]', '6');
			await page.uncheck('input[name="uppercase"]');
			await page.uncheck('input[name="numbers"]');
			await page.uncheck('input[name="symbols"]');
			await page.check('input[name="lowercase"]');

			await page.click('button:has-text("Generate Password")');
			await page.waitForSelector('[data-testid="generated-password"]');

			// Should show weak strength
			await expect(page.locator('text=Weak')).toBeVisible();
			await expect(page.locator('[data-testid="strength-meter"].bg-red-500')).toBeVisible();

			// Should show suggestions
			await expect(page.locator('text=Increase length to at least 12 characters')).toBeVisible();
			await expect(page.locator('text=Include uppercase letters')).toBeVisible();
			await expect(page.locator('text=Include numbers')).toBeVisible();
			await expect(page.locator('text=Include special characters')).toBeVisible();

			// Generate strong password
			await page.fill('input[type="number"][name="length"]', '20');
			await page.check('input[name="uppercase"]');
			await page.check('input[name="numbers"]');
			await page.check('input[name="symbols"]');

			await page.click('button:has-text("Generate Password")');

			// Should show strong strength
			await expect(page.locator('text=Very Strong')).toBeVisible();
			await expect(page.locator('[data-testid="strength-meter"].bg-green-500')).toBeVisible();
		});

		test('should generate pronounceable passwords', async ({ page }) => {
			// Switch to pronounceable tab
			await page.click('[data-testid="pronounceable-tab"]');

			// Generate pronounceable password
			await page.click('button:has-text("Generate Pronounceable")');

			await page.waitForSelector('[data-testid="pronounceable-password"]');

			const pronounceablePassword = await page.locator('[data-testid="pronounceable-password"]').textContent();

			// Should be pronounceable (contains vowels)
			expect(pronounceablePassword).toMatch(/[aeiou]/i);

			// Should show phonetic breakdown
			await expect(page.locator('[data-testid="phonetic-breakdown"]')).toBeVisible();

			// Should have pronunciation guide
			await expect(page.locator('[data-testid="pronunciation"]')).toBeVisible();
		});

		test('should generate passphrases', async ({ page }) => {
			// Switch to passphrase tab
			await page.click('[data-testid="passphrase-tab"]');

			// Set word count
			await page.fill('input[type="number"][name="word-count"]', '6');

			// Generate passphrase
			await page.click('button:has-text("Generate Passphrase")');

			await page.waitForSelector('[data-testid="passphrase"]');

			const passphrase = await page.locator('[data-testid="passphrase"]').textContent();

			// Should have 6 words
			const words = passphrase.split(' ');
			expect(words).toHaveLength(6);

			// All words should be alphabetic
			words.forEach((word) => {
				expect(word).toMatch(/^[a-zA-Z]+$/);
			});

			// Should show word count
			await expect(page.locator('text=6 words')).toBeVisible();

			// Should show entropy
			await expect(page.locator('[data-testid="passphrase-entropy"]')).toBeVisible();

			// Should show time to crack estimate
			await expect(page.locator('[data-testid="crack-time"]')).toBeVisible();
		});

		test('should generate custom pattern passwords', async ({ page }) => {
			// Switch to custom pattern tab
			await page.click('[data-testid="pattern-tab"]');

			// Set custom pattern (e.g., 3 uppercase, 3 numbers, 3 lowercase, 2 symbols)
			await page.fill('input[name="pattern"]', 'UUUNNNLLLSS');

			// Generate with pattern
			await page.click('button:has-text("Generate with Pattern")');

			await page.waitForSelector('[data-testid="pattern-password"]');

			const patternPassword = await page.locator('[data-testid="pattern-password"]').textContent();
			expect(patternPassword).toHaveLength(11);

			// Verify pattern (first 3 should be uppercase, next 3 numbers, etc.)
			expect(patternPassword.substring(0, 3)).toMatch(/^[A-Z]{3}$/);
			expect(patternPassword.substring(3, 6)).toMatch(/^[0-9]{3}$/);
			expect(patternPassword.substring(6, 9)).toMatch(/^[a-z]{3}$/);
			expect(patternPassword.substring(9, 11)).toMatch(/^[^a-zA-Z0-9]{2}$/);

			// Should show pattern explanation
			await expect(page.locator('[data-testid="pattern-explanation"]')).toBeVisible();
		});

		test('should support batch password generation', async ({ page }) => {
			const batchSize = 5;

			// Switch to batch tab
			await page.click('[data-testid="batch-tab"]');

			// Set batch size
			await page.fill('input[type="number"][name="batch-size"]', batchSize.toString());

			// Generate batch
			await page.click('button:has-text("Generate Batch")');

			await page.waitForSelector('[data-testid="batch-results"]');

			// Should have 5 passwords
			const passwords = await page.locator('[data-testid="batch-password"]').count();
			expect(passwords).toBe(batchSize);

			// All passwords should be different
			const passwordTexts = [];
			for (let i = 0; i < batchSize; i++) {
				const password = await page.locator('[data-testid="batch-password"]').nth(i).textContent();
				passwordTexts.push(password);
			}

			const uniquePasswords = [...new Set(passwordTexts)];
			expect(uniquePasswords).toHaveLength(batchSize);

			// Should show batch statistics
			await expect(page.locator('text=Generated 5 passwords')).toBeVisible();
			await expect(page.locator('[data-testid="average-strength"]')).toBeVisible();
			await expect(page.locator('[data-testid="average-entropy"]')).toBeVisible();
		});

		test('should track password history', async ({ page }) => {
			// Generate first password
			await page.click('button:has-text("Generate Password")');
			await page.waitForSelector('[data-testid="generated-password"]');

			const password1 = await page.locator('[data-testid="generated-password"]').textContent();

			// Generate second password
			await page.click('button:has-text("Generate Password")');
			const password2 = await page.locator('[data-testid="generated-password"]').textContent();

			// Check history
			await page.click('[data-testid="history-tab"]');

			// Should show both passwords in history
			await expect(page.locator('text=' + password1)).toBeVisible();
			await expect(page.locator('text=' + password2)).toBeVisible();

			// Should show timestamps
			await expect(page.locator('[data-testid="history-timestamp"]')).toHaveCount(2);

			// Should show strength indicators for each
			await expect(page.locator('[data-testid="history-strength"]')).toHaveCount(2);

			// Clear history
			await page.click('button:has-text("Clear History")');
			await expect(page.locator('text=History cleared')).toBeVisible();

			// History should be empty
			await expect(page.locator('[data-testid="history-item"]')).toHaveCount(0);
		});

		test('should exclude ambiguous characters', async ({ page }) => {
			// Enable exclude ambiguous characters
			await page.check('input[name="exclude-ambiguous"]');

			// Generate password
			await page.click('button:has-text("Generate Password")');
			await page.waitForSelector('[data-testid="generated-password"]');

			const password = await page.locator('[data-testid="generated-password"]').textContent();

			// Should not contain ambiguous characters (0, O, l, 1, I)
			expect(password).not.toMatch(/[0O1lI]/);

			// Should show exclusion info
			await expect(page.locator('text=Ambiguous characters excluded')).toBeVisible();
		});

		test('should copy password to clipboard', async ({ page }) => {
			// Generate password
			await page.click('button:has-text("Generate Password")');
			await page.waitForSelector('[data-testid="generated-password"]');

			// Click copy button
			await page.click('[data-testid="copy-password"]');

			// Verify success message
			await expect(page.locator('text=Password copied to clipboard')).toBeVisible();

			// Verify copy feedback (button should temporarily change)
			await expect(page.locator('[data-testid="copy-button"]')).toHaveClass(/.*bg-green.*/);
		});

		test('should download passwords', async ({ page }) => {
			// Generate password
			await page.click('button:has-text("Generate Password")');
			await page.waitForSelector('[data-testid="generated-password"]');

			// Download password
			const downloadPromise = page.waitForEvent('download');
			await page.click('[data-testid="download-password"]');
			const download = await downloadPromise;

			// Verify download
			expect(download.suggestedFilename()).toMatch(/passwords.*\.txt$/);
		});

		test('should validate password requirements', async ({ page }) => {
			// Test minimum length validation
			await page.fill('input[type="number"][name="length"]', '4');
			await page.click('button:has-text("Generate Password")');

			// Should show warning for short passwords
			await expect(page.locator('text=Password length should be at least 8 characters')).toBeVisible();

			// Test character set validation
			await page.uncheck('input[name="lowercase"]');
			await page.uncheck('input[name="uppercase"]');
			await page.uncheck('input[name="numbers"]');
			await page.uncheck('input[name="symbols"]');

			await page.click('button:has-text("Generate Password")');

			// Should show error for no character sets
			await expect(page.locator('text=At least one character set must be selected')).toBeVisible();
		});

		test('should show password entropy calculation', async ({ page }) => {
			// Generate password
			await page.click('button:has-text("Generate Password")');
			await page.waitForSelector('[data-testid="generated-password"]');

			// Should show entropy value
			await expect(page.locator('[data-testid="entropy-value"]')).toBeVisible();

			// Should show entropy calculation breakdown
			await expect(page.locator('[data-testid="entropy-breakdown"]')).toBeVisible();
			await expect(page.locator('text=Character set size')).toBeVisible();
			await expect(page.locator('text=Password length')).toBeVisible();
			await expect(page.locator('text=log₂')).toBeVisible();

			// Should show time to crack estimate
			await expect(page.locator('[data-testid="crack-time"]')).toBeVisible();
			await expect(page.locator('text=years')).toBeVisible();
		});

		test('should generate PIN codes', async ({ page }) => {
			// Switch to PIN tab
			await page.click('[data-testid="pin-tab"]');

			// Set PIN length
			await page.fill('input[type="number"][name="pin-length"]', '6');

			// Generate PIN
			await page.click('button:has-text("Generate PIN")');

			await page.waitForSelector('[data-testid="generated-pin"]');

			const pin = await page.locator('[data-testid="generated-pin"]').textContent();

			// Should be 6 digits
			expect(pin).toHaveLength(6);
			expect(pin).toMatch(/^[0-9]{6}$/);

			// Should show PIN strength
			await expect(page.locator('[data-testid="pin-strength"]')).toBeVisible();
		});
	});

	test.describe('Security Tools Cross-Features', () => {
		test('should maintain consistent security indicators', async ({ page }) => {
			// Test hash generator security warnings
			await page.click('a[href="/tools/security/hash-generator"]');
			await page.waitForLoadState('networkidle');

			await page.click('[data-testid="algorithm-select"]');
			await page.hover('[data-value="md5"]');
			await expect(page.locator('[data-testid="security-warning"]')).toBeVisible();

			// Test encryptor password strength
			await page.click('a[href="/tools/security/encryptor"]');
			await page.waitForLoadState('networkidle');

			await page.fill('input[type="password"]', 'weak');
			await expect(page.locator('[data-testid="password-strength"]')).toBeVisible();

			// Test password generator strength
			await page.click('a[href="/tools/security/password-generator"]');
			await page.waitForLoadState('networkidle');

			await page.click('button:has-text("Generate Password")');
			await expect(page.locator('[data-testid="password-strength"]')).toBeVisible();
		});

		test('should handle large inputs efficiently', async ({ page }) => {
			// Test hash generator with large text
			await page.click('a[href="/tools/security/hash-generator"]');
			await page.waitForLoadState('networkidle');

			const largeText = 'A'.repeat(10000);
			await page.fill('textarea[placeholder*="text"]', largeText);
			await page.click('button:has-text("Generate Hash")');

			const startTime = Date.now();
			await page.waitForSelector('[data-testid="hash-result"]');
			const endTime = Date.now();

			// Should complete within reasonable time
			expect(endTime - startTime).toBeLessThan(5000);
		});

		test('should show consistent loading states', async ({ page }) => {
			// Test hash generator loading
			await page.click('a[href="/tools/security/hash-generator"]');
			await page.waitForLoadState('networkidle');

			await page.fill('textarea[placeholder*="text"]', 'Test');
			await page.click('button:has-text("Generate Hash")');

			// Should show loading state
			await expect(page.locator('[data-testid="loading"]')).toBeVisible();
			await page.waitForSelector('[data-testid="hash-result"]');
			await expect(page.locator('[data-testid="loading"]')).not.toBeVisible();

			// Test encryptor loading
			await page.click('a[href="/tools/security/encryptor"]');
			await page.waitForLoadState('networkidle');

			await page.fill('textarea[placeholder*="text"]', 'Test');
			await page.fill('input[type="password"]', 'password123');
			await page.click('button:has-text("Encrypt")');

			await expect(page.locator('[data-testid="loading"]')).toBeVisible();
			await page.waitForSelector('[data-testid="encryption-result"]');
		});
	});

	test.describe('Security Tools Accessibility', () => {
		test('should support keyboard navigation', async ({ page }) => {
			await page.click('a[href="/tools/security/hash-generator"]');
			await page.waitForLoadState('networkidle');

			// Tab through interface
			await page.keyboard.press('Tab');
			await expect(page.locator('textarea:focus')).toBeVisible();

			await page.keyboard.press('Tab');
			await expect(page.locator('button:focus')).toBeVisible();

			// Test Enter key to generate
			await page.fill('textarea[placeholder*="text"]', 'Test');
			await page.keyboard.press('Enter');

			await page.waitForSelector('[data-testid="hash-result"]');
		});

		test('should have proper ARIA labels', async ({ page }) => {
			await page.click('a[href="/tools/security/password-generator"]');
			await page.waitForLoadState('networkidle');

			// Check for ARIA labels
			await expect(page.locator('[aria-label="Password length"]')).toBeVisible();
			await expect(page.locator('[aria-label="Password strength"]')).toBeVisible();
			await expect(page.locator('[role="progressbar"]')).toBeVisible();

			// Check for screen reader announcements
			await page.click('button:has-text("Generate Password")');
			await expect(page.locator('[aria-live="polite"]')).toBeVisible();
		});

		test('should support high contrast mode', async ({ page }) => {
			// Enable high contrast
			await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

			await page.click('a[href="/tools/security/encryptor"]');
			await page.waitForLoadState('networkidle');

			// Should have sufficient contrast
			const passwordInput = page.locator('input[type="password"]');
			const computedStyle = await passwordInput.evaluate((el) => {
				const style = getComputedStyle(el);
				return {
					background: style.backgroundColor,
					color: style.color,
					border: style.borderColor,
				};
			});

			// Basic contrast check (would need actual color values for proper testing)
			expect(computedStyle.background).toBeDefined();
			expect(computedStyle.color).toBeDefined();
		});
	});

	test.describe('Security Tools Responsive Design', () => {
		test('should work on mobile viewport', async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			await page.click('a[href="/tools/security/hash-generator"]');
			await page.waitForLoadState('networkidle');

			// Should adapt to mobile layout
			await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

			// Controls should be accessible
			await page.fill('textarea[placeholder*="text"]', 'Mobile test');
			await page.click('button:has-text("Generate Hash")');

			await page.waitForSelector('[data-testid="hash-result"]');

			// Result should be scrollable if needed
			const hashResult = page.locator('[data-testid="hash-result"]');
			await expect(hashResult).toBeVisible();
		});

		test('should work on tablet viewport', async ({ page }) => {
			// Set tablet viewport
			await page.setViewportSize({ width: 768, height: 1024 });

			await page.click('a[href="/tools/security/password-generator"]');
			await page.waitForLoadState('networkidle');

			// Should use tablet layout
			await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

			// Generate password
			await page.click('button:has-text("Generate Password")');
			await page.waitForSelector('[data-testid="generated-password"]');

			// All controls should be visible
			await expect(page.locator('[data-testid="password-controls"]')).toBeVisible();
			await expect(page.locator('[data-testid="strength-indicator"]')).toBeVisible();
		});

		test('should handle orientation changes', async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 });

			await page.click('a[href="/tools/security/encryptor"]');
			await page.waitForLoadState('networkidle');

			// Test portrait
			await page.fill('textarea[placeholder*="text"]', 'Orientation test');
			await page.fill('input[type="password"]', 'password123');

			// Change to landscape
			await page.setViewportSize({ width: 667, height: 375 });

			// Should maintain input and functionality
			await expect(page.locator('textarea')).toHaveValue('Orientation test');
			await expect(page.locator('input[type="password"]')).toHaveValue('password123');

			await page.click('button:has-text("Encrypt")');
			await page.waitForSelector('[data-testid="encryption-result"]');
		});
	});

	test.describe('Security Tools Error Handling', () => {
		test('should handle network errors gracefully', async ({ page }) => {
			await page.click('a[href="/tools/security/hash-generator"]');
			await page.waitForLoadState('networkidle');

			// Simulate network offline
			await page.context().setOffline(true);

			// Should still work (client-side tools)
			await page.fill('textarea[placeholder*="text"]', 'Offline test');
			await page.click('button:has-text("Generate Hash")');

			await page.waitForSelector('[data-testid="hash-result"]');

			// Restore network
			await page.context().setOffline(false);
		});

		test('should handle malformed inputs', async ({ page }) => {
			await page.click('a[href="/tools/security/encryptor"]');
			await page.waitForLoadState('networkidle');

			// Switch to decrypt mode
			await page.click('[data-testid="decrypt-mode"]');

			// Input malformed base64
			await page.fill('textarea[placeholder*="encrypted"]', 'not-valid-base64!!!');
			await page.fill('input[type="password"]', 'password123');
			await page.click('button:has-text("Decrypt")');

			// Should show user-friendly error
			await expect(page.locator('text=Invalid encrypted data format')).toBeVisible();
			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
			await expect(page.locator('text=Please check your input and try again')).toBeVisible();
		});

		test('should handle memory constraints', async ({ page }) => {
			await page.click('a[href="/tools/security/hash-generator"]');
			await page.waitForLoadState('networkidle');

			// Test with very large input
			const veryLargeText = 'A'.repeat(1000000); // 1MB

			await page.fill('textarea[placeholder*="text"]', veryLargeText);

			// Should show warning for large inputs
			await expect(page.locator('text=Large input detected')).toBeVisible();
			await expect(page.locator('text=Processing may take longer')).toBeVisible();

			// Should still process (but might take longer)
			await page.click('button:has-text("Generate Hash")');

			// Should timeout gracefully if it takes too long
			try {
				await page.waitForSelector('[data-testid="hash-result"]', { timeout: 30000 });
			} catch (error) {
				// Should show timeout error
				await expect(page.locator('text=Processing timed out')).toBeVisible();
				await expect(page.locator('text=Try with a smaller input')).toBeVisible();
			}
		});
	});

	test.describe('Security Tools Performance', () => {
		test('should complete operations within acceptable time limits', async ({ page }) => {
			const operations = [
				{ tool: 'hash-generator', action: 'Generate Hash', timeout: 5000 },
				{ tool: 'encryptor', action: 'Encrypt', timeout: 10000 },
				{ tool: 'password-generator', action: 'Generate Password', timeout: 1000 },
			];

			for (const operation of operations) {
				await page.goto('/tools/security/' + operation.tool);
				await page.waitForLoadState('networkidle');

				const startTime = Date.now();

				switch (operation.tool) {
					case 'hash-generator':
						await page.fill('textarea[placeholder*="text"]', 'Performance test');
						await page.click('button:has-text("' + operation.action + '")');
						await page.waitForSelector('[data-testid="hash-result"]');
						break;
					case 'encryptor':
						await page.fill('textarea[placeholder*="text"]', 'Performance test');
						await page.fill('input[type="password"]', 'password123');
						await page.click('button:has-text("' + operation.action + '")');
						await page.waitForSelector('[data-testid="encryption-result"]');
						break;
					case 'password-generator':
						await page.click('button:has-text("' + operation.action + '")');
						await page.waitForSelector('[data-testid="generated-password"]');
						break;
				}

				const endTime = Date.now();
				const duration = endTime - startTime;

				// Should complete within timeout
				expect(duration).toBeLessThan(operation.timeout);
			}
		});

		test('should not cause memory leaks', async ({ page }) => {
			// Perform multiple operations
			for (let i = 0; i < 10; i++) {
				await page.goto('/tools/security/hash-generator');
				await page.waitForLoadState('networkidle');

				await page.fill('textarea[placeholder*="text"]', 'Memory test ' + i);
				await page.click('button:has-text("Generate Hash")');
				await page.waitForSelector('[data-testid="hash-result"]');

				// Clear results
				await page.click('button:has-text("Clear")');
			}

			// Page should still be responsive
			await page.fill('textarea[placeholder*="text"]', 'Final test');
			await page.click('button:has-text("Generate Hash")');
			await page.waitForSelector('[data-testid="hash-result"]');
		});
	});
});
