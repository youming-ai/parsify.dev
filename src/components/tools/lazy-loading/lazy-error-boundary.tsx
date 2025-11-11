/**
 * Lazy Loading Error Boundary - T152 Implementation
 * Enhanced error boundary specifically for lazy-loaded components
 * Provides retry mechanisms, fallback UI, and error reporting
 */

'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Send,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// Types for error boundary
export interface LazyErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, componentId?: string) => void;
  maxRetries?: number;
  retryDelay?: number;
  componentId?: string;
  showStackTrace?: boolean;
  enableReportBug?: boolean;
  customMessages?: {
    title?: string;
    description?: string;
    retryText?: string;
    reportText?: string;
  };
}

export interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRetrying: boolean;
  showDetails: boolean;
  errorId: string;
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorDetails {
  id: string;
  timestamp: Date;
  componentId?: string;
  error: Error;
  errorInfo: ErrorInfo;
  severity: ErrorSeverity;
  userAgent: string;
  url: string;
  retryCount: number;
  context?: {
    bundleSize?: number;
    loadTime?: number;
    networkStatus?: string;
  };
}

// Error classification utility
function classifyError(error: Error): { severity: ErrorSeverity; category: string } {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Network-related errors
  if (message.includes('network') || message.includes('fetch') || message.includes('load')) {
    return { severity: 'medium', category: 'network' };
  }

  // Module loading errors
  if (message.includes('module') || message.includes('import') || message.includes('chunk')) {
    return { severity: 'high', category: 'module-loading' };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('time out')) {
    return { severity: 'medium', category: 'timeout' };
  }

  // Memory errors
  if (message.includes('memory') || message.includes('out of memory')) {
    return { severity: 'critical', category: 'memory' };
  }

  // Syntax or parsing errors
  if (message.includes('syntax') || message.includes('parse') || stack.includes('syntaxerror')) {
    return { severity: 'high', category: 'syntax' };
  }

  // Type errors
  if (stack.includes('typeerror')) {
    return { severity: 'medium', category: 'type' };
  }

  // Reference errors
  if (stack.includes('referenceerror')) {
    return { severity: 'high', category: 'reference' };
  }

  // Default classification
  return { severity: 'low', category: 'unknown' };
}

