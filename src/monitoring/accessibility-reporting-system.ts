/**
 * Accessibility Reporting and Remediation Tracking - T166 Implementation
 * Comprehensive reporting system for accessibility compliance and remediation progress
 */

import {
  AccessibilityReport,
  AccessibilityViolation,
  ToolAccessibilityResult,
  ScreenReaderTestResult,
  KeyboardNavigationTestResult,
  ColorContrastTestResult,
  ComplianceLevel,
  AccessibilitySeverity,
  WCAGCategory,
  AccessibilityTestingConfig
} from './accessibility-compliance-types';

interface RemediationTask {
  id: string;
  violationId: string;
  toolSlug: string;
  title: string;
  description: string;
  severity: AccessibilitySeverity;
  category: WCAGCategory;
  status: 'todo' | 'in-progress' | 'testing' | 'completed' | 'verified' | 'deferred';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedTo?: string;
  estimatedHours: number;
  actualHours?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes: string[];
  dependencies: string[];
  blockedBy: string[];
  testSteps: string[];
  verificationCriteria: string[];
  relatedTools: string[];
  tags: string[];
}

interface ComplianceTrend {
  date: Date;
  overallScore: number;
  complianceLevel: ComplianceLevel;
  criticalViolations: number;
  seriousViolations: number;
  moderateViolations: number;
  minorViolations: number;
  toolsCompliant: number;
  toolsTested: number;
}

interface AccessibilityMetrics {
  totalViolations: number;
  violationsByCategory: Record<WCAGCategory, number>;
  violationsBySeverity: Record<AccessibilitySeverity, number>;
  violationsByTool: Record<string, number>;
  remediationProgress: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    averageCompletionTime: number;
    successRate: number;
  };
  testCoverage: {
    automatedTests: number;
    manualTests: number;
    screenReaderTests: number;
    keyboardTests: number;
    visualTests: number;
    totalToolsTested: number;
    coveragePercentage: number;
  };
}

interface ReportConfiguration {
  includeCharts: boolean;
  includeScreenshots: boolean;
  includeCodeExamples: boolean;
  includeRemediationTasks: boolean;
  includeHistoricalData: boolean;
  exportFormat: 'html' | 'pdf' | 'json' | 'csv';
  filterBySeverity: AccessibilitySeverity[];
  filterByCategory: WCAGCategory[];
  filterByTool: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

class AccessibilityReportingSystem {
  private remediationTasks: Map<string, RemediationTask> = new Map();
  private complianceHistory: ComplianceTrend[] = [];
  private violationDatabase: Map<string, AccessibilityViolation> = new Map();

  /**
   * Generate comprehensive accessibility report
   */
  async generateReport(
    toolSlugs?: string[],
    config?: Partial<ReportConfiguration>
  ): Promise<AccessibilityReport> {
    const reportConfig: ReportConfiguration = {
      includeCharts: true,
      includeScreenshots: false,
      includeCodeExamples: true,
      includeRemediationTasks: true,
      includeHistoricalData: true,
      exportFormat: 'html',
      filterBySeverity: [],
      filterByCategory: [],
      filterByTool: [],
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      },
      ...config
    };

    const reportId = `accessibility-report-${Date.now()}`;
    const generatedAt = new Date();

    try {
      // Get tool results (this would typically come from test results database)
      const toolResults = await this.getToolResults(toolSlugs || [], reportConfig);

      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics(toolResults);

      // Get aggregated metrics
      const aggregatedMetrics = this.calculateAggregatedMetrics(toolResults);

      // Get screen reader, keyboard, and color contrast results
      const [screenReaderResults, keyboardNavigationResults, colorContrastResults] = await Promise.all([
        this.getScreenReaderResults(toolSlugs || [], reportConfig),
        this.getKeyboardNavigationResults(toolSlugs || [], reportConfig),
        this.getColorContrastResults(toolSlugs || [], reportConfig)
      ]);

      // Calculate trends
      const trends = this.calculateTrends(summary.overallScore);

      // Generate recommendations
      const recommendations = this.generateRecommendations(aggregatedMetrics, trends);

      // Generate action items
      const actionItems = this.generateActionItems(toolResults, aggregatedMetrics);

      return {
        id: reportId,
        generatedAt,
        period: reportConfig.dateRange,
        platform: {
          name: 'Parsify.dev',
          version: '1.0.0',
          url: typeof window !== 'undefined' ? window.location.origin : ''
        },
        summary,
        toolResults,
        aggregatedMetrics,
        screenReaderResults,
        keyboardNavigationResults,
        colorContrastResults,
        trends,
        recommendations,
        actionItems,
        nextAuditDate: this.calculateNextAuditDate()
      };

    } catch (error) {
      console.error('Error generating accessibility report:', error);
      throw error;
    }
  }

