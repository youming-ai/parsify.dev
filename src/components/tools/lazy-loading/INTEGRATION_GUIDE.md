# Lazy Loading Integration Guide - T152 Implementation

This guide provides comprehensive instructions for implementing the enhanced lazy loading system across the Parsify.dev platform.

## Overview

The lazy loading system includes:
- **Enhanced Monaco Editor** with intelligent loading and monitoring
- **OCR Tool** with optimized library loading
- **Preloading Strategies** with network-aware and behavior-based optimization
- **Bundle Analysis** with real-time monitoring and optimization suggestions
- **Monitoring Integration** with existing performance tracking systems

## Quick Start

### 1. Setup the Provider

First, wrap your application with the `LazyLoadingProvider`:

```tsx
// src/app/layout.tsx
import { LazyLoadingProvider } from '@/components/tools/lazy-loading/lazy-loading-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LazyLoadingProvider
          config={{
            enabled: true,
            preloadThreshold: 200,
            loadingTimeout: 10000,
            retryAttempts: 3,
            enablePreloading: true,
            enableMonitoring: true,
            fallbackStrategy: 'skeleton',
            errorStrategy: 'retry',
          }}
        >
          {children}
        </LazyLoadingProvider>
      </body>
    </html>
  );
}
```

### 2. Use Lazy Components

Replace existing components with their lazy-loaded versions:

```tsx
// Before
import { CodeEditor } from '@/components/tools/code/code-editor';

// After
import { 
  LazyMonacoEditor, 
  OptimizedCodeEditor,
  HighPriorityCodeEditor 
} from '@/components/tools/code/lazy-monaco-editor';

// Basic usage
export function MyTool() {
  return (
    <LazyMonacoEditor
      value="console.log('Hello, World!');"
      language="javascript"
      height={400}
      priority="normal"
      analytics={{
        trackLoadTime: true,
        trackInteractions: true,
        trackErrors: true,
      }}
    />
  );
}

// High priority for critical components
export function CriticalEditor() {
  return (
    <HighPriorityCodeEditor
      value="critical code"
      language="typescript"
      preload={true}
    />
  );
}
```

## Component Integration

### Monaco Editor Integration

```tsx
import { 
  LazyMonacoEditor,
  LazyJavaScriptEditor,
  LazyTypeScriptEditor,
  LazyJSONEditor
} from '@/components/tools/code/lazy-monaco-editor';

// Generic lazy editor
export function CodeTool({ code, language }) {
  return (
    <LazyMonacoEditor
      value={code}
      language={language}
      priority="normal"
      enableMinimap={true}
      enableLineNumbers={true}
      theme="vs-dark"
      onLoadingComplete={(loadTime) => {
        console.log(`Editor loaded in ${loadTime}ms`);
      }}
      onError={(error) => {
        console.error('Editor load failed:', error);
      }}
    />
  );
}

// Language-specific editors
export function JavaScriptTool({ code }) {
  return (
    <LazyJavaScriptEditor
      value={code}
      priority="high"
      preload={true}
    />
  );
}
```

### OCR Tool Integration

```tsx
import { LazyOCRTool } from '@/components/tools/file/lazy-ocr-tool';

export function OCRPage() {
  return (
    <LazyOCRTool
      priority="normal"
      preload={false}
      analytics={{
        trackLoadTime: true,
        trackInteractions: true,
        trackErrors: true,
      }}
      onLoadingComplete={(loadTime) => {
        console.log(`OCR engine loaded in ${loadTime}ms`);
      }}
      onError={(error) => {
        console.error('OCR engine load failed:', error);
      }}
    />
  );
}
```

### Custom Component Lazy Loading

```tsx
import { withLazyLoading } from '@/components/tools/lazy-loading/lazy-loading-provider';
import { ToolLoadingSkeleton } from '@/components/tools/lazy-loading/loading-skeletons';

// Define your component
function HeavyComponent({ data }) {
  // Component implementation
}

// Wrap with lazy loading HOC
export const LazyHeavyComponent = withLazyLoading(
  () => import('./HeavyComponent'),
  {
    preload: false,
    rootMargin: '100px',
    fallback: <ToolLoadingSkeleton />,
    errorFallback: (
      <div className="p-4 border border-red-300 bg-red-50 rounded">
        Failed to load component
      </div>
    ),
    analytics: {
      componentName: 'HeavyComponent',
      trackLoadTime: true,
      trackSuccess: true,
      trackErrors: true,
    },
  }
);
```

## Preloading Strategies

### Default Preloading

