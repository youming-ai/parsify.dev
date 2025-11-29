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

// Analytics utilities
export * from './analytics/google-analytics';

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

// Image utilities
export {
  useCanvasOperations,
  calculateCropArea,
  estimateFileSize,
  type ImageDimensions,
  type CropArea,
  type ResizeOptions as CanvasResizeOptions,
  type FilterOptions,
  type WatermarkOptions,
  type ProcessingOptions,
} from './image/canvas-operations';
export {
  useFormatConverter,
  getSupportedFormats,
  getFormatInfo,
  type ConversionOptions,
  type ConversionResult,
  type ImageMetadata,
  type EXIFData,
  type BatchConversionOptions,
} from './image/format-converters';
export {
  useQRScanner,
  validateQRCode,
  type QRScanResult,
  type QRScannerConfig,
  type QRScanError,
} from './image/qr-scanner';
export {
  convertImage,
  toPNG,
  toJPEG,
  toWebP,
  toBMP,
  getImageDimensions,
  type ImageConvertOptions,
  type ImageConvertResult,
} from './image-processing/image-convert';
export {
  resizeImage,
  resizeByWidth,
  resizeByHeight,
  resizeByPercentage,
  cropToSquare,
  type ResizeOptions as ImageResizeOptions,
  type ResizeResult,
} from './image-processing/image-resize';
export {
  extractTextFromImage,
  extractTextFromRegion,
  batchOCR,
  extractTextWithPreprocessing,
  getSupportedLanguages,
  validateOCROptions,
  type OCROptions,
  type OCRResult,
} from './image-processing/image-ocr';

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
// export * from "./json/json-tool-registry"; // Removed

// Registry utilities
export * from './tool-registry';
export * from './tool-event-bus';
export * from './tool-state-manager';
export * from './tool-execution';
export type {
  BaseTool,
  ToolConfig,
  FileProcessingTool,
  FileProcessingOptions,
  BatchProcessingTool,
  BatchProcessingOptions,
  RealTimeTool,
  ConverterTool,
  ValidatorTool,
  ValidationResult as ToolValidationResult,
  ValidationError as ToolValidationError,
  ValidationRule as ToolValidationRule,
  ValidationReport,
  GeneratorTool,
  GeneratorInput,
  GeneratorTemplate,
  GeneratorParameter,
  AnalyzerTool,
  AnalysisResult as ToolAnalysisResult,
  AnalysisSummary,
  AnalysisMetric,
  AnalysisOption,
  AnalysisInsight,
  TransformerTool,
  TransformRule,
  ToolRegistry as ToolRegistrySpec,
  ToolFactory,
} from './interfaces/tool-interfaces';
export * from './memory-manager';
// export * from "./monaco-extensions"; // Removed

// Runtime utilities
export * from './runtimes/python-wasm';
export * from './runtimes/java-wasm';
export * from './runtimes/go-wasm';
export * from './runtimes/rust-wasm';
export * from './runtimes/cpp-wasm';
export * from './runtimes/csharp-wasm';
export * from './runtimes/php-wasm';
export * from './runtimes/ruby-wasm';
export * from './runtimes/lua-wasm';
export * from './runtimes/typescript-wasm';
export * from './runtimes/wasm-runtime-manager';
