/**
 * Model Manager - Manages loading, caching, and lifecycle of TensorFlow.js models
 */

import * as tf from '@tensorflow/tfjs';
import {
  AlertSeverity,
  AlertType,
  type ModelInfo,
  ModelPerformanceMetrics,
  type ModelStatus,
  PerformanceAlert,
} from '../types';
import { type LoadPriority, lazyLoader } from './lazy-loader';
import { memoryManager } from './memory-manager';
import { modelCache } from './model-cache';
import { performanceMonitor } from './performance-monitor';

export interface ModelLoadOptions {
  timeout?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  force?: boolean;
  warmup?: boolean;
  quantized?: boolean;
  batchSize?: number;
  maxConcurrency?: number;
}

type ModelInstance = tf.LayersModel | tf.GraphModel;

export interface ModelRegistry {
  [modelId: string]: ModelDefinition;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  version: string;
  url: string;
  size: number;
  languages: string[];
  capabilities: ModelCapabilities;
  dependencies: string[];
  metadata: ModelMetadata;
  loadOptions?: ModelLoadOptions;
}

export type ModelType =
  | 'sentiment_analysis'
  | 'entity_recognition'
  | 'text_classification'
  | 'language_detection'
  | 'text_summarization'
  | 'text_generation'
  | 'translation'
  | 'grammar_checking'
  | 'text_embedding'
  | 'tokenization';

export interface ModelCapabilities {
  inputTypes: string[];
  outputTypes: string[];
  maxSequenceLength: number;
  batchSize: number[];
  quantization: boolean;
  streaming: boolean;
  multilingual: boolean;
  domains: string[];
}

export interface ModelMetadata {
  author: string;
  license: string;
  created: Date;
  updated: Date;
  documentation?: string;
  examples?: string[];
  citations?: string[];
  accuracy?: Record<string, number>;
  benchmarks?: Record<string, number>;
}

export interface ModelMetrics {
  loadTime: number;
  inferenceTime: number;
  memoryUsage: number;
  accuracy?: number;
  throughput: number;
  cacheHitRate: number;
  lastUsed: Date;
  usageCount: number;
}

export class ModelManager {
  private models: Map<string, LoadedModel> = new Map();
  private registry: ModelRegistry = {};
  private loadingPromises: Map<string, Promise<LoadedModel>> = new Map();
  private metrics: Map<string, ModelMetrics> = new Map();
  private config: ModelManagerConfig;
  private isInitialized = false;

  constructor(config: Partial<ModelManagerConfig> = {}) {
    this.config = {
      defaultTimeout: 30000,
      maxConcurrentLoads: 3,
      enableCache: true,
      enableWarmup: true,
      enableQuantization: false,
      memoryThreshold: 0.8,
      autoUnload: true,
      unloadIdleAfter: 300000, // 5 minutes
      enableMetrics: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Initialize the model manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load model registry
      await this.loadRegistry();

      // Initialize TensorFlow.js backend
      await tf.ready();

      // Set memory management
      if (this.config.enableQuantization) {
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      }

      this.isInitialized = true;
      console.log('Model Manager initialized');
    } catch (error) {
      throw new Error(`Failed to initialize Model Manager: ${error}`);
    }
  }

  /**
   * Register a model definition
   */
  registerModel(definition: ModelDefinition): void {
    this.registry[definition.id] = definition;

    // Register with lazy loader
    lazyLoader.registerItem({
      id: definition.id,
      type: 'model',
      name: definition.name,
      description: definition.description,
      version: definition.version,
      size: definition.size,
      dependencies: definition.dependencies,
      loadPriority: this.getLoadPriorityLabel(definition.type),
      lazy: true,
      persistent: false,
      timeout: this.config.defaultTimeout,
      retryAttempts: this.config.retryAttempts,
    });
  }

  /**
   * Load a model
   */
  async load(modelId: string, options: ModelLoadOptions = {}): Promise<ModelInstance> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const definition = this.registry[modelId];
    if (!definition) {
      throw new Error(`Model ${modelId} not found in registry`);
    }

