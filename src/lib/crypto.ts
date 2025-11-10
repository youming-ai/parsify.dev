/**
 * Cryptographic utilities for security tools
 * Handles hash generation, encryption, password generation, and JWT operations
 */

import { CryptoHashOptions, EncryptionResult, PasswordOptions } from '@/types/tools';

export interface HashResult {
	algorithm: string;
	hash: string;
	inputSize: number;
	processingTime: number;
}

export interface EncryptionOptions {
	algorithm: 'AES' | 'RSA';
	keySize?: 128 | 192 | 256;
	mode?: 'CBC' | 'GCM' | 'CTR';
	padding?: 'PKCS7' | 'NoPadding';
}

export interface PasswordStrength {
	score: number; // 0-100
	level: 'very_weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
	feedback: string[];
	crackTime: string;
	entropy: number;
}

export class CryptoUtils {
	/**
	 * Generate hash for text or file data
	 */
	static async generateHash(
		data: string | ArrayBuffer,
		algorithm: string,
		options: CryptoHashOptions = {},
	): Promise<HashResult> {
		const startTime = Date.now();

		try {
			// Convert input to Uint8Array if needed
			const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);

			let hash: string;

			// Use Web Crypto API for secure hashing
			if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
				const hashAlgorithm = this.getWebCryptoAlgorithm(algorithm);
				const hashBuffer = await window.crypto.subtle.digest(hashAlgorithm, dataBuffer);
				hash = this.bufferToHex(hashBuffer);
			} else {
				// Fallback to simple hashing for environments without Web Crypto API
				hash = await this.fallbackHash(dataBuffer, algorithm);
			}

			// Apply formatting options
			if (options.uppercase) {
				hash = hash.toUpperCase();
			}

			if (options.format === 'base64') {
				hash = this.hexToBase64(hash);
			}

			const processingTime = Date.now() - startTime;

