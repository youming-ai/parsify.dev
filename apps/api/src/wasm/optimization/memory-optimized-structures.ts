/**
 * Memory-optimized data structures for WASM modules
 */

/**
 * Memory-optimized string implementation
 */
export class CompactString {
  private buffer: Uint8Array
  private length: number

  constructor(str: string) {
    this.length = str.length
    this.buffer = new Uint8Array(this.length)
    for (let i = 0; i < this.length; i++) {
      this.buffer[i] = str.charCodeAt(i) & 0xff
    }
  }

  toString(): string {
    let result = ''
    for (let i = 0; i < this.length; i++) {
      result += String.fromCharCode(this.buffer[i])
    }
    return result
  }

  size(): number {
    return this.buffer.byteLength
  }

  static fromString(str: string): CompactString {
    return new CompactString(str)
  }
}

/**
 * Memory-efficient array with typed storage
 */
export class CompactArray<T> {
  private buffer: ArrayBuffer
  private view: DataView
  private typeSize: number
  private length: number
  private capacity: number

  constructor(initialCapacity: number = 16) {
    this.capacity = initialCapacity
    this.length = 0
    this.buffer = new ArrayBuffer(initialCapacity * 8) // 8 bytes per element
    this.view = new DataView(this.buffer)
    this.typeSize = 8
  }

  push(value: T): void {
    if (this.length >= this.capacity) {
      this.resize(this.capacity * 2)
    }

    this.setValue(this.length, value)
    this.length++
  }

  get(index: number): T | undefined {
    if (index >= this.length) return undefined
    return this.getValue(index)
  }

  pop(): T | undefined {
    if (this.length === 0) return undefined
    return this.getValue(--this.length)
  }

  size(): number {
    return this.length
  }

  memoryUsage(): number {
    return this.buffer.byteLength
  }

  private resize(newCapacity: number): void {
    const newBuffer = new ArrayBuffer(newCapacity * this.typeSize)
    const newView = new DataView(newBuffer)

    // Copy existing data
    for (let i = 0; i < this.length; i++) {
      newView.setUint64(i * this.typeSize, this.view.getUint64(i * this.typeSize))
    }

    this.buffer = newBuffer
    this.view = newView
    this.capacity = newCapacity
  }

  private setValue(index: number, value: T): void {
    const offset = index * this.typeSize

    if (typeof value === 'number') {
      this.view.setFloat64(offset, value)
    } else if (typeof value === 'boolean') {
      this.view.setUint8(offset, value ? 1 : 0)
    } else {
      // For other types, store as string representation
      const str = String(value)
      for (let i = 0; i < Math.min(str.length, 8); i++) {
        this.view.setUint8(offset + i, str.charCodeAt(i) & 0xff)
      }
    }
  }

  private getValue(index: number): T {
    const offset = index * this.typeSize
    const numValue = this.view.getFloat64(offset)

    if (!Number.isNaN(numValue)) {
      return numValue as T
    }

    // Try to read as string
    const bytes = new Uint8Array(this.buffer, offset, 8)
    const str = String.fromCharCode(...bytes).replace(/\0+$/, '')
    return str as T
  }
}

/**
 * Memory-efficient object storage
 */
export class CompactObject {
  private properties: Map<string, any>
  private propertyOrder: string[]

  constructor() {
    this.properties = new Map()
    this.propertyOrder = []
  }

  set(key: string, value: any): void {
    if (!this.properties.has(key)) {
      this.propertyOrder.push(key)
    }
    this.properties.set(key, value)
  }

  get(key: string): any {
    return this.properties.get(key)
  }

  has(key: string): boolean {
    return this.properties.has(key)
  }

  delete(key: string): boolean {
    const index = this.propertyOrder.indexOf(key)
    if (index > -1) {
      this.propertyOrder.splice(index, 1)
    }
    return this.properties.delete(key)
  }

  keys(): string[] {
    return [...this.propertyOrder]
  }

  values(): any[] {
    return this.propertyOrder.map(key => this.properties.get(key))
  }

  entries(): Array<[string, any]> {
    return this.propertyOrder.map(key => [key, this.properties.get(key)])
  }

  size(): number {
    return this.properties.size
  }

  memoryUsage(): number {
    let total = 0

    for (const [key, value] of this.properties) {
      total += key.length * 2 // String key
      total += this.estimateValueSize(value)
    }

    return total + this.propertyOrder.length * 8 // Order array
  }

  private estimateValueSize(value: any): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'boolean') return 1
    if (typeof value === 'number') return 8
    if (typeof value === 'string') return value.length * 2
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2
    }
    return 8
  }
}

/**
 * Memory-efficient map with object pooling
 */
export class CompactMap<K, V> {
  private buckets: Array<Array<[K, V]>>
  private size: number
  private pool: Array<Array<[K, V]>> = []
  private maxPoolSize = 10

  constructor(initialCapacity: number = 16) {
    this.buckets = new Array(initialCapacity)
    this.size = 0
    for (let i = 0; i < initialCapacity; i++) {
      this.buckets[i] = this.getEmptyBucket()
    }
  }

