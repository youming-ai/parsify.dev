/**
 * Comprehensive test reporting script
 * Generates detailed test reports with analytics and insights
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TestResults {
  unit: TestSuiteResult;
  integration: TestSuiteResult;
  e2e: TestSuiteResult;
  performance: PerformanceResult;
  accessibility: AccessibilityResult;
}

interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: CoverageData;
  duration: number;
  errors: TestError[];
}

interface CoverageData {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  files: CoverageFile[];
}

interface CoverageFile {
  path: string;
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  uncoveredLines: number[];
}

interface PerformanceResult {
  metrics: PerformanceMetric[];
  budgets: BudgetResult[];
  scores: PerformanceScores;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  passed: boolean;
}

interface BudgetResult {
  name: string;
  actual: number;
  budget: number;
  passed: boolean;
  variance: number;
}

interface PerformanceScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

interface AccessibilityResult {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  score: number;
  wcagLevel: string;
}

interface AccessibilityViolation {
  rule: string;
  impact: string;
  elements: string[];
  description: string;
}

interface TestError {
  test: string;
  error: string;
  stack?: string;
}

interface ReportData {
  timestamp: string;
  commit: string;
  branch: string;
  buildNumber: number;
  results: TestResults;
  summary: TestSummary;
  trends: TestTrends;
  recommendations: Recommendation[];
}

interface TestSummary {
  totalTests: number;
  passRate: number;
  coverageRate: number;
  performanceScore: number;
  accessibilityScore: number;
  overallGrade: string;
}

interface TestTrends {
  coverageTrend: TrendData[];
  performanceTrend: TrendData[];
  reliabilityTrend: TrendData[];
}

interface TrendData {
  date: string;
  value: number;
  change: number;
}

interface Recommendation {
  type: 'coverage' | 'performance' | 'accessibility' | 'reliability';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

class TestReportGenerator {
  private outputDir: string;
  private reportData: Partial<ReportData>;

  constructor(outputDir: string = './test-results') {
    this.outputDir = outputDir;
    this.reportData = {};
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateReport(): Promise<void> {
    console.log('🚀 Generating comprehensive test report...');

    // Collect test results
    await this.collectTestResults();

    // Generate analysis
    await this.generateAnalysis();

    // Create reports in different formats
    await this.createHtmlReport();
    await this.createMarkdownReport();
    await this.createJsonReport();
    await this.createPdfReport();

    console.log('✅ Test report generated successfully!');
    console.log(`📊 HTML Report: ${path.join(this.outputDir, 'report.html')}`);
    console.log(`📄 Markdown Report: ${path.join(this.outputDir, 'report.md')}`);
    console.log(`📋 JSON Report: ${path.join(this.outputDir, 'report.json')}`);
  }

  private async collectTestResults(): Promise<void> {
    console.log('📊 Collecting test results...');

    // Get git information
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const buildNumber = process.env.BUILD_NUMBER || Date.now().toString();

    this.reportData = {
      timestamp: new Date().toISOString(),
      commit,
      branch,
      buildNumber: parseInt(buildNumber),
      results: {
        unit: await this.collectUnitTestResults(),
        integration: await this.collectIntegrationTestResults(),
        e2e: await this.collectE2ETestResults(),
        performance: await this.collectPerformanceResults(),
        accessibility: await this.collectAccessibilityResults(),
      },
    };

    console.log('✅ Test results collected');
  }

  private async collectUnitTestResults(): Promise<TestSuiteResult> {
    try {
      const coverageData = await this.parseCoverageData();
      const testResults = await this.parseUnitTestResults();

      return {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        skipped: testResults.skipped,
        coverage: coverageData,
        duration: testResults.duration,
        errors: testResults.errors,
      };
    } catch (error) {
      console.warn('Could not collect unit test results:', error);
      return this.getEmptyTestSuiteResult();
    }
  }

  private async collectIntegrationTestResults(): Promise<TestSuiteResult> {
    // Similar implementation for integration tests
    return this.getEmptyTestSuiteResult();
  }

  private async collectE2ETestResults(): Promise<TestSuiteResult> {
    // Similar implementation for E2E tests
    return this.getEmptyTestSuiteResult();
  }

  private async collectPerformanceResults(): Promise<PerformanceResult> {
    try {
      const lighthouseData = await this.parseLighthouseData();
      const budgetData = await this.parseBudgetData();

      return {
        metrics: lighthouseData.metrics,
        budgets: budgetData,
        scores: lighthouseData.scores,
      };
    } catch (error) {
      console.warn('Could not collect performance results:', error);
      return {
        metrics: [],
        budgets: [],
        scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0, pwa: 0 },
      };
    }
  }

  private async collectAccessibilityResults(): Promise<AccessibilityResult> {
    try {
      const axeData = await this.parseAxeData();

      return {
        violations: axeData.violations,
        passes: axeData.passes,
        incomplete: axeData.incomplete,
        score: this.calculateAccessibilityScore(axeData),
        wcagLevel: 'AA',
      };
    } catch (error) {
      console.warn('Could not collect accessibility results:', error);
      return {
        violations: [],
        passes: 0,
        incomplete: 0,
        score: 0,
        wcagLevel: 'AA',
      };
    }
  }

  private async generateAnalysis(): Promise<void> {
    console.log('🔍 Generating analysis...');

    const results = this.reportData.results!;
    const summary = this.calculateSummary(results);
    const trends = await this.calculateTrends();
    const recommendations = this.generateRecommendations(results);

    this.reportData.summary = summary;
    this.reportData.trends = trends;
    this.reportData.recommendations = recommendations;

    console.log('✅ Analysis completed');
  }

  private calculateSummary(results: TestResults): TestSummary {
    const totalTests = results.unit.total + results.integration.total + results.e2e.total;
    const totalPassed = results.unit.passed + results.integration.passed + results.e2e.passed;
    const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const avgCoverage = (
      results.unit.coverage.lines +
      results.unit.coverage.functions +
      results.unit.coverage.branches +
      results.unit.coverage.statements
    ) / 4;

    const overallScore = (
      (passRate * 0.3) +
      (avgCoverage * 0.3) +
      (results.performance.scores.performance * 0.2) +
      (results.accessibility.score * 0.2)
    );

    return {
      totalTests,
      passRate,
      coverageRate: avgCoverage,
      performanceScore: results.performance.scores.performance,
      accessibilityScore: results.accessibility.score,
      overallGrade: this.calculateGrade(overallScore),
    };
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private async calculateTrends(): Promise<TestTrends> {
    // This would analyze historical data
    // For now, return empty trends
    return {
      coverageTrend: [],
      performanceTrend: [],
      reliabilityTrend: [],
    };
  }

  private generateRecommendations(results: TestResults): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Coverage recommendations
    if (results.unit.coverage.lines < 80) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        title: 'Increase Test Coverage',
        description: `Current line coverage is ${results.unit.coverage.lines}%. Aim for 80% or higher.`,
        action: 'Add tests for uncovered files and increase coverage in existing test files.',
      });
    }

    // Performance recommendations
    const perfScore = results.performance.scores.performance;
    if (perfScore < 90) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Improve Performance Score',
        description: `Current Lighthouse performance score is ${perfScore}. Target is 90+.`,
        action: 'Optimize bundle size, reduce server response time, and improve Core Web Vitals.',
      });
    }

    // Accessibility recommendations
    if (results.accessibility.score < 95) {
      recommendations.push({
        type: 'accessibility',
        priority: 'high',
        title: 'Fix Accessibility Issues',
        description: `Current accessibility score is ${results.accessibility.score}. Fix violations to improve compliance.`,
        action: 'Address accessibility violations found in axe-core testing.',
      });
    }

    // Reliability recommendations
    const totalFailures = results.unit.failed + results.integration.failed + results.e2e.failed;
    if (totalFailures > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Fix Failing Tests',
        description: `${totalFailures} tests are currently failing.`,
        action: 'Review and fix failing tests to ensure reliability.',
      });
    }

    return recommendations;
  }

  private async createHtmlReport(): Promise<void> {
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parsify.dev Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .summary-card .grade { font-size: 1.5em; font-weight: bold; padding: 10px; border-radius: 50%; text-align: center; }
        .grade.A { background: #28a745; color: white; }
        .grade.B { background: #ffc107; color: #000; }
        .grade.C { background: #fd7e14; color: white; }
        .grade.D { background: #dc3545; color: white; }
        .grade.F { background: #6c757d; color: white; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; font-weight: 600; }
        .pass { color: #28a745; font-weight: bold; }
        .fail { color: #dc3545; font-weight: bold; }
        .skip { color: #ffc107; font-weight: bold; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; }
        .recommendation { margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #007bff; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #28a745; }
        .metadata { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 40px; }
        .metadata dt { font-weight: bold; color: #333; }
        .metadata dd { margin: 5px 0 15px 0; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Report</h1>
            <p>Generated on ${this.reportData.timestamp}</p>
        </div>

        <div class="content">
            ${this.renderSummarySection()}
            ${this.renderTestSuitesSection()}
            ${this.renderCoverageSection()}
            ${this.renderPerformanceSection()}
            ${this.renderAccessibilitySection()}
            ${this.renderRecommendationsSection()}
            ${this.renderMetadataSection()}
        </div>
    </div>

    <script>
        ${this.renderChartScripts()}
    </script>
</body>
</html>`;

    const htmlPath = path.join(this.outputDir, 'report.html');
    fs.writeFileSync(htmlPath, template);
  }

  private renderSummarySection(): string {
    const summary = this.reportData.summary!;

    return `
        <div class="section">
            <h2>📊 Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Overall Grade</h3>
                    <div class="grade ${summary.overallGrade}">${summary.overallGrade}</div>
                </div>
                <div class="summary-card">
                    <h3>Pass Rate</h3>
                    <div class="value">${summary.passRate.toFixed(1)}%</div>
                </div>
                <div class="summary-card">
                    <h3>Code Coverage</h3>
                    <div class="value">${summary.coverageRate.toFixed(1)}%</div>
                </div>
                <div class="summary-card">
                    <h3>Performance Score</h3>
                    <div class="value">${summary.performanceScore.toFixed(0)}</div>
                </div>
                <div class="summary-card">
                    <h3>Accessibility Score</h3>
                    <div class="value">${summary.accessibilityScore.toFixed(0)}</div>
                </div>
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div class="value">${summary.totalTests}</div>
                </div>
            </div>
        </div>`;
  }

  private renderTestSuitesSection(): string {
    const results = this.reportData.results!;

    return `
        <div class="section">
            <h2>🧪 Test Suites</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Test Suite</th>
                        <th>Total</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Skipped</th>
                        <th>Duration</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Unit Tests</td>
                        <td>${results.unit.total}</td>
                        <td class="pass">${results.unit.passed}</td>
                        <td class="fail">${results.unit.failed}</td>
                        <td class="skip">${results.unit.skipped}</td>
                        <td>${(results.unit.duration / 1000).toFixed(2)}s</td>
                        <td>${((results.unit.passed / results.unit.total) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Integration Tests</td>
                        <td>${results.integration.total}</td>
                        <td class="pass">${results.integration.passed}</td>
                        <td class="fail">${results.integration.failed}</td>
                        <td class="skip">${results.integration.skipped}</td>
                        <td>${(results.integration.duration / 1000).toFixed(2)}s</td>
                        <td>${((results.integration.passed / results.integration.total) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>E2E Tests</td>
                        <td>${results.e2e.total}</td>
                        <td class="pass">${results.e2e.passed}</td>
                        <td class="fail">${results.e2e.failed}</td>
                        <td class="skip">${results.e2e.skipped}</td>
                        <td>${(results.e2e.duration / 1000).toFixed(2)}s</td>
                        <td>${((results.e2e.passed / results.e2e.total) * 100).toFixed(1)}%</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
  }

  private renderCoverageSection(): string {
    const coverage = this.reportData.results!.unit.coverage;

    return `
        <div class="section">
            <h2>📈 Code Coverage</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Lines</h3>
                    <div class="value">${coverage.lines}%</div>
                </div>
                <div class="summary-card">
                    <h3>Functions</h3>
                    <div class="value">${coverage.functions}%</div>
                </div>
                <div class="summary-card">
                    <h3>Branches</h3>
                    <div class="value">${coverage.branches}%</div>
                </div>
                <div class="summary-card">
                    <h3>Statements</h3>
                    <div class="value">${coverage.statements}%</div>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="coverageChart"></canvas>
            </div>
        </div>`;
  }

  private renderPerformanceSection(): string {
    const perf = this.reportData.results!.performance;

    return `
        <div class="section">
            <h2>⚡ Performance</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Performance Score</h3>
                    <div class="value">${perf.scores.performance.toFixed(0)}</div>
                </div>
                <div class="summary-card">
                    <h3>Best Practices</h3>
                    <div class="value">${perf.scores.bestPractices.toFixed(0)}</div>
                </div>
                <div class="summary-card">
                    <h3>SEO</h3>
                    <div class="value">${perf.scores.seo.toFixed(0)}</div>
                </div>
                <div class="summary-card">
                    <h3>PWA</h3>
                    <div class="value">${perf.scores.pwa.toFixed(0)}</div>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="performanceChart"></canvas>
            </div>
        </div>`;
  }

  private renderAccessibilitySection(): string {
    const a11y = this.reportData.results!.accessibility;

    return `
        <div class="section">
            <h2>♿ Accessibility</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Accessibility Score</h3>
                    <div class="value">${a11y.score.toFixed(0)}</div>
                </div>
                <div class="summary-card">
                    <h3>Violations</h3>
                    <div class="value">${a11y.violations.length}</div>
                </div>
                <div class="summary-card">
                    <h3>Passes</h3>
                    <div class="value">${a11y.passes}</div>
                </div>
                <div class="summary-card">
                    <h3>WCAG Level</h3>
                    <div class="value">${a11y.wcagLevel}</div>
                </div>
            </div>
            ${a11y.violations.length > 0 ? this.renderAccessibilityViolations(a11y.violations) : ''}
        </div>`;
  }

  private renderAccessibilityViolations(violations: AccessibilityViolation[]): string {
    return `
        <h3>Accessibility Violations</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Rule</th>
                    <th>Impact</th>
                    <th>Elements Affected</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${violations.map(v => `
                    <tr>
                        <td>${v.rule}</td>
                        <td class="${v.impact === 'critical' ? 'fail' : v.impact === 'serious' ? 'fail' : 'skip'}">${v.impact}</td>
                        <td>${v.elements.length}</td>
                        <td>${v.description}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
  }

  private renderRecommendationsSection(): string {
    const recommendations = this.reportData.recommendations!;

    if (recommendations.length === 0) {
      return `
        <div class="section">
            <h2>💡 Recommendations</h2>
            <p>Great job! No specific recommendations at this time.</p>
        </div>`;
    }

    return `
        <div class="section">
            <h2>💡 Recommendations</h2>
            <div class="recommendations">
                ${recommendations.map(rec => `
                    <div class="recommendation priority-${rec.priority}">
                        <h4>${rec.title}</h4>
                        <p>${rec.description}</p>
                        <strong>Action:</strong> ${rec.action}
                    </div>
                `).join('')}
            </div>
        </div>`;
  }

  private renderMetadataSection(): string {
    return `
        <div class="section">
            <div class="metadata">
                <h2>📋 Metadata</h2>
                <dl>
                    <dt>Generated</dt>
                    <dd>${this.reportData.timestamp}</dd>
                    <dt>Commit</dt>
                    <dd>${this.reportData.commit}</dd>
                    <dt>Branch</dt>
                    <dd>${this.reportData.branch}</dd>
                    <dt>Build Number</dt>
                    <dd>${this.reportData.buildNumber}</dd>
                </dl>
            </div>
        </div>`;
  }

  private renderChartScripts(): string {
    const coverage = this.reportData.results!.unit.coverage;
    const perf = this.reportData.results!.performance.scores;

    return `
        // Coverage Chart
        const coverageCtx = document.getElementById('coverageChart').getContext('2d');
        new Chart(coverageCtx, {
            type: 'bar',
            data: {
                labels: ['Lines', 'Functions', 'Branches', 'Statements'],
                datasets: [{
                    label: 'Coverage %',
                    data: [${coverage.lines}, ${coverage.functions}, ${coverage.branches}, ${coverage.statements}],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Performance Chart
        const perfCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(perfCtx, {
            type: 'radar',
            data: {
                labels: ['Performance', 'Accessibility', 'Best Practices', 'SEO', 'PWA'],
                datasets: [{
                    label: 'Lighthouse Scores',
                    data: [${perf.performance}, ${perf.accessibility}, ${perf.bestPractices}, ${perf.seo}, ${perf.pwa}],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });`;
  }

  private async createMarkdownReport(): Promise<void> {
    const summary = this.reportData.summary!;
    const results = this.reportData.results!;
    const recommendations = this.reportData.recommendations!;

    const markdown = `
# 🧪 Test Report

**Generated on:** ${this.reportData.timestamp}
**Commit:** ${this.reportData.commit}
**Branch:** ${this.reportData.branch}

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Overall Grade** | ${summary.overallGrade} |
| **Pass Rate** | ${summary.passRate.toFixed(1)}% |
| **Code Coverage** | ${summary.coverageRate.toFixed(1)}% |
| **Performance Score** | ${summary.performanceScore.toFixed(0)}/100 |
| **Accessibility Score** | ${summary.accessibilityScore.toFixed(0)}/100 |
| **Total Tests** | ${summary.totalTests} |

## 🧪 Test Suites

| Test Suite | Total | Passed | Failed | Skipped | Duration | Success Rate |
|------------|-------|--------|--------|---------|----------|--------------|
| Unit Tests | ${results.unit.total} | ${results.unit.passed} | ${results.unit.failed} | ${results.unit.skipped} | ${(results.unit.duration / 1000).toFixed(2)}s | ${((results.unit.passed / results.unit.total) * 100).toFixed(1)}% |
| Integration Tests | ${results.integration.total} | ${results.integration.passed} | ${results.integration.failed} | ${results.integration.skipped} | ${(results.integration.duration / 1000).toFixed(2)}s | ${((results.integration.passed / results.integration.total) * 100).toFixed(1)}% |
| E2E Tests | ${results.e2e.total} | ${results.e2e.passed} | ${results.e2e.failed} | ${results.e2e.skipped} | ${(results.e2e.duration / 1000).toFixed(2)}s | ${((results.e2e.passed / results.e2e.total) * 100).toFixed(1)}% |

## 📈 Code Coverage

- **Lines:** ${results.unit.coverage.lines}%
- **Functions:** ${results.unit.coverage.functions}%
- **Branches:** ${results.unit.coverage.branches}%
- **Statements:** ${results.unit.coverage.statements}%

## ⚡ Performance

- **Performance Score:** ${results.performance.scores.performance.toFixed(0)}/100
- **Best Practices:** ${results.performance.scores.bestPractices.toFixed(0)}/100
- **SEO:** ${results.performance.scores.seo.toFixed(0)}/100
- **PWA:** ${results.performance.scores.pwa.toFixed(0)}/100

## ♿ Accessibility

- **Overall Score:** ${results.accessibility.score.toFixed(0)}/100
- **Violations:** ${results.accessibility.violations.length}
- **Passes:** ${results.accessibility.passes}
- **WCAG Level:** ${results.accessibility.wcagLevel}

${results.accessibility.violations.length > 0 ? `
### Accessibility Violations

${results.accessibility.violations.map(v => `
- **${v.rule}** (${v.impact}): ${v.description}
`).join('')}
` : ''}

## 💡 Recommendations

${recommendations.length === 0 ?
  'Great job! No specific recommendations at this time.' :
  recommendations.map(rec => `
### ${rec.title} (${rec.priority})

${rec.description}

**Action:** ${rec.action}
`).join('')
}

## 📋 Metadata

- **Generated:** ${this.reportData.timestamp}
- **Commit:** ${this.reportData.commit}
- **Branch:** ${this.reportData.branch}
- **Build Number:** ${this.reportData.buildNumber}
`;

    const markdownPath = path.join(this.outputDir, 'report.md');
    fs.writeFileSync(markdownPath, markdown);
  }

  private async createJsonReport(): Promise<void> {
    const jsonPath = path.join(this.outputDir, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.reportData, null, 2));
  }

  private async createPdfReport(): Promise<void> {
    // PDF generation would require additional dependencies like Puppeteer
    // For now, we'll create a placeholder
    const pdfPath = path.join(this.outputDir, 'report.pdf');
    fs.writeFileSync(pdfPath, 'PDF generation not implemented yet. See HTML or Markdown reports.');
  }

  private getEmptyTestSuiteResult(): TestSuiteResult {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: { lines: 0, functions: 0, branches: 0, statements: 0, files: [] },
      duration: 0,
      errors: [],
    };
  }

  private async parseCoverageData(): Promise<CoverageData> {
    try {
      const coveragePath = path.join(this.outputDir, '../coverage/coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return {
          lines: coverageData.total.lines.pct,
          functions: coverageData.total.functions.pct,
          branches: coverageData.total.branches.pct,
          statements: coverageData.total.statements.pct,
          files: [],
        };
      }
    } catch (error) {
      console.warn('Could not parse coverage data:', error);
    }
    return { lines: 0, functions: 0, branches: 0, statements: 0, files: [] };
  }

  private async parseUnitTestResults(): Promise<any> {
    // Parse unit test results from Vitest JSON output
    try {
      const resultsPath = path.join(this.outputDir, 'results.json');
      if (fs.existsSync(resultsPath)) {
        return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not parse unit test results:', error);
    }
    return { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0, errors: [] };
  }

  private async parseLighthouseData(): Promise<any> {
    // Parse Lighthouse results
    try {
      const lighthousePath = path.join(this.outputDir, '../.lighthouseci/lhr-report.json');
      if (fs.existsSync(lighthousePath)) {
        const lighthouseData = JSON.parse(fs.readFileSync(lighthousePath, 'utf8'));
        return {
          metrics: [],
          scores: {
            performance: lighthouseData.categories.performance.score * 100,
            accessibility: lighthouseData.categories.accessibility.score * 100,
            bestPractices: lighthouseData.categories['best-practices'].score * 100,
            seo: lighthouseData.categories.seo.score * 100,
            pwa: lighthouseData.categories.pwa ? lighthouseData.categories.pwa.score * 100 : 0,
          },
        };
      }
    } catch (error) {
      console.warn('Could not parse Lighthouse data:', error);
    }
    return { metrics: [], scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0, pwa: 0 } };
  }

  private async parseBudgetData(): Promise<BudgetResult[]> {
    // Parse budget data
    return [];
  }

  private async parseAxeData(): Promise<any> {
    // Parse accessibility data
    try {
      const axePath = path.join(this.outputDir, 'axe-results.json');
      if (fs.existsSync(axePath)) {
        return JSON.parse(fs.readFileSync(axePath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not parse axe data:', error);
    }
    return { violations: [], passes: 0, incomplete: 0 };
  }

  private calculateAccessibilityScore(axeData: any): number {
    const critical = axeData.violations?.filter((v: any) => v.impact === 'critical').length || 0;
    const serious = axeData.violations?.filter((v: any) => v.impact === 'serious').length || 0;
    const moderate = axeData.violations?.filter((v: any) => v.impact === 'moderate').length || 0;
    const minor = axeData.violations?.filter((v: any) => v.impact === 'minor').length || 0;

    // Calculate score based on violation severity
    const penalty = (critical * 20) + (serious * 10) + (moderate * 5) + (minor * 1);
    return Math.max(0, 100 - penalty);
  }
}

// Execute the report generator if run directly
if (require.main === module) {
  const generator = new TestReportGenerator();
  generator.generateReport().catch(console.error);
}

export default TestReportGenerator;
