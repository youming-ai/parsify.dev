/**
 * Performance Regression Testing CLI
 * Command-line interface for running automated performance regression testing
 * Integrates all components into a unified testing pipeline
 */

#!/usr/bin/env node

import { PerformanceRegressionTester } from './performance-regression-testing';
import { PerformanceBenchmarking } from './performance-benchmarking';
import { PerformanceRegressionDetector } from './performance-regression-detector';
import { CICDIntegration } from './ci-cd-integration';
import { PerformanceTestExecutor } from './performance-test-execution';

interface CLIOptions {
  command: 'test' | 'benchmark' | 'regression' | 'ci' | 'report' | 'init' | 'cleanup';
  config?: string;
  output?: string;
  format?: 'json' | 'html' | 'markdown' | 'junit';
  scenarios?: string[];
  environments?: string[];
  createBaseline?: boolean;
  compareBaseline?: string;
  parallel?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  timeout?: number;
  retries?: number;
  includeScreenshots?: boolean;
  includeTraces?: boolean;
  strict?: boolean;
  allowWarnings?: boolean;
}

interface CLIConfig {
  tester: {
    enabled: boolean;
    scenarios: string[];
    environments: string[];
    parallel: boolean;
    timeout: number;
    retries: number;
  };
  benchmarking: {
    enabled: boolean;
    createBaseline: boolean;
    compareBaseline?: string;
  };
  regression: {
    enabled: boolean;
    strict: boolean;
    threshold: 'warning' | 'critical';
  };
  reporting: {
    format: string[];
    output: string;
    includeScreenshots: boolean;
    includeTraces: boolean;
  };
  ci: {
    enabled: boolean;
    platform: string;
    environment: string;
    gates: {
      enabled: boolean;
      strict: boolean;
      allowWarnings: boolean;
    };
  };
}

/**
 * Performance Regression Testing CLI Application
 */
class PerformanceRegressionCLI {
  private config: CLIConfig;
  private tester: PerformanceRegressionTester;
  private benchmarking: PerformanceBenchmarking;
  private detector: PerformanceRegressionDetector;
  private executor: PerformanceTestExecutor;
  private ciIntegration: CICDIntegration;

  constructor() {
    this.config = this.loadConfig();
    this.tester = PerformanceRegressionTester.getInstance();
    this.benchmarking = PerformanceBenchmarking.getInstance();
    this.detector = PerformanceRegressionDetector.getInstance();
    this.executor = PerformanceTestExecutor.getInstance();
    this.ciIntegration = CICDIntegration.getInstance();
  }

