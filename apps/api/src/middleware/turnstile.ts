import type { Context, Next } from 'hono'
import type { CloudflareService } from '../services/cloudflare'
import type { AuthContext } from './auth'

// Turnstile configuration
export interface TurnstileConfig {
  siteKey: string
  secretKey: string
  enabled: boolean
  skipPaths: string[]
  protectionLevel: 'low' | 'medium' | 'high'
  actionBasedValidation: boolean
  ipBasedValidation: boolean
  userAgentBasedValidation: boolean
  sessionBasedValidation: boolean
  cachingEnabled: boolean
  cacheTTL: number
  scoreThreshold: {
    low: number
    medium: number
    high: number
  }
  timeout: number
  retryAttempts: number
}

// Turnstile validation response
export interface TurnstileValidationResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

// Turnstile error codes
export enum TurnstileErrorCode {
  MISSING_INPUT_SECRET = 'missing-input-secret',
  INVALID_INPUT_SECRET = 'invalid-input-secret',
  MISSING_INPUT_RESPONSE = 'missing-input-response',
  INVALID_INPUT_RESPONSE = 'invalid-input-response',
  BAD_REQUEST = 'bad-request',
  TIMEOUT_OR_DUPLICATE = 'timeout-or-duplicate',
  INVALID_ELEMENT_ID = 'invalid-element-id',
  BAD_TOKEN = 'bad-token',
  INTERNAL_ERROR = 'internal-error',
}

// Turnstile error types
export enum TurnstileError {
  MISSING_TOKEN = 'MISSING_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_ERROR = 'SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  BOT_DETECTED = 'BOT_DETECTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

// Bot detection result
export interface BotDetectionResult {
  isBot: boolean
  confidence: number
  riskScore: number
  reasons: string[]
  action: 'allow' | 'challenge' | 'block'
  metadata: {
    ip: string
    userAgent: string
    country?: string
    asn?: string
    threatLevel?: string
  }
}

// Turnstile middleware options
export interface TurnstileMiddlewareOptions {
  config?: Partial<TurnstileConfig>
  required?: boolean
  action?: string
  skipPaths?: string[]
  customValidation?: (token: string, context: TurnstileContext) => Promise<boolean>
  onError?: (
    c: Context,
    error: TurnstileError,
    result?: TurnstileValidationResponse
  ) => Response | Promise<Response>
  onSuccess?: (c: Context, result: TurnstileValidationResponse) => void | Promise<void>
}

// Turnstile context
export interface TurnstileContext {
  token?: string
  action?: string
  ip: string
  userAgent: string
  user?: any
  sessionId?: string
  requestId: string
  validationResponse?: TurnstileValidationResponse
  botDetection?: BotDetectionResult
}

// Default configuration
const DEFAULT_CONFIG: TurnstileConfig = {
  siteKey: '',
  secretKey: '',
  enabled: true,
  skipPaths: ['/health', '/metrics', '/robots.txt'],
  protectionLevel: 'medium',
  actionBasedValidation: true,
  ipBasedValidation: true,
  userAgentBasedValidation: true,
  sessionBasedValidation: true,
  cachingEnabled: true,
  cacheTTL: 300, // 5 minutes
  scoreThreshold: {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
  },
  timeout: 5000, // 5 seconds
  retryAttempts: 3,
}

/**
 * Turnstile middleware for Hono
 * Provides bot protection using Cloudflare Turnstile
 */
export const turnstileMiddleware = (options: TurnstileMiddlewareOptions = {}) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const {
      config: customConfig = {},
      required = false,
      action,
      skipPaths = [],
      customValidation,
      onError,
      onSuccess,
    } = options

