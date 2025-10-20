# WASM Memory Optimization

This module provides comprehensive memory optimization solutions for WASM modules, including monitoring, leak detection, optimized data structures, memory management, and performance testing.

## Features

### 1. Memory Monitoring and Profiling (`memory-monitor.ts`)
- Real-time memory usage tracking
- Memory profiling with detailed metrics
- Automatic memory warnings with configurable thresholds
- Memory efficiency scoring
- Historical memory usage tracking

### 2. Memory Leak Detection (`memory-leak-detector.ts`)
- Automatic leak pattern detection
- Multiple leak pattern types (growth, fragmentation, circular references, resource leaks)
- Leak severity assessment
- Automatic prevention actions
- Detailed leak analysis and recommendations

### 3. Optimized Data Structures (`memory-optimized-structures.ts`)
- Memory-efficient alternatives to standard JavaScript structures
- Object pooling for reduced allocation overhead
- Buffer pooling for efficient memory management
- Compact implementations for arrays, objects, maps, and sets
- Memory usage tracking for all structures

### 4. Memory Management and Garbage Collection (`memory-manager.ts`)
- Configurable memory limits and quotas
- Automatic garbage collection with multiple strategies
- Memory pressure handling with custom handlers
- Memory budget tracking
- Resource cleanup and disposal management

### 5. Memory Performance Testing (`memory-performance-tester.ts`)
- Comprehensive memory performance test suite
- Built-in test scenarios (allocation, stress, leak detection)
- Custom test creation and execution
- Performance metrics and scoring
- Test result analysis and recommendations

## Quick Start

### Basic Usage

```typescript
import { 
  initializeMemoryOptimization, 
  getMemoryReport,
  cleanupMemoryOptimization 
} from './optimization'
import { myWasmModule } from './my-wasm-module'

// Initialize memory optimization for a WASM module
initializeMemoryOptimization(myWasmModule, {
  enableMonitoring: true,
  enableLeakDetection: true,
  enableMemoryManagement: true,
  memoryLimit: 64 * 1024 * 1024 // 64MB
})

// Get comprehensive memory report
const report = getMemoryReport(myWasmModule.id)
console.log('Memory Report:', report)

// Cleanup when done
cleanupMemoryOptimization(myWasmModule.id)
```

### Memory Monitoring

```typescript
import { wasmMemoryMonitor, startMonitoring } from './optimization'

// Start monitoring with custom limits
startMonitoring(myWasmModule, 32 * 1024 * 1024) // 32MB limit

// Get current memory statistics
const stats = getMemoryStats(myWasmModule.id)
console.log(`Memory usage: ${stats.used} / ${stats.allocated}`)

// Listen for memory warnings
wasmMemoryMonitor.onWarning(warning => {
  console.warn(`Memory warning: ${warning.message}`)
})
```

### Memory Leak Detection

```typescript
import { 
  memoryLeakDetector, 
  startLeakMonitoring, 
  detectMemoryLeaks 
} from './optimization'

// Start leak detection
startLeakMonitoring(myWasmModule)

// Manually check for leaks
const leakResult = detectMemoryLeaks(myWasmModule.id)
if (leakResult.hasLeak) {
  console.error('Memory leak detected:', leakResult.recommendations)
}
```

### Using Optimized Data Structures

```typescript
import { 
  createCompactArray, 
  createCompactMap, 
  createCache,
  createMemoryPool 
} from './optimization'

// Use memory-efficient array
const array = createCompactArray<number>()
array.push(42)
array.push(3.14)

// Use memory-efficient map
const map = createCompactMap<string, number>()
map.set('key1', 100)
map.set('key2', 200)

// Use memory-efficient cache
const cache = createCache<string, any>(100, 300000) // 100 items, 5 minute TTL
cache.set('expensive_data', computeExpensiveData())

// Use object pooling
const pool = createMemoryPool(
  () => new ExpensiveObject(),
  (obj) => obj.reset(),
  50 // max pool size
)

const obj = pool.acquire()
// ... use object
pool.release(obj)
```

