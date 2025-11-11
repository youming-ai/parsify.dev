/**
 * Progress Time Estimation and ETA Calculator
 * Advanced time estimation algorithms with machine learning capabilities
 */

import {
  ProgressOperation,
  ProgressType,
  ProgressAnalytics,
  ProgressMetrics
} from './progress-indicators-types';

// ============================================================================
// Time Estimation Configuration
// ============================================================================

export interface TimeEstimationConfig {
  // Algorithm selection
  algorithm: 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'machine-learning';

  // Historical data weighting
  historicalWeight: number; // 0-1, how much to weight historical data
  recentWeight: number; // 0-1, how much to weight recent progress

  // Time windows for analysis
  shortTermWindow: number; // minutes
  mediumTermWindow: number; // minutes
  longTermWindow: number; // minutes

  // Confidence thresholds
  minConfidence: number; // 0-1
  highConfidence: number; // 0-1

  // Adaptation settings
  adaptationRate: number; // 0-1, how quickly to adapt to new data
  outlierThreshold: number; // standard deviations

  // Special cases
  considerInputSize: boolean;
  considerComplexity: boolean;
  considerSystemLoad: boolean;
}

export interface TimeEstimation {
  estimatedDuration: number; // milliseconds
  confidence: number; // 0-1
  remainingTime: number; // milliseconds
  eta: Date;
  algorithm: string;
  factors: string[];
  accuracy: number; // 0-1, based on historical accuracy
}

export interface HistoricalData {
  toolId: string;
  operationType: ProgressType;
  duration: number;
  inputSize: number;
  outputSize: number;
  complexity: number;
  systemLoad: number;
  timestamp: Date;
  success: boolean;
}

export interface PerformanceFactors {
  inputSize: number;
  outputSize: number;
  complexity: number;
  systemLoad: number;
  concurrency: number;
  memoryUsage: number;
  networkLatency: number;
  diskIO: number;
  cpuSpeed: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: TimeEstimationConfig = {
  algorithm: 'machine-learning',
  historicalWeight: 0.6,
  recentWeight: 0.4,
  shortTermWindow: 5, // 5 minutes
  mediumTermWindow: 30, // 30 minutes
  longTermWindow: 120, // 2 hours
  minConfidence: 0.3,
  highConfidence: 0.8,
  adaptationRate: 0.1,
  outlierThreshold: 2.0,
  considerInputSize: true,
  considerComplexity: true,
  considerSystemLoad: true,
};

// ============================================================================
// Time Estimator Class
// ============================================================================

export class ProgressTimeEstimator {
  private config: TimeEstimationConfig;
  private historicalData: Map<string, HistoricalData[]> = new Map();
  private performanceFactors: Map<string, PerformanceFactors> = new Map();
  private accuracyTracker: Map<string, number[]> = new Map();