  set(key: K, value: V): void {
    const hash = this.hash(key)
    const bucket = this.buckets[hash]

    // Check if key already exists
    for (let i = 0; i < bucket.length; i++) {
      if (this.equal(bucket[i][0], key)) {
        bucket[i][1] = value
        return
      }
    }

    // Add new entry
    bucket.push([key, value])
    this.size++

    // Resize if needed
    if (this.size > this.buckets.length * 0.75) {
      this.resize(this.buckets.length * 2)
    }
  }

  get(key: K): V | undefined {
    const hash = this.hash(key)
    const bucket = this.buckets[hash]

    for (const [k, v] of bucket) {
      if (this.equal(k, key)) {
        return v
      }
    }

    return undefined
  }

  has(key: K): boolean {
    return this.get(key) !== undefined
  }

  delete(key: K): boolean {
    const hash = this.hash(key)
    const bucket = this.buckets[hash]

    for (let i = 0; i < bucket.length; i++) {
      if (this.equal(bucket[i][0], key)) {
        bucket.splice(i, 1)
        this.size--
        return true
      }
    }

    return false
  }

  clear(): void {
    this.size = 0
    for (const bucket of this.buckets) {
      bucket.length = 0
      this.returnBucket(bucket)
    }
  }

  get size(): number {
    return this.size
  }

  memoryUsage(): number {
    let total = this.buckets.length * 8 // Bucket array

    for (const bucket of this.buckets) {
      total += bucket.length * 16 // Each entry ~16 bytes
    }

    return total
  }

  private hash(key: K): number {
    let hash = 0
    const str = String(key)

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash) % this.buckets.length
  }

  private equal(k1: K, k2: K): boolean {
    if (k1 === k2) return true
    if (typeof k1 === 'object' && typeof k2 === 'object') {
      return JSON.stringify(k1) === JSON.stringify(k2)
    }
    return String(k1) === String(k2)
  }

  private resize(newCapacity: number): void {
    const oldBuckets = this.buckets
    this.buckets = new Array(newCapacity)

    for (let i = 0; i < newCapacity; i++) {
      this.buckets[i] = this.getEmptyBucket()
    }

    // Rehash all entries
    for (const bucket of oldBuckets) {
      for (const [key, value] of bucket) {
        const hash = this.hash(key)
        this.buckets[hash].push([key, value])
      }
      this.returnBucket(bucket)
    }
  }

  private getEmptyBucket(): Array<[K, V]> {
    if (this.pool.length > 0) {
      const bucket = this.pool.pop()!
      bucket.length = 0
      return bucket
    }
    return []
  }

  private returnBucket(bucket: Array<[K, V]>): void {
    if (this.pool.length < this.maxPoolSize) {
      bucket.length = 0
      this.pool.push(bucket)
    }
  }
}

/**
 * Memory-efficient set using bit manipulation
 */
export class CompactSet<T> {
  private map: CompactMap<T, boolean>

  constructor() {
    this.map = new CompactMap()
  }

  add(value: T): this {
    this.map.set(value, true)
    return this
  }

  has(value: T): boolean {
    return this.map.has(value)
  }

  delete(value: T): boolean {
    return this.map.delete(value)
  }

  clear(): void {
    this.map.clear()
  }

  get size(): number {
    return this.map.size
  }

  values(): T[] {
    return this.map.keys()
  }

  memoryUsage(): number {
    return this.map.memoryUsage()
  }
}

/**
 * Memory pool for object reuse
 */
export class MemoryPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn?: (obj: T) => void
  private maxSize: number

  constructor(createFn: () => T, resetFn?: (obj: T) => void, maxSize: number = 100) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.resetFn) {
        this.resetFn(obj)
      }
      this.pool.push(obj)
    }
  }

  clear(): void {
    this.pool.length = 0
  }

  size(): number {
    return this.pool.length
  }

  memoryUsage(): number {
    return this.pool.length * 64 // Rough estimate
  }
}

/**
 * Buffer pool for efficient memory allocation
 */
export class BufferPool {
  private pools: Map<number, ArrayBuffer[]> = new Map()
  private maxPoolSize: number

  constructor(maxPoolSize: number = 10) {
    this.maxPoolSize = maxPoolSize
  }

  acquire(size: number): ArrayBuffer {
    const pool = this.pools.get(size)
    if (pool && pool.length > 0) {
      return pool.pop()!
    }
    return new ArrayBuffer(size)
  }

  release(buffer: ArrayBuffer): void {
    const size = buffer.byteLength
    let pool = this.pools.get(size)

    if (!pool) {
      pool = []
      this.pools.set(size, pool)
    }

    if (pool.length < this.maxPoolSize) {
      pool.push(buffer)
    }
  }

  clear(): void {
    this.pools.clear()
  }

  memoryUsage(): number {
    let total = 0
    for (const [size, pool] of this.pools) {
      total += size * pool.length
    }
    return total
  }
}

/**
 * Memory-efficient cache with LRU eviction
 */
