/**
 * Web Worker for cryptographic processing operations
 * Handles encryption, decryption, and hash generation in background thread
 */

import { ProcessingError } from '../../types/tools';

interface CryptoWorkerMessage {
	id: string;
	type: 'hash' | 'encrypt' | 'decrypt' | 'generate' | 'validate';
	algorithm: string;
	data: string | ArrayBuffer;
	key?: string;
	options?: any;
}

interface CryptoWorkerResponse {
	id: string;
	success: boolean;
	result?: any;
	error?: ProcessingError;
	metrics: {
		duration: number;
		inputSize: number;
		outputSize: number;
	};
}

// Crypto processing functions
async function processCrypto(
	type: string,
	algorithm: string,
	data: string | ArrayBuffer,
	key?: string,
	options: any = {},
) {
	try {
		const startTime = Date.now();
		let result: any;

		switch (type) {
			case 'hash':
				result = await generateHash(algorithm, data, options);
				break;
			case 'encrypt':
				if (!key) throw new Error('Key is required for encryption');
				result = await encryptData(algorithm, data, key, options);
				break;
			case 'decrypt':
				if (!key) throw new Error('Key is required for decryption');
				result = await decryptData(algorithm, data, key, options);
				break;
			case 'generate':
				result = await generateData(algorithm, options);
				break;
			case 'validate':
				result = await validateHash(algorithm, data, options.expectedHash, options);
				break;
			default:
				throw new Error(`Unknown crypto operation: ${type}`);
		}

		const duration = Date.now() - startTime;
		const inputSize = data instanceof ArrayBuffer ? data.byteLength : data.length;
		const outputSize =
			typeof result === 'string'
				? result.length
				: result instanceof ArrayBuffer
					? result.byteLength
					: JSON.stringify(result).length;

		return {
			success: true,
			result,
			metrics: { duration, inputSize, outputSize },
		};
	} catch (error) {
		return {
			success: false,
			error: {
				type: 'processing',
				message: error instanceof Error ? error.message : 'Crypto processing error',
				code: 'CRYPTO_PROCESSING_ERROR',
				details: error,
				recoverable: true,
				suggestions: ['Check algorithm support', 'Verify key format', 'Ensure data is properly encoded'],
			},
			metrics: { duration: 0, inputSize: 0, outputSize: 0 },
		};
	}
}

async function generateHash(algorithm: string, data: string | ArrayBuffer, options: any) {
	const encoder = new TextEncoder();
	const dataArray = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);

	// Use Web Crypto API for modern browsers
	if (typeof crypto !== 'undefined' && crypto.subtle) {
		const hashAlgorithm = getWebCryptoAlgorithm(algorithm);
		if (hashAlgorithm) {
			const hashBuffer = await crypto.subtle.digest(hashAlgorithm, dataArray);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
		}
	}

	// Fallback to crypto-js for other algorithms
	const CryptoJS = await import('crypto-js');

	switch (algorithm.toLowerCase()) {
		case 'md5':
			return CryptoJS.MD5(data).toString();
		case 'sha1':
			return CryptoJS.SHA1(data).toString();
		case 'sha256':
			return CryptoJS.SHA256(data).toString();
		case 'sha512':
			return CryptoJS.SHA512(data).toString();
		case 'sha3':
		case 'sha3-256':
			return CryptoJS.SHA3(data).toString();
		default:
			throw new Error(`Unsupported hash algorithm: ${algorithm}`);
	}
}

async function encryptData(algorithm: string, data: string | ArrayBuffer, key: string, options: any) {
	const CryptoJS = await import('crypto-js');

	switch (algorithm.toLowerCase()) {
		case 'aes':
		case 'aes-128':
		case 'aes-256':
			const keySize = algorithm.includes('256') ? 256 : 128;
			const encrypted = CryptoJS.AES.encrypt(data, key).toString();
			return {
				encrypted,
				algorithm: `AES-${keySize}`,
				iv: CryptoJS.lib.WordArray.random(16).toString(),
				keySize,
			};
		case 'des':
			const desEncrypted = CryptoJS.DES.encrypt(data, key).toString();
			return {
				encrypted: desEncrypted,
				algorithm: 'DES',
				iv: CryptoJS.lib.WordArray.random(8).toString(),
			};
		case 'tripledes':
			const tripleEncrypted = CryptoJS.TripleDES.encrypt(data, key).toString();
			return {
				encrypted: tripleEncrypted,
				algorithm: '3DES',
				iv: CryptoJS.lib.WordArray.random(8).toString(),
			};
		case 'rabbit':
			const rabbitEncrypted = CryptoJS.Rabbit.encrypt(data, key).toString();
			return {
				encrypted: rabbitEncrypted,
				algorithm: 'Rabbit',
			};
		case 'rc4':
			const rc4Encrypted = CryptoJS.RC4.encrypt(data, key).toString();
			return {
				encrypted: rc4Encrypted,
				algorithm: 'RC4',
			};
		default:
			throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
	}
}

