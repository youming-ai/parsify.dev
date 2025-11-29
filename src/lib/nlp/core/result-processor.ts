/**
 * Result Processor - Formats and aggregates NLP processing results
 * Provides standardized output formatting and result combination capabilities
 */

import type { AggregationStrategy, NLPResult, OutputFormat, ProcessingOperation } from '../types';

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity?: 'info' | 'warning' | 'error';
  field?: string;
  value?: any;
}

export interface ProcessingOptions {
  includeMetadata?: boolean;
  includeConfidence?: boolean;
  includeTimestamps?: boolean;
  format?: OutputFormat;
  language?: string;
  precision?: number;
  sortBy?: string;
  filter?: ResultFilter;
  aggregate?: AggregationStrategy;
}

export interface ResultFilter {
  operationTypes?: string[];
  confidence?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  keywords?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface AggregatedResult {
  type: string;
  confidence: number;
  samples: number;
  data: any;
  distribution?: Record<string, number>;
  statistics?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
  };
  metadata: {
    aggregationStrategy: AggregationStrategy;
    processedAt: Date;
    sourceResults: string[];
  };
}

export class ResultProcessor {
  private config: ProcessingOptions;
  private formatters: Map<OutputFormat, ResultFormatter> = new Map();
  private aggregators: Map<AggregationStrategy, ResultAggregator> = new Map();

  constructor(config: Partial<ProcessingOptions> = {}) {
    this.config = {
      includeMetadata: true,
      includeConfidence: true,
      includeTimestamps: true,
      format: 'json',
      precision: 3,
      sortBy: 'confidence',
      ...config,
    };

    this.setupFormatters();
    this.setupAggregators();
  }

  /**
   * Process a single operation result
   */
  processResult<T = any>(
    result: NLPResult<T>,
    operation: ProcessingOperation,
    options: ProcessingOptions = {}
  ): ProcessedResult<T> {
    const mergedOptions = { ...this.config, ...options };

    // Validate result
    const validation = this.validateResult(result, operation);
    if (!validation.valid) {
      throw new Error(`Invalid result: ${validation.errors.map((e) => e.message).join(', ')}`);
    }

    // Format the result
    const formattedResult = this.formatResult(result, operation, mergedOptions);

    // Apply filtering if specified
    const filteredResult = this.applyFilter(formattedResult, mergedOptions.filter);

    return filteredResult;
  }

  /**
   * Process multiple operation results
   */
  processResults<T = any>(
    results: Array<{ result: NLPResult<T>; operation: ProcessingOperation }>,
    options: ProcessingOptions = {}
  ): ProcessedBatchResult<T> {
    const mergedOptions = { ...this.config, ...options };

    // Process each result
    const processedResults = results.map(({ result, operation }) =>
      this.processResult(result, operation, mergedOptions)
    );

    // Sort results if specified
    const sortedResults = this.sortResults(processedResults, mergedOptions.sortBy);

    // Aggregate if specified
    const aggregatedResults = mergedOptions.aggregate
      ? this.aggregateResults(sortedResults, mergedOptions.aggregate)
      : [];

    return {
      results: sortedResults,
      aggregated: aggregatedResults,
      summary: this.generateSummary(sortedResults),
      metadata: {
        processingOptions: mergedOptions,
        processedAt: new Date(),
        totalProcessed: results.length,
        successful: results.filter((r) => r.result.success).length,
      },
    };
  }

