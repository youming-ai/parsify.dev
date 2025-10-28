/**
 * A/B 测试和特性开关系统
 * 提供功能开关、A/B 测试和渐进式发布功能
 */

import { logger } from '@shared/utils'

// 实验配置接口
export interface ExperimentConfig {
  id: string
  name: string
  description: string
  type: 'feature_flag' | 'ab_test' | 'canary'
  status: 'draft' | 'running' | 'paused' | 'completed'
  trafficAllocation: number // 0-100
  variants: ExperimentVariant[]
  targeting?: TargetingRules
  metrics?: string[]
  startTime: Date
  endTime?: Date
  owner?: string
  tags: string[]
}

// 实验变体
export interface ExperimentVariant {
  id: string
  name: string
  description: string
  weight: number // 0-100
  config: Record<string, unknown>
  isActive: boolean
}

// 目标规则
export interface TargetingRules {
  users?: {
    include?: string[] // 用户ID
    exclude?: string[]
    percentage?: number // 用户百分比
  }
  properties?: Record<string, {
    include?: unknown[]
    exclude?: unknown[]
  }>
  geography?: {
    countries?: string[]
    regions?: string[]
    cities?: string[]
  }
  device?: {
    platforms?: string[]
    browsers?: string[]
    versions?: string[]
  }
  custom?: Record<string, (context: UserContext) => boolean>
}

// 用户上下文
export interface UserContext {
  userId: string
  sessionId?: string
  properties?: Record<string, unknown>
  geography?: {
    country?: string
    region?: string
    city?: string
  }
  device?: {
    platform?: string
    browser?: string
    version?: string
    userAgent?: string
  }
  timestamp: number
}

// 实验结果
export interface ExperimentResult {
  experimentId: string
  variantId: string
  userId: string
  timestamp: number
  exposure: boolean
  converted?: boolean
  conversionValue?: number
  customMetrics?: Record<string, number>
}

// 实验统计
export interface ExperimentStats {
  experimentId: string
  totalUsers: number
  variantStats: Record<string, {
    users: number
    conversions: number
    conversionRate: number
    averageValue?: number
    confidence?: {
      conversionRate?: number
      averageValue?: number
    }
  }>
  significance?: {
    pValue?: number
    confidenceLevel?: number
    winner?: string
    recommended?: boolean
  }
}

class FeatureFlagService {
  private experiments: Map<string, ExperimentConfig> = new Map()
  private userAssignments: Map<string, Map<string, string>> = new Map() // userId -> experimentId -> variantId
  private results: ExperimentResult[] = []
  private cache: Map<string, { result: string; expires: number }> = new Map()

  constructor(
    private storage?: {
      get: (key: string) => Promise<string | null>
      set: (key: string, value: string, ttl?: number) => Promise<void>
      delete: (key: string) => Promise<void>
    }
  ) {
    // 定期清理缓存
    setInterval(() => this.cleanupCache(), 60000) // 每分钟清理一次
  }

