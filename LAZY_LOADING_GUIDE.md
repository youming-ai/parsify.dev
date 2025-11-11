# Lazy Loading Implementation Guide - T152

This guide provides comprehensive instructions for implementing and using the enhanced lazy loading system in Parsify.dev.

## Overview

The lazy loading system has been designed to:
- Reduce initial bundle size by loading components on-demand
- Improve perceived performance through smart preloading
- Provide comprehensive monitoring and analytics
- Offer fallback UIs and error recovery
- Integrate with existing monitoring systems

## Quick Start

### 1. Initialize the System

```tsx
// In your app root (app/layout.tsx)
import { LazyLoadingProvider, initializeLazyLoading } from '@/components/tools/lazy-loading';

// Initialize the system
initializeLazyLoading({
  enablePreloading: true,
  enableMonitoring: true,
  preloadThreshold: 200,
  bundleBudget: 500 * 1024, // 500KB
  networkAwarePreloading: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <LazyLoadingProvider>
      {children}
    </LazyLoadingProvider>
  );
}
```

### 2. Migrate Existing Components

#### Simple Migration
```tsx
// Before
import { HeavyComponent } from '@/components/tools/heavy-component';

function MyPage() {
  return <HeavyComponent />;
}

// After
import { withLazyLoading } from '@/components/tools/lazy-loading';

const LazyHeavyComponent = withLazyLoading(
  () => import('@/components/tools/heavy-component').then(mod => ({ default: mod.HeavyComponent })),
  {
    preload: true,
    priority: 'normal',
    fallback: <div>Loading component...</div>,
  }
);

function MyPage() {
  return <LazyHeavyComponent />;
}
```

#### Advanced Migration with Error Handling
```tsx
import { LazyErrorBoundary, useLazyLoading } from '@/components/tools/lazy-loading';

function MyPage() {
  const { preloadComponent } = useLazyLoading();

  useEffect(() => {
    // Preload component when user hovers over trigger
    const preloadHeavyComponent = () => {
      preloadComponent('heavy-component', () => import('@/components/tools/heavy-component'));
    };

    const trigger = document.getElementById('heavy-component-trigger');
    trigger?.addEventListener('mouseenter', preloadHeavyComponent);

    return () => {
      trigger?.removeEventListener('mouseenter', preloadHeavyComponent);
    };
  }, [preloadComponent]);

  return (
    <LazyErrorBoundary
      componentId="heavy-component"
      maxRetries={3}
      showStackTrace={process.env.NODE_ENV === 'development'}
      customMessages={{
        title: 'Heavy Component Failed to Load',
        description: 'The component could not be loaded. Please try again.',
      }}
    >
      <React.Suspense fallback={<ComponentSkeleton />}>
        <LazyHeavyComponent />
      </React.Suspense>
    </LazyErrorBoundary>
  );
}
```

## Component-Specific Implementations

### Monaco Editor

#### Basic Usage
```tsx
import { LazyMonacoEditor } from '@/components/tools/lazy-loading';

function CodeEditor() {
  const [code, setCode] = useState('// Your code here');

  return (
    <LazyMonacoEditor
      value={code}
      onChange={setCode}
      language="javascript"
      height="400px"
      priority="normal"
      enableMinimap={true}
      enableLineNumbers={true}
      analytics={{
        trackLoadTime: true,
        trackInteractions: true,
        trackErrors: true,
      }}
      onLoadingComplete={(loadTime) => {
        console.log(`Editor loaded in ${loadTime}ms`);
      }}
      onError={(error) => {
        console.error('Editor failed to load:', error);
      }}
    />
  );
}
```

#### Language-Specific Editors
```tsx
import { 
  LazyJavaScriptEditor, 
  LazyTypeScriptEditor, 
  LazyJSONEditor 
} from '@/components/tools/lazy-loading';

function CodeEditors() {
  return (
    <div>
      <LazyJavaScriptEditor
        value={jsCode}
        onChange={setJsCode}
        priority="high"
        preload
      />
      
      <LazyTypeScriptEditor
        value={tsCode}
        onChange={setTsCode}
        priority="normal"
      />
      
      <LazyJSONEditor
        value={jsonData}
        onChange={setJsonData}
        priority="low"
      />
    </div>
  );
}
```

### OCR Tool

```tsx
import { LazyOCRTool } from '@/components/tools/lazy-loading';

function OCRPage() {
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
        console.error('OCR engine failed to initialize:', error);
      }}
    />
  );
}
```

## Preloading Strategies

