/**
 * Infrastructure Types - Types for NLP infrastructure and system operations
 */

import {
  type NLPEvent,
  type NLPEventListener,
  type NLPEventType,
  type Task,
  TaskStatus,
} from './core';

// Model Management Types
export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type: ModelType;
  size: number;
  url?: string;
  local: boolean;
  status: ModelStatus;
  capabilities: ModelCapabilities;
  dependencies: string[];
  metadata: ModelMetadata;
}

export type ModelType =
  | 'sentiment'
  | 'ner'
  | 'classification'
  | 'translation'
  | 'summarization'
  | 'generation'
  | 'language_detection'
  | 'embeddings'
  | 'tokenization'
  | 'preprocessing';

export type ModelStatus = 'unloaded' | 'loading' | 'loaded' | 'error' | 'updating' | 'unavailable';

export interface ModelCapabilities {
  languages: string[];
  domains: string[];
  features: string[];
  inputs: ModelInput[];
  outputs: ModelOutput[];
  performance: ModelPerformance;
}

export interface ModelInput {
  type: 'text' | 'audio' | 'image' | 'structured';
  format: string[];
  constraints: InputConstraints;
}

export interface InputConstraints {
  minLength?: number;
  maxLength?: number;
  maxTokens?: number;
  encoding?: string[];
  language?: string[];
}

export interface ModelOutput {
  type: string;
  format: string[];
  confidence: boolean;
  alternatives: boolean;
  metadata: string[];
}

export interface ModelPerformance {
  accuracy?: number;
  speed: number; // ms per inference
  memoryUsage: number; // MB
  throughput: number; // requests per second
  latency: number; // ms
  quality?: number;
}

export interface ModelMetadata {
  description: string;
  author: string;
  license: string;
  created: Date;
  updated: Date;
  documentation?: string;
  examples?: string[];
  citations?: string[];
  trainingData?: TrainingDataInfo;
}

export interface TrainingDataInfo {
  dataset: string;
  size: number;
  languages: string[];
  domains: string[];
  quality: string;
  lastUpdated: Date;
}

// Performance Monitoring Types
export interface SystemPerformanceMetrics {
  timestamp: Date;
  operation: string;
  tool: string;
  duration: number;
  memoryUsage: MemoryMetrics;
  cpuUsage: number;
  modelMetrics?: ModelPerformanceMetrics;
  networkMetrics?: NetworkMetrics;
}

export interface MemoryMetrics {
  used: number; // MB
  total: number; // MB
  percentage: number;
  heapUsed: number; // MB
  heapTotal: number; // MB
  external: number; // MB
  modelCache: number; // MB
}

export interface ModelPerformanceMetrics {
  loadTime: number; // ms
  inferenceTime: number; // ms
  batchSize: number;
  throughput: number;
  accuracy?: number;
  cacheHitRate: number;
}

export interface NetworkMetrics {
  requestsCount: number;
  bytesTransferred: number;
  errorsCount: number;
  averageLatency: number;
  bandwidth: number;
}

export interface PerformanceAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  metrics: SystemPerformanceMetrics;
  threshold: number;
  suggestion?: string;
}

export type AlertType =
  | 'memory_usage'
  | 'cpu_usage'
  | 'response_time'
  | 'error_rate'
  | 'cache_miss'
  | 'model_load_failure'
  | 'timeout'
  | 'quota_exceeded';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

// Task Management Types
export interface TaskManager {
  tasks: Map<string, Task>;
  queue: Task[];
  processing: Task[];
  completed: Task[];
  failed: Task[];
  limits: TaskLimits;
  statistics: TaskStatistics;
}

export interface TaskLimits {
  concurrentTasks: number;
  maxQueueSize: number;
  taskTimeout: number;
  maxRetries: number;
  memoryLimit: number;
}

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  successRate: number;
  queueLength: number;
  throughput: number;
}

// Cache Management Types
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  entries: number;
  lastAccess: Date;
  lastCleanup: Date;
  evictions: number;
}