  // 创建实验
  createExperiment(config: ExperimentConfig): ExperimentConfig {
    // 验证配置
    this.validateExperimentConfig(config)

    // 检查流量分配总和
    const totalWeight = config.variants.reduce((sum, variant) => sum + variant.weight, 0)
    if (totalWeight !== 100) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`)
    }

    this.experiments.set(config.id, config)

    logger.info('Experiment created', {
      experimentId: config.id,
      name: config.name,
      type: config.type,
      trafficAllocation: config.trafficAllocation
    })

    return config
  }

  // 更新实验
  updateExperiment(experimentId: string, updates: Partial<ExperimentConfig>): ExperimentConfig {
    const experiment = this.experiments.get(experimentId)
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`)
    }

    const updatedExperiment = { ...experiment, ...updates }

    // 如果流量分配或变体发生变化，清除用户分配
    if (updates.trafficAllocation || updates.variants) {
      this.clearUserAssignments(experimentId)
    }

    this.experiments.set(experimentId, updatedExperiment)

    logger.info('Experiment updated', {
      experimentId,
      updates: Object.keys(updates)
    })

    return updatedExperiment
  }

  // 删除实验
  deleteExperiment(experimentId: string): boolean {
    const deleted = this.experiments.delete(experimentId)
    if (deleted) {
      this.clearUserAssignments(experimentId)
      logger.info('Experiment deleted', { experimentId })
    }
    return deleted
  }

  // 获取实验配置
  getExperiment(experimentId: string): ExperimentConfig | undefined {
    return this.experiments.get(experimentId)
  }

  // 获取所有实验
  getExperiments(filters?: {
    type?: ExperimentConfig['type']
    status?: ExperimentConfig['status']
    tags?: string[]
  }): ExperimentConfig[] {
    let experiments = Array.from(this.experiments.values())

    if (filters) {
      experiments = experiments.filter(exp => {
        if (filters.type && exp.type !== filters.type) return false
        if (filters.status && exp.status !== filters.status) return false
        if (filters.tags && !filters.tags.some(tag => exp.tags.includes(tag))) return false
        return true
      })
    }

    return experiments.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  }

  // 用户分配变体
  async assignVariant(experimentId: string, userContext: UserContext): Promise<string | null> {
    const experiment = this.experiments.get(experimentId)
    if (!experiment) {
      return null
    }

    // 检查实验状态
    if (experiment.status !== 'running') {
      return null
    }

    // 检查实验时间
    const now = new Date()
    if (experiment.startTime > now || (experiment.endTime && experiment.endTime < now)) {
      return null
    }

    // 检查用户是否在目标中
    if (!this.isUserInTarget(userContext, experiment.targeting)) {
      return null
    }

    // 检查缓存
    const cacheKey = `${experimentId}:${userContext.userId}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > now.getTime()) {
      return cached.result
    }

    // 检查是否已有分配
    const userAssignments = this.userAssignments.get(userContext.userId)
    if (userAssignments && userAssignments.has(experimentId)) {
      const variantId = userAssignments.get(experimentId)!

      // 验证变体是否仍然活跃
      const variant = experiment.variants.find(v => v.id === variantId)
      if (variant && variant.isActive) {
        this.cache.set(cacheKey, {
          result: variantId,
          expires: now.getTime() + 300000 // 5分钟缓存
        })
        return variantId
      }
    }

    // 分配新变体
    const variantId = this.selectVariant(experiment, userContext)

    if (variantId) {
      // 保存用户分配
      if (!userAssignments) {
        this.userAssignments.set(userContext.userId, new Map())
      }
      userAssignments.set(experimentId, variantId)

      // 缓存结果
      this.cache.set(cacheKey, {
        result: variantId,
        expires: now.getTime() + 300000
      })

      // 记录曝光
      this.recordExposure(experimentId, variantId, userContext)
    }

    return variantId
  }

  // 获取用户的所有实验结果
  getUserVariants(userId: string): Record<string, string> {
    const userAssignments = this.userAssignments.get(userId)
    if (!userAssignments) {
      return {}
    }

    return Object.fromEntries(userAssignments.entries())
  }

  // 获取变体配置
  getVariantConfig(experimentId: string, variantId: string): Record<string, unknown> | null {
    const experiment = this.experiments.get(experimentId)
    if (!experiment) {
      return null
    }

    const variant = experiment.variants.find(v => v.id === variantId)
    return variant?.config || null
  }

  // 记录转换事件
  recordConversion(
    experimentId: string,
    userId: string,
    value?: number,
    customMetrics?: Record<string, number>
  ): void {
    const userAssignments = this.userAssignments.get(userId)
    if (!userAssignments || !userAssignments.has(experimentId)) {
      logger.warn('Conversion recorded for unassigned user', { experimentId, userId })
      return
    }

    const variantId = userAssignments.get(experimentId)!

    const result: ExperimentResult = {
      experimentId,
      variantId,
      userId,
      timestamp: Date.now(),
      exposure: true,
      converted: true,
      conversionValue: value,
      customMetrics
    }

    this.results.push(result)

    // 保持结果在合理范围内
    if (this.results.length > 100000) {
      this.results = this.results.slice(-100000)
    }

    logger.debug('Conversion recorded', {
      experimentId,
      variantId,
      userId,
      value,
      customMetrics
    })
  }

  // 获取实验统计
  getExperimentStats(experimentId: string, timeRange?: { start: Date; end: Date }): ExperimentStats {
    const experiment = this.experiments.get(experimentId)
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`)
    }

    let relevantResults = this.results.filter(r => r.experimentId === experimentId)

    if (timeRange) {
      relevantResults = relevantResults.filter(
        r => r.timestamp >= timeRange.start.getTime() && r.timestamp <= timeRange.end.getTime()
      )
    }

    // 按变体分组统计
    const variantStats: Record<string, {
      users: number
      conversions: number
      conversionRate: number
      averageValue?: number
    }> = {}

    // 转化值总和
    const valueSums: Record<string, number> = {}

    for (const variant of experiment.variants) {
      const variantResults = relevantResults.filter(r => r.variantId === variant.id)

      variantStats[variant.id] = {
        users: variantResults.length,
        conversions: variantResults.filter(r => r.converted).length,
        conversionRate: 0,
        averageValue: 0
      }

      const conversions = variantResults.filter(r => r.converted && r.conversionValue !== undefined)
      if (conversions.length > 0) {
        valueSums[variant.id] = conversions.reduce((sum, r) => sum + (r.conversionValue || 0), 0)
        variantStats[variant.id].averageValue = valueSums[variant.id] / conversions.length
        variantStats[variant.id].conversionRate = conversions.length / variantResults.length
      }
    }

    const totalUsers = Object.values(variantStats).reduce((sum, stats) => sum + stats.users, 0)

    return {
      experimentId,
      totalUsers,
      variantStats,
      significance: this.calculateSignificance(variantStats)
    }
  }

  // 获取所有实验统计
  getAllStats(timeRange?: { start: Date; end: Date }): Record<string, ExperimentStats> {
    const stats: Record<string, ExperimentStats> = {}

    for (const experimentId of this.experiments.keys()) {
      try {
        stats[experimentId] = this.getExperimentStats(experimentId, timeRange)
      } catch (error) {
        logger.error('Failed to get experiment stats', { experimentId, error: (error as Error).message })
      }
    }

    return stats
  }

  // 私有方法
  private validateExperimentConfig(config: ExperimentConfig): void {
    if (!config.id || !config.name) {
      throw new Error('Experiment ID and name are required')
    }

    if (!config.variants || config.variants.length === 0) {
      throw new Error('At least one variant is required')
    }

    if (config.trafficAllocation < 0 || config.trafficAllocation > 100) {
      throw new Error('Traffic allocation must be between 0 and 100')
    }

    if (config.variants.some(v => !v.id || !v.name)) {
      throw new Error('All variants must have ID and name')
    }
  }

  private selectVariant(experiment: ExperimentConfig, userContext: UserContext): string | null {
    // 检查流量分配
    if (Math.random() * 100 > experiment.trafficAllocation) {
      return null
    }

    // 基于权重选择变体
    const random = Math.random() * 100
    let cumulativeWeight = 0

    for (const variant of experiment.variants) {
      if (!variant.isActive) continue

      cumulativeWeight += variant.weight
      if (random < cumulativeWeight) {
        return variant.id
      }
    }

    return null
  }

  private isUserInTarget(userContext: UserContext, targeting?: TargetingRules): boolean {
    if (!targeting) return true

    // 检查用户ID
    if (targeting.users) {
      if (targeting.users.include && !targeting.users.include.includes(userContext.userId)) {
        return false
      }
      if (targeting.users.exclude && targeting.users.exclude.includes(userContext.userId)) {
        return false
      }
      if (targeting.users.percentage !== undefined) {
        const hash = this.hashString(userContext.userId)
        if (hash % 100 >= targeting.users.percentage) {
          return false
        }
      }
    }

    // 检查地理位置
    if (targeting.geography) {
      if (targeting.geography.countries && userContext.geography?.country) {
        if (!targeting.geography.countries.includes(userContext.geography.country)) {
          return false
        }
      }
    }

    // 检查设备
    if (targeting.device) {
      if (targeting.device.platforms && userContext.device?.platform) {
        if (!targeting.device.platforms.includes(userContext.device.platform)) {
          return false
        }
      }
    }

    // 检查自定义规则
    if (targeting.custom) {
      for (const [key, rule] of Object.entries(targeting.custom)) {
        if (!rule(userContext)) {
          return false
        }
      }
    }

    return true
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private recordExposure(experimentId: string, variantId: string, userContext: UserContext): void {
    const result: ExperimentResult = {
      experimentId,
      variantId,
      userId: userContext.userId,
      timestamp: Date.now(),
      exposure: true,
      converted: false
    }

    this.results.push(result)
  }

  private clearUserAssignments(experimentId: string): void {
    for (const [userId, assignments] of this.userAssignments.entries()) {
      assignments.delete(experimentId)
    }
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key)
      }
    }
  }

  private calculateSignificance(
    variantStats: Record<string, { users: number; conversions: number; conversionRate: number }>
  ): ExperimentStats['significance'] {
    // 简化的显著性计算
    // 实际应该使用更复杂的统计方法（如卡方检验）
    const variants = Object.entries(variantStats)
    if (variants.length < 2) {
      return {}
    }

    const [control, ...treatments] = variants.sort((a, b) => b[1].users - a[1].users)
    const [controlId, controlStats] = control

    let bestPValue = 1
    let winner = ''

    for (const [variantId, stats] of treatments) {
      if (stats.users < 10 || controlStats.users < 10) continue

      // 简化的 A/B 测试显著性计算
      const p1 = controlStats.conversionRate
      const p2 = stats.conversionRate
      const n1 = controlStats.users
      const n2 = stats.users

      // Z-score 计算
      const pooledRate = (p1 * n1 + p2 * n2) / (n1 + n2)
      const pooledSE = Math.sqrt(
        (p1 * (1 - p1) / n1) + (p2 * (1 - p2) / n2))
      const zScore = (p2 - p1) / pooledSE

      // 计算 p-value
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)))

      if (pValue < bestPValue) {
        bestPValue = pValue
        winner = variantId
      }
    }

    return {
      pValue: bestPValue,
      confidenceLevel: 0.95,
      winner: bestPValue < 0.05 ? winner : undefined,
      recommended: bestPValue < 0.1
    }
  }

  private normalCDF(x: number): number {
    // 简化的正态分布累积分布函数近似
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }

  private erf(x: number): number {
    // 简化的误差函数近似
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const t2 = t * t
    const t3 = t2 * t
    const t4 = t3 * t
    const t5 = t4 * t

    const y = 1 - (((((a5 * t5 + a4 * t4 + a3 * t3) + a2 * t2 + a1 * t) * Math.exp(-x * x)) / Math.sqrt(2 * Math.PI))

    return sign * y
  }
}