    // Check if already loaded
    const loadedModel = this.models.get(modelId);
    if (loadedModel && !options.force) {
      this.updateUsageMetrics(modelId);
      return loadedModel.model;
    }

    // Check if currently loading
    if (this.loadingPromises.has(modelId)) {
      const loaded = await this.loadingPromises.get(modelId)!;
      return loaded.model;
    }

    // Load the model
    const loadPromise = this.performLoad(definition, options);
    this.loadingPromises.set(modelId, loadPromise);

    try {
      const loadedModel = await loadPromise;
      this.models.set(modelId, loadedModel);

      // Warm up the model if requested
      if (options.warmup !== false && this.config.enableWarmup) {
        await this.warmupModel(loadedModel);
      }

      // Record metrics
      performanceMonitor.recordModelLoad(modelId, loadedModel.loadTime, definition.size, true);

      return loadedModel.model;
    } catch (error) {
      // Record failed load
      performanceMonitor.recordModelLoad(modelId, 0, definition.size, false);
      throw error;
    } finally {
      this.loadingPromises.delete(modelId);
    }
  }

  /**
   * Unload a model
   */
  async unload(modelId: string, force = false): Promise<boolean> {
    const loadedModel = this.models.get(modelId);
    if (!loadedModel) {
      return false;
    }

    // Don't unload if recently used (unless forced)
    const metrics = this.metrics.get(modelId);
    if (
      !force &&
      metrics &&
      Date.now() - metrics.lastUsed.getTime() < this.config.unloadIdleAfter
    ) {
      return false;
    }

    try {
      // Dispose of the model
      loadedModel.model.dispose();
      this.models.delete(modelId);

      // Clean up metrics
      this.metrics.delete(modelId);

      console.log(`Model ${modelId} unloaded successfully`);
      return true;
    } catch (error) {
      console.warn(`Failed to unload model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Check if a model is loaded
   */
  isLoaded(modelId: string): boolean {
    return this.models.has(modelId);
  }

  /**
   * Get model information
   */
  getModelInfo(modelId: string): ModelInfo | null {
    const definition = this.registry[modelId];
    if (!definition) {
      return null;
    }

    const loadedModel = this.models.get(modelId);
    const metrics = this.metrics.get(modelId);

    const info = {
      id: definition.id,
      name: definition.name,
      version: definition.version,
      type: definition.type as import('../types').ModelType,
      size: definition.size,
      local: loadedModel !== undefined,
      status: this.getModelStatus(modelId),
      capabilities: definition.capabilities as any,
      dependencies: definition.dependencies,
      metadata: definition.metadata as any,
      loadTime: metrics?.loadTime || 0,
      accuracy: metrics?.accuracy,
      usageCount: metrics?.usageCount || 0,
    } as unknown as ModelInfo;

    return info;
  }

  /**
   * Get all registered models
   */
  getRegisteredModels(): ModelInfo[] {
    return Object.values(this.registry)
      .map((definition) => this.getModelInfo(definition.id)!)
      .filter(Boolean);
  }

  /**
   * Get loaded models
   */
  getLoadedModels(): ModelInfo[] {
    return Array.from(this.models.keys())
      .map((modelId) => this.getModelInfo(modelId)!)
      .filter(Boolean);
  }

  /**
   * Get model metrics
   */
  getModelMetrics(modelId: string): ModelMetrics | null {
    return this.metrics.get(modelId) || null;
  }

  /**
   * Get models by type
   */
  getModelsByType(type: ModelType): ModelInfo[] {
    return this.getRegisteredModels().filter((model) => model.type === type);
  }

  /**
   * Get models by language
   */
  getModelsByLanguage(language: string): ModelInfo[] {
    return this.getRegisteredModels().filter((model) =>
      model.capabilities.languages.includes(language)
    );
  }

  /**
   * Preload models based on usage patterns
   */
  async preloadCriticalModels(): Promise<void> {
    const criticalModels = Object.values(this.registry)
      .filter((model) => this.isCriticalModel(model))
      .sort((a, b) => this.getLoadPriority(b.type) - this.getLoadPriority(a.type))
      .slice(0, this.config.maxConcurrentLoads);

    const loadPromises = criticalModels.map((model) =>
      this.load(model.id, { priority: 'high', warmup: true }).catch((error) => {
        console.warn(`Failed to preload critical model ${model.id}:`, error);
        return null;
      })
    );

    await Promise.all(loadPromises);
  }

  /**
   * Perform memory cleanup
   */
  async cleanupMemory(): Promise<number> {
    const currentMemory = memoryManager.getCurrentMemoryUsage();
    const memoryThreshold = this.config.memoryThreshold * currentMemory.heap.total;

    if (currentMemory.heap.used < memoryThreshold) {
      return 0;
    }

    let freedMemory = 0;
    const modelsToUnload: string[] = [];

    // Find least recently used models
    const modelMetrics = Array.from(this.metrics.entries()).sort(
      ([, a], [, b]) => a.lastUsed.getTime() - b.lastUsed.getTime()
    );

    for (const [modelId, _metrics] of modelMetrics) {
      if (currentMemory.heap.used - freedMemory < memoryThreshold) {
        modelsToUnload.push(modelId);
      } else {
        break;
      }
    }

    // Unload models
    for (const modelId of modelsToUnload) {
      const modelInfo = this.getModelInfo(modelId);
      if (modelInfo && (await this.unload(modelId, true))) {
        freedMemory += modelInfo.size;
      }
    }

    return freedMemory;
  }

  /**
   * Run inference on a model
   */
  async inference<T>(
    modelId: string,
    input: tf.Tensor | tf.Tensor[],
    _options: {
      batchSize?: number;
      warmup?: boolean;
      profiling?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();

    try {
      // Ensure model is loaded
      await this.load(modelId);

      const loadedModel = this.models.get(modelId)!;
      if (!loadedModel) {
        throw new Error(`Model ${modelId} is not loaded`);
      }

      // Update usage metrics
      this.updateUsageMetrics(modelId);

      // Perform inference
      let result: T;

      if (Array.isArray(input)) {
        result = (loadedModel.model as any).predict(input) as T;
      } else {
        result = (loadedModel.model as any).predict(input) as T;
      }

      const inferenceTime = performance.now() - startTime;

      // Update metrics
      const metrics = this.metrics.get(modelId)!;
      metrics.inferenceTime =
        (metrics.inferenceTime * metrics.usageCount + inferenceTime) / (metrics.usageCount + 1);
      metrics.throughput = (metrics.throughput * metrics.usageCount + 1) / (metrics.usageCount + 1);
      metrics.lastUsed = new Date();

      return result;
    } catch (error) {
      throw new Error(`Inference failed for model ${modelId}: ${error}`);
    }
  }

  /**
   * Batch process multiple inputs
   */
  async batchInference<T>(
    modelId: string,
    inputs: tf.Tensor[],
    options: {
      batchSize?: number;
      concurrency?: number;
    } = {}
  ): Promise<T[]> {
    const batchSize = options.batchSize || 32;
    const concurrency = options.concurrency || 1;

    const results: T[] = [];

    for (let i = 0; i < inputs.length; i += batchSize * concurrency) {
      const batchPromises: Promise<T[]>[] = [];

      for (let j = 0; j < concurrency && i + j * batchSize < inputs.length; j++) {
        const startIdx = i + j * batchSize;
        const endIdx = Math.min(startIdx + batchSize, inputs.length);
        const batchInputs = inputs.slice(startIdx, endIdx);

        batchPromises.push(this.batchInferenceSingle<T>(modelId, batchInputs));
      }

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
    }

    return results;
  }

  /**
   * Get model manager statistics
   */
  getStatistics(): {
    totalModels: number;
    loadedModels: number;
    totalSize: number;
    loadedSize: number;
    memoryUsage: number;
    cacheStats: any;
    averageLoadTime: number;
    averageInferenceTime: number;
  } {
    const allModels = this.getRegisteredModels();
    const loadedModels = this.getLoadedModels();

    return {
      totalModels: allModels.length,
      loadedModels: loadedModels.length,
      totalSize: allModels.reduce((sum, model) => sum + model.size, 0),
      loadedSize: loadedModels.reduce((sum, model) => sum + model.size, 0),
      memoryUsage: memoryManager.getCurrentMemoryUsage().heap.used,
      cacheStats: modelCache.getStats(),
      averageLoadTime: this.calculateAverageLoadTime(),
      averageInferenceTime: this.calculateAverageInferenceTime(),
    };
  }

  /**
   * Export model registry
   */
  exportRegistry(): ModelRegistry {
    return { ...this.registry };
  }

  /**
   * Import model registry
   */
  importRegistry(registry: ModelRegistry): void {
    this.registry = { ...this.registry, ...registry };

    // Register all models with lazy loader
    for (const definition of Object.values(registry)) {
      lazyLoader.registerItem({
        id: definition.id,
        type: 'model',
        name: definition.name,
        description: definition.description,
        version: definition.version,
        size: definition.size,
        dependencies: definition.dependencies,
        loadPriority: this.getLoadPriorityLabel(definition.type),
        lazy: true,
        persistent: false,
        timeout: this.config.defaultTimeout,
        retryAttempts: this.config.retryAttempts,
      });
    }
  }

  /**
   * Shutdown the model manager
   */
  async shutdown(): Promise<void> {
    // Unload all models
    const unloadPromises = Array.from(this.models.keys()).map((modelId) =>
      this.unload(modelId, true)
    );

    await Promise.all(unloadPromises);

    this.models.clear();
    this.metrics.clear();
    this.loadingPromises.clear();

    this.isInitialized = false;
    console.log('Model Manager shutdown completed');
  }

  /**
   * Private helper methods
   */
  private async loadRegistry(): Promise<void> {
    // Load default models
    const defaultModels: ModelDefinition[] = [
      {
        id: 'sentiment_en_bert',
        name: 'English Sentiment Analysis (BERT)',
        description: 'BERT-based sentiment analysis for English text',
        type: 'sentiment_analysis',
        version: '1.0.0',
        url: 'https://tfhub.dev/tensorflow/tfjs-model/roberta_en_classification/1/default/1',
        size: 420000000, // ~420MB
        languages: ['en'],
        capabilities: {
          inputTypes: ['text'],
          outputTypes: ['sentiment'],
          maxSequenceLength: 512,
          batchSize: [1, 8, 16, 32],
          quantization: true,
          streaming: false,
          multilingual: false,
          domains: ['general'],
        },
        dependencies: [],
        metadata: {
          author: 'TensorFlow Hub',
          license: 'Apache 2.0',
          created: new Date('2023-01-01'),
          updated: new Date('2023-01-01'),
          accuracy: { imdb: 0.93 },
        },
      },
      {
        id: 'ner_multilingual_bert',
        name: 'Multilingual NER (BERT)',
        description: 'Named Entity Recognition for multiple languages',
        type: 'entity_recognition',
        version: '1.0.0',
        url: 'https://tfhub.dev/tensorflow/tfjs-model/bert_multi_cased_L-12_H-768_A-12/1/default/1',
        size: 680000000, // ~680MB
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'ru', 'zh', 'ja'],
        capabilities: {
          inputTypes: ['text'],
          outputTypes: ['entities'],
          maxSequenceLength: 512,
          batchSize: [1, 8, 16],
          quantization: true,
          streaming: false,
          multilingual: true,
          domains: ['general', 'news', 'social'],
        },
        dependencies: [],
        metadata: {
          author: 'TensorFlow Hub',
          license: 'Apache 2.0',
          created: new Date('2023-01-01'),
          updated: new Date('2023-01-01'),
          accuracy: { conll2003: 0.89 },
        },
      },
    ];

    for (const model of defaultModels) {
      this.registerModel(model);
    }
  }

  private async performLoad(
    definition: ModelDefinition,
    options: ModelLoadOptions
  ): Promise<LoadedModel> {
    const startTime = performance.now();

    try {
      // Load from cache if available
      if (this.config.enableCache && !options.force) {
        const cachedData = await modelCache.get(definition.id);
        if (cachedData) {
          const model = await tf.loadLayersModel(
            tf.io.browserFiles([new File([cachedData], `${definition.id}.bin`)])
          );
          const loadTime = performance.now() - startTime;

          return {
            model,
            definition,
            loadTime,
            loadedAt: new Date(),
          };
        }
      }

      // Load from URL
      const model = await tf.loadLayersModel(definition.url);
      const loadTime = performance.now() - startTime;

      return {
        model,
        definition,
        loadTime,
        loadedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to load model ${definition.id}: ${error}`);
    }
  }

  private async warmupModel(loadedModel: LoadedModel): Promise<void> {
    try {
      // Create dummy input for warmup
      const dummyInput = tf.zeros([1, 10]);
      await (loadedModel.model as any).predict(dummyInput);
      dummyInput.dispose();
    } catch (error) {
      console.warn(`Failed to warm up model ${loadedModel.definition.id}:`, error);
    }
  }

  private updateUsageMetrics(modelId: string): void {
    let metrics = this.metrics.get(modelId);

    if (!metrics) {
      metrics = {
        loadTime: 0,
        inferenceTime: 0,
        memoryUsage: 0,
        usageCount: 0,
        throughput: 0,
        cacheHitRate: 0,
        lastUsed: new Date(),
      };
      this.metrics.set(modelId, metrics);
    }

    metrics.usageCount++;
    metrics.lastUsed = new Date();
  }

  private getModelStatus(modelId: string): ModelStatus {
    if (this.loadingPromises.has(modelId)) {
      return 'loading';
    }

    if (this.models.has(modelId)) {
      return 'loaded';
    }

    return 'unloaded';
  }

  private getLoadPriority(type: ModelType): number {
    const priorities: Record<ModelType, number> = {
      sentiment_analysis: 1,
      entity_recognition: 1,
      text_classification: 2,
      language_detection: 1,
      text_summarization: 3,
      text_generation: 3,
      translation: 3,
      grammar_checking: 2,
      text_embedding: 2,
      tokenization: 1,
    };

    return priorities[type] || 5;
  }

  private getLoadPriorityLabel(type: ModelType): LoadPriority {
    const priorityValue = this.getLoadPriority(type);

    const labels: Record<number, LoadPriority> = {
      1: 'critical',
      2: 'high',
      3: 'medium',
      4: 'low',
      5: 'background',
    };

    return labels[priorityValue] || 'background';
  }

  private isCriticalModel(definition: ModelDefinition): boolean {
    return this.getLoadPriority(definition.type) <= 1;
  }

  private async batchInferenceSingle<T>(modelId: string, inputs: tf.Tensor[]): Promise<T[]> {
    const model = this.models.get(modelId)?.model;
    if (!model) {
      throw new Error(`Model ${modelId} is not loaded`);
    }

    const results = await Promise.all(inputs.map((input) => (model as any).predict(input) as T));

    return results;
  }

  private calculateAverageLoadTime(): number {
    const metricsArray = Array.from(this.metrics.values());
    if (metricsArray.length === 0) return 0;

    return metricsArray.reduce((sum, metrics) => sum + metrics.loadTime, 0) / metricsArray.length;
  }

  private calculateAverageInferenceTime(): number {
    const metricsArray = Array.from(this.metrics.values());
    if (metricsArray.length === 0) return 0;

    return (
      metricsArray.reduce((sum, metrics) => sum + metrics.inferenceTime, 0) / metricsArray.length
    );
  }
}

// Supporting interfaces
interface ModelManagerConfig {
  defaultTimeout: number;
  maxConcurrentLoads: number;
  enableCache: boolean;
  enableWarmup: boolean;
  enableQuantization: boolean;
  memoryThreshold: number;
  autoUnload: boolean;
  unloadIdleAfter: number;
  enableMetrics: boolean;
  retryAttempts: number;
  retryDelay: number;
}

interface LoadedModel {
  model: ModelInstance;
  definition: ModelDefinition;
  loadTime: number;
  loadedAt: Date;
}

// Singleton instance
export const modelManager = new ModelManager();