    // Merge with default configuration
    const config: TurnstileConfig = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      siteKey: customConfig.siteKey || c.env.TURNSTILE_SITE_KEY || DEFAULT_CONFIG.siteKey,
      secretKey: customConfig.secretKey || c.env.TURNSTILE_SECRET_KEY || DEFAULT_CONFIG.secretKey,
    }

    // Check if Turnstile is enabled
    if (!config.enabled) {
      await next()
      return
    }

    // Skip validation for specified paths
    const skipCondition =
      skipPaths.some(path => c.req.path.startsWith(path)) ||
      config.skipPaths.some(path => c.req.path.startsWith(path))

    if (skipCondition) {
      await next()
      return
    }

    const requestId = c.get('requestId') || generateRequestId()
    const cloudflare = c.get('cloudflare') as CloudflareService
    const auth = c.get('auth') as AuthContext

    // Get client information
    const clientIP = getClientIP(c)
    const userAgent = c.req.header('User-Agent') || 'unknown'

    // Initialize Turnstile context
    const turnstileContext: TurnstileContext = {
      ip: clientIP,
      userAgent,
      user: auth.user,
      sessionId: auth.sessionId,
      requestId,
      action: action || c.req.header('X-Turnstile-Action'),
    }

    try {
      // Extract Turnstile token
      const token = extractTurnstileToken(c)
      turnstileContext.token = token

      // If no token and validation is required, return error
      if (!token) {
        if (required) {
          return handleTurnstileError(c, TurnstileError.MISSING_TOKEN, requestId, onError)
        }
        await next()
        return
      }

      // Check cache if enabled
      if (config.cachingEnabled) {
        const cachedResult = await getCachedValidationResult(cloudflare, token, config.cacheTTL)
        if (cachedResult) {
          turnstileContext.validationResponse = cachedResult
          if (cachedResult.success) {
            await onSuccess?.(c, cachedResult)
            c.set('turnstile', turnstileContext)
            await next()
            return
          }
        }
      }

      // Validate token with Cloudflare
      const validationResult = await validateTurnstileToken(token, config, turnstileContext)
      turnstileContext.validationResponse = validationResult

      if (!validationResult.success) {
        const error = mapTurnstileErrorCode(validationResult['error-codes']?.[0])

        // Log validation failure
        await logTurnstileEvent(cloudflare, 'validation_failed', {
          token: `${token.substring(0, 10)}...`,
          errorCodes: validationResult['error-codes'],
          ip: clientIP,
          userAgent,
          requestId,
        })

        if (required) {
          return handleTurnstileError(c, error, requestId, onError, validationResult)
        }
        await next()
        return
      }

      // Perform bot detection
      if (config.ipBasedValidation || config.userAgentBasedValidation) {
        const botDetection = await performBotDetection(c, turnstileContext, config)
        turnstileContext.botDetection = botDetection

        if (botDetection.isBot) {
          await logTurnstileEvent(cloudflare, 'bot_detected', {
            confidence: botDetection.confidence,
            riskScore: botDetection.riskScore,
            reasons: botDetection.reasons,
            action: botDetection.action,
            ip: clientIP,
            userAgent,
            requestId,
          })

          if (botDetection.action === 'block' && required) {
            return handleTurnstileError(c, TurnstileError.BOT_DETECTED, requestId, onError)
          }
        }
      }

      // Perform custom validation if provided
      if (customValidation) {
        const customValid = await customValidation(token, turnstileContext)
        if (!customValid) {
          if (required) {
            return handleTurnstileError(c, TurnstileError.VALIDATION_FAILED, requestId, onError)
          }
          await next()
          return
        }
      }

      // Cache successful validation if enabled
      if (config.cachingEnabled && validationResult.success) {
        await cacheValidationResult(cloudflare, token, validationResult, config.cacheTTL)
      }

      // Log successful validation
      await logTurnstileEvent(cloudflare, 'validation_success', {
        action: validationResult.action,
        hostname: validationResult.hostname,
        ip: clientIP,
        userAgent,
        requestId,
      })

      // Call success callback
      await onSuccess?.(c, validationResult)

      // Set Turnstile context
      c.set('turnstile', turnstileContext)

      await next()
    } catch (error) {
      console.error('Turnstile middleware error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: c.req.path,
        method: c.req.method,
        requestId,
      })

      // Log error
      await logTurnstileEvent(cloudflare, 'middleware_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: clientIP,
        userAgent,
        requestId,
      })

      if (required) {
        return handleTurnstileError(c, TurnstileError.SERVICE_ERROR, requestId, onError)
      }

      await next()
    }
  }
}