export interface CacheEntry {
  key: string;
  data: any;
  size: number;
  timestamp: Date;
  lastAccessed: Date;
  accessCount: number;
  ttl?: number;
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  maxSize: number;
  maxEntries: number;
  ttl: number;
  cleanupInterval: number;
  strategy: CacheStrategy;
  compression: boolean;
  encryption: boolean;
}

export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'custom' | 'ttl' | 'size';

// Resource Management Types
export interface ResourceUsage {
  memory: ResourceUsageDetail;
  cpu: ResourceUsageDetail;
  storage: ResourceUsageDetail;
  network: ResourceUsageDetail;
  quota: ResourceQuota;
}

export interface ResourceUsageDetail {
  used: number;
  available: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  peak: number;
  average: number;
}

export interface ResourceQuota {
  memory: number; // MB
  cpu: number; // percentage
  storage: number; // MB
  requests: number; // per hour
  models: number; // max loaded models
  bandwidth: number; // MB per hour
}

export interface ResourceAlert {
  resource: ResourceType;
  usage: number;
  limit: number;
  percentage: number;
  severity: AlertSeverity;
  message: string;
  recommendation: string;
}

export type ResourceType =
  | 'memory'
  | 'cpu'
  | 'storage'
  | 'network'
  | 'models'
  | 'requests'
  | 'bandwidth';

// Error Handling Types
export interface ErrorInfo {
  code: string;
  message: string;
  tool?: string;
  operation?: string;
  timestamp: Date;
  severity: ErrorSeverity;
  recoverable: boolean;
  context?: ErrorContext;
  suggestions?: string[];
}

