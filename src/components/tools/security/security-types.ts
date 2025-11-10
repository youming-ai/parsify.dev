import { EncryptionResult, PasswordStrength } from '@/lib/crypto';

// Enhanced hash result interface
export interface EnhancedHashResult {
	algorithm: string;
	input: string;
	hash: string;
	uppercase: boolean;
	inputType: 'text' | 'file' | 'hex' | 'base64';
	fileName?: string;
	fileSize?: number;
	inputFormat: 'text' | 'hex' | 'base64';
	hmacKey?: string;
	isHmac: boolean;
	inputSize: number;
	processingTime: number;
}

// Hash generation options
export interface HashGenerationOptions {
	algorithm: string;
	uppercase?: boolean;
	format?: 'hex' | 'base64';
	hmacKey?: string;
	inputFormat?: 'text' | 'hex' | 'base64';
}

// File encryption job interface
export interface EncryptionJob {
	id: string;
	fileName: string;
	fileSize: number;
	status: 'pending' | 'processing' | 'completed' | 'error';
	progress: number;
	result?: EncryptionResult & {
		downloadUrl?: string;
		fileName?: string;
	};
	error?: string;
	algorithm: string;
	keySize: number;
	operation: 'encrypt' | 'decrypt';
	startedAt?: Date;
	completedAt?: Date;
}

// Password generation result
export interface GeneratedPassword {
	password: string;
	strength: PasswordStrength;
	entropy: number;
	createdAt: Date;
}

// Password generation options (extends lib/crypto)
export interface PasswordGenerationOptions {
	length: number;
	includeUppercase?: boolean;
	includeLowercase?: boolean;
	includeNumbers?: boolean;
	includeSymbols?: boolean;
	excludeSimilar?: boolean;
	excludeAmbiguous?: boolean;
	customCharset?: string;
}

// Passphrase generation options
export interface PassphraseOptions {
	wordCount: number;
	separator: string;
	capitalize: boolean;
	includeNumbers: boolean;
	wordList: 'eff' | 'common' | 'custom';
	customWords?: string[];
}

// Pronounceable password options
export interface PronounceableOptions {
	syllableCount: number;
	capitalize?: boolean;
	includeNumbers?: boolean;
}

// Batch generation options
export interface BatchGenerationOptions {
	count: number;
	options: PasswordGenerationOptions;
}

// Security tool configuration
export interface SecurityToolConfig {
	allowedAlgorithms: string[];
	defaultAlgorithm: string;
	maxFileSize: number;
	batchSize: number;
	passwordRequirements: {
		minLength: number;
		requireUppercase: boolean;
		requireLowercase: boolean;
		requireNumbers: boolean;
		requireSymbols: boolean;
	};
}

// Export all security-related types
export type {
	HashResult,
	EncryptionResult,
	PasswordStrength,
	PasswordOptions,
} from '@/lib/crypto';
