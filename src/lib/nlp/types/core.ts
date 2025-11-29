/**
 * Core NLP Types - Fundamental types used across all NLP operations
 */

export interface NLPAnalysis {
  text: string;
  language: LanguageInfo;
  confidence: number;
  timestamp: Date;
  metadata: AnalysisMetadata;
}

export interface AnalysisMetadata {
  processingTime: number;
  modelVersion: string;
  preprocessing: PreprocessingInfo;
  toolUsed: string;
  configuration: Record<string, any>;
}

export interface PreprocessingInfo {
  tokenCount: number;
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  languageDetected: boolean;
  normalized: boolean;
  stopWordsRemoved: boolean;
}

export interface LanguageInfo {
  code: string; // ISO 639-1 code (e.g., 'en', 'es', 'fr')
  name: string; // Full language name
  confidence: number; // 0-1 confidence score
  script: string; // 'Latin', 'Cyrillic', 'Arabic', etc.
  family?: string; // Language family
  region?: string; // Geographic region
}

export interface NLPResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  confidence: number;
  metadata: Record<string, any>;
}

export type AggregationStrategy =
  | 'average'
  | 'majority'
  | 'consensus'
  | 'confidence-weighted'
  | 'weighted';

export type OutputFormat = 'json' | 'csv' | 'xml' | 'text';

export interface ProcessingOperation {
  id?: string;
  type: string;
  tool: string;
  config?: Record<string, any>;
  enabled: boolean;
}

export interface NLPConfig {
  language?: string;
  confidence?: number;
  timeout?: number;
  cacheEnabled?: boolean;
  preprocessing?: PreprocessingConfig;
  modelConfig?: ModelConfig;
}

export interface PreprocessingConfig {
  normalizeText?: boolean;
  removeStopwords?: boolean;
  stemWords?: boolean;
  lowercaseText?: boolean;
  removePunctuation?: boolean;
  minWordLength?: number;
  maxTextLength?: number;
}

export interface ModelConfig {
  modelId: string;
  version?: string;
  cacheEnabled?: boolean;
  quantized?: boolean;
  batchSize?: number;
  maxSequenceLength?: number;
}

export interface BatchRequest<_T = any> {
  id: string;
  text: string;
  config?: Partial<NLPConfig>;
  metadata?: Record<string, any>;
}

export interface BatchResult<T = any> {
  id: string;
  result?: NLPResult<T>;
  error?: string;
  processingTime: number;
}

export interface ProcessingPipeline {
  id: string;
  name: string;
  description: string;
  steps: ProcessingStep[];
  config?: NLPConfig;
}

export interface ProcessingStep {
  id: string;
  type: 'preprocessing' | 'analysis' | 'enhancement' | 'classification' | 'multilingual';
  name: string;
  tool: string;
  config?: Record<string, any>;
  dependsOn?: string[]; // IDs of steps this step depends on
}

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Task<T = any> {
  id: string;
  type: string;
  status: TaskStatus;
  input: T;
  output?: T;
  error?: string;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}

export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  message?: string;
  stage?: string;
  estimatedTimeRemaining?: number;
}

// Error types
export class NLPError extends Error {
  constructor(
    message: string,
    public code: string,
    public tool?: string,
    public recoverable = true
  ) {
    super(message);
    this.name = 'NLPError';
  }
}

export class ModelLoadError extends NLPError {
  constructor(modelId: string, originalError?: Error) {
    super(`Failed to load model: ${modelId}`, 'MODEL_LOAD_ERROR', 'model-loader', false);
    if (originalError) {
      this.cause = originalError;
    }
  }
}

export class ProcessingTimeoutError extends NLPError {
  constructor(timeout: number) {
    super(`Processing timed out after ${timeout}ms`, 'PROCESSING_TIMEOUT', 'processor', true);
  }
}

export class ResourceExhaustedError extends NLPError {
  constructor(resource: string) {
    super(`Resource exhausted: ${resource}`, 'RESOURCE_EXHAUSTED', 'system', true);
  }
}

// Utility types
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Performance monitoring types
export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: MemoryUsage;
  modelLoadTime?: number;
  preprocessingTime?: number;
  inferenceTime?: number;
  postprocessingTime?: number;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  modelSize?: number;
  cacheSize?: number;
}

// Cache types
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  entries: number;
  lastCleanup: Date;
}

// Event types
export type NLPEventType =
  | 'model_loaded'
  | 'model_unloaded'
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'cache_hit'
  | 'cache_miss'
  | 'batch_started'
  | 'batch_completed'
  | 'memory_warning'
  | 'performance_warning';

export interface NLPEvent {
  type: NLPEventType;
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}

export type NLPEventListener = (event: NLPEvent) => void;