### Basic Preloading
```tsx
import { useMonacoPreload } from '@/components/tools/lazy-loading';

function MyComponent() {
  const { preload, preloadCommon } = useMonacoPreload();

  useEffect(() => {
    // Preload specific language support
    preload('javascript');
    
    // Preload common languages
    preloadCommon();
  }, [preload, preloadCommon]);

  return <div>My Component</div>;
}
```

### Advanced Preloading with Strategies
```tsx
import { PreloadingManager, defaultPreloadStrategies } from '@/components/tools/lazy-loading';

function AppWithPreloading() {
  return (
    <PreloadingManager
      strategies={[
        ...defaultPreloadStrategies,
        {
          id: 'custom-component',
          name: 'Custom Component',
          description: 'Preload when user scrolls near',
          priority: 7,
          estimatedSize: 200000,
          trigger: {
            type: 'intersection',
            selector: '#custom-component-area',
            threshold: 0.3,
          },
          conditions: [
            { type: 'network', value: '4g' },
            { type: 'idle', value: 1000 },
          ],
        },
      ]}
      onProgress={(strategy, progress) => {
        console.log(`Preloading ${strategy.name}: ${progress}%`);
      }}
      onComplete={(strategy) => {
        console.log(`Successfully preloaded ${strategy.name}`);
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

## Monitoring and Analytics

### Real-time Monitoring
```tsx
import { 
  LazyLoadingPerformanceDashboard,
  LazyLoadingRealTimeMonitor 
} from '@/components/tools/lazy-loading';

function AdminDashboard() {
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
import { useLazyLoadingMonitoring } from '@/components/tools/lazy-loading';

function MyComponent() {
  const { trackComponentLoad, getMetrics } = useLazyLoadingMonitoring();

  const handleComponentLoad = useCallback((componentId: string, loadTime: number, success: boolean) => {
    trackComponentLoad(componentId, loadTime, success, 250000);
    
    // Custom analytics tracking
    if (window.gtag) {
      window.gtag('event', 'component_load', {
        component_id: componentId,
        load_time: loadTime,
        success: success,
      });
    }
  }, [trackComponentLoad]);

  return (
    <div>
      {/* Your component implementation */}
    </div>
  );
}
```

## Bundle Analysis

### Bundle Analyzer Integration
```tsx
import { BundleAnalyzer } from '@/components/tools/lazy-loading';

function BundleAnalysisPage() {
  return (
    <BundleAnalyzer
      realTime={true}
      showOptimizations={true}
      onOptimizationApply={(suggestion) => {
        console.log('Applying optimization:', suggestion);
        // Implement optimization logic
      }}
    />
  );
}
```

### Programmatic Bundle Analysis
```tsx
import { BundleOptimizationUtils } from '@/components/tools/lazy-loading';

function analyzeMyBundle() {
  const chunks = [
    {
      id: 'main',
      name: 'Main Bundle',
      size: 512000,
      gzippedSize: 180000,
      type: 'initial' as const,
      modules: ['App', 'Layout'],
      loadTime: 350,
      usage: { loaded: true, loadCount: 1, averageLoadTime: 350, failureRate: 0 },
    },
    // ... other chunks
  ];

  const strategies = BundleOptimizationUtils.suggestSplittingStrategy(chunks);
  const compressionOpportunities = BundleOptimizationUtils.calculateCompressionOpportunities({
    totalSize: 2457600,
    gzippedSize: 768000,
    compressionRatio: 69,
    // ... other metrics
  });

  console.log('Splitting strategies:', strategies);
  console.log('Compression opportunities:', compressionOpportunities);
}
```

## Error Handling and Recovery

### Custom Error Boundaries
```tsx
import { LazyErrorBoundary } from '@/components/tools/lazy-loading';

function MyPage() {
  return (
    <LazyErrorBoundary
      componentId="my-lazy-component"
      maxRetries={5}
      retryDelay={2000}
      showStackTrace={process.env.NODE_ENV === 'development'}
      enableReportBug={true}
      customMessages={{
        title: 'Component Loading Failed',
        description: 'We couldn\'t load this component. Please try again or contact support.',
        retryText: 'Try Again',
        reportText: 'Report Issue',
      }}
      onError={(error, errorInfo) => {
        // Custom error handling
        console.error('Component load error:', error, errorInfo);
        
        // Send to error tracking service
        if (window.Sentry) {
          window.Sentry.captureException(error, {
            contexts: {
              component: {
                id: 'my-lazy-component',
                errorInfo: errorInfo,
              },
            },
          });
        }
      }}
    >
      <React.Suspense fallback={<CustomLoadingSkeleton />}>
        <LazyComponent />
      </React.Suspense>
    </LazyErrorBoundary>
  );
}
```

### Custom Fallback Components
```tsx
function CustomLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}

function CustomErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="text-center p-6 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
}
```

## Performance Optimization Tips

### 1. Prioritize Components
```tsx
// High priority - load immediately
<LazyMonacoEditor priority="high" preload />

// Normal priority - load when visible
<LazyOCRTool priority="normal" />

// Low priority - load when idle
<LazyChartLibrary priority="low" />
```

### 2. Use Appropriate Skeletons
```tsx
import { 
  MonacoEditorSkeleton,
  OCRToolSkeleton,
  JSONToolSkeleton 
} from '@/components/tools/lazy-loading';

function MyComponent() {
  return (
    <React.Suspense fallback={<MonacoEditorSkeleton />}>
      <LazyMonacoEditor />
    </React.Suspense>
  );
}
```

### 3. Optimize Preloading
```tsx
function App() {
  const { preloadComponent } = useLazyLoading();

  useEffect(() => {
    // Preload based on user behavior
    const handleUserInteraction = () => {
      preloadComponent('frequently-used-component', () => 
        import('@/components/frequently-used-component')
      );
    };

    // Preload during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadComponent('secondary-component', () => 
          import('@/components/secondary-component')
        );
      });
    }

    return () => {
      // Cleanup
    };
  }, [preloadComponent]);

  return <App />;
}
```

## Testing Lazy Components

### Unit Testing
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { LazyLoadingProvider } from '@/components/tools/lazy-loading';

test('lazy component loads correctly', async () => {
  render(
    <LazyLoadingProvider>
      <LazyComponent />
    </LazyLoadingProvider>
  );

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Component content')).toBeInTheDocument();
  });
});
```

### E2E Testing
```typescript
import { test, expect } from '@playwright/test';

test('lazy loading performance', async ({ page }) => {
  // Navigate to page with lazy components
  await page.goto('/tools/code/executor');

  // Check that initial bundle is loaded
  const initialResponse = await page.waitForResponse('**/main.js');
  expect(initialResponse.status()).toBe(200);

  // Scroll to trigger lazy loading
  await page.scrollIntoViewIfNeeded('[data-component="lazy-monaco-editor"]');

  // Wait for lazy component to load
  await page.waitForSelector('[data-loaded="true"]');

  // Check performance metrics
  const performanceMetrics = await page.evaluate(() => {
    return performance.getEntriesByType('measure');
  });

  expect(performanceMetrics).toContainEqual(
    expect.objectContaining({
      name: 'monaco-editor-load-time',
    })
  );
});
```

## Troubleshooting

### Common Issues

1. **Components not loading**
   - Check that the import path is correct
   - Verify the component has a default export
   - Check for circular dependencies

2. **Slow loading times**
   - Review bundle size analysis
   - Consider code splitting strategies
   - Optimize preloading priorities

3. **Memory leaks**
   - Ensure proper cleanup in useEffect
   - Check for event listener cleanup
   - Monitor component unmounting

4. **Monitoring not working**
   - Verify LazyLoadingProvider is at root
   - Check that monitoring is enabled
   - Review network conditions

### Debug Tools

```tsx
// Enable debug mode
if (process.env.NODE_ENV === 'development') {
  localStorage.setItem('lazy-loading-debug', 'true');
}

// View current metrics
import { useLazyLoading } from '@/components/tools/lazy-loading';

function DebugInfo() {
  const { state, getMetrics } = useLazyLoading();
  
  return (
    <pre>
      {JSON.stringify({
        loadedComponents: Array.from(state.loadedComponents),
        loadingComponents: Array.from(state.loadingComponents),
        failedComponents: Array.from(state.failedComponents),
        metrics: getMetrics(),
      }, null, 2)}
    </pre>
  );
}
```

## Migration Checklist

- [ ] Initialize LazyLoadingProvider in app root
- [ ] Identify heavy components (>50KB)
- [ ] Replace direct imports with lazy loading
- [ ] Add appropriate loading skeletons
- [ ] Configure error boundaries
- [ ] Set up preloading strategies
- [ ] Enable performance monitoring
- [ ] Test on different network conditions
- [ ] Verify accessibility compliance
- [ ] Update documentation

## Support and Resources

- **Source Code**: `/src/components/tools/lazy-loading/`
- **Examples**: Check the implementation files for usage examples
- **Monitoring**: Use the Performance Dashboard for insights
- **Bundle Analysis**: Use the Bundle Analyzer for optimization suggestions

For issues or questions, please refer to the implementation documentation or create an issue in the project repository.