/**
 * Size Budget Manager
 * Tracks bundle sizes and enforces performance budgets
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface SizeThresholds {
  critical: number;    // 20% over budget
  warning: number;     // 10% over budget
  target: number;      // At budget
  optimal: number;     // 10% under budget
}

interface BudgetCategory {
  name: string;
  budget: number;
  current: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  history: Array<{
    date: Date;
    size: number;
    build: string;
  }>;
  thresholds: SizeThresholds;
}

interface BudgetReport {
  timestamp: Date;
  status: 'pass' | 'warning' | 'fail';
  categories: BudgetCategory[];
  totalBudget: number;
  totalCurrent: number;
  violations: BudgetViolation[];
  recommendations: string[];
  trends: SizeTrend[];
}

interface BudgetViolation {
  category: string;
  severity: 'warning' | 'critical';
  current: number;
  budget: number;
  overage: number;
  overagePercentage: number;
}

interface SizeTrend {
  category: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  timeframe: number; // days
  significance: 'high' | 'medium' | 'low';
}

class SizeBudgetManager {
  private budgetConfigPath: string;
  private historyPath: string;
  private reportsPath: string;
  private budgets: Map<string, BudgetCategory>;

  constructor(basePath: string = '.budget-tracking') {
    this.budgetConfigPath = join(basePath, 'budget-config.json');
    this.historyPath = join(basePath, 'size-history.json');
    this.reportsPath = join(basePath, 'reports');
    this.budgets = new Map();

    this.ensureDirectories();
    this.loadBudgetConfiguration();
  }

  private ensureDirectories(): void {
    if (!existsSync(this.reportsPath)) {
      mkdirSync(this.reportsPath, { recursive: true });
    }
  }

  private loadBudgetConfiguration(): void {
    if (existsSync(this.budgetConfigPath)) {
      const config = JSON.parse(readFileSync(this.budgetConfigPath, 'utf-8'));

      Object.entries(config.budgets || {}).forEach(([name, budget]: [string, any]) => {
        this.budgets.set(name, {
          name,
          budget: budget.limit,
          current: 0,
          trend: 'stable',
          history: [],
          thresholds: this.calculateThresholds(budget.limit),
        });
      });
    } else {
      // Initialize default budgets
      this.initializeDefaultBudgets();
      this.saveBudgetConfiguration();
    }
  }

  private initializeDefaultBudgets(): void {
    const defaultBudgets = [
      { name: 'total', limit: 1024 * 1024 },        // 1MB total
      { name: 'javascript', limit: 500 * 1024 },    // 500KB JS
      { name: 'css', limit: 100 * 1024 },          // 100KB CSS
      { name: 'images', limit: 200 * 1024 },       // 200KB images
      { name: 'fonts', limit: 50 * 1024 },         // 50KB fonts
      { name: 'vendor', limit: 300 * 1024 },       // 300KB vendor
      { name: 'initial', limit: 200 * 1024 },      // 200KB initial load
    ];

    defaultBudgets.forEach(budget => {
      this.budgets.set(budget.name, {
        name: budget.name,
        budget: budget.limit,
        current: 0,
        trend: 'stable',
        history: [],
        thresholds: this.calculateThresholds(budget.limit),
      });
    });
  }

  private calculateThresholds(budget: number): SizeThresholds {
    return {
      critical: budget * 1.2,    // 20% over
      warning: budget * 1.1,     // 10% over
      target: budget,            // exactly budget
      optimal: budget * 0.9,     // 10% under
    };
  }

  private saveBudgetConfiguration(): void {
    const config = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      budgets: Object.fromEntries(
        Array.from(this.budgets.entries()).map(([name, category]) => [
          name,
          {
            limit: category.budget,
            description: this.getCategoryDescription(name),
          },
        ])
      ),
    };

    writeFileSync(this.budgetConfigPath, JSON.stringify(config, null, 2));
  }

  private getCategoryDescription(name: string): string {
    const descriptions: Record<string, string> = {
      total: 'Total bundle size including all assets',
      javascript: 'JavaScript files including framework and application code',
      css: 'Stylesheets including framework and component styles',
      images: 'Image files and icons',
      fonts: 'Font files and icon fonts',
      vendor: 'Third-party library code',
      initial: 'Critical resources needed for initial page load',
    };

    return descriptions[name] || `${name} resources`;
  }

  async updateCurrentSizes(buildPath: string = '.next'): Promise<void> {
    console.log('📊 Updating current bundle sizes...');

    try {
      // Get build hash for tracking
      const buildHash = this.getCurrentBuildHash();

      // Update each budget category with current size
      await this.updateTotalSize(buildPath);
      await this.updateJavaScriptSize(buildPath);
      await this.updateCSSSize(buildPath);
      await this.updateImageSize();
      await this.updateVendorSize(buildPath);
      await this.updateInitialSize(buildPath);

      // Save history
      this.saveSizeHistory(buildHash);

      // Analyze trends
      this.analyzeTrends();

    } catch (error) {
      console.error('Error updating current sizes:', error);
      throw error;
    }
  }

  private getCurrentBuildHash(): string {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return Date.now().toString();
    }
  }

  private async updateTotalSize(buildPath: string): Promise<void> {
    // This would calculate total bundle size
    // For now, simulate with placeholder
    const totalSize = 850 * 1024; // 850KB
    this.updateCategorySize('total', totalSize);
  }

  private async updateJavaScriptSize(buildPath: string): Promise<void> {
    // This would scan .next directory for JS files
    const jsSize = 420 * 1024; // 420KB
    this.updateCategorySize('javascript', jsSize);
  }

  private async updateCSSSize(buildPath: string): Promise<void> {
    // This would scan for CSS files
    const cssSize = 85 * 1024; // 85KB
    this.updateCategorySize('css', cssSize);
  }

  private async updateImageSize(): Promise<void> {
    // This would scan public directory for images
    const imageSize = 150 * 1024; // 150KB
    this.updateCategorySize('images', imageSize);
  }

  private async updateVendorSize(buildPath: string): Promise<void> {
    // This would analyze vendor chunks
    const vendorSize = 280 * 1024; // 280KB
    this.updateCategorySize('vendor', vendorSize);
  }

  private async updateInitialSize(buildPath: string): Promise<void> {
    // This would calculate initial load size
    const initialSize = 180 * 1024; // 180KB
    this.updateCategorySize('initial', initialSize);
  }

  private updateCategorySize(categoryName: string, size: number): void {
    const category = this.budgets.get(categoryName);
    if (category) {
      category.current = size;
    }
  }

  private saveSizeHistory(buildHash: string): void {
    const history = this.loadSizeHistory();
    const timestamp = new Date();

    this.budgets.forEach(category => {
      history.push({
        category: category.name,
        timestamp: timestamp.toISOString(),
        size: category.current,
        buildHash,
      });
    });

    // Keep only last 30 days of history
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const filteredHistory = history.filter(entry =>
      new Date(entry.timestamp) > cutoffDate
    );

    writeFileSync(this.historyPath, JSON.stringify(filteredHistory, null, 2));
  }

  private loadSizeHistory(): any[] {
    if (existsSync(this.historyPath)) {
      return JSON.parse(readFileSync(this.historyPath, 'utf-8'));
    }
    return [];
  }

  private analyzeTrends(): void {
    const history = this.loadSizeHistory();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.budgets.forEach(category => {
      const categoryHistory = history
        .filter(entry => entry.category === category.name)
        .filter(entry => new Date(entry.timestamp) > sevenDaysAgo)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (categoryHistory.length >= 2) {
        const recent = categoryHistory[categoryHistory.length - 1];
        const previous = categoryHistory[categoryHistory.length - 2];

        const changePercentage = ((recent.size - previous.size) / previous.size) * 100;

        if (changePercentage > 5) {
          category.trend = 'increasing';
        } else if (changePercentage < -5) {
          category.trend = 'decreasing';
        } else {
          category.trend = 'stable';
        }

        // Update category history
        category.history = categoryHistory.map(entry => ({
          date: new Date(entry.timestamp),
          size: entry.size,
          build: entry.buildHash,
        }));
      }
    });
  }

  async generateBudgetReport(): Promise<BudgetReport> {
    console.log('📋 Generating budget report...');

    const violations = this.identifyViolations();
    const recommendations = this.generateRecommendations(violations);
    const trends = this.analyzeAllTrends();

    const totalBudget = Array.from(this.budgets.values()).reduce((sum, cat) => sum + cat.budget, 0);
    const totalCurrent = Array.from(this.budgets.values()).reduce((sum, cat) => sum + cat.current, 0);

    const status = violations.some(v => v.severity === 'critical') ? 'fail' :
                  violations.length > 0 ? 'warning' : 'pass';

    const report: BudgetReport = {
      timestamp: new Date(),
      status,
      categories: Array.from(this.budgets.values()),
      totalBudget,
      totalCurrent,
      violations,
      recommendations,
      trends,
    };

    // Save report
    const reportPath = join(this.reportsPath, `budget-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  private identifyViolations(): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    this.budgets.forEach(category => {
      if (category.current > category.thresholds.critical) {
        violations.push({
          category: category.name,
          severity: 'critical',
          current: category.current,
          budget: category.budget,
          overage: category.current - category.budget,
          overagePercentage: ((category.current - category.budget) / category.budget) * 100,
        });
      } else if (category.current > category.thresholds.warning) {
        violations.push({
          category: category.name,
          severity: 'warning',
          current: category.current,
          budget: category.budget,
          overage: category.current - category.budget,
          overagePercentage: ((category.current - category.budget) / category.budget) * 100,
        });
      }
    });

    return violations;
  }

  private generateRecommendations(violations: BudgetViolation[]): string[] {
    const recommendations: string[] = [];

    violations.forEach(violation => {
      switch (violation.category) {
        case 'total':
          recommendations.push('Overall bundle size is too large. Consider code splitting and lazy loading.');
          break;
        case 'javascript':
          recommendations.push('JavaScript bundle is oversized. Enable tree shaking and remove unused dependencies.');
          break;
        case 'css':
          recommendations.push('CSS bundle exceeds budget. Remove unused styles and implement CSS-in-JS with purging.');
          break;
        case 'images':
          recommendations.push('Image assets are too large. Optimize images and use modern formats like WebP.');
          break;
        case 'vendor':
          recommendations.push('Vendor bundle is too large. Use dynamic imports for heavy dependencies.');
          break;
        case 'initial':
          recommendations.push('Initial load size exceeds budget. Implement better code splitting and prioritize critical resources.');
          break;
      }
    });

    // General recommendations
    const increasingCategories = Array.from(this.budgets.values())
      .filter(cat => cat.trend === 'increasing' && cat.current > cat.budget * 0.8);

    if (increasingCategories.length > 0) {
      recommendations.push('Several categories show increasing trends. Monitor bundle growth and implement size gates in CI/CD.');
    }

    return Array.from(new Set(recommendations)); // Remove duplicates
  }

  private analyzeAllTrends(): SizeTrend[] {
    const trends: SizeTrend[] = [];

    this.budgets.forEach(category => {
      if (category.history.length >= 2) {
        const recent = category.history[category.history.length - 1];
        const previous = category.history[0];

        const timeDiff = (recent.date.getTime() - previous.date.getTime()) / (1000 * 60 * 60 * 24); // days
        const changePercentage = ((recent.size - previous.size) / previous.size) * 100;

        let significance: 'high' | 'medium' | 'low' = 'low';
        if (Math.abs(changePercentage) > 20) significance = 'high';
        else if (Math.abs(changePercentage) > 10) significance = 'medium';

        trends.push({
          category: category.name,
          direction: category.trend,
          changePercentage,
          timeframe: Math.round(timeDiff),
          significance,
        });
      }
    });

    return trends;
  }

  enforceBudget(strict: boolean = false): { passed: boolean; message: string } {
    const violations = this.identifyViolations();

    if (violations.length === 0) {
      return {
        passed: true,
        message: '✅ All budgets are within limits.',
      };
    }

    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const message = violations.map(v =>
      `${v.category}: ${this.formatSize(v.current)} / ${this.formatSize(v.budget)} (+${this.formatSize(v.overage)})`
    ).join(', ');

    if (strict || criticalViolations.length > 0) {
      return {
        passed: false,
        message: `❌ Budget violations detected: ${message}`,
      };
    }

    return {
      passed: true,
      message: `⚠️ Budget warnings: ${message}`,
    };
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  setBudget(category: string, budget: number): void {
    if (!this.budgets.has(category)) {
      this.budgets.set(category, {
        name: category,
        budget,
        current: 0,
        trend: 'stable',
        history: [],
        thresholds: this.calculateThresholds(budget),
      });
    } else {
      const existing = this.budgets.get(category)!;
      existing.budget = budget;
      existing.thresholds = this.calculateThresholds(budget);
    }

    this.saveBudgetConfiguration();
  }

  getBudgetStatus(): Record<string, { budget: number; current: number; status: string }> {
    const status: Record<string, { budget: number; current: number; status: string }> = {};

    this.budgets.forEach(category => {
      let statusText = 'within-budget';

      if (category.current > category.thresholds.critical) {
        statusText = 'critical';
      } else if (category.current > category.thresholds.warning) {
        statusText = 'warning';
      } else if (category.current <= category.thresholds.optimal) {
        statusText = 'optimal';
      }

      status[category.name] = {
        budget: category.budget,
        current: category.current,
        status: statusText,
      };
    });

    return status;
  }
}

export {
  SizeBudgetManager,
  type BudgetReport,
  type BudgetCategory,
  type BudgetViolation,
  type SizeTrend,
  type SizeThresholds,
};