async function decryptData(algorithm: string, data: string | ArrayBuffer, key: string, options: any) {
	const CryptoJS = await import('crypto-js');

	// Handle both string and object formats
	const encryptedData = typeof data === 'string' ? data : data.toString();

	switch (algorithm.toLowerCase()) {
		case 'aes':
		case 'aes-128':
		case 'aes-256':
			const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
			const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
			if (!decryptedText) {
				throw new Error('Decryption failed - incorrect key or corrupted data');
			}
			return decryptedText;
		case 'des':
			const desDecrypted = CryptoJS.DES.decrypt(encryptedData, key);
			const desText = desDecrypted.toString(CryptoJS.enc.Utf8);
			if (!desText) {
				throw new Error('DES decryption failed - incorrect key or corrupted data');
			}
			return desText;
		case 'tripledes':
			const tripleDecrypted = CryptoJS.TripleDES.decrypt(encryptedData, key);
			const tripleText = tripleDecrypted.toString(CryptoJS.enc.Utf8);
			if (!tripleText) {
				throw new Error('3DES decryption failed - incorrect key or corrupted data');
			}
			return tripleText;
		case 'rabbit':
			const rabbitDecrypted = CryptoJS.Rabbit.decrypt(encryptedData, key);
			const rabbitText = rabbitDecrypted.toString(CryptoJS.enc.Utf8);
			if (!rabbitText) {
				throw new Error('Rabbit decryption failed - incorrect key or corrupted data');
			}
			return rabbitText;
		case 'rc4':
			const rc4Decrypted = CryptoJS.RC4.decrypt(encryptedData, key);
			const rc4Text = rc4Decrypted.toString(CryptoJS.enc.Utf8);
			if (!rc4Text) {
				throw new Error('RC4 decryption failed - incorrect key or corrupted data');
			}
			return rc4Text;
		default:
			throw new Error(`Unsupported decryption algorithm: ${algorithm}`);
	}
}

async function generateData(algorithm: string, options: any) {
	switch (algorithm.toLowerCase()) {
		case 'uuid':
			const { v4: uuidv4 } = await import('uuid');
			return uuidv4();
		case 'password':
			return generatePassword(options);
		case 'random-bytes':
			return generateRandomBytes(options.length || 32);
		case 'otp':
			return generateOTP(options);
		default:
			throw new Error(`Unsupported generation algorithm: ${algorithm}`);
	}
}

async function validateHash(algorithm: string, data: string | ArrayBuffer, expectedHash: string, options: any) {
	const actualHash = await generateHash(algorithm, data, options);
	return {
		valid: actualHash === expectedHash.toLowerCase(),
		expected: expectedHash.toLowerCase(),
		actual: actualHash,
		algorithm,
	};
}

function generatePassword(options: any) {
	const length = options.length || 16;
	const includeUppercase = options.includeUppercase !== false;
	const includeLowercase = options.includeLowercase !== false;
	const includeNumbers = options.includeNumbers !== false;
	const includeSymbols = options.includeSymbols !== false;

	let charset = '';
	if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
	if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if (includeNumbers) charset += '0123456789';
	if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

	if (!charset) {
		throw new Error('At least one character type must be selected');
	}

	const array = new Uint8Array(length);
	crypto.getRandomValues(array);

	let password = '';
	for (let i = 0; i < length; i++) {
		password += charset[array[i] % charset.length];
	}

	return {
		password,
		strength: calculatePasswordStrength(password),
		length,
		characterSets: {
			uppercase: includeUppercase,
			lowercase: includeLowercase,
			numbers: includeNumbers,
			symbols: includeSymbols,
		},
	};
}

function generateRandomBytes(length: number) {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);

	return {
		bytes: Array.from(array),
		hex: Array.from(array)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join(''),
		base64: btoa(String.fromCharCode(...array)),
		length,
	};
}

function generateOTP(options: any) {
	const length = options.length || 6;
	const isNumeric = options.numeric !== false;

	if (isNumeric) {
		let otp = '';
		for (let i = 0; i < length; i++) {
			otp += Math.floor(Math.random() * 10);
		}
		return { otp, type: 'numeric', length };
	} else {
		const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let otp = '';
		for (let i = 0; i < length; i++) {
			otp += charset[Math.floor(Math.random() * charset.length)];
		}
		return { otp, type: 'alphanumeric', length };
	}
}

function calculatePasswordStrength(password: string) {
	let score = 0;
	const feedback = [];

	if (password.length >= 8) {
		score += 1;
	} else {
		feedback.push('Password should be at least 8 characters long');
	}

	if (password.length >= 12) score += 1;
	if (/[a-z]/.test(password)) score += 1;
	if (/[A-Z]/.test(password)) score += 1;
	if (/[0-9]/.test(password)) score += 1;
	if (/[^a-zA-Z0-9]/.test(password)) score += 1;

	let strength = 'weak';
	if (score >= 5) strength = 'strong';
	else if (score >= 3) strength = 'medium';

	return { strength, score, feedback };
}

function getWebCryptoAlgorithm(algorithm: string): string | null {
	switch (algorithm.toLowerCase()) {
		case 'sha-1':
		case 'sha1':
			return 'SHA-1';
		case 'sha-256':
		case 'sha256':
			return 'SHA-256';
		case 'sha-384':
		case 'sha384':
			return 'SHA-384';
		case 'sha-512':
		case 'sha512':
			return 'SHA-512';
		default:
			return null;
	}
}

// Message handler
self.onmessage = async (event: MessageEvent<CryptoWorkerMessage>) => {
	const { id, type, algorithm, data, key, options } = event.data;

	try {
		const response = await processCrypto(type, algorithm, data, key, options);
		response.id = id;
		self.postMessage(response);
	} catch (error) {
		const errorResponse: CryptoWorkerResponse = {
			id,
			success: false,
			error: {
				type: 'processing',
				message: error instanceof Error ? error.message : 'Crypto worker error',
				code: 'WORKER_ERROR',
				details: error,
				recoverable: false,
			},
			metrics: { duration: 0, inputSize: 0, outputSize: 0 },
		};

		self.postMessage(errorResponse);
	}
};

export {};
