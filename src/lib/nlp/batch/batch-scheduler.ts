/**
 * Batch Scheduler
 * Advanced scheduling and prioritization for batch processing
 */

import { BatchProcessor, BatchItem, BatchConfig, BatchStatistics } from './batch-processor'

export interface ScheduledBatch {
  id: string
  name: string
  processor: BatchProcessor
  priority: number
  scheduledTime: Date
  maxDuration?: number
  dependencies?: string[]
  metadata?: {
    description?: string
    tags?: string[]
    created_by?: string
  }
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'
  startTime?: Date
  endTime?: Date
  progress?: number
  error?: Error
}

export interface SchedulerConfig {
  maxConcurrentBatches: number
  maxQueueSize: number
  defaultPriority: number
  enablePrioritization: boolean
  enableDependencies: boolean
  autoRetry: boolean
  retryAttempts: number
  retryDelay: number
  gcInterval: number
  maxCompletedBatches: number
}

export class BatchScheduler {
  private batches: Map<string, ScheduledBatch> = new Map()
  private runningBatches: Set<string> = new Set()
  private queue: string[] = []
  private config: SchedulerConfig
  private isRunning = false
  private gcTimer?: NodeJS.Timeout
  private processingTimer?: NodeJS.Timeout

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      maxConcurrentBatches: 2,
      maxQueueSize: 50,
      defaultPriority: 5,
      enablePrioritization: true,
      enableDependencies: true,
      autoRetry: true,
      retryAttempts: 2,
      retryDelay: 5000,
      gcInterval: 60000, // 1 minute
      maxCompletedBatches: 100,
      ...config,
    }

    this.startGarbageCollection()
    this.startProcessing()
  }

  /**
   * Schedule a new batch
   */
  public scheduleBatch(
    name: string,
    processor: BatchProcessor,
    options: {
      priority?: number
      scheduledTime?: Date
      maxDuration?: number
      dependencies?: string[]
      metadata?: ScheduledBatch['metadata']
    } = {}
  ): string {
    if (this.batches.size >= this.config.maxQueueSize) {
      throw new Error('Scheduler queue is full')
    }

    const id = this.generateBatchId()
    const batch: ScheduledBatch = {
      id,
      name,
      processor,
      priority: options.priority ?? this.config.defaultPriority,
      scheduledTime: options.scheduledTime ?? new Date(),
      maxDuration: options.maxDuration,
      dependencies: options.dependencies,
      metadata: options.metadata,
      status: 'scheduled',
    }

    this.batches.set(id, batch)
    this.addToQueue(id)

    return id
  }

  /**
   * Cancel a scheduled batch
   */
  public cancelBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId)
    if (!batch) return false

    if (batch.status === 'running') {
      batch.processor.cancel()
      this.runningBatches.delete(batchId)
    }

    batch.status = 'cancelled'
    batch.endTime = new Date()
    this.removeFromQueue(batchId)

    return true
  }

  /**
   * Pause a running batch
   */
  public pauseBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId)
    if (!batch || batch.status !== 'running') return false

    batch.processor.pause()
    batch.status = 'paused'
    this.runningBatches.delete(batchId)
    this.addToQueue(batchId) // Re-queue for later processing

    return true
  }

  /**
   * Resume a paused batch
   */
  public resumeBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId)
    if (!batch || batch.status !== 'paused') return false

    batch.processor.resume()
    // Will be picked up by the scheduler
    return true
  }

  /**
   * Get batch by ID
   */
  public getBatch(batchId: string): ScheduledBatch | undefined {
    return this.batches.get(batchId)
  }

  /**
   * Get all batches
   */
  public getBatches(): ScheduledBatch[] {
    return Array.from(this.batches.values())
  }

  /**
   * Get batches by status
   */
  public getBatchesByStatus(status: ScheduledBatch['status']): ScheduledBatch[] {
    return Array.from(this.batches.values()).filter(batch => batch.status === status)
  }

  /**
   * Get scheduler statistics
   */
  public getStatistics(): {
    totalBatches: number
    scheduledBatches: number
    runningBatches: number
    completedBatches: number
    failedBatches: number
    cancelledBatches: number
    pausedBatches: number
    queueLength: number
    averageProcessingTime: number
    throughput: number
  } {
    const batches = Array.from(this.batches.values())
    const stats = {
      totalBatches: batches.length,
      scheduledBatches: batches.filter(b => b.status === 'scheduled').length,
      runningBatches: batches.filter(b => b.status === 'running').length,
      completedBatches: batches.filter(b => b.status === 'completed').length,
      failedBatches: batches.filter(b => b.status === 'failed').length,
      cancelledBatches: batches.filter(b => b.status === 'cancelled').length,
      pausedBatches: batches.filter(b => b.status === 'paused').length,
      queueLength: this.queue.length,
      averageProcessingTime: 0,
      throughput: 0,
    }

    // Calculate average processing time
    const completedBatches = batches.filter(b => b.status === 'completed' && b.startTime && b.endTime)
    if (completedBatches.length > 0) {
      const totalTime = completedBatches.reduce((sum, batch) => {
        return sum + (batch.endTime!.getTime() - batch.startTime!.getTime())
      }, 0)
      stats.averageProcessingTime = totalTime / completedBatches.length
    }

    // Calculate throughput (batches per hour)
    const oneHourAgo = new Date(Date.now() - 3600000)
    const recentBatches = completedBatches.filter(b => b.endTime! >= oneHourAgo)
    stats.throughput = recentBatches.length

    return stats
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    this.isRunning = true
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    this.isRunning = false

    // Cancel all running batches
    for (const batchId of this.runningBatches) {
      this.cancelBatch(batchId)
    }
  }

  /**
   * Add batch to queue with priority ordering
   */
  private addToQueue(batchId: string): void {
    if (!this.config.enablePrioritization) {
      this.queue.push(batchId)
      return
    }

    const batch = this.batches.get(batchId)
    if (!batch) return

    // Insert in priority order (higher priority first)
    let insertIndex = this.queue.length
    for (let i = 0; i < this.queue.length; i++) {
      const queuedBatch = this.batches.get(this.queue[i])
      if (queuedBatch && queuedBatch.priority < batch.priority) {
        insertIndex = i
        break
      }
    }

    this.queue.splice(insertIndex, 0, batchId)
  }

  /**
   * Remove batch from queue
   */
  private removeFromQueue(batchId: string): void {
    const index = this.queue.indexOf(batchId)
    if (index > -1) {
      this.queue.splice(index, 1)
    }
  }

  /**
   * Check if batch dependencies are satisfied
   */
  private checkDependencies(batch: ScheduledBatch): boolean {
    if (!batch.dependencies || batch.dependencies.length === 0) {
      return true
    }

    return batch.dependencies.every(depId => {
      const dep = this.batches.get(depId)
      return dep && dep.status === 'completed'
    })
  }

  /**
   * Check if batch is ready to run
   */
  private isReadyToRun(batch: ScheduledBatch): boolean {
    if (batch.status !== 'scheduled') return false
    if (batch.scheduledTime > new Date()) return false
    if (this.config.enableDependencies && !this.checkDependencies(batch)) return false
    if (this.runningBatches.size >= this.config.maxConcurrentBatches) return false

    return true
  }

  /**
   * Process next batch in queue
   */
  private async processNextBatch(): Promise<void> {
    if (!this.isRunning) return
    if (this.runningBatches.size >= this.config.maxConcurrentBatches) return

    // Find next ready batch
    let nextBatchId: string | undefined
    for (const batchId of this.queue) {
      const batch = this.batches.get(batchId)
      if (batch && this.isReadyToRun(batch)) {
        nextBatchId = batchId
        break
      }
    }

    if (!nextBatchId) return

    const batch = this.batches.get(nextBatchId)!
    this.removeFromQueue(nextBatchId)
    this.runningBatches.add(nextBatchId)

    batch.status = 'running'
    batch.startTime = new Date()

    try {
      // Set up timeout
      const timeoutPromise = batch.maxDuration ? new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Batch timeout')), batch.maxDuration)
      }) : null

      // Process the batch
      const processPromise = batch.processor.process(() => Promise.resolve()) // Dummy processor

      if (timeoutPromise) {
        await Promise.race([processPromise, timeoutPromise])
      } else {
        await processPromise
      }

      batch.status = 'completed'
      batch.endTime = new Date()
      batch.progress = 100

    } catch (error) {
      batch.status = 'failed'
      batch.endTime = new Date()
      batch.error = error instanceof Error ? error : new Error(String(error))

      // Auto-retry if enabled
      if (this.config.autoRetry) {
        const retryCount = (batch.metadata?.retryCount as number) || 0
        if (retryCount < this.config.retryAttempts) {
          batch.metadata = { ...batch.metadata, retryCount: retryCount + 1 }
          batch.status = 'scheduled'
          batch.scheduledTime = new Date(Date.now() + this.config.retryDelay)
          this.addToQueue(nextBatchId)
        }
      }
    } finally {
      this.runningBatches.delete(nextBatchId)
    }
  }

  /**
   * Start processing loop
   */
  private startProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.processNextBatch().catch(console.error)
    }, 1000)
  }

  /**
   * Start garbage collection
   */
  private startGarbageCollection(): void {
    this.gcTimer = setInterval(() => {
      this.garbageCollect()
    }, this.config.gcInterval)
  }

  /**
   * Clean up old completed batches
   */
  private garbageCollect(): void {
    const completedBatches = Array.from(this.batches.entries())
      .filter(([_, batch]) =>
        batch.status === 'completed' ||
        batch.status === 'failed' ||
        batch.status === 'cancelled'
      )
      .sort(([_, a], [__, b]) => {
        const timeA = a.endTime?.getTime() || 0
        const timeB = b.endTime?.getTime() || 0
        return timeA - timeB
      })

    // Remove excess completed batches
    if (completedBatches.length > this.config.maxCompletedBatches) {
      const toRemove = completedBatches.slice(0, completedBatches.length - this.config.maxCompletedBatches)
      for (const [batchId] of toRemove) {
        this.batches.delete(batchId)
      }
    }
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stop()

    if (this.gcTimer) {
      clearInterval(this.gcTimer)
    }

    if (this.processingTimer) {
      clearInterval(this.processingTimer)
    }

    // Cancel all batches
    for (const batch of this.batches.values()) {
      batch.processor.dispose()
    }

    this.batches.clear()
    this.queue.length = 0
    this.runningBatches.clear()
  }
}
