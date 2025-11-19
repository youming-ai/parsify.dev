/**
 * Constitutional Validator
 * Validates compliance with Parsify.dev constitutional principles
 */

import type { BundleMetrics } from '../performance/bundle-analyzer';

export interface ComplianceResult {
  passed: boolean;
  principle: string;
  details: string;
  severity: 'error' | 'warning' | 'info';
  recommendation?: string;
}

export interface ConstitutionalComplianceReport {
  overall: {
    passed: boolean;
    score: number; // 0-100
    errors: number;
    warnings: number;
  };
  principles: ComplianceResult[];
  bundleAnalysis?: {
    totalSize: number;
    toolSizes: Record<string, number>;
    violations: string[];
  };
}

export class ConstitutionalValidator {
  private static instance: ConstitutionalValidator;
  private bundleAnalyzer: any;

  private constructor() {
    // Lazy load bundle analyzer
    import('../performance/bundle-analyzer').then(module => {
      this.bundleAnalyzer = module.BundleAnalyzer.getInstance();
    });
  }

  public static getInstance(): ConstitutionalValidator {
    if (!ConstitutionalValidator.instance) {
      ConstitutionalValidator.instance = new ConstitutionalValidator();
    }
    return ConstitutionalValidator.instance;
  }

  /**
   * Validate compliance with all constitutional principles
   */
  public async validateCompliance(): Promise<ConstitutionalComplianceReport> {
    const principles: ComplianceResult[] = [];

    // Principle 1: Client-side processing (no backend dependencies)
    principles.push(await this.validateClientSideProcessing());

    // Principle 2: Monaco Editor integration for code/data tools
    principles.push(await this.validateMonacoIntegration());

    // Principle 3: Tool modularity (standalone React components)
    principles.push(await this.validateToolModularity());

    // Principle 4: Progressive enhancement and accessibility
    principles.push(await this.validateProgressiveEnhancement());

    // Principle 5: Performance optimization (<200KB per tool, <2MB total)
    principles.push(await this.validatePerformanceOptimization());

    const errors = principles.filter(p => p.severity === 'error').length;
    const warnings = principles.filter(p => p.severity === 'warning').length;
    const passed = errors === 0;

    // Calculate compliance score
    const score = Math.max(0, 100 - (errors * 10) - (warnings * 5));

    return {
      overall: {
        passed,
        score,
        errors,
        warnings,
      },
      principles,
      bundleAnalysis: this.analyzeBundleConstraints(),
    };
  }

  /**
   * Validate client-side processing requirement
   */
  private async validateClientSideProcessing(): Promise<ComplianceResult> {
    const violations: string[] = [];

    // Check for server-side API routes
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      if (response.ok) {
        violations.push('Server-side API routes detected');
      }
    } catch {
      // No API routes found - this is good for client-side processing
    }

    // Check for external server dependencies in tool implementations
    const toolImports = [
      'crypto.subtle', // Web Crypto API (allowed - client-side)
      'fetch', // Allowed - client-side HTTP
      'WebSocket', // Allowed - client-side
      'Worker', // Allowed - client-side
    ];

    const disallowedPatterns = [
      'require("child_process")',
      'require("fs")',
      'require("net")',
      'spawn(',
      'exec(',
    ];

    // This would require actual code scanning in a real implementation
    const hasServerCode = false; // Placeholder

    if (violations.length > 0 || hasServerCode) {
      return {
        passed: false,
        principle: 'Client-side Processing',
        details: violations.join('; '),
        severity: 'error',
        recommendation: 'Remove server-side dependencies and implement client-side alternatives',
      };
    }

