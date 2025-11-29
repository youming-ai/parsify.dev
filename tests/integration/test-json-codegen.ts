/**
 * Integration Test for JSON to TypeScript Code Generation
 * Tests T023 [P] [US1] - JSON to TypeScript code generation functionality
 * Validates code generation, type inference, and performance characteristics
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { ConstitutionalValidator } from '../../src/lib/compliance/constitutional-validator';
import { PerformanceMonitor } from '../../src/lib/performance-monitor';
import {
  ExecutionEnvironment,
  type ToolEvent,
  type ToolExecutionRequest,
  ToolType,
} from '../../src/lib/registry/tool-discovery';
import { ToolRegistry } from '../../src/lib/registry/tool-registry';
import { ToolExecutionService } from '../../src/lib/tool-execution';
import { ToolStateManager } from '../../src/lib/tool-state-manager';
import {
  generateInterfaceName,
  generateTypeScriptTypes,
  inferTypeFromValue,
} from '../../src/lib/tools/json-to-typescript';

// Type definitions for JSON structures used in tests
interface ComplexUserType {
  id: number;
  profile: {
    name: string;
    email?: string;
    preferences: {
      theme: 'light' | 'dark' | 'system';
      notifications: {
        email: boolean;
        push: boolean;
      };
    };
  };
  posts: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    metadata?: Record<string, unknown>;
    published: boolean;
    createdAt: string; // ISO date string
  }>;
  lastLogin: Date;
  isActive: boolean;
}

interface SchemaStructure {
  type: string;
  properties?: Record<string, SchemaStructure>;
  items?: SchemaStructure;
  required?: string[];
  enum?: unknown[];
  nullable?: boolean;
  format?: string;
}

describe('JSON to TypeScript Code Generation Integration Tests', () => {
  let executionService: ToolExecutionService;
  let toolRegistry: ToolRegistry;
  let stateManager: ToolStateManager;
  let performanceMonitor: PerformanceMonitor;
  let _constitutionalValidator: ConstitutionalValidator;

  beforeEach(async () => {
    // Initialize all services
    executionService = ToolExecutionService.getInstance();
    toolRegistry = ToolRegistry.getInstance();
    stateManager = ToolStateManager.getInstance();
    performanceMonitor = PerformanceMonitor.getInstance();
    _constitutionalValidator = ConstitutionalValidator.getInstance();

    // Start performance monitoring
    performanceMonitor.startMonitoring();

    // Ensure JSON tools are registered
    await toolRegistry.discoverTools();
  });

  afterEach(async () => {
    // Clean up test state
    await stateManager.clearToolState('json-code-generator');
    performanceMonitor.stopMonitoring();
    performanceMonitor.clearMetrics();
  });

  describe('Basic Type Inference', () => {
    it('should correctly infer primitive types', async () => {
      const testCases = [
        { input: 'string', expected: 'string' },
        { input: 42, expected: 'number' },
        { input: true, expected: 'boolean' },
        { input: null, expected: 'null' },
        { input: undefined, expected: 'undefined' },
      ];

      for (const testCase of testCases) {
        const inferredType = inferTypeFromValue(testCase.input);
        expect(inferredType).toBe(testCase.expected);
      }
    });

    it('should infer array types', async () => {
      const testCases = [
        { input: [1, 2, 3], expected: 'number[]' },
        { input: ['a', 'b', 'c'], expected: 'string[]' },
        { input: [true, false], expected: 'boolean[]' },
        { input: [{ id: 1 }, { id: 2 }], expected: 'unknown[]' },
      ];

      for (const testCase of testCases) {
        const inferredType = inferTypeFromValue(testCase.input);
        expect(inferredType).toBe(testCase.expected);
      }
    });

    it('should infer object types', async () => {
      const testObj = {
        name: 'John',
        age: 30,
        active: true,
        tags: ['developer', 'javascript'],
      };

      const inferredType = inferTypeFromValue(testObj);
      expect(inferredType).toBe('object');
    });
  });

  describe('Interface Name Generation', () => {
    it('should generate valid TypeScript interface names', () => {
      const testCases = [
        { input: 'user', expected: 'User' },
        { input: 'user-profile', expected: 'UserProfile' },
        { input: 'api_response', expected: 'ApiResponse' },
        { input: 'XMLHttpRequest', expected: 'XmlHttpRequest' },
        { input: '123invalid', expected: 'Type123' },
      ];

      for (const testCase of testCases) {
        const interfaceName = generateInterfaceName(testCase.input);
        expect(interfaceName).toBe(testCase.expected);

        // Verify it's a valid TypeScript identifier
        expect(/^[A-Z][a-zA-Z0-9]*$/.test(interfaceName)).toBe(true);
      }
    });

    it('should handle empty and special cases', () => {
      const testCases = [
        { input: '', expected: 'RootType' },
        { input: '-', expected: 'Type' },
        { input: 'a'.repeat(100), expected: 'Type' }, // Very long string
      ];

      for (const testCase of testCases) {
        const interfaceName = generateInterfaceName(testCase.input);
        expect(interfaceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      }
    });
  });

  describe('TypeScript Code Generation', () => {
    it('should generate simple interface from basic object', async () => {
      const input = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'User',
        exportInterfaces: true,
        optionalUndefined: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.code).toContain('export interface User');
      expect(result.data?.code).toContain('name: string;');
      expect(result.data?.code).toContain('age: number;');
      expect(result.data?.code).toContain('email?: string;');
    });

    it('should handle nested objects', async () => {
      const input = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'Response',
        exportInterfaces: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.code).toContain('export interface Response');
      expect(result.data?.code).toContain('export interface UserProfile');
      expect(result.data?.code).toContain('export interface UserSettings');
      expect(result.data?.code).toContain('theme: string;');
    });

    it('should generate array types', async () => {
      const input = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
        tags: ['tag1', 'tag2', 'tag3'],
        scores: [95, 87, 92],
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'Data',
      });

      expect(result.success).toBe(true);
      expect(result.data?.code).toContain('users: { id: number; name: string; }[];');
      expect(result.data?.code).toContain('tags: string[];');
      expect(result.data?.code).toContain('scores: number[];');
    });

    it('should handle unions and optional properties', async () => {
      const input = {
        value: 'string',
        count: 42,
        flag: true,
        maybeUndefined: undefined,
        maybeNull: null,
        arrayOrString: ['item1', 'item2'],
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'Test',
        handleUnions: true,
        optionalUndefined: true,
        nullableTypes: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.code).toContain('maybeUndefined?: string | undefined;');
      expect(result.data?.code).toContain('maybeNull: string | null;');
    });

    it('should handle Date objects and special types', async () => {
      const input = {
        createdAt: new Date(),
        updatedAt: '2023-01-01T00:00:00.000Z',
        regex: /test/g,
        func: () => console.log('test'),
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'Timestamped',
      });

      expect(result.success).toBe(true);
      expect(result.data?.code).toContain('createdAt: Date;');
      expect(result.data?.code).toContain('updatedAt: string;'); // ISO date string
      expect(result.data?.code).toContain('regex: RegExp;');
      expect(result.data?.code).toContain('func: Function;');
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should handle complex nested user object', async () => {
      const complexUser: ComplexUserType = {
        id: 12345,
        profile: {
          name: 'John Developer',
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false,
            },
          },
        },
        posts: [
          {
            id: 'post-1',
            title: 'Hello World',
            content: 'This is a post',
            tags: ['javascript', 'typescript'],
            metadata: {
              views: 100,
              likes: 25,
            },
            published: true,
            createdAt: '2023-01-01T12:00:00.000Z',
          },
        ],
        lastLogin: new Date(),
        isActive: true,
      };

      const result = await generateTypeScriptTypes(complexUser, {
        rootTypeName: 'ComplexUser',
        exportInterfaces: true,
        generateJSDoc: true,
        optionalUndefined: true,
        handleUnions: true,
        preferInterface: true,
        strictNullChecks: true,
      });

      expect(result.success).toBe(true);

      // Verify main interface is generated
      expect(result.data?.code).toContain('export interface ComplexUser');

      // Verify nested interfaces
      expect(result.data?.code).toContain('export interface UserProfile');
      expect(result.data?.code).toContain('export interface UserPreferences');
      expect(result.data?.code).toContain('export interface Notifications');
      expect(result.data?.code).toContain('export interface Post');

      // Verify array types are correct
      expect(result.data?.code).toContain('posts: Post[];');

      // Verify Date type is preserved
      expect(result.data?.code).toContain('lastLogin: Date;');

      // Verify optional properties
      expect(result.data?.code).toContain('email?: string;');
      expect(result.data?.code).toContain('metadata?: Record<string, unknown>;');
    });

    it('should handle API response with metadata', async () => {
      const apiResponse = {
        data: {
          users: [
            { id: 1, name: 'John', role: 'admin' },
            { id: 2, name: 'Jane', role: 'user' },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 100,
            hasNext: true,
            hasPrev: false,
          },
        },
        success: true,
        message: 'Users retrieved successfully',
        timestamp: '2023-01-01T12:00:00.000Z',
        requestId: 'req-12345',
      };

      const result = await generateTypeScriptTypes(apiResponse, {
        rootTypeName: 'ApiResponse',
        exportInterfaces: true,
        generateJSDoc: true,
        optionalUndefined: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.code).toContain('export interface ApiResponse');
      expect(result.data?.code).toContain('export interface Data');
      expect(result.data?.code).toContain('export interface User');
      expect(result.data?.code).toContain('export interface Pagination');
      expect(result.data?.code).toContain('users: User[];');
      expect(result.data?.code).toContain('pagination: Pagination;');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large JSON structures efficiently', async () => {
      // Create a large JSON structure
      const largeData = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          profile: {
            bio: `This is the bio for user ${i + 1}`,
            settings: {
              theme: i % 2 === 0 ? 'light' : 'dark',
              notifications: {
                email: i % 3 === 0,
                push: i % 5 === 0,
              },
            },
          },
        })),
      };

      const startTime = performance.now();
      const result = await generateTypeScriptTypes(largeData, {
        rootTypeName: 'LargeData',
      });
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.data?.code).toContain('export interface LargeData');
      expect(result.data?.code).toContain(
        'users: { id: number; name: string; email: string; profile: { bio: string; settings: { theme: string; notifications: { email: boolean; push: boolean; }; }; }; }[];'
      );
    });

    it('should handle deeply nested structures', async () => {
      // Create a deeply nested structure (10 levels)
      let deepNested: any = { value: 'deep' };
      for (let i = 9; i >= 0; i--) {
        deepNested = { [`level${i}`]: deepNested };
      }

      const result = await generateTypeScriptTypes(deepNested, {
        rootTypeName: 'DeepNested',
      });

      expect(result.success).toBe(true);
      expect(result.data?.code).toContain('export interface DeepNested');

      // Verify all levels are generated
      for (let i = 0; i < 10; i++) {
        expect(result.data?.code).toContain(`export interface Level${i}`);
      }
    });
  });

  describe('Code Quality and Style', () => {
    it('should generate properly formatted TypeScript code', async () => {
      const input = {
        user: {
          id: 1,
          name: 'John',
          email: 'john@example.com',
        },
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'Test',
        exportInterfaces: true,
        generateJSDoc: true,
        optionalUndefined: true,
      });

      expect(result.success).toBe(true);
      const code = result.data?.code || '';

      // Check for proper formatting
      expect(code).toMatch(/\{\s*\n\s*\w+:\s*\w+;\s*\n\s*\}/); // Proper spacing and newlines
      expect(code).not.toContain(/;;\s*\n/); // No double semicolons
      expect(code).not.toContain(/\n\s*\n\s*\n/); // No excessive empty lines
    });

    it('should include JSDoc comments when enabled', async () => {
      const input = {
        /** User profile information */
        user: {
          /** Unique identifier */
          id: 1,
          /** User's full name */
          name: 'John Doe',
        },
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'Test',
        generateJSDoc: true,
      });

      expect(result.success).toBe(true);
      const code = result.data?.code || '';

      // Check for JSDoc comments
      expect(code).toContain('/**');
      expect(code).toContain('* User profile information');
      expect(code).toContain('* Unique identifier');
      expect(code).toContain("* User's full name");
    });

    it('should handle special characters and reserved words', async () => {
      const input = {
        'with-dash': 'value',
        'with space': 'value',
        '123number': 'value',
        class: 'reserved word',
        interface: 'another reserved word',
        default: 'yet another reserved word',
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'ReservedWords',
      });

      expect(result.success).toBe(true);
      const code = result.data?.code || '';

      // Should handle reserved words properly
      expect(code).toContain('`class`: string;');
      expect(code).toContain('`interface`: string;');
      expect(code).toContain('`default`: string;');
    });
  });

  describe('Error Handling', () => {
    it('should handle circular references gracefully', async () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const result = await generateTypeScriptTypes(circular, {
        rootTypeName: 'Circular',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('circular');
    });

    it('should handle invalid JSON input', async () => {
      const invalidInputs = [null, undefined, 'string', 42, true, () => {}];

      for (const input of invalidInputs) {
        const result = await generateTypeScriptTypes(input, {
          rootTypeName: 'Invalid',
        });

        expect(result.success).toBe(false);
      }
    });

    it('should handle extremely long property names', async () => {
      const longName = 'a'.repeat(1000);
      const input = {
        [longName]: 'value',
      };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'LongName',
      });

      expect(result.success).toBe(true);
      // Should truncate or handle long names appropriately
      expect(result.data?.code).not.toContain(longName);
    });
  });

  describe('Integration with Tool System', () => {
    it('should work with tool execution service', async () => {
      const request: ToolExecutionRequest = {
        toolId: 'json-code-generator',
        action: 'generate-typescript',
        parameters: {
          json: '{"name": "John", "age": 30}',
          options: {
            rootTypeName: 'User',
            exportInterfaces: true,
          },
        },
      };

      const result = await executionService.executeTool(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.code).toContain('export interface User');
    });

    it('should maintain state across multiple generations', async () => {
      const firstRequest: ToolExecutionRequest = {
        toolId: 'json-code-generator',
        action: 'generate-typescript',
        parameters: {
          json: '{"name": "John"}',
          options: { rootTypeName: 'User1' },
        },
      };

      const secondRequest: ToolExecutionRequest = {
        toolId: 'json-code-generator',
        action: 'generate-typescript',
        parameters: {
          json: '{"name": "Jane"}',
          options: { rootTypeName: 'User2' },
        },
      };

      const firstResult = await executionService.executeTool(firstRequest);
      const secondResult = await executionService.executeTool(secondRequest);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);

      // Verify both interfaces are generated independently
      expect(firstResult.data?.code).toContain('export interface User1');
      expect(secondResult.data?.code).toContain('export interface User2');
    });

    it('should emit appropriate events during generation', async () => {
      const events: ToolEvent[] = [];
      const eventListener = (event: ToolEvent) => {
        events.push(event);
      };

      // Mock event bus
      const eventBus = { addEventListener: jest.fn(eventListener) } as any;
      executionService.setEventBus(eventBus);

      const request: ToolExecutionRequest = {
        toolId: 'json-code-generator',
        action: 'generate-typescript',
        parameters: {
          json: '{"name": "John"}',
          options: { rootTypeName: 'User' },
        },
      };

      await executionService.executeTool(request);

      // Verify events were emitted
      const relevantEvents = events.filter((e) => e.toolId === 'json-code-generator');
      expect(relevantEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Constitutional Compliance', () => {
    it('should comply with client-side processing requirements', async () => {
      const input = { name: 'John', age: 30 };

      // Verify no network calls are made
      const networkSpy = jest.spyOn(global, 'fetch').mockImplementation();

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'User',
      });

      expect(result.success).toBe(true);
      expect(networkSpy).not.toHaveBeenCalled();

      networkSpy.mockRestore();
    });

    it('should not use eval() or dynamic code execution', async () => {
      const evalSpy = jest.spyOn(global, 'eval').mockImplementation();
      const constructorSpy = jest
        .spyOn(global.Function.prototype, 'constructor')
        .mockImplementation();

      const input = { name: 'John' };

      const result = await generateTypeScriptTypes(input, {
        rootTypeName: 'User',
      });

      expect(result.success).toBe(true);
      expect(evalSpy).not.toHaveBeenCalled();

      constructorSpy.mockRestore();
      evalSpy.mockRestore();
    });

    it('should handle memory within constitutional limits', async () => {
      const largeInput = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(100), // 100 characters per item
      }));

      const initialMemory = process.memoryUsage();

      const result = await generateTypeScriptTypes(largeInput, {
        rootTypeName: 'LargeData',
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(result.success).toBe(true);
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });
  });
});
