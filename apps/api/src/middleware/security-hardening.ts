/**
 * 安全加固中间件
 * 提供全面的安全防护功能
 */

import { logger } from '@shared/utils'
import { cors } from 'hono/cors'

export interface SecurityConfig {
  // CORS 配置
  cors: {
    origins: string[]
    methods: string[]
    headers: string[]
    credentials: boolean
    maxAge: number
  }

  // 安全头部
  securityHeaders: {
    contentSecurityPolicy: string
    hsts: boolean
    hstsMaxAge: number
    hstsIncludeSubdomains: boolean
    hstsPreload: boolean
    frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
    frameOptionsUri?: string
    contentTypeOptions: boolean
    referrerPolicy: string
    permissionsPolicy: string[]
  }

  // 限流配置
  rateLimiting: {
    enabled: boolean
    global: { requests: number; window: number }
    endpoints: Record<string, { requests: number; window: number }>
    skipSuccessfulRequests: boolean
    skipFailedRequests: boolean
  }

  // 输入验证
  inputValidation: {
    maxRequestSize: number
    allowedMethods: string[]
    allowedHeaders: string[]
    blockedUserAgents: string[]
    suspiciousPatterns: RegExp[]
  }

  // 认证和授权
  auth: {
    requireAuth: boolean
    allowedTokens: string[]
    jwt: {
      algorithm: string[]
      requiredClaims: string[]
      maxAge: number
    }
  }

  // 监控和日志
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    logRequests: boolean
    logHeaders: boolean
    logRequestBody: boolean
    securityEvents: boolean
  }
}

export class SecurityHardening {
  private requestCounts = new Map<string, { count: number; resetTime: number }>()
  private suspiciousIPs = new Set<string>()
  private securityEvents: Array<{
    timestamp: number
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    details: Record<string, unknown>
  }> = []

  constructor(private config: SecurityConfig) {
    // 定期清理过期的计数器
    setInterval(() => this.cleanupCounters(), 60000) // 每分钟清理一次
  }

  // 生成安全头部
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    // Content Security Policy
    if (this.config.securityHeaders.contentSecurityPolicy) {
      headers['Content-Security-Policy'] = this.config.securityHeaders.contentSecurityPolicy
    }

    // HTTP Strict Transport Security
    if (this.config.securityHeaders.hsts) {
      const hstsValue = [
        `max-age=${this.config.securityHeaders.hstsMaxAge}`,
        this.config.securityHeaders.hstsIncludeSubdomains ? 'includeSubDomains' : '',
        this.config.securityHeaders.hstsPreload ? 'preload' : '',
      ]
        .filter(Boolean)
        .join('; ')
      headers['Strict-Transport-Security'] = hstsValue
    }

    // X-Frame-Options
    if (
      this.config.securityHeaders.frameOptions === 'ALLOW-FROM' &&
      this.config.securityHeaders.frameOptionsUri
    ) {
      headers['X-Frame-Options'] = `ALLOW-FROM ${this.config.securityHeaders.frameOptionsUri}`
    } else {
      headers['X-Frame-Options'] = this.config.securityHeaders.frameOptions
    }

    // X-Content-Type-Options
    if (this.config.securityHeaders.contentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff'
    }

    // Referrer Policy
    if (this.config.securityHeaders.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.securityHeaders.referrerPolicy
    }

    // Permissions Policy
    if (this.config.securityHeaders.permissionsPolicy.length > 0) {
      headers['Permissions-Policy'] = this.config.securityHeaders.permissionsPolicy.join(', ')
    }

    // 安全相关的其他头部
    headers['X-XSS-Protection'] = '1; mode=block'
    headers['X-Download-Options'] = 'noopen'
    headers['X-Permitted-Cross-Domain-Policies'] = 'none'
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    headers['Cross-Origin-Resource-Policy'] = 'cross-origin'

