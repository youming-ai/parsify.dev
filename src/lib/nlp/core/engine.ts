/**
 * NLP Engine - Core service for unified NLP processing
 * Provides the main orchestration layer for all NLP operations
 */

import { lazyLoader } from '../infrastructure/lazy-loader';
import { memoryManager } from '../infrastructure/memory-manager';
import { modelCache } from '../infrastructure/model-cache';
import { performanceMonitor } from '../infrastructure/performance-monitor';
import {
  NLPAnalysis,
  type NLPConfig,
  NLPEvent,
  type NLPEventListener,
  type NLPResult,
  type ProcessingOperation,
  type ProcessingPipeline,
  TaskStatus,
} from '../types';

export interface EngineConfig extends NLPConfig {
  enableCaching: boolean;
  enableBatching: boolean;
  enablePipelining: boolean;
  maxConcurrentOperations: number;
  defaultTimeout: number;
  enableProfiling: boolean;
  memoryOptimization: boolean;
}

export interface ProcessingRequest {
  id: string;
  text: string;
  operations: ProcessingOperation[];
  config: Partial<NLPConfig>;
  pipeline?: ProcessingPipeline;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface ProcessingResult {
  id: string;
  text: string;
  operations: OperationResult[];
  pipeline?: ProcessingPipeline;
  performance: PerformanceMetrics;
  metadata: Record<string, any>;
  timestamp: Date;
  success: boolean;
  error?: Error;
}

export interface ProcessingStatistics {
  totalProcessed: number;
  successful: number;
  failed: number;
  averageProcessingTime: number;
  mostUsedOperations: Record<string, number>;
  errorRate: number;
  throughput: number;
}

export interface PerformanceMetrics {
  totalTime: number;
  preprocessingTime: number;
  operationTimes: Record<string, number>;
  postprocessingTime: number;
  memoryUsage: {
    peak: number;
    average: number;
    delta: number;
  };
  modelLoadTime?: number;
  cacheHits: number;
  cacheMisses: number;
}

export class NLPEngine {
  private config: EngineConfig;
  private isInitialized = false;
  private operationHandlers: Map<string, OperationHandler> = new Map();
  private eventListeners: Map<string, NLPEventListener[]> = new Map();
  private activeRequests: Map<string, ProcessingRequest> = new Map();
  private processingQueue: ProcessingRequest[] = [];
  private isProcessing = false;
  private statistics: ProcessingStatistics;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      enableCaching: true,
      enableBatching: true,
      enablePipelining: true,
      maxConcurrentOperations: 10,
      defaultTimeout: 30000,
      enableProfiling: true,
      memoryOptimization: true,
      timeout: 10000,
      confidence: 0.8,
      cacheEnabled: true,
      preprocessing: {
        normalizeText: true,
        removeStopwords: false,
        stemWords: false,
        lowercaseText: true,
        removePunctuation: false,
      },
      ...config,
    };