  constructor(config: Partial<TimeEstimationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadHistoricalData();
    this.startPerformanceMonitoring();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Estimate time remaining for an operation
   */
  public estimateTime(operation: ProgressOperation): TimeEstimation {
    const now = new Date();
    const elapsed = operation.startedAt ? now.getTime() - operation.startedAt.getTime() : 0;

    // Get performance factors
    const factors = this.getPerformanceFactors(operation);

    // Select estimation algorithm
    const algorithm = this.selectAlgorithm(operation, factors);

    // Calculate estimation
    const estimation = this.calculateEstimation(operation, algorithm, factors, elapsed);

    // Update confidence based on accuracy
    estimation.confidence = this.adjustConfidence(estimation, operation);

    return estimation;
  }

  /**
   * Update estimation in real-time
   */
  public updateEstimation(operation: ProgressOperation): TimeEstimation {
    const currentEstimation = this.estimateTime(operation);

    // Adapt to current performance
    this.adaptEstimation(operation, currentEstimation);

    return currentEstimation;
  }

  /**
   * Record completed operation for learning
   */
  public recordCompletion(operation: ProgressOperation, actualDuration: number): void {
    const historicalEntry: HistoricalData = {
      toolId: operation.toolId,
      operationType: operation.type,
      duration: actualDuration,
      inputSize: operation.inputSize || 0,
      outputSize: operation.outputSize || 0,
      complexity: this.calculateComplexity(operation),
      systemLoad: this.getCurrentSystemLoad(),
      timestamp: new Date(),
      success: operation.status === 'completed',
    };

    // Store historical data
    const key = this.getHistoricalKey(operation.toolId, operation.type);
    const data = this.historicalData.get(key) || [];
    data.push(historicalEntry);

    // Keep only recent data (last 1000 entries)
    if (data.length > 1000) {
      data.splice(0, data.length - 1000);
    }

    this.historicalData.set(key, data);

    // Update accuracy tracking
    this.updateAccuracy(operation, actualDuration);

    // Persist data
    this.persistHistoricalData();
  }

  /**
   * Get prediction accuracy for a tool/operation type
   */
  public getAccuracy(toolId: string, operationType: ProgressType): number {
    const key = this.getHistoricalKey(toolId, operationType);
    const accuracies = this.accuracyTracker.get(key) || [];

    if (accuracies.length === 0) return 0.5; // Default confidence

    return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  }

  /**
   * Get historical performance data
   */
  public getHistoricalData(toolId: string, operationType: ProgressType): HistoricalData[] {
    const key = this.getHistoricalKey(toolId, operationType);
    return this.historicalData.get(key) || [];
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<TimeEstimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // Algorithm Selection
  // ============================================================================

  private selectAlgorithm(operation: ProgressOperation, factors: PerformanceFactors): string {
    const historicalData = this.getHistoricalData(operation.toolId, operation.type);
    const hasEnoughData = historicalData.length >= 10;

    // Machine learning for accurate predictions with enough data
    if (hasEnoughData && this.config.algorithm === 'machine-learning') {
      return 'machine-learning';
    }

    // Polynomial for complex operations
    if (factors.complexity > 0.7 && operation.progress < 30) {
      return 'polynomial';
    }

    // Exponential for operations that accelerate
    if (operation.progress > 70 && factors.systemLoad < 0.5) {
      return 'exponential';
    }

    // Logarithmic for operations that decelerate
    if (operation.progress > 50 && factors.complexity > 0.8) {
      return 'logarithmic';
    }

    // Default to linear
    return 'linear';
  }

  // ============================================================================
  // Estimation Algorithms
  // ============================================================================

  private calculateEstimation(
    operation: ProgressOperation,
    algorithm: string,
    factors: PerformanceFactors,
    elapsed: number
  ): TimeEstimation {
    let estimatedDuration: number;
    let confidence: number = 0.5;

    switch (algorithm) {
      case 'linear':
        ({ duration: estimatedDuration, confidence } = this.linearEstimation(operation, elapsed, factors));
        break;

      case 'exponential':
        ({ duration: estimatedDuration, confidence } = this.exponentialEstimation(operation, elapsed, factors));
        break;

      case 'logarithmic':
        ({ duration: estimatedDuration, confidence } = this.logarithmicEstimation(operation, elapsed, factors));
        break;

      case 'polynomial':
        ({ duration: estimatedDuration, confidence } = this.polynomialEstimation(operation, elapsed, factors));
        break;

      case 'machine-learning':
        ({ duration: estimatedDuration, confidence } = this.machineLearningEstimation(operation, elapsed, factors));
        break;

      default:
        ({ duration: estimatedDuration, confidence } = this.linearEstimation(operation, elapsed, factors));
    }

    const remainingTime = Math.max(0, estimatedDuration - elapsed);
    const eta = new Date(Date.now() + remainingTime);

    return {
      estimatedDuration,
      confidence,
      remainingTime,
      eta,
      algorithm,
      factors: this.getInfluencingFactors(factors),
      accuracy: this.getAccuracy(operation.toolId, operation.type),
    };
  }

  private linearEstimation(
    operation: ProgressOperation,
    elapsed: number,
    factors: PerformanceFactors
  ): { duration: number; confidence: number } {
    if (operation.progress <= 0) {
      const historicalAvg = this.getHistoricalAverage(operation.toolId, operation.type);
      return { duration: historicalAvg, confidence: 0.3 };
    }

    const totalTime = (elapsed / operation.progress) * 100;
    const confidence = Math.min(0.9, operation.progress / 50); // Higher confidence with more progress

    // Adjust based on factors
    const adjustedDuration = totalTime * this.getFactorMultiplier(factors);

    return { duration: adjustedDuration, confidence };
  }

  private exponentialEstimation(
    operation: ProgressOperation,
    elapsed: number,
    factors: PerformanceFactors
  ): { duration: number; confidence: number } {
    if (operation.progress <= 0) {
      const historicalAvg = this.getHistoricalAverage(operation.toolId, operation.type);
      return { duration: historicalAvg * 0.8, confidence: 0.4 }; // Assume faster completion
    }

    // Exponential growth: operations accelerate over time
    const rate = Math.log(operation.progress + 1) / Math.log(2);
    const totalTime = elapsed / (1 - Math.exp(-rate));

    const confidence = Math.min(0.8, operation.progress / 30);
    const adjustedDuration = totalTime * this.getFactorMultiplier(factors);

    return { duration: adjustedDuration, confidence };
  }

  private logarithmicEstimation(
    operation: ProgressOperation,
    elapsed: number,
    factors: PerformanceFactors
  ): { duration: number; confidence: number } {
    if (operation.progress <= 0) {
      const historicalAvg = this.getHistoricalAverage(operation.toolId, operation.type);
      return { duration: historicalAvg * 1.2, confidence: 0.4 }; // Assume slower completion
    }

    // Logarithmic growth: operations decelerate over time
    const rate = Math.log(operation.progress + 1);
    const totalTime = elapsed / (rate / Math.log(100));

    const confidence = Math.min(0.8, operation.progress / 40);
    const adjustedDuration = totalTime * this.getFactorMultiplier(factors);

    return { duration: adjustedDuration, confidence };
  }

  private polynomialEstimation(
    operation: ProgressOperation,
    elapsed: number,
    factors: PerformanceFactors
  ): { duration: number; confidence: number } {
    if (operation.progress <= 0) {
      const historicalAvg = this.getHistoricalAverage(operation.toolId, operation.type);
      return { duration: historicalAvg, confidence: 0.3 };
    }

    // Polynomial estimation: f(x) = ax² + bx + c
    const x = operation.progress;
    const complexity = factors.complexity;

    // Coefficients based on complexity
    const a = complexity * 0.001;
    const b = 0.01 + (1 - complexity) * 0.02;
    const c = 0.001;

    const progressRate = a * x * x + b * x + c;
    const totalTime = elapsed / Math.max(progressRate, 0.01);

    const confidence = Math.min(0.7, operation.progress / 35);
    const adjustedDuration = totalTime * this.getFactorMultiplier(factors);

    return { duration: adjustedDuration, confidence };
  }

  private machineLearningEstimation(
    operation: ProgressOperation,
    elapsed: number,
    factors: PerformanceFactors
  ): { duration: number; confidence: number } {
    const historicalData = this.getHistoricalData(operation.toolId, operation.type);

    if (historicalData.length < 10) {
      // Fall back to linear estimation
      return this.linearEstimation(operation, elapsed, factors);
    }

    // Feature extraction
    const features = this.extractFeatures(operation, factors, elapsed);

    // Simple linear regression (in production, this would be a proper ML model)
    const { duration, confidence } = this.regresssionPrediction(features, historicalData);

    return { duration, confidence };
  }

  // ============================================================================
  // Machine Learning Components
  // ============================================================================

  private extractFeatures(
    operation: ProgressOperation,
    factors: PerformanceFactors,
    elapsed: number
  ): number[] {
    return [
      operation.progress,
      elapsed,
      factors.inputSize,
      factors.outputSize,
      factors.complexity,
      factors.systemLoad,
      factors.concurrency,
      factors.memoryUsage,
      factors.networkLatency,
      factors.diskIO,
      factors.cpuSpeed,
      this.getTimeOfDay(),
      this.getDayOfWeek(),
    ];
  }

  private regresssionPrediction(features: number[], historicalData: HistoricalData[]): { duration: number; confidence: number } {
    // Simple multiple linear regression
    // In production, this would use more sophisticated ML models

    // Create feature vectors and targets
    const X = historicalData.map(data => [
      data.inputSize / 1000, // Normalize input size
      data.complexity,
      data.systemLoad,
      data.timestamp.getHours() / 24, // Time of day
    ]);

    const y = historicalData.map(data => data.duration);

    // Calculate coefficients (simplified)
    const coefficients = this.calculateCoefficients(X, y);

    // Predict current operation
    const currentFeatures = [
      features[2] / 1000, // Normalized input size
      features[4], // Complexity
      features[5], // System load
      features[10] / 24, // Time of day
    ];

    const predictedDuration = this.applyRegression(currentFeatures, coefficients);

    // Calculate confidence based on R²
    const confidence = this.calculateConfidence(X, y, coefficients);

    return { duration: predictedDuration, confidence };
  }

  private calculateCoefficients(X: number[][], y: number[]): number[] {
    // Simplified coefficient calculation
    // In production, use proper linear algebra libraries

    const n = X.length;
    const m = X[0].length;
    const coefficients = new Array(m).fill(0);

    // Simple average-based calculation (placeholder)
    for (let i = 0; i < m; i++) {
      const featureValues = X.map(row => row[i]);
      coefficients[i] = this.correlation(featureValues, y) * (this.standardDeviation(y) / this.standardDeviation(featureValues));
    }

    return coefficients;
  }

  private applyRegression(features: number[], coefficients: number[]): number {
    return features.reduce((sum, feature, index) => sum + feature * coefficients[index], 0);
  }

  private calculateConfidence(X: number[][], y: number[], coefficients: number[]): number {
    // Simplified R² calculation
    const predictions = X.map(features => this.applyRegression(features, coefficients));
    const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;

    const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, val, index) => sum + Math.pow(val - predictions[index], 2), 0);

    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    return Math.max(0, Math.min(1, rSquared));
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  private getPerformanceFactors(operation: ProgressOperation): PerformanceFactors {
    const cached = this.performanceFactors.get(operation.id);
    if (cached) return cached;

    const factors: PerformanceFactors = {
      inputSize: operation.inputSize || 0,
      outputSize: operation.outputSize || 0,
      complexity: this.calculateComplexity(operation),
      systemLoad: this.getCurrentSystemLoad(),
      concurrency: this.getCurrentConcurrency(),
      memoryUsage: this.getCurrentMemoryUsage(),
      networkLatency: this.getCurrentNetworkLatency(),
      diskIO: this.getCurrentDiskIO(),
      cpuSpeed: this.getCurrentCPUSpeed(),
    };

    this.performanceFactors.set(operation.id, factors);
    return factors;
  }

  private calculateComplexity(operation: ProgressOperation): number {
    let complexity = 0.5; // Base complexity

    // Input size complexity
    if (operation.inputSize) {
      if (operation.inputSize > 10 * 1024 * 1024) complexity += 0.3; // > 10MB
      else if (operation.inputSize > 1024 * 1024) complexity += 0.2; // > 1MB
      else if (operation.inputSize > 100 * 1024) complexity += 0.1; // > 100KB
    }

    // Operation type complexity
    const typeComplexity: Record<ProgressType, number> = {
      validation: 0.2,
      processing: 0.6,
      conversion: 0.7,
      upload: 0.3,
      download: 0.3,
      analysis: 0.8,
      optimization: 0.9,
      compression: 0.7,
      execution: 0.9,
      network: 0.5,
      indexing: 0.8,
      rendering: 0.9,
      background: 0.4,
    };

    complexity += typeComplexity[operation.type] || 0.5;

    // Step-based complexity
    if (operation.totalSteps && operation.totalSteps > 5) {
      complexity += Math.min(0.2, operation.totalSteps / 50);
    }

    return Math.min(1, complexity);
  }

  private getFactorMultiplier(factors: PerformanceFactors): number {
    let multiplier = 1;

    // Input size factor
    if (this.config.considerInputSize && factors.inputSize > 0) {
      multiplier *= Math.log(factors.inputSize / 1000 + 1) / 10;
    }

    // Complexity factor
    if (this.config.considerComplexity) {
      multiplier *= 0.5 + factors.complexity;
    }

    // System load factor
    if (this.config.considerSystemLoad) {
      multiplier *= 0.7 + factors.systemLoad * 0.6;
    }

    // Memory pressure factor
    if (factors.memoryUsage > 0.8) {
      multiplier *= 1.2;
    }

    return Math.max(0.1, Math.min(3, multiplier));
  }

  private getInfluencingFactors(factors: PerformanceFactors): string[] {
    const influences: string[] = [];

    if (factors.inputSize > 1024 * 1024) influences.push('Large input size');
    if (factors.complexity > 0.7) influences.push('High complexity');
    if (factors.systemLoad > 0.7) influences.push('High system load');
    if (factors.memoryUsage > 0.8) influences.push('Memory pressure');
    if (factors.networkLatency > 100) influences.push('Network latency');
    if (factors.concurrency > 4) influences.push('High concurrency');

    return influences;
  }

  private adjustConfidence(estimation: TimeEstimation, operation: ProgressOperation): number {
    let confidence = estimation.confidence;

    // Adjust based on progress
    if (operation.progress > 80) confidence *= 1.2;
    else if (operation.progress < 20) confidence *= 0.7;

    // Adjust based on historical accuracy
    const accuracy = this.getAccuracy(operation.toolId, operation.type);
    confidence *= (0.5 + accuracy);

    // Adjust based on operation consistency
    if (this.isOperationConsistent(operation)) {
      confidence *= 1.1;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private adaptEstimation(operation: ProgressOperation, estimation: TimeEstimation): void {
    const key = this.getHistoricalKey(operation.toolId, operation.type);
    const accuracies = this.accuracyTracker.get(key) || [];

    // Store adaptation data for future learning
    // This would be used by the ML algorithm to improve predictions
  }

  // ============================================================================
  // Historical Data Management
  // ============================================================================

  private getHistoricalKey(toolId: string, operationType: ProgressType): string {
    return `${toolId}:${operationType}`;
  }

  private getHistoricalAverage(toolId: string, operationType: ProgressType): number {
    const data = this.getHistoricalData(toolId, operationType);

    if (data.length === 0) return 5000; // 5 seconds default

    const recentData = data.slice(-20); // Last 20 entries
    return recentData.reduce((sum, entry) => sum + entry.duration, 0) / recentData.length;
  }

  private updateAccuracy(operation: ProgressOperation, actualDuration: number): void {
    const key = this.getHistoricalKey(operation.toolId, operation.type);
    const accuracies = this.accuracyTracker.get(key) || [];

    // Calculate accuracy for this prediction
    const error = Math.abs(operation.estimatedDuration - actualDuration) / operation.estimatedDuration;
    const accuracy = Math.max(0, 1 - error);

    accuracies.push(accuracy);

    // Keep only last 100 accuracy measurements
    if (accuracies.length > 100) {
      accuracies.splice(0, accuracies.length - 100);
    }

    this.accuracyTracker.set(key, accuracies);
  }

  private isOperationConsistent(operation: ProgressOperation): boolean {
    // Check if progress is advancing consistently
    // This would analyze progress patterns over time
    return true; // Simplified
  }

  // ============================================================================
  // System Monitoring
  // ============================================================================

  private getCurrentSystemLoad(): number {
    // Get current system load (0-1)
    // This would use performance APIs or system monitoring
    return Math.random() * 0.8; // Placeholder
  }

  private getCurrentConcurrency(): number {
    // Get number of concurrent operations
    return 1; // Placeholder
  }

  private getCurrentMemoryUsage(): number {
    // Get memory usage as fraction (0-1)
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    return 0.5; // Placeholder
  }

  private getCurrentNetworkLatency(): number {
    // Get network latency in milliseconds
    return 50; // Placeholder
  }

  private getCurrentDiskIO(): number {
    // Get disk I/O rate (0-1)
    return 0.3; // Placeholder
  }

  private getCurrentCPUSpeed(): number {
    // Get relative CPU speed (0-1)
    return 0.8; // Placeholder
  }

  private getTimeOfDay(): number {
    return new Date().getHours();
  }

  private getDayOfWeek(): number {
    return new Date().getDay();
  }

  private startPerformanceMonitoring(): void {
    // Start monitoring system performance
    setInterval(() => {
      // Update performance factors for active operations
      this.performanceFactors.clear();
    }, 5000); // Update every 5 seconds
  }

  // ============================================================================
  // Data Persistence
  // ============================================================================

  private loadHistoricalData(): void {
    try {
      const stored = localStorage.getItem('progress_time_estimation_data');
      if (stored) {
        const data = JSON.parse(stored);

        // Load historical data
        if (data.historicalData) {
          this.historicalData = new Map(Object.entries(data.historicalData));
        }

        // Load accuracy tracking
        if (data.accuracyTracker) {
          this.accuracyTracker = new Map(Object.entries(data.accuracyTracker));
        }
      }
    } catch (error) {
      console.warn('Failed to load time estimation historical data:', error);
    }
  }

  private persistHistoricalData(): void {
    try {
      const data = {
        historicalData: Object.fromEntries(this.historicalData),
        accuracyTracker: Object.fromEntries(this.accuracyTracker),
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem('progress_time_estimation_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist time estimation historical data:', error);
    }
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  private correlation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, index) => sum + val * y[index], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private standardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const timeEstimator = new ProgressTimeEstimator();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get time estimation for an operation
 */
export function getTimeEstimation(operation: ProgressOperation): TimeEstimation {
  return timeEstimator.estimateTime(operation);
}

/**
 * Update and get new estimation for an operation
 */
export function updateTimeEstimation(operation: ProgressOperation): TimeEstimation {
  return timeEstimator.updateEstimation(operation);
}

/**
 * Record operation completion for learning
 */
export function recordOperationCompletion(operation: ProgressOperation, actualDuration: number): void {
  timeEstimator.recordCompletion(operation, actualDuration);
}

/**
 * Get prediction accuracy for a tool/operation type
 */
export function getPredictionAccuracy(toolId: string, operationType: ProgressType): number {
  return timeEstimator.getAccuracy(toolId, operationType);
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(remainingTime: number): string {
  if (remainingTime <= 0) return 'Completed';

  const seconds = Math.floor(remainingTime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
}

/**
 * Format duration for display
 */
export function formatDuration(duration: number): string {
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}
