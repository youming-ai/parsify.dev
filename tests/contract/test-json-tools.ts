/**
 * Contract Tests for JSON Tools
 * Validates that JSON tools implement required interfaces and behaviors
 */

import { eventBus } from '@/lib/tool-event-bus';
import { ToolExecution } from '@/lib/tool-execution';
import { ToolRegistry } from '@/lib/tool-registry';
import { ToolStateManager } from '@/lib/tool-state-manager';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Mock tool implementations for testing
const mockJsonFormatter = {
  id: 'json-formatter',
  name: 'JSON Formatter',
  description: 'Format JSON with customizable options',
  category: 'json',
  version: '1.0.0',
  bundleSize: 15000, // 15KB
  dependencies: [],
  tags: ['json', 'format', 'beautify'],
  enabled: true,
  priority: 1,
  requiresWasm: false,
  requiresWorker: false,
  component: () => null,
  importer: async () => null,
};

const mockJsonValidator = {
  id: 'json-validator',
  name: 'JSON Validator',
  description: 'Validate JSON syntax and structure',
  category: 'json',
  version: '1.0.0',
  bundleSize: 12000, // 12KB
  dependencies: [],
  tags: ['json', 'validation', 'schema'],
  enabled: true,
  priority: 1,
  requiresWasm: false,
  requiresWorker: false,
  component: () => null,
  importer: async () => null,
};

const mockJsonHeroViewer = {
  id: 'json-hero-viewer',
  name: 'JSON Hero Viewer',
  description: 'Interactive JSON visualization with tree navigation',
  category: 'json',
  version: '1.0.0',
  bundleSize: 25000, // 25KB
  dependencies: [],
  tags: ['json', 'visualization', 'tree', 'navigation'],
  enabled: true,
  priority: 1,
  requiresWasm: false,
  requiresWorker: false,
  component: () => null,
  importer: async () => null,
};

const mockJsonCodeGenerator = {
  id: 'json-to-typescript',
  name: 'JSON to TypeScript',
  description: 'Generate TypeScript interfaces from JSON',
  category: 'json',
  version: '1.0.0',
  bundleSize: 18000, // 18KB
  dependencies: [],
  tags: ['json', 'typescript', 'codegen', 'interfaces'],
  enabled: true,
  priority: 1,
  requiresWasm: false,
  requiresWorker: false,
  component: () => null,
  importer: async () => null,
};