    this.statistics = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      averageProcessingTime: 0,
      mostUsedOperations: {},
      errorRate: 0,
      throughput: 0,
    };

    this.setupDefaultHandlers();
  }

  /**
   * Initialize the NLP engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.emitEvent('engine_initialization_started', {});

      // Start monitoring services
      if (this.config.enableProfiling) {
        performanceMonitor.startMonitoring();
      }

      memoryManager.startMonitoring();

      // Preload critical models
      if (this.config.enableCaching) {
        await this.preloadCriticalModels();
      }

      // Initialize operation handlers
      await this.initializeHandlers();

      this.isInitialized = true;
      this.emitEvent('engine_initialized', {});

      console.log('NLP Engine initialized successfully');
    } catch (error) {
      this.emitEvent('engine_initialization_failed', { error });
      throw new Error(`Failed to initialize NLP Engine: ${error}`);
    }
  }

  /**
   * Process a single text analysis request
   */
  async process(request: ProcessingRequest): Promise<ProcessingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      this.emitEvent('processing_started', { requestId: request.id });

      // Validate request
      this.validateRequest(request);

      // Add to active requests
      this.activeRequests.set(request.id, request);

      // Memory check
      if (this.config.memoryOptimization) {
        await this.checkMemoryAvailability(request);
      }

      // Process the request
      const result = await this.executeProcessing(request);

      // Update statistics
      this.updateStatistics(result);

      // Cleanup if needed
      if (this.config.memoryOptimization) {
        await this.performMemoryCleanup();
      }

      const totalTime = performance.now() - startTime;
      result.performance.totalTime = totalTime;

      this.emitEvent('processing_completed', {
        requestId: request.id,
        success: result.success,
        totalTime,
      });

      return result;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      const errorResult: ProcessingResult = {
        id: request.id,
        text: request.text,
        operations: [],
        performance: {
          totalTime,
          preprocessingTime: 0,
          operationTimes: {},
          postprocessingTime: 0,
          memoryUsage: { peak: 0, average: 0, delta: 0 },
          cacheHits: 0,
          cacheMisses: 0,
        },
        metadata: {},
        timestamp: new Date(),
        success: false,
        error: error as Error,
      };

      this.statistics.failed++;
      this.statistics.errorRate = this.statistics.failed / this.statistics.totalProcessed;

      this.emitEvent('processing_failed', {
        requestId: request.id,
        error,
        totalTime,
      });

      return errorResult;
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Process multiple requests (batch processing)
   */
  async processBatch(requests: ProcessingRequest[]): Promise<ProcessingResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config.enableBatching) {
      // Process sequentially if batching is disabled
      const results: ProcessingResult[] = [];
      for (const request of requests) {
        const result = await this.process(request);
        results.push(result);
      }
      return results;
    }

    // Process in parallel with concurrency limits
    const batchSize = Math.min(requests.length, this.config.maxConcurrentOperations);
    const results: ProcessingResult[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map((request) => this.process(request));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get engine statistics
   */
  getStatistics(): ProcessingStatistics {
    return { ...this.statistics };
  }

  /**
   * Get current engine status
   */
  getStatus(): {
    initialized: boolean;
    processing: boolean;
    activeRequests: number;
    queuedRequests: number;
    memoryUsage: any;
    performance: any;
  } {
    return {
      initialized: this.isInitialized,
      processing: this.isProcessing,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.processingQueue.length,
      memoryUsage: memoryManager.getCurrentMemoryUsage(),
      performance: performanceMonitor.getCurrentMetrics(),
    };
  }

  /**
   * Register an operation handler
   */
  registerHandler(operationType: string, handler: OperationHandler): void {
    this.operationHandlers.set(operationType, handler);
  }

  /**
   * Unregister an operation handler
   */
  unregisterHandler(operationType: string): void {
    this.operationHandlers.delete(operationType);
  }

  /**
   * Cancel a processing request
   */
  async cancel(requestId: string): Promise<boolean> {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      return false;
    }

    this.emitEvent('request_cancelled', { requestId });

    // Remove from active requests
    this.activeRequests.delete(requestId);

    // Remove from queue if present
    const queueIndex = this.processingQueue.findIndex((r) => r.id === requestId);
    if (queueIndex !== -1) {
      this.processingQueue.splice(queueIndex, 1);
    }

    return true;
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emitEvent('config_updated', { config: this.config });
  }

  /**
   * Shutdown the engine
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    this.emitEvent('engine_shutdown_started', {});

    // Cancel all active requests
    for (const requestId of this.activeRequests.keys()) {
      await this.cancel(requestId);
    }

    // Clear processing queue
    this.processingQueue = [];

    // Stop monitoring
    performanceMonitor.stopMonitoring();
    memoryManager.stopMonitoring();

    // Unload models
    await this.unloadAllModels();

    this.isInitialized = false;
    this.emitEvent('engine_shutdown_completed', {});

    console.log('NLP Engine shutdown completed');
  }

  /**
   * Event handling
   */
  on(event: string, listener: NLPEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  off(event: string, listener: NLPEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Private helper methods
   */
  private async executeProcessing(request: ProcessingRequest): Promise<ProcessingResult> {
    const startTime = performance.now();
    const performanceMetrics: PerformanceMetrics = {
      totalTime: 0,
      preprocessingTime: 0,
      operationTimes: {},
      postprocessingTime: 0,
      memoryUsage: { peak: 0, average: 0, delta: 0 },
      cacheHits: 0,
      cacheMisses: 0,
    };

    try {
      // Preprocessing
      const preprocessStart = performance.now();
      const preprocessedText = await this.preprocessText(request.text, request.config);
      performanceMetrics.preprocessingTime = performance.now() - preprocessStart;

      // Execute operations
      const operations: OperationResult[] = [];
      let cacheHits = 0;
      let cacheMisses = 0;

      for (const operation of request.operations) {
        if (!operation.enabled) continue;

        const operationStart = performance.now();

        // Check cache first
        const cacheKey = this.generateCacheKey(preprocessedText, operation);
        let cachedResult = null;

        if (this.config.enableCaching) {
          cachedResult = await modelCache.get(cacheKey);
          if (cachedResult) {
            cacheHits++;
          } else {
            cacheMisses++;
          }
        }

        let result;
        if (cachedResult) {
          result = cachedResult;
        } else {
          result = await this.executeOperation(preprocessedText, operation, request.config);

          // Cache the result
          if (this.config.enableCaching && result) {
            await modelCache.set(cacheKey, '', new ArrayBuffer(0), '1.0.0');
          }
        }

        const operationTime = performance.now() - operationStart;
        performanceMetrics.operationTimes[operation.type] = operationTime;

        operations.push({
          type: operation.type,
          tool: operation.tool,
          config: operation.config,
          result,
          success: true,
          processingTime: operationTime,
        });
      }

      performanceMetrics.cacheHits = cacheHits;
      performanceMetrics.cacheMisses = cacheMisses;

      // Postprocessing
      const postprocessStart = performance.now();
      const finalResult = await this.postprocessOperations(operations, request.config);
      performanceMetrics.postprocessingTime = performance.now() - postprocessStart;

      // Memory usage tracking
      const currentMemory = memoryManager.getCurrentMemoryUsage();
      performanceMetrics.memoryUsage = {
        peak: currentMemory.heap.used,
        average: currentMemory.heap.used, // Would need tracking over time
        delta: 0, // Would need baseline tracking
      };

      return {
        id: request.id,
        text: request.text,
        operations: finalResult,
        pipeline: request.pipeline,
        performance: performanceMetrics,
        metadata: request.metadata || {},
        timestamp: new Date(),
        success: true,
      };
    } catch (error) {
      performanceMetrics.totalTime = performance.now() - startTime;
      throw error;
    }
  }

  private async preprocessText(text: string, config: Partial<NLPConfig>): Promise<string> {
    const preprocessing = config.preprocessing || this.config.preprocessing || {};

    let processed = text;

    if (preprocessing.lowercaseText) {
      processed = processed.toLowerCase();
    }

    if (preprocessing.normalizeText) {
      // Unicode normalization
      processed = processed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    if (preprocessing.removeStopwords) {
      // Basic stopword removal (would be more sophisticated in real implementation)
      const stopWords = new Set([
        'the',
        'a',
        'an',
        'and',
        'or',
        'but',
        'in',
        'on',
        'at',
        'to',
        'for',
        'of',
        'with',
        'by',
      ]);
      processed = processed
        .split(/\s+/)
        .filter((word) => !stopWords.has(word))
        .join(' ');
    }

    if (preprocessing.stemWords) {
      // Basic stemming (would use proper stemming library)
      processed = processed.replace(/\b\w+(?=ing|ed|er|est)\w*\b/g, (match) => match.slice(0, -3));
    }

    if (preprocessing.removePunctuation) {
      processed = processed.replace(/[^\w\s]/g, '');
    }

    return processed.trim();
  }

  private async executeOperation(
    text: string,
    operation: ProcessingOperation,
    config: Partial<NLPConfig>
  ): Promise<any> {
    const handler = this.operationHandlers.get(operation.type);
    if (!handler) {
      throw new Error(`No handler registered for operation type: ${operation.type}`);
    }

    return await handler.handle(text, operation.config || {}, config);
  }

  private async postprocessOperations(
    operations: OperationResult[],
    _config: Partial<NLPConfig>
  ): Promise<OperationResult[]> {
    // Post-processing step - could include result aggregation, formatting, etc.
    return operations;
  }

  private validateRequest(request: ProcessingRequest): void {
    if (!request.id) {
      throw new Error('Request ID is required');
    }

    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Request text is required and cannot be empty');
    }

    if (!request.operations || request.operations.length === 0) {
      throw new Error('At least one operation must be specified');
    }

    const enabledOperations = request.operations.filter((op) => op.enabled);
    if (enabledOperations.length === 0) {
      throw new Error('At least one operation must be enabled');
    }
  }

  private async checkMemoryAvailability(request: ProcessingRequest): Promise<void> {
    const memoryEstimate = this.estimateMemoryRequirement(request);
    if (!memoryManager.hasEnoughMemory('nlp_processing', memoryEstimate.totalMemory)) {
      // Try to free up memory
      const _freed = await memoryManager.optimizeMemoryUsage();

      if (!memoryManager.hasEnoughMemory('nlp_processing', memoryEstimate.totalMemory)) {
        throw new Error(
          `Insufficient memory for processing. Required: ${memoryEstimate.totalMemory}MB, Available: ${memoryManager.getCurrentMemoryUsage().heap.used}MB`
        );
      }
    }
  }

  private estimateMemoryRequirement(request: ProcessingRequest): {
    totalMemory: number;
  } {
    // Basic memory estimation
    const textLength = request.text.length;
    const operationCount = request.operations.filter((op) => op.enabled).length;

    return {
      totalMemory: Math.max(10, textLength * 0.001 + operationCount * 5),
    };
  }

  private async performMemoryCleanup(): Promise<void> {
    const stats = memoryManager.getMemoryStatistics();
    const memoryUsagePercentage = (stats.current.heap.used / stats.current.heap.total) * 100;

    if (memoryUsagePercentage > 80) {
      await memoryManager.performCleanup('medium');
    }
  }

  private updateStatistics(result: ProcessingResult): void {
    this.statistics.totalProcessed++;

    if (result.success) {
      this.statistics.successful++;
    } else {
      this.statistics.failed++;
    }

    // Update average processing time
    const totalTime =
      this.statistics.totalProcessed * this.statistics.averageProcessingTime +
      result.performance.totalTime;
    this.statistics.averageProcessingTime = totalTime / this.statistics.totalProcessed;

    // Update operation usage statistics
    result.operations.forEach((op) => {
      this.statistics.mostUsedOperations[op.type] =
        (this.statistics.mostUsedOperations[op.type] || 0) + 1;
    });

    // Update error rate
    this.statistics.errorRate = this.statistics.failed / this.statistics.totalProcessed;

    // Update throughput (operations per second)
    const _now = Date.now();
    // This would need proper time window tracking
  }

  private generateCacheKey(text: string, operation: ProcessingOperation): string {
    const hash = this.simpleHash(
      text + operation.type + operation.tool + JSON.stringify(operation.config || {})
    );
    return `${operation.type}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private setupDefaultHandlers(): void {
    // Handlers would be registered here
    // For now, we'll register empty handlers as placeholders
  }

  private async initializeHandlers(): Promise<void> {
    // Initialize all registered handlers
    for (const [_operationType, handler] of this.operationHandlers) {
      if (handler.initialize) {
        await handler.initialize();
      }
    }
  }

  private async preloadCriticalModels(): Promise<void> {
    // Preload critical models based on usage patterns
    const criticalModels = ['sentiment_model', 'language_detector', 'basic_entities'];

    for (const modelId of criticalModels) {
      try {
        await lazyLoader.load(modelId, { priority: 'high' });
      } catch (error) {
        console.warn(`Failed to preload critical model ${modelId}:`, error);
      }
    }
  }

  private async unloadAllModels(): Promise<void> {
    // Unload all non-critical models
    const allItems = lazyLoader.getItems('model', 'loaded');

    for (const item of allItems) {
      if (!item.persistent) {
        await lazyLoader.unload(item.id);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener({
          type: event as any,
          timestamp: new Date(),
          data,
        });
      } catch (error) {
        console.error(`Error in NLP engine event listener for ${event}:`, error);
      }
    });
  }
}

// Supporting interfaces
export interface OperationHandler {
  handle(text: string, config: Record<string, any>, globalConfig: Partial<NLPConfig>): Promise<any>;
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
}

export interface OperationResult {
  type: string;
  tool: string;
  config?: Record<string, any>;
  result: any;
  success: boolean;
  processingTime: number;
  error?: Error;
}

export type { NLPResult };

// Singleton instance
export const nlpEngine = new NLPEngine();
