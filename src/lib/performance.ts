import type { PerformanceMeasurement } from './types'

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private measurements: PerformanceMeasurement[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private constructor() {}

  async measurePerformance<T>(
    operation: string,
    fn: () => T | Promise<T>
  ): Promise<{ result: T; measurement: PerformanceMeasurement }> {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    try {
      const result = await fn()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()

      const measurement: PerformanceMeasurement = {
        operation,
        duration: endTime - startTime,
        memoryUsage: endMemory ? endMemory - startMemory : undefined
      }

      this.measurements.push(measurement)

      return { result, measurement }
    } catch (error) {
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()

      const measurement: PerformanceMeasurement = {
        operation,
        duration: endTime - startTime,
        memoryUsage: endMemory ? endMemory - startMemory : undefined
      }

      this.measurements.push(measurement)
      throw error
    }
  }

  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize
    }
    return undefined
  }

  getMeasurements(operation?: string): PerformanceMeasurement[] {
    if (operation) {
      return this.measurements.filter(m => m.operation === operation)
    }
    return [...this.measurements]
  }

  getLastMeasurement(operation?: string): PerformanceMeasurement | null {
    const measurements = this.getMeasurements(operation)
    return measurements.length > 0 ? measurements[measurements.length - 1] : null
  }

  getAverageDuration(operation: string): number {
    const measurements = this.getMeasurements(operation)
    if (measurements.length === 0) {
      return 0
    }
    const total = measurements.reduce((sum, m) => sum + m.duration, 0)
    return total / measurements.length
  }

  getMaxDuration(operation: string): number {
    const measurements = this.getMeasurements(operation)
    if (measurements.length === 0) {
      return 0
    }
    return Math.max(...measurements.map(m => m.duration))
  }

  getMinDuration(operation: string): number {
    const measurements = this.getMeasurements(operation)
    if (measurements.length === 0) {
      return 0
    }
    return Math.min(...measurements.map(m => m.duration))
  }

  clearMeasurements(operation?: string): void {
    if (operation) {
      this.measurements = this.measurements.filter(m => m.operation !== operation)
    } else {
      this.measurements = []
    }
  }

  getPerformanceReport(): {
    totalOperations: number
    averageDuration: number
    maxDuration: number
    minDuration: number
    byOperation: Record<string, {
      count: number
      averageDuration: number
      maxDuration: number
      minDuration: number
      totalMemoryDelta: number
    }>
  } {
    const byOperation: Record<string, {
      count: number
      averageDuration: number
      maxDuration: number
      minDuration: number
      totalMemoryDelta: number
    }> = {}

    this.measurements.forEach(measurement => {
      if (!byOperation[measurement.operation]) {
        byOperation[measurement.operation] = {
          count: 0,
          averageDuration: 0,
          maxDuration: 0,
          minDuration: Infinity,
          totalMemoryDelta: 0
        }
      }

      const op = byOperation[measurement.operation]
      op.count++
      op.maxDuration = Math.max(op.maxDuration, measurement.duration)
      op.minDuration = Math.min(op.minDuration, measurement.duration)
      if (measurement.memoryUsage) {
        op.totalMemoryDelta += measurement.memoryUsage
      }
    })

    // Calculate averages
    Object.keys(byOperation).forEach(operation => {
      const op = byOperation[operation]
      const operationMeasurements = this.measurements.filter(m => m.operation === operation)
      const totalDuration = operationMeasurements.reduce((sum, m) => sum + m.duration, 0)
      op.averageDuration = totalDuration / op.count
      if (op.minDuration === Infinity) {
        op.minDuration = 0
      }
    })

    const allDurations = this.measurements.map(m => m.duration)
    const averageDuration = allDurations.length > 0
      ? allDurations.reduce((sum, duration) => sum + duration, 0) / allDurations.length
      : 0

    return {
      totalOperations: this.measurements.length,
      averageDuration,
      maxDuration: Math.max(...allDurations, 0),
      minDuration: Math.min(...allDurations, 0),
      byOperation
    }
  }

  // Check if performance meets requirements
  checkPerformanceThresholds(thresholds: Record<string, number>): {
    passed: boolean
    failed: Array<{ operation: string; threshold: number; actual: number }>
  } {
    const failed: Array<{ operation: string; threshold: number; actual: number }> = []

    Object.entries(thresholds).forEach(([operation, threshold]) => {
      const averageDuration = this.getAverageDuration(operation)
      if (averageDuration > threshold) {
        failed.push({
          operation,
          threshold,
          actual: averageDuration
        })
      }
    })

    return {
      passed: failed.length === 0,
      failed
    }
  }

  // Export measurements for analysis
  exportMeasurements(): string {
    return JSON.stringify({
      measurements: this.measurements,
      report: this.getPerformanceReport(),
      timestamp: new Date().toISOString()
    }, null, 2)
  }

  // Create performance mark for manual timing
  createMark(operation: string): string {
    const markName = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(markName)
    }
    return markName
  }

  // Measure time between marks
  measureBetweenMarks(startMark: string, endMark: string, operation: string): number | null {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        const measureName = `${operation}_${Date.now()}`
        performance.measure(measureName, startMark, endMark)
        const entries = performance.getEntriesByName(measureName, 'measure')
        if (entries.length > 0) {
          const duration = entries[0].duration

          const measurement: PerformanceMeasurement = {
            operation,
            duration,
            memoryUsage: this.getMemoryUsage()
          }

          this.measurements.push(measurement)
          return duration
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error)
      }
    }
    return null
  }
}

// Convenience functions
export const measurePerformance = async <T>(
  operation: string,
  fn: () => T | Promise<T>
): Promise<{ result: T; measurement: PerformanceMeasurement }> => {
  return PerformanceMonitor.getInstance().measurePerformance(operation, fn)
}

export const getPerformanceReport = () => {
  return PerformanceMonitor.getInstance().getPerformanceReport()
}

export const checkPerformanceThresholds = (thresholds: Record<string, number>) => {
  return PerformanceMonitor.getInstance().checkPerformanceThresholds(thresholds)
}

export const clearPerformanceMeasurements = (operation?: string) => {
  PerformanceMonitor.getInstance().clearMeasurements(operation)
}

// Performance thresholds based on requirements
export const PERFORMANCE_THRESHOLDS = {
  'json-parsing': 200, // 200ms for JSON parsing
  'file-processing': 50, // 50ms for file processing
  'json-rendering': 100, // 100ms for JSON rendering
  'file-upload': 500, // 500ms for file upload
  'search': 50 // 50ms for search operations
} as const