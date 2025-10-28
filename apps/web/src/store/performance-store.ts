/**
 * 简化的性能管理系统
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Store 配置接口
interface StoreConfig<T> {
  name: string
  persist?: {
    enabled: boolean
    storage?: 'localStorage' | 'sessionStorage'
  }
}

// 创建简单的 store
export function createOptimizedStore<T extends Record<string, any>>(
  initialState: T,
  config: StoreConfig<T>
) {
  const { name, persist: persistConfig } = config

  if (persistConfig?.enabled) {
    return create<T>()(
      persist(
        (set, get) => ({
          ...initialState,
          setState: (updates: Partial<T> | ((state: T) => T)) => {
            if (typeof updates === 'function') {
              set((state) => ({ ...state, ...updates(state) }))
            } else {
              set((state) => ({ ...state, ...updates }))
            }
          },
        }),
        {
          name: `${name}-store`,
          storage: persistConfig?.storage === 'sessionStorage'
            ? createJSONStorage(() => sessionStorage)
            : createJSONStorage(() => localStorage),
        }
      )
    )

    return create<T>()((set, get) => ({
      ...initialState,
      setState: (updates: Partial<T> | ((state: T) => T)) => {
        if (typeof updates === 'function') {
          set((state) => ({ ...state, ...updates(state) }))
        } else {
          set((state) => ({ ...state, ...updates }))
        }
      },
    }))
  }
}

// 预定义的 Store 配置
export const STORE_CONFIGS = {
  user: {
    name: 'user',
    persist: {
      enabled: true,
      storage: 'localStorage' as const,
    },
  },
  app: {
    name: 'app',
    persist: {
      enabled: false,
    },
  },
}
