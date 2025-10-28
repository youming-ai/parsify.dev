/**
 * 懒加载组件
 * 提供代码分割和懒加载功能
 */

import { Loader2 } from 'lucide-react'
import React, { type ComponentType, lazy, Suspense } from 'react'

// 加载状态组件
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = '加载中...',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`animate-spin text-blue-500 ${sizeClasses[size]}`} />
      {message && <p className="mt-2 text-gray-600 text-sm">{message}</p>}
    </div>
  )
}

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-2 text-red-500">
              <svg
                className="mx-auto h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-gray-600">加载组件时出现错误</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              重新加载
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// 懒加载包装器
interface LazyWrapperProps {
  loader: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
  loadingMessage?: string
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  loader,
  fallback,
  errorFallback,
  loadingMessage = '加载中...',
}) => {
  const LazyComponent = lazy(() =>
    loader().catch(error => {
      console.error('Component loading failed:', error)
      // 返回一个错误组件
      return {
        default: () => (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-2 text-red-500">
              <svg
                className="mx-auto h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-gray-600">组件加载失败</p>
          </div>
        ),
      }
    })
  )

  const loadingFallback = fallback || <LoadingSpinner message={loadingMessage} />

  return (
    <LazyLoadErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>
        <LazyComponent />
      </Suspense>
    </LazyLoadErrorBoundary>
  )
}

// 预定义的懒加载组件
export const LazyCodeFormatter = () => (
  <LazyWrapper
    loader={() => import('@/components/tools/code/code-formatter').then(mod => ({ default: mod.CodeFormatter }))}
    loadingMessage="加载代码格式化器..."
  />
)

export const LazyCodeExecutor = () => (
  <LazyWrapper
    loader={() => import('@/components/tools/code/code-execution').then(mod => ({ default: mod.CodeExecution }))}
    loadingMessage="加载代码执行器..."
  />
)

export const LazyJsonFormatter = () => (
  <LazyWrapper
    loader={() => import('@/components/tools/json/json-formatter').then(mod => ({ default: mod.JsonFormatter }))}
    loadingMessage="加载JSON格式化器..."
  />
)

export const LazyJsonValidator = () => (
  <LazyWrapper
    loader={() => import('@/components/tools/json/json-validator').then(mod => ({ default: mod.JsonValidator }))}
    loadingMessage="加载JSON验证器..."
  />
)

export const LazyJsonConverter = () => (
  <LazyWrapper
    loader={() => import('@/components/tools/json/json-converter').then(mod => ({ default: mod.JsonConverter }))}
    loadingMessage="加载JSON转换器..."
  />
)

export const LazyFileUpload = () => (
  <LazyWrapper
    loader={() => import('@/components/file-upload/file-upload-component').then(mod => ({ default: mod.FileUploadComponent }))}
    loadingMessage="加载文件上传组件..."
  />
)

export const LazyUserProfile = () => (
  <LazyWrapper
    loader={() => import('@/components/auth/user-profile').then(mod => ({ default: mod.UserProfile }))}
    loadingMessage="加载用户资料..."
  />
)

// 创建懒加载工具函数
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loadingMessage?: string
    fallback?: React.ReactNode
    errorFallback?: React.ReactNode
  }
) {
  return () => (
    <LazyWrapper
      loader={importFunc}
      loadingMessage={options?.loadingMessage}
      fallback={options?.fallback}
      errorFallback={options?.errorFallback}
    />
  )
}

// 预加载工具
export function preloadComponent(importFunc: () => Promise<{ default: ComponentType<any> }>) {
  importFunc().catch(error => {
    console.warn('Failed to preload component:', error)
  })
}

// 路由级别的懒加载
export const LazyToolsPage = createLazyComponent(() => import('@/app/tools/page'), {
  loadingMessage: '加载工具页面...',
})

export const LazyDashboardPage = createLazyComponent(() => import('@/app/dashboard/page'), {
  loadingMessage: '加载仪表板...',
})

export const LazyAuthLoginPage = createLazyComponent(() => import('@/app/auth/login/page'), {
  loadingMessage: '加载登录页面...',
})

export const LazyAuthSignupPage = createLazyComponent(() => import('@/app/auth/signup/page'), {
  loadingMessage: '加载注册页面...',
})