  /**
   * Format result for output
   */
  formatForOutput<T = any>(
    results: ProcessedResult<T> | ProcessedBatchResult<T>,
    format: OutputFormat = 'json'
  ): string {
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`Unsupported output format: ${format}`);
    }

    return formatter.format(results);
  }

  /**
   * Validate a processing result
   */
  validateResult<T = any>(result: NLPResult<T>, operation: ProcessingOperation): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!result) {
      errors.push({
        code: 'MISSING_RESULT',
        message: 'Result is null or undefined',
        field: 'result',
      });
      return { valid: false, errors, warnings };
    }

    // Success validation
    if (result.success === undefined) {
      warnings.push('Result success status is undefined');
    }

    // Data validation
    if (result.success && result.data === undefined) {
      errors.push({
        code: 'MISSING_DATA',
        message: 'Successful result is missing data',
        field: 'data',
      });
    }

    // Confidence validation
    if (result.confidence !== undefined) {
      if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
        errors.push({
          code: 'INVALID_CONFIDENCE',
          message: 'Confidence must be a number between 0 and 1',
          field: 'confidence',
          value: result.confidence,
        });
      }
    }

    // Processing time validation
    if (result.processingTime !== undefined) {
      if (typeof result.processingTime !== 'number' || result.processingTime < 0) {
        errors.push({
          code: 'INVALID_PROCESSING_TIME',
          message: 'Processing time must be a non-negative number',
          field: 'processingTime',
          value: result.processingTime,
        });
      }
    }

    // Operation-specific validation
    const operationValidation = this.validateOperationSpecific(result, operation);
    errors.push(...operationValidation.errors);
    warnings.push(...operationValidation.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Convert results to different format
   */
  convertFormat<T = any>(
    results: ProcessedResult<T>[],
    fromFormat: OutputFormat,
    toFormat: OutputFormat
  ): any[] {
    // Parse from format
    const parsed = this.parseFromFormat(results, fromFormat);

    // Format to new format
    return this.formatBatchResults(parsed, toFormat);
  }

  /**
   * Merge multiple result sets
   */
  mergeResults<T = any>(
    resultSets: ProcessedBatchResult<T>[],
    strategy: 'union' | 'intersection' | 'concat' = 'union'
  ): ProcessedBatchResult<T> {
    switch (strategy) {
      case 'union':
        return this.mergeUnion(resultSets);
      case 'intersection':
        return this.mergeIntersection(resultSets);
      case 'concat':
        return this.mergeConcat(resultSets);
      default:
        throw new Error(`Unsupported merge strategy: ${strategy}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ProcessingOptions>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ProcessingOptions {
    return { ...this.config };
  }

  /**
   * Register custom formatter
   */
  registerFormatter(format: OutputFormat, formatter: ResultFormatter): void {
    this.formatters.set(format, formatter);
  }

  /**
   * Register custom aggregator
   */
  registerAggregator(strategy: AggregationStrategy, aggregator: ResultAggregator): void {
    this.aggregators.set(strategy, aggregator);
  }

  /**
   * Private helper methods
   */
  private formatResult<T = any>(
    result: NLPResult<T>,
    operation: ProcessingOperation,
    options: ProcessingOptions
  ): ProcessedResult<T> {
    const processed: ProcessedResult<T> = {
      operation,
      result: {
        success: result.success,
        data: result.data,
        confidence: result.confidence,
        processingTime: result.processingTime,
        metadata: result.metadata || {},
      },
    };

    // Add metadata if requested
    if (options.includeMetadata) {
      processed.metadata = {
        ...processed.metadata,
        operationType: operation.type,
        tool: operation.tool,
        config: operation.config,
        processedAt: new Date(),
      };
    }

    // Format confidence
    if (options.includeConfidence && processed.result.confidence !== undefined) {
      processed.result.confidence =
        Math.round(processed.result.confidence * 10 ** (options.precision || 3)) /
        10 ** (options.precision || 3);
    }

    // Add timestamps
    if (options.includeTimestamps) {
      processed.timestamp = new Date();
    }

    return processed;
  }

  private applyFilter<T = any>(
    result: ProcessedResult<T>,
    filter?: ResultFilter
  ): ProcessedResult<T> {
    if (!filter) return result;

    // Skip failed results
    if (filter.confidence && result.result.confidence !== undefined) {
      if (filter.confidence.min !== undefined && result.result.confidence < filter.confidence.min) {
        return { ...result, filtered: true };
      }
      if (filter.confidence.max !== undefined && result.result.confidence > filter.confidence.max) {
        return { ...result, filtered: true };
      }
    }

    return result;
  }

  private sortResults<T = any>(
    results: ProcessedResult<T>[],
    sortBy?: string
  ): ProcessedResult<T>[] {
    const sortField = sortBy ?? 'confidence';

    return results.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case 'confidence':
          aValue = a.result.confidence || 0;
          bValue = b.result.confidence || 0;
          break;
        case 'processingTime':
          aValue = a.result.processingTime || 0;
          bValue = b.result.processingTime || 0;
          break;
        case 'timestamp':
          aValue = (a.timestamp || new Date()).getTime();
          bValue = (b.timestamp || new Date()).getTime();
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      return bValue - aValue;
    });
  }

  private aggregateResults<T = any>(
    results: ProcessedResult<T>[],
    strategy: AggregationStrategy
  ): AggregatedResult[] {
    const aggregator = this.aggregators.get(strategy);
    if (!aggregator) {
      return [];
    }

    return aggregator.aggregate(results);
  }

  private generateSummary<T = any>(results: ProcessedResult<T>[]): ResultSummary {
    const successful = results.filter((r) => r.result.success && !r.filtered);
    const failed = results.filter((r) => !r.result.success || r.filtered);

    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: results.length > 0 ? successful.length / results.length : 0,
      averageConfidence:
        successful.length > 0
          ? successful.reduce((sum, r) => sum + (r.result.confidence || 0), 0) / successful.length
          : 0,
      averageProcessingTime:
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.result.processingTime || 0), 0) / results.length
          : 0,
      operationTypes: [...new Set(results.map((r) => r.operation.type))],
      tools: [...new Set(results.map((r) => r.operation.tool))],
    };
  }

  private validateOperationSpecific<T = any>(
    result: NLPResult<T>,
    operation: ProcessingOperation
  ): { errors: ValidationError[]; warnings: string[] } {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validation based on operation type
    switch (operation.type) {
      case 'sentiment':
        this.validateSentimentResult(result, errors, warnings);
        break;
      case 'entities':
        this.validateEntityResult(result, errors, warnings);
        break;
      case 'language':
        this.validateLanguageResult(result, errors, warnings);
        break;
      case 'summarization':
        this.validateSummarizationResult(result, errors, warnings);
        break;
      default:
        // Generic validation for unknown operation types
        if (operation.config && Object.keys(operation.config).length > 0) {
          warnings.push(`No specific validation available for operation type: ${operation.type}`);
        }
    }

    return { errors, warnings };
  }

  private validateSentimentResult<T = any>(
    result: NLPResult<T>,
    errors: ValidationError[],
    _warnings: string[]
  ): void {
    if (result.success && result.data) {
      const data = result.data as any;

      if (data.sentiment && !['positive', 'negative', 'neutral'].includes(data.sentiment)) {
        errors.push({
          code: 'INVALID_SENTIMENT',
          message: 'Sentiment must be one of: positive, negative, neutral',
          field: 'data.sentiment',
          value: data.sentiment,
        });
      }

      if (
        data.score !== undefined &&
        (typeof data.score !== 'number' || data.score < -1 || data.score > 1)
      ) {
        errors.push({
          code: 'INVALID_SENTIMENT_SCORE',
          message: 'Sentiment score must be a number between -1 and 1',
          field: 'data.score',
          value: data.score,
        });
      }
    }
  }

  private validateEntityResult<T = any>(
    result: NLPResult<T>,
    errors: ValidationError[],
    _warnings: string[]
  ): void {
    if (result.success && result.data) {
      const data = result.data as any;

      if (Array.isArray(data)) {
        data.forEach((entity, index) => {
          if (!entity.text || typeof entity.text !== 'string') {
            errors.push({
              code: 'INVALID_ENTITY',
              message: `Entity ${index} must have a text property`,
              field: `data[${index}].text`,
              value: entity.text,
            });
          }

          if (!entity.type || typeof entity.type !== 'string') {
            errors.push({
              code: 'INVALID_ENTITY_TYPE',
              message: `Entity ${index} must have a type property`,
              field: `data[${index}].type`,
              value: entity.type,
            });
          }
        });
      }
    }
  }

  private validateLanguageResult<T = any>(
    result: NLPResult<T>,
    errors: ValidationError[],
    _warnings: string[]
  ): void {
    if (result.success && result.data) {
      const data = result.data as any;

      if (data.language && typeof data.language !== 'string') {
        errors.push({
          code: 'INVALID_LANGUAGE',
          message: 'Language must be a string',
          field: 'data.language',
          value: data.language,
        });
      }

      if (
        data.confidence !== undefined &&
        (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1)
      ) {
        errors.push({
          code: 'INVALID_LANGUAGE_CONFIDENCE',
          message: 'Language confidence must be a number between 0 and 1',
          field: 'data.confidence',
          value: data.confidence,
        });
      }
    }
  }

  private validateSummarizationResult<T = any>(
    result: NLPResult<T>,
    errors: ValidationError[],
    _warnings: string[]
  ): void {
    if (result.success && result.data) {
      const data = result.data as any;

      if (data.summary && typeof data.summary !== 'string') {
        errors.push({
          code: 'INVALID_SUMMARY',
          message: 'Summary must be a string',
          field: 'data.summary',
          value: data.summary,
        });
      }

      if (
        data.compressionRatio !== undefined &&
        (typeof data.compressionRatio !== 'number' ||
          data.compressionRatio < 0 ||
          data.compressionRatio > 1)
      ) {
        errors.push({
          code: 'INVALID_COMPRESSION_RATIO',
          message: 'Compression ratio must be a number between 0 and 1',
          field: 'data.compressionRatio',
          value: data.compressionRatio,
        });
      }
    }
  }

  private parseFromFormat<T = any>(
    results: ProcessedResult<T>[],
    format: OutputFormat
  ): ProcessedResult<T>[] {
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`Unsupported source format: ${format}`);
    }

    return formatter.parse(results);
  }

  private formatBatchResults<T = any>(results: ProcessedResult<T>[], format: OutputFormat): any[] {
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`Unsupported target format: ${format}`);
    }

    return results.map((result) => formatter.formatSingle(result));
  }

  private mergeUnion<T = any>(resultSets: ProcessedBatchResult<T>[]): ProcessedBatchResult<T> {
    const allResults = resultSets.flatMap((rs) => rs.results);
    const allAggregated = resultSets.flatMap((rs) => rs.aggregated || []);

    return {
      results: allResults,
      aggregated: allAggregated,
      summary: this.generateSummary(allResults),
      metadata: {
        processingOptions: this.config,
        processedAt: new Date(),
        totalProcessed: allResults.length,
        successful: allResults.filter((r) => r.result.success).length,
      },
    };
  }

  private mergeIntersection<T = any>(
    resultSets: ProcessedBatchResult<T>[]
  ): ProcessedBatchResult<T> {
    if (resultSets.length === 0) {
      return {
        results: [],
        aggregated: [],
        summary: this.generateSummary([]),
        metadata: {
          processingOptions: this.config,
          processedAt: new Date(),
          totalProcessed: 0,
          successful: 0,
        },
      };
    }

    // Find common results across all sets
    const firstSet = resultSets[0];
    const commonResults = firstSet.results.filter((firstResult) =>
      resultSets.every((rs) =>
        rs.results.some(
          (rsResult) => JSON.stringify(rsResult.result) === JSON.stringify(firstResult.result)
        )
      )
    );

    // TODO: Implement proper aggregated intersection

    return {
      results: commonResults,
      aggregated: [],
      summary: this.generateSummary(commonResults),
      metadata: {
        processingOptions: this.config,
        processedAt: new Date(),
        totalProcessed: commonResults.length,
        successful: commonResults.filter((r) => r.result.success).length,
      },
    };
  }

  private mergeConcat<T = any>(resultSets: ProcessedBatchResult<T>[]): ProcessedBatchResult<T> {
    const allResults = resultSets.flatMap((rs) => rs.results);
    const allAggregated = resultSets.flatMap((rs) => rs.aggregated || []);

    return {
      results: allResults,
      aggregated: allAggregated,
      summary: this.generateSummary(allResults),
      metadata: {
        processingOptions: this.config,
        processedAt: new Date(),
        totalProcessed: allResults.length,
        successful: allResults.filter((r) => r.result.success).length,
      },
    };
  }

  private setupFormatters(): void {
    // JSON formatter
    this.formatters.set('json', {
      format: (results) => JSON.stringify(results, null, 2),
      formatSingle: (result) => JSON.stringify(result, null, 2),
      parse: (results) => {
        if (typeof results === 'string') {
          return JSON.parse(results);
        }
        return results as any;
      },
    });

    // CSV formatter
    this.formatters.set('csv', {
      format: (results) => this.formatToCSV(results as ProcessedBatchResult<any>),
      formatSingle: (result) => this.formatSingleToCSV(result),
      parse: (results) => this.parseFromCSV(results),
    });

    // XML formatter
    this.formatters.set('xml', {
      format: (results) => this.formatToXML(results as ProcessedBatchResult<any>),
      formatSingle: (result) => this.formatSingleToXML(result),
      parse: (results) => this.parseFromXML(results),
    });

    // Plain text formatter
    this.formatters.set('text', {
      format: (results) => this.formatToText(results as ProcessedBatchResult<any>),
      formatSingle: (result) => this.formatSingleToText(result),
      parse: (results) => this.parseFromText(results),
    });
  }

  private setupAggregators(): void {
    // Average aggregation
    this.aggregators.set('average', {
      aggregate: (results) => {
        const groupedByType = this.groupByType(results);

        return Object.entries(groupedByType).map(([type, typeResults]) => ({
          type,
          confidence:
            typeResults.reduce((sum, r) => sum + (r.result.confidence || 0), 0) /
            typeResults.length,
          samples: typeResults.length,
          data: this.calculateAverage(typeResults),
          distribution: this.calculateDistribution(typeResults),
          statistics: this.calculateStatistics(typeResults),
          metadata: {
            aggregationStrategy: 'average' as AggregationStrategy,
            processedAt: new Date(),
            sourceResults: typeResults.map((r) => r.operation.id || 'unknown'),
          },
        }));
      },
    });

    // Majority aggregation
    this.aggregators.set('majority', {
      aggregate: (results) => {
        const groupedByType = this.groupByType(results);

        return Object.entries(groupedByType).map(([type, typeResults]) => ({
          type,
          confidence: this.calculateMajorityConfidence(typeResults),
          samples: typeResults.length,
          data: this.calculateMajority(typeResults),
          distribution: this.calculateDistribution(typeResults),
          statistics: this.calculateStatistics(typeResults),
          metadata: {
            aggregationStrategy: 'majority' as AggregationStrategy,
            processedAt: new Date(),
            sourceResults: typeResults.map((r) => r.operation.id || 'unknown'),
          },
        }));
      },
    });

    // Weighted aggregation
    this.aggregators.set('weighted', {
      aggregate: (results) => {
        const groupedByType = this.groupByType(results);

        return Object.entries(groupedByType).map(([type, typeResults]) => ({
          type,
          confidence: this.calculateWeightedConfidence(typeResults),
          samples: typeResults.length,
          data: this.calculateWeightedAverage(typeResults),
          distribution: this.calculateDistribution(typeResults),
          statistics: this.calculateStatistics(typeResults),
          metadata: {
            aggregationStrategy: 'weighted' as AggregationStrategy,
            processedAt: new Date(),
            sourceResults: typeResults.map((r) => r.operation.id || 'unknown'),
          },
        }));
      },
    });
  }

  private groupByType<T = any>(
    results: ProcessedResult<T>[]
  ): Record<string, ProcessedResult<T>[]> {
    return results.reduce<Record<string, ProcessedResult<T>[]>>((groups, result) => {
      const type = result.operation.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(result);
      return groups;
    }, {});
  }

  private calculateAverage<T = any>(results: ProcessedResult<T>[]): any {
    // Simplified averaging - would need proper implementation based on data structure
    return results[0]?.result?.data || null;
  }

  private calculateMajority<T = any>(results: ProcessedResult<T>[]): any {
    // Simplified majority - would need proper implementation based on data structure
    return results[0]?.result?.data || null;
  }

  private calculateWeightedAverage<T = any>(results: ProcessedResult<T>[]): any {
    // Simplified weighted average - would need proper implementation
    return results[0]?.result?.data || null;
  }

  private calculateMajorityConfidence<T = any>(results: ProcessedResult<T>[]): number {
    const confidences = results.map((r) => r.result.confidence || 0);
    confidences.sort((a, b) => b - a);

    // Find majority threshold
    const threshold = confidences[Math.floor(confidences.length / 2)];

    return threshold;
  }

  private calculateWeightedConfidence<T = any>(results: ProcessedResult<T>[]): number {
    return results.reduce((sum, r) => sum + (r.result.confidence || 0), 0) / results.length;
  }

  private calculateDistribution<T = any>(results: ProcessedResult<T>[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    results.forEach((result) => {
      const key = this.getResultKey(result);
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return distribution;
  }

  private calculateStatistics<T = any>(
    results: ProcessedResult<T>[]
  ): {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
  } {
    if (results.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
    }

    const values = results.map((r) => r.result.confidence || 0);
    const sorted = [...values].sort((a, b) => a - b);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: this.calculateStandardDeviation(values),
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  private getResultKey<T = any>(result: ProcessedResult<T>): string {
    // Create a key that uniquely identifies the result
    return `${result.operation.type}:${JSON.stringify(result.result.data).slice(0, 50)}`;
  }

  // CSV formatting methods
  private formatToCSV<T = any>(batchResult: ProcessedBatchResult<T>): string {
    const headers = ['operation', 'success', 'confidence', 'processingTime', 'data'];
    const rows = [headers.join(',')];

    batchResult.results.forEach((result) => {
      const row = [
        result.operation.type,
        result.result.success,
        result.result.confidence || 0,
        result.result.processingTime || 0,
        JSON.stringify(result.result.data),
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  private formatSingleToCSV(result: ProcessedResult<any>): string {
    const headers = ['operation', 'success', 'confidence', 'processingTime', 'data'];
    const row = [
      result.operation.type,
      result.result.success,
      result.result.confidence || 0,
      result.result.processingTime || 0,
      JSON.stringify(result.result.data),
    ];

    return `${headers.join(',')}\n${row.join(',')}`;
  }

  private parseFromCSV(csvText: string): ProcessedResult<any>[] {
    // Basic CSV parsing - would need robust implementation
    const lines = csvText.split('\n');
    const _headers = lines[0].split(',');

    return lines.slice(1).map((line) => {
      const values = line.split(',');
      return {
        operation: { type: values[0], tool: values[0], enabled: true },
        result: {
          success: values[1] === 'true',
          confidence: Number.parseFloat(values[2]),
          processingTime: Number.parseFloat(values[3]),
          data: JSON.parse(values[4]),
        },
      };
    });
  }

  // XML formatting methods
  private formatToXML<T = any>(batchResult: ProcessedBatchResult<T>): string {
    const xmlItems = batchResult.results.map((result) => this.formatSingleToXML(result));

    return `<results>\n${xmlItems.join('\n')}\n</results>`;
  }

  private formatSingleToXML(result: ProcessedResult<any>): string {
    const operation = this.escapeXML(result.operation.type);
    const data = this.escapeXML(JSON.stringify(result.result.data));
    const success = result.result.success;
    const confidence = result.result.confidence || 0;
    const processingTime = result.result.processingTime || 0;

    return `  <result operation="${operation}" success="${success}" confidence="${confidence}" processingTime="${processingTime}">
    <data>${data}</data>
  </result>`;
  }

  private parseFromXML(_xmlText: string): ProcessedResult<any>[] {
    // Basic XML parsing - would need robust implementation
    return [];
  }

  // Text formatting methods
  private formatToText<T = any>(batchResult: ProcessedBatchResult<T>): string {
    return batchResult.results.map((result) => this.formatSingleToText(result)).join('\n\n');
  }

  private formatSingleToText(result: ProcessedResult<any>): string {
    return `${result.operation.type}: ${result.result.success ? 'SUCCESS' : 'FAILED'}
Confidence: ${result.result.confidence || 0}
Processing Time: ${result.result.processingTime || 0}ms
Data: ${JSON.stringify(result.result.data, null, 2)}
`;
  }

  private parseFromText(_textText: string): ProcessedResult<any>[] {
    // Basic text parsing - would need robust implementation
    return [];
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}

// Supporting interfaces
export interface ProcessedResult<T = any> {
  operation: ProcessingOperation;
  result: {
    success: boolean;
    data?: T;
    confidence?: number;
    processingTime?: number;
    metadata?: Record<string, any>;
  };
  timestamp?: Date;
  filtered?: boolean;
  metadata?: Record<string, any>;
}

export interface ProcessedBatchResult<T = any> {
  results: ProcessedResult<T>[];
  aggregated?: AggregatedResult[];
  summary: ResultSummary;
  metadata: Record<string, any>;
}

export interface ResultSummary {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  averageConfidence: number;
  averageProcessingTime: number;
  operationTypes: string[];
  tools: string[];
}

export interface ResultFormatter {
  format: (data: any) => string;
  formatSingle: (result: ProcessedResult<any>) => string;
  parse: (data: any) => ProcessedResult<any>[];
}

export interface ResultAggregator {
  aggregate: (results: ProcessedResult<any>[]) => AggregatedResult[];
}

// Export singleton instance
export const resultProcessor = new ResultProcessor();
