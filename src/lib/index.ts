/**
 * Library Index
 * Centralized export for all utilities and shared logic
 */

export * from './constants';
export { cn } from './utils';
export * from './utils/validation';
export { useTool, useFileHandler } from './hooks/useTool';

// Performance utilities
export {
  BundleAnalyzer,
  type BundleMetrics,
  type PerformanceMetrics as BundlePerformanceMetrics,
  type ToolPerformanceMetrics as BundleToolPerformanceMetrics,
} from './performance/bundle-analyzer';
export * from './performance/lazy-loader';
export {
  PerformanceMonitor,
  type PerformanceReport,
  type ToolPerformanceMetrics as MonitorToolPerformanceMetrics,
  type SystemMetrics,
  type WebVitalsMetrics,
  type PerformanceThreshold,
  type PerformanceRecommendation,
  type PerformanceAlert,
} from './performance-monitor';

// Cryptography utilities
export {
  aesEncrypt,
  aesDecrypt,
  generateAESKey,
  arrayBufferToHex,
  hexToArrayBuffer,
  type AESEncryptionOptions,
  type AESDecryptionOptions,
  type AESResult,
} from './crypto/aes-operations';
export {
  generateRSAKeyPair,
  generateRSASigningKeyPair,
  rsaEncrypt,
  rsaDecrypt,
  rsaSign,
  rsaVerify,
  exportRSAPublicKey,
  importRSAPublicKey,
  type RSAKeyPair,
  type RSAEncryptionOptions,
  type RSADecryptionOptions,
  type RSASignOptions,
  type RSAVerifyOptions,
  type RSAResult,
} from './crypto/rsa-operations';
export {
  hashData,
  hmacData,
  sha1,
  sha256,
  sha384,
  sha512,
  md5,
  hmacSha256,
  hmacSha512,
  generateSalt,
  pbkdf2,
  type HashOptions,
  type HmacOptions,
  type HashResult,
} from './crypto/hash-operations';
export {
  WebCryptoProvider,
  FallbackCryptoProvider,
  getCryptoProvider,
  type CryptoProvider as CryptoProviderInterface,
  type EncryptionResult as ProviderEncryptionResult,
  type DecryptionResult as ProviderDecryptionResult,
  type KeyPairResult,
  type HashResult as ProviderHashResult,
} from './crypto/crypto-provider';

// JSON utilities
export {
  JSONValidator,
  validateJSON,
  validateJSONSchema,
  defaultValidator,
  type ValidationError as JsonValidationError,
  type ValidationWarning as JsonValidationWarning,
  type ValidationResult as JsonValidationResult,
  type ValidationPerformance,
  type ValidationMetadata,
  type ValidationOptions,
  type ValidationRule,
  type JSONSchema,
  type SchemaValidationResult,
  type SchemaValidationError,
} from './json/json-validator';
export * from './json/codegen-utils';