// Main error boundary component
export class LazyErrorBoundary extends Component<LazyErrorBoundaryProps, LazyErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: LazyErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      retryCount: 0,
      isRetrying: false,
      showDetails: false,
      errorId: this.generateErrorId(),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<LazyErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: this.generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { severity, category } = classifyError(error);
    const errorDetails: ErrorDetails = {
      id: this.state.errorId,
      timestamp: new Date(),
      componentId: this.props.componentId,
      error,
      errorInfo,
      severity,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      retryCount: this.state.retryCount,
    };

    // Log error to console with severity
    const logMethod = severity === 'critical' ? 'error' : severity === 'high' ? 'error' : 'warn';
    console[logMethod](`[LazyErrorBoundary] ${severity.toUpperCase()} Error in ${this.props.componentId || 'unknown component'}:`, {
      error,
      errorInfo,
      category,
      severity,
      errorId: this.state.errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.props.componentId);
    }

    // Send error to monitoring system
    this.reportError(errorDetails);

    this.setState({
      error,
      errorInfo,
    });
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private generateErrorId = (): string => {
    return `lazy-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  private reportError = async (errorDetails: ErrorDetails): Promise<void> => {
    try {
      // Send to error tracking service (placeholder for actual implementation)
      if (typeof window !== 'undefined' && (window as any).errorReporting) {
        await (window as any).errorReporting.report(errorDetails);
      }

      // Store in local storage for debugging
      if (typeof localStorage !== 'undefined') {
        const storedErrors = JSON.parse(localStorage.getItem('lazy-component-errors') || '[]');
        storedErrors.push({
          ...errorDetails,
          timestamp: errorDetails.timestamp.toISOString(),
        });

        // Keep only last 10 errors
        if (storedErrors.length > 10) {
          storedErrors.shift();
        }

        localStorage.setItem('lazy-component-errors', JSON.stringify(storedErrors));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached');
      return;
    }

    this.setState({
      isRetrying: true,
    });

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
        showDetails: false,
      });

      toast.info(`Retrying component load... (${this.state.retryCount + 1}/${maxRetries})`);
    }, retryDelay * this.state.retryCount);
  };

  private toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }));
  };

  private copyErrorDetails = () => {
    const errorDetails = this.formatErrorDetails();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        toast.success('Error details copied to clipboard');
      });
    }
  };

  private reportBug = () => {
    const errorDetails = this.formatErrorDetails();
    const subject = encodeURIComponent(`Error in ${this.props.componentId || 'Lazy Component'}`);
    const body = encodeURIComponent(`Error Details:\n\n${errorDetails}\n\nPlease describe what you were doing when this error occurred.`);

    const mailtoUrl = `mailto:support@parsify.dev?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  private formatErrorDetails = (): string => {
    const { error, errorInfo, errorId, retryCount } = this.state;
    const { componentId } = this.props;

    return [
      `Error ID: ${errorId}`,
      `Component: ${componentId || 'Unknown'}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Retry Count: ${retryCount}`,
      `Error: ${error?.message || 'Unknown error'}`,
      `Stack: ${error?.stack || 'No stack trace available'}`,
      `Component Stack: ${errorInfo?.componentStack || 'No component stack available'}`,
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}`,
    ].join('\n\n');
  };

  render() {
    const { children, fallback, componentId, showStackTrace = true, enableReportBug = true, customMessages } = this.props;
    const { hasError, error, retryCount, isRetrying, showDetails, errorId } = this.state;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    const { severity } = error ? classifyError(error) : { severity: 'low' as ErrorSeverity };

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{customMessages?.title || 'Component Load Error'}</span>
            <Badge variant={severity === 'critical' || severity === 'high' ? 'destructive' : 'secondary'}>
              {severity.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error description */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {customMessages?.description ||
                `The component "${componentId || 'Unknown'}" failed to load. This could be due to network issues, browser compatibility, or a temporary error.`}
            </AlertDescription>
          </Alert>

          {/* Error message */}
          {error && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-mono text-red-600">{error.message}</p>
              <p className="text-xs text-gray-500 mt-1">Error ID: {errorId}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={this.handleRetry}
              disabled={isRetrying || retryCount >= (this.props.maxRetries || 3)}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>
                {isRetrying
                  ? 'Retrying...'
                  : `${customMessages?.retryText || 'Retry'} (${retryCount}/${this.props.maxRetries || 3})`
                }
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={this.toggleDetails}
              className="flex items-center space-x-2"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>{showDetails ? 'Hide' : 'Show'} Details</span>
            </Button>

            <Button
              variant="outline"
              onClick={this.copyErrorDetails}
              className="flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </Button>

            {enableReportBug && (
              <Button
                variant="outline"
                onClick={this.reportBug}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{customMessages?.reportText || 'Report Bug'}</span>
              </Button>
            )}
          </div>

          {/* Detailed error information */}
          {showDetails && error && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Error Details</h4>

              {showStackTrace && error.stack && (
                <details className="bg-gray-50 p-3 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium">Stack Trace</summary>
                  <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
                    {error.stack}
                  </pre>
                </details>
              )}

              {this.state.errorInfo?.componentStack && (
                <details className="bg-gray-50 p-3 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium">Component Stack</summary>
                  <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>Component ID: {componentId || 'Unknown'}</p>
                <p>Error ID: {errorId}</p>
                <p>Timestamp: {new Date().toISOString()}</p>
                <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'}</p>
              </div>
            </div>
          )}

          {/* Help section */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Troubleshooting Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your internet connection and try again</li>
              <li>• Clear your browser cache and reload the page</li>
              <li>• Try using a different browser or incognito mode</li>
              <li>• If the problem persists, please report the issue</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }
}

// Hook for using error boundary in functional components
export function useLazyErrorBoundary() {
  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo, componentId?: string) => {
    console.error(`[useLazyErrorBoundary] Error in component ${componentId}:`, error, errorInfo);

    // You can add additional error handling logic here
    // such as sending to analytics, error tracking services, etc.
  }, []);

  return {
    handleError,
    ErrorBoundary: LazyErrorBoundary,
  };
}

// HOC for wrapping components with lazy error boundary
export function withLazyErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<LazyErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <LazyErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </LazyErrorBoundary>
  );

  WrappedComponent.displayName = `withLazyErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Default export
export default LazyErrorBoundary;
