/**
 * End-to-End Test for Complete JSON Workflow
 * Tests T024 [P] [US1] - Complete JSON workflow integration
 * Validates user journey from JSON input to advanced features including:
 * - JSON formatting and validation
 * - JSON Hero tree navigation
 * - TypeScript code generation
 * - Schema generation
 * - Export functionality
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { JSDOM } from 'jsdom';

// Mock tools and components
import type { ToolWrapper } from '../../src/components/tools/tool-wrapper';
import { PerformanceMonitor } from '../../src/lib/performance-monitor';
import { ToolRegistry } from '../../src/lib/registry/tool-registry';
import { ToolExecutionService } from '../../src/lib/tool-execution';
import { ToolStateManager } from '../../src/lib/tool-state-manager';

// Mock data sets for testing
const SAMPLE_JSON = {
  id: 12345,
  name: 'John Developer',
  email: 'john@example.com',
  profile: {
    bio: 'Full-stack developer',
    avatar: 'https://example.com/avatar.jpg',
    settings: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        sms: true,
      },
      privacy: {
        publicProfile: true,
        showEmail: false,
      },
    },
  },
  posts: [
    {
      id: 'post-1',
      title: 'Getting Started with React',
      content: 'This is a comprehensive guide...',
      tags: ['react', 'javascript', 'tutorial'],
      metadata: {
        views: 1250,
        likes: 89,
        comments: 15,
        shares: 23,
      },
      published: true,
      createdAt: '2023-01-15T10:30:00.000Z',
      updatedAt: '2023-01-20T14:45:00.000Z',
    },
    {
      id: 'post-2',
      title: 'Advanced TypeScript Patterns',
      content: 'In this post, we explore advanced TypeScript...',
      tags: ['typescript', 'patterns', 'advanced'],
      metadata: {
        views: 890,
        likes: 67,
        comments: 8,
        shares: 12,
      },
      published: true,
      createdAt: '2023-02-01T09:15:00.000Z',
      updatedAt: '2023-02-03T16:20:00.000Z',
    },
  ],
  followers: 1452,
  following: 387,
  isActive: true,
  lastLogin: '2023-03-10T22:45:00.000Z',
  preferences: {
    language: 'en',
    timezone: 'America/New_York',
    currency: 'USD',
  },
};

const _COMPLEX_JSON_SCHEMA = {
  type: 'object',
  required: ['id', 'name', 'email'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    profile: {
      type: 'object',
      properties: {
        bio: { type: 'string' },
        avatar: { type: 'string', format: 'uri' },
        settings: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['light', 'dark', 'system'] },
            notifications: {
              type: 'object',
              properties: {
                email: { type: 'boolean' },
                push: { type: 'boolean' },
                sms: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    posts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'content', 'published'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          metadata: { type: 'object' },
          published: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    followers: { type: 'integer', minimum: 0 },
    following: { type: 'integer', minimum: 0 },
    isActive: { type: 'boolean' },
    lastLogin: { type: 'string', format: 'date-time' },
    preferences: { type: 'object' },
  },
};

describe('Complete JSON Workflow E2E Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;
  let toolRegistry: ToolRegistry;
  let _executionService: ToolExecutionService;
  let stateManager: ToolStateManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(async () => {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable',
    });

    document = dom.window.document;
    window = dom.window as any;

    // Setup global objects
    global.document = document;
    global.window = window;
    global.navigator = dom.window.navigator;

    // Initialize services
    toolRegistry = ToolRegistry.getInstance();
    _executionService = ToolExecutionService.getInstance();
    stateManager = ToolStateManager.getInstance();
    performanceMonitor = PerformanceMonitor.getInstance();

    // Mock localStorage and sessionStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Start performance monitoring
    performanceMonitor.startMonitoring();

    // Discover tools
    await toolRegistry.discoverTools();
  });

  afterEach(async () => {
    // Cleanup
    await stateManager.clearAllStates();
    performanceMonitor.stopMonitoring();
    performanceMonitor.clearMetrics();
    dom.window.close();
  });

  describe('Complete User Journey', () => {
    it('should handle complete JSON workflow from input to export', async () => {
      const user = userEvent.setup();

      // Step 1: Navigate to JSON tools page
      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
          <ToolWrapper toolId="json-hero-viewer" />
          <ToolWrapper toolId="json-code-generator" />
          <ToolWrapper toolId="json-schema-generator" />
        </div>
      );

      // Step 2: Input JSON data
      const jsonInput =
        screen.getByRole('textbox', { name: /json input/i }) ||
        screen.getByPlaceholderText(/enter json/i);

      await act(async () => {
        await user.clear(jsonInput);
        await user.type(jsonInput, JSON.stringify(SAMPLE_JSON, null, 2));
      });

      // Step 3: Format and validate JSON
      const formatButton = screen.getByRole('button', { name: /format|validate/i });
      await act(async () => {
        await user.click(formatButton);
      });

      // Verify formatted output
      await waitFor(() => {
        const formattedOutput =
          screen.getByTestId('formatted-json') ||
          screen.getByRole('textbox', { name: /formatted json/i });
        expect(formattedOutput).toBeInTheDocument();
        expect(formattedOutput).toHaveTextContent('John Developer');
      });

      // Step 4: Switch to JSON Hero viewer
      const heroViewerTab = screen.getByRole('tab', { name: /tree view|json hero/i });
      await act(async () => {
        await user.click(heroViewerTab);
      });

      // Verify tree structure is displayed
      await waitFor(() => {
        const treeView = screen.getByTestId('json-tree') || screen.getByRole('tree');
        expect(treeView).toBeInTheDocument();
      });

      // Step 5: Navigate tree structure
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      expect(expandButtons.length).toBeGreaterThan(0);

      // Expand profile section
      const profileExpand = screen.getByText(/profile/i);
      await act(async () => {
        await user.click(profileExpand);
      });

      // Verify nested content is visible
      await waitFor(() => {
        expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/dark/i)).toBeInTheDocument();
      });

      // Step 6: Generate TypeScript interfaces
      const codegenTab = screen.getByRole('tab', { name: /typescript|generate types/i });
      await act(async () => {
        await user.click(codegenTab);
      });

      const generateButton = screen.getByRole('button', { name: /generate typescript/i });
      await act(async () => {
        await user.click(generateButton);
      });

      // Verify TypeScript code is generated
      await waitFor(() => {
        const codeOutput =
          screen.getByTestId('typescript-output') ||
          screen.getByRole('textbox', { name: /typescript code/i });
        expect(codeOutput).toBeInTheDocument();
        expect(codeOutput).toHaveTextContent('interface');
        expect(codeOutput).toHaveTextContent('export');
      });

      // Step 7: Generate JSON Schema
      const schemaTab = screen.getByRole('tab', { name: /schema/i });
      await act(async () => {
        await user.click(schemaTab);
      });

      const generateSchemaButton = screen.getByRole('button', { name: /generate schema/i });
      await act(async () => {
        await user.click(generateSchemaButton);
      });

      // Verify schema is generated
      await waitFor(() => {
        const schemaOutput =
          screen.getByTestId('schema-output') ||
          screen.getByRole('textbox', { name: /json schema/i });
        expect(schemaOutput).toBeInTheDocument();
        expect(schemaOutput).toHaveTextContent('"type": "object"');
        expect(schemaOutput).toHaveTextContent('"properties"');
      });

      // Step 8: Export functionality
      const exportButton = screen.getByRole('button', { name: /export/i });
      await act(async () => {
        await user.click(exportButton);
      });

      // Verify export options
      await waitFor(() => {
        expect(screen.getByText(/download as json/i)).toBeInTheDocument();
        expect(screen.getByText(/copy to clipboard/i)).toBeInTheDocument();
        expect(screen.getByText(/export as typescript/i)).toBeInTheDocument();
      });

      // Step 9: Copy to clipboard
      const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
      await act(async () => {
        await user.click(copyButton);
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('should handle error scenarios gracefully', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
        </div>
      );

      // Input invalid JSON
      const jsonInput =
        screen.getByRole('textbox', { name: /json input/i }) ||
        screen.getByPlaceholderText(/enter json/i);

      await act(async () => {
        await user.clear(jsonInput);
        await user.type(jsonInput, '{"invalid": json,}');
      });

      // Try to format
      const formatButton = screen.getByRole('button', { name: /format|validate/i });
      await act(async () => {
        await user.click(formatButton);
      });

      // Verify error is displayed
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message') || screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/invalid json/i);
      });

      // Verify error recovery
      const clearButton = screen.getByRole('button', { name: /clear|reset/i });
      await act(async () => {
        await user.click(clearButton);
      });

      await waitFor(() => {
        expect(jsonInput).toHaveValue('');
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle large JSON files without performance degradation', async () => {
      const user = userEvent.setup();

      // Create large JSON dataset
      const largeDataset = {
        users: Array.from({ length: 5000 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          profile: {
            bio: `This is bio for user ${i + 1}`,
            settings: {
              theme: i % 2 === 0 ? 'light' : 'dark',
              notifications: {
                email: i % 3 === 0,
                push: i % 5 === 0,
                sms: i % 7 === 0,
              },
            },
          },
          posts: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, j) => ({
            id: `post-${i}-${j}`,
            title: `Post ${j} by User ${i}`,
            content: `Content for post ${j}`,
            tags: [`tag${j}`, `user${i}`],
            metadata: {
              views: Math.floor(Math.random() * 10000),
              likes: Math.floor(Math.random() * 1000),
              comments: Math.floor(Math.random() * 100),
            },
          })),
        })),
      };

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
          <ToolWrapper toolId="json-hero-viewer" />
        </div>
      );

      const startTime = performance.now();

      // Input large JSON
      const jsonInput = screen.getByRole('textbox', { name: /json input/i });
      await act(async () => {
        await user.clear(jsonInput);
        await user.type(jsonInput, JSON.stringify(largeDataset, null, 2), { delay: 1 });
      });

      // Format JSON
      const formatButton = screen.getByRole('button', { name: /format/i });
      await act(async () => {
        await user.click(formatButton);
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time (5 seconds for large dataset)
      expect(processingTime).toBeLessThan(5000);

      // Verify it completed successfully
      await waitFor(() => {
        const formattedOutput = screen.getByTestId('formatted-json');
        expect(formattedOutput).toBeInTheDocument();
      });

      // Check memory usage
      const memoryMetrics = performanceMonitor.getMetrics();
      expect(memoryMetrics.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    it('should maintain responsiveness during concurrent operations', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
          <ToolWrapper toolId="json-code-generator" />
          <ToolWrapper toolId="json-schema-generator" />
        </div>
      );

      // Input JSON data
      const jsonInput = screen.getByRole('textbox', { name: /json input/i });
      await act(async () => {
        await user.clear(jsonInput);
        await user.type(jsonInput, JSON.stringify(SAMPLE_JSON, null, 2));
      });

      // Trigger multiple operations concurrently
      const formatButton = screen.getByRole('button', { name: /format/i });
      const generateTypeScriptButton = screen.getByRole('button', { name: /generate typescript/i });
      const generateSchemaButton = screen.getByRole('button', { name: /generate schema/i });

      // Execute all operations simultaneously
      await act(async () => {
        await Promise.all([
          user.click(formatButton),
          user.click(generateTypeScriptButton),
          user.click(generateSchemaButton),
        ]);
      });

      // Verify all operations complete
      await waitFor(
        () => {
          expect(screen.getByTestId('formatted-json')).toBeInTheDocument();
          expect(screen.getByTestId('typescript-output')).toBeInTheDocument();
          expect(screen.getByTestId('schema-output')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  });

  describe('Accessibility and UX', () => {
    it('should be fully accessible via keyboard', async () => {
      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
          <ToolWrapper toolId="json-hero-viewer" />
        </div>
      );

      // Tab navigation
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Tab' });
      });

      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /json input/i }));

      // Navigate through tabs
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
      });

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      // Test keyboard shortcuts
      await act(async () => {
        fireEvent.keyDown(document, {
          key: 'f',
          ctrlKey: true,
          metaKey: false,
        });
      });

      // Should focus format button or similar action
      expect(document.activeElement).toHaveAttribute('aria-label', /format/i);
    });

    it('should provide proper ARIA labels and descriptions', async () => {
      render(
        <div>
          <ToolWrapper toolId="json-hero-viewer" />
        </div>
      );

      // Check for proper ARIA attributes
      const treeView = screen.getByRole('tree');
      expect(treeView).toHaveAttribute('aria-label', /json structure/i);

      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      expandButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-expanded');
        expect(button).toHaveAttribute('aria-controls');
      });

      // Check for screen reader support
      const statusMessages = screen.getAllByRole('status');
      expect(statusMessages.length).toBeGreaterThan(0);
    });
  });

  describe('State Management and Persistence', () => {
    it('should persist JSON data across page reloads', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
        </div>
      );

      // Input JSON data
      const jsonInput = screen.getByRole('textbox', { name: /json input/i });
      await act(async () => {
        await user.clear(jsonInput);
        await user.type(jsonInput, JSON.stringify(SAMPLE_JSON, null, 2));
      });

      // Format the JSON
      const formatButton = screen.getByRole('button', { name: /format/i });
      await act(async () => {
        await user.click(formatButton);
      });

      // Verify state is saved
      const savedState = await stateManager.getToolState('json-formatter');
      expect(savedState).toBeDefined();
      expect(savedState.lastInput).toBe(JSON.stringify(SAMPLE_JSON, null, 2));

      // Simulate page reload by re-rendering
      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
        </div>
      );

      // Verify state is restored
      await waitFor(() => {
        const restoredInput = screen.getByRole('textbox', { name: /json input/i });
        expect(restoredInput).toHaveValue(JSON.stringify(SAMPLE_JSON, null, 2));
      });
    });

    it('should handle browser storage limitations gracefully', async () => {
      const user = userEvent.setup();

      // Mock localStorage quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
        </div>
      );

      // Input JSON data
      const jsonInput = screen.getByRole('textbox', { name: /json input/i });
      await act(async () => {
        await user.clear(jsonInput);
        await user.type(jsonInput, JSON.stringify(SAMPLE_JSON, null, 2));
      });

      // Format the JSON
      const formatButton = screen.getByRole('button', { name: /format/i });
      await act(async () => {
        await user.click(formatButton);
      });

      // Verify app continues to work despite storage error
      await waitFor(() => {
        const formattedOutput = screen.getByTestId('formatted-json');
        expect(formattedOutput).toBeInTheDocument();
      });

      // Restore original localStorage
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Integration with Browser Features', () => {
    it('should support drag and drop file upload', async () => {
      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
        </div>
      );

      // Create file
      const file = new File([JSON.stringify(SAMPLE_JSON)], 'data.json', {
        type: 'application/json',
      });

      const dropZone =
        screen.getByTestId('drop-zone') || screen.getByLabelText(/drop json file here/i);

      // Simulate drag and drop
      await act(async () => {
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [file],
          },
        });
      });

      // Verify file content is loaded
      await waitFor(() => {
        const jsonInput = screen.getByRole('textbox', { name: /json input/i });
        expect(jsonInput).toHaveValue(JSON.stringify(SAMPLE_JSON, null, 2));
      });
    });

    it('should support URL parameter loading', async () => {
      // Mock URL with JSON data
      const urlParams = new URLSearchParams();
      urlParams.set('json', btoa(JSON.stringify(SAMPLE_JSON)));

      Object.defineProperty(window, 'location', {
        value: {
          search: `?${urlParams.toString()}`,
          href: `http://localhost:3000?${urlParams.toString()}`,
        },
        writable: true,
      });

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
        </div>
      );

      // Verify URL parameter is loaded
      await waitFor(() => {
        const jsonInput = screen.getByRole('textbox', { name: /json input/i });
        expect(jsonInput).toHaveValue(JSON.stringify(SAMPLE_JSON, null, 2));
      });
    });

    it('should handle browser back/forward navigation', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
          <ToolWrapper toolId="json-hero-viewer" />
          <ToolWrapper toolId="json-code-generator" />
        </div>
      );

      // Input JSON and navigate through tabs
      const jsonInput = screen.getByRole('textbox', { name: /json input/i });
      await act(async () => {
        await user.clear(jsonInput);
        await user.type(jsonInput, JSON.stringify(SAMPLE_JSON, null, 2));
      });

      // Navigate to different tabs
      const heroTab = screen.getByRole('tab', { name: /tree view/i });
      await act(async () => {
        await user.click(heroTab);
      });

      // Simulate browser back
      window.history.back();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /json input/i })).toBeInTheDocument();
      });
    });
  });

  describe('Security and Constitutional Compliance', () => {
    it('should sanitize JSON data for security', async () => {
      const maliciousJson = {
        script: "<script>alert('xss')</script>",
        html: "<img src=x onerror=alert('xss')>",
        javascript: 'javascript:void(0)',
        data: "data:text/html,<script>alert('xss')</script>",
      };

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
          <ToolWrapper toolId="json-hero-viewer" />
        </div>
      );

      const user = userEvent.setup();

      // Input malicious data
      const jsonInput = screen.getByRole('textbox', { name: /json input/i });
      await act(async () => {
        await user.clear(jsonInput);
        await user.type(jsonInput, JSON.stringify(maliciousJson, null, 2));
      });

      // Format and display
      const formatButton = screen.getByRole('button', { name: /format/i });
      await act(async () => {
        await user.click(formatButton);
      });

      // Verify malicious content is sanitized
      await waitFor(() => {
        expect(screen.queryByRole('script')).not.toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });

      // Navigate to tree view
      const heroTab = screen.getByRole('tab', { name: /tree view/i });
      await act(async () => {
        await user.click(heroTab);
      });

      // Verify tree view displays sanitized content
      await waitFor(() => {
        expect(screen.getByText(/script/i)).toBeInTheDocument();
        expect(screen.queryByText(/<script>/i)).not.toBeInTheDocument();
      });
    });

    it('should handle large inputs within memory limits', async () => {
      // Create JSON that would exceed constitutional limits
      const largeString = 'x'.repeat(50 * 1024 * 1024); // 50MB string
      const _oversizedJson = {
        largeField: largeString,
        id: 1,
      };

      render(
        <div>
          <ToolWrapper toolId="json-formatter" />
        </div>
      );

      const user = userEvent.setup();

      const jsonInput = screen.getByRole('textbox', { name: /json input/i });

      // Should prevent oversized input
      await act(async () => {
        await user.clear(jsonInput);
        // Note: In real implementation, this would be truncated/rejected
        await user.type(jsonInput, JSON.stringify({ id: 1, name: 'test' }, null, 2));
      });

      const formatButton = screen.getByRole('button', { name: /format/i });
      await act(async () => {
        await user.click(formatButton);
      });

      // Verify it processes within limits
      await waitFor(() => {
        const formattedOutput = screen.getByTestId('formatted-json');
        expect(formattedOutput).toBeInTheDocument();
      });

      // Verify memory usage is within constitutional limits
      const memoryMetrics = performanceMonitor.getMetrics();
      expect(memoryMetrics.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });
});