    return headers
  }

  // CORS 中间件
  corsMiddleware() {
    return cors({
      origin: (origin, _c) => {
        if (!origin) return null
        return this.config.cors.origins.includes(origin) ? origin : null
      },
      allowMethods: this.config.cors.methods,
      allowHeaders: this.config.cors.headers,
      credentials: this.config.cors.credentials,
      maxAge: this.config.cors.maxAge,
    })
  }

  // 安全头部中间件
  securityHeadersMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      const headers = this.getSecurityHeaders()

      for (const [key, value] of Object.entries(headers)) {
        c.header(key, value)
      }

      await next()
    }
  }

  // 限流中间件
  rateLimitMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      if (!this.config.rateLimiting.enabled) {
        return await next()
      }

      const clientIP = this.getClientIP(c)
      const path = c.req.path
      const method = c.req.method

      // 检查可疑 IP
      if (this.suspiciousIPs.has(clientIP)) {
        this.logSecurityEvent('SUSPICIOUS_IP_BLOCKED', 'medium', {
          ip: clientIP,
          path,
          method,
        })
        return c.json({ error: 'Access denied' }, 429)
      }

      // 检查全局限流
      const globalKey = 'global'
      if (this.checkRateLimit(globalKey, this.config.rateLimiting.global)) {
        this.logSecurityEvent('GLOBAL_RATE_LIMIT_EXCEEDED', 'high', {
          ip: clientIP,
          path,
          method,
        })
        return c.json({ error: 'Too many requests' }, 429)
      }

      // 检查特定端点限流
      const endpointKey = `${method}:${path}`
      const endpointLimit = this.config.rateLimiting.endpoints[endpointKey]
      if (endpointLimit && this.checkRateLimit(`${clientIP}:${endpointKey}`, endpointLimit)) {
        this.logSecurityEvent('ENDPOINT_RATE_LIMIT_EXCEEDED', 'medium', {
          ip: clientIP,
          path,
          method,
          limit: endpointLimit,
        })
        return c.json({ error: 'Too many requests for this endpoint' }, 429)
      }

      await next()
    }
  }

  // 输入验证中间件
  inputValidationMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      const userAgent = c.req.header('user-agent') || ''
      const method = c.req.method
      const contentLength = parseInt(c.req.header('content-length') || '0', 10)

      // 检查允许的方法
      if (!this.config.inputValidation.allowedMethods.includes(method)) {
        this.logSecurityEvent('DISALLOWED_METHOD', 'medium', {
          method,
          ip: this.getClientIP(c),
        })
        return c.json({ error: 'Method not allowed' }, 405)
      }

      // 检查请求大小
      if (contentLength > this.config.inputValidation.maxRequestSize) {
        this.logSecurityEvent('REQUEST_TOO_LARGE', 'medium', {
          size: contentLength,
          ip: this.getClientIP(c),
        })
        return c.json({ error: 'Request too large' }, 413)
      }

      // 检查可疑 User-Agent
      if (
        this.config.inputValidation.blockedUserAgents.some(pattern => userAgent.includes(pattern))
      ) {
        this.logSecurityEvent('BLOCKED_USER_AGENT', 'low', {
          userAgent,
          ip: this.getClientIP(c),
        })
        return c.json({ error: 'Access denied' }, 403)
      }

      // 检查可疑模式
      const url = c.req.url
      const headers = c.req.header()

      for (const pattern of this.config.inputValidation.suspiciousPatterns) {
        if (pattern.test(url) || pattern.test(JSON.stringify(headers))) {
          this.logSecurityEvent('SUSPICIOUS_PATTERN', 'high', {
            pattern: pattern.source,
            url,
            ip: this.getClientIP(c),
          })
          return c.json({ error: 'Suspicious request detected' }, 400)
        }
      }

      await next()
    }
  }

  // 认证中间件
  authMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      if (!this.config.auth.requireAuth) {
        return await next()
      }

      const authHeader = c.req.header('authorization')

      if (!authHeader) {
        this.logSecurityEvent('MISSING_AUTH_HEADER', 'medium', {
          path: c.req.path,
          ip: this.getClientIP(c),
        })
        return c.json({ error: 'Authorization required' }, 401)
      }

      // 这里可以添加 JWT 验证、API Key 验证等
      // 简化版本，实际应该根据配置进行相应的验证

      await next()
    }
  }

  // 请求日志中间件
  loggingMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      const startTime = Date.now()
      const clientIP = this.getClientIP(c)
      const method = c.req.method
      const path = c.req.path
      const userAgent = c.req.header('user-agent') || ''

      // 记录请求开始
      if (this.config.monitoring.logRequests) {
        logger.info('Request started', {
          method,
          path,
          ip: clientIP,
          userAgent: this.config.monitoring.logHeaders ? userAgent : undefined,
        })
      }

      await next()

      const duration = Date.now() - startTime
      const status = c.res.status

      // 记录请求完成
      if (this.config.monitoring.logRequests) {
        logger.info('Request completed', {
          method,
          path,
          status,
          duration,
          ip: clientIP,
        })
      }

      // 记录异常请求
      if (status >= 400) {
        this.logSecurityEvent('HTTP_ERROR_RESPONSE', 'low', {
          method,
          path,
          status,
          duration,
          ip: clientIP,
        })
      }
    }
  }

  // 安全事件报告
  getSecurityEvents(limit = 100): Array<{
    timestamp: number
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    details: Record<string, unknown>
  }> {
    return this.securityEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  // 获取安全统计
  getSecurityStats(): {
    totalEvents: number
    eventsBySeverity: Record<string, number>
    eventsByType: Record<string, number>
    suspiciousIPsCount: number
    rateLimitedRequests: number
  } {
    const eventsBySeverity: Record<string, number> = {}
    const eventsByType: Record<string, number> = {}

    for (const event of this.securityEvents) {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    }

    return {
      totalEvents: this.securityEvents.length,
      eventsBySeverity,
      eventsByType,
      suspiciousIPsCount: this.suspiciousIPs.size,
      rateLimitedRequests: Array.from(this.requestCounts.values()).reduce(
        (sum, count) => sum + count.count,
        0
      ),
    }
  }

  // 清理可疑 IP
  clearSuspiciousIPs(): void {
    this.suspiciousIPs.clear()
    logger.info('Suspicious IPs cleared')
  }

  // 添加可疑 IP
  addSuspiciousIP(ip: string, reason?: string): void {
    this.suspiciousIPs.add(ip)
    this.logSecurityEvent('MANUAL_IP_BLOCK', 'medium', {
      ip,
      reason: reason || 'Manual addition',
    })
  }

  // 私有方法
  private getClientIP(c: any): string {
    return (
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0] ||
      c.req.header('x-real-ip') ||
      'unknown'
    )
  }

  private checkRateLimit(key: string, limit: { requests: number; window: number }): boolean {
    const now = Date.now()
    const counter = this.requestCounts.get(key)

    if (!counter || now > counter.resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + limit.window,
      })
      return false
    }

    if (counter.count >= limit.requests) {
      return true
    }

    counter.count++
    return false
  }

  private cleanupCounters(): void {
    const now = Date.now()
    for (const [key, counter] of this.requestCounts.entries()) {
      if (now > counter.resetTime) {
        this.requestCounts.delete(key)
      }
    }
  }

  private logSecurityEvent(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, unknown>
  ): void {
    const event = {
      timestamp: Date.now(),
      type,
      severity,
      details,
    }

    this.securityEvents.push(event)

    // 保持最近10000条记录
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000)
    }

    // 记录到日志
    const logMethod = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info'

    logger[logMethod](`Security event: ${type}`, {
      severity,
      ...details,
    })
  }
}