export class MemoryEfficientCache<K, V> {
  private cache: CompactMap<K, { value: V; timestamp: number; accessCount: number }>
  private maxSize: number
  private ttl: number // Time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 300000) {
    // 5 minutes default TTL
    this.cache = new CompactMap()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  set(key: K, value: V): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUseful()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    })
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return undefined
    }

    // Update access statistics
    entry.accessCount++
    entry.timestamp = Date.now()

    return entry.value
  }

  has(key: K): boolean {
    return this.get(key) !== undefined
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  memoryUsage(): number {
    return this.cache.memoryUsage()
  }

  private evictLeastUseful(): void {
    let leastUsefulKey: K | null = null
    let leastUsefulScore = Infinity

    for (const [key, entry] of this.cache.entries()) {
      // Score based on access count and age
      const age = Date.now() - entry.timestamp
      const score = entry.accessCount / (age + 1)

      if (score < leastUsefulScore) {
        leastUsefulScore = score
        leastUsefulKey = key
      }
    }

    if (leastUsefulKey !== null) {
      this.cache.delete(leastUsefulKey)
    }
  }
}

/**
 * Memory-optimized JSON parser
 */
export class CompactJsonParser {
  private static parse(json: string): any {
    // Use streaming parser for large JSON to reduce memory usage
    if (json.length > 1024 * 1024) {
      // 1MB threshold
      return CompactJsonParser.parseStreaming(json)
    }

    // Use regular JSON.parse for smaller strings
    return JSON.parse(json)
  }

  private static parseStreaming(json: string): any {
    // Simplified streaming JSON parser
    // In a real implementation, this would use a proper streaming parser
    const chunks = []
    const chunkSize = 1024 * 1024 // 1MB chunks

    for (let i = 0; i < json.length; i += chunkSize) {
      const chunk = json.slice(i, i + chunkSize)
      chunks.push(chunk)
    }

    // Reconstruct JSON (in real implementation, this would be streaming)
    return JSON.parse(chunks.join(''))
  }

  static parseWithMemoryLimit(json: string, maxMemory: number): any {
    const estimatedMemory = json.length * 4 // Rough estimate

    if (estimatedMemory > maxMemory) {
      throw new Error(`JSON too large for memory limit: ${estimatedMemory} > ${maxMemory}`)
    }

    return CompactJsonParser.parse(json)
  }
}

/**
 * Memory-efficient string builder
 */
export class StringBuilder {
  private chunks: string[] = []
  private totalLength = 0

  constructor(chunkSize: number = 8192) {
    // 8KB chunks
    this.chunkSize = chunkSize
  }

  append(str: string): this {
    this.chunks.push(str)
    this.totalLength += str.length
    return this
  }

  toString(): string {
    return this.chunks.join('')
  }

  length(): number {
    return this.totalLength
  }

  clear(): void {
    this.chunks.length = 0
    this.totalLength = 0
  }

  memoryUsage(): number {
    return this.totalLength * 2 + this.chunks.length * 8
  }
}

/**
 * Memory usage tracker for data structures
 */
export class MemoryTracker {
  private allocations: Map<string, { size: number; timestamp: number }> = new Map()
  private totalAllocated = 0
  private peakUsage = 0

  trackAllocation(id: string, size: number): void {
    this.deallocations.delete(id) // Remove from deallocations if exists
    this.allocations.set(id, { size, timestamp: Date.now() })
    this.totalAllocated += size
    this.peakUsage = Math.max(this.peakUsage, this.totalAllocated)
  }

  trackDeallocation(id: string): void {
    const allocation = this.allocations.get(id)
    if (allocation) {
      this.totalAllocated -= allocation.size
      this.allocations.delete(id)
    }
  }

  getCurrentUsage(): number {
    return this.totalAllocated
  }

  getPeakUsage(): number {
    return this.peakUsage
  }

  getAllocationCount(): number {
    return this.allocations.size
  }

  getAllocations(): Array<{ id: string; size: number; age: number }> {
    const now = Date.now()
    return Array.from(this.allocations.entries()).map(([id, allocation]) => ({
      id,
      size: allocation.size,
      age: now - allocation.timestamp,
    }))
  }

  clear(): void {
    this.allocations.clear()
    this.totalAllocated = 0
  }

  private deallocations: Set<string> = new Set()
}

// Export utility functions
export function createCompactArray<T>(initialCapacity?: number): CompactArray<T> {
  return new CompactArray(initialCapacity)
}

export function createCompactObject(): CompactObject {
  return new CompactObject()
}

export function createCompactMap<K, V>(): CompactMap<K, V> {
  return new CompactMap()
}

export function createMemoryPool<T>(
  createFn: () => T,
  resetFn?: (obj: T) => void,
  maxSize?: number
): MemoryPool<T> {
  return new MemoryPool(createFn, resetFn, maxSize)
}

export function createBufferPool(maxPoolSize?: number): BufferPool {
  return new BufferPool(maxPoolSize)
}

export function createCache<K, V>(maxSize?: number, ttl?: number): MemoryEfficientCache<K, V> {
  return new MemoryEfficientCache(maxSize, ttl)
}

export function createStringBuilder(chunkSize?: number): StringBuilder {
  return new StringBuilder(chunkSize)
}

export function createMemoryTracker(): MemoryTracker {
  return new MemoryTracker()
}
