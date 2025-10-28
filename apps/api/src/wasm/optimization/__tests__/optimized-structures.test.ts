import { describe, expect, it } from 'vitest'
import {
  BufferPool,
  CompactArray,
  CompactMap,
  CompactObject,
  CompactSet,
  createCache,
  createCompactArray,
  createCompactMap,
  createCompactObject,
  createMemoryPool,
  createMemoryTracker,
  createStringBuilder,
  MemoryEfficientCache,
  MemoryPool,
  MemoryTracker,
  StringBuilder,
} from '../memory-optimized-structures'

describe('Memory Optimized Structures', () => {
  describe('CompactArray', () => {
    it('should create and use array', () => {
      const array = createCompactArray<number>()

      array.push(42)
      array.push(3.14)
      array.push(-100)

      expect(array.size()).toBe(3)
      expect(array.get(0)).toBe(42)
      expect(array.get(1)).toBe(3.14)
      expect(array.get(2)).toBe(-100)
    })

    it('should handle pop operations', () => {
      const array = new CompactArray<string>()

      array.push('hello')
      array.push('world')

      expect(array.pop()).toBe('world')
      expect(array.pop()).toBe('hello')
      expect(array.pop()).toBeUndefined()
      expect(array.size()).toBe(0)
    })

    it('should grow dynamically', () => {
      const array = new CompactArray<number>(2) // Small initial capacity

      // Add more items than initial capacity
      for (let i = 0; i < 10; i++) {
        array.push(i)
      }

      expect(array.size()).toBe(10)
      expect(array.get(9)).toBe(9)
    })

    it('should track memory usage', () => {
      const array = new CompactArray<number>()

      expect(array.memoryUsage()).toBeGreaterThan(0)

      array.push(1)
      array.push(2)
      array.push(3)

      const usageAfter = array.memoryUsage()
      expect(usageAfter).toBeGreaterThan(0)
    })
  })

  describe('CompactObject', () => {
    it('should store and retrieve properties', () => {
      const obj = createCompactObject()

      obj.set('name', 'test')
      obj.set('value', 42)
      obj.set('flag', true)

      expect(obj.get('name')).toBe('test')
      expect(obj.get('value')).toBe(42)
      expect(obj.get('flag')).toBe(true)
      expect(obj.has('name')).toBe(true)
      expect(obj.has('missing')).toBe(false)
    })

    it('should handle property deletion', () => {
      const obj = new CompactObject()

      obj.set('temp', 'value')
      expect(obj.has('temp')).toBe(true)

      const deleted = obj.delete('temp')
      expect(deleted).toBe(true)
      expect(obj.has('temp')).toBe(false)
    })

    it('should maintain insertion order', () => {
      const obj = new CompactObject()

      obj.set('first', 1)
      obj.set('second', 2)
      obj.set('third', 3)

      const keys = obj.keys()
      expect(keys).toEqual(['first', 'second', 'third'])
    })

    it('should calculate memory usage', () => {
      const obj = new CompactObject()

      obj.set('string', 'hello world')
      obj.set('number', 42)
      obj.set('boolean', true)

      const usage = obj.memoryUsage()
      expect(usage).toBeGreaterThan(0)
    })
  })

  describe('CompactMap', () => {
    it('should store and retrieve key-value pairs', () => {
      const map = createCompactMap<string, number>()

      map.set('one', 1)
      map.set('two', 2)
      map.set('three', 3)

      expect(map.get('one')).toBe(1)
      expect(map.get('two')).toBe(2)
      expect(map.get('three')).toBe(3)
      expect(map.has('two')).toBe(true)
      expect(map.has('four')).toBe(false)
    })

    it('should handle key deletion', () => {
      const map = new CompactMap<string, string>()

      map.set('key1', 'value1')
      map.set('key2', 'value2')

      expect(map.delete('key1')).toBe(true)
      expect(map.has('key1')).toBe(false)
      expect(map.has('key2')).toBe(true)
    })

    it('should handle map size', () => {
      const map = new CompactMap<number, string>()

      expect(map.size).toBe(0)

      map.set(1, 'one')
      map.set(2, 'two')

      expect(map.size).toBe(2)

      map.delete(1)
      expect(map.size).toBe(1)
    })

    it('should clear all entries', () => {
      const map = new CompactMap<string, number>()

      map.set('a', 1)
      map.set('b', 2)
      map.set('c', 3)

      map.clear()

      expect(map.size).toBe(0)
      expect(map.get('a')).toBeUndefined()
    })

    it('should track memory usage', () => {
      const map = new CompactMap<string, number>()

      for (let i = 0; i < 100; i++) {
        map.set(`key${i}`, i)
      }

      const usage = map.memoryUsage()
      expect(usage).toBeGreaterThan(0)
    })
  })

  describe('CompactSet', () => {
    it('should store unique values', () => {
      const set = new CompactSet<number>()

      set.add(1)
      set.add(2)
      set.add(2) // Duplicate
      set.add(3)

      expect(set.has(1)).toBe(true)
      expect(set.has(2)).toBe(true)
      expect(set.has(3)).toBe(true)
      expect(set.has(4)).toBe(false)
      expect(set.size).toBe(3)
    })

    it('should handle value deletion', () => {
      const set = new CompactSet<string>()

      set.add('hello')
      set.add('world')

      expect(set.delete('hello')).toBe(true)
      expect(set.has('hello')).toBe(false)
      expect(set.has('world')).toBe(true)
    })

    it('should return all values', () => {
      const set = new CompactSet<number>()

      set.add(10)
      set.add(20)
      set.add(30)

      const values = set.values()
      expect(values).toContain(10)
      expect(values).toContain(20)
      expect(values).toContain(30)
    })

    it('should track memory usage', () => {
      const set = new CompactSet<string>()

      for (let i = 0; i < 50; i++) {
        set.add(`item${i}`)
      }

      const usage = set.memoryUsage()
      expect(usage).toBeGreaterThan(0)
    })
  })

  describe('MemoryPool', () => {
    it('should acquire and release objects', () => {
      let createCount = 0
      let resetCount = 0

      const pool = createMemoryPool(
        () => {
          createCount++
          return { value: 0 }
        },
        obj => {
          resetCount++
          obj.value = 0
        }
      )

      const obj1 = pool.acquire()
      const obj2 = pool.acquire()

      expect(createCount).toBe(2)
      expect(obj1.value).toBe(0)
      expect(obj2.value).toBe(0)

      obj1.value = 42
      obj2.value = 100

      pool.release(obj1)
      pool.release(obj2)

      expect(resetCount).toBe(2)

      const obj3 = pool.acquire()
      expect(createCount).toBe(2) // Should reuse existing objects
      expect(obj3.value).toBe(0) // Should be reset
    })

    it('should limit pool size', () => {
      const pool = new MemoryPool(
        () => ({ id: Math.random() }),
        undefined,
        2 // Max size 2
      )

      const obj1 = pool.acquire()
      const obj2 = pool.acquire()
      const obj3 = pool.acquire()

      pool.release(obj1)
      pool.release(obj2)
      pool.release(obj3) // This one should not be added to pool

      expect(pool.size()).toBeLessThanOrEqual(2)
    })
  })

  describe('BufferPool', () => {
    it('should acquire and release buffers', () => {
      const pool = new BufferPool(2)

      const buffer1 = pool.acquire(1024)
      const buffer2 = pool.acquire(2048)

      expect(buffer1.byteLength).toBe(1024)
      expect(buffer2.byteLength).toBe(2048)

      pool.release(buffer1)
      pool.release(buffer2)

      const buffer3 = pool.acquire(1024)
      expect(buffer3).toBe(buffer1) // Should reuse
    })

    it('should create new buffer when pool is empty', () => {
      const pool = new BufferPool()

      const buffer = pool.acquire(4096)
      expect(buffer.byteLength).toBe(4096)
    })

    it('should track memory usage', () => {
      const pool = new BufferPool()

      pool.acquire(1024)
      pool.acquire(2048)

      const usage = pool.memoryUsage()
      expect(usage).toBeGreaterThan(0)
    })
  })

  describe('MemoryEfficientCache', () => {
    it('should store and retrieve values', () => {
      const cache = createCache<string, number>(10, 1000) // 10 items, 1s TTL

      cache.set('key1', 100)
      cache.set('key2', 200)

      expect(cache.get('key1')).toBe(100)
      expect(cache.get('key2')).toBe(200)
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key3')).toBe(false)
    })

    it('should handle cache eviction', () => {
      const cache = new MemoryEfficientCache<string, number>(2) // Max 2 items

      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3) // Should evict 'a' or 'b'

      expect(cache.size()).toBeLessThanOrEqual(2)
    })

    it('should handle TTL expiration', async () => {
      const cache = new MemoryEfficientCache<string, number>(10, 50) // 50ms TTL

      cache.set('temp', 123)
      expect(cache.get('temp')).toBe(123)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(cache.get('temp')).toBeUndefined()
    })

    it('should track memory usage', () => {
      const cache = new MemoryEfficientCache<string, string>()

      for (let i = 0; i < 20; i++) {
        cache.set(`key${i}`, `value${i}`)
      }

      const usage = cache.memoryUsage()
      expect(usage).toBeGreaterThan(0)
    })
  })

  describe('StringBuilder', () => {
    it('should build strings efficiently', () => {
      const builder = createStringBuilder()

      builder.append('Hello')
      builder.append(' ')
      builder.append('World')
      builder.append('!')

      expect(builder.toString()).toBe('Hello World!')
      expect(builder.length()).toBe(12)
    })

    it('should handle clearing', () => {
      const builder = new StringBuilder()

      builder.append('test')
      expect(builder.length()).toBe(4)

      builder.clear()
      expect(builder.length()).toBe(0)
      expect(builder.toString()).toBe('')
    })

    it('should track memory usage', () => {
      const builder = new StringBuilder()

      builder.append('x'.repeat(1000))

      const usage = builder.memoryUsage()
      expect(usage).toBeGreaterThan(1000)
    })
  })

  describe('MemoryTracker', () => {
    it('should track allocations and deallocations', () => {
      const tracker = createMemoryTracker()

      tracker.trackAllocation('obj1', 1024)
      tracker.trackAllocation('obj2', 2048)

      expect(tracker.getCurrentUsage()).toBe(3072)
      expect(tracker.getAllocationCount()).toBe(2)

      tracker.trackDeallocation('obj1')
      expect(tracker.getCurrentUsage()).toBe(2048)
      expect(tracker.getAllocationCount()).toBe(1)
    })

    it('should track peak usage', () => {
      const tracker = new MemoryTracker()

      tracker.trackAllocation('obj1', 1024)
      tracker.trackAllocation('obj2', 2048)

      expect(tracker.getPeakUsage()).toBe(3072)

      tracker.trackDeallocation('obj2')
      expect(tracker.getCurrentUsage()).toBe(1024)
      expect(tracker.getPeakUsage()).toBe(3072) // Peak should remain
    })

    it('should get allocation details', () => {
      const tracker = new MemoryTracker()

      tracker.trackAllocation('obj1', 1024)
      tracker.trackAllocation('obj2', 2048)

      const allocations = tracker.getAllocations()
      expect(allocations).toHaveLength(2)
      expect(allocations[0].id).toBe('obj1')
      expect(allocations[0].size).toBe(1024)
      expect(allocations[1].id).toBe('obj2')
      expect(allocations[1].size).toBe(2048)
    })

    it('should handle clearing', () => {
      const tracker = new MemoryTracker()

      tracker.trackAllocation('obj1', 1024)
      tracker.trackAllocation('obj2', 2048)

      tracker.clear()

      expect(tracker.getCurrentUsage()).toBe(0)
      expect(tracker.getPeakUsage()).toBe(0)
      expect(tracker.getAllocationCount()).toBe(0)
    })
  })

  describe('Utility Functions', () => {
    it('should create instances using utility functions', () => {
      const array = createCompactArray<number>()
      const object = createCompactObject()
      const map = createCompactMap<string, number>()
      const cache = createCache<string, string>()
      const builder = createStringBuilder()
      const tracker = createMemoryTracker()

      expect(array).toBeInstanceOf(CompactArray)
      expect(object).toBeInstanceOf(CompactObject)
      expect(map).toBeInstanceOf(CompactMap)
      expect(cache).toBeInstanceOf(MemoryEfficientCache)
      expect(builder).toBeInstanceOf(StringBuilder)
      expect(tracker).toBeInstanceOf(MemoryTracker)
    })
  })
})
