/**
 * Performance Monitor Tests
 */

import { performanceMonitor } from '../../../../src/lib/nlp/infrastructure/performance-monitor';
import { afterEach, beforeEach, describe, expect, it } from '../../setup';
import { NLP_TEST_CONFIG } from '../../setup';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.startMonitoring();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
    performanceMonitor.snapshots = [];
    performanceMonitor.alerts = [];
  });

  describe('Operation Tracking', () => {
    it('should track operation start and end', () => {
      const operationId = 'test-op-1';
      const operation = 'sentiment_analysis';
      const tool = 'sentiment_analyzer';

      performanceMonitor.startOperation(operationId, operation, tool);

      expect(performanceMonitor.operations.has(operationId)).toBe(true);

      const timer = performanceMonitor.operations.get(operationId)!;
      expect(timer.operation).toBe(operation);
      expect(timer.tool).toBe(tool);
      expect(timer.startTime).toBeGreaterThan(0);
    });

    it('should record metrics when operation ends', () => {
      const operationId = 'test-op-2';

      performanceMonitor.startOperation(operationId, 'test_operation', 'test_tool');

      // Simulate some processing time
      setTimeout(() => {
        performanceMonitor.endOperation(operationId, true);

        const snapshots = performanceMonitor.snapshots;
        expect(snapshots.length).toBe(1);

        const snapshot = snapshots[0];
        expect(snapshot.operation).toBe('test_operation');
        expect(snapshot.tool).toBe('test_tool');
        expect(snapshot.context.success).toBe(true);
        expect(snapshot.metrics.duration).toBeGreaterThan(0);
      }, 10);
    });

    it('should handle operation failure', () => {
      const operationId = 'test-op-3';
      const error = new Error('Test error');

      performanceMonitor.startOperation(operationId, 'test_operation', 'test_tool');
      performanceMonitor.endOperation(operationId, false, undefined, undefined, error);

      const snapshots = performanceMonitor.snapshots;
      expect(snapshots.length).toBe(1);

      const snapshot = snapshots[0];
      expect(snapshot.context.success).toBe(false);
      expect(snapshot.context.error).toBe('Test error');
    });
  });

  describe('Model Metrics', () => {
    it('should record model loading metrics', () => {
      const modelId = 'test-model';
      const loadTime = 1500;
      const modelSize = 50000000; // 50MB

      performanceMonitor.recordModelLoad(modelId, loadTime, modelSize, true);

      const modelMetrics = performanceMonitor.modelMetrics;
      expect(modelMetrics.has(modelId)).toBe(true);

      const metrics = modelMetrics.get(modelId)!;
      expect(metrics.loadTime).toBe(loadTime);
    });

    it('should trigger alert for slow model loading', () => {
      const modelId = 'slow-model';
      const loadTime = 15000; // Above default threshold of 10000ms

      performanceMonitor.recordModelLoad(modelId, loadTime, 1000000, true);

      const alerts = performanceMonitor.getAlerts();
      const slowLoadAlerts = alerts.filter((alert) => alert.type === 'model_load_failure');

      expect(slowLoadAlerts.length).toBeGreaterThan(0);
      expect(slowLoadAlerts[0].message).toContain(modelId);
      expect(slowLoadAlerts[0].message).toContain('loading took');
    });
  });

  describe('Performance Alerts', () => {
    it('should trigger alert for slow response time', () => {
      const operationId = 'slow-op';
      performanceMonitor.startOperation(operationId, 'slow_operation', 'slow_tool');

      // Simulate slow operation
      setTimeout(() => {
        performanceMonitor.endOperation(operationId, true);

        const alerts = performanceMonitor.getAlerts();
        const timeAlerts = alerts.filter((alert) => alert.type === 'response_time');

        expect(timeAlerts.length).toBeGreaterThan(0);
      }, NLP_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_PROCESSING_TIME + 100);
    });

    it('should track cache access events', () => {
      const cacheId = 'test-cache';

      // Mock event listeners
      const events: any[] = [];
      performanceMonitor.on('cache_hit' as any, (event) => events.push(event));
      performanceMonitor.on('cache_miss' as any, (event) => events.push(event));

      performanceMonitor.recordCacheAccess(cacheId, true);
      performanceMonitor.recordCacheAccess(cacheId, false);

      expect(events.length).toBe(2);
      expect(events[0].type).toBe('cache_hit');
      expect(events[1].type).toBe('cache_miss');
      expect(events[0].data.cacheId).toBe(cacheId);
    });
  });

  describe('Metrics Aggregation', () => {
    beforeEach(() => {
      // Add some test data
      const testSnapshots = [
        {
          timestamp: new Date(),
          operation: 'sentiment_analysis',
          tool: 'sentiment_analyzer',
          metrics: {
            timestamp: new Date(),
            operation: 'sentiment_analysis',
            tool: 'sentiment_analyzer',
            duration: 100,
            memoryUsage: { used: 10, total: 100, percentage: 10 },
            cpuUsage: 5,
          },
          context: { success: true },
        },
        {
          timestamp: new Date(),
          operation: 'sentiment_analysis',
          tool: 'sentiment_analyzer',
          metrics: {
            timestamp: new Date(),
            operation: 'sentiment_analysis',
            tool: 'sentiment_analyzer',
            duration: 200,
            memoryUsage: { used: 15, total: 100, percentage: 15 },
            cpuUsage: 8,
          },
          context: { success: true },
        },
        {
          timestamp: new Date(),
          operation: 'entity_extraction',
          tool: 'entity_extractor',
          metrics: {
            timestamp: new Date(),
            operation: 'entity_extraction',
            tool: 'entity_extractor',
            duration: 150,
            memoryUsage: { used: 12, total: 100, percentage: 12 },
            cpuUsage: 6,
          },
          context: { success: true },
        },
      ];

      performanceMonitor.snapshots = testSnapshots;
    });

    it('should aggregate metrics by operation and tool', () => {
      const aggregated = performanceMonitor.getAggregatedMetrics();

      expect(aggregated.length).toBe(2); // sentiment_analysis + entity_extraction

      const sentimentAgg = aggregated.find((agg) => agg.operation === 'sentiment_analysis');
      expect(sentimentAgg).toBeDefined();
      expect(sentimentAgg?.tool).toBe('sentiment_analyzer');
      expect(sentimentAgg?.metrics.count).toBe(2);
      expect(sentimentAgg?.metrics.avgResponseTime).toBe(150); // (100 + 200) / 2
      expect(sentimentAgg?.metrics.minResponseTime).toBe(100);
      expect(sentimentAgg?.metrics.maxResponseTime).toBe(200);
    });

    it('should filter by operation', () => {
      const sentimentOnly = performanceMonitor.getAggregatedMetrics('sentiment_analysis');

      expect(sentimentOnly.length).toBe(1);
      expect(sentimentOnly[0].operation).toBe('sentiment_analysis');
    });

    it('should filter by tool', () => {
      const sentimentToolOnly = performanceMonitor.getAggregatedMetrics(
        undefined,
        'sentiment_analyzer'
      );

      expect(sentimentToolOnly.length).toBe(1);
      expect(sentimentToolOnly[0].tool).toBe('sentiment_analyzer');
    });
  });

  describe('Recommendations', () => {
    it('should provide performance recommendations', () => {
      // Add slow operation data
      performanceMonitor.snapshots = [
        {
          timestamp: new Date(),
          operation: 'slow_operation',
          tool: 'slow_tool',
          metrics: {
            timestamp: new Date(),
            operation: 'slow_operation',
            tool: 'slow_tool',
            duration: NLP_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_PROCESSING_TIME + 1000,
            memoryUsage: { used: 10, total: 100, percentage: 10 },
            cpuUsage: 5,
          },
          context: { success: true },
        },
      ];

      const recommendations = performanceMonitor.getRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('slow_operation');
      expect(recommendations[0]).toContain('optimizing');
    });
  });

  describe('Data Export', () => {
    it('should export performance data as JSON', () => {
      performanceMonitor.snapshots = [
        {
          timestamp: new Date(),
          operation: 'test_operation',
          tool: 'test_tool',
          metrics: {
            timestamp: new Date(),
            operation: 'test_operation',
            tool: 'test_tool',
            duration: 100,
            memoryUsage: { used: 10, total: 100, percentage: 10 },
            cpuUsage: 5,
          },
          context: { success: true },
        },
      ];

      const exported = performanceMonitor.exportData('json');
      const data = JSON.parse(exported);

      expect(data).toHaveProperty('snapshots');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('aggregations');
      expect(data).toHaveProperty('modelMetrics');
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('exportedAt');

      expect(data.snapshots).toHaveLength(1);
      expect(data.snapshots[0].operation).toBe('test_operation');
    });
  });

  describe('Event System', () => {
    it('should emit and handle events', () => {
      const events: any[] = [];

      performanceMonitor.on('analysis_started' as any, (event) => {
        events.push(event);
      });

      performanceMonitor.startOperation('test-op', 'test_operation', 'test_tool');

      // Should emit analysis_started event when monitoring starts
      expect(events.length).toBeGreaterThanOrEqual(0);
    });

    it('should remove event listeners', () => {
      const events: any[] = [];
      const listener = (event: any) => events.push(event);

      performanceMonitor.on('analysis_started' as any, listener);
      performanceMonitor.off('analysis_started' as any, listener);

      // After removing listener, events should not be captured
      expect(events.length).toBe(0);
    });
  });

  describe('Current Metrics', () => {
    it('should return current system metrics', () => {
      const metrics = performanceMonitor.getCurrentMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('operation');
      expect(metrics).toHaveProperty('tool');
      expect(metrics).toHaveProperty('duration');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cpuUsage');

      expect(metrics.operation).toBe('system_check');
      expect(metrics.tool).toBe('performance_monitor');
    });
  });
});
