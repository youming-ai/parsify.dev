import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tool State Store
 * Manages tool state with localStorage persistence
 */

export interface ToolState {
  toolId: string;
  version: string;
  lastModified: number;
  data: any;
  config: Record<string, any>;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    collaborators?: string[];
  };
}

interface ToolStoreState {
  tools: Record<string, ToolState>;

  // Actions
  getToolState: (toolId: string) => ToolState | null;
  setToolState: (
    toolId: string,
    data: any,
    config?: Record<string, any>,
    metadata?: Partial<ToolState['metadata']>
  ) => void;
  updateToolData: (toolId: string, data: Partial<any>) => void;
  updateToolConfig: (toolId: string, config: Partial<Record<string, any>>) => void;
  deleteToolState: (toolId: string) => boolean;
  clearAllToolStates: () => void;
}

export const useToolStore = create<ToolStoreState>()(
  persist(
    (set, get) => ({
      tools: {},

      getToolState: (toolId: string) => {
        return get().tools[toolId] || null;
      },

      setToolState: (toolId, data, config, metadata) => {
        set((state) => {
          const previousState = state.tools[toolId];
          const toolState: ToolState = {
            toolId,
            version: '1.0.0',
            lastModified: Date.now(),
            data: structuredClone(data),
            config: structuredClone(config ?? {}),
            metadata: metadata
              ? { ...previousState?.metadata, ...metadata }
              : previousState?.metadata,
          };

          return {
            tools: {
              ...state.tools,
              [toolId]: toolState,
            },
          };
        });
      },

      updateToolData: (toolId, data) => {
        set((state) => {
          const currentState = state.tools[toolId];
          if (!currentState) {
            // Create new state if doesn't exist
            return {
              tools: {
                ...state.tools,
                [toolId]: {
                  toolId,
                  version: '1.0.0',
                  lastModified: Date.now(),
                  data: structuredClone(data),
                  config: {},
                },
              },
            };
          }

          // Merge data
          const mergedData = { ...currentState.data, ...data };
          return {
            tools: {
              ...state.tools,
              [toolId]: {
                ...currentState,
                data: mergedData,
                lastModified: Date.now(),
              },
            },
          };
        });
      },

      updateToolConfig: (toolId, config) => {
        set((state) => {
          const currentState = state.tools[toolId];
          if (!currentState) {
            // Create new state if doesn't exist
            return {
              tools: {
                ...state.tools,
                [toolId]: {
                  toolId,
                  version: '1.0.0',
                  lastModified: Date.now(),
                  data: {},
                  config: structuredClone(config),
                },
              },
            };
          }

          // Merge config
          const mergedConfig = { ...currentState.config, ...config };
          return {
            tools: {
              ...state.tools,
              [toolId]: {
                ...currentState,
                config: mergedConfig,
                lastModified: Date.now(),
              },
            },
          };
        });
      },

      deleteToolState: (toolId) => {
        const exists = !!get().tools[toolId];
        if (exists) {
          set((state) => {
            const { [toolId]: _, ...remainingTools } = state.tools;
            return { tools: remainingTools };
          });
        }
        return exists;
      },

      clearAllToolStates: () => {
        set({ tools: {} });
      },
    }),
    {
      name: 'parsify-dev:tool-storage',
      version: 1,
    }
  )
);