### Memory Management

```typescript
import { 
  wasmMemoryManager, 
  registerModule, 
  canAllocate, 
  recordAllocation 
} from './optimization'

// Register module with custom limits
registerModule(myWasmModule, {
  hardLimit: 128 * 1024 * 1024, // 128MB
  softLimit: 96 * 1024 * 1024,  // 96MB
  criticalLimit: 112 * 1024 * 1024 // 112MB
})

// Check if allocation is allowed
if (canAllocate(myWasmModule.id, 1024 * 1024)) {
  recordAllocation(myWasmModule.id, 1024 * 1024)
  // ... perform allocation
}

// Get aggregate statistics
const stats = getAggregateStats()
console.log(`Total memory usage: ${stats.totalUsed} bytes`)
console.log(`Average efficiency: ${stats.averageEfficiency}%`)
```

### Performance Testing

```typescript
import { 
  memoryPerformanceTester, 
  getBuiltInTests, 
  runMemoryPerformanceTestSuite 
} from './optimization'

// Create test suite
const suite = memoryPerformanceTester.createTestSuite(
  'My Memory Tests',
  'Testing memory performance of my module'
)

// Add built-in tests
const builtInTests = getBuiltInTests()
memoryPerformanceTester.addTestToSuite('My Memory Tests', builtInTests.basicAllocation)
memoryPerformanceTester.addTestToSuite('My Memory Tests', builtInTests.stress)

// Run test suite
const results = await runMemoryPerformanceTestSuite(
  myWasmModule, 
  'My Memory Tests', 
  wasmMemoryManager
)

console.log('Test Results:', results.summary)
console.log('Recommendations:', results.summary.recommendations)
```

## Configuration

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  monitoring: {
    intervalMs: 1000,
    thresholds: {
      low: 60,    // 60% of limit
      medium: 75, // 75% of limit
      high: 85,   // 85% of limit
      critical: 95 // 95% of limit
    },
    maxHistorySize: 1000,
    leakDetection: true,
    autoGC: true,
    gcThreshold: 80,
    profiling: true,
    maxProfilingDuration: 60000 // 1 minute
  },
  leakDetection: {
    minSamples: 10,
    detectionWindowMs: 60000, // 1 minute
    growthThreshold: 1024, // 1KB/s
    fragmentationThreshold: 0.7,
    continuousMonitoring: true,
    autoPrevention: true
  },
  memoryManagement: {
    limits: {
      hardLimit: 64 * 1024 * 1024,     // 64MB
      softLimit: 48 * 1024 * 1024,     // 48MB
      criticalLimit: 56 * 1024 * 1024, // 56MB
      growthRateLimit: 1024 * 1024,    // 1MB/s
      maxAllocationSize: 10 * 1024 * 1024, // 10MB
      quotaResetInterval: 60000        // 1 minute
    },
    gc: {
      autoGC: true,
      gcThreshold: 75,
      aggressiveGCThreshold: 90,
      minGCInterval: 5000, // 5 seconds
      strategy: 'balanced'
    }
  }
}
```

### Custom Configuration

```typescript
import { WasmMemoryMonitor, MemoryLeakDetector, WasmMemoryManager } from './optimization'

// Custom memory monitor
const monitor = new WasmMemoryMonitor({
  intervalMs: 500,
  thresholds: {
    low: 40,
    medium: 60,
    high: 80,
    critical: 95
  }
})

// Custom leak detector
const leakDetector = new MemoryLeakDetector({
  minSamples: 20,
  detectionWindowMs: 120000, // 2 minutes
  growthThreshold: 2048, // 2KB/s
  autoPrevention: true
})