/**
 * Extract Turnstile token from request
 */
function extractTurnstileToken(c: Context): string | null {
  // Try to get token from header
  const headerToken =
    c.req.header('X-Turnstile-Token') ||
    c.req.header('CF-Turnstile-Token') ||
    c.req.header('Turnstile-Token')

  if (headerToken) {
    return headerToken
  }

  // Try to get token from form data
  if (c.req.method === 'POST') {
    const contentType = c.req.header('Content-Type') || ''

    if (contentType.includes('application/json')) {
      try {
        const body = c.req.json() as any
        return body['cf-turnstile-response'] || body.turnstileToken || body.token
      } catch {
        // JSON parsing failed, continue to other methods
      }
    }

    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      try {
        const formData = c.req.formData() as any
        return (
          formData.get('cf-turnstile-response') ||
          formData.get('turnstileToken') ||
          formData.get('token')
        )
      } catch {
        // Form data parsing failed
      }
    }
  }

  // Try to get token from query parameters
  const url = new URL(c.req.url)
  return (
    url.searchParams.get('cf-turnstile-response') ||
    url.searchParams.get('turnstileToken') ||
    url.searchParams.get('token')
  )
}

/**
 * Validate Turnstile token with Cloudflare
 */
async function validateTurnstileToken(
  token: string,
  config: TurnstileConfig,
  context: TurnstileContext
): Promise<TurnstileValidationResponse> {
  const formData = new URLSearchParams()
  formData.append('secret', config.secretKey)
  formData.append('response', token)

  if (context.ip) {
    formData.append('remoteip', context.ip)
  }

  let attempt = 0
  const maxAttempts = config.retryAttempts

  while (attempt < maxAttempts) {
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: AbortSignal.timeout(config.timeout),
      })

      if (!response.ok) {
        throw new Error(`Turnstile validation failed: ${response.status} ${response.statusText}`)
      }

      const result = (await response.json()) as TurnstileValidationResponse
      return result
    } catch (error) {
      attempt++
      if (attempt >= maxAttempts) {
        throw error
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 100))
    }
  }

  throw new Error('Turnstile validation failed after maximum retry attempts')
}

/**
 * Perform bot detection based on request context
 */
async function performBotDetection(
  c: Context,
  context: TurnstileContext,
  config: TurnstileConfig
): Promise<BotDetectionResult> {
  const result: BotDetectionResult = {
    isBot: false,
    confidence: 0,
    riskScore: 0,
    reasons: [],
    action: 'allow',
    metadata: {
      ip: context.ip,
      userAgent: context.userAgent,
    },
  }

  // Get Cloudflare request information
  const cfData = c.req.raw.cf as any
  if (cfData) {
    result.metadata.country = cfData.country
    result.metadata.asn = cfData.asn
    result.metadata.threatLevel = cfData.threat_level
  }

  // IP-based analysis
  if (config.ipBasedValidation) {
    const ipScore = analyzeIP(context.ip, cfData)
    result.riskScore += ipScore.score
    if (ipScore.isSuspicious) {
      result.reasons.push(...ipScore.reasons)
    }
  }

  // User-Agent analysis
  if (config.userAgentBasedValidation) {
    const uaScore = analyzeUserAgent(context.userAgent)
    result.riskScore += uaScore.score
    if (uaScore.isSuspicious) {
      result.reasons.push(...uaScore.reasons)
    }
  }

  // Session-based analysis
  if (config.sessionBasedValidation && context.sessionId) {
    const sessionScore = analyzeSession(context.sessionId, context.user)
    result.riskScore += sessionScore.score
    if (sessionScore.isSuspicious) {
      result.reasons.push(...sessionScore.reasons)
    }
  }

  // Calculate confidence and determine action
  const threshold = config.scoreThreshold[config.protectionLevel]
  result.confidence = Math.min(result.riskScore, 1.0)

  if (result.confidence >= threshold) {
    result.isBot = true
    result.action = result.confidence >= threshold + 0.2 ? 'block' : 'challenge'
  }

  return result
}

