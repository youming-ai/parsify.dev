/**
 * Enhanced Lazy Monaco Editor - T152 Implementation
 * Improved lazy loading for Monaco Editor with monitoring, preloading, and better UX
 */

'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { LazyErrorBoundary } from '@/components/tools/lazy-loading/lazy-error-boundary';
import { MonacoEditorSkeleton } from '@/components/tools/lazy-loading/loading-skeletons';
import { useLazyLoading, withLazyLoading } from '@/components/tools/lazy-loading/lazy-loading-provider';
import type { CodeEditorProps } from './code-types';

// Lazy load Monaco Editor with enhanced error handling
const Editor = React.lazy(() =>
  import('@monaco-editor/react')
    .then((mod) => ({ default: mod.Editor }))
    .catch((error) => {
      console.error('Failed to load Monaco Editor:', error);
      // Return a fallback component that shows the error
      return {
        default: ({ value, onChange, ...props }: any) => (
          <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
            <h3 className="text-red-800 font-medium mb-2">Editor Failed to Load</h3>
            <p className="text-red-600 text-sm mb-3">Monaco Editor could not be loaded. This might be due to network issues or browser compatibility.</p>
            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
              {value || 'No content to display'}
            </pre>
          </div>
        )
      };
    })
);

interface LazyMonacoEditorProps extends CodeEditorProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  preload?: boolean;
  priority?: 'high' | 'normal' | 'low';
  onLoadingStart?: () => void;
  onLoadingComplete?: (loadTime: number) => void;
  onError?: (error: Error) => void;
  enableMinimap?: boolean;
  enableLineNumbers?: boolean;
  theme?: 'light' | 'dark' | 'vs' | 'vs-dark';
  analytics?: {
    trackLoadTime?: boolean;
    trackInteractions?: boolean;
    trackErrors?: boolean;
  };
}

// Enhanced Monaco Editor with advanced lazy loading
export function LazyMonacoEditor({
  fallback,
  errorFallback,
  preload = false,
  priority = 'normal',
  onLoadingStart,
  onLoadingComplete,
  onError,
  enableMinimap = true,
  enableLineNumbers = true,
  theme = 'vs-dark',
  analytics = {
    trackLoadTime: true,
    trackInteractions: true,
    trackErrors: true,
  },
  height = 400,
  width = '100%',
  className,
  options = {},
  ...props
}: LazyMonacoEditorProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [loadStartTime, setLoadStartTime] = React.useState(0);
  const [retryCount, setRetryCount] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { preloadComponent, markComponentLoaded, markComponentFailed } = useLazyLoading();

  // Enhanced editor options
  const enhancedOptions = React.useMemo(() => ({
    minimap: { enabled: enableMinimap },
    lineNumbers: enableLineNumbers ? 'on' : 'off',
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    bracketPairColorization: { enabled: true },
    guides: {
      indentation: true,
      bracketPairs: true,
      bracketPairsHorizontal: false
    },
    ...(options || {}),
  }), [enableMinimap, enableLineNumbers, options]);

  // Intersection Observer for lazy loading with enhanced threshold
  React.useEffect(() => {
    if (!containerRef.current) return;

    const threshold = priority === 'high' ? 0.5 : priority === 'low' ? 0.1 : 0.25;
    const rootMargin = priority === 'high' ? '200px' : priority === 'low' ? '50px' : '100px';

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (analytics.trackInteractions) {
            console.debug(`Monaco Editor intersection detected for ${props.language || 'unknown'}`);
          }
          setIsLoading(true);
          setLoadStartTime(performance.now());
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      },
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority, analytics.trackInteractions, props.language]);

  // Preload Monaco Editor if requested
  React.useEffect(() => {
    if (preload) {
      const componentId = `monaco-editor-${props.language || 'unknown'}`;
      preloadComponent(componentId, () => import('@monaco-editor/react'));
    }
  }, [preload, props.language, preloadComponent]);

  // Handle loading completion
  const handleMount = React.useCallback((editor: any, monaco: any) => {
    const loadTime = performance.now() - loadStartTime;
    setHasLoaded(true);
    setIsLoading(false);

    // Track loading metrics
    if (analytics.trackLoadTime && onLoadingComplete) {
      onLoadingComplete(loadTime);
    }

    // Mark component as loaded in the lazy loading system
    if (loadStartTime > 0) {
      const componentId = `monaco-editor-${props.language || 'unknown'}`;
      markComponentLoaded(componentId, loadTime, 250000); // ~250KB for Monaco Editor
    }

    // Call original onMount if provided
    if (props.onMount) {
      props.onMount(editor, monaco);
    }

    if (analytics.trackInteractions) {
      console.debug(`Monaco Editor loaded for ${props.language || 'unknown'}:`, {
        loadTime: `${loadTime.toFixed(2)}ms`,
        retryCount,
      });
    }
  }, [loadStartTime, onLoadingComplete, props.onMount, props.language, analytics, retryCount, markComponentLoaded]);

  // Handle loading error
  const handleError = React.useCallback((error: Error) => {
    setIsLoading(false);
    const componentId = `monaco-editor-${props.language || 'unknown'}`;
    markComponentFailed(componentId, error);

    if (onError) {
      onError(error);
    }

    if (analytics.trackErrors) {
      console.error(`Monaco Editor loading error for ${props.language || 'unknown'}:`, error);
    }
  }, [onError, props.language, analytics.trackErrors, markComponentFailed]);

  // Default enhanced fallback with skeleton
  const defaultFallback = fallback || (
    <MonacoEditorSkeleton
      height={height}
      showLineNumbers={enableLineNumbers}
      showToolbar={true}
    />
  );

  // Default error fallback
  const defaultErrorFallback = errorFallback || (
    <div className="flex h-96 items-center justify-center rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="text-red-600">
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-red-800">Failed to load editor</p>
          <p className="text-red-600 text-sm">The code editor could not be loaded. Please try refreshing the page.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <LazyErrorBoundary
      componentId={`monaco-editor-${props.language || 'unknown'}`}
      onError={handleError}
      maxRetries={3}
      showStackTrace={process.env.NODE_ENV === 'development'}
      customMessages={{
        title: 'Code Editor Failed to Load',
        description: 'The Monaco Editor failed to load. This is typically due to network issues or browser compatibility problems.',
        retryText: 'Reload Editor',
        reportText: 'Report Issue',
      }}
    >
      <div
        ref={containerRef}
        className={cn('overflow-hidden rounded-lg border', className)}
        data-component="lazy-monaco-editor"
        data-language={props.language}
        data-loaded={hasLoaded}
        data-loading={isLoading}
      >
        {isLoading || hasLoaded ? (
          <React.Suspense fallback={defaultFallback}>
            <Editor
              height={height}
              width={width}
              value={props.value}
              language={props.language}
              onChange={(newValue) => {
                if (props.onChange && newValue !== undefined) {
                  props.onChange(newValue);
                }
              }}
              onMount={handleMount}
              theme={theme}
              options={enhancedOptions}
              loading={defaultFallback}
              // Add performance tracking
              beforeMount={(monaco) => {
                // Configure Monaco for performance
                monaco.editor.setModelOptions?.(monaco.editor.createModel?.('', props.language || 'plaintext'), {
                  tabSize: 2,
                  insertSpaces: true,
                  detectIndentation: false,
                });
              }}
            />
          </React.Suspense>
        ) : (
          defaultFallback
        )}
      </div>
    </LazyErrorBoundary>
  );
}

