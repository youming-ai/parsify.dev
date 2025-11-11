/**
 * Bundle Size Reporting and Alerting System
 * Provides comprehensive reporting and alerts for bundle size issues
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: {
    bundleSizeIncrease: number;    // percentage
    budgetExceeded: boolean;
    newRecommendations: number;
    performanceScoreDrop: number;
  };
  cooldown: number;              // minutes between alerts
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface AlertChannel {
  type: 'webhook' | 'email' | 'slack' | 'discord' | 'teams';
  config: Record<string, any>;
  enabled: boolean;
}

interface BundleAlert {
  id: string;
  timestamp: Date;
  type: 'budget-exceeded' | 'size-increase' | 'performance-degradation' | 'new-issues' | 'optimization-opportunity';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metrics: {
    current: number;
    previous: number;
    threshold: number;
    percentage: number;
  };
  recommendations: string[];
  resolved: boolean;
  channelsSent: string[];
}

interface ReportConfig {
  enabled: boolean;
  formats: ('json' | 'markdown' | 'html' | 'pdf')[];
  schedule: string;              // cron pattern
  recipients: string[];
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeTrends: boolean;
  retentionDays: number;
}

interface BundleReport {
  id: string;
  timestamp: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'build' | 'custom';
  summary: {
    totalSize: number;
    gzippedSize: number;
    optimizationSavings: number;
    budgetStatus: 'pass' | 'warning' | 'fail';
    performanceScore: number;
    issuesCount: number;
  };
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
  }>;
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedSavings: number;
  }>;
  budgetAnalysis: {
    categories: Array<{
      name: string;
      budget: number;
      actual: number;
      status: string;
    }>;
    violations: Array<{
      category: string;
      severity: string;
      overage: number;
    }>;
  };
  alerts: BundleAlert[];
}

interface NotificationTemplate {
  type: 'slack' | 'email' | 'discord' | 'webhook';
  template: string;
  variables: string[];
}

class BundleReportingSystem {
  private alertConfig: AlertConfig;
  private reportConfig: ReportConfig;
  private activeAlerts: Map<string, BundleAlert>;
  private reportHistory: BundleReport[];
  private lastAlertTime: Map<string, Date>;
  private templates: Map<string, NotificationTemplate>;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd(), config?: { alerts?: Partial<AlertConfig>, reports?: Partial<ReportConfig> }) {
    this.projectRoot = projectRoot;
    this.activeAlerts = new Map();
    this.reportHistory = [];
    this.lastAlertTime = new Map();
    this.templates = new Map();

    this.alertConfig = {
      enabled: true,
      channels: [
        {
          type: 'webhook',
          config: { url: process.env.BUNDLE_WEBHOOK_URL },
          enabled: !!process.env.BUNDLE_WEBHOOK_URL,
        },
      ],
      thresholds: {
        bundleSizeIncrease: 10,      // 10% increase
        budgetExceeded: true,
        newRecommendations: 5,       // 5+ new recommendations
        performanceScoreDrop: 15,    // 15 point drop
      },
      cooldown: 60,                 // 1 hour cooldown
      severity: 'warning',
      ...config?.alerts,
    };

    this.reportConfig = {
      enabled: true,
      formats: ['json', 'markdown', 'html'],
      schedule: '0 9 * * 1',        // Weekly on Monday at 9 AM
      recipients: [],
      includeCharts: true,
      includeRecommendations: true,
      includeTrends: true,
      retentionDays: 30,
      ...config?.reports,
    };

    this.initializeTemplates();
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const directories = ['.bundle-alerts', '.bundle-reports'];

    directories.forEach(dir => {
      const fullPath = join(this.projectRoot, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private initializeTemplates(): void {
    // Slack template
    this.templates.set('slack', {
      type: 'slack',
      template: `{
        "text": "🚨 Bundle Alert: {{title}}",
        "attachments": [
          {
            "color": "{{color}}",
            "fields": [
              {
                "title": "Issue",
                "value": "{{message}}",
                "short": false
              },
              {
                "title": "Current Size",
                "value": "{{currentSize}}",
                "short": true
              },
              {
                "title": "Threshold",
                "value": "{{threshold}}",
                "short": true
              },
              {
                "title": "Change",
                "value": "{{change}}",
                "short": true
              }
            ]
          }
        ]
      }`,
      variables: ['title', 'color', 'message', 'currentSize', 'threshold', 'change'],
    });

    // Email template
    this.templates.set('email', {
      type: 'email',
      template: `
Bundle Size Alert: {{title}}

{{message}}

Current Metrics:
- Size: {{currentSize}}
- Threshold: {{threshold}}
- Change: {{change}}

Recommendations:
{{recommendations}}

This alert was generated on {{timestamp}}.
      `,
      variables: ['title', 'message', 'currentSize', 'threshold', 'change', 'recommendations', 'timestamp'],
    });

    // Discord template
    this.templates.set('discord', {
      type: 'discord',
      template: `{
        "embeds": [
          {
            "title": "🚨 Bundle Alert: {{title}}",
            "description": "{{message}}",
            "color": {{color}},
            "fields": [
              {
                "name": "Current Size",
                "value": "{{currentSize}}",
                "inline": true
              },
              {
                "name": "Threshold",
                "value": "{{threshold}}",
                "inline": true
              },
              {
                "name": "Change",
                "value": "{{change}}",
                "inline": true
              }
            ],
            "timestamp": "{{timestamp}}"
          }
        ]
      }`,
      variables: ['title', 'message', 'color', 'currentSize', 'threshold', 'change', 'timestamp'],
    });
  }

  async processBundleMetrics(metrics: any): Promise<void> {
    if (!this.alertConfig.enabled) return;

    console.log('📊 Processing bundle metrics for alerts...');

    // Check for various alert conditions
    await this.checkBundleSizeIncrease(metrics);
    await this.checkBudgetViolations(metrics);
    await this.checkPerformanceDegradation(metrics);
    await this.checkNewRecommendations(metrics);

    // Clean up old alerts
    this.cleanupOldAlerts();
  }

  private async checkBundleSizeIncrease(metrics: any): Promise<void> {
    const previousMetrics = this.getPreviousMetrics();
    if (!previousMetrics) return;

    const sizeIncrease = ((metrics.bundleSize - previousMetrics.bundleSize) / previousMetrics.bundleSize) * 100;

    if (sizeIncrease > this.alertConfig.thresholds.bundleSizeIncrease) {
      const alert: BundleAlert = {
        id: `size-increase-${Date.now()}`,
        timestamp: new Date(),
        type: 'size-increase',
        severity: this.calculateSeverity(sizeIncrease),
        title: 'Bundle Size Increase Detected',
        message: `Bundle size has increased by ${sizeIncrease.toFixed(1)}% compared to the previous build.`,
        metrics: {
          current: metrics.bundleSize,
          previous: previousMetrics.bundleSize,
          threshold: this.alertConfig.thresholds.bundleSizeIncrease,
          percentage: sizeIncrease,
        },
        recommendations: [
          'Review recent code changes for large additions',
          'Check if new dependencies were added',
          'Consider code splitting for large components',
          'Enable tree shaking for unused code',
        ],
        resolved: false,
        channelsSent: [],
      };

      await this.triggerAlert(alert);
    }
  }

  private async checkBudgetViolations(metrics: any): Promise<void> {
    if (!this.alertConfig.thresholds.budgetExceeded) return;

    if (metrics.budgetStatus === 'fail' || metrics.budgetStatus === 'warning') {
      const alert: BundleAlert = {
        id: `budget-violation-${Date.now()}`,
        timestamp: new Date(),
        type: 'budget-exceeded',
        severity: metrics.budgetStatus === 'fail' ? 'error' : 'warning',
        title: 'Performance Budget Violation',
        message: `Bundle has ${metrics.budgetStatus}ed the performance budget.`,
        metrics: {
          current: metrics.bundleSize,
          previous: 0,
          threshold: 0, // Would get from budget config
          percentage: 0,
        },
        recommendations: [
          'Apply immediate optimization techniques',
          'Consider lazy loading non-critical components',
          'Review and remove unused dependencies',
          'Enable aggressive compression',
        ],
        resolved: false,
        channelsSent: [],
      };

      await this.triggerAlert(alert);
    }
  }

  private async checkPerformanceDegradation(metrics: any): Promise<void> {
    const previousMetrics = this.getPreviousMetrics();
    if (!previousMetrics || !metrics.performanceScore) return;

    const scoreDrop = previousMetrics.performanceScore - metrics.performanceScore;

    if (scoreDrop > this.alertConfig.thresholds.performanceScoreDrop) {
      const alert: BundleAlert = {
        id: `performance-degradation-${Date.now()}`,
        timestamp: new Date(),
        type: 'performance-degradation',
        severity: this.calculateSeverity(scoreDrop),
        title: 'Performance Score Degradation',
        message: `Performance score has dropped by ${scoreDrop} points.`,
        metrics: {
          current: metrics.performanceScore,
          previous: previousMetrics.performanceScore,
          threshold: this.alertConfig.thresholds.performanceScoreDrop,
          percentage: (scoreDrop / previousMetrics.performanceScore) * 100,
        },
        recommendations: [
          'Investigate performance bottlenecks',
          'Profile the application for slow components',
          'Check for memory leaks or inefficient code',
          'Consider performance testing integration',
        ],
        resolved: false,
        channelsSent: [],
      };

      await this.triggerAlert(alert);
    }
  }

  private async checkNewRecommendations(metrics: any): Promise<void> {
    if (!metrics.recommendations || metrics.recommendations.length <= this.alertConfig.thresholds.newRecommendations) return;

    const alert: BundleAlert = {
      id: `new-recommendations-${Date.now()}`,
      timestamp: new Date(),
      type: 'new-issues',
      severity: 'info',
      title: 'New Optimization Opportunities',
      message: `${metrics.recommendations.length} new optimization recommendations are available.`,
      metrics: {
        current: metrics.recommendations.length,
        previous: 0,
        threshold: this.alertConfig.thresholds.newRecommendations,
        percentage: 0,
      },
      recommendations: metrics.recommendations.slice(0, 5).map((rec: any) => rec.description),
      resolved: false,
      channelsSent: [],
    };

    await this.triggerAlert(alert);
  }

  private calculateSeverity(value: number): BundleAlert['severity'] {
    if (value > 50) return 'critical';
    if (value > 25) return 'error';
    if (value > 15) return 'warning';
    return 'info';
  }

  private async triggerAlert(alert: BundleAlert): Promise<void> {
    // Check cooldown period
    const alertKey = alert.type;
    const lastAlert = this.lastAlertTime.get(alertKey);

    if (lastAlert) {
      const timeSinceLastAlert = (Date.now() - lastAlert.getTime()) / (1000 * 60); // minutes
      if (timeSinceLastAlert < this.alertConfig.cooldown) {
        console.log(`⏰ Alert ${alert.type} is in cooldown period`);
        return;
      }
    }

    console.log(`🚨 Triggering alert: ${alert.title}`);

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.lastAlertTime.set(alertKey, new Date());

    // Send to configured channels
    for (const channel of this.alertConfig.channels) {
      if (channel.enabled) {
        try {
          await this.sendToChannel(alert, channel);
          alert.channelsSent.push(channel.type);
        } catch (error) {
          console.error(`Failed to send alert to ${channel.type}:`, error);
        }
      }
    }

    // Save alert to file
    this.saveAlert(alert);
  }

  private async sendToChannel(alert: BundleAlert, channel: AlertChannel): Promise<void> {
    const template = this.templates.get(channel.type);
    if (!template) {
      throw new Error(`No template found for channel type: ${channel.type}`);
    }

    const payload = this.renderTemplate(template, alert);

    switch (channel.type) {
      case 'webhook':
        await this.sendWebhook(channel.config.url, payload);
        break;
      case 'slack':
        await this.sendSlackWebhook(channel.config.webhookUrl, payload);
        break;
      case 'discord':
        await this.sendDiscordWebhook(channel.config.webhookUrl, payload);
        break;
      case 'email':
        await this.sendEmail(channel.config, payload);
        break;
      default:
        console.warn(`Unknown channel type: ${channel.type}`);
    }
  }

  private renderTemplate(template: NotificationTemplate, alert: BundleAlert): any {
    let content = template.template;

    // Replace template variables
    const variables = {
      title: alert.title,
      message: alert.message,
      currentSize: this.formatSize(alert.metrics.current),
      threshold: alert.metrics.threshold > 0 ? this.formatSize(alert.metrics.threshold) : `${alert.metrics.threshold}%`,
      change: `${alert.metrics.percentage.toFixed(1)}%`,
      recommendations: alert.recommendations.join('\n- '),
      timestamp: alert.timestamp.toISOString(),
      color: this.getSeverityColor(alert.severity),
    };

    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // Try to parse as JSON for webhook templates
    if (template.type === 'slack' || template.type === 'discord') {
      try {
        return JSON.parse(content);
      } catch {
        return { text: content };
      }
    }

    return content;
  }

  private getSeverityColor(severity: BundleAlert['severity']): number {
    switch (severity) {
      case 'critical': return 0xFF0000;  // Red
      case 'error': return 0xFF6600;     // Orange
      case 'warning': return 0xFFFF00;   // Yellow
      case 'info': return 0x00FF00;      // Green
      default: return 0x808080;          // Gray
    }
  }

  private async sendWebhook(url: string, payload: any): Promise<void> {
    // This would send HTTP request to webhook
    console.log(`📡 Sending webhook to ${url}`);
  }

  private async sendSlackWebhook(webhookUrl: string, payload: any): Promise<void> {
    // This would send to Slack webhook
    console.log('💬 Sending Slack notification');
  }

  private async sendDiscordWebhook(webhookUrl: string, payload: any): Promise<void> {
    // This would send to Discord webhook
    console.log('🎮 Sending Discord notification');
  }

  private async sendEmail(config: any, payload: string): Promise<void> {
    // This would send email using nodemailer or similar
    console.log(`📧 Sending email to ${config.to}`);
  }

  private saveAlert(alert: BundleAlert): void {
    const alertPath = join(this.projectRoot, '.bundle-alerts', `${alert.id}.json`);
    writeFileSync(alertPath, JSON.stringify(alert, null, 2));
  }

  private cleanupOldAlerts(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep alerts for 7 days

    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.timestamp < cutoffDate) {
        this.activeAlerts.delete(id);
      }
    }
  }

  private getPreviousMetrics(): any {
    // This would get previous metrics from storage
    // For now, return null
    return null;
  }

  async generateReport(type: BundleReport['type'] = 'build'): Promise<BundleReport> {
    console.log(`📋 Generating ${type} bundle report...`);

    const report: BundleReport = {
      id: `${type}-${Date.now()}`,
      timestamp: new Date(),
      type,
      summary: await this.generateSummary(),
      trends: await this.generateTrends(),
      recommendations: await this.generateRecommendations(),
      budgetAnalysis: await this.generateBudgetAnalysis(),
      alerts: Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved),
    };

    // Save report
    this.saveReport(report);
    this.reportHistory.push(report);

    // Generate reports in different formats
    for (const format of this.reportConfig.formats) {
      await this.exportReport(report, format);
    }

    return report;
  }

  private async generateSummary(): Promise<BundleReport['summary']> {
    // This would generate summary from current metrics
    return {
      totalSize: 850 * 1024,      // 850KB
      gzippedSize: 180 * 1024,    // 180KB
      optimizationSavings: 50 * 1024, // 50KB
      budgetStatus: 'pass',
      performanceScore: 85,
      issuesCount: this.activeAlerts.size,
    };
  }

  private async generateTrends(): Promise<BundleReport['trends']> {
    return [
      {
        metric: 'Bundle Size',
        direction: 'down',
        change: -5.2,
        period: '7 days',
      },
      {
        metric: 'Performance Score',
        direction: 'up',
        change: 3.1,
        period: '7 days',
      },
    ];
  }

  private async generateRecommendations(): Promise<BundleReport['recommendations']> {
    return [
      {
        type: 'code-splitting',
        priority: 'high',
        description: 'Implement dynamic imports for large components',
        estimatedSavings: 100 * 1024,
      },
      {
        type: 'image-optimization',
        priority: 'medium',
        description: 'Convert images to WebP format',
        estimatedSavings: 50 * 1024,
      },
    ];
  }

  private async generateBudgetAnalysis(): Promise<BundleReport['budgetAnalysis']> {
    return {
      categories: [
        {
          name: 'JavaScript',
          budget: 500 * 1024,
          actual: 420 * 1024,
          status: 'within-budget',
        },
        {
          name: 'CSS',
          budget: 100 * 1024,
          actual: 85 * 1024,
          status: 'within-budget',
        },
      ],
      violations: [],
    };
  }

  private saveReport(report: BundleReport): void {
    const reportPath = join(this.projectRoot, '.bundle-reports', `${report.id}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  private async exportReport(report: BundleReport, format: string): Promise<void> {
    const outputPath = join(this.projectRoot, '.bundle-reports');

    switch (format) {
      case 'json':
        // JSON already saved in saveReport
        break;
      case 'markdown':
        await this.exportMarkdownReport(report, outputPath);
        break;
      case 'html':
        await this.exportHTMLReport(report, outputPath);
        break;
      case 'pdf':
        await this.exportPDFReport(report, outputPath);
        break;
    }
  }

  private async exportMarkdownReport(report: BundleReport, outputPath: string): Promise<void> {
    let markdown = `# Bundle Optimization Report\n\n`;
    markdown += `**Generated:** ${report.timestamp.toISOString()}\n`;
    markdown += `**Type:** ${report.type}\n\n`;

    markdown += `## Summary\n`;
    markdown += `- **Total Size:** ${this.formatSize(report.summary.totalSize)}\n`;
    markdown += `- **Gzipped Size:** ${this.formatSize(report.summary.gzippedSize)}\n`;
    markdown += `- **Optimization Savings:** ${this.formatSize(report.summary.optimizationSavings)}\n`;
    markdown += `- **Budget Status:** ${report.summary.budgetStatus}\n`;
    markdown += `- **Performance Score:** ${report.summary.performanceScore}/100\n`;
    markdown += `- **Active Issues:** ${report.summary.issuesCount}\n\n`;

    if (report.recommendations.length > 0) {
      markdown += `## Recommendations\n`;
      report.recommendations.forEach((rec, index) => {
        markdown += `\n### ${index + 1}. ${rec.type} (${rec.priority})\n`;
        markdown += `${rec.description}\n`;
        markdown += `**Estimated Savings:** ${this.formatSize(rec.estimatedSavings)}\n`;
      });
    }

    const filename = join(outputPath, `${report.id}.md`);
    writeFileSync(filename, markdown);
  }

  private async exportHTMLReport(report: BundleReport, outputPath: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Bundle Optimization Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .status-pass { color: #059669; }
        .status-warning { color: #d97706; }
        .status-fail { color: #dc2626; }
        .recommendation { margin: 10px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f8fafc; }
        .high-priority { border-left-color: #dc2626; }
        .medium-priority { border-left-color: #d97706; }
        .low-priority { border-left-color: #059669; }
    </style>
</head>
<body>
    <h1>Bundle Optimization Report</h1>
    <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
    <p><strong>Type:</strong> ${report.type}</p>

    <div class="summary">
        <div class="metric">
            <div>Total Size</div>
            <div class="metric-value">${this.formatSize(report.summary.totalSize)}</div>
        </div>
        <div class="metric">
            <div>Gzipped Size</div>
            <div class="metric-value">${this.formatSize(report.summary.gzippedSize)}</div>
        </div>
        <div class="metric">
            <div>Optimization Savings</div>
            <div class="metric-value">${this.formatSize(report.summary.optimizationSavings)}</div>
        </div>
        <div class="metric">
            <div>Performance Score</div>
            <div class="metric-value">${report.summary.performanceScore}/100</div>
        </div>
        <div class="metric">
            <div>Budget Status</div>
            <div class="metric-value status-${report.summary.budgetStatus}">${report.summary.budgetStatus.toUpperCase()}</div>
        </div>
    </div>

    ${report.recommendations.length > 0 ? `
    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
        <div class="recommendation ${rec.priority}-priority">
            <strong>${rec.type} (${rec.priority})</strong><br>
            ${rec.description}<br>
            <em>Estimated savings: ${this.formatSize(rec.estimatedSavings)}</em>
        </div>
    `).join('')}
    ` : ''}

    ${report.alerts.length > 0 ? `
    <h2>Active Alerts</h2>
    ${report.alerts.map(alert => `
        <div class="recommendation ${alert.severity}-priority">
            <strong>${alert.title}</strong><br>
            ${alert.message}
        </div>
    `).join('')}
    ` : ''}
</body>
</html>`;

    const filename = join(outputPath, `${report.id}.html`);
    writeFileSync(filename, html);
  }

  private async exportPDFReport(report: BundleReport, outputPath: string): Promise<void> {
    // This would generate PDF using a library like puppeteer
    console.log('📄 PDF export not implemented yet');
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

  // Public API methods
  getActiveAlerts(): BundleAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.saveAlert(alert);
    }
  }

  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
  }

  updateReportConfig(config: Partial<ReportConfig>): void {
    this.reportConfig = { ...this.reportConfig, ...config };
  }

  getReportHistory(): BundleReport[] {
    return this.reportHistory;
  }
}

export {
  BundleReportingSystem,
  type AlertConfig,
  type AlertChannel,
  type BundleAlert,
  type ReportConfig,
  type BundleReport,
  type NotificationTemplate,
};