```tsx
import { defaultPreloadStrategies, PreloadingManager } from '@/components/tools/lazy-loading/preloading-strategies';

export function PreloadingExample() {
  return (
    <PreloadingManager
      strategies={[
        ...defaultPreloadStrategies,
        {
          id: 'custom-component',
          name: 'Custom Component',
          priority: 8,
          estimatedSize: 200000,
          trigger: {
            type: 'idle',
            value: 3000, // 3 seconds of idle time
          },
        },
      ]}
      onProgress={(strategy, progress) => {
        console.log(`Preloading ${strategy.name}: ${progress}%`);
      }}
      onComplete={(strategy) => {
        console.log(`Completed preloading ${strategy.name}`);
      }}
      onError={(strategy, error) => {
        console.error(`Failed to preload ${strategy.name}:`, error);
      }}
    >
      <App />
    </PreloadingManager>
  );
}
```

### Custom Preloading Strategies

```tsx
import { useIntersectionPrediction, useNetworkAwarePreloading } from '@/components/tools/lazy-loading/preloading-strategies';

export function CustomPreloading() {
  const { predictedElements } = useIntersectionPrediction(0.5, 200);
  const { shouldPreload, networkInfo } = useNetworkAwarePreloading();

  useEffect(() => {
    // Custom preload logic
    if (networkInfo.effectiveType === '4g') {
      // Preload heavy components on fast connections
      preloadCriticalComponents();
    }
  }, [networkInfo]);

  return (
    <div>
      {/* Your content */}
    </div>
  );
}
```

## Monitoring and Analytics

### Performance Monitoring

```tsx
import { LazyLoadingPerformanceDashboard, LazyLoadingRealTimeMonitor } from '@/components/tools/lazy-loading/monitoring-integration';

export function AdminDashboard() {
  return (
    <div>
      <LazyLoadingPerformanceDashboard />
      <LazyLoadingRealTimeMonitor />
    </div>
  );
}
```

### Custom Monitoring

```tsx
import { useLazyLoadingMonitoring } from '@/components/tools/lazy-loading/monitoring-integration';

export function MonitoringExample() {
  const { trackComponentLoad, getMetrics, exportMetrics } = useLazyLoadingMonitoring();

  const handleComponentLoad = (componentId, loadTime, success, bundleSize) => {
    trackComponentLoad(componentId, loadTime, success, bundleSize);
    
    // Custom logic based on performance
    if (loadTime > 2000) {
      console.warn(`Slow component load: ${componentId} took ${loadTime}ms`);
    }
  };

  return (
    <div>
      <button onClick={() => console.log(getMetrics())}>
        View Metrics
      </button>
      <button onClick={() => exportMetrics()}>
        Export Metrics
      </button>
    </div>
  );
}
```

## Bundle Analysis

```tsx
import { BundleAnalyzer } from '@/components/tools/lazy-loading/bundle-analyzer';

export function BundleAnalysis() {
  return (
    <BundleAnalyzer
      realTime={true}
      showOptimizations={true}
      onOptimizationApply={(suggestion) => {
        console.log('Apply optimization:', suggestion);
        // Implement optimization logic
      }}
    />
  );
}
```

## Configuration Options

### LazyLoadingProvider Configuration

```tsx
<LazyLoadingProvider
  config={{
    // Enable/disable lazy loading system
    enabled: true,
    
    // Distance from viewport to start preloading (pixels)
    preloadThreshold: 200,
    
    // Maximum time to wait for component to load (ms)
    loadingTimeout: 10000,
    
    // Number of retry attempts for failed loads
    retryAttempts: 3,
    
    // Delay between retries (ms)
    retryDelay: 1000,
    
    // Enable intelligent preloading
    enablePreloading: true,
    
    // Enable performance monitoring
    enableMonitoring: true,
    
    // Default loading strategy
    fallbackStrategy: 'skeleton', // 'skeleton' | 'spinner' | 'placeholder' | 'custom'
    
    // Error handling strategy
    errorStrategy: 'retry', // 'retry' | 'fallback' | 'boundary'
  }}
>
```

### Component-Specific Configuration

```tsx
<LazyMonacoEditor
  // Priority for loading: 'high' | 'normal' | 'low'
  priority="high"
  
  // Preload immediately regardless of visibility
  preload={true}
  
  // Intersection observer settings
  rootMargin="100px"
  threshold={0.5}
  
  // Loading timeout override
  timeout={15000}
  
  // Analytics tracking
  analytics={{
    componentName: 'MonacoEditor',
    trackLoadTime: true,
    trackInteractions: true,
    trackErrors: true,
  }}
  
  // Custom loading fallback
  fallback={<CustomLoadingSkeleton />}
  
  // Custom error fallback
  errorFallback={<CustomErrorBoundary />}
/>
```

## Best Practices

### 1. Component Priority

```tsx
// High priority for critical, immediately needed components
<HighPriorityCodeEditor priority="high" preload={true} />

// Normal priority for most components
<LazyMonacoEditor priority="normal" />

// Low priority for non-essential components
<LowPriorityCodeEditor priority="low" />
```

