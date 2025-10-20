/**
 * Performance Monitor Component
 * Real-time performance monitoring and Core Web Vitals tracking
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAnalytics } from '@/lib/analytics/hooks'
import { PERFORMANCE_THRESHOLDS } from '@/lib/analytics/config'

interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
  domContentLoaded?: number
  load?: number
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

interface PerformanceMonitorProps {
  enabled?: boolean
  showDetails?: boolean
  trackContinuously?: boolean
}

export function PerformanceMonitor({
  enabled = true,
  showDetails = false,
  trackContinuously = true
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isRecording, setIsRecording] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { trackPerformance, trackCustomEvent } = useAnalytics()

  useEffect(() => {
    if (!enabled) return

    // Initialize performance monitoring
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()

      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            const lcp = entry.startTime
            setMetrics(prev => ({ ...prev, lcp }))
            trackPerformance({ lcp })
            assessPerformance('lcp', lcp)
            break

          case 'first-input':
            const fid = entry.processingStart - entry.startTime
            setMetrics(prev => ({ ...prev, fid }))
            trackPerformance({ fid })
            assessPerformance('fid', fid)
            break

          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              const cls = (entry as any).value
              setMetrics(prev => ({ ...prev, cls }))
              trackPerformance({ cls })
              assessPerformance('cls', cls)
            }
            break

          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming
            const navMetrics = {
              fcp: navEntry.responseStart - navEntry.requestStart,
              ttfb: navEntry.responseStart - navEntry.requestStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
              load: navEntry.loadEventEnd - navEntry.navigationStart,
            }
            setMetrics(prev => ({ ...prev, ...navMetrics }))
            trackPerformance(navMetrics)
            break
        }
      })
    })

    // Observe different performance entry types
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] })
    } catch (error) {
      console.warn('Performance observer not fully supported:', error)
    }

    // Monitor connection information
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection
      if (connection) {
        const connectionMetrics = {
          connectionType: connection.effectiveType,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        }
        setMetrics(prev => ({ ...prev, ...connectionMetrics }))
      }
    }

    updateConnectionInfo()

    // Update connection info periodically
    const connectionInterval = setInterval(updateConnectionInfo, 30000)

    // Monitor memory usage if available
    const updateMemoryInfo = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory
        trackCustomEvent('memory_usage', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        })
      }
    }

    const memoryInterval = setInterval(updateMemoryInfo, 10000)

    return () => {
      observer.disconnect()
      clearInterval(connectionInterval)
      clearInterval(memoryInterval)
    }
  }, [enabled, trackPerformance, trackCustomEvent])

  const assessPerformance = (metric: string, value: number) => {
    let status: 'good' | 'needs-improvement' | 'poor'
    let threshold: number

    switch (metric) {
      case 'lcp':
        threshold = PERFORMANCE_THRESHOLDS.LCP_GOOD
        status = value <= threshold ? 'good' : value <= PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT ? 'needs-improvement' : 'poor'
        break
      case 'fid':
        threshold = PERFORMANCE_THRESHOLDS.FID_GOOD
        status = value <= threshold ? 'good' : value <= PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT ? 'needs-improvement' : 'poor'
        break
      case 'cls':
        threshold = PERFORMANCE_THRESHOLDS.CLS_GOOD
        status = value <= threshold ? 'good' : value <= PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT ? 'needs-improvement' : 'poor'
        break
      case 'fcp':
        threshold = PERFORMANCE_THRESHOLDS.FCP_GOOD
        status = value <= threshold ? 'good' : value <= PERFORMANCE_THRESHOLDS.FCP_NEEDS_IMPROVEMENT ? 'needs-improvement' : 'poor'
        break
      case 'ttfb':
        threshold = PERFORMANCE_THRESHOLDS.TTFB_GOOD
        status = value <= threshold ? 'good' : value <= PERFORMANCE_THRESHOLDS.TTFB_NEEDS_IMPROVEMENT ? 'needs-improvement' : 'poor'
        break
      default:
        status = 'good'
    }

    trackCustomEvent('performance_assessment', {
      metric,
      value,
      status,
      threshold,
    })
  }

  const startContinuousTracking = () => {
    setIsRecording(true)
    setLastUpdate(new Date())

    const interval = setInterval(() => {
      // Measure current FPS
      const fps = measureFPS()
      trackPerformance({ fps })

      // Measure current memory usage
      if ((performance as any).memory) {
        const memory = (performance as any).memory
        trackPerformance({
          memoryUsed: memory.usedJSHeapSize,
          memoryTotal: memory.totalJSHeapSize,
        })
      }

      setLastUpdate(new Date())
    }, 5000)

    // Store interval ID for cleanup
    ;(window as any).__performanceInterval = interval
  }

  const stopContinuousTracking = () => {
    setIsRecording(false)
    const interval = (window as any).__performanceInterval
    if (interval) {
      clearInterval(interval)
      delete (window as any).__performanceInterval
    }
  }

  const measureFPS = () => {
    let fps = 0
    let lastTime = performance.now()
    let frames = 0

    const measure = () => {
      frames++
      const currentTime = performance.now()

      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime))
        frames = 0
        lastTime = currentTime
        return fps
      }

      requestAnimationFrame(measure)
      return 0
    }

    return measure()
  }

  const getPerformanceGrade = () => {
    const scores = []

    if (metrics.lcp) {
      const lcpScore = metrics.lcp <= PERFORMANCE_THRESHOLDS.LCP_GOOD ? 100 :
                      metrics.lcp <= PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT ? 50 : 0
      scores.push(lcpScore)
    }

    if (metrics.fid) {
      const fidScore = metrics.fid <= PERFORMANCE_THRESHOLDS.FID_GOOD ? 100 :
                      metrics.fid <= PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT ? 50 : 0
      scores.push(fidScore)
    }

    if (metrics.cls) {
      const clsScore = metrics.cls <= PERFORMANCE_THRESHOLDS.CLS_GOOD ? 100 :
                      metrics.cls <= PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT ? 50 : 0
      scores.push(clsScore)
    }

    if (scores.length === 0) return 0
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getMetricStatus = (metric: string, value: number) => {
    let good: number, needsImprovement: number

    switch (metric) {
      case 'lcp':
        good = PERFORMANCE_THRESHOLDS.LCP_GOOD
        needsImprovement = PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT
        break
      case 'fid':
        good = PERFORMANCE_THRESHOLDS.FID_GOOD
        needsImprovement = PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT
        break
      case 'cls':
        good = PERFORMANCE_THRESHOLDS.CLS_GOOD
        needsImprovement = PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT
        break
      case 'fcp':
        good = PERFORMANCE_THRESHOLDS.FCP_GOOD
        needsImprovement = PERFORMANCE_THRESHOLDS.FCP_NEEDS_IMPROVEMENT
        break
      case 'ttfb':
        good = PERFORMANCE_THRESHOLDS.TTFB_GOOD
        needsImprovement = PERFORMANCE_THRESHOLDS.TTFB_NEEDS_IMPROVEMENT
        break
      default:
        return 'default'
    }

    if (value <= good) return 'default'
    if (value <= needsImprovement) return 'secondary'
    return 'destructive'
  }

  if (!enabled) return null

  return (
    <div className="space-y-4">
      {/* Performance Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Performance Monitor</h3>
            <Badge variant={getPerformanceGrade() >= 80 ? 'default' : getPerformanceGrade() >= 50 ? 'secondary' : 'destructive'}>
              {getPerformanceGrade()}/100
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {trackContinuously && (
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                size="sm"
                onClick={isRecording ? stopContinuousTracking : startContinuousTracking}
              >
                {isRecording ? 'Stop Tracking' : 'Start Tracking'}
              </Button>
            )}
          </div>
        </div>

        {lastUpdate && (
          <div className="text-xs text-muted-foreground mb-3">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* Core Web Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.lcp !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">LCP</span>
                <Badge variant={getMetricStatus('lcp', metrics.lcp)}>
                  {formatDuration(metrics.lcp)}
                </Badge>
              </div>
              <Progress
                value={Math.min((metrics.lcp / PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT) * 100, 100)}
                className="h-1"
              />
            </div>
          )}

          {metrics.fid !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FID</span>
                <Badge variant={getMetricStatus('fid', metrics.fid)}>
                  {formatDuration(metrics.fid)}
                </Badge>
              </div>
              <Progress
                value={Math.min((metrics.fid / PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT) * 100, 100)}
                className="h-1"
              />
            </div>
          )}

          {metrics.cls !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CLS</span>
                <Badge variant={getMetricStatus('cls', metrics.cls)}>
                  {metrics.cls.toFixed(3)}
                </Badge>
              </div>
              <Progress
                value={Math.min((metrics.cls / PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT) * 100, 100)}
                className="h-1"
              />
            </div>
          )}

          {metrics.fcp !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FCP</span>
                <Badge variant={getMetricStatus('fcp', metrics.fcp)}>
                  {formatDuration(metrics.fcp)}
                </Badge>
              </div>
              <Progress
                value={Math.min((metrics.fcp / PERFORMANCE_THRESHOLDS.FCP_NEEDS_IMPROVEMENT) * 100, 100)}
                className="h-1"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Detailed Metrics */}
      {showDetails && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Detailed Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.ttfb !== undefined && (
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Time to First Byte</span>
                <span className="font-mono text-sm">{formatDuration(metrics.ttfb)}</span>
              </div>
            )}

            {metrics.domContentLoaded !== undefined && (
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">DOM Content Loaded</span>
                <span className="font-mono text-sm">{formatDuration(metrics.domContentLoaded)}</span>
              </div>
            )}

            {metrics.load !== undefined && (
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Load Time</span>
                <span className="font-mono text-sm">{formatDuration(metrics.load)}</span>
              </div>
            )}

            {metrics.effectiveType && (
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Connection Type</span>
                <Badge variant="outline">{metrics.effectiveType}</Badge>
              </div>
            )}

            {metrics.downlink !== undefined && (
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Downlink</span>
                <span className="font-mono text-sm">{metrics.downlink.toFixed(1)} Mbps</span>
              </div>
            )}

            {metrics.rtt !== undefined && (
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Round Trip Time</span>
                <span className="font-mono text-sm">{metrics.rtt}ms</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
