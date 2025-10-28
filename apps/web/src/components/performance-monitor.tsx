/**
 * 性能监控组件
 * 监控和分析应用性能
 */

import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte
  domContentLoaded: number | null
  loadComplete: number | null
}

interface ResourceTiming {
  name: string
  duration: number
  size: number
  type: string
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
  })

  const [resources, setResources] = useState<ResourceTiming[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<PerformanceObserver | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return

    // 监听核心性能指标
    const observeMetrics = () => {
      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry
      if (fcpEntry) {
        setMetrics(prev => ({ ...prev, fcp: Math.round(fcpEntry.startTime) }))
      }

      // Time to First Byte
      const navigationEntry = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        setMetrics(prev => ({
          ...prev,
          ttfb: Math.round(navigationEntry.responseStart - navigationEntry.requestStart),
          domContentLoaded: Math.round(
            navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart
          ),
          loadComplete: Math.round(navigationEntry.loadEventEnd - navigationEntry.fetchStart),
        }))
      }

      // Largest Contentful Paint
      try {
        observerRef.current = new PerformanceObserver(list => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          setMetrics(prev => ({ ...prev, lcp: Math.round(lastEntry.startTime) }))
        })
        observerRef.current.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('LCP observation not supported:', error)
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          const firstEntry = entries[0] as any
          if (firstEntry?.processingStart) {
            setMetrics(prev => ({
              ...prev,
              fid: Math.round(firstEntry.processingStart - firstEntry.startTime),
            }))
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (error) {
        console.warn('FID observation not supported:', error)
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          for (const entry of entries) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          setMetrics(prev => ({ ...prev, cls: Math.round(clsValue * 1000) / 1000 }))
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('CLS observation not supported:', error)
      }
    }

    // 分析资源加载
    const analyzeResources = () => {
      const resourceEntries = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[]
      const resourceTimings: ResourceTiming[] = resourceEntries
        .filter(entry => entry.name.includes('.') && !entry.name.includes('data:'))
        .map(entry => ({
          name: entry.name.split('/').pop() || entry.name,
          duration: Math.round(entry.duration),
          size: entry.transferSize || 0,
          type: getResourceType(entry.name),
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10) // 只显示前10个最慢的资源

      setResources(resourceTimings)
    }

    // 页面加载完成后开始监控
    if (document.readyState === 'complete') {
      observeMetrics()
      analyzeResources()
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          observeMetrics()
          analyzeResources()
        }, 100)
      })
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const getResourceType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase()
    if (['js', 'mjs'].includes(extension || '')) return 'JavaScript'
    if (['css'].includes(extension || '')) return 'CSS'
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(extension || ''))
      return 'Image'
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) return 'Font'
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) return 'Audio'
    if (['mp4', 'webm', 'ogg'].includes(extension || '')) return 'Video'
    return 'Other'
  }

  const getPerformanceGrade = (metric: number | null, type: string): string => {
    if (metric === null) return 'Unknown'

    switch (type) {
      case 'fcp':
        if (metric < 1800) return 'Good'
        if (metric < 3000) return 'Needs Improvement'
        return 'Poor'
      case 'lcp':
        if (metric < 2500) return 'Good'
        if (metric < 4000) return 'Needs Improvement'
        return 'Poor'
      case 'fid':
        if (metric < 100) return 'Good'
        if (metric < 300) return 'Needs Improvement'
        return 'Poor'
      case 'cls':
        if (metric < 0.1) return 'Good'
        if (metric < 0.25) return 'Needs Improvement'
        return 'Poor'
      case 'ttfb':
        if (metric < 800) return 'Good'
        if (metric < 1800) return 'Needs Improvement'
        return 'Poor'
      default:
        return 'Unknown'
    }
  }

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'Good':
        return 'text-green-600'
      case 'Needs Improvement':
        return 'text-yellow-600'
      case 'Poor':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed right-4 bottom-4 z-50 rounded-lg bg-blue-500 px-3 py-2 text-sm text-white shadow-lg hover:bg-blue-600"
      >
        性能监控
      </button>
    )
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 max-h-96 w-96 overflow-hidden rounded-lg border bg-white shadow-xl">
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">性能监控</h3>
          <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto p-4">
        {/* Core Web Vitals */}
        <div className="mb-4">
          <h4 className="mb-2 font-medium text-gray-900">Core Web Vitals</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>FCP (首次内容绘制):</span>
              <span className={getGradeColor(getPerformanceGrade(metrics.fcp, 'fcp'))}>
                {metrics.fcp
                  ? `${metrics.fcp}ms (${getPerformanceGrade(metrics.fcp, 'fcp')})`
                  : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>LCP (最大内容绘制):</span>
              <span className={getGradeColor(getPerformanceGrade(metrics.lcp, 'lcp'))}>
                {metrics.lcp
                  ? `${metrics.lcp}ms (${getPerformanceGrade(metrics.lcp, 'lcp')})`
                  : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>FID (首次输入延迟):</span>
              <span className={getGradeColor(getPerformanceGrade(metrics.fid, 'fid'))}>
                {metrics.fid
                  ? `${metrics.fid}ms (${getPerformanceGrade(metrics.fid, 'fid')})`
                  : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>CLS (累积布局偏移):</span>
              <span className={getGradeColor(getPerformanceGrade(metrics.cls, 'cls'))}>
                {metrics.cls !== null
                  ? `${metrics.cls} (${getPerformanceGrade(metrics.cls, 'cls')})`
                  : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>TTFB (首字节时间):</span>
              <span className={getGradeColor(getPerformanceGrade(metrics.ttfb, 'ttfb'))}>
                {metrics.ttfb
                  ? `${metrics.ttfb}ms (${getPerformanceGrade(metrics.ttfb, 'ttfb')})`
                  : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* 其他指标 */}
        <div className="mb-4">
          <h4 className="mb-2 font-medium text-gray-900">其他指标</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>DOM 内容加载完成:</span>
              <span>
                {metrics.domContentLoaded ? `${metrics.domContentLoaded}ms` : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>页面完全加载:</span>
              <span>{metrics.loadComplete ? `${metrics.loadComplete}ms` : 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* 资源加载分析 */}
        {resources.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-gray-900">最慢的资源加载</h4>
            <div className="space-y-1 text-sm">
              {resources.slice(0, 5).map((resource, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="mr-2 flex-1 truncate">
                    <span className="text-gray-600">{resource.name}</span>
                    <span className="ml-1 text-gray-400 text-xs">({resource.type})</span>
                  </div>
                  <span className="text-gray-900">{resource.duration}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 性能建议 */}
        <div className="mt-4 border-t pt-4">
          <h4 className="mb-2 font-medium text-gray-900">优化建议</h4>
          <div className="space-y-1 text-gray-600 text-xs">
            {metrics.lcp && metrics.lcp > 2500 && <div>• LCP 较慢，考虑优化最大元素的加载</div>}
            {metrics.fcp && metrics.fcp > 1800 && <div>• FCP 较慢，考虑减少服务器响应时间</div>}
            {resources.some(r => r.duration > 1000) && (
              <div>• 存在加载时间超过1秒的资源，考虑优化或预加载</div>
            )}
            {metrics.cls && metrics.cls > 0.1 && <div>• CLS 较高，注意避免布局偏移</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