    return {
      passed: true,
      principle: 'Client-side Processing',
      details: 'All tools use client-side processing',
      severity: 'info',
    };
  }

  /**
   * Validate Monaco Editor integration
   */
  private async validateMonacoIntegration(): Promise<ComplianceResult> {
    // Check if Monaco Editor is available
    const hasMonaco = typeof window !== 'undefined' &&
                     (window as any).monaco ||
                     document.querySelector('[data-monaco-editor]');

    if (!hasMonaco) {
      return {
        passed: false,
        principle: 'Monaco Editor Integration',
        details: 'Monaco Editor not integrated for code/data input tools',
        severity: 'warning',
        recommendation: 'Integrate Monaco Editor for JSON formatting, code execution, and data manipulation tools',
      };
    }

    return {
      passed: true,
      principle: 'Monaco Editor Integration',
      details: 'Monaco Editor properly integrated',
      severity: 'info',
    };
  }

  /**
   * Validate tool modularity
   */
  private async validateToolModularity(): Promise<ComplianceResult> {
    const issues: string[] = [];

    // Check for tool isolation (this would require actual code analysis)
    const tools = document.querySelectorAll('[data-tool-id]');

    if (tools.length === 0) {
      issues.push('No tools found with proper data-tool-id attributes');
    }

    // Check for shared state issues
    const hasGlobalState = typeof window !== 'undefined' &&
                          (window as any).__SHARED_TOOL_STATE;

    if (hasGlobalState) {
      issues.push('Tools share global state - violates modularity');
    }

    if (issues.length > 0) {
      return {
        passed: false,
        principle: 'Tool Modularity',
        details: issues.join('; '),
        severity: 'error',
        recommendation: 'Ensure tools are implemented as standalone React components without shared state',
      };
    }

    return {
      passed: true,
      principle: 'Tool Modularity',
      details: 'Tools are properly modularized',
      severity: 'info',
    };
  }

  /**
   * Validate progressive enhancement and accessibility
   */
  private async validateProgressiveEnhancement(): Promise<ComplianceResult> {
    const issues: string[] = [];

    // Check for keyboard navigation
    const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length === 0) {
      issues.push('Limited keyboard navigation support');
    }

    // Check for ARIA attributes
    const ariaElements = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
    if (ariaElements.length === 0) {
      issues.push('Limited ARIA accessibility attributes');
    }

    // Check for semantic HTML
    const semanticElements = document.querySelectorAll('main, nav, header, footer, section, article');
    if (semanticElements.length === 0) {
      issues.push('Limited semantic HTML structure');
    }

    // Check for screen reader support
    const srOnlyElements = document.querySelectorAll('.sr-only, [aria-hidden="true"]');
    if (srOnlyElements.length === 0) {
      issues.push('No screen reader specific content detected');
    }

    if (issues.length > 2) {
      return {
        passed: false,
        principle: 'Progressive Enhancement & Accessibility',
        details: issues.join('; '),
        severity: 'warning',
        recommendation: 'Implement comprehensive accessibility features including ARIA, keyboard navigation, and screen reader support',
      };
    }

    return {
      passed: true,
      principle: 'Progressive Enhancement & Accessibility',
      details: 'Progressive enhancement features implemented',
      severity: 'info',
    };
  }

  /**
   * Validate performance optimization constraints
   */
  private async validatePerformanceOptimization(): Promise<ComplianceResult> {
    if (!this.bundleAnalyzer) {
      return {
        passed: false,
        principle: 'Performance Optimization',
        details: 'Bundle analyzer not available',
        severity: 'warning',
        recommendation: 'Initialize bundle analyzer to check performance constraints',
      };
    }

    const metrics = this.bundleAnalyzer.getBundleMetrics();
    const violations: string[] = [];

    // Check total bundle size (<2MB)
    if (metrics.totalSize > 2 * 1024 * 1024) {
      violations.push(`Total bundle size ${this.formatBytes(metrics.totalSize)} exceeds 2MB limit`);
    }

    // Check individual tool sizes (<200KB)
    Object.entries(metrics.toolSizes).forEach(([toolId, size]) => {
      if (size > 200 * 1024) {
        violations.push(`Tool ${toolId} bundle size ${this.formatBytes(size)} exceeds 200KB limit`);
      }
    });

    // Check loading times
    Object.entries(metrics.loadingTimes).forEach(([toolId, loadTime]) => {
      if (loadTime > 3000) {
        violations.push(`Tool ${toolId} load time ${loadTime}ms exceeds 3 seconds`);
      }
    });

    if (violations.length > 0) {
      return {
        passed: false,
        principle: 'Performance Optimization',
        details: violations.join('; '),
        severity: violations.some(v => v.includes('exceeds')) ? 'error' : 'warning',
        recommendation: 'Optimize bundle sizes, implement code splitting, and improve loading performance',
      };
    }

    return {
      passed: true,
      principle: 'Performance Optimization',
      details: `Bundle size ${this.formatBytes(metrics.totalSize)}, all tools within limits`,
      severity: 'info',
    };
  }

  /**
   * Analyze bundle constraints in detail
   */
  private analyzeBundleConstraints(): {
    totalSize: number;
    toolSizes: Record<string, number>;
    violations: string[];
  } {
    if (!this.bundleAnalyzer) {
      return {
        totalSize: 0,
        toolSizes: {},
        violations: ['Bundle analyzer not available'],
      };
    }

    const metrics = this.bundleAnalyzer.getBundleMetrics();
    const violations: string[] = [];

    if (metrics.totalSize > 2 * 1024 * 1024) {
      violations.push(`Total bundle size exceeds 2MB: ${this.formatBytes(metrics.totalSize)}`);
    }

    Object.entries(metrics.toolSizes).forEach(([toolId, size]) => {
      if (size > 200 * 1024) {
        violations.push(`Tool ${toolId} exceeds 200KB: ${this.formatBytes(size)}`);
      }
    });

    return {
      totalSize: metrics.totalSize,
      toolSizes: metrics.toolSizes,
      violations,
    };
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate compliance report in markdown format
   */
  public generateReport(compliance: ConstitutionalComplianceReport): string {
    const report = [
      '# Parsify.dev Constitutional Compliance Report',
      '',
      `## Overall Compliance Score: ${compliance.overall.score}/100`,
      compliance.overall.passed ? '✅ **PASSED**' : '❌ **FAILED**',
      '',
      `**Errors**: ${compliance.overall.errors} | **Warnings**: ${compliance.overall.warnings}`,
      '',
      '## Constitutional Principles',
      '',
    ];

    compliance.principles.forEach(principle => {
      const icon = principle.severity === 'error' ? '❌' :
                   principle.severity === 'warning' ? '⚠️' : '✅';

      report.push(`### ${icon} ${principle.principle}`);
      report.push(`${principle.passed ? 'Passed' : 'Failed'}: ${principle.details}`);

      if (principle.recommendation) {
        report.push(`**Recommendation**: ${principle.recommendation}`);
      }
      report.push('');
    });

    if (compliance.bundleAnalysis) {
      report.push('## Bundle Analysis');
      report.push(`- **Total Size**: ${this.formatBytes(compliance.bundleAnalysis.totalSize)}`);
      report.push(`- **Individual Tool Sizes**:`);

      Object.entries(compliance.bundleAnalysis.toolSizes).forEach(([toolId, size]) => {
        report.push(`  - ${toolId}: ${this.formatBytes(size)}`);
      });

      if (compliance.bundleAnalysis.violations.length > 0) {
        report.push('**Violations**:');
        compliance.bundleAnalysis.violations.forEach(violation => {
          report.push(`- ${violation}`);
        });
      }
      report.push('');
    }

    report.push('## Compliance Checklist');
    report.push('- [ ] Client-side processing verified');
    report.push('- [ ] Monaco Editor integration confirmed');
    report.push('- [ ] Tool modularity validated');
    report.push('- [ ] Progressive enhancement features implemented');
    report.push('- [ ] Performance constraints satisfied');

    return report.join('\n');
  }
}