describe('JSON Tools Contract Tests', () => {
  let toolRegistry: ToolRegistry;
  let stateManager: ToolStateManager;
  let toolExecution: ToolExecution;

  beforeEach(() => {
    toolRegistry = ToolRegistry.getInstance();
    stateManager = ToolStateManager.getInstance();
    toolExecution = ToolExecution.getInstance();
  });

  afterEach(() => {
    toolRegistry.dispose();
    stateManager.dispose();
    toolExecution.dispose();
  });

  describe('Tool Registration Contracts', () => {
    it('should register JSON tools with correct metadata', async () => {
      // Register JSON tools
      toolRegistry.registerTool(mockJsonFormatter);
      toolRegistry.registerTool(mockJsonValidator);
      toolRegistry.registerTool(mockJsonHeroViewer);
      toolRegistry.registerTool(mockJsonCodeGenerator);

      // Verify registration
      const formatterMetadata = toolRegistry.getToolMetadata('json-formatter');
      expect(formatterMetadata).toBeDefined();
      expect(formatterMetadata?.category).toBe('json');
      expect(formatterMetadata?.name).toBe('JSON Formatter');
      expect(formatterMetadata?.bundleSize).toBeLessThan(200 * 1024); // Under 200KB

      const validatorMetadata = toolRegistry.getToolMetadata('json-validator');
      expect(validatorMetadata).toBeDefined();
      expect(validatorMetadata?.category).toBe('json');

      const heroViewerMetadata = toolRegistry.getToolMetadata('json-hero-viewer');
      expect(heroViewerMetadata).toBeDefined();
      expect(heroViewerMetadata?.tags).toContain('visualization');

      const codeGenMetadata = toolRegistry.getToolMetadata('json-to-typescript');
      expect(codeGenMetadata).toBeDefined();
      expect(codeGenMetadata?.tags).toContain('codegen');
    });

    it('should validate bundle size constraints', () => {
      const largeTool = {
        ...mockJsonFormatter,
        bundleSize: 300 * 1024, // 300KB - exceeds limit
      };

      expect(() => {
        toolRegistry.registerTool(largeTool);
      }).toThrow(/bundle size.*exceeds.*200KB/);
    });

    it('should retrieve tools by category', () => {
      toolRegistry.registerTool(mockJsonFormatter);
      toolRegistry.registerTool(mockJsonValidator);

      const jsonTools = toolRegistry.getToolsByCategory('json');
      expect(jsonTools).toHaveLength(2);
      expect(jsonTools.map((t) => t.id)).toContain('json-formatter');
      expect(jsonTools.map((t) => t.id)).toContain('json-validator');
    });

    it('should search JSON tools by tags', () => {
      toolRegistry.registerTool(mockJsonFormatter);
      toolRegistry.registerTool(mockJsonValidator);
      toolRegistry.registerTool(mockJsonHeroViewer);

      const visualizationTools = toolRegistry.searchTools('visualization');
      expect(visualizationTools).toHaveLength(1);
      expect(visualizationTools[0].id).toBe('json-hero-viewer');

      const jsonTools = toolRegistry.searchTools('json');
      expect(jsonTools).toHaveLength(3);
    });
  });

  describe('State Management Contracts', () => {
    it('should persist and restore JSON tool state', async () => {
      const sessionId = stateManager.createNewSession();

      // Set JSON formatter state
      const sampleJson = {
        name: 'Test User',
        age: 30,
        active: true,
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      };

      const sampleConfig = {
        indentSize: 2,
        sortKeys: true,
        trailingCommas: false,
      };

      stateManager.setToolState('json-formatter', sampleJson, sampleConfig);

      // Retrieve and verify state
      const storedState = stateManager.getToolState('json-formatter');
      expect(storedState).toBeDefined();
      expect(storedState?.data).toEqual(sampleJson);
      expect(storedState?.config).toEqual(sampleConfig);

      // Verify session persistence
      const sessionData = stateManager.getCurrentSession();
      expect(sessionData?.sessionId).toBe(sessionId);
      expect(sessionData?.tools['json-formatter']).toBeDefined();
    });

    it('should handle JSON tool updates', async () => {
      stateManager.createNewSession();

      const initialJson = { name: 'Test' };
      const updatedJson = { name: 'Test', email: 'test@example.com' };

      stateManager.setToolState('json-validator', initialJson);
      stateManager.updateToolData('json-validator', { email: 'test@example.com' });

      const finalState = stateManager.getToolState('json-validator');
      expect(finalState?.data).toEqual(updatedJson);
    });

    it('should export and import JSON tool configurations', async () => {
      stateManager.createNewSession();

      const toolConfig = {
        indentSize: 4,
        useTabs: false,
        sortKeys: true,
      };

      stateManager.setToolState('json-formatter', {}, toolConfig);

      const exportedSession = stateManager.exportSession();
      expect(exportedSession).toBeDefined();
      expect(typeof exportedSession).toBe('string');

      // Import into new session
      stateManager.importSession(exportedSession);
      const importedState = stateManager.getToolState('json-formatter');
      expect(importedState?.config).toEqual(toolConfig);
    });
  });

  describe('Execution Service Contracts', () => {
    it('should execute JSON tools with proper context', async () => {
      const executionRequest = {
        id: 'test-execution',
        toolId: 'json-formatter',
        input: '{"name":"test"}',
        config: { indentSize: 2 },
        context: {
          toolId: 'json-formatter',
          sessionId: 'test-session',
          timestamp: Date.now(),
          timeout: 5000,
          memoryLimit: 50 * 1024 * 1024,
          permissions: {
            network: false,
            fileSystem: false,
            crypto: false,
            wasm: false,
          },
        },
      };

      // Mock executor for testing
      const mockExecutor = {
        toolId: 'json-formatter',
        name: 'JSON Formatter',
        description: 'Mock JSON formatter',
        version: '1.0.0',
        execute: async (request: any) => {
          return {
            id: request.id,
            success: true,
            output: JSON.stringify(JSON.parse(request.input), null, 2),
            metadata: {
              executionTime: 100,
              memoryUsed: 1024,
              cpuTime: 100,
            },
            logs: [],
            context: request.context,
          };
        },
      };

      toolExecution.registerExecutor(mockExecutor);

      const result = await toolExecution.execute(executionRequest);

      expect(result.success).toBe(true);
      expect(result.output).toBe('{\n  "name": "test"\n}');
      expect(result.metadata.executionTime).toBeGreaterThan(0);
      expect(result.context.toolId).toBe('json-formatter');
    });

    it('should handle JSON tool execution timeouts', async () => {
      const slowExecutor = {
        toolId: 'json-validator',
        name: 'JSON Validator',
        description: 'Slow JSON validator',
        version: '1.0.0',
        execute: async (request: any) => {
          // Simulate slow execution
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return {
            id: request.id,
            success: true,
            output: 'Valid JSON',
            metadata: { executionTime: 1000, memoryUsed: 2048, cpuTime: 1000 },
            logs: [],
            context: request.context,
          };
        },
      };

      toolExecution.registerExecutor(slowExecutor);

      const executionRequest = {
        id: 'timeout-test',
        toolId: 'json-validator',
        input: '{"valid": "json"}',
        config: {},
        context: {
          toolId: 'json-validator',
          sessionId: 'test-session',
          timestamp: Date.now(),
          timeout: 500, // Short timeout
          memoryLimit: 10 * 1024 * 1024,
          permissions: {
            network: false,
            fileSystem: false,
            crypto: false,
            wasm: false,
          },
        },
      };

      const result = await toolExecution.execute(executionRequest);

      // Should fail due to timeout
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Event Bus Contracts', () => {
    it('should emit JSON tool events', async () => {
      let eventReceived = false;
      let eventData: any = null;

      eventBus.subscribe('test', 'tool:registered', (event: any) => {
        eventReceived = true;
        eventData = event;
      });

      const subscriptionId = eventBus.subscribe('test', 'tool:registered', () => {});

      // Simulate tool registration event
      eventBus.publish({
        type: 'tool:registered',
        source: 'tool-registry',
        data: {
          toolId: 'json-formatter',
          metadata: mockJsonFormatter,
        },
      });

      // Check that the event was processed
      expect(eventReceived).toBe(true);
      expect(eventData.data.toolId).toBe('json-formatter');

      eventBus.unsubscribe(subscriptionId);
    });

    it('should handle JSON tool execution events', async () => {
      let executionStarted = false;
      let executionCompleted = false;

      eventBus.subscribe('test', 'tool:execution:started', (event: any) => {
        executionStarted = true;
        expect(event.data.request.toolId).toBe('json-formatter');
      });

      eventBus.subscribe('test', 'tool:execution:completed', (event: any) => {
        executionCompleted = true;
        expect(event.data.result.success).toBe(true);
      });

      // Simulate execution events
      eventBus.publish({
        type: 'tool:execution:started',
        source: 'json-formatter',
        data: { request: { toolId: 'json-formatter' } },
      });

      eventBus.publish({
        type: 'tool:execution:completed',
        source: 'json-formatter',
        data: { result: { success: true, output: '{}' } },
      });

      expect(executionStarted).toBe(true);
      expect(executionCompleted).toBe(true);
    });

    it('should broadcast JSON tool events to multiple subscribers', async () => {
      const receivedEvents: string[] = [];

      // Subscribe multiple listeners
      const subscription1 = eventBus.subscribe('listener1', 'json:processed', () => {
        receivedEvents.push('listener1');
      });

      const subscription2 = eventBus.subscribe('listener2', 'json:processed', () => {
        receivedEvents.push('listener2');
      });

      // Broadcast event
      eventBus.broadcast('json:processed', { result: 'success' });

      // Both subscribers should receive the event
      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents).toContain('listener1');
      expect(receivedEvents).toContain('listener2');

      eventBus.unsubscribe(subscription1);
      eventBus.unsubscribe(subscription2);
    });
  });

  describe('JSON Tool Integration Contracts', () => {
    it('should integrate all JSON tools with the tool ecosystem', async () => {
      // Register all JSON tools
      const jsonTools = [
        mockJsonFormatter,
        mockJsonValidator,
        mockJsonHeroViewer,
        mockJsonCodeGenerator,
      ];

      jsonTools.forEach((tool) => {
        toolRegistry.registerTool(tool);
      });

      // Verify all tools are registered
      const allTools = toolRegistry.getAllToolsMetadata();
      const jsonCategories = allTools.filter((t) => t.category === 'json');
      expect(jsonCategories).toHaveLength(4);

      // Verify tool integration through state manager
      const _sessionId = stateManager.createNewSession();

      jsonTools.forEach((tool) => {
        stateManager.setToolState(tool.id, { initialized: true }, { version: tool.version });
      });

      const session = stateManager.getCurrentSession();
      expect(session?.tools).toBeDefined();
      expect(Object.keys(session?.tools)).toHaveLength(4);

      // Verify event bus integration
      let eventsEmitted = 0;
      eventBus.subscribe('integration', 'json:tool:integrated', () => {
        eventsEmitted++;
      });

      jsonTools.forEach((tool) => {
        eventBus.publish({
          type: 'json:tool:integrated',
          source: 'integration-test',
          data: { toolId: tool.id },
        });
      });

      expect(eventsEmitted).toBe(4);
    });
  });
});
