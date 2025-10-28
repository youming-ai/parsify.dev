/**
 * 统一日志管理系统
 * 提供结构化日志记录，支持不同环境和级别
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: Error
  source?: string
}

class Logger {
  private isDevelopment: boolean
  private isTest: boolean
  private source: string

  constructor(source?: string) {
    this.source = source || 'parsify'
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isTest = process.env.NODE_ENV === 'test'
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isTest) return false

    const logLevel = process.env.LOG_LEVEL || 'info'
    const levels: Record<string, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }

    return levels[level] >= levels[logLevel]
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      source: this.source,
      context,
      error,
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, source, context, error } = entry

    let formatted = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`

    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`
    }

    if (error) {
      formatted += ` | Error: ${error.message}`
      if (error.stack && this.isDevelopment) {
        formatted += `\nStack: ${error.stack}`
      }
    }

    return formatted
  }

  private async logToSentry(entry: LogEntry) {
    if (typeof window !== 'undefined') {
      // 客户端 Sentry
      const Sentry = await import('@sentry/react').catch(() => null)
      if (Sentry) {
        if (entry.level === 'error' && entry.error) {
          Sentry.captureException(entry.error, {
            extra: entry.context,
            tags: { source: entry.source },
          })
        } else if (entry.level === 'warn') {
          Sentry.captureMessage(entry.message, 'warning', {
            extra: entry.context,
            tags: { source: entry.source },
          })
        }
      }
    } else {
      // 服务端 Sentry (如果可用)
      try {
        const Sentry = await import('@sentry/node').catch(() => null)
        if (Sentry) {
          if (entry.level === 'error' && entry.error) {
            Sentry.captureException(entry.error, {
              extra: entry.context,
              tags: { source: entry.source },
            })
          } else if (entry.level === 'warn') {
            Sentry.captureMessage(entry.message, 'warning', {
              extra: entry.context,
              tags: { source: entry.source },
            })
          }
        }
      } catch {
        // Sentry 不可用时静默失败
      }
    }
  }

  private async writeLog(entry: LogEntry) {
    const formatted = this.formatLogEntry(entry)

    // 控制台输出
    switch (entry.level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }

    // 发送到 Sentry (仅警告和错误)
    if ((entry.level === 'warn' || entry.level === 'error') && !this.isDevelopment) {
      this.logToSentry(entry).catch(() => {
        // 静默处理 Sentry 错误
      })
    }

    // 在开发环境中，可以将日志写入文件 (仅 Node.js 环境)
    if (this.isDevelopment && typeof window === 'undefined') {
      try {
        const fs = await import('node:fs').catch(() => null)
        if (fs) {
          const logFile = `./logs/${this.source}-${entry.level}.log`
          fs.appendFileSync(logFile, `${formatted}\n`)
        }
      } catch {
        // 静默处理文件写入错误
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return

    const entry = this.createLogEntry('debug', message, context)
    this.writeLog(entry)
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return

    const entry = this.createLogEntry('info', message, context)
    this.writeLog(entry)
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return

    const entry = this.createLogEntry('warn', message, context)
    this.writeLog(entry)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog('error')) return

    const entry = this.createLogEntry('error', message, context, error)
    this.writeLog(entry)
  }

  // 性能日志
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      ...context,
      operation,
      duration,
      type: 'performance',
    })
  }

  // API 请求日志
  apiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 400 ? 'warn' : 'info'

    this[level](`API ${method} ${url} - ${statusCode} (${duration}ms)`, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      type: 'api_request',
    })
  }

  // 用户操作日志
  userAction(action: string, userId?: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
      userId,
      type: 'user_action',
    })
  }
}

// 创建默认日志实例
export const createLogger = (source?: string) => new Logger(source)

// 默认导出日志实例
export const logger = createLogger()

// 导出 Logger 类供扩展使用
export { Logger }

// 导出类型
export type { LogLevel, LogContext, LogEntry }
