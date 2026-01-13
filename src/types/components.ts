/**
 * Standardized component interfaces and types for the Parsify application
 */

import type { FileSizeLimit, SupportedFormat, ToolCategory } from '@/lib/constants';
import type React from 'react';

// Base component props interface
export interface BaseComponentProps {
  /** Unique identifier for component */
  id?: string;
  /** CSS class name for custom styling */
  className?: string;
  /** Children components or elements */
  children?: React.ReactNode;
  /** Additional HTML attributes */
  [key: string]: unknown;
}

// Tool component interface
export interface ToolComponentProps extends BaseComponentProps {
  /** Callback function when tool operation completes */
  onComplete?: (result: unknown) => void;
  /** Callback function when tool operation encounters an error */
  onError?: (error: Error) => void;
  /** Callback function when tool operation starts */
  onProgress?: (progress: number) => void;
  /** Whether the tool should be disabled */
  disabled?: boolean;
  /** Whether the tool is currently loading */
  loading?: boolean;
}

// File handling interface
export interface FileHandlerProps {
  /** Accepted file formats */
  acceptFormats?: SupportedFormat[];
  /** Maximum file size allowed */
  maxSize?: FileSizeLimit;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Callback function when files are selected */
  onFilesSelected?: (files: File[]) => void;
  /** Callback function when file selection encounters an error */
  onFileError?: (error: string) => void;
  /** Custom file validation function */
  validateFile?: (file: File) => boolean | string;
}

// Processing status interface
export interface ProcessingStatus {
  /** Current processing state */
  status: 'idle' | 'processing' | 'completed' | 'error';
  /** Current progress percentage (0-100) */
  progress: number;
  /** Current status message */
  message: string;
  /** Error details if status is "error" */
  error?: string;
  /** Processing start timestamp */
  startTime?: number;
  /** Processing end timestamp */
  endTime?: number;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
}

// Tool result interface
export interface ToolResult<T = unknown> {
  /** Result data */
  data: T;
  /** Whether operation was successful */
  success: boolean;
  /** Processing status information */
  status: ProcessingStatus;
  /** Metadata about result */
  metadata: {
    /** Result timestamp */
    timestamp: number;
    /** Processing duration in milliseconds */
    duration: number;
    /** Tool version */
    toolVersion: string;
    /** Additional tool-specific metadata */
    [key: string]: unknown;
  };
}

// Validation interface
export interface ValidationRule {
  /** Rule name */
  name: string;
  /** Validation function */
  validate: (value: any) => boolean | string;
  /** Error message for failed validation */
  message: string;
  /** Whether this rule is required */
  required?: boolean;
}

// Validator component interface
export interface ValidatorProps extends BaseComponentProps {
  /** Value to validate */
  value: any;
  /** Array of validation rules */
  rules: ValidationRule[];
  /** Callback function when validation status changes */
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  /** Whether to show validation errors */
  showErrors?: boolean;
  /** Custom error renderer */
  renderError?: (error: string) => React.ReactNode;
}

// Export/Import interface
export interface ExportOptions {
  /** Export format */
  format: 'json' | 'csv' | 'xml' | 'txt' | 'pdf' | 'png' | 'jpg';
  /** Export quality (for images) */
  quality?: number;
  /** Include metadata */
  includeMetadata?: boolean;
  /** Custom filename */
  filename?: string;
  /** Additional export-specific options */
  [key: string]: unknown;
}

// Export interface
export interface ExporterProps extends BaseComponentProps {
  /** Data to export */
  data: unknown;
  /** Export options */
  options: ExportOptions;
  /** Callback function when export completes */
  onExportComplete?: (filename: string) => void;
  /** Callback function when export encounters an error */
  onExportError?: (error: Error) => void;
}

// Theme interface
export interface Theme {
  /** Theme name */
  name: string;
  /** Theme mode */
  mode: 'light' | 'dark' | 'auto';
  /** Primary color palette */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  /** Typography settings */
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  /** Spacing scale */
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

// Theme provider interface
export interface ThemeProviderProps extends BaseComponentProps {
  /** Current theme */
  theme: Theme;
  /** Function to update theme */
  setTheme: (theme: Theme) => void;
  /** Available themes */
  availableThemes: Theme[];
}

// Analytics interface
export interface AnalyticsEvent {
  /** Event name */
  name: string;
  /** Event properties */
  properties?: Record<string, unknown>;
  /** Event timestamp */
  timestamp: number;
  /** Event category */
  category?: string;
  /** Event action */
  action?: string;
  /** Event label */
  label?: string;
  /** Event value */
  value?: number;
}

// Analytics provider interface
export interface AnalyticsProviderProps extends BaseComponentProps {
  /** Analytics provider configuration */
  config: {
    provider: 'google-analytics' | 'custom';
    trackingId?: string;
    disabled?: boolean;
    debug?: boolean;
  };
  /** Function to track events */
  trackEvent: (event: AnalyticsEvent) => void;
  /** Function to track page views */
  trackPageView: (path: string) => void;
}

// Error boundary interface
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error?: Error;
  /** Error information */
  errorInfo?: React.ErrorInfo;
}

// Error boundary props interface
export interface ErrorBoundaryProps extends BaseComponentProps {
  /** Fallback component to render when an error occurs */
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  /** Custom error message */
  errorMessage?: string;
  /** Function to call when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show the error details */
  showErrorDetails?: boolean;
}

// Tool configuration interface
export interface ToolConfig {
  /** Tool unique identifier */
  id: string;
  /** Tool display name */
  name: string;
  /** Tool description */
  description: string;
  /** Tool category */
  category: ToolCategory;
  /** Tool icon */
  icon: string;
  /** Tool tags */
  tags: string[];
  /** Tool difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Tool status */
  status: 'stable' | 'beta' | 'experimental' | 'deprecated';
  /** Whether tool is new */
  isNew?: boolean;
  /** Whether tool is popular */
  isPopular?: boolean;
  /** Tool route */
  href: string;
  /** Processing type */
  processingType: 'client-side' | 'server-side' | 'hybrid';
  /** Security level */
  security: 'public' | 'private' | 'secure-sandbox';
  /** Tool features */
  features: string[];
  /** Additional configuration */
  config?: Record<string, unknown>;
}

// Tool registry interface
export interface ToolRegistry {
  /** Get tool by ID */
  getTool: (id: string) => ToolConfig | undefined;
  /** Get tools by category */
  getToolsByCategory: (category: ToolCategory) => ToolConfig[];
  /** Get all tools */
  getAllTools: () => ToolConfig[];
  /** Search tools */
  searchTools: (query: string) => ToolConfig[];
  /** Register new tool */
  registerTool: (tool: ToolConfig) => void;
  /** Unregister tool */
  unregisterTool: (id: string) => void;
}

// Component registry interface
export interface ComponentRegistry {
  /** Register a component */
  register: (name: string, component: React.ComponentType<unknown>) => void;
  /** Get a component by name */
  get: (name: string) => React.ComponentType<unknown> | undefined;
  /** Get all registered components */
  getAll: () => Record<string, React.ComponentType<unknown>>;
  /** Check if component is registered */
  has: (name: string) => boolean;
  /** Unregister a component */
  unregister: (name: string) => void;
}

// Hook return type generics
export type HookReturn<T> = [T, (value: T) => void];
export type HookReturnWithActions<T, A extends Record<string, unknown> = Record<string, never>> = [
  T,
  (value: T) => void,
  A,
];

// Generic event handler type
export type EventHandler<T = unknown> = (event: T) => void;
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>;

// Async state type
export type AsyncState<T> = {
  data?: T;
  loading: boolean;
  error?: Error;
};

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
