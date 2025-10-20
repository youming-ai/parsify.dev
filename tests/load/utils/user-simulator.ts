/**
 * User Simulation Utilities for Load Testing
 * Simulates realistic user behavior patterns
 */

import {
  LoadTestUser,
  UserBehavior,
  USER_BEHAVIOR_PATTERNS,
} from '../config/load-test-config'
import { TestDataGenerator } from '../../performance/utils/endpoint-configs'

export class UserSimulator {
  private users: Map<string, LoadTestUser> = new Map()
  private userSessions: Map<string, UserSession> = new Map()

  /**
   * Generate a pool of simulated users
   */
  generateUsers(
    count: number,
    behaviorPattern: keyof typeof USER_BEHAVIOR_PATTERNS
  ): LoadTestUser[] {
    const behavior = USER_BEHAVIOR_PATTERNS[behaviorPattern]
    const users: LoadTestUser[] = []

    for (let i = 0; i < count; i++) {
      const user: LoadTestUser = {
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
        profile: {
          name: `Test User ${i + 1}`,
          preferences: {
            theme: Math.random() > 0.5 ? 'light' : 'dark',
            language: 'en',
            autoSave: Math.random() > 0.3,
          },
        },
        behavior: {
          ...behavior,
          // Add some randomness to behavior patterns
          toolsUsage: Object.fromEntries(
            Object.entries(behavior.toolsUsage).map(([tool, frequency]) => [
              tool,
              Math.max(
                0.1,
                Math.min(1.0, frequency + (Math.random() - 0.5) * 0.2)
              ),
            ])
          ),
          sessionDuration:
            behavior.sessionDuration * (0.8 + Math.random() * 0.4), // ±20% variation
          requestInterval:
            behavior.requestInterval * (0.7 + Math.random() * 0.6), // ±30% variation
        },
      }

      users.push(user)
      this.users.set(user.id, user)
    }

    return users
  }

  /**
   * Create a user session that simulates realistic user behavior
   */
  createSession(user: LoadTestUser): UserSession {
    const session = new UserSession(user)
    this.userSessions.set(user.id, session)
    return session
  }

  /**
   * Get all active user sessions
   */
  getActiveSessions(): UserSession[] {
    return Array.from(this.userSessions.values()).filter(session =>
      session.isActive()
    )
  }

  /**
   * Stop all user sessions
   */
  stopAllSessions(): void {
    for (const session of this.userSessions.values()) {
      session.stop()
    }
    this.userSessions.clear()
  }
}

/**
 * Individual user session that simulates realistic behavior
 */
export class UserSession {
  private user: LoadTestUser
  private isActiveSession = false
  private sessionStartTime = 0
  private lastActionTime = 0
  private actionQueue: Promise<any>[] = []
  private sessionMetrics: UserSessionMetrics = {
    actions: [],
    errors: [],
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    sessionDuration: 0,
  }

  constructor(user: LoadTestUser) {
    this.user = user
  }

  /**
   * Start the user session
   */
  async start(baseUrl: string, duration: number): Promise<UserSessionMetrics> {
    this.isActiveSession = true
    this.sessionStartTime = Date.now()
    this.lastActionTime = this.sessionStartTime

    console.log(
      `Starting user session for ${this.user.id} (${this.user.profile.name})`
    )

    // Simulate user login
    await this.simulateAuthentication(baseUrl)

    // Main user behavior loop
    const endTime = this.sessionStartTime + duration

    while (this.isActiveSession && Date.now() < endTime) {
      try {
        await this.simulateUserAction(baseUrl)
        await this.waitForNextAction()
      } catch (error) {
        this.recordError('session_error', error)
        // Continue session even if individual actions fail
      }
    }

    this.sessionMetrics.sessionDuration = Date.now() - this.sessionStartTime
    this.isActiveSession = false

    console.log(
      `User session ended for ${this.user.id}: ${this.sessionMetrics.totalRequests} requests, ${this.sessionMetrics.successfulRequests} successful`
    )

    return this.sessionMetrics
  }

  /**
   * Stop the user session
   */
  stop(): void {
    this.isActiveSession = false
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.isActiveSession
  }

  /**
   * Get session metrics
   */
  getMetrics(): UserSessionMetrics {
    return { ...this.sessionMetrics }
  }

