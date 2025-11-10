// Security Tools Components
export { HashGenerator } from './hash-generator';
export { FileEncryptor } from './file-encryptor';
export { PasswordGenerator } from './password-generator';

// Security Tool Types
export type {
	EnhancedHashResult,
	HashGenerationOptions,
	EncryptionJob,
	GeneratedPassword,
	PasswordGenerationOptions,
	PassphraseOptions,
	PronounceableOptions,
	BatchGenerationOptions,
	SecurityToolConfig,
} from './security-types';

// Re-export crypto utilities for convenience
export {
	CryptoUtils,
	generateHash,
	encryptData,
	decryptData,
	generatePassword,
	calculatePasswordStrength,
	validateJWT,
	generateUUID,
} from '@/lib/crypto';

export type {
	HashResult,
	EncryptionResult,
	PasswordStrength,
	PasswordOptions,
} from '@/lib/crypto';