  /**
   * Create remediation tasks for violations
   */
  createRemediationTasks(violations: AccessibilityViolation[]): RemediationTask[] {
    const tasks: RemediationTask[] = [];

    violations.forEach(violation => {
      const existingTask = Array.from(this.remediationTasks.values())
        .find(task => task.violationId === violation.id);

      if (!existingTask) {
        const task = this.createRemediationTask(violation);
        this.remediationTasks.set(task.id, task);
        tasks.push(task);
      }
    });

    return tasks;
  }

  /**
   * Update remediation task status
   */
  updateRemediationTask(
    taskId: string,
    updates: Partial<RemediationTask>
  ): RemediationTask | null {
    const task = this.remediationTasks.get(taskId);
    if (!task) return null;

    const updatedTask: RemediationTask = {
      ...task,
      ...updates,
      updatedAt: new Date(),
      completedAt: updates.status === 'completed' ? new Date() : task.completedAt
    };

    this.remediationTasks.set(taskId, updatedTask);
    return updatedTask;
  }

  /**
   * Get remediation progress metrics
   */
  getRemediationProgress(toolSlug?: string): AccessibilityMetrics {
    const tasks = toolSlug
      ? Array.from(this.remediationTasks.values()).filter(task => task.toolSlug === toolSlug)
      : Array.from(this.remediationTasks.values());

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'verified').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress' || task.status === 'testing').length;

    const now = new Date();
    const overdueTasks = tasks.filter(task =>
      task.dueDate && task.dueDate < now && task.status !== 'completed'
    ).length;

