import type React from 'react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logError } from '../../lib/errorHandler'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{
    error: Error
    errorInfo: ErrorInfo
    reset: () => void
  }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showMessage?: boolean
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId?: NodeJS.Timeout

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: ErrorBoundary.generateErrorId(),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    logError(error, 'ErrorBoundary.componentDidCatch')
    console.error('Error caught by boundary:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo)
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError)
      }
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId: ErrorBoundary.generateErrorId(),
    })

    // Auto-reset after 30 seconds for recoverable errors
    if (this.isRecoverableError(error)) {
      this.resetTimeoutId = setTimeout(() => {
        this.reset()
      }, 30000)
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private static generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private isRecoverableError(error: Error): boolean {
    // Define which errors are considered recoverable
    const recoverableErrors = [
      'NetworkError',
      'TimeoutError',
      'ChunkLoadError', // Related to lazy loading
    ]

    return recoverableErrors.some(
      recoverableError =>
        error.name === recoverableError || error.message.includes(recoverableError)
    )
  }

  private reset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    })

    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = undefined
    }
  }

  private handleRetry = () => {
    this.reset()
  }

  private getErrorCategory(error: Error): 'network' | 'render' | 'chunk' | 'unknown' {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'network'
    }
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      return 'chunk'
    }
    if (error.name === 'ChunkLoadError' || error.message.includes('dynamically imported module')) {
      return 'chunk'
    }
    return 'render'
  }

  private getErrorMessage(error: Error): string {
    const category = this.getErrorCategory(error)

    switch (category) {
      case 'network':
        return 'Network connection issue. Please check your internet connection and try again.'
      case 'chunk':
        return 'Application update required. Please refresh the page.'
      case 'render':
        return 'Something went wrong while rendering the application.'
      default:
        return 'An unexpected error occurred.'
    }
  }

  private getErrorActions(error: Error): Array<{ label: string; action: () => void }> {
    const category = this.getErrorCategory(error)
    const actions = []

    actions.push({
      label: 'Try Again',
      action: this.handleRetry,
    })

    if (category === 'network') {
      actions.push({
        label: 'Refresh Page',
        action: () => window.location.reload(),
      })
    }

    if (category === 'chunk') {
      actions.push({
        label: 'Reload App',
        action: () => window.location.reload(),
      })
    }

    return actions
  }

  private shouldShowMessage(): boolean {
    return this.props.showMessage !== false
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // If custom fallback component is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            reset={this.reset}
          />
        )
      }

      // Default error UI
      if (this.shouldShowMessage()) {
        const error = this.state.error
        const errorMessage = this.getErrorMessage(error)
        const actions = this.getErrorActions(error)
        const category = this.getErrorCategory(error)

        return (
          <div
            className={`error-boundary error-boundary--${category} ${this.props.className || ''}`}
          >
            <div className="error-boundary__container">
              <div className="error-boundary__icon" role="img" aria-label="Error icon">
                ⚠️
              </div>

              <h1 className="error-boundary__title">Oops! Something went wrong</h1>

              <p className="error-boundary__message">{errorMessage}</p>

              {process.env.NODE_ENV === 'development' && (
                <details className="error-boundary__details">
                  <summary className="error-boundary__details-summary">
                    Error Details (Development Mode)
                  </summary>
                  <div className="error-boundary__details-content">
                    <div className="error-boundary__error-info">
                      <h4>Error:</h4>
                      <pre className="error-boundary__error-stack">
                        {error.name}: {error.message}
                      </pre>
                      {error.stack && (
                        <pre className="error-boundary__error-stack">{error.stack}</pre>
                      )}
                    </div>

                    <div className="error-boundary__component-info">
                      <h4>Component Stack:</h4>
                      <pre className="error-boundary__component-stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>

                    {this.state.errorId && (
                      <div className="error-boundary__error-id">
                        <h4>Error ID:</h4>
                        <code>{this.state.errorId}</code>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="error-boundary__actions">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={action.action}
                    className="error-boundary__action"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      // Silent mode (no UI shown) - just log the error
      return null
    }

    return this.props.children
  }
}

// Functional wrapper for easier usage
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallback?: React.ComponentType<{
    error: Error
    errorInfo: ErrorInfo
    reset: () => void
  }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showMessage?: boolean
}

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default ErrorBoundary