			return {
				algorithm,
				hash,
				inputSize: dataBuffer.length,
				processingTime,
			};
		} catch (error) {
			throw new Error(`Hash generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Encrypt data with password
	 */
	static async encryptData(data: string, password: string, options: EncryptionOptions = {}): Promise<EncryptionResult> {
		const startTime = Date.now();

		try {
			if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
				throw new Error('Web Crypto API not available in this environment');
			}

			// Convert data to buffer
			const dataBuffer = new TextEncoder().encode(data);

			// Generate salt and IV
			const salt = window.crypto.getRandomValues(new Uint8Array(16));
			const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

			// Derive key from password
			const keyMaterial = await window.crypto.subtle.importKey(
				'raw',
				new TextEncoder().encode(password),
				{ name: 'PBKDF2' },
				false,
				['deriveBits', 'deriveKey'],
			);

			const key = await window.crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',
					salt,
					iterations: 100000,
					hash: 'SHA-256',
				},
				keyMaterial,
				{ name: 'AES-GCM', length: options.keySize || 256 },
				false,
				['encrypt'],
			);

			// Encrypt data
			const encryptedData = await window.crypto.subtle.encrypt(
				{
					name: 'AES-GCM',
					iv,
				},
				key,
				dataBuffer,
			);

			// Combine salt, IV, and encrypted data
			const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
			combined.set(salt, 0);
			combined.set(iv, salt.length);
			combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

			// Convert to base64 for storage/transmission
			const encryptedBase64 = this.arrayBufferToBase64(combined.buffer);

			const processingTime = Date.now() - startTime;

			return {
				algorithm: `AES-${options.keySize || 256}-GCM`,
				encryptedData: encryptedBase64,
				salt: this.arrayBufferToBase64(salt.buffer),
				iv: this.arrayBufferToBase64(iv.buffer),
				processingTime,
				dataSize: dataBuffer.length,
			};
		} catch (error) {
			throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Decrypt data with password
	 */
	static async decryptData(
		encryptedData: string,
		password: string,
		salt: string,
		iv: string,
		keySize: number = 256,
	): Promise<string> {
		try {
			if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
				throw new Error('Web Crypto API not available in this environment');
			}

			// Convert from base64
			const combined = this.base64ToArrayBuffer(encryptedData);
			const saltBuffer = this.base64ToArrayBuffer(salt);
			const ivBuffer = this.base64ToArrayBuffer(iv);

			// Extract encrypted data (skip salt and IV)
			const encryptedBuffer = combined.slice(saltBuffer.byteLength + ivBuffer.byteLength);

			// Derive key from password
			const keyMaterial = await window.crypto.subtle.importKey(
				'raw',
				new TextEncoder().encode(password),
				{ name: 'PBKDF2' },
				false,
				['deriveBits', 'deriveKey'],
			);

			const key = await window.crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',
					salt: new Uint8Array(saltBuffer),
					iterations: 100000,
					hash: 'SHA-256',
				},
				keyMaterial,
				{ name: 'AES-GCM', length: keySize },
				false,
				['decrypt'],
			);

			// Decrypt data
			const decryptedBuffer = await window.crypto.subtle.decrypt(
				{
					name: 'AES-GCM',
					iv: new Uint8Array(ivBuffer),
				},
				key,
				encryptedBuffer,
			);

			// Convert back to string
			return new TextDecoder().decode(decryptedBuffer);
		} catch (error) {
			throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Generate secure password
	 */
	static generatePassword(options: PasswordOptions): {
		password: string;
		strength: PasswordStrength;
	} {
		const {
			length = 16,
			includeUppercase = true,
			includeLowercase = true,
			includeNumbers = true,
			includeSymbols = true,
			excludeSimilar = false,
			excludeAmbiguous = false,
			customCharset = null,
		} = options;

		let charset = '';

		if (customCharset) {
			charset = customCharset;
		} else {
			if (includeLowercase) {
				charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
			}
			if (includeUppercase) {
				charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			}
			if (includeNumbers) {
				charset += excludeSimilar ? '23456789' : '0123456789';
			}
			if (includeSymbols) {
				charset += excludeAmbiguous ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '!@#$%^&*()_+-=[]{}|;:,.<>?`~\'"\\';
			}
		}

		if (!charset) {
			throw new Error('No character set selected for password generation');
		}

		// Generate password using secure random values
		if (typeof window !== 'undefined' && window.crypto) {
			const randomValues = new Uint8Array(length);
			window.crypto.getRandomValues(randomValues);

			let password = '';
			for (let i = 0; i < length; i++) {
				password += charset[randomValues[i] % charset.length];
			}

			// Ensure at least one character from each required set
			if (customCharset === null) {
				const sets: { chars: string; required: boolean }[] = [
					{
						chars: includeLowercase ? (excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz') : '',
						required: includeLowercase,
					},
					{
						chars: includeUppercase ? (excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') : '',
						required: includeUppercase,
					},
					{
						chars: includeNumbers ? (excludeSimilar ? '23456789' : '0123456789') : '',
						required: includeNumbers,
					},
					{
						chars: includeSymbols
							? excludeAmbiguous
								? '!@#$%^&*()_+-=[]{}|;:,.<>?'
								: '!@#$%^&*()_+-=[]{}|;:,.<>?`~\'"\\'
							: '',
						required: includeSymbols,
					},
				];

				for (const set of sets) {
					if (set.required && set.chars && !Array.from(password).some((char) => set.chars.includes(char))) {
						// Replace a random character with one from this set
						const position = Math.floor(Math.random() * password.length);
						const replacement = set.chars[Math.floor(Math.random() * set.chars.length)];
						password = password.substring(0, position) + replacement + password.substring(position + 1);
					}
				}
			}

			const strength = this.calculatePasswordStrength(password);

			return { password, strength };
		} else {
			// Fallback for environments without secure random
			let password = '';
			for (let i = 0; i < length; i++) {
				password += charset[Math.floor(Math.random() * charset.length)];
			}

			const strength = this.calculatePasswordStrength(password);

			return { password, strength };
		}
	}

	/**
	 * Calculate password strength
	 */
	static calculatePasswordStrength(password: string): PasswordStrength {
		let score = 0;
		const feedback: string[] = [];

		// Length scoring
		const length = password.length;
		if (length >= 8) score += 10;
		if (length >= 12) score += 15;
		if (length >= 16) score += 20;
		if (length >= 20) score += 15;

		if (length < 8) {
			feedback.push('Password should be at least 8 characters long');
		}

		// Character variety scoring
		const hasLower = /[a-z]/.test(password);
		const hasUpper = /[A-Z]/.test(password);
		const hasNumber = /[0-9]/.test(password);
		const hasSymbol = /[^a-zA-Z0-9]/.test(password);

		if (hasLower) score += 15;
		else feedback.push('Include lowercase letters');

		if (hasUpper) score += 15;
		else feedback.push('Include uppercase letters');

		if (hasNumber) score += 15;
		else feedback.push('Include numbers');

		if (hasSymbol) score += 20;
		else feedback.push('Include special characters');

		// Pattern penalties
		if (/(.)\1{2,}/.test(password)) {
			score -= 10;
			feedback.push('Avoid repeating characters');
		}

		if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
			score -= 20;
			feedback.push('Use a mix of character types');
		}

		// Common pattern checks
		const commonPatterns = [/123/i, /abc/i, /qwer/i, /asdf/i, /zxcv/i, /password/i, /admin/i, /user/i, /login/i];

		for (const pattern of commonPatterns) {
			if (pattern.test(password)) {
				score -= 15;
				feedback.push('Avoid common patterns and words');
				break;
			}
		}

		// Calculate entropy
		let charsetSize = 0;
		if (hasLower) charsetSize += 26;
		if (hasUpper) charsetSize += 26;
		if (hasNumber) charsetSize += 10;
		if (hasSymbol) charsetSize += 32; // Approximate

		const entropy = length * Math.log2(charsetSize);

		// Determine strength level
		let level: PasswordStrength['level'];
		let crackTime: string;

		if (score < 30) {
			level = 'very_weak';
			crackTime = 'instant';
		} else if (score < 50) {
			level = 'weak';
			crackTime = 'minutes';
		} else if (score < 70) {
			level = 'fair';
			crackTime = 'hours';
		} else if (score < 85) {
			level = 'good';
			crackTime = 'days';
		} else if (score < 95) {
			level = 'strong';
			crackTime = 'years';
		} else {
			level = 'very_strong';
			crackTime = 'centuries';
		}

		return {
			score: Math.max(0, Math.min(100, score)),
			level,
			feedback,
			crackTime,
			entropy,
		};
	}

	/**
	 * Validate JWT token structure
	 */
	static validateJWT(token: string): {
		valid: boolean;
		header?: any;
		payload?: any;
		error?: string;
	} {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) {
				return {
					valid: false,
					error: 'Invalid JWT format. Expected 3 parts separated by dots.',
				};
			}

			const [headerB64, payloadB64] = parts;

			// Decode header
			const headerStr = this.base64UrlDecode(headerB64);
			const header = JSON.parse(headerStr);

			// Decode payload
			const payloadStr = this.base64UrlDecode(payloadB64);
			const payload = JSON.parse(payloadStr);

			// Validate claims
			const now = Math.floor(Date.now() / 1000);

			if (payload.exp && typeof payload.exp === 'number' && payload.exp < now) {
				return {
					valid: false,
					header,
					payload,
					error: `Token expired at ${new Date(payload.exp * 1000).toLocaleString()}`,
				};
			}

			if (payload.nbf && typeof payload.nbf === 'number' && payload.nbf > now) {
				return {
					valid: false,
					header,
					payload,
					error: `Token not valid until ${new Date(payload.nbf * 1000).toLocaleString()}`,
				};
			}

			return { valid: true, header, payload };
		} catch (error) {
			return {
				valid: false,
				error: error instanceof Error ? error.message : 'Failed to validate JWT',
			};
		}
	}

	/**
	 * Generate UUID v4
	 */
	static generateUUID(): string {
		if (typeof window !== 'undefined' && window.crypto) {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				const r = window.crypto.getRandomValues(new Uint8Array(1))[0] % 16;
				const v = c === 'x' ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			});
		} else {
			// Fallback implementation
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				const r = (Math.random() * 16) | 0;
				const v = c === 'x' ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			});
		}
	}

	// Private helper methods
	private static getWebCryptoAlgorithm(algorithm: string): string {
		const algorithmMap: { [key: string]: string } = {
			md5: 'SHA-1', // MD5 not supported in Web Crypto, fallback to SHA-1
			sha1: 'SHA-1',
			sha256: 'SHA-256',
			sha384: 'SHA-384',
			sha512: 'SHA-512',
			sha3: 'SHA-256', // Fallback to SHA-256
		};

		return algorithmMap[algorithm.toLowerCase()] || 'SHA-256';
	}

	private static bufferToHex(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		return Array.from(bytes)
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('');
	}

	private static hexToBase64(hex: string): string {
		return btoa(String.fromCharCode(...hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))));
	}

	private static arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	private static base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes.buffer;
	}

	private static base64UrlDecode(base64Url: string): string {
		base64Url = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		while (base64Url.length % 4) {
			base64Url += '=';
		}
		return atob(base64Url);
	}

	private static async fallbackHash(data: Uint8Array, algorithm: string): Promise<string> {
		// Simple hash implementation for environments without Web Crypto API
		// This is a basic implementation - in production, consider using a proper crypto library

		if (algorithm.toLowerCase() === 'md5') {
			return this.simpleMD5(data);
		}

		// For other algorithms, use a simple XOR-based hash (not cryptographically secure)
		let hash = 0;
		for (let i = 0; i < data.length; i++) {
			hash = (hash << 5) - hash + data[i];
			hash = hash & hash; // Convert to 32-bit integer
		}

		return Math.abs(hash).toString(16).padStart(32, '0');
	}

	private static simpleMD5(data: Uint8Array): string {
		// Very basic MD5-like implementation (NOT SECURE - for fallback only)
		let hash = 1732584193;

		for (let i = 0; i < data.length; i++) {
			hash = (hash << 5) - hash + data[i];
			hash = hash & hash;
		}

		return Math.abs(hash).toString(16).padStart(32, '0');
	}
}

// Export convenience functions
export const generateHash = CryptoUtils.generateHash;
export const encryptData = CryptoUtils.encryptData;
export const decryptData = CryptoUtils.decryptData;
export const generatePassword = CryptoUtils.generatePassword;
export const calculatePasswordStrength = CryptoUtils.calculatePasswordStrength;
export const validateJWT = CryptoUtils.validateJWT;
export const generateUUID = CryptoUtils.generateUUID;
