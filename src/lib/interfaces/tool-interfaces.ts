/**
 * Shared interfaces for tool components
 */

import type { ProcessingStatus, ToolResult } from '@/types/components';

// Base tool interface
export interface BaseTool<TInput = any, TOutput = any> {
  /** Tool unique identifier */
  id: string;
  /** Tool display name */
  name: string;
  /** Tool description */
  description: string;
  /** Process input data and return result */
  process(input: TInput): Promise<ToolResult<TOutput>>;
  /** Validate input data */
  validate?(input: TInput): boolean | string | ValidationResult;
  /** Get tool configuration */
  getConfig(): ToolConfig;
  /** Set tool configuration */
  setConfig(config: Partial<ToolConfig>): void;
}

// Tool configuration interface
export interface ToolConfig {
  /** Processing options */
  options?: Record<string, any>;
  /** UI preferences */
  ui?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    compact?: boolean;
  };
  /** Performance settings */
  performance?: {
    timeout?: number;
    maxRetries?: number;
    batchSize?: number;
  };
}

// File processing tool interface
export interface FileProcessingTool extends BaseTool<File, any> {
  /** Supported file types */
  supportedTypes: string[];
  /** Maximum file size */
  maxFileSize: number;
  /** Processing options */
  options: FileProcessingOptions;
}

// File processing options
export interface FileProcessingOptions {
  /** Preserve metadata */
  preserveMetadata?: boolean;
  /** Output format */
  outputFormat?: string;
  /** Quality setting (for images) */
  quality?: number;
  /** Custom processing parameters */
  custom?: Record<string, any>;
}

// Batch processing tool interface
export interface BatchProcessingTool<T = any> extends BaseTool<T[], T[]> {
  /** Process items in batch */
  processBatch(items: T[], options?: BatchProcessingOptions<T>): Promise<ToolResult<T[]>>;
  /** Get batch processing status */
  getBatchStatus(): ProcessingStatus;
  /** Cancel batch processing */
  cancelBatch(): void;
}

// Batch processing options
export interface BatchProcessingOptions<T = any> {
  /** Number of items to process concurrently */
  concurrency?: number;
  /** Continue processing on error */
  continueOnError?: boolean;
  /** Progress callback */
  onProgress?: (progress: number, current: T, results: T[]) => void;
}

// Real-time processing tool interface
export interface RealTimeTool<T = any, R = any> extends BaseTool<T, R> {
  /** Start real-time processing */
  start(input: T): void;
  /** Stop real-time processing */
  stop(): void;
  /** Subscribe to real-time updates */
  subscribe(callback: (result: R) => void): () => void;
  /** Get current processing status */
  getStatus(): ProcessingStatus;
}

// Converter tool interface
export interface ConverterTool<TInput = any, TOutput = any> extends BaseTool<TInput, TOutput> {
  /** Supported input formats */
  inputFormats: string[];
  /** Supported output formats */
  outputFormats: string[];
  /** Convert between formats */
  convert(input: TInput, fromFormat: string, toFormat: string): Promise<ToolResult<TOutput>>;
  /** Detect input format */
  detectFormat(input: TInput): string | null;
}

// Validator tool interface
export interface ValidatorTool<T = any> extends BaseTool<T, ValidationResult> {
  /** Validate data against schema or rules */
  validate(input: T, rules?: ValidationRule[]): ValidationResult;
  /** Get validation rules */
  getRules(): ValidationRule[];
  /** Set validation rules */
  setRules(rules: ValidationRule[]): void;
  /** Add validation rule */
  addRule(rule: ValidationRule): void;
  /** Remove validation rule */
  removeRule(ruleName: string): void;
}

// Validation result interface
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
  /** Validation score (0-100) */
  score?: number;
  /** Detailed validation report */
  report?: ValidationReport;
}

// Validation error interface
export interface ValidationError {
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Path to the invalid field */
  path?: string;
  /** Error severity */
  severity: 'error' | 'warning' | 'info';
  /** Suggested fix */
  suggestion?: string;
}

// Validation rule interface
export interface ValidationRule {
  /** Rule name */
  name: string;
  /** Rule type */
  type: 'required' | 'format' | 'length' | 'range' | 'pattern' | 'custom';
  /** Rule parameters */
  params?: Record<string, any>;
  /** Validation function */
  validate: (value: any) => boolean | string;
  /** Error message */
  message: string;
  /** Rule priority */
  priority?: number;
}

// Validation report interface
export interface ValidationReport {
  /** Total items validated */
  totalItems: number;
  /** Number of valid items */
  validItems: number;
  /** Number of invalid items */
  invalidItems: number;
  /** Validation summary */
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  /** Detailed results by field */
  fieldResults: Record<string, ValidationResult>;
}

