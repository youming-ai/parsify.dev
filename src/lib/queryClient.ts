import { QueryClient } from '@tanstack/react-query'

// Create a QueryClient instance with default configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that unused data will remain in cache
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Time in milliseconds that data will remain in cache after being unused
      gcTime: 10 * 60 * 1000, // 10 minutes
      // Whether queries should refetch on window focus
      refetchOnWindowFocus: false,
      // Whether queries should refetch on reconnect
      refetchOnReconnect: true,
      // Default retry behavior
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Default retry behavior for mutations
      retry: 1,
      // Whether to throw errors or return them
      throwOnError: false,
    },
  },
})

// Query key factory functions for consistent cache keys
export const queryKeys = {
  files: ['files'] as const,
  file: (id: string) => ['files', id] as const,
  fileValidation: (name: string, size: number) => ['validation', name, size] as const,
  jsonParsing: (content: string, options?: any) => ['parsing', content, options] as const,
  search: (data: any, term: string) => ['search', data, term] as const,
  performance: () => ['performance'] as const,
} as const

// Query mutation keys
export const mutationKeys = {
  uploadFile: ['uploadFile'] as const,
  validateFile: ['validateFile'] as const,
  parseJson: ['parseJson'] as const,
  exportData: ['exportData'] as const,
} as const

// Query invalidation helpers
export const invalidateQueries = {
  files: () => queryClient.invalidateQueries({ queryKey: queryKeys.files }),
  file: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.file(id) }),
  fileValidation: () =>
    queryClient.invalidateQueries({
      predicate: query => query.queryKey[0] === 'validation',
    }),
  jsonParsing: () =>
    queryClient.invalidateQueries({
      predicate: query => query.queryKey[0] === 'parsing',
    }),
  search: () =>
    queryClient.invalidateQueries({
      predicate: query => query.queryKey[0] === 'search',
    }),
  all: () => queryClient.invalidateQueries(),
} as const

// Prefetching helpers
export const prefetchQueries = {
  files: async () => {
    // This would typically fetch from an API
    // For now, we'll just return a placeholder
    return Promise.resolve()
  },
  file: async (_id: string) => {
    // Prefetch specific file data
    return Promise.resolve()
  },
} as const

// Default query options for specific query types
export const queryOptions = {
  files: {
    staleTime: 2 * 60 * 1000, // 2 minutes for file list
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  },
  file: {
    staleTime: 10 * 60 * 1000, // 10 minutes for specific file data
    refetchOnWindowFocus: true,
  },
  fileValidation: {
    staleTime: 0, // Always revalidate
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  },
  jsonParsing: {
    staleTime: 15 * 60 * 1000, // 15 minutes for parsed JSON
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
  },
  search: {
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  },
  performance: {
    staleTime: 0, // Always fresh
    cacheTime: 60 * 1000, // 1 minute cache
  },
} as const

// Error boundary for React Query
export class QueryErrorBoundary extends Error {
  constructor(
    public queryKey: readonly unknown[],
    public error: Error,
    public retry: () => void
  ) {
    super(`Query Error: ${error.message}`)
    this.name = 'QueryError'
  }
}

// Query error handler
export const handleQueryError = (error: unknown, queryKey: readonly unknown[]) => {
  console.error('Query error:', { error, queryKey })

  // You could send error to logging service here
  // logError(error, `Query: ${queryKey.join('.')}`)

  return error
}

// Optimistic update helpers
export const optimisticUpdates = {
  updateFile: (oldData: any, newData: any) => {
    return {
      ...oldData,
      ...newData,
      updatedAt: new Date().toISOString(),
    }
  },
  addFile: (oldData: any[] = [], newFile: any) => {
    return [...oldData, newFile]
  },
  removeFile: (oldData: any[] = [], fileId: string) => {
    return oldData.filter(file => file.id !== fileId)
  },
} as const

// React Query provider setup for SSR/hydration
export const setupQueryClient = () => {
  // Configure for SSR if needed
  if (typeof window === 'undefined') {
    // Server-side configuration
    return new QueryClient({
      defaultOptions: {
        queries: {
          enabled: false, // Disable queries on server
          staleTime: 0,
        },
      },
    })
  }

  return queryClient
}

// Development helpers
export const devTools = {
  // Enable/disable React Query DevTools
  enable: process.env.NODE_ENV === 'development',

  // Log query state changes
  logQueryState: (key: string, state: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query [${key}]:`, {
        data: state.data,
        isLoading: state.isLoading,
        isError: state.isError,
        isSuccess: state.isSuccess,
        fetchStatus: state.fetchStatus,
      })
    }
  },

  // Cache inspection
  inspectCache: () => {
    if (process.env.NODE_ENV === 'development') {
      const cache = queryClient.getQueryCache()
      console.log('Query Cache:', cache.getAll())
      return cache
    }
  },
} as const

export default queryClient