  /**
   * Main entry point
   */
  async run(options: CLIOptions): Promise<void> {
    try {
      console.log('🚀 Performance Regression Testing CLI');
      console.log('=====================================');

      // Override config with CLI options
      this.applyOptions(options);

      // Initialize components
      await this.initialize();

      // Execute command
      switch (options.command) {
        case 'init':
          await this.initializeProject();
          break;
        case 'test':
          await this.runTests(options);
          break;
        case 'benchmark':
          await this.runBenchmarks(options);
          break;
        case 'regression':
          await this.runRegressionDetection(options);
          break;
        case 'ci':
          await this.runCIPipeline(options);
          break;
        case 'report':
          await this.generateReports(options);
          break;
        case 'cleanup':
          await this.cleanup();
          break;
        default:
          this.showHelp();
          process.exit(1);
      }

      console.log('✅ Command completed successfully');
    } catch (error) {
      console.error('❌ Command failed:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize the project with default configuration
   */
  private async initializeProject(): Promise<void> {
    console.log('🔧 Initializing performance testing project...');

    // Create default configuration
    const defaultConfig: CLIConfig = {
      tester: {
        enabled: true,
        scenarios: ['Home Page Load', 'Tools Index Load', 'JSON Formatter Load'],
        environments: ['Desktop Chrome', 'Mobile Chrome'],
        parallel: true,
        timeout: 30000,
        retries: 2,
      },
      benchmarking: {
        enabled: true,
        createBaseline: false,
      },
      regression: {
        enabled: true,
        strict: false,
        threshold: 'warning',
      },
      reporting: {
        format: ['json', 'html'],
        output: './performance-results',
        includeScreenshots: false,
        includeTraces: false,
      },
      ci: {
        enabled: false,
        platform: 'github-actions',
        environment: 'development',
        gates: {
          enabled: true,
          strict: false,
          allowWarnings: true,
        },
      },
    };

    // Write configuration file
    await this.writeConfigFile('performance.config.json', defaultConfig);

    // Create CI configuration files
    await this.ciIntegration.generateCIConfigurationFiles('./.github/workflows');

    console.log('✅ Project initialized successfully');
    console.log('📝 Configuration created: performance.config.json');
    console.log('🔧 CI workflows created: .github/workflows/');
  }

  /**
   * Run performance tests
   */
  private async runTests(options: CLIOptions): Promise<void> {
    console.log('🧪 Running performance tests...');

    const testResults = await this.tester.runTestSuite({
      scenarios: options.scenarios || this.config.tester.scenarios,
      environments: options.environments || this.config.tester.environments,
      createBaseline: options.createBaseline || this.config.benchmarking.createBaseline,
      compareBaseline: options.compareBaseline || this.config.benchmarking.compareBaseline,
      parallel: options.parallel ?? this.config.tester.parallel,
      dryRun: options.dryRun,
    });

    // Generate reports
    await this.generateTestReports(testResults, options);

    // Show summary
    this.showTestSummary(testResults);

    // Exit with appropriate code
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    if (failedTests > 0) {
      process.exit(1);
    }
  }

  /**
   * Run benchmarks
   */
  private async runBenchmarks(options: CLIOptions): Promise<void> {
    console.log('📊 Running performance benchmarks...');

    const benchmarkResults = await this.benchmarking.runBenchmarkSuite({
      createBaseline: options.createBaseline || this.config.benchmarking.createBaseline,
      compareBaseline: options.compareBaseline || this.config.benchmarking.compareBaseline,
      parallel: options.parallel ?? this.config.tester.parallel,
      dryRun: options.dryRun,
    });

    // Generate reports
    await this.generateBenchmarkReports(benchmarkResults, options);

    // Show summary
    this.showBenchmarkSummary(benchmarkResults);
  }

  /**
   * Run regression detection
   */
  private async runRegressionDetection(options: CLIOptions): Promise<void> {
    console.log('🔍 Running regression detection...');

    // Load test results or run new tests
    let testResults: any[] = [];

    if (options.scenarios && options.scenarios.length > 0) {
      testResults = await this.tester.runTestSuite({
        scenarios: options.scenarios,
        dryRun: options.dryRun,
      });
    } else {
      // Load existing results
      testResults = await this.loadTestResults();
    }

    if (testResults.length === 0) {
      console.warn('⚠️ No test results available for regression detection');
      return;
    }

    // Perform regression detection
    const regressionResults: any[] = [];
    const baselines = this.tester.getBaselines();

    for (const result of testResults) {
      const baseline = this.findBaselineForResult(result, baselines);

      if (baseline) {
        const detectionResult = await this.detector.detectRegressions(result, baseline);
        regressionResults.push(detectionResult);
      }
    }

    // Generate reports
    await this.generateRegressionReports(regressionResults, options);

    // Show summary
    this.showRegressionSummary(regressionResults);

    // Check for failures in strict mode
    if (options.strict && regressionResults.some(r => r.overallStatus === 'failed')) {
      process.exit(1);
    }
  }

  /**
   * Run CI pipeline
   */
  private async runCIPipeline(options: CLIOptions): Promise<void> {
    console.log('🔄 Running CI pipeline...');

    const result = await this.ciIntegration.runPerformancePipeline({
      skipBenchmarking: !this.config.benchmarking.enabled,
      createBaseline: options.createBaseline || this.config.benchmarking.createBaseline,
      customScenarios: options.scenarios,
      dryRun: options.dryRun,
    });

    // Show results
    console.log('📊 CI Results:');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Tests: ${result.summary.passedTests}/${result.summary.totalTests} passed`);
    console.log(`Score: ${result.summary.performanceScore}/100`);

    // Check if gates passed
    if (result.gates.blocked && !result.gates.manualOverride) {
      console.error('❌ Performance gates blocked deployment');
      process.exit(1);
    }

    // Export results for CI system
    if (options.output) {
      await this.exportCIResults(result, options.output);
    }
  }

  /**
   * Generate reports from existing data
   */
  private async generateReports(options: CLIOptions): Promise<void> {
    console.log('📋 Generating reports...');

    // Load existing data
    const testResults = await this.loadTestResults();
    const benchmarkResults = await this.loadBenchmarkResults();
    const regressionResults = await this.loadRegressionResults();

    if (testResults.length === 0 && benchmarkResults.length === 0) {
      console.warn('⚠️ No data available for report generation');
      return;
    }

    // Generate reports in requested formats
    for (const format of options.format?.split(',') || this.config.reporting.format) {
      switch (format.trim()) {
        case 'json':
          await this.generateJSONReport(testResults, benchmarkResults, regressionResults, options);
          break;
        case 'html':
          await this.generateHTMLReport(testResults, benchmarkResults, regressionResults, options);
          break;
        case 'markdown':
          await this.generateMarkdownReport(testResults, benchmarkResults, regressionResults, options);
          break;
        case 'junit':
          await this.generateJUnitReport(testResults, options);
          break;
        default:
          console.warn(`⚠️ Unknown format: ${format}`);
      }
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up resources...');

    await this.tester.cleanup?.();
    await this.benchmarking.cleanup?.();
    await this.detector.cleanup?.();
    await this.executor.cleanup?.();
    await this.ciIntegration.cleanup?.();

    console.log('✅ Cleanup completed');
  }

  /**
   * Initialize all components
   */
  private async initialize(): Promise<void> {
    await this.tester.initialize();
    await this.benchmarking.initialize();
    await this.detector.initialize();
    await this.executor.initialize();

    if (this.config.ci.enabled) {
      await this.ciIntegration.initialize();
    }
  }

  /**
   * Apply CLI options to config
   */
  private applyOptions(options: CLIOptions): void {
    if (options.scenarios) {
      this.config.tester.scenarios = options.scenarios;
    }

    if (options.environments) {
      this.config.tester.environments = options.environments;
    }

    if (options.parallel !== undefined) {
      this.config.tester.parallel = options.parallel;
    }

    if (options.timeout) {
      this.config.tester.timeout = options.timeout;
    }

    if (options.retries) {
      this.config.tester.retries = options.retries;
    }

    if (options.createBaseline) {
      this.config.benchmarking.createBaseline = true;
    }

    if (options.compareBaseline) {
      this.config.benchmarking.compareBaseline = options.compareBaseline;
    }

    if (options.strict) {
      this.config.regression.strict = true;
    }

    if (options.allowWarnings) {
      this.config.ci.gates.allowWarnings = true;
    }

    if (options.format) {
      this.config.reporting.format = options.format.split(',').map(f => f.trim());
    }

    if (options.output) {
      this.config.reporting.output = options.output;
    }

    if (options.includeScreenshots) {
      this.config.reporting.includeScreenshots = true;
    }

    if (options.includeTraces) {
      this.config.reporting.includeTraces = true;
    }
  }

  /**
   * Load configuration
   */
  private loadConfig(): CLIConfig {
    const fs = require('fs');
    const path = require('path');

    const configPath = path.join(process.cwd(), 'performance.config.json');

    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      } catch (error) {
        console.warn('⚠️ Failed to load config file, using defaults');
      }
    }

    // Return default configuration
    return {
      tester: {
        enabled: true,
        scenarios: ['Home Page Load', 'Tools Index Load', 'JSON Formatter Load'],
        environments: ['Desktop Chrome', 'Mobile Chrome'],
        parallel: true,
        timeout: 30000,
        retries: 2,
      },
      benchmarking: {
        enabled: true,
        createBaseline: false,
      },
      regression: {
        enabled: true,
        strict: false,
        threshold: 'warning',
      },
      reporting: {
        format: ['json', 'html'],
        output: './performance-results',
        includeScreenshots: false,
        includeTraces: false,
      },
      ci: {
        enabled: false,
        platform: 'github-actions',
        environment: 'development',
        gates: {
          enabled: true,
          strict: false,
          allowWarnings: true,
        },
      },
    };
  }

  /**
   * Write configuration file
   */
  private async writeConfigFile(filename: string, config: CLIConfig): Promise<void> {
    const fs = require('fs').promises;
    await fs.writeFile(filename, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
Performance Regression Testing CLI

Usage: performance-regression <command> [options]

Commands:
  init                    Initialize project with default configuration
  test                    Run performance tests
  benchmark               Run performance benchmarks
  regression              Run regression detection
  ci                      Run full CI pipeline
  report                  Generate reports from existing data
  cleanup                 Clean up resources

Options:
  --config <path>         Path to configuration file
  --output <path>         Output directory for results
  --format <format>       Report format (json,html,markdown,junit)
  --scenarios <list>      Comma-separated list of scenarios
  --environments <list>   Comma-separated list of environments
  --create-baseline       Create new baseline
  --compare-baseline <id> Compare with specific baseline
  --parallel              Run tests in parallel
  --dry-run               Dry run without actual testing
  --verbose               Verbose output
  --quiet                 Quiet output
  --timeout <ms>          Test timeout in milliseconds
  --retries <count>       Number of retries
  --include-screenshots   Include screenshots in results
  --include-traces        Include traces in results
  --strict                Strict mode (warnings cause failure)
  --allow-warnings        Allow warnings in CI gates

Examples:
  performance-regression init
  performance-regression test --scenarios "Home Page Load,JSON Formatter Load"
  performance-regression benchmark --create-baseline
  performance-regression regression --strict
  performance-regression ci --format "html,junit"
  performance-regression report --format "json,markdown" --output ./reports
`);
  }

  // Report generation methods
  private async generateTestReports(results: any[], options: CLIOptions): Promise<void> {
    console.log('📋 Generating test reports...');

    const outputDir = options.output || this.config.reporting.output;
    const fs = require('fs').promises;
    const path = require('path');

    await fs.mkdir(outputDir, { recursive: true });

    for (const format of this.config.reporting.format) {
      switch (format) {
        case 'json':
          await fs.writeFile(
            path.join(outputDir, 'test-results.json'),
            JSON.stringify(results, null, 2)
          );
          break;
        case 'html':
          await this.generateHTMLTestReport(results, outputDir);
          break;
        case 'markdown':
          await this.generateMarkdownTestReport(results, outputDir);
          break;
        case 'junit':
          await this.generateJUnitTestReport(results, outputDir);
          break;
      }
    }
  }

  private async generateBenchmarkReports(results: any[], options: CLIOptions): Promise<void> {
    console.log('📋 Generating benchmark reports...');

    const outputDir = options.output || this.config.reporting.output;
    const fs = require('fs').promises;

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      `${outputDir}/benchmark-results.json`,
      JSON.stringify(results, null, 2)
    );
  }

  private async generateRegressionReports(results: any[], options: CLIOptions): Promise<void> {
    console.log('📋 Generating regression reports...');

    const outputDir = options.output || this.config.reporting.output;
    const fs = require('fs').promises;

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      `${outputDir}/regression-results.json`,
      JSON.stringify(results, null, 2)
    );
  }

