/**
 * Budget Optimization Engine
 * Generates intelligent optimization recommendations for performance budget compliance
 * Analyzes bundle data, code patterns, and usage to provide actionable insights
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface OptimizationContext {
  buildId: string;
  timestamp: Date;
  bundleSize: number;
  compressedSize: number;
  metrics: Record<string, number>;
  violations: string[];
  dependencies: DependencyInfo[];
  assets: AssetInfo[];
  chunks: ChunkInfo[];
  usage: UsageData;
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  used: boolean;
  usagePercentage?: number;
  canBeLazyLoaded?: boolean;
  alternatives?: string[];
  category: 'production' | 'development' | 'peer';
}

interface AssetInfo {
  name: string;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  size: number;
  optimized: boolean;
  canBeOptimized: boolean;
  optimizationPotential: number; // percentage
  lazyLoadable: boolean;
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: number;
  dependencies: string[];
  canBeSplit: boolean;
  splitPotential: number; // percentage
}

interface UsageData {
  features: Record<string, number>; // feature name -> usage percentage
  routes: Record<string, number>; // route -> visit percentage
  components: Record<string, number>; // component -> render percentage
  apis: Record<string, number>; // API endpoint -> call percentage
}

interface OptimizationRecommendation {
  id: string;
  type: 'bundle' | 'dependency' | 'code' | 'asset' | 'architecture' | 'process';
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  problem: string;
  solution: string;
  implementation: ImplementationStep[];
  impact: {
    sizeSavings: number; // bytes
    performanceGain: number; // milliseconds
    budgetImprovement: number; // percentage
    riskLevel: 'low' | 'medium' | 'high';
  };
  effort: {
    estimatedTime: number; // hours
    complexity: 'low' | 'medium' | 'high';
    dependencies: string[];
    requiredSkills: string[];
  };
  automation: {
    automatable: boolean;
    automatedSteps: string[];
    manualSteps: string[];
  };
  evidence: EvidenceItem[];
  references: string[];
  tags: string[];
}

interface ImplementationStep {
  id: string;
  title: string;
  description: string;
  command?: string;
  code?: string;
  files?: string[];
  verification: string;
}

interface EvidenceItem {
  type: 'metric' | 'code' | 'dependency' | 'asset' | 'usage';
  description: string;
  data: any;
  confidence: number; // 0-1
}

interface OptimizationPlan {
  id: string;
  timestamp: Date;
  context: OptimizationContext;
  recommendations: OptimizationRecommendation[];
  phases: OptimizationPhase[];
  summary: PlanSummary;
  automationPotential: number; // percentage
  estimatedROI: number; // estimated return on investment
}

interface OptimizationPhase {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  recommendations: string[]; // recommendation IDs
  dependencies: string[]; // other phase IDs
  deliverables: string[];
  successCriteria: string[];
}

interface PlanSummary {
  totalRecommendations: number;
  criticalRecommendations: number;
  estimatedSizeSavings: number;
  estimatedPerformanceGain: number;
  totalEffort: number; // hours
  automationPotential: number;
  riskAssessment: 'low' | 'medium' | 'high';
  quickWins: number;
}

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: OptimizationRecommendation['type'];
  priority: OptimizationRecommendation['priority'];
  conditions: RuleCondition[];
  recommendation: Partial<OptimizationRecommendation>;
  confidence: number;
}

interface RuleCondition {
  field: keyof OptimizationContext;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not-contains';
  value: any;
  weight?: number;
}

interface OptimizationEngineConfig {
  enabled: boolean;
  rules: OptimizationRule[];
  context: {
    includeUsageData: boolean;
    analyzeDependencies: boolean;
    scanAssets: boolean;
    analyzeCodePatterns: boolean;
  };
  recommendations: {
    maxRecommendations: number;
    minConfidence: number;
    includeLowPriority: boolean;
    groupSimilar: boolean;
    sortByImpact: boolean;
  };
  automation: {
    enableAutomatedAnalysis: boolean;
    autoApplySafeOptimizations: boolean;
    maxRiskLevel: 'low' | 'medium' | 'high';
  };
  learning: {
    enableMLRecommendations: boolean;
    trackRecommendationOutcomes: boolean;
    adaptWeights: boolean;
  };
}

export class BudgetOptimizationEngine extends EventEmitter {
  private static instance: BudgetOptimizationEngine;
  private config: OptimizationEngineConfig;
  private rules: Map<string, OptimizationRule> = new Map();
  private recommendationHistory: Map<string, {
    recommendation: OptimizationRecommendation;
    outcome: 'successful' | 'partial' | 'failed' | 'pending';
    timestamp: Date;
    feedback?: string;
  }> = new Map();

  private constructor() {
    super();
    this.config = this.getDefaultConfig();
    this.initializeRules();
    this.loadRecommendationHistory();
  }

  public static getInstance(): BudgetOptimizationEngine {
    if (!BudgetOptimizationEngine.instance) {
      BudgetOptimizationEngine.instance = new BudgetOptimizationEngine();
    }
    return BudgetOptimizationEngine.instance;
  }

  private getDefaultConfig(): OptimizationEngineConfig {
    return {
      enabled: true,
      rules: [],
      context: {
        includeUsageData: true,
        analyzeDependencies: true,
        scanAssets: true,
        analyzeCodePatterns: true,
      },
      recommendations: {
        maxRecommendations: 20,
        minConfidence: 0.6,
        includeLowPriority: false,
        groupSimilar: true,
        sortByImpact: true,
      },
      automation: {
        enableAutomatedAnalysis: true,
        autoApplySafeOptimizations: false,
        maxRiskLevel: 'low',
      },
      learning: {
        enableMLRecommendations: false, // Disabled by default
        trackRecommendationOutcomes: true,
        adaptWeights: true,
      },
    };
  }

  /**
   * Initialize optimization rules
   */
  private initializeRules(): void {
    this.config.rules = [
      // Bundle size rules
      {
        id: 'large-bundle-size',
        name: 'Large Bundle Size',
        description: 'Detects oversized bundles and recommends optimization',
        enabled: true,
        category: 'bundle',
        priority: 'high',
        conditions: [
          { field: 'bundleSize', operator: 'gt', value: 500 * 1024 }, // 500KB
        ],
        recommendation: {
          type: 'bundle',
          category: 'immediate',
          title: 'Reduce Bundle Size',
          description: 'Bundle size exceeds optimal limits. Implement code splitting and optimization.',
          problem: 'Large bundle size increases initial load time and bandwidth usage.',
          solution: 'Implement code splitting, tree shaking, and remove unused dependencies.',
        },
        confidence: 0.9,
      },
      {
        id: 'unused-dependencies',
        name: 'Unused Dependencies',
        description: 'Identifies unused dependencies that can be removed',
        enabled: true,
        category: 'dependency',
        priority: 'medium',
        conditions: [
          { field: 'dependencies', operator: 'contains', value: { used: false } },
        ],
        recommendation: {
          type: 'dependency',
          category: 'short-term',
          title: 'Remove Unused Dependencies',
          description: 'Unused dependencies found that can be safely removed.',
          problem: 'Unused dependencies increase bundle size without providing value.',
          solution: 'Remove unused dependencies from package.json and imports.',
        },
        confidence: 0.8,
      },
      {
        id: 'unoptimized-assets',
        name: 'Unoptimized Assets',
        description: 'Identifies assets that can be optimized',
        enabled: true,
        category: 'asset',
        priority: 'medium',
        conditions: [
          { field: 'assets', operator: 'contains', value: { optimized: false, canBeOptimized: true } },
        ],
        recommendation: {
          type: 'asset',
          category: 'immediate',
          title: 'Optimize Assets',
          description: 'Assets found that can be optimized for better performance.',
          problem: 'Unoptimized assets increase load time and bandwidth usage.',
          solution: 'Compress images, optimize fonts, and minify assets.',
        },
        confidence: 0.7,
      },
      {
        id: 'large-chunks',
        name: 'Large Chunks',
        description: 'Identifies chunks that can be split further',
        enabled: true,
        category: 'bundle',
        priority: 'high',
        conditions: [
          { field: 'chunks', operator: 'contains', value: { canBeSplit: true, size: 100 * 1024 }, weight: 2 },
        ],
        recommendation: {
          type: 'bundle',
          category: 'short-term',
          title: 'Split Large Chunks',
          description: 'Large chunks identified that can be split for better loading performance.',
          problem: 'Large chunks block rendering and increase initial load time.',
          solution: 'Implement dynamic imports and route-based code splitting.',
        },
        confidence: 0.8,
      },
      {
        id: 'low-usage-features',
        name: 'Low Usage Features',
        description: 'Identifies features with low usage for lazy loading',
        enabled: true,
        category: 'code',
        priority: 'medium',
        conditions: [
          { field: 'usage', operator: 'contains', value: { features: { usagePercentage: 10 } } },
        ],
        recommendation: {
          type: 'code',
          category: 'long-term',
          title: 'Lazy Load Low-Usage Features',
          description: 'Features with low usage identified for lazy loading optimization.',
          problem: 'Low-usage features are loaded eagerly, increasing initial bundle size.',
          solution: 'Implement lazy loading for features with low usage patterns.',
        },
        confidence: 0.6,
      },
      {
        id: 'performance-violations',
        name: 'Performance Violations',
        description: 'Analyzes performance metric violations',
        enabled: true,
        category: 'code',
        priority: 'high',
        conditions: [
          { field: 'violations', operator: 'contains', value: 'performance' },
        ],
        recommendation: {
          type: 'code',
          category: 'immediate',
          title: 'Address Performance Violations',
          description: 'Performance metrics exceed acceptable thresholds.',
          problem: 'Performance violations indicate inefficient code or resource loading.',
          solution: 'Optimize algorithms, reduce blocking operations, and improve caching.',
        },
        confidence: 0.9,
      },
    ];

    // Load rules into map
    this.config.rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Load recommendation history
   */
  private loadRecommendationHistory(): void {
    try {
      const historyPath = '.budget-optimization/history.json';
      if (existsSync(historyPath)) {
        const data = JSON.parse(readFileSync(historyPath, 'utf-8'));

        Object.entries(data).forEach(([id, entry]: [string, any]) => {
          entry.recommendation.timestamp = new Date(entry.recommendation.timestamp);
          entry.timestamp = new Date(entry.timestamp);
          this.recommendationHistory.set(id, entry);
        });
      }
    } catch (error) {
      console.warn('Failed to load recommendation history:', error);
    }
  }

  /**
   * Save recommendation history
   */
  private saveRecommendationHistory(): void {
    try {
      mkdirSync('.budget-optimization', { recursive: true });

      const data = Object.fromEntries(this.recommendationHistory);
      writeFileSync('.budget-optimization/history.json', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save recommendation history:', error);
    }
  }

  /**
   * Generate optimization recommendations
   */
  public async generateRecommendations(context: OptimizationContext): Promise<OptimizationRecommendation[]> {
    if (!this.config.enabled) {
      return [];
    }

    const recommendations: OptimizationRecommendation[] = [];

    // Apply rules
    for (const rule of this.config.rules.filter(r => r.enabled)) {
      if (this.matchesRule(context, rule)) {
        const recommendation = this.applyRule(context, rule);
        if (recommendation && this.meetsConfidenceThreshold(recommendation)) {
          recommendations.push(recommendation);
        }
      }
    }

    // Generate advanced recommendations
    if (this.config.context.analyzeDependencies) {
      recommendations.push(...await this.analyzeDependencies(context));
    }

    if (this.config.context.scanAssets) {
      recommendations.push(...this.analyzeAssets(context));
    }

    if (this.config.context.analyzeCodePatterns) {
      recommendations.push(...this.analyzeCodePatterns(context));
    }

    if (this.config.context.includeUsageData) {
      recommendations.push(...this.analyzeUsagePatterns(context));
    }

    // Apply ML-based recommendations if enabled
    if (this.config.learning.enableMLRecommendations) {
      recommendations.push(...await this.generateMLRecommendations(context));
    }

    // Filter and sort recommendations
    return this.processRecommendations(recommendations);
  }

  /**
   * Check if context matches rule conditions
   */
  private matchesRule(context: OptimizationContext, rule: OptimizationRule): boolean {
    return rule.conditions.every(condition => {
      const fieldValue = (context as any)[condition.field];

      switch (condition.operator) {
        case 'gt':
          return typeof fieldValue === 'number' && fieldValue > condition.value;
        case 'gte':
          return typeof fieldValue === 'number' && fieldValue >= condition.value;
        case 'lt':
          return typeof fieldValue === 'number' && fieldValue < condition.value;
        case 'lte':
          return typeof fieldValue === 'number' && fieldValue <= condition.value;
        case 'eq':
          return fieldValue === condition.value;
        case 'contains':
          if (Array.isArray(fieldValue)) {
            return fieldValue.some(item => this.matchesCondition(item, condition.value));
          }
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            return this.matchesCondition(fieldValue, condition.value);
          }
          return false;
        case 'not-contains':
          if (Array.isArray(fieldValue)) {
            return !fieldValue.some(item => this.matchesCondition(item, condition.value));
          }
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            return !this.matchesCondition(fieldValue, condition.value);
          }
          return true;
        default:
          return false;
      }
    });
  }

  /**
   * Match nested condition
   */
  private matchesCondition(item: any, condition: any): boolean {
    if (typeof condition === 'object' && condition !== null) {
      return Object.entries(condition).every(([key, value]) => {
        return item[key] === value ||
               (typeof value === 'object' && this.matchesCondition(item[key], value));
      });
    }
    return item === condition;
  }

  /**
   * Apply rule to generate recommendation
   */
  private applyRule(context: OptimizationContext, rule: OptimizationRule): OptimizationRecommendation | null {
    const baseRecommendation = rule.recommendation;

    const recommendation: OptimizationRecommendation = {
      id: this.generateRecommendationId(),
      type: baseRecommendation.type || rule.category,
      category: baseRecommendation.category || 'short-term',
      priority: baseRecommendation.priority || rule.priority,
      title: baseRecommendation.title || rule.name,
      description: baseRecommendation.description || rule.description,
      problem: baseRecommendation.problem || '',
      solution: baseRecommendation.solution || '',
      implementation: [],
      impact: {
        sizeSavings: 0,
        performanceGain: 0,
        budgetImprovement: 0,
        riskLevel: 'low',
      },
      effort: {
        estimatedTime: 0,
        complexity: 'medium',
        dependencies: [],
        requiredSkills: [],
      },
      automation: {
        automatable: false,
        automatedSteps: [],
        manualSteps: [],
      },
      evidence: [],
      references: [],
      tags: [rule.category, rule.id],
    };

    // Customize recommendation based on context
    this.customizeRecommendation(recommendation, context, rule);

    return recommendation;
  }

  /**
   * Customize recommendation based on context
   */
  private customizeRecommendation(
    recommendation: OptimizationRecommendation,
    context: OptimizationContext,
    rule: OptimizationRule
  ): void {
    switch (rule.id) {
      case 'large-bundle-size':
        const overage = context.bundleSize - 500 * 1024;
        recommendation.impact.sizeSavings = overage * 0.3; // Estimate 30% reduction
        recommendation.impact.budgetImprovement = (overage / context.bundleSize) * 100;
        recommendation.impact.riskLevel = 'medium';
        recommendation.effort.estimatedTime = 16; // 2 days
        recommendation.effort.complexity = 'medium';
        recommendation.automatable = true;

        recommendation.implementation = [
          {
            id: '1',
            title: 'Enable Tree Shaking',
            description: 'Configure webpack to remove unused code',
            command: 'npm install --save-dev webpack-bundle-analyzer',
            verification: 'Bundle analyzer shows reduced size',
          },
          {
            id: '2',
            title: 'Implement Code Splitting',
            description: 'Split bundle into smaller chunks',
            code: 'const LazyComponent = React.lazy(() => import("./LazyComponent"));',
            verification: 'Network tab shows multiple smaller chunks',
          },
        ];

        recommendation.evidence = [
          {
            type: 'metric',
            description: `Current bundle size: ${Math.round(context.bundleSize / 1024)}KB`,
            data: { bundleSize: context.bundleSize },
            confidence: 1,
          },
        ];
        break;

      case 'unused-dependencies':
        const unusedDeps = context.dependencies.filter(d => !d.used);
        const totalUnusedSize = unusedDeps.reduce((sum, d) => sum + d.size, 0);

        recommendation.impact.sizeSavings = totalUnusedSize;
        recommendation.impact.budgetImprovement = (totalUnusedSize / context.bundleSize) * 100;
        recommendation.impact.riskLevel = 'low';
        recommendation.effort.estimatedTime = unusedDeps.length * 2; // 2 hours per dependency
        recommendation.effort.complexity = 'low';
        recommendation.automatable = true;

        recommendation.implementation = unusedDeps.map(dep => ({
          id: dep.name,
          title: `Remove ${dep.name}`,
          description: `Remove unused dependency ${dep.name}@${dep.version}`,
          command: `npm uninstall ${dep.name}`,
          verification: `Bundle size reduced by ${Math.round(dep.size / 1024)}KB`,
        }));

        recommendation.evidence = unusedDeps.map(dep => ({
          type: 'dependency',
          description: `${dep.name} is unused but adds ${Math.round(dep.size / 1024)}KB`,
          data: dep,
          confidence: 0.9,
        }));
        break;

      case 'unoptimized-assets':
        const unoptimizedAssets = context.assets.filter(a => !a.optimized && a.canBeOptimized);
        const totalOptimizationPotential = unoptimizedAssets.reduce((sum, a) => sum + (a.size * a.optimizationPotential / 100), 0);

        recommendation.impact.sizeSavings = totalOptimizationPotential;
        recommendation.impact.budgetImprovement = (totalOptimizationPotential / context.bundleSize) * 100;
        recommendation.impact.riskLevel = 'low';
        recommendation.effort.estimatedTime = unoptimizedAssets.length * 1; // 1 hour per asset
        recommendation.effort.complexity = 'low';
        recommendation.automatable = true;

        recommendation.implementation = [
          {
            id: '1',
            title: 'Optimize Images',
            description: 'Compress and convert images to modern formats',
            command: 'npm install --save-dev imagemin imagemin-webp',
            verification: 'Image sizes reduced while maintaining quality',
          },
          {
            id: '2',
            title: 'Minify CSS and JS',
            description: 'Apply minification to stylesheets and scripts',
            command: 'npm install --save-dev cssnano terser',
            verification: 'File sizes reduced after build',
          },
        ];

        recommendation.evidence = unoptimizedAssets.map(asset => ({
          type: 'asset',
          description: `${asset.name} can be optimized by ${asset.optimizationPotential}%`,
          data: asset,
          confidence: 0.8,
        }));
        break;

      case 'large-chunks':
        const largeChunks = context.chunks.filter(c => c.canBeSplit && c.size > 100 * 1024);
        const totalChunkSavings = largeChunks.reduce((sum, c) => sum + (c.size * c.splitPotential / 100), 0);

        recommendation.impact.sizeSavings = totalChunkSavings;
        recommendation.impact.performanceGain = totalChunkSavings / 1024 * 10; // Estimate 10ms per KB saved
        recommendation.impact.budgetImprovement = (totalChunkSavings / context.bundleSize) * 100;
        recommendation.impact.riskLevel = 'medium';
        recommendation.effort.estimatedTime = largeChunks.length * 4; // 4 hours per chunk
        recommendation.effort.complexity = 'medium';
        recommendation.automatable = false;

        recommendation.implementation = [
          {
            id: '1',
            title: 'Implement Dynamic Imports',
            description: 'Convert static imports to dynamic imports for large chunks',
            code: '// Before\nimport LargeComponent from "./LargeComponent";\n\n// After\nconst LargeComponent = React.lazy(() => import("./LargeComponent"));',
            verification: 'Webpack creates separate chunks for dynamic imports',
          },
          {
            id: '2',
            title: 'Configure Split Chunks',
            description: 'Optimize webpack split chunks configuration',
            code: 'optimization: { splitChunks: { chunks: "all", maxSize: 244 * 1024 } }',
            verification: 'Bundle analyzer shows smaller, more numerous chunks',
          },
        ];

        recommendation.evidence = largeChunks.map(chunk => ({
          type: 'code',
          description: `${chunk.name} chunk is ${Math.round(chunk.size / 1024)}KB and can be split`,
          data: chunk,
          confidence: 0.8,
        }));
        break;
    }
  }

  /**
   * Analyze dependencies for optimization opportunities
   */
  private async analyzeDependencies(context: OptimizationContext): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Find heavy dependencies that can be replaced
    const heavyDeps = context.dependencies.filter(d => d.size > 50 * 1024 && d.used);

    for (const dep of heavyDeps) {
      if (dep.alternatives && dep.alternatives.length > 0) {
        recommendations.push({
          id: this.generateRecommendationId(),
          type: 'dependency',
          category: 'long-term',
          priority: 'medium',
          title: `Replace ${dep.name} with Lighter Alternative`,
          description: `${dep.name} is large (${Math.round(dep.size / 1024)}KB) and has lighter alternatives.`,
          problem: `Heavy dependency ${dep.name} significantly contributes to bundle size.`,
          solution: `Replace with ${dep.alternatives.join(', ')} or implement custom solution.`,
          implementation: [
            {
              id: '1',
              title: `Research Alternatives`,
              description: `Evaluate alternatives: ${dep.alternatives.join(', ')}`,
              verification: 'Performance tests show similar functionality with lower size',
            },
            {
              id: '2',
              title: `Implement Replacement`,
              description: `Replace ${dep.name} with chosen alternative`,
              verification: 'Application functionality remains intact with smaller bundle',
            },
          ],
          impact: {
            sizeSavings: dep.size * 0.6, // Estimate 60% reduction
            performanceGain: dep.size / 1024 * 5,
            budgetImprovement: (dep.size * 0.6 / context.bundleSize) * 100,
            riskLevel: 'medium',
          },
          effort: {
            estimatedTime: 40, // 1 week
            complexity: 'high',
            dependencies: ['Development team', 'QA testing'],
            requiredSkills: ['JavaScript', 'Dependency analysis', 'Testing'],
          },
          automation: {
            automatable: false,
            automatedSteps: [],
            manualSteps: ['Research', 'Implementation', 'Testing'],
          },
          evidence: [
            {
              type: 'dependency',
              description: `${dep.name} is ${Math.round(dep.size / 1024)}KB and has alternatives`,
              data: dep,
              confidence: 0.7,
            },
          ],
          references: [`https://bundlephobia.com/?package=${dep.name}`],
          tags: ['dependency', 'optimization', 'bundle-size'],
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze assets for optimization opportunities
   */
  private analyzeAssets(context: OptimizationContext): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for lazy loading opportunities
    const lazyLoadableAssets = context.assets.filter(a => a.lazyLoadable && !a.optimized);

    if (lazyLoadableAssets.length > 0) {
      const totalSize = lazyLoadableAssets.reduce((sum, a) => sum + a.size, 0);

      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'asset',
        category: 'short-term',
        priority: 'medium',
        title: 'Implement Lazy Loading for Assets',
        description: `${lazyLoadableAssets.length} assets can be lazy loaded to improve initial load time.`,
        problem: 'Non-critical assets are loaded eagerly, increasing initial bundle size.',
        solution: 'Implement lazy loading for images, fonts, and other non-critical assets.',
        implementation: [
          {
            id: '1',
            title: 'Add Loading="lazy" to Images',
            description: 'Add loading="lazy" attribute to img tags',
            code: '<img src="image.jpg" loading="lazy" alt="Description">',
            verification: 'Network tab shows images loaded when scrolled into view',
          },
          {
            id: '2',
            title: 'Implement Font Display Strategy',
            description: 'Use font-display: swap for custom fonts',
            code: '@font-face { font-family: "Custom Font"; font-display: swap; }',
            verification: 'Text remains visible during font loading',
          },
        ],
        impact: {
          sizeSavings: totalSize * 0.8,
          performanceGain: totalSize / 1024 * 15,
          budgetImprovement: (totalSize * 0.8 / context.bundleSize) * 100,
          riskLevel: 'low',
        },
        effort: {
          estimatedTime: lazyLoadableAssets.length * 2,
          complexity: 'low',
          dependencies: [],
          requiredSkills: ['HTML', 'CSS'],
        },
        automation: {
          automatable: true,
          automatedSteps: ['Add lazy loading attributes'],
          manualSteps: ['Test critical assets', 'Verify user experience'],
        },
        evidence: lazyLoadableAssets.map(asset => ({
          type: 'asset',
          description: `${asset.name} can be lazy loaded (${Math.round(asset.size / 1024)}KB)`,
          data: asset,
          confidence: 0.8,
        })),
        references: ['https://web.dev/lazy-loading/'],
        tags: ['assets', 'lazy-loading', 'performance'],
      });
    }

    return recommendations;
  }

  /**
   * Analyze code patterns for optimization opportunities
   */
  private analyzeCodePatterns(context: OptimizationContext): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // This would implement code pattern analysis
    // For now, return empty array

    return recommendations;
  }

  /**
   * Analyze usage patterns for optimization opportunities
   */
  private analyzeUsagePatterns(context: OptimizationContext): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (!context.usage) {
      return recommendations;
    }

    // Analyze feature usage for lazy loading
    const lowUsageFeatures = Object.entries(context.usage.features)
      .filter(([_, usage]) => usage < 20); // Less than 20% usage

    if (lowUsageFeatures.length > 0) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'code',
        category: 'long-term',
        priority: 'low',
        title: 'Lazy Load Low-Usage Features',
        description: `${lowUsageFeatures.length} features have low usage and can be lazy loaded.`,
        problem: 'Low-usage features are loaded eagerly, unnecessarily increasing bundle size.',
        solution: 'Implement lazy loading for features with low usage patterns.',
        implementation: [
          {
            id: '1',
            title: 'Implement Feature Flags',
            description: 'Add feature flags to control loading',
            verification: 'Features load only when accessed',
          },
          {
            id: '2',
            title: 'Add Dynamic Imports',
            description: 'Convert static imports to dynamic for low-usage features',
            code: 'const LowUsageFeature = React.lazy(() => import("./LowUsageFeature"));',
            verification: 'Bundle analyzer shows separate chunks for lazy features',
          },
        ],
        impact: {
          sizeSavings: lowUsageFeatures.length * 50 * 1024, // Estimate 50KB per feature
          performanceGain: lowUsageFeatures.length * 100,
          budgetImprovement: (lowUsageFeatures.length * 50 * 1024 / context.bundleSize) * 100,
          riskLevel: 'low',
        },
        effort: {
          estimatedTime: lowUsageFeatures.length * 8,
          complexity: 'medium',
          dependencies: ['Feature flag system'],
          requiredSkills: ['React', 'Dynamic imports'],
        },
        automation: {
          automatable: false,
          automatedSteps: [],
          manualSteps: ['Feature analysis', 'Implementation', 'Testing'],
        },
        evidence: lowUsageFeatures.map(([feature, usage]) => ({
          type: 'usage',
          description: `Feature "${feature}" has only ${usage}% usage`,
          data: { feature, usage },
          confidence: 0.7,
        })),
        references: ['https://reactjs.org/docs/code-splitting.html'],
        tags: ['features', 'lazy-loading', 'usage-analysis'],
      });
    }

    return recommendations;
  }

  /**
   * Generate ML-based recommendations
   */
  private async generateMLRecommendations(context: OptimizationContext): Promise<OptimizationRecommendation[]> {
    // Placeholder for ML-based recommendations
    // In a real implementation, this would use machine learning models
    return [];
  }

  /**
   * Process and filter recommendations
   */
  private processRecommendations(recommendations: OptimizationRecommendation[]): OptimizationRecommendation[] {
    let processed = [...recommendations];

    // Filter by confidence
    processed = processed.filter(r => {
      const avgConfidence = r.evidence.reduce((sum, e) => sum + e.confidence, 0) / r.evidence.length;
      return avgConfidence >= this.config.recommendations.minConfidence;
    });

    // Filter low priority if disabled
    if (!this.config.recommendations.includeLowPriority) {
      processed = processed.filter(r => r.priority !== 'low');
    }

    // Group similar recommendations
    if (this.config.recommendations.groupSimilar) {
      processed = this.groupSimilarRecommendations(processed);
    }

    // Sort by impact if enabled
    if (this.config.recommendations.sortByImpact) {
      processed.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        return b.impact.sizeSavings - a.impact.sizeSavings;
      });
    }

    // Limit number of recommendations
    if (processed.length > this.config.recommendations.maxRecommendations) {
      processed = processed.slice(0, this.config.recommendations.maxRecommendations);
    }

    return processed;
  }

  /**
   * Group similar recommendations
   */
  private groupSimilarRecommendations(recommendations: OptimizationRecommendation[]): OptimizationRecommendation[] {
    // Simple grouping by type and priority
    const grouped = new Map<string, OptimizationRecommendation>();

    recommendations.forEach(rec => {
      const key = `${rec.type}_${rec.priority}`;

      if (!grouped.has(key)) {
        grouped.set(key, rec);
      } else {
        // Merge recommendations
        const existing = grouped.get(key)!;
        existing.impact.sizeSavings += rec.impact.sizeSavings;
        existing.impact.performanceGain += rec.impact.performanceGain;
        existing.evidence.push(...rec.evidence);
        existing.implementation.push(...rec.implementation);
      }
    });

    return Array.from(grouped.values());
  }

  /**
   * Generate optimization plan
   */
  public async generateOptimizationPlan(context: OptimizationContext): Promise<OptimizationPlan> {
    const recommendations = await this.generateRecommendations(context);

    const plan: OptimizationPlan = {
      id: this.generatePlanId(),
      timestamp: new Date(),
      context,
      recommendations,
      phases: [],
      summary: {
        totalRecommendations: recommendations.length,
        criticalRecommendations: recommendations.filter(r => r.priority === 'critical').length,
        estimatedSizeSavings: recommendations.reduce((sum, r) => sum + r.impact.sizeSavings, 0),
        estimatedPerformanceGain: recommendations.reduce((sum, r) => sum + r.impact.performanceGain, 0),
        totalEffort: recommendations.reduce((sum, r) => sum + r.effort.estimatedTime, 0),
        automationPotential: recommendations.filter(r => r.automation.automatable).length / recommendations.length * 100,
        riskAssessment: this.assessOverallRisk(recommendations),
        quickWins: recommendations.filter(r => r.effort.estimatedTime <= 8 && r.priority !== 'low').length,
      },
      automationPotential: recommendations.filter(r => r.automation.automatable).length / recommendations.length * 100,
      estimatedROI: this.calculateROI(recommendations),
    };

    // Generate implementation phases
    plan.phases = this.generatePhases(recommendations);

    return plan;
  }

  /**
   * Generate implementation phases
   */
  private generatePhases(recommendations: OptimizationRecommendation[]): OptimizationPhase[] {
    const phases: OptimizationPhase[] = [];

    // Phase 1: Quick wins (immediate)
    const quickWins = recommendations.filter(r =>
      r.category === 'immediate' && r.effort.estimatedTime <= 8
    );

    if (quickWins.length > 0) {
      phases.push({
        id: 'phase-quick-wins',
        name: 'Quick Wins',
        description: 'Immediate optimizations with high impact and low effort',
        duration: 7, // 1 week
        recommendations: quickWins.map(r => r.id),
        dependencies: [],
        deliverables: ['Reduced bundle size', 'Improved performance metrics'],
        successCriteria: ['All quick wins implemented', '10% bundle size reduction'],
      });
    }

    // Phase 2: Core optimizations (short-term)
    const coreOptimizations = recommendations.filter(r => r.category === 'short-term');

    if (coreOptimizations.length > 0) {
      phases.push({
        id: 'phase-core',
        name: 'Core Optimizations',
        description: 'Essential optimizations requiring moderate effort',
        duration: 21, // 3 weeks
        recommendations: coreOptimizations.map(r => r.id),
        dependencies: phases.length > 0 ? [phases[0].id] : [],
        deliverables: ['Code splitting implementation', 'Dependency optimization'],
        successCriteria: ['Core optimizations completed', '25% bundle size reduction'],
      });
    }

    // Phase 3: Advanced optimizations (long-term)
    const advancedOptimizations = recommendations.filter(r => r.category === 'long-term');

    if (advancedOptimizations.length > 0) {
      phases.push({
        id: 'phase-advanced',
        name: 'Advanced Optimizations',
        description: 'Comprehensive optimizations for long-term performance',
        duration: 42, // 6 weeks
        recommendations: advancedOptimizations.map(r => r.id),
        dependencies: phases.map(p => p.id),
        deliverables: ['Architecture improvements', 'Advanced lazy loading'],
        successCriteria: ['All optimizations implemented', '40% total bundle size reduction'],
      });
    }

    return phases;
  }

  /**
   * Assess overall risk
   */
  private assessOverallRisk(recommendations: OptimizationRecommendation[]): 'low' | 'medium' | 'high' {
    const highRiskCount = recommendations.filter(r => r.impact.riskLevel === 'high').length;
    const mediumRiskCount = recommendations.filter(r => r.impact.riskLevel === 'medium').length;

    if (highRiskCount > 2) {
      return 'high';
    } else if (highRiskCount > 0 || mediumRiskCount > 3) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate estimated ROI
   */
  private calculateROI(recommendations: OptimizationRecommendation[]): number {
    const totalEffort = recommendations.reduce((sum, r) => sum + r.effort.estimatedTime, 0);
    const totalSavings = recommendations.reduce((sum, r) => sum + r.impact.sizeSavings, 0);

    // Simple ROI calculation (savings / effort)
    return totalSavings / Math.max(totalEffort, 1);
  }

  /**
   * Check if recommendation meets confidence threshold
   */
  private meetsConfidenceThreshold(recommendation: OptimizationRecommendation): boolean {
    if (recommendation.evidence.length === 0) {
      return false;
    }

    const avgConfidence = recommendation.evidence.reduce((sum, e) => sum + e.confidence, 0) / recommendation.evidence.length;
    return avgConfidence >= this.config.recommendations.minConfidence;
  }

  /**
   * Track recommendation outcome
   */
  public trackRecommendationOutcome(
    recommendationId: string,
    outcome: 'successful' | 'partial' | 'failed' | 'pending',
    feedback?: string
  ): void {
    const recommendation = Array.from(this.recommendationHistory.values())
      .find(h => h.recommendation.id === recommendationId)?.recommendation;

    if (!recommendation) {
      return;
    }

    this.recommendationHistory.set(recommendationId, {
      recommendation,
      outcome,
      timestamp: new Date(),
      feedback,
    });

    if (this.config.learning.adaptWeights) {
      this.adaptRuleWeights(recommendation, outcome);
    }

    this.saveRecommendationHistory();
    this.emit('recommendation-outcome-tracked', { recommendationId, outcome, feedback });
  }

  /**
   * Adapt rule weights based on outcomes
   */
  private adaptRuleWeights(recommendation: OptimizationRecommendation, outcome: string): void {
    // Find the rule that generated this recommendation
    const ruleId = recommendation.tags.find(tag => this.rules.has(tag));
    if (!ruleId) {
      return;
    }

    const rule = this.rules.get(ruleId)!;

    // Adjust confidence based on outcome
    switch (outcome) {
      case 'successful':
        rule.confidence = Math.min(1, rule.confidence + 0.1);
        break;
      case 'partial':
        rule.confidence = Math.max(0.1, rule.confidence - 0.05);
        break;
      case 'failed':
        rule.confidence = Math.max(0.1, rule.confidence - 0.2);
        break;
    }
  }

  // ID generators
  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<OptimizationEngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeRules();
  }

  /**
   * Get configuration
   */
  public getConfig(): OptimizationEngineConfig {
    return { ...this.config };
  }

  /**
   * Add custom rule
   */
  public addRule(rule: OptimizationRule): void {
    this.config.rules.push(rule);
    this.rules.set(rule.id, rule);
  }

  /**
   * Get recommendation history
   */
  public getRecommendationHistory(): Array<{
    recommendation: OptimizationRecommendation;
    outcome: string;
    timestamp: Date;
    feedback?: string;
  }> {
    return Array.from(this.recommendationHistory.values());
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalRecommendations: number;
    successRate: number;
    averageConfidence: number;
    mostEffectiveCategories: string[];
  } {
    const history = Array.from(this.recommendationHistory.values());
    const total = history.length;
    const successful = history.filter(h => h.outcome === 'successful').length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    const avgConfidence = history.length > 0
      ? history.reduce((sum, h) => sum + h.recommendation.evidence.reduce((s, e) => s + e.confidence, 0) / h.recommendation.evidence.length, 0) / history.length
      : 0;

    const categoryEffectiveness = new Map<string, { successful: number; total: number }>();

    history.forEach(h => {
      const category = h.recommendation.type;
      const existing = categoryEffectiveness.get(category) || { successful: 0, total: 0 };
      categoryEffectiveness.set(category, {
        successful: existing.successful + (h.outcome === 'successful' ? 1 : 0),
        total: existing.total + 1,
      });
    });

    const mostEffectiveCategories = Array.from(categoryEffectiveness.entries())
      .filter(([_, stats]) => stats.total >= 3) // At least 3 recommendations
      .map(([category, stats]) => ({
        category,
        successRate: (stats.successful / stats.total) * 100,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3)
      .map(item => item.category);

    return {
      totalRecommendations: total,
      successRate,
      averageConfidence: avgConfidence * 100,
      mostEffectiveCategories,
    };
  }
}

// Export singleton instance
export const budgetOptimizationEngine = BudgetOptimizationEngine.getInstance();
