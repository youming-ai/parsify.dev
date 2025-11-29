/**
 * Batch Processor
 * Handles processing of multiple text inputs with queue management and progress tracking
 */

export interface BatchItem<T = any> {
  id: string;
  input: string;
  metadata?: {
    filename?: string;
    source?: string;
    timestamp: Date;
    priority?: number;
    tags?: string[];
    retryCount?: number;
  };
  result?: T;
  error?: Error;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface BatchConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  retryAttempts: number;
  retryDelay: number;
  timeoutMs: number;
  progressCallback?: (batch: BatchProcessor) => void;
  itemCallback?: (item: BatchItem, batch: BatchProcessor) => void;
  enableChunking?: boolean;
  chunkSize?: number;
  preserveOrder?: boolean;
}

export interface BatchStatistics {
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  pendingItems: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  itemsPerSecond: number;
  startTime?: Date;
  endTime?: Date;
  estimatedTimeRemaining?: number;
}

export class BatchProcessor {
  private items: Map<string, BatchItem> = new Map();
  private processingQueue: string[] = [];
  private processingSet: Set<string> = new Set();
  private config: BatchConfig;
  private isProcessing = false;
  private isPaused = false;
  private startTime?: Date;
  private endTime?: Date;
  private processedCount = 0;
  private processingTimes: number[] = [];
  private abortController?: AbortController;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxConcurrent: 3,
      maxQueueSize: 100,
      retryAttempts: 2,
      retryDelay: 1000,
      timeoutMs: 30000,
      enableChunking: true,
      chunkSize: 10,
      preserveOrder: true,
      ...config,
    };
  }

  /**
   * Add items to the batch
   */
  public addItems(inputs: string[], metadata?: Omit<BatchItem['metadata'], 'timestamp'>): string[] {
    const ids: string[] = [];

    for (const input of inputs) {
      if (this.items.size >= this.config.maxQueueSize) {
        throw new Error(`Batch queue size limit (${this.config.maxQueueSize}) reached`);
      }

      const id = this.generateItemId();
      const item: BatchItem = {
        id,
        input,
        metadata: {
          timestamp: new Date(),
          ...metadata,
        },
        status: 'pending',
      };

      this.items.set(id, item);
      this.processingQueue.push(id);
      ids.push(id);
    }

    this.config.progressCallback?.(this);
    return ids;
  }

  /**
   * Add a single item to the batch
   */
  public addItem(input: string, metadata?: Omit<BatchItem['metadata'], 'timestamp'>): string {
    const ids = this.addItems([input], metadata);
    return ids[0];
  }

  /**
   * Process all items in the batch
   */
  public async process<T>(
    processor: (input: string, item: BatchItem) => Promise<T>
  ): Promise<BatchItem<T>[]> {
    if (this.isProcessing) {
      throw new Error('Batch processing is already in progress');
    }

    this.isProcessing = true;
    this.isPaused = false;
    this.startTime = new Date();
    this.endTime = undefined;
    this.processedCount = 0;
    this.processingTimes = [];
    this.abortController = new AbortController();

    try {
      const results: BatchItem<T>[] = [];

      if (this.config.preserveOrder) {
        // Process in order while respecting concurrency limits
        for (let i = 0; i < this.processingQueue.length; i += this.config.maxConcurrent) {
          if (this.abortController.signal.aborted) break;

          const chunk = this.processingQueue.slice(i, i + this.config.maxConcurrent);
          const chunkResults = await Promise.allSettled(
            chunk.map((id) => this.processItem(id, processor))
          );

          results.push(
            ...chunkResults.map((result, index) => {
              const itemId = chunk[index];
              const item = this.items.get(itemId)! as BatchItem<T>;

              if (result.status === 'rejected') {
                item.status = 'failed';
                item.error =
                  result.reason instanceof Error ? result.reason : new Error(String(result.reason));
                item.endTime = Date.now();
              }

              return item;
            })
          );
        }
      } else {
        // Process without order preservation
        const processingPromises: Promise<void>[] = [];

        const processNext = (): void => {
          while (
            this.processingSet.size < this.config.maxConcurrent &&
            this.processingQueue.length > 0
          ) {
            const itemId = this.processingQueue.shift()!;
            const promise = this.processItem(itemId, processor)
              .then(() => {
                this.processingSet.delete(itemId);
                processNext(); // Start next item when one completes
              })
              .catch((error) => {
                this.processingSet.delete(itemId);
                console.error(`Processing failed for item ${itemId}:`, error);
                processNext();
              });

            this.processingSet.add(itemId);
            processingPromises.push(promise);
          }
        };

        processNext();
        await Promise.all(processingPromises);

        // Collect results
        for (const item of this.items.values()) {
          results.push(item as BatchItem<T>);
        }
      }

      this.endTime = new Date();
      this.isProcessing = false;

      return results.sort((a, b) => {
        const aIndex = this.processingQueue.indexOf(a.id);
        const bIndex = this.processingQueue.indexOf(b.id);
        return aIndex - bIndex;
      });
    } catch (error) {
      this.isProcessing = false;
      throw error;
    }
  }

  /**
   * Process a single item
   */
  private async processItem<T>(
    itemId: string,
    processor: (input: string, item: BatchItem) => Promise<T>
  ): Promise<void> {
    const item = this.items.get(itemId);
    if (!item || item.status !== 'pending') return;

    item.status = 'processing';
    item.startTime = Date.now();

    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts <= this.config.retryAttempts) {
      try {
        if (this.abortController?.signal.aborted) {
          item.status = 'cancelled';
          return;
        }

        while (this.isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (this.abortController?.signal.aborted) {
            item.status = 'cancelled';
            return;
          }
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Processing timeout')), this.config.timeoutMs);
        });

        const result = await Promise.race([processor(item.input, item), timeoutPromise]);

        item.status = 'completed';
        item.result = result;
        item.endTime = Date.now();
        item.duration = item.endTime - item.startTime;

        this.processingTimes.push(item.duration);
        this.processedCount++;

        this.config.itemCallback?.(item, this);
        this.config.progressCallback?.(this);

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;

        if (attempts <= this.config.retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    // All retries failed
    item.status = 'failed';
    item.error = lastError;
    item.endTime = Date.now();
    item.duration = item.endTime - item.startTime;

    this.config.itemCallback?.(item, this);
    this.config.progressCallback?.(this);
  }

  /**
   * Pause processing
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume processing
   */
  public resume(): void {
    this.isPaused = false;
  }

  /**
   * Cancel all processing
   */
  public cancel(): void {
    this.abortController?.abort();
    this.isProcessing = false;
    this.isPaused = false;
    this.endTime = new Date();

    // Mark pending items as cancelled
    for (const item of this.items.values()) {
      if (item.status === 'pending' || item.status === 'processing') {
        item.status = 'cancelled';
      }
    }
  }

  /**
   * Clear all items
   */
  public clear(): void {
    this.cancel();
    this.items.clear();
    this.processingQueue.length = 0;
    this.processingSet.clear();
    this.processedCount = 0;
    this.processingTimes.length = 0;
  }

  /**
   * Remove completed items
   */
  public removeCompleted(): void {
    for (const [id, item] of this.items.entries()) {
      if (item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') {
        this.items.delete(id);
        const index = this.processingQueue.indexOf(id);
        if (index > -1) {
          this.processingQueue.splice(index, 1);
        }
      }
    }
  }

  /**
   * Get processing statistics
   */
  public getStatistics(): BatchStatistics {
    const items = Array.from(this.items.values());
    const processedItems = items.filter(
      (item) =>
        item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled'
    );
    const successfulItems = items.filter((item) => item.status === 'completed');
    const failedItems = items.filter((item) => item.status === 'failed');
    const pendingItems = items.filter((item) => item.status === 'pending');

    const averageProcessingTime =
      this.processingTimes.length > 0
        ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
        : 0;

    const totalProcessingTime =
      this.startTime && this.endTime
        ? this.endTime.getTime() - this.startTime.getTime()
        : this.startTime
          ? Date.now() - this.startTime.getTime()
          : 0;

    const itemsPerSecond =
      totalProcessingTime > 0 ? (processedItems.length / totalProcessingTime) * 1000 : 0;

    let estimatedTimeRemaining: number | undefined;
    if (pendingItems.length > 0 && averageProcessingTime > 0) {
      estimatedTimeRemaining = pendingItems.length * averageProcessingTime;
    }

    return {
      totalItems: items.length,
      processedItems: processedItems.length,
      successfulItems: successfulItems.length,
      failedItems: failedItems.length,
      pendingItems: pendingItems.length,
      averageProcessingTime,
      totalProcessingTime,
      itemsPerSecond,
      startTime: this.startTime,
      endTime: this.endTime,
      estimatedTimeRemaining,
    };
  }

  /**
   * Get all items
   */
  public getItems(): BatchItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get item by ID
   */
  public getItem(id: string): BatchItem | undefined {
    return this.items.get(id);
  }

  /**
   * Get items by status
   */
  public getItemsByStatus(status: BatchItem['status']): BatchItem[] {
    return Array.from(this.items.values()).filter((item) => item.status === status);
  }

  /**
   * Get processing progress (0-100)
   */
  public getProgress(): number {
    if (this.items.size === 0) return 0;

    const stats = this.getStatistics();
    return (stats.processedItems / stats.totalItems) * 100;
  }

  /**
   * Check if processing is complete
   */
  public isComplete(): boolean {
    return (
      this.items.size > 0 &&
      Array.from(this.items.values()).every(
        (item) =>
          item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled'
      )
    );
  }

  /**
   * Check if processing is active
   */
  public isActive(): boolean {
    return this.isProcessing && !this.isPaused;
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Generate unique item ID
   */
  private generateItemId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export batch data
   */
  public export(): {
    items: BatchItem[];
    config: BatchConfig;
    statistics: BatchStatistics;
  } {
    return {
      items: this.getItems(),
      config: this.config,
      statistics: this.getStatistics(),
    };
  }

  /**
   * Import batch data
   */
  public import(data: {
    items: BatchItem[];
    config?: Partial<BatchConfig>;
  }): void {
    this.clear();

    if (data.config) {
      this.updateConfig(data.config);
    }

    for (const item of data.items) {
      this.items.set(item.id, item);
      if (item.status === 'pending') {
        this.processingQueue.push(item.id);
      }
    }

    this.config.progressCallback?.(this);
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.cancel();
    this.items.clear();
    this.processingQueue.length = 0;
    this.processingSet.clear();
  }
}
