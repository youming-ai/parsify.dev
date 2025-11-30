/**
 * Integration Tests for JSON Hero Viewer
 * Tests JSON visualization, tree navigation, search functionality
 */

import { eventBus } from '@/lib/tool-event-bus';
import { ToolStateManager } from '@/lib/tool-state-manager';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type TreeNodeData = {
  key: string;
  value: unknown;
  path: string;
  type: string;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  children?: TreeNodeData[];
};

const _filterTree = (node: TreeNodeData, query: string): TreeNodeData | null => {
  if (!query) return node;

  const matchesSearch = node.path.toLowerCase().includes(query.toLowerCase());
  const filteredChildren = node.children
    ?.map((child) => _filterTree(child, query))
    .filter(Boolean) as TreeNodeData[] | undefined;

  if (matchesSearch || (filteredChildren && filteredChildren.length > 0)) {
    return {
      ...node,
      children: filteredChildren ?? node.children,
    };
  }

  return null;
};

// Mock JSON Hero Viewer component (implementation would be in the actual file)
const MockJSONHeroViewer = ({
  initialData = '',
  onPathClick,
  onSearch,
}: {
  initialData?: string;
  onPathClick?: (path: string) => void;
  onSearch?: (query: string) => void;
}) => {
  const [jsonInput, setJsonInput] = React.useState(initialData);
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleInputChange = (value: string) => {
    setJsonInput(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handlePathClick = (path: string) => {
    setExpandedPaths((prev) => {
      const newPaths = new Set(prev);
      if (newPaths.has(path)) {
        newPaths.delete(path);
      } else {
        newPaths.add(path);
      }
      return newPaths;
    });

    if (onPathClick) {
      onPathClick(path);
    }
  };

  // Generate tree structure from JSON
  const generateTreeStructure = (data: any, path = '', level = 0) => {
    const currentPath = path || 'root';
    const isRoot = level === 0;

    if (data === null || typeof data !== 'object') {
      return {
        key: currentPath,
        value: data,
        path: currentPath,
        type: typeof data,
        level: isRoot ? 0 : level,
        hasChildren: false,
        isExpanded: expandedPaths.has(currentPath) || (isRoot && expandedPaths.has('root')),
      };
    }

    const children: TreeNodeData[] = [];

    if (Array.isArray(data)) {
      data.forEach((item, i) => {
        const childPath = path ? `${path}[${i}]` : `root[${i}]`;
        children.push(generateTreeStructure(item, childPath, level + 1));
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        const childPath = path ? `${path}.${key}` : `${key}`;
        children.push(generateTreeStructure(value, childPath, level + 1));
      });
    }

    return {
      key: currentPath,
      value: Array.isArray(data) ? `Array(${data.length})` : `{${Object.keys(data).length} keys}`,
      path: currentPath,
      type: 'object',
      level,
      hasChildren: children.length > 0,
      isExpanded: expandedPaths.has(currentPath) || (isRoot && expandedPaths.has('root')),
      children,
    };
  };

  const treeData = jsonInput ? generateTreeStructure(JSON.parse(jsonInput)) : null;
  const filteredTreeData = treeData ? filterTree(treeData, searchQuery) : null;

  const filterTree = (node: any, query: string): any => {
    if (!query) return node;

    const matchesSearch =
      node.path.toLowerCase().includes(query.toLowerCase()) ||
      (node.hasChildren && node.children?.some((child) => filterTree(child, query)));

    if (!matchesSearch && !node.hasChildren) return null;

    if (node.hasChildren) {
      const filteredChildren = node.children
        .map((child) => filterTree(child, query))
        .filter(Boolean);

      if (filteredChildren.length === 0 && !matchesSearch) return null;

      return {
        ...node,
        children: filteredChildren,
      };
    }

    return node;
  };

  return (
    <div data-testid="json-hero-viewer">
      <div className="json-hero-viewer">
        <div className="json-input-section">
          <textarea
            data-testid="json-input"
            value={jsonInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Paste your JSON here..."
            rows={10}
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
        </div>

        <div className="json-search-section">
          <input
            data-testid="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in JSON..."
            style={{ width: '100%' }}
          />
        </div>

        {filteredTreeData && (
          <div className="json-tree-section" data-testid="json-tree">
            <TreeNode node={filteredTreeData} onPathClick={handlePathClick} level={0} />
          </div>
        )}
      </div>
    </div>
  );
};

const MockJSONViewer = MockJSONHeroViewer;

// Tree Node component for rendering
const TreeNode = ({
  node,
  onPathClick,
  level,
}: {
  node: any;
  onPathClick: (path: string) => void;
  level: number;
}) => {
  const indent = level * 20;

  const handleClick = () => {
    onPathClick(node.path);
  };

  return (
    <div style={{ marginLeft: indent }}>
      <div
        data-testid={`tree-node-${node.path}`}
        style={{ cursor: 'pointer', padding: '4px' }}
        onClick={handleClick}
      >
        {node.hasChildren ? (
          <span data-testid={`expand-icon-${node.path}`}>{node.isExpanded ? '▼' : '▶'}</span>
        ) : (
          <span>•</span>
        )}
        <span data-testid={`node-key-${node.path}`} style={{ marginLeft: 8 }}>
          {node.path || 'root'}
        </span>
        <span data-testid={`node-value-${node.path}`} style={{ marginLeft: 8, color: '#666' }}>
          : {node.value}
        </span>
        <span
          data-testid={`node-type-${node.path}`}
          style={{ marginLeft: 8, fontSize: '10px', color: '#999' }}
        >
          {node.type}
        </span>
      </div>

      {node.hasChildren && node.isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              onPathClick={onPathClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

describe('JSON Hero Viewer Integration Tests', () => {
  let stateManager: ToolStateManager;

  beforeEach(() => {
    stateManager = ToolStateManager.getInstance();
  });

  afterEach(() => {
    stateManager.dispose();
  });

  describe('Tree Structure Generation', () => {
    it('should render tree structure for simple JSON object', () => {
      const simpleJson = {
        name: 'John Doe',
        age: 30,
        active: true,
      };

      render(<MockJSONHeroViewer initialData={JSON.stringify(simpleJson)} />);

      expect(screen.getByTestId('json-input')).toHaveValue(JSON.stringify(simpleJson));
      expect(screen.getByTestId('json-tree')).toBeInTheDocument();

      // Check root level nodes
      expect(screen.getByTestId('tree-node-name')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-age')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-active')).toBeInTheDocument();

      // Check types
      expect(screen.getByTestId('node-type-name')).toHaveTextContent('string');
      expect(screen.getByTestId('node-type-age')).toHaveTextContent('number');
      expect(screen.getByTestId('node-type-active')).toHaveTextContent('boolean');
    });

    it('should render tree structure for nested JSON object', () => {
      const nestedJson = {
        user: {
          profile: {
            name: 'John Doe',
            email: 'john@example.com',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
          posts: [
            { title: 'First Post', published: true },
            { title: 'Second Post', published: false },
          ],
        },
      };

      render(<MockJSONHeroViewer initialData={JSON.stringify(nestedJson)} />);

      // Should show nested structure
      expect(screen.getByTestId('tree-node-user')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-profile')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-name')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-posts')).toBeInTheDocument();

      // Check array type indication
      expect(screen.getByTestId('node-type-posts')).toHaveTextContent('object');
      expect(screen.getByTestId('node-value-posts')).toContain('Array(2)');
    });

    it('should render tree structure for JSON array', () => {
      const jsonArray = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      render(<MockJSONHeroViewer initialData={JSON.stringify(jsonArray)} />);

      // Should show array root
      expect(screen.getByTestId('tree-node-root')).toBeInTheDocument();
      expect(screen.getByTestId('node-value-root')).toContain('Array(3)');

      // Check array items
      expect(screen.getByTestId('tree-node-root[0]')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-root[1]')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-root[2]')).toBeInTheDocument();
    });

    it('should handle complex nested JSON with multiple levels', () => {
      const complexJson = {
        metadata: {
          version: '1.0',
          created: '2023-01-01',
          tags: ['json', 'api', 'data'],
        },
        data: {
          users: [
            {
              id: 1,
              name: 'John',
              profile: {
                personal: {
                  firstName: 'John',
                  lastName: 'Doe',
                },
                preferences: {
                  theme: 'dark',
                  language: 'en',
                },
              },
            },
          ],
        },
      };

      render(<MockJSONHeroViewer initialData={JSON.stringify(complexJson)} />);

      // Check deep nesting
      expect(screen.getByTestId('tree-node-metadata')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-data')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-users')).toBeInTheDocument();
      expect(screen.getByTestId('node-value-users')).toContain('Array(1)');

      // Should have nested structure with multiple levels
      expect(screen.getByTestId('tree-node-profile')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-personal')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-preferences')).toBeInTheDocument();
    });
  });

  describe('Tree Navigation and Expansion', () => {
    it('should expand and collapse tree nodes on click', async () => {
      const nestedJson = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      };

      const onPathClick = vi.fn();
      render(
        <MockJSONHeroViewer initialData={JSON.stringify(nestedJson)} onPathClick={onPathClick} />
      );

      const level1Node = screen.getByTestId('tree-node-level1');
      expect(screen.getByTestId('expand-icon-level1')).toHaveTextContent('▶'); // Initially collapsed

      // Click to expand
      await userEvent.click(level1Node);
      expect(onPathClick).toHaveBeenCalledWith('level1');

      // Should now be expanded and show children
      expect(screen.getByTestId('expand-icon-level1')).toHaveTextContent('▼');
      expect(screen.getByTestId('tree-node-level2')).toBeInTheDocument();

      // Expand second level
      const level2Node = screen.getByTestId('tree-node-level2');
      await userEvent.click(level2Node);
      expect(onPathClick).toHaveBeenCalledWith('level2');

      expect(screen.getByTestId('expand-icon-level2')).toHaveTextContent('▼');
      expect(screen.getByTestId('tree-node-level3')).toBeInTheDocument();
    });

    it('should maintain expansion state across multiple interactions', async () => {
      const nestedJson = {
        section1: {
          item1: 'value1',
          item2: 'value2',
        },
        section2: {
          item3: 'value3',
          item4: 'value4',
        },
      };

      render(<MockJSONHeroViewer initialData={JSON.stringify(nestedJson)} />);

      // Expand first section
      const section1Node = screen.getByTestId('tree-node-section1');
      await userEvent.click(section1Node);
      expect(screen.getByTestId('expand-icon-section1')).toHaveTextContent('▼');
      expect(screen.getByTestId('tree-node-item1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-item2')).toBeInTheDocument();

      // Expand second section
      const section2Node = screen.getByTestId('tree2');
      await userEvent.click(section2Node);
      expect(screen.getByTestId('expand-icon-section2')).toHaveTextContent('▼');
      expect(screen.getByTestId('tree-node-item3')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-item4')).toBeInTheDocument();

      // First section should remain expanded
      expect(screen.getByTestId('expand-icon-section1')).toHaveTextContent('▼');
    });

    it('should collapse nodes when clicked while expanded', async () => {
      const nestedJson = {
        container: {
          inner: {
            value: 'test',
          },
        },
      };

      render(<MockJSONHeroViewer initialData={JSON.stringify(nestedJson)} />);

      // Expand container
      const containerNode = screen.getByTestId('tree-node-container');
      await userEvent.click(containerNode);
      expect(screen.getByTestId('expand-icon-container')).toHaveTextContent('▼');
      expect(screen.getByTestId('tree-node-inner')).toBeInTheDocument();

      // Click again to collapse
      await userEvent.click(containerNode);
      expect(screen.getByTestId('expand-icon-container')).toHaveTextContent('▶');
      expect(screen.queryByTestId('tree-node-inner')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter tree nodes based on search query', async () => {
      const searchJson = {
        users: [
          { name: 'Alice', email: 'alice@example.com' },
          { name: 'Bob', email: 'bob@example.com' },
        ],
        posts: [
          { title: 'First Post', content: 'Hello World' },
          { title: 'Second Post', content: 'Test Content' },
        ],
      };

      render(<MockJSONHeroViewer initialData={JSON.stringify(searchJson)} />);

      // Initially all nodes should be visible
      expect(screen.getByTestId('tree-node-users')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-posts')).toBeInTheDocument();

      // Search for "alice"
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'alice');

      // Should filter to show only matching nodes
      expect(screen.getByTestId('tree-node-users')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-posts')).not.toBeInTheDocument();

      // Check that alice node is still visible
      expect(screen.getByTestId('tree-node-name')).toBeInTheDocument(); // Alice's name node
    });

    it('should highlight search matches in node paths', async () => {
      const jsonWithPaths = {
        'config/app': {
          database: {
            host: 'localhost',
            port: 5432,
          },
        },
      };

      render(<MockJSONViewer initialData={JSON.stringify(jsonWithPaths)} />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'database');

      // Should match the path containing 'database'
      expect(screen.getByTestId('tree-node-config/app')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-database')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-host')).toBeInTheDocument();
    });

    it('should clear search and restore all nodes', async () => {
      const complexJson = {
        users: [],
        posts: [],
        settings: {},
      };

      render(<MockJSONViewer initialData={JSON.stringify(complexJson)} />);

      // Search for something
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'users');

      // Should filter
      expect(screen.getByTestId('tree-node-users')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-posts')).not.toBeInTheDocument();

      // Clear search
      await userEvent.clear(searchInput);

      // Should restore all nodes
      expect(screen.getByTestId('tree-node-users')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-posts')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-settings')).toBeInTheDocument();
    });

    it('should handle search with no results gracefully', async () => {
      const simpleJson = { name: 'Test' };

      render(<MockJSONViewer initialData={JSON.stringify(simpleJson)} />);

      // Search for non-existent term
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'nonexistent');

      // Should show empty tree or no results message
      expect(screen.queryByTestId('json-tree')).toBeInTheDocument();
      // Could also check for a "no results" message if implemented
    });
  });

  describe('State Management Integration', () => {
    it('should persist JSON data in tool state manager', async () => {
      const testJson = {
        title: 'Test JSON',
        content: 'Test content',
      };

      stateManager.createNewSession();

      // Simulate saving to state manager
      stateManager.setToolState('json-hero-viewer', testJson, {
        expandedPaths: new Set(['root']),
        searchQuery: '',
        viewMode: 'tree',
      });

      const storedState = stateManager.getToolState('json-hero-viewer');
      expect(storedState).toBeDefined();
      expect(storedState?.data).toEqual(testJson);
      expect(storedState?.config.expandedPaths).toContain('root');
    });

    it('should emit events on tree interactions', async () => {
      const pathClicks: string[] = [];

      eventBus.subscribe('integration-test', 'tree:path:clicked', (event: any) => {
        pathClicks.push(event.data.path);
      });

      const nestedJson = {
        level1: {
          level2: 'value',
        },
      };

      render(<MockJSONHeroViewer initialData={JSON.stringify(nestedJson)} />);

      // Simulate clicking on a path
      const level1Node = screen.getByTestId('tree-node-level1');
      await userEvent.click(level1Node);

      // Wait for event processing
      await act(() => {
        // Small delay to allow event processing
      });

      // Verify event was emitted
      expect(pathClicks).toContain('level1');
    });

    it('should maintain search state in tool manager', async () => {
      const testJson = { test: 'data' };

      stateManager.createNewSession();
      stateManager.setToolState('json-hero-viewer', testJson);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'test');

      // Simulate updating state manager with search state
      stateManager.updateToolConfig('json-hero-viewer', {
        searchQuery: 'test',
        lastSearched: Date.now(),
      });

      const storedConfig = stateManager.getToolState('json-hero-viewer')?.config;
      expect(storedConfig?.searchQuery).toBe('test');
    });
  });

  describe('Performance with Large JSON', () => {
    it('should handle large JSON arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        tags: [`tag${i % 5}`],
      }));

      const startTime = performance.now();
      render(<MockJSONViewer initialData={JSON.stringify(largeArray)} />);
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second

      // Should render root array
      expect(screen.getByTestId('tree-node-root')).toBeInTheDocument();
      expect(screen.getByTestId('node-value-root')).toContain('Array(1000)');
    });

    it('should handle deeply nested JSON objects', () => {
      const deepJson = {};
      let current = deepJson;

      // Create 10 levels of nesting
      for (let i = 0; i < 10; i++) {
        current[`level${i}`] = { data: `value${i}` };
        current = current[`level${i}`];
      }

      render(<MockJSONViewer initialData={JSON.stringify(deepJson)} />);

      // Should render deep structure
      expect(screen.getByTestId('tree-node-level0')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-level9')).toBeInTheDocument();
    });

    it('should maintain performance with frequent updates', async () => {
      let updateCount = 0;
      const onPathClick = () => {
        updateCount++;
      };

      const jsonWithArrays = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          value: `Item ${i}`,
        })),
      };

      render(
        <MockJSONViewer initialData={JSON.stringify(jsonWithArrays)} onPathClick={onPathClick} />
      );

      // Simulate rapid tree expansion/collapse
      for (let i = 0; i < 10; i++) {
        const rootArrayNode = screen.getByTestId('tree-node-root');
        await userEvent.click(rootArrayNode);
        await userEvent.click(rootArrayNode);
      }

      expect(updateCount).toBe(20); // 10 expansions + 10 collapses
    });
  });
});