/**
 * Analyze IP for bot indicators
 */
function analyzeIP(
  ip: string,
  cfData?: any
): { score: number; isSuspicious: boolean; reasons: string[] } {
  const result = { score: 0, isSuspicious: false, reasons: [] as string[] }

  if (!ip || ip === 'unknown') {
    result.score += 0.3
    result.reasons.push('Unknown IP address')
  }

  // Check for private/internal IPs
  if (ip && (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.'))) {
    result.score += 0.1
    result.reasons.push('Private IP address')
  }

  // Check Cloudflare threat data
  if (cfData) {
    if (cfData.threat_level === 'high') {
      result.score += 0.8
      result.reasons.push('High threat level detected')
    } else if (cfData.threat_level === 'medium') {
      result.score += 0.4
      result.reasons.push('Medium threat level detected')
    }

    if (cfData.bot_management?.score !== undefined) {
      const botScore = cfData.bot_management.score
      if (botScore > 50) {
        result.score += botScore / 100
        result.reasons.push(`High bot management score: ${botScore}`)
      }
    }
  }

  result.isSuspicious = result.score > 0.3
  return result
}

/**
 * Analyze User-Agent for bot indicators
 */
function analyzeUserAgent(userAgent: string): {
  score: number
  isSuspicious: boolean
  reasons: string[]
} {
  const result = { score: 0, isSuspicious: false, reasons: [] as string[] }

  if (!userAgent || userAgent === 'unknown') {
    result.score += 0.4
    result.reasons.push('Missing User-Agent')
    return result
  }

  const ua = userAgent.toLowerCase()

  // Check for common bot indicators
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /node/i,
    /php/i,
    /ruby/i,
    /go-http/i,
    /postman/i,
    /insomnia/i,
    /httpie/i,
  ]

  for (const pattern of botPatterns) {
    if (pattern.test(ua)) {
      result.score += 0.3
      result.reasons.push(`Bot pattern detected: ${pattern.source}`)
      break
    }
  }

  // Check for missing common browser features
  const browserFeatures = [
    'mozilla',
    'webkit',
    'gecko',
    'chromium',
    'safari',
    'firefox',
    'edge',
    'chrome',
  ]
  const hasBrowserFeature = browserFeatures.some(feature => ua.includes(feature))

  if (!hasBrowserFeature) {
    result.score += 0.2
    result.reasons.push('No browser features detected')
  }

  // Check for very short or very long user agents
  if (ua.length < 20) {
    result.score += 0.1
    result.reasons.push('Very short User-Agent')
  } else if (ua.length > 500) {
    result.score += 0.1
    result.reasons.push('Very long User-Agent')
  }

  result.isSuspicious = result.score > 0.3
  return result
}

/**
 * Analyze session for suspicious patterns
 */
function analyzeSession(
  sessionId: string,
  user?: any
): { score: number; isSuspicious: boolean; reasons: string[] } {
  const result = { score: 0, isSuspicious: false, reasons: [] as string[] }

  if (!sessionId) {
    result.score += 0.2
    result.reasons.push('No session ID')
  }

  // New user without established patterns
  if (user && !user.emailVerified) {
    result.score += 0.1
    result.reasons.push('Unverified email')
  }

  // Recently created account
  if (user?.createdAt) {
    const accountAge = Date.now() - new Date(user.createdAt).getTime()
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)

    if (daysSinceCreation < 1) {
      result.score += 0.3
      result.reasons.push('Recently created account')
    } else if (daysSinceCreation < 7) {
      result.score += 0.1
      result.reasons.push('Account created within last week')
    }
  }

  result.isSuspicious = result.score > 0.2
  return result
}

/**
 * Cache validation result
 */
async function cacheValidationResult(
  cloudflare: CloudflareService,
  token: string,
  result: TurnstileValidationResponse,
  ttl: number
): Promise<void> {
  try {
    const cacheKey = `turnstile_validation:${token.substring(0, 20)}`
    await cloudflare.cacheSet('cache', cacheKey, result, { ttl })
  } catch (error) {
    console.error('Failed to cache Turnstile validation result:', error)
  }
}

