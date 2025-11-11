/**
 * Web Workers System
 * Complete Web Worker implementation for Parsify.dev heavy processing operations
 */

// Export types and interfaces
export * from './types';

// Export core worker management
export {
  WorkerManager,
  workerManager,
  WorkerInstance,
  WorkerTask,
  WorkerPoolStats
} from './worker-manager';

// Export integration layer
export {
  WorkerIntegrationManager,
  workerIntegration,
  executeWorkerTask,
  initializeWorkerIntegration,
  getWorkerIntegrationHealth
} from './integration';

// Export examples and utilities
export {
  useJSONProcessor,
  useFileProcessor,
  useTextProcessor,
  useBatchProcessor,
  ToolIntegrator,
  WorkerEnhancedTool,
  ToolMigrationHelper,
  // Convenience exports
  jsonProcessor,
  fileProcessor,
  textProcessor,
  batchProcessor,
  toolIntegrator,
  WorkerTool,
  migrationHelper
} from './examples';

/**
 * Initialize the complete Web Workers system
 */
export const initializeWorkers = async (options?: {
  enableIntegration?: boolean;
  autoInitialize?: boolean;
}): Promise<void> => {
  const { enableIntegration = true, autoInitialize = true } = options || {};

  try {
    console.log('🚀 Initializing Web Workers system...');

    // Initialize core worker manager
    await workerManager.initialize();

    // Initialize integration with monitoring systems
    if (enableIntegration) {
      await initializeWorkerIntegration();
    }

    console.log('✅ Web Workers system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Web Workers system:', error);
    throw error;
  }
};

/**
 * Get system health and status
 */
export const getWorkerSystemStatus = () => {
  const integrationHealth = getWorkerIntegrationHealth();
  const poolStats = workerManager.getPoolStats();

  return {
    integration: integrationHealth,
    pools: poolStats,
    timestamp: new Date()
  };
};

/**
 * Shutdown the Web Workers system
 */
export const shutdownWorkers = async (): Promise<void> => {
  try {
    console.log('🛑 Shutting down Web Workers system...');

    // Shutdown worker manager
    await workerManager.shutdown();

    console.log('✅ Web Workers system shutdown completed');
  } catch (error) {
    console.error('❌ Error during Web Workers shutdown:', error);
    throw error;
  }
};

// Auto-initialize if requested
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Initialize workers automatically in production
  initializeWorkers({ enableIntegration: true, autoInitialize: true }).catch(console.error);
}

export default {
  // Core functionality
  initialize: initializeWorkers,
  shutdown: shutdownWorkers,
  getStatus: getWorkerSystemStatus,

  // Main exports
  WorkerManager,
  workerManager,
  executeWorkerTask,

  // Integration
  workerIntegration,
  getWorkerIntegrationHealth,

  // Hooks and components
  useJSONProcessor,
  useFileProcessor,
  useTextProcessor,
  useBatchProcessor,
  WorkerEnhancedTool,

  // Utilities
  ToolIntegrator,
  ToolMigrationHelper
};