  /**
   * Simulate user authentication flow
   */
  private async simulateAuthentication(baseUrl: string): Promise<void> {
    const startTime = Date.now()

    try {
      // Simulate login request
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.user.email,
          password: 'test-password',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        this.user.authToken = data.token
        this.user.sessionId = data.sessionId

        this.recordAction('login', Date.now() - startTime, true)
      } else {
        throw new Error(`Authentication failed: ${response.status}`)
      }
    } catch (error) {
      this.recordError('authentication', error)
      throw error
    }
  }

  /**
   * Simulate a single user action based on behavior patterns
   */
  private async simulateUserAction(baseUrl: string): Promise<void> {
    const action = this.selectNextAction()
    if (!action) return

    const startTime = Date.now()
    this.sessionMetrics.totalRequests++

    try {
      await this.executeAction(action, baseUrl)
      const responseTime = Date.now() - startTime
      this.recordAction(action.type, responseTime, true)
      this.sessionMetrics.successfulRequests++
    } catch (error) {
      this.recordError(action.type, error)
      this.sessionMetrics.failedRequests++
    }
  }

  /**
   * Select the next action based on user behavior patterns
   */
  private selectNextAction(): UserAction | null {
    const rand = Math.random()
    const behavior = this.user.behavior

    // Tool usage actions
    if (rand < 0.7) {
      // 70% chance of tool usage
      const tools = [
        { type: 'json_format', weight: behavior.toolsUsage.jsonFormat },
        { type: 'json_validate', weight: behavior.toolsUsage.jsonValidate },
        { type: 'json_convert', weight: behavior.toolsUsage.jsonConvert },
        { type: 'code_format', weight: behavior.toolsUsage.codeFormat },
        { type: 'code_execute', weight: behavior.toolsUsage.codeExecute },
      ]

      const totalWeight = tools.reduce((sum, tool) => sum + tool.weight, 0)
      let currentWeight = 0

      for (const tool of tools) {
        currentWeight += tool.weight
        if (rand * 0.7 < currentWeight) {
          return { type: tool.type, endpoint: this.getToolEndpoint(tool.type) }
        }
      }
    }

    // File operations
    if (rand < 0.9) {
      // Additional 20% chance of file operations
      if (Math.random() < 0.4) {
        return { type: 'file_upload', endpoint: '/upload/sign' }
      } else {
        return { type: 'file_download', endpoint: '/upload/status/' }
      }
    }

    // Profile operations
    if (rand < 0.95) {
      // Additional 5% chance of profile operations
      return { type: 'profile_view', endpoint: '/users/profile' }
    }

    // Health check
    return { type: 'health_check', endpoint: '/health' }
  }

  /**
   * Get endpoint for tool actions
   */
  private getToolEndpoint(toolType: string): string {
    const endpoints: Record<string, string> = {
      json_format: '/tools/json/format',
      json_validate: '/tools/json/validate',
      json_convert: '/tools/json/convert',
      code_format: '/tools/code/format',
      code_execute: '/tools/code/execute',
    }
    return endpoints[toolType] || '/tools'
  }

  /**
   * Execute a specific user action
   */
  private async executeAction(
    action: UserAction,
    baseUrl: string
  ): Promise<void> {
    const url = `${baseUrl}${action.endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.user.authToken) {
      headers['Authorization'] = `Bearer ${this.user.authToken}`
    }

    let body: any

    switch (action.type) {
      case 'json_format':
        body = {
          json: TestDataGenerator.generateJsonData('medium'),
          indent: 2,
          sort_keys: Math.random() > 0.5,
        }
        break

      case 'json_validate':
        body = {
          json: TestDataGenerator.generateJsonData('small'),
        }
        break

      case 'json_convert':
        body = {
          json: TestDataGenerator.generateJsonData('small'),
          target_format: Math.random() > 0.5 ? 'csv' : 'xml',
        }
        break

      case 'code_format':
        body = {
          code: TestDataGenerator.generateCodeSamples('javascript'),
          language: 'javascript',
        }
        break

      case 'code_execute':
        body = {
          code: 'console.log("Hello, World!");',
          language: 'javascript',
        }
        break

      case 'file_upload':
        body = TestDataGenerator.generateUploadData(
          `file-${Date.now()}.json`,
          this.getFileSizeForUser()
        )
        break

      default:
        body = undefined
    }

    const method = body ? 'POST' : 'GET'

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok && response.status !== 401) {
      // 401 might be expected for some endpoints
      throw new Error(
        `Action failed: ${response.status} ${response.statusText}`
      )
    }

    // Process response if needed
    if (action.type === 'file_upload' && response.ok) {
      const uploadData = await response.json()
      // Simulate file upload confirmation
      if (uploadData.uploadId) {
        await fetch(`${baseUrl}/upload/confirm/${uploadData.uploadId}`, {
          method: 'POST',
          headers,
        })
      }
    }
  }

  /**
   * Get appropriate file size for user based on behavior
   */
  private getFileSizeForUser(): number {
    const sizeConfig = this.user.behavior.fileOperations.size
    const configs = {
      small: { min: 1024, max: 10240 },
      medium: { min: 10240, max: 1048576 },
      large: { min: 1048576, max: 5242880 },
    }
    const config = configs[sizeConfig]
    return Math.floor(config.min + Math.random() * (config.max - config.min))
  }

  /**
   * Wait for the next action based on user behavior
   */
  private async waitForNextAction(): Promise<void> {
    const interval = this.user.behavior.requestInterval * 1000 // Convert to milliseconds
    const variation = interval * 0.3 // 30% variation
    const waitTime = interval + (Math.random() - 0.5) * variation * 2

    await new Promise(resolve => setTimeout(resolve, waitTime))
    this.lastActionTime = Date.now()
  }

  /**
   * Record a user action
   */
  private recordAction(
    type: string,
    responseTime: number,
    success: boolean
  ): void {
    this.sessionMetrics.actions.push({
      type,
      responseTime,
      success,
      timestamp: Date.now() - this.sessionStartTime,
    })
  }

  /**
   * Record an error
   */
  private recordError(type: string, error: any): void {
    this.sessionMetrics.errors.push({
      type,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now() - this.sessionStartTime,
    })
  }
}

/**
 * Types for user simulation
 */
interface UserAction {
  type: string
  endpoint: string
}

interface UserSessionMetrics {
  actions: Array<{
    type: string
    responseTime: number
    success: boolean
    timestamp: number
  }>
  errors: Array<{
    type: string
    error: string
    timestamp: number
  }>
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  sessionDuration: number
}

/**
 * User behavior analytics
 */
export class BehaviorAnalyzer {
  /**
   * Analyze user behavior patterns from session metrics
   */
  static analyzeBehavior(sessions: UserSession[]): BehaviorAnalysis {
    const allActions = sessions.flatMap(session => session.getMetrics().actions)
    const allErrors = sessions.flatMap(session => session.getMetrics().errors)

    // Action frequency analysis
    const actionCounts = new Map<string, number>()
    const actionResponseTimes = new Map<string, number[]>()

    for (const action of allActions) {
      actionCounts.set(action.type, (actionCounts.get(action.type) || 0) + 1)

      if (!actionResponseTimes.has(action.type)) {
        actionResponseTimes.set(action.type, [])
      }
      actionResponseTimes.get(action.type)!.push(action.responseTime)
    }

    // Calculate statistics
    const actionStats: Record<string, ActionStats> = {}
    for (const [actionType, count] of actionCounts.entries()) {
      const responseTimes = actionResponseTimes.get(actionType) || []
      responseTimes.sort((a, b) => a - b)

      actionStats[actionType] = {
        count,
        frequency: count / allActions.length,
        averageResponseTime:
          responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length,
        p95ResponseTime:
          responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        successRate:
          allActions.filter(a => a.type === actionType && a.success).length /
          count,
      }
    }

    // Error analysis
    const errorCounts = new Map<string, number>()
    for (const error of allErrors) {
      errorCounts.set(error.type, (errorCounts.get(error.type) || 0) + 1)
    }

    return {
      totalActions: allActions.length,
      totalErrors: allErrors.length,
      actionStats,
      errorStats: Object.fromEntries(errorCounts),
      sessionStats: {
        averageDuration:
          sessions.reduce(
            (sum, session) => sum + session.getMetrics().sessionDuration,
            0
          ) / sessions.length,
        averageRequests:
          sessions.reduce(
            (sum, session) => sum + session.getMetrics().totalRequests,
            0
          ) / sessions.length,
        successRate:
          sessions.reduce(
            (sum, session) =>
              sum +
              session.getMetrics().successfulRequests /
                session.getMetrics().totalRequests,
            0
          ) / sessions.length,
      },
    }
  }
}

interface BehaviorAnalysis {
  totalActions: number
  totalErrors: number
  actionStats: Record<string, ActionStats>
  errorStats: Record<string, number>
  sessionStats: {
    averageDuration: number
    averageRequests: number
    successRate: number
  }
}

interface ActionStats {
  count: number
  frequency: number
  averageResponseTime: number
  p95ResponseTime: number
  successRate: number
}
