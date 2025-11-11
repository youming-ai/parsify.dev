/**
 * Global teardown for cross-browser E2E testing
 * Cleans up test environment and generates reports
 */

import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up cross-browser E2E test environment...');

  // Generate comprehensive test report
  await generateTestReport(config);

  // Cleanup test data
  await cleanupTestData();

  // Archive test results
  await archiveTestResults();

  // Generate performance summary
  await generatePerformanceSummary();

  // Cleanup temporary files
  await cleanupTempFiles();

  console.log('✅ Cross-browser E2E test cleanup complete');
}

async function generateTestReport(config: FullConfig) {
  console.log('📊 Generating comprehensive test report...');

  const testResultsDir = path.join(process.cwd(), 'test-results');
  const reportData = {
    timestamp: new Date().toISOString(),
    config: {
      projects: config.projects?.map(p => p.name) || [],
      workers: config.workers,
      retries: config.retries,
      timeout: config.timeout
    },
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0
    },
    projects: {} as Record<string, any>
  };

  // Read individual test result files if they exist
  const resultFiles = fs.readdirSync(testResultsDir)
    .filter(file => file.endsWith('.json') && file.includes('results'));

  for (const file of resultFiles) {
    try {
      const filePath = path.join(testResultsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Aggregate results
      if (data.suites) {
        data.suites.forEach((suite: any) => {
          if (suite.specs) {
            suite.specs.forEach((spec: any) => {
              reportData.summary.total++;
              if (spec.tests) {
                spec.tests.forEach((test: any) => {
                  if (test.results) {
                    test.results.forEach((result: any) => {
                      if (result.status === 'passed') {
                        reportData.summary.passed++;
                      } else if (result.status === 'failed') {
                        reportData.summary.failed++;
                      } else if (result.status === 'skipped') {
                        reportData.summary.skipped++;
                      }

                      if (result.retry) {
                        reportData.summary.flaky++;
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not parse ${file}:`, error);
    }
  }

  // Write comprehensive report
  fs.writeFileSync(
    path.join(testResultsDir, 'comprehensive-report.json'),
    JSON.stringify(reportData, null, 2)
  );

  // Generate HTML report summary
  const htmlReport = generateHTMLReport(reportData);
  fs.writeFileSync(
    path.join(testResultsDir, 'report-summary.html'),
    htmlReport
  );
}

function generateHTMLReport(data: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Cross-Browser E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .passed { border-left: 4px solid #28a745; }
        .failed { border-left: 4px solid #dc3545; }
        .skipped { border-left: 4px solid #ffc107; }
        .flaky { border-left: 4px solid #fd7e14; }
        .details { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Cross-Browser E2E Test Report</h1>
        <p><strong>Generated:</strong> ${data.timestamp}</p>
        <p><strong>Projects:</strong> ${data.config.projects.join(', ')}</p>
    </div>

    <div class="summary">
        <div class="metric passed">
            <h3>✅ Passed</h3>
            <h2>${data.summary.passed}</h2>
        </div>
        <div class="metric failed">
            <h3>❌ Failed</h3>
            <h2>${data.summary.failed}</h2>
        </div>
        <div class="metric skipped">
            <h3>⏭️ Skipped</h3>
            <h2>${data.summary.skipped}</h2>
        </div>
        <div class="metric flaky">
            <h3>🔄 Flaky</h3>
            <h2>${data.summary.flaky}</h2>
        </div>
    </div>

    <div class="details">
        <h2>📊 Test Summary</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
            <tr>
                <td>Total Tests</td>
                <td>${data.summary.total}</td>
                <td>100%</td>
            </tr>
            <tr>
                <td>Passed</td>
                <td>${data.summary.passed}</td>
                <td>${((data.summary.passed / data.summary.total) * 100).toFixed(1)}%</td>
            </tr>
            <tr>
                <td>Failed</td>
                <td>${data.summary.failed}</td>
                <td>${((data.summary.failed / data.summary.total) * 100).toFixed(1)}%</td>
            </tr>
            <tr>
                <td>Skipped</td>
                <td>${data.summary.skipped}</td>
                <td>${((data.summary.skipped / data.summary.total) * 100).toFixed(1)}%</td>
            </tr>
        </table>
    </div>
</body>
</html>`;
}

async function cleanupTestData() {
  console.log('🗂️ Cleaning up test data...');

  const testDataDir = path.join(process.cwd(), 'tests', 'e2e', 'data');

  // Keep test data files but clean up any generated temporary files
  if (fs.existsSync(testDataDir)) {
    const files = fs.readdirSync(testDataDir);

    files.forEach(file => {
      if (file.startsWith('temp-') || file.endsWith('.tmp')) {
        const filePath = path.join(testDataDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.warn(`Warning: Could not delete ${file}:`, error);
        }
      }
    });
  }
}

async function archiveTestResults() {
  console.log('📦 Archiving test results...');

  const testResultsDir = path.join(process.cwd(), 'test-results');
  const archiveDir = path.join(testResultsDir, 'archive');

  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  // Create timestamped archive directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampedArchive = path.join(archiveDir, `run-${timestamp}`);

  if (!fs.existsSync(timestampedArchive)) {
    fs.mkdirSync(timestampedArchive, { recursive: true });
  }

  // Archive important files
  const filesToArchive = ['comprehensive-report.json', 'performance-config.json'];

  filesToArchive.forEach(file => {
    const source = path.join(testResultsDir, file);
    const dest = path.join(timestampedArchive, file);

    if (fs.existsSync(source)) {
      try {
        fs.copyFileSync(source, dest);
      } catch (error) {
        console.warn(`Warning: Could not archive ${file}:`, error);
      }
    }
  });
}

async function generatePerformanceSummary() {
  console.log('📈 Generating performance summary...');

  const testResultsDir = path.join(process.cwd(), 'test-results');
  const perfSummary = {
    timestamp: new Date().toISOString(),
    metrics: {
      averageLoadTime: 0,
      slowestTest: 0,
      fastestTest: 0,
      totalTestTime: 0
    },
    recommendations: [] as string[]
  };

  // This would typically read from actual performance metrics
  // For now, create a placeholder summary

  fs.writeFileSync(
    path.join(testResultsDir, 'performance-summary.json'),
    JSON.stringify(perfSummary, null, 2)
  );
}

async function cleanupTempFiles() {
  console.log('🧹 Cleaning up temporary files...');

  const tempDirs = [
    path.join(process.cwd(), 'test-results', 'temp'),
    path.join(process.cwd(), '.playwright-cache'),
    path.join(process.cwd(), 'node_modules', '.cache')
  ];

  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Warning: Could not clean up ${dir}:`, error);
      }
    }
  });

  // Clean up any browser-specific temp files
  const tempFiles = [
    path.join(process.cwd(), '.crash-dumps'),
    path.join(process.cwd(), 'core.*'),
    path.join(process.cwd(), '*.log')
  ];

  tempFiles.forEach(pattern => {
    try {
      const files = fs.readdirSync(process.cwd()).filter(file =>
        file.match(pattern.replace(/[\[\]]/g, '\\$&'))
      );

      files.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          // Ignore errors for files that might be in use
        }
      });
    } catch (error) {
      // Ignore directory read errors
    }
  });
}

export default globalTeardown;