// Generator tool interface
export interface GeneratorTool<T = any> extends BaseTool<GeneratorInput, T> {
  /** Generate content from input */
  generate(input: GeneratorInput): Promise<ToolResult<T>>;
  /** Get available templates */
  getTemplates(): GeneratorTemplate[];
  /** Generate from template */
  generateFromTemplate(templateId: string, params: Record<string, any>): Promise<ToolResult<T>>;
}

// Generator input interface
export interface GeneratorInput {
  /** Generation parameters */
  params: Record<string, any>;
  /** Template to use */
  template?: string;
  /** Generation options */
  options?: {
    length?: number;
    quality?: number;
    format?: string;
  };
}

// Generator template interface
export interface GeneratorTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template category */
  category: string;
  /** Template parameters */
  parameters: GeneratorParameter[];
  /** Template content */
  content: string;
  /** Template example */
  example?: any;
}

// Generator parameter interface
export interface GeneratorParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Parameter description */
  description: string;
  /** Whether parameter is required */
  required: boolean;
  /** Default value */
  default?: any;
  /** Validation rules */
  validation?: ValidationRule[];
  /** Parameter options */
  options?: any[];
}

// Analyzer tool interface
export interface AnalyzerTool<T = any> extends BaseTool<T, AnalysisResult> {
  /** Analyze input data */
  analyze(input: T): Promise<ToolResult<AnalysisResult>>;
  /** Get analysis metrics */
  getMetrics(): AnalysisMetric[];
  /** Get analysis options */
  getAnalysisOptions(): AnalysisOption[];
  /** Set analysis options */
  setAnalysisOptions(options: AnalysisOption[]): void;
}

// Analysis result interface
export interface AnalysisResult {
  /** Analysis summary */
  summary: AnalysisSummary;
  /** Detailed metrics */
  metrics: Record<string, any>;
  /** Insights and recommendations */
  insights: AnalysisInsight[];
  /** Raw analysis data */
  data?: any;
}

// Analysis summary interface
export interface AnalysisSummary {
  /** Overall score (0-100) */
  score: number;
  /** Analysis status */
  status: 'success' | 'warning' | 'error';
  /** Key findings */
  findings: string[];
  /** Recommendations */
  recommendations: string[];
}

// Analysis metric interface
export interface AnalysisMetric {
  /** Metric name */
  name: string;
  /** Metric value */
  value: any;
  /** Metric type */
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  /** Metric unit */
  unit?: string;
  /** Metric description */
  description: string;
  /** Whether metric is good/bad */
  status?: 'good' | 'warning' | 'error';
}

// Analysis option interface
export interface AnalysisOption {
  /** Option name */
  name: string;
  /** Option value */
  value: any;
  /** Option type */
  type: 'boolean' | 'select' | 'range' | 'input';
  /** Option description */
  description: string;
  /** Available options (for select type) */
  options?: { label: string; value: any }[];
}

// Analysis insight interface
export interface AnalysisInsight {
  /** Insight type */
  type: 'optimization' | 'warning' | 'error' | 'info';
  /** Insight title */
  title: string;
  /** Insight description */
  description: string;
  /** Insight severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Suggested actions */
  actions?: string[];
  /** Related data */
  data?: any;
}

// Transformer tool interface
export interface TransformerTool<TInput = any, TOutput = any> extends BaseTool<TInput, TOutput> {
  /** Transform input data */
  transform(input: TInput, rules?: TransformRule[]): Promise<ToolResult<TOutput>>;
  /** Get transformation rules */
  getRules(): TransformRule[];
  /** Set transformation rules */
  setRules(rules: TransformRule[]): void;
  /** Add transformation rule */
  addRule(rule: TransformRule): void;
  /** Remove transformation rule */
  removeRule(ruleName: string): void;
}

// Transform rule interface
export interface TransformRule {
  /** Rule name */
  name: string;
  /** Rule type */
  type: 'map' | 'filter' | 'reduce' | 'format' | 'custom';
  /** Rule parameters */
  params: Record<string, any>;
  /** Transformation function */
  transform: (value: any) => any;
  /** Rule condition */
  condition?: (value: any) => boolean;
  /** Rule priority */
  priority?: number;
}

// Tool registry interface
export interface ToolRegistry {
  /** Register a tool */
  register(tool: BaseTool): void;
  /** Unregister a tool */
  unregister(toolId: string): void;
  /** Get tool by ID */
  get(toolId: string): BaseTool | undefined;
  /** Get all tools */
  getAll(): BaseTool[];
  /** Search tools */
  search(query: string): BaseTool[];
  /** Get tools by category */
  getByCategory(category: string): BaseTool[];
  /** Get tools by type */
  getByType(type: string): BaseTool[];
}

// Tool factory interface
export interface ToolFactory {
  /** Create a new tool instance */
  create<T extends BaseTool>(type: string, config?: ToolConfig): T;
  /** Register a tool type */
  registerType(type: string, toolConstructor: new (config?: ToolConfig) => BaseTool): void;
  /** Get available tool types */
  getAvailableTypes(): string[];
}
