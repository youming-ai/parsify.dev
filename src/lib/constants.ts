/**
 * Global constants and configuration for the Parsify application
 */

// Application constants
export const APP_NAME = 'Parsify';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'Comprehensive online developer tools platform';

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  JSON: 5 * 1024 * 1024, // 5MB
  CODE: 1 * 1024 * 1024, // 1MB
  TEXT: 2 * 1024 * 1024, // 2MB
  CSV: 10 * 1024 * 1024, // 10MB
} as const;

// Supported file formats
export const SUPPORTED_FORMATS = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg'],
  JSON: ['json', 'jsonl', 'ndjson'],
  CODE: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'py',
    'java',
    'cpp',
    'c',
    'cs',
    'php',
    'rb',
    'go',
    'rs',
    'swift',
    'kt',
    'scala',
    'html',
    'css',
    'scss',
    'less',
    'xml',
    'yaml',
    'yml',
    'toml',
    'ini',
    'sql',
  ],
  TEXT: ['txt', 'md', 'markdown', 'rtf'],
  CSV: ['csv', 'tsv'],
} as const;

// Default timeouts (in milliseconds)
export const TIMEOUTS = {
  FILE_PROCESSING: 30000, // 30 seconds
  CODE_EXECUTION: 10000, // 10 seconds
  NETWORK_REQUEST: 15000, // 15 seconds
  IMAGE_PROCESSING: 20000, // 20 seconds
  ANIMATION: 300, // 300ms
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  MAX_JSON_SIZE: 50 * 1024 * 1024, // 50MB for JSON processing
  MAX_IMAGE_DIMENSION: 4096, // 4096px for image processing
  MAX_CODE_LINES: 10000, // Maximum lines for code execution
  MAX_TEXT_LENGTH: 1000000, // 1M characters for text processing
} as const;

// UI Constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300, // milliseconds
  TOAST_DURATION: 5000, // milliseconds
  MAX_RECENT_ITEMS: 10,
  DEFAULT_PAGE_SIZE: 20,
  MAX_BATCH_SIZE: 100,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file format',
  PROCESSING_ERROR: 'An error occurred while processing the file',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection',
  INVALID_JSON: 'Invalid JSON format. Please check your input',
  CODE_EXECUTION_ERROR: 'Error occurred during code execution',
  IMAGE_PROCESSING_ERROR: 'Error occurred during image processing',
  ENCRYPTION_ERROR: 'Error occurred during encryption/decryption',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  PROCESSING_COMPLETE: 'Processing completed successfully',
  CODE_EXECUTED: 'Code executed successfully',
  IMAGE_PROCESSED: 'Image processed successfully',
  DATA_ENCRYPTED: 'Data encrypted successfully',
  DATA_DECRYPTED: 'Data decrypted successfully',
  DATA_VALIDATED: 'Data validation completed successfully',
} as const;

// LocalStorage keys
export const STORAGE_KEYS = {
  THEME: 'parsify-theme',
  LANGUAGE: 'parsify-language',
  RECENT_FILES: 'parsify-recent-files',
  USER_PREFERENCES: 'parsify-user-preferences',
  TOOL_SETTINGS: 'parsify-tool-settings',
} as const;

// Tool categories
export const TOOL_CATEGORIES = {
  JSON: 'JSON Tools',
  CODE: 'Code Tools',
  IMAGE: 'Image/Media Tools',
  NETWORK: 'Network/Ops/Encoding Tools',
  TEXT: 'Text Tools',
  SECURITY: 'Encryption/Hashing/Generation',
  COMMON: 'Common/Auxiliary Tools',
} as const;

// Default values
export const DEFAULTS = {
  JSON_INDENTATION: 2,
  CODE_FONT_SIZE: 14,
  IMAGE_QUALITY: 0.9,
  ENCRYPTION_STRENGTH: 256,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  JSON: /^\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// Color schemes
export const COLOR_SCHEMES = {
  LIGHT: {
    background: '#ffffff',
    foreground: '#000000',
    muted: '#f3f4f6',
    accent: '#3b82f6',
  },
  DARK: {
    background: '#1f2937',
    foreground: '#f9fafb',
    muted: '#374151',
    accent: '#60a5fa',
  },
} as const;

// Export types for better TypeScript support
export type FileSizeLimit = (typeof FILE_SIZE_LIMITS)[keyof typeof FILE_SIZE_LIMITS];
export type SupportedFormat = (typeof SUPPORTED_FORMATS)[keyof typeof SUPPORTED_FORMATS][number];
export type Timeout = (typeof TIMEOUTS)[keyof typeof TIMEOUTS];
export type ToolCategory = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