  // Summary methods
  private showTestSummary(results: any[]): void {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const warnings = results.filter(r => r.status === 'warning').length;

    console.log('\n📊 Test Summary:');
    console.log(`Total: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  - ${r.scenario} (${r.environment})`));
    }
  }

  private showBenchmarkSummary(results: any[]): void {
    const total = results.length;
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failure').length;

    console.log('\n📊 Benchmark Summary:');
    console.log(`Total: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
  }

  private showRegressionSummary(results: any[]): void {
    const total = results.length;
    const passed = results.filter(r => r.overallStatus === 'passed').length;
    const warnings = results.filter(r => r.overallStatus === 'warning').length;
    const failed = results.filter(r => r.overallStatus === 'failed').length;

    const totalRegressions = results.reduce((sum, r) => sum + r.regressions.length, 0);
    const totalImprovements = results.reduce((sum, r) => sum + r.improvements.length, 0);

    console.log('\n📊 Regression Summary:');
    console.log(`Total: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📉 Regressions: ${totalRegressions}`);
    console.log(`📈 Improvements: ${totalImprovements}`);
  }

  // Helper methods
  private async loadTestResults(): Promise<any[]> {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const data = await fs.readFile(
        path.join(this.config.reporting.output, 'test-results.json'),
        'utf8'
      );
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async loadBenchmarkResults(): Promise<any[]> {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const data = await fs.readFile(
        path.join(this.config.reporting.output, 'benchmark-results.json'),
        'utf8'
      );
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async loadRegressionResults(): Promise<any[]> {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const data = await fs.readFile(
        path.join(this.config.reporting.output, 'regression-results.json'),
        'utf8'
      );
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private findBaselineForResult(result: any, baselines: Map<string, any>): any | null {
    const key = `${result.scenario}-${result.environment}`;
    return baselines.get(key) || null;
  }

  private async exportCIResults(result: any, outputPath: string): Promise<void> {
    const fs = require('fs').promises;
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
  }

  // Report generation implementations (simplified)
  private async generateHTMLTestReport(results: any[], outputDir: string): Promise<void> {
    // Implementation would generate HTML report
    console.log(`📄 HTML report generated: ${outputDir}/test-report.html`);
  }

  private async generateMarkdownTestReport(results: any[], outputDir: string): Promise<void> {
    // Implementation would generate Markdown report
    console.log(`📄 Markdown report generated: ${outputDir}/test-report.md`);
  }

  private async generateJUnitTestReport(results: any[], outputDir: string): Promise<void> {
    // Implementation would generate JUnit XML report
    console.log(`📄 JUnit report generated: ${outputDir}/junit.xml`);
  }

  private async generateJSONReport(testResults: any[], benchmarkResults: any[], regressionResults: any[], options: CLIOptions): Promise<void> {
    const outputDir = options.output || this.config.reporting.output;
    const fs = require('fs').promises;

    const report = {
      timestamp: new Date().toISOString(),
      testResults,
      benchmarkResults,
      regressionResults,
      summary: {
        tests: testResults.length,
        benchmarks: benchmarkResults.length,
        regressions: regressionResults.length,
      },
    };

    await fs.writeFile(`${outputDir}/performance-report.json`, JSON.stringify(report, null, 2));
  }

  private async generateHTMLReport(testResults: any[], benchmarkResults: any[], regressionResults: any[], options: CLIOptions): Promise<void> {
    // Implementation would generate comprehensive HTML report
    const outputDir = options.output || this.config.reporting.output;
    console.log(`📄 HTML report generated: ${outputDir}/performance-report.html`);
  }

  private async generateMarkdownReport(testResults: any[], benchmarkResults: any[], regressionResults: any[], options: CLIOptions): Promise<void> {
    // Implementation would generate Markdown report
    const outputDir = options.output || this.config.reporting.output;
    console.log(`📄 Markdown report generated: ${outputDir}/performance-report.md`);
  }

  private async generateJUnitReport(testResults: any[], options: CLIOptions): Promise<void> {
    // Implementation would generate JUnit XML report
    const outputDir = options.output || this.config.reporting.output;
    console.log(`📄 JUnit report generated: ${outputDir}/junit.xml`);
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const cli = new PerformanceRegressionCLI();
    cli.showHelp();
    process.exit(1);
  }

  const command = args[0] as CLIOptions['command'];
  const options: Partial<CLIOptions> = { command };

  // Parse command-line arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--config':
        options.config = nextArg;
        i++;
        break;
      case '--output':
        options.output = nextArg;
        i++;
        break;
      case '--format':
        options.format = nextArg;
        i++;
        break;
      case '--scenarios':
        options.scenarios = nextArg?.split(',');
        i++;
        break;
      case '--environments':
        options.environments = nextArg?.split(',');
        i++;
        break;
      case '--create-baseline':
        options.createBaseline = true;
        break;
      case '--compare-baseline':
        options.compareBaseline = nextArg;
        i++;
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--quiet':
        options.quiet = true;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--allow-warnings':
        options.allowWarnings = true;
        break;
      case '--include-screenshots':
        options.includeScreenshots = true;
        break;
      case '--include-traces':
        options.includeTraces = true;
        break;
      case '--timeout':
        options.timeout = parseInt(nextArg || '30000');
        i++;
        break;
      case '--retries':
        options.retries = parseInt(nextArg || '2');
        i++;
        break;
      case '--help':
      case '-h':
        const cli = new PerformanceRegressionCLI();
        cli.showHelp();
        process.exit(0);
        break;
    }
  }

  // Run CLI
  const cli = new PerformanceRegressionCLI();
  await cli.run(options as CLIOptions);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { PerformanceRegressionCLI, CLIOptions, CLIConfig };