/**
 * Get cached validation result
 */
async function getCachedValidationResult(
  cloudflare: CloudflareService,
  token: string,
  _ttl: number
): Promise<TurnstileValidationResponse | null> {
  try {
    const cacheKey = `turnstile_validation:${token.substring(0, 20)}`
    return await cloudflare.cacheGet<TurnstileValidationResponse>('cache', cacheKey)
  } catch (error) {
    console.error('Failed to get cached Turnstile validation result:', error)
    return null
  }
}

/**
 * Map Turnstile error codes to middleware errors
 */
function mapTurnstileErrorCode(errorCode?: string): TurnstileError {
  switch (errorCode) {
    case TurnstileErrorCode.MISSING_INPUT_RESPONSE:
      return TurnstileError.MISSING_TOKEN
    case TurnstileErrorCode.INVALID_INPUT_RESPONSE:
    case TurnstileErrorCode.BAD_TOKEN:
      return TurnstileError.INVALID_TOKEN
    case TurnstileErrorCode.TIMEOUT_OR_DUPLICATE:
      return TurnstileError.EXPIRED_TOKEN
    case TurnstileErrorCode.MISSING_INPUT_SECRET:
    case TurnstileErrorCode.INVALID_INPUT_SECRET:
      return TurnstileError.CONFIGURATION_ERROR
    case TurnstileErrorCode.BAD_REQUEST:
    case TurnstileErrorCode.INTERNAL_ERROR:
      return TurnstileError.SERVICE_ERROR
    default:
      return TurnstileError.VALIDATION_FAILED
  }
}

/**
 * Handle Turnstile errors
 */
function handleTurnstileError(
  c: Context,
  error: TurnstileError,
  requestId?: string,
  onError?: (
    c: Context,
    error: TurnstileError,
    result?: TurnstileValidationResponse
  ) => Response | Promise<Response>,
  validationResult?: TurnstileValidationResponse
): Response {
  if (onError) {
    return onError(c, error, validationResult)
  }

  const statusCode = getStatusCodeForError(error)
  const message = getErrorMessage(error)

  return c.json(
    {
      error: 'Turnstile Validation Failed',
      message,
      code: error,
      requestId,
      details: validationResult
        ? {
            errorCodes: validationResult['error-codes'],
          }
        : undefined,
    },
    statusCode
  )
}

/**
 * Get HTTP status code for error
 */
function getStatusCodeForError(error: TurnstileError): number {
  switch (error) {
    case TurnstileError.MISSING_TOKEN:
    case TurnstileError.INVALID_TOKEN:
    case TurnstileError.EXPIRED_TOKEN:
    case TurnstileError.VALIDATION_FAILED:
    case TurnstileError.BOT_DETECTED:
    case TurnstileError.SUSPICIOUS_ACTIVITY:
      return 403
    case TurnstileError.RATE_LIMIT_EXCEEDED:
      return 429
    case TurnstileError.CONFIGURATION_ERROR:
    case TurnstileError.SERVICE_ERROR:
      return 500
    default:
      return 500
  }
}

/**
 * Get error message
 */
function getErrorMessage(error: TurnstileError): string {
  switch (error) {
    case TurnstileError.MISSING_TOKEN:
      return 'Turnstile token is required'
    case TurnstileError.INVALID_TOKEN:
      return 'Invalid Turnstile token'
    case TurnstileError.EXPIRED_TOKEN:
      return 'Turnstile token has expired'
    case TurnstileError.VALIDATION_FAILED:
      return 'Turnstile validation failed'
    case TurnstileError.BOT_DETECTED:
      return 'Bot activity detected'
    case TurnstileError.SUSPICIOUS_ACTIVITY:
      return 'Suspicious activity detected'
    case TurnstileError.RATE_LIMIT_EXCEEDED:
      return 'Too many validation attempts'
    case TurnstileError.CONFIGURATION_ERROR:
      return 'Turnstile configuration error'
    case TurnstileError.SERVICE_ERROR:
      return 'Turnstile service error'
    default:
      return 'Unknown Turnstile error'
  }
}