export interface ErrorContext {
  input?: any;
  configuration?: Record<string, any>;
  environment?: Record<string, any>;
  stack?: string;
  cause?: Error;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorReport {
  error: ErrorInfo;
  frequency: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedUsers: number;
  resolved: boolean;
  resolution?: string;
}

// Configuration Types
export interface NLPSystemConfig {
  performance: PerformanceConfig;
  cache: CacheConfig;
  resources: ResourceConfig;
  models: ModelManagementConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export interface PerformanceConfig {
  maxConcurrentRequests: number;
  requestTimeout: number;
  modelLoadTimeout: number;
  enableProfiling: boolean;
  performanceAlerts: boolean;
  memoryOptimization: boolean;
}

export interface ResourceConfig {
  memoryLimit: number;
  cpuLimit: number;
  storageQuota: number;
  maxLoadedModels: number;
  autoCleanup: boolean;
  garbageCollection: boolean;
}

export interface ModelManagementConfig {
  autoUpdate: boolean;
  cacheStrategy: CacheStrategy;
  preloadModels: string[];
  compressionEnabled: boolean;
  lazyLoading: boolean;
  fallbackEnabled: boolean;
}

export interface LoggingConfig {
  level: LogLevel;
  enablePerformanceLogs: boolean;
  enableErrorLogs: boolean;
  enableDebugLogs: boolean;
  logRetention: number;
  format: 'json' | 'text';
  destination: LogDestination[];
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogDestination {
  type: 'console' | 'file' | 'remote';
  config: Record<string, any>;
}

export interface SecurityConfig {
  enableInputSanitization: boolean;
  maxInputSize: number;
  allowedDomains: string[];
  enableCORS: boolean;
  enableCSRF: boolean;
  encryptionEnabled: boolean;
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  enableProfiling: boolean;
  metricsInterval: number;
  healthCheckInterval: number;
  alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
  errorRate: number;
  cacheMissRate: number;
}

// Event System Types
export interface EventEmitter {
  listeners: Map<NLPEventType, NLPEventListener[]>;
  emit(event: NLPEvent): void;
  on(type: NLPEventType, listener: NLPEventListener): void;
  off(type: NLPEventType, listener: NLPEventListener): void;
  once(type: NLPEventType, listener: NLPEventListener): void;
  removeAllListeners(type?: NLPEventType): void;
}

export interface EventQueue {
  events: NLPEvent[];
  maxSize: number;
  processing: boolean;
  add(event: NLPEvent): void;
  process(): void;
  clear(): void;
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: HealthCheckResult[];
  uptime: number;
  version: string;
  environment: string;
}

export interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  checks: HealthCheckDefinition[];
}

export interface HealthCheckDefinition {
  name: string;
  type: 'dependency' | 'resource' | 'performance' | 'custom';
  timeout: number;
  critical: boolean;
  checker: () => Promise<HealthCheckResult>;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  requestId?: string;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: Date;
  processingTime: number;
  version: string;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: ApiParameter[];
  requestBody?: ApiSchema;
  responses: ApiResponse[];
  authRequired: boolean;
  rateLimit?: RateLimitInfo;
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
  validation?: ApiValidationRule[];
}

export interface ApiValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface ApiSchema {
  type: string;
  properties: Record<string, ApiSchema>;
  required?: string[];
  items?: ApiSchema;
  additionalProperties?: boolean | ApiSchema;
}

// Infrastructure Configuration Types
export interface SystemDiagnostics {
  system: SystemInfo;
  performance: PerformanceDiagnostics;
  resources: ResourceDiagnostics;
  models: ModelDiagnostics;
  errors: ErrorDiagnostics;
  recommendations: DiagnosticRecommendation[];
}

export interface SystemInfo {
  platform: string;
  architecture: string;
  nodeVersion: string;
  memory: SystemMemory;
  cpu: SystemCPU;
  storage: SystemStorage;
  network: SystemNetwork;
}

export interface SystemMemory {
  total: number;
  free: number;
  used: number;
  percentage: number;
}

export interface SystemCPU {
  model: string;
  cores: number;
  speed: number;
  usage: number;
  loadAverage: number[];
}

export interface SystemStorage {
  total: number;
  free: number;
  used: number;
  percentage: number;
}

export interface SystemNetwork {
  interfaces: NetworkInterface[];
  connections: number;
  bandwidth: number;
}

export interface NetworkInterface {
  name: string;
  type: string;
  speed: number;
  status: string;
}

export interface PerformanceDiagnostics {
  responseTime: ResponseTimeStats;
  throughput: ThroughputStats;
  errorRate: ErrorRateStats;
  bottlenecks: PerformanceBottleneck[];
}

export interface ResponseTimeStats {
  average: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface ThroughputStats {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
}

export interface ErrorRateStats {
  current: number;
  average24h: number;
  average7d: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PerformanceBottleneck {
  component: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  recommendation: string;
}

export interface ResourceDiagnostics {
  memory: ResourceHealth;
  cpu: ResourceHealth;
  storage: ResourceHealth;
  network: ResourceHealth;
  models: ResourceHealth;
}

export interface ResourceHealth {
  status: 'healthy' | 'warning' | 'critical';
  usage: number;
  limit: number;
  percentage: number;
  trend: string;
  alerts: string[];
}

export interface ModelDiagnostics {
  loadedModels: ModelHealth[];
  cache: CacheHealth;
  performance: ModelPerformanceDiagnostics;
}

export interface ModelHealth {
  id: string;
  status: string;
  loadTime: number;
  memoryUsage: number;
  accuracy?: number;
  lastUsed: Date;
  issues: string[];
}

export interface CacheHealth {
  hitRate: number;
  size: number;
  maxSize: number;
  entries: number;
  lastCleanup: Date;
  issues: string[];
}

export interface ModelPerformanceDiagnostics {
  averageInferenceTime: number;
  throughput: number;
  accuracy?: number;
  latency: LatencyStats;
  errors: ModelErrorStats;
}

export interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
  average: number;
  max: number;
}

export interface ModelErrorStats {
  rate: number;
  types: Record<string, number>;
  recentErrors: string[];
}

export interface ErrorDiagnostics {
  totalErrors: number;
  errorRate: number;
  commonErrors: CommonError[];
  trends: ErrorTrend[];
}

export interface CommonError {
  code: string;
  message: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedTools: string[];
}

export interface ErrorTrend {
  period: string;
  count: number;
  change: number;
  percentageChange: number;
}

export interface DiagnosticRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  impact: string;
  effort: string;
  actions: string[];
  expectedImprovement: string;
}
