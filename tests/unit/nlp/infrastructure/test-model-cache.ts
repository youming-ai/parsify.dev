/**
 * Model Cache Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "../../setup";
import { modelCache, ModelCache } from "../../../../src/lib/nlp/infrastructure/model-cache";

describe("ModelCache", () => {
  let cache: ModelCache;
  const testModelData = new ArrayBuffer(1024);
  const testModelId = "test-model";
  const testModelUrl = "https://example.com/model.bin";
  const testVersion = "1.0.0";

  beforeEach(async () => {
    // Create a fresh cache instance for each test
    cache = new ModelCache({
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 5,
      ttl: 60 * 60 * 1000, // 1 hour
      cleanupInterval: 1000, // 1 second for testing
    });

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await cache.destroy();
  });

  describe("Basic Operations", () => {
    it("should store and retrieve models", async () => {
      await cache.set(testModelId, testModelUrl, testModelData, testVersion);

      const retrieved = await cache.get(testModelId);

      expect(retrieved).not.toBeNull();
      expect(retrieved).toBeInstanceOf(ArrayBuffer);
      expect(retrieved!.byteLength).toBe(testModelData.byteLength);
    });

    it("should return null for non-existent models", async () => {
      const retrieved = await cache.get("non-existent");
      expect(retrieved).toBeNull();
    });

    it("should check if model exists", async () => {
      expect(await cache.has(testModelId)).toBe(false);

      await cache.set(testModelId, testModelUrl, testModelData, testVersion);

      expect(await cache.has(testModelId)).toBe(true);
    });

    it("should delete models", async () => {
      await cache.set(testModelId, testModelUrl, testModelData, testVersion);
      expect(await cache.has(testModelId)).toBe(true);

      await cache.delete(testModelId);
      expect(await cache.has(testModelId)).toBe(false);
    });

    it("should clear all models", async () => {
      await cache.set("model1", "url1", testModelData, testVersion);
      await cache.set("model2", "url2", testModelData, testVersion);
      await cache.set("model3", "url3", testModelData, testVersion);

      expect(await cache.has("model1")).toBe(true);
      expect(await cache.has("model2")).toBe(true);
      expect(await cache.has("model3")).toBe(true);

      await cache.clear();

      expect(await cache.has("model1")).toBe(false);
      expect(await cache.has("model2")).toBe(false);
      expect(await cache.has("model3")).toBe(false);
    });
  });

  describe("TTL (Time To Live)", () => {
    it("should handle TTL expiration", async () => {
      // Create cache with very short TTL for testing
      const shortTtlCache = new ModelCache({
        ttl: 100, // 100ms
        cleanupInterval: 50,
      });

      await shortTtlCache.set(testModelId, testModelUrl, testModelData, testVersion);
      expect(await shortTtlCache.has(testModelId)).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(await shortTtlCache.has(testModelId)).toBe(false);

      await shortTtlCache.destroy();
    });
  });

  describe("Size Management", () => {
    it("should manage cache size limits", async () => {
      // Create cache with small size limit
      const smallCache = new ModelCache({
        maxSize: 2 * 1024, // 2KB
        maxEntries: 3,
      });

      // Add models that exceed the size limit
      const largeModel = new ArrayBuffer(1500); // 1.5KB

      await smallCache.set("model1", "url1", largeModel, testVersion);
      await smallCache.set("model2", "url2", largeModel, testVersion);

      // Third model should trigger cleanup
      await smallCache.set("model3", "url3", largeModel, testVersion);

      const stats = await smallCache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(2 * 1024);

      await smallCache.destroy();
    });

    it("should manage entry count limits", async () => {
      // Add models that exceed the entry limit
      for (let i = 0; i < 10; i++) {
        await cache.set(`model${i}`, `url${i}`, testModelData, testVersion);
      }

      const stats = await cache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(5); // maxEntries
    });
  });

  describe("Cache Statistics", () => {
    beforeEach(async () => {
      await cache.set("model1", "url1", testModelData, testVersion);
      await cache.set("model2", "url2", testModelData, testVersion);
      await cache.set("model3", "url3", testModelData, testVersion);
    });

    it("should return accurate statistics", async () => {
      const stats = await cache.getStats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.totalSize).toBe(3 * testModelData.byteLength);
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
    });

    it("should update access metadata on retrieval", async () => {
      const initialStats = await cache.getStats();

      // Access a model
      await cache.get("model1");

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Access again
      await cache.get("model1");

      const finalStats = await cache.getStats();
      expect(finalStats.newestEntry).toBeGreaterThanOrEqual(initialStats.newestEntry!);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // Destroy the database to simulate errors
      await cache.destroy();

      // Operations should not throw errors
      await expect(
        cache.set(testModelId, testModelUrl, testModelData, testVersion),
      ).resolves.not.toThrow();
      await expect(cache.get(testModelId)).resolves.not.toThrow();
      await expect(cache.has(testModelId)).resolves.not.toThrow();
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent set operations", async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const modelData = new ArrayBuffer(512);
        promises.push(cache.set(`model${i}`, `url${i}`, modelData, testVersion));
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();

      // Verify some models were cached
      const stats = await cache.getStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
    });

    it("should handle concurrent get operations", async () => {
      await cache.set(testModelId, testModelUrl, testModelData, testVersion);

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cache.get(testModelId));
      }

      const results = await Promise.all(promises);

      // All should return the same data
      results.forEach((result) => {
        expect(result).not.toBeNull();
        expect(result!.byteLength).toBe(testModelData.byteLength);
      });
    });
  });

  describe("Memory Management", () => {
    it("should clean up memory when destroyed", async () => {
      await cache.set(testModelId, testModelUrl, testModelData, testVersion);

      // Verify model is cached
      expect(await cache.has(testModelId)).toBe(true);

      await cache.destroy();

      // Cache should be non-functional after destroy
      await expect(
        cache.set(testModelId, testModelUrl, testModelData, testVersion),
      ).resolves.not.toThrow();
      expect(await cache.has(testModelId)).toBe(false);
    });
  });

  describe("Integration with Browser APIs", () => {
    it("should work with IndexedDB in browser environment", async () => {
      // Test should pass if IndexedDB is available
      expect(typeof indexedDB).toBe("object");

      await cache.set(testModelId, testModelUrl, testModelData, testVersion);
      const retrieved = await cache.get(testModelId);

      expect(retrieved).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe("Singleton Instance", () => {
    it("should provide a singleton instance", () => {
      expect(modelCache).toBeInstanceOf(ModelCache);
    });
  });
});