// Preload hook for critical scenarios with enhanced functionality
export function useMonacoPreload() {
  const { preloadComponent } = useLazyLoading();

  const preload = React.useCallback(async (language?: string) => {
    const componentId = `monaco-editor-${language || 'all'}`;
    try {
      await preloadComponent(componentId, () => import('@monaco-editor/react'));
      console.debug(`Monaco Editor preloaded for language: ${language || 'all'}`);
    } catch (error) {
      console.error('Failed to preload Monaco Editor:', error);
    }
  }, [preloadComponent]);

  const preloadLanguages = React.useCallback(async (languages: string[]) => {
    const promises = languages.map(lang => preload(lang));
    await Promise.allSettled(promises);
  }, [preload]);

  return {
    preload,
    preloadLanguages,
    // Add common language preloading
    preloadCommon: () => preloadLanguages(['javascript', 'typescript', 'json', 'python', 'html', 'css'])
  };
}

// Optimized Code Editor component with lazy loading
export function OptimizedCodeEditor(props: CodeEditorProps) {
  return <LazyMonacoEditor {...props} priority="normal" />;
}

// High-priority Code Editor for immediate loading
export function HighPriorityCodeEditor(props: CodeEditorProps) {
  return <LazyMonacoEditor {...props} priority="high" preload />;
}

// Low-priority Code Editor for deferred loading
export function LowPriorityCodeEditor(props: CodeEditorProps) {
  return <LazyMonacoEditor {...props} priority="low" />;
}

// Create a lazy-loaded version of the editor for different languages
export function createLazyEditor(language: string) {
  return React.forwardRef<any, Omit<LazyMonacoEditorProps, 'language'>>((props, ref) => (
    <LazyMonacoEditor
      {...props}
      language={language}
      ref={ref}
      analytics={{
        trackLoadTime: true,
        trackInteractions: true,
        trackErrors: true,
      }}
    />
  ));
}

// Pre-configured language-specific editors
export const LazyJavaScriptEditor = createLazyEditor('javascript');
export const LazyTypeScriptEditor = createLazyEditor('typescript');
export const LazyJSONEditor = createLazyEditor('json');
export const LazyPythonEditor = createLazyEditor('python');
export const LazyHTMLEditor = createLazyEditor('html');
export const LazyCSSEditor = createLazyEditor('css');
export const LazySQLEditor = createLazyEditor('sql');
export const LazyMarkdownEditor = createLazyEditor('markdown');

export default LazyMonacoEditor;