// 工厂函数
export function createFeatureFlagService(
  storage?: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string, ttl?: number) => Promise<void>
    delete: (key: string) => Promise<void>
  }
): FeatureFlagService {
  return new FeatureFlagService(storage)
}

// 预定义的实验配置
export const DEFAULT_EXPERIMENTS: ExperimentConfig[] = [
  {
    id: 'new-ui-design',
    name: 'New UI Design',
    description: 'Test new user interface design',
    type: 'ab_test',
    status: 'running',
    trafficAllocation: 50,
    variants: [
      {
        id: 'control',
        name: 'Current UI',
        description: 'Existing user interface',
        weight: 50,
        config: { theme: 'current', layout: 'sidebar' },
        isActive: true
      },
      {
        id: 'variant',
        name: 'New UI',
        description: 'Redesigned user interface',
        weight: 50,
        config: { theme: 'modern', layout: 'topbar' },
        isActive: true
      }
    ],
    startTime: new Date(),
    owner: 'product-team',
    tags: ['ui', 'frontend']
  },
  {
    id: 'enhanced-code-editor',
    name: 'Enhanced Code Editor',
    description: 'Test enhanced code editor features',
    type: 'feature_flag',
    status: 'running',
    trafficAllocation: 20,
    variants: [
      {
        id: 'enabled',
        name: 'Enhanced Editor',
        description: 'Code editor with enhanced features',
        weight: 100,
        config: {
          enhancedSyntax: true,
          autocomplete: true,
          snippets: true
        },
        isActive: true
      }
    ],
    startTime: new Date(),
    owner: 'engineering',
    tags: ['editor', 'feature']
  }
]