### 2. Preloading Strategy

```tsx
// Preload on hover for user-triggered components
const hoverStrategy = {
  trigger: {
    type: 'hover',
    selector: '[data-component="code-editor"]',
  },
};

// Preload during idle time
const idleStrategy = {
  trigger: {
    type: 'idle',
    value: 5000, // 5 seconds
  },
};

// Preload based on user behavior
const behaviorStrategy = {
  trigger: {
    type: 'user-behavior',
    value: 'code-editor-interaction',
  },
};
```

### 3. Error Handling

```tsx
<LazyMonacoEditor
  errorFallback={
    <div className="p-4 border border-red-300 bg-red-50 rounded">
      <h3 className="text-red-800 font-medium">Editor Failed to Load</h3>
      <p className="text-red-600 text-sm">Please refresh the page to try again.</p>
      <button onClick={() => window.location.reload()}>
        Refresh Page
      </button>
    </div>
  }
  onError={(error) => {
    // Custom error handling
    trackError(error);
    showUserNotification('Editor unavailable', 'error');
  }}
/>
```

### 4. Performance Monitoring

```tsx
const { trackComponentLoad } = useLazyLoadingMonitoring();

// Track component performance
useEffect(() => {
  const startTime = performance.now();
  
  // Component load logic
  
  const loadTime = performance.now() - startTime;
  trackComponentLoad('my-component', loadTime, true, componentSize);
}, []);
```

## Migration Guide

### From Existing Monaco Editor

```tsx
// Before
import { CodeEditor } from '@/components/tools/code/code-editor';

<CodeEditor
  value={code}
  language={language}
  onChange={handleChange}
  onMount={handleMount}
/>

// After
import { LazyMonacoEditor } from '@/components/tools/code/lazy-monaco-editor';

<LazyMonacoEditor
  value={code}
  language={language}
  onChange={handleChange}
  onMount={handleMount}
  priority="normal"
  analytics={{
    trackLoadTime: true,
    trackInteractions: true,
  }}
/>
```

### From Existing OCR Tool

```tsx
// Before
import { OCRTool } from '@/components/tools/file/ocr-tool';

<OCRTool className="w-full" />

// After
import { LazyOCRTool } from '@/components/tools/file/lazy-ocr-tool';

<LazyOCRTool
  className="w-full"
  priority="normal"
  analytics={{
    trackLoadTime: true,
    trackErrors: true,
  }}
/>
```

## Troubleshooting

### Common Issues

1. **Components not loading**: Check network connection and console for errors
2. **Slow load times**: Consider increasing preload threshold or reducing component size
3. **High error rates**: Review retry configuration and error handling
4. **Memory issues**: Monitor bundle sizes and implement proper cleanup

### Debug Mode

```tsx
<LazyLoadingProvider
  config={{
    enableMonitoring: true,
    // Enable debug logging
    debug: true,
  }}
>
  <App />
</LazyLoadingProvider>
```

### Performance Analysis

```tsx
// Export metrics for analysis
const { exportMetrics } = useLazyLoadingMonitoring();
const metrics = exportMetrics();
console.log('Lazy Loading Metrics:', metrics);
```

## Advanced Usage

### Custom Skeleton Components

```tsx
import { MonacoEditorSkeleton } from '@/components/tools/lazy-loading/loading-skeletons';

// Use custom skeleton
<LazyMonacoEditor
  fallback={
    <MonacoEditorSkeleton
      height={400}
      showLineNumbers={true}
      showToolbar={true}
    />
  }
/>
```

### Network-Aware Loading

```tsx
import { useNetworkAwarePreloading } from '@/components/tools/lazy-loading/preloading-strategies';

function NetworkAwareEditor() {
  const { shouldPreload, networkInfo } = useNetworkAwarePreloading();
  
  return (
    <LazyMonacoEditor
      preload={shouldPreload({
        id: 'monaco-editor',
        priority: 8,
        estimatedSize: 250000,
        trigger: { type: 'immediate' },
      })}
      priority={networkInfo.effectiveType === '4g' ? 'high' : 'normal'}
    />
  );
}
```

### Behavior-Based Preloading

```tsx
import { useUserBehaviorAnalysis } from '@/components/tools/lazy-loading/preloading-strategies';

function BehaviorAwareApp() {
  const { predictNextComponent } = useUserBehaviorAnalysis();
  const [predictedComponent, setPredictedComponent] = useState(null);
  
  useEffect(() => {
    const predicted = predictNextComponent();
    setPredictedComponent(predicted);
    
    if (predicted) {
      // Preload predicted component
      preloadComponent(predicted);
    }
  }, [predictNextComponent]);
  
  return <App />;
}
```

This comprehensive guide covers all aspects of implementing the lazy loading system across the Parsify.dev platform. The modular design allows for gradual migration and customization based on specific component requirements.