// Custom memory manager
const memoryManager = new WasmMemoryManager({
  limits: {
    hardLimit: 128 * 1024 * 1024, // 128MB
    softLimit: 96 * 1024 * 1024,  // 96MB
    criticalLimit: 112 * 1024 * 1024 // 112MB
  },
  gc: {
    strategy: 'aggressive',
    incrementalGC: true,
    enableCompaction: true
  }
})
```

## API Reference

### Memory Monitor

- `WasmMemoryMonitor` - Main memory monitoring class
- `startMonitoring(module, limit)` - Start monitoring a module
- `stopMonitoring(moduleId)` - Stop monitoring a module
- `getMemoryStats(moduleId)` - Get current memory statistics
- `getMemoryProfile(moduleId)` - Get memory profile
- `onWarning(callback)` - Register warning callback

### Memory Leak Detector

- `MemoryLeakDetector` - Leak detection class
- `startLeakMonitoring(module)` - Start leak detection
- `detectMemoryLeaks(moduleId)` - Detect leaks in a module
- `getLeakHistory(moduleId)` - Get leak history

### Memory Manager

- `WasmMemoryManager` - Memory management class
- `registerModule(module, limits)` - Register module with limits
- `canAllocate(moduleId, size)` - Check if allocation is allowed
- `recordAllocation(moduleId, size)` - Record allocation
- `triggerGC(moduleId, aggressive)` - Trigger garbage collection

### Data Structures

- `CompactArray<T>` - Memory-efficient array
- `CompactMap<K, V>` - Memory-efficient map
- `CompactSet<T>` - Memory-efficient set
- `MemoryPool<T>` - Object pooling
- `BufferPool` - Buffer pooling
- `MemoryEfficientCache<K, V>` - LRU cache with TTL

### Performance Testing

- `MemoryPerformanceTester` - Performance testing class
- `createTestSuite(name, description)` - Create test suite
- `runMemoryPerformanceTest(module, test, manager)` - Run single test
- `runMemoryPerformanceTestSuite(module, suite, manager)` - Run test suite

## Best Practices

### 1. Memory Monitoring
- Start monitoring early in the module lifecycle
- Use appropriate thresholds for your application
- Listen to memory warnings and take appropriate action

### 2. Leak Prevention
- Use object pooling for frequently allocated objects
- Ensure proper cleanup of event listeners and callbacks
- Use weak references where appropriate

### 3. Data Structure Selection
- Use `CompactArray` for large datasets with primitive values
- Use `CompactMap` for key-value mappings with string keys
- Use `MemoryEfficientCache` for frequently accessed data with TTL
- Use object pooling for expensive-to-create objects

### 4. Memory Management
- Set appropriate memory limits based on expected usage
- Use memory budgets for predictable resource usage
- Implement graceful degradation when limits are reached

### 5. Performance Testing
- Test with realistic data sizes and patterns
- Include stress tests to find edge cases
- Monitor memory efficiency and leak prevention

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for memory leaks using the leak detector
   - Optimize data structures and algorithms
   - Implement caching and pooling strategies

2. **Frequent Garbage Collection**
   - Reduce allocation frequency
   - Use object pooling
   - Implement memory compaction

3. **Memory Pressure Events**
   - Increase memory limits if appropriate
   - Optimize memory usage patterns
   - Implement better cleanup procedures

4. **Performance Test Failures**
   - Adjust test parameters for realistic scenarios
   - Check memory limits and quotas
   - Verify test environment configuration

### Debugging Tools

```typescript
// Get detailed memory report
const report = getMemoryReport(moduleId)
console.log('Memory Report:', report)

// Check for memory leaks
const leakResult = detectMemoryLeaks(moduleId)
if (leakResult.hasLeak) {
  console.error('Leaks found:', leakResult.patterns)
}

// Run performance tests
const results = await runMemoryPerformanceTestSuite(module, 'tests', manager)
console.log('Performance issues:', results.summary.recommendations)
```

## Examples

See the `__tests__` directory for comprehensive examples of all features and configurations.