// Shared utility functions for Parsify.dev

export const createId = () => Math.random().toString(36).substr(2, 9)

export type { ErrorSeverity, ErrorType } from './error-handler'
// Export error handling functionality
export {
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  ErrorHandler,
  errorHandler,
  handleError,
  NetworkError,
  ParsifyError,
  RateLimitError,
  RetryHandler,
  retryHandler,
  ValidationError,
  WASMExecutionError,
  withRetry,
} from './error-handler'
export type { LogContext, LogEntry, LogLevel } from './logger'
// Export logger functionality
export { createLogger, Logger, logger } from './logger'

// Additional utility functions will be added here as needed