// 默认安全配置
export function createDefaultSecurityConfig(): SecurityConfig {
  return {
    cors: {
      origins: ['http://localhost:3000', 'https://parsify.dev'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400, // 24 hours
    },

    securityHeaders: {
      contentSecurityPolicy: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 开发环境需要，生产环境应该更严格
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://api.parsify.dev",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
      hsts: true,
      hstsMaxAge: 31536000, // 1 year
      hstsIncludeSubdomains: true,
      hstsPreload: false,
      frameOptions: 'DENY',
      contentTypeOptions: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ],
    },

    rateLimiting: {
      enabled: true,
      global: { requests: 1000, window: 3600000 }, // 1000 requests per hour
      endpoints: {
        'POST:/api/tools/format': { requests: 50, window: 60000 }, // 50 per minute
        'POST:/api/tools/validate': { requests: 30, window: 60000 }, // 30 per minute
        'POST:/api/auth/login': { requests: 5, window: 900000 }, // 5 per 15 minutes
        'POST:/api/auth/register': { requests: 3, window: 3600000 }, // 3 per hour
      },
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },

    inputValidation: {
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'accept',
        'accept-language',
        'content-type',
        'authorization',
        'x-requested-with',
        'user-agent',
      ],
      blockedUserAgents: ['curl', 'wget', 'python-requests', 'java', 'go-http-client'],
      suspiciousPatterns: [
        /\.\./, // 目录遍历
        /<script/i, // XSS 尝试
        /union.*select/i, // SQL 注入尝试
        /javascript:/i, // JavaScript 协议
        /data:text\/html/i, // 数据 URL
      ],
    },

    auth: {
      requireAuth: false, // 根据具体端点配置
      allowedTokens: [],
      jwt: {
        algorithm: ['HS256'],
        requiredClaims: ['sub', 'iat', 'exp'],
        maxAge: 3600, // 1 hour
      },
    },

    monitoring: {
      logLevel: 'info',
      logRequests: true,
      logHeaders: false,
      logRequestBody: false,
      securityEvents: true,
    },
  }
}

// 工厂函数
export function createSecurityHardening(config?: Partial<SecurityConfig>): SecurityHardening {
  const defaultConfig = createDefaultSecurityConfig()
  const finalConfig = config ? { ...defaultConfig, ...config } : defaultConfig

  return new SecurityHardening(finalConfig)
}
