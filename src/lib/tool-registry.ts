/**
 * Tool Registry - Main Export
 * Central registry service for managing tool discovery, registration, and loading
 * Re-exports from the detailed implementation in registry/
 */

import { ToolRegistry } from './registry/tool-registry';

export {
  ToolRegistry,
  type ToolMetadata,
  type ToolConfig,
  type ToolRegistryConfig,
} from './registry/tool-registry';

// Re-export other registry services
export {
  ToolDiscovery,
  type DiscoveryOptions,
} from './registry/tool-discovery';

export {
  ToolManager,
  type ToolManagerConfig,
} from './registry/tool-manager';

// Create singleton instance with default configuration
const defaultRegistry = ToolRegistry.getInstance({
  enableLazyLoading: true,
  preloadPriority: 1,
  maxConcurrentLoads: 3,
  retryAttempts: 3,
  cacheStrategy: 'memory',
});

// Export convenience functions
export const registerTool = defaultRegistry.registerTool.bind(defaultRegistry);
export const getToolMetadata = defaultRegistry.getToolMetadata.bind(defaultRegistry);
export const getAllToolsMetadata = defaultRegistry.getAllToolsMetadata.bind(defaultRegistry);
export const getToolsByCategory = defaultRegistry.getToolsByCategory.bind(defaultRegistry);
export const searchTools = defaultRegistry.searchTools.bind(defaultRegistry);
export const loadTool = defaultRegistry.loadTool.bind(defaultRegistry);
export const preloadTools = defaultRegistry.preloadTools.bind(defaultRegistry);

// Export the default registry instance
export default defaultRegistry;