    const completedTasksWithTime = tasks.filter(task => task.completedAt && task.createdAt);
    const averageCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, task) =>
          sum + (task.completedAt!.getTime() - task.createdAt.getTime()), 0
        ) / completedTasksWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate violations by category and severity
    const violationsByCategory = this.getViolationsByCategory(tasks);
    const violationsBySeverity = this.getViolationsBySeverity(tasks);
    const violationsByTool = this.getViolationsByTool(tasks);

    return {
      totalViolations: totalTasks,
      violationsByCategory,
      violationsBySeverity,
      violationsByTool,
      remediationProgress: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        averageCompletionTime,
        successRate
      },
      testCoverage: this.getTestCoverageMetrics()
    };
  }

  /**
   * Export report in specified format
   */
  async exportReport(
    report: AccessibilityReport,
    format: 'json' | 'csv' | 'pdf' | 'html'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'csv':
        return this.generateCSV(report);

      case 'pdf':
        return this.generatePDF(report);

      case 'html':
        return this.generateHTML(report);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Track compliance trends over time
   */
  trackComplianceTrend(complianceData: Partial<ComplianceTrend>): void {
    const trend: ComplianceTrend = {
      date: new Date(),
      overallScore: complianceData.overallScore || 0,
      complianceLevel: complianceData.complianceLevel || ComplianceLevel.NON_COMPLIANT,
      criticalViolations: complianceData.criticalViolations || 0,
      seriousViolations: complianceData.seriousViolations || 0,
      moderateViolations: complianceData.moderateViolations || 0,
      minorViolations: complianceData.minorViolations || 0,
      toolsCompliant: complianceData.toolsCompliant || 0,
      toolsTested: complianceData.toolsTested || 0
    };

    this.complianceHistory.push(trend);

    // Keep only last 12 months of data
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    this.complianceHistory = this.complianceHistory.filter(t => t.date >= oneYearAgo);
  }

  /**
   * Generate accessibility dashboard data
   */
  generateDashboardData(): {
    overview: AccessibilityMetrics;
    recentActivity: Array<{
      type: 'violation' | 'remediation' | 'test';
      timestamp: Date;
      description: string;
      severity?: AccessibilitySeverity;
    }>;
    topIssues: Array<{
      type: string;
      count: number;
      severity: AccessibilitySeverity;
      trend: 'improving' | 'worsening' | 'stable';
    }>;
    toolStatus: Array<{
      toolSlug: string;
      score: number;
      complianceLevel: ComplianceLevel;
      lastTested: Date;
      violationsCount: number;
    }>;
  } {
    const overview = this.getRemediationProgress();
    const recentActivity = this.getRecentActivity();
    const topIssues = this.getTopIssues();
    const toolStatus = this.getToolStatus();

    return {
      overview,
      recentActivity,
      topIssues,
      toolStatus
    };
  }

  /**
   * Helper methods
   */
  private async getToolResults(toolSlugs: string[], config: ReportConfiguration): Promise<ToolAccessibilityResult[]> {
    // This would typically fetch from a database of test results
    // For now, return empty array
    return [];
  }

  private calculateSummaryMetrics(toolResults: ToolAccessibilityResult[]) {
    const totalTools = toolResults.length;
    const testedTools = toolResults.filter(result => result.testedAt).length;
    const compliantTools = toolResults.filter(result =>
      result.overallCompliance === ComplianceLevel.AAA ||
      result.overallCompliance === ComplianceLevel.AA
    ).length;

    const partiallyCompliant = toolResults.filter(result =>
      result.overallCompliance === ComplianceLevel.A
    ).length;

    const nonCompliant = toolResults.filter(result =>
      result.overallCompliance === ComplianceLevel.NON_COMPLIANT
    ).length;

    const allViolations = toolResults.flatMap(result => result.violations);
    const overallScore = testedTools > 0
      ? toolResults.reduce((sum, result) => sum + result.score, 0) / testedTools
      : 0;

    let complianceLevel: ComplianceLevel;
    if (nonCompliant === 0 && partiallyCompliant === 0) {
      complianceLevel = compliantTools === testedTools ? ComplianceLevel.AAA : ComplianceLevel.AA;
    } else if (nonCompliant === 0) {
      complianceLevel = ComplianceLevel.A;
    } else {
      complianceLevel = ComplianceLevel.NON_COMPLIANT;
    }

    return {
      totalTools,
      testedTools,
      compliantTools,
      partiallyCompliant,
      nonCompliant,
      overallScore: Math.round(overallScore),
      complianceLevel
    };
  }

  private calculateAggregatedMetrics(toolResults: ToolAccessibilityResult[]) {
    const allViolations = toolResults.flatMap(result => result.violations);

    const violationsByCategory = Object.values(WCAGCategory).reduce((acc, category) => {
      acc[category] = allViolations.filter(v => v.category === category).length;
      return acc;
    }, {} as Record<WCAGCategory, number>);

    const violationsBySeverity = Object.values(AccessibilitySeverity).reduce((acc, severity) => {
      acc[severity] = allViolations.filter(v => v.impact === severity).length;
      return acc;
    }, {} as Record<AccessibilitySeverity, number>);

    // Find common issues
    const issueFrequency = new Map<string, { count: number; tools: string[] }>();
    allViolations.forEach(violation => {
      const key = `${violation.category}-${violation.title}`;
      const existing = issueFrequency.get(key);
      if (existing) {
        existing.count++;
        if (!existing.tools.includes(violation.location.url)) {
          existing.tools.push(violation.location.url);
        }
      } else {
        issueFrequency.set(key, {
          count: 1,
          tools: [violation.location.url]
        });
      }
    });

    const commonIssues = Array.from(issueFrequency.entries())
      .map(([issue, data]) => ({
        issue: issue.replace('-', ': '),
        frequency: data.count,
        tools: data.tools
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      violationsByCategory,
      violationsBySeverity,
      violationsByTool: {}, // Would calculate per tool in real implementation
      commonIssues
    };
  }

  private async getScreenReaderResults(toolSlugs: string[], config: ReportConfiguration): Promise<ScreenReaderTestResult[]> {
    // This would fetch screen reader test results from database
    return [];
  }

  private async getKeyboardNavigationResults(toolSlugs: string[], config: ReportConfiguration): Promise<KeyboardNavigationTestResult[]> {
    // This would fetch keyboard navigation test results from database
    return [];
  }

  private async getColorContrastResults(toolSlugs: string[], config: ReportConfiguration): Promise<ColorContrastTestResult[]> {
    // This would fetch color contrast test results from database
    return [];
  }

  private calculateTrends(currentScore: number) {
    const previousScore = this.complianceHistory.length > 0
      ? this.complianceHistory[this.complianceHistory.length - 1].overallScore
      : undefined;

    const improvement = previousScore ? currentScore - previousScore : 0;

    let trendDirection: 'improving' | 'declining' | 'stable';
    if (Math.abs(improvement) < 1) {
      trendDirection = 'stable';
    } else if (improvement > 0) {
      trendDirection = 'improving';
    } else {
      trendDirection = 'declining';
    }

    return {
      previousScore,
      improvement,
      trendDirection
    };
  }

  private generateRecommendations(aggregatedMetrics: any, trends: any): string[] {
    const recommendations: string[] = [];

    // Analyze violation patterns
    Object.entries(aggregatedMetrics.violationsByCategory).forEach(([category, count]) => {
      if (count > 5) {
        recommendations.push(
          `Focus on ${category.toLowerCase()} accessibility - ${count} violations found`
        );
      }
    });

    Object.entries(aggregatedMetrics.violationsBySeverity).forEach(([severity, count]) => {
      if (severity === 'critical' && count > 0) {
        recommendations.push(`Address ${count} critical accessibility issues immediately`);
      }
    });

    // Trend-based recommendations
    if (trends.trendDirection === 'declining') {
      recommendations.push('Accessibility compliance is declining - review recent changes and address regressions');
    } else if (trends.trendDirection === 'improving') {
      recommendations.push('Good progress on accessibility - continue current remediation efforts');
    }

    // Common issues recommendations
    aggregatedMetrics.commonIssues.slice(0, 3).forEach((issue: any) => {
      recommendations.push(
        `${issue.issue} occurs ${issue.frequency} times across ${issue.tools.length} tools - prioritize for system-wide fix`
      );
    });

    return recommendations;
  }

  private generateActionItems(toolResults: ToolAccessibilityResult[], aggregatedMetrics: any) {
    const actionItems: any[] = [];

    // High priority action items
    Object.entries(aggregatedMetrics.violationsBySeverity).forEach(([severity, count]) => {
      if (severity === 'critical' && count > 0) {
        actionItems.push({
          priority: 'high',
          action: `Fix ${count} critical accessibility violations`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
        });
      }
    });

    // Tool-specific action items
    toolResults.forEach(result => {
      if (result.score < 50) {
        actionItems.push({
          priority: 'high',
          action: `Major accessibility improvements needed for ${result.toolName}`,
          assignedTo: 'Development team',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
        });
      }
    });

    return actionItems;
  }

  private calculateNextAuditDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Next audit in 30 days
    return date;
  }

  private createRemediationTask(violation: AccessibilityViolation): RemediationTask {
    const taskId = `task-${violation.id}`;
    const estimatedHours = this.estimateRemediationTime(violation);

    return {
      id: taskId,
      violationId: violation.id,
      toolSlug: violation.location.url.split('/').pop() || 'unknown',
      title: violation.title,
      description: violation.description,
      severity: violation.impact,
      category: violation.category,
      status: 'todo',
      priority: this.getPriorityForSeverity(violation.impact),
      estimatedHours,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: [],
      dependencies: [],
      blockedBy: [],
      testSteps: this.generateTestSteps(violation),
      verificationCriteria: this.generateVerificationCriteria(violation),
      relatedTools: [violation.location.url],
      tags: [violation.category, violation.testType]
    };
  }

  private estimateRemediationTime(violation: AccessibilityViolation): number {
    // Base time estimates by severity and category
    const baseHours = {
      [AccessibilitySeverity.CRITICAL]: 4,
      [AccessibilitySeverity.SERIOUS]: 2,
      [AccessibilitySeverity.MODERATE]: 1,
      [AccessibilitySeverity.MINOR]: 0.5
    };

    const categoryMultipliers = {
      [WCAGCategory.PERCEIVABLE]: 1.2,
      [WCAGCategory.OPERABLE]: 1.0,
      [WCAGCategory.UNDERSTANDABLE]: 1.5,
      [WCAGCategory.ROBUST]: 1.3
    };

    const base = baseHours[violation.impact] || 1;
    const multiplier = categoryMultipliers[violation.category] || 1;

    return Math.round(base * multiplier);
  }

  private getPriorityForSeverity(severity: AccessibilitySeverity): 'critical' | 'high' | 'medium' | 'low' {
    const priorityMap = {
      [AccessibilitySeverity.CRITICAL]: 'critical',
      [AccessibilitySeverity.SERIOUS]: 'high',
      [AccessibilitySeverity.MODERATE]: 'medium',
      [AccessibilitySeverity.MINOR]: 'low'
    };

    return priorityMap[severity] || 'medium';
  }

  private generateTestSteps(violation: AccessibilityViolation): string[] {
    return [
      `Navigate to ${violation.location.url}`,
      `Locate element: ${violation.element.selector}`,
      'Test with keyboard navigation',
      'Test with screen reader',
      'Verify compliance with WCAG guidelines'
    ];
  }

  private generateVerificationCriteria(violation: AccessibilityViolation): string[] {
    return [
      `Element meets ${violation.wcagCriteria.join(', ')} requirements`,
      'No accessibility violations detected in testing',
      'Works correctly with assistive technologies',
      'Maintains visual design consistency'
    ];
  }

  private getViolationsByCategory(tasks: RemediationTask[]): Record<WCAGCategory, number> {
    return Object.values(WCAGCategory).reduce((acc, category) => {
      acc[category] = tasks.filter(task => task.category === category).length;
      return acc;
    }, {} as Record<WCAGCategory, number>);
  }

  private getViolationsBySeverity(tasks: RemediationTask[]): Record<AccessibilitySeverity, number> {
    return Object.values(AccessibilitySeverity).reduce((acc, severity) => {
      acc[severity] = tasks.filter(task => task.severity === severity).length;
      return acc;
    }, {} as Record<AccessibilitySeverity, number>);
  }

  private getViolationsByTool(tasks: RemediationTask[]): Record<string, number> {
    const violationsByTool: Record<string, number> = {};
    tasks.forEach(task => {
      violationsByTool[task.toolSlug] = (violationsByTool[task.toolSlug] || 0) + 1;
    });
    return violationsByTool;
  }

  private getTestCoverageMetrics() {
    // This would calculate actual test coverage metrics
    return {
      automatedTests: 0,
      manualTests: 0,
      screenReaderTests: 0,
      keyboardTests: 0,
      visualTests: 0,
      totalToolsTested: 0,
      coveragePercentage: 0
    };
  }

  private generateCSV(report: AccessibilityReport): string {
    const headers = [
      'Tool',
      'Score',
      'Compliance Level',
      'Violations',
      'Critical Issues',
      'Serious Issues',
      'Last Tested'
    ];

    const rows = report.toolResults.map(result => [
      result.toolName,
      result.score.toString(),
      result.overallCompliance,
      result.violations.length.toString(),
      result.violations.filter(v => v.impact === 'critical').length.toString(),
      result.violations.filter(v => v.impact === 'serious').length.toString(),
      result.testedAt.toISOString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generatePDF(report: AccessibilityReport): string {
    // This would generate a PDF report
    // For now, return a placeholder
    return 'PDF generation not implemented in this demo';
  }

  private generateHTML(report: AccessibilityReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Accessibility Report - ${report.platform.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; color: #0066cc; }
        .violations { margin: 20px 0; }
        .severity-critical { color: #d32f2f; }
        .severity-serious { color: #f57c00; }
        .severity-moderate { color: #fbc02d; }
        .severity-minor { color: #388e3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Accessibility Report</h1>
        <p>${report.platform.name} - Generated on ${report.generatedAt.toLocaleDateString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Overall Score</h3>
            <div class="value">${report.summary.overallScore}%</div>
        </div>
        <div class="metric">
            <h3>Compliance Level</h3>
            <div class="value">${report.summary.complianceLevel}</div>
        </div>
        <div class="metric">
            <h3>Tools Tested</h3>
            <div class="value">${report.summary.testedTools}/${report.summary.totalTools}</div>
        </div>
        <div class="metric">
            <h3>Compliant Tools</h3>
            <div class="value">${report.summary.compliantTools}</div>
        </div>
    </div>

    <div class="violations">
        <h2>Violation Summary</h2>
        <p>Critical: <span class="severity-critical">${report.aggregatedMetrics.violationsBySeverity.critical || 0}</span></p>
        <p>Serious: <span class="severity-serious">${report.aggregatedMetrics.violationsBySeverity.serious || 0}</span></p>
        <p>Moderate: <span class="severity-moderate">${report.aggregatedMetrics.violationsBySeverity.moderate || 0}</span></p>
        <p>Minor: <span class="severity-minor">${report.aggregatedMetrics.violationsBySeverity.minor || 0}</span></p>
    </div>
</body>
</html>`;
  }

  private getRecentActivity() {
    // This would generate recent activity from remediation task history
    return [];
  }

  private getTopIssues() {
    // This would calculate top issues from violation data
    return [];
  }

  private getToolStatus() {
    // This would generate tool status from test results
    return [];
  }
}

export const accessibilityReportingSystem = new AccessibilityReportingSystem();
export { AccessibilityReportingSystem };