/**
 * Log Turnstile events
 */
async function logTurnstileEvent(
  cloudflare: CloudflareService,
  event: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...data,
    }

    await cloudflare.cacheSet('analytics', `turnstile_event:${data.requestId}`, logData, {
      ttl: 86400, // 24 hours
    })

    console.log('Turnstile event:', logData)
  } catch (error) {
    console.error('Failed to log Turnstile event:', error)
  }
}

/**
 * Get client IP address
 */
function getClientIP(c: Context): string {
  return (
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For') ||
    c.req.header('X-Real-IP') ||
    'unknown'
  )
}

/**
 * Generate request ID
 */
function generateRequestId(): string {
  return crypto.randomUUID()
}

// Preset configurations
export const TurnstilePresets = {
  // Low protection for public endpoints
  LOW_PROTECTION: {
    protectionLevel: 'low' as const,
    scoreThreshold: { low: 0.1, medium: 0.3, high: 0.5 },
    ipBasedValidation: true,
    userAgentBasedValidation: false,
    sessionBasedValidation: false,
  },

  // Medium protection for general API endpoints
  MEDIUM_PROTECTION: {
    protectionLevel: 'medium' as const,
    scoreThreshold: { low: 0.3, medium: 0.5, high: 0.7 },
    ipBasedValidation: true,
    userAgentBasedValidation: true,
    sessionBasedValidation: false,
  },

  // High protection for sensitive endpoints
  HIGH_PROTECTION: {
    protectionLevel: 'high' as const,
    scoreThreshold: { low: 0.5, medium: 0.7, high: 0.9 },
    ipBasedValidation: true,
    userAgentBasedValidation: true,
    sessionBasedValidation: true,
    cachingEnabled: false,
  },

  // Maximum protection for critical endpoints
  MAXIMUM_PROTECTION: {
    protectionLevel: 'high' as const,
    scoreThreshold: { low: 0.7, medium: 0.8, high: 0.95 },
    ipBasedValidation: true,
    userAgentBasedValidation: true,
    sessionBasedValidation: true,
    cachingEnabled: false,
    timeout: 3000,
    retryAttempts: 1,
  },
}

// Middleware factory functions
export const createLowProtection = (customConfig?: Partial<TurnstileMiddlewareOptions>) => {
  return turnstileMiddleware({
    ...TurnstilePresets.LOW_PROTECTION,
    ...customConfig,
  })
}

export const createMediumProtection = (customConfig?: Partial<TurnstileMiddlewareOptions>) => {
  return turnstileMiddleware({
    ...TurnstilePresets.MEDIUM_PROTECTION,
    ...customConfig,
  })
}

export const createHighProtection = (customConfig?: Partial<TurnstileMiddlewareOptions>) => {
  return turnstileMiddleware({
    ...TurnstilePresets.HIGH_PROTECTION,
    ...customConfig,
  })
}

export const createMaximumProtection = (customConfig?: Partial<TurnstileMiddlewareOptions>) => {
  return turnstileMiddleware({
    ...TurnstilePresets.MAXIMUM_PROTECTION,
    ...customConfig,
  })
}

// Helper functions
export const getTurnstileContext = (c: Context): TurnstileContext | undefined => {
  return c.get('turnstile')
}

export const isBotDetected = (c: Context): boolean => {
  const turnstile = c.get('turnstile') as TurnstileContext
  return turnstile?.botDetection?.isBot || false
}

export const getBotRiskScore = (c: Context): number => {
  const turnstile = c.get('turnstile') as TurnstileContext
  return turnstile?.botDetection?.riskScore || 0
}

export const requireTurnstile = (action?: string) => {
  return turnstileMiddleware({
    required: true,
    action,
    ...TurnstilePresets.MEDIUM_PROTECTION,
  })
}

export const optionalTurnstile = (action?: string) => {
  return turnstileMiddleware({
    required: false,
    action,
    ...TurnstilePresets.LOW_PROTECTION,
  })
}

export default turnstileMiddleware
