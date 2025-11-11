/**
 * Code Security Analyzer - T168 Implementation
 * Advanced code security analysis and vulnerability assessment system
 */

import {
	CodeSecurityAnalysis,
	CodeVulnerability,
	CodeSecurityMetrics,
	SecurityVulnerability,
	SecuritySeverity,
	SecurityStatus
} from '@/types/security';

// Main code security analyzer class
export class CodeSecurityAnalyzer {
	private analyzers: Map<string, CodeAnalysisStrategy> = new Map();
	private rules: Map<string, SecurityRule> = new Map();
	private cache: Map<string, CodeSecurityAnalysis> = new Map();

	constructor() {
		this.initializeAnalyzers();
		this.loadSecurityRules();
	}

	/**
	 * Initialize code analysis strategies
	 */
	private initializeAnalyzers(): void {
		this.analyzers.set('typescript', new TypeScriptSecurityAnalyzer());
		this.analyzers.set('javascript', new JavaScriptSecurityAnalyzer());
		this.analyzers.set('json', new JSONSecurityAnalyzer());
		this.analyzers.set('tsx', new TypeScriptSecurityAnalyzer());
		this.analyzers.set('jsx', new JavaScriptSecurityAnalyzer());
	}

	/**
	 * Load security rules
	 */
	private loadSecurityRules(): void {
		const securityRules: SecurityRule[] = [
			// Type safety rules
			{
				id: 'typescript-type-safety',
				name: 'TypeScript Type Safety',
				description: 'Ensure proper TypeScript type usage',
				category: 'vulnerability',
				severity: 'medium',
				enabled: true,
				condition: 'checkTypeSafety',
				remediation: 'Use proper TypeScript types and strict mode',
				custom: false
			},
			// Input validation rules
			{
				id: 'input-validation',
				name: 'Input Validation',
				description: 'Validate all user inputs',
				category: 'vulnerability',
				severity: 'high',
				enabled: true,
				condition: 'checkInputValidation',
				remediation: 'Implement comprehensive input validation',
				custom: false
			},
			// XSS prevention
			{
				id: 'xss-prevention',
				name: 'Cross-Site Scripting Prevention',
				description: 'Prevent XSS attacks in client-side code',
				category: 'vulnerability',
				severity: 'critical',
				enabled: true,
				condition: 'checkXSSPrevention',
				remediation: 'Use proper output encoding and validation',
				custom: false
			},
			// Safe eval usage
			{
				id: 'eval-usage',
				name: 'Safe Eval Usage',
				description: 'Prevent dangerous eval() usage',
				category: 'vulnerability',
				severity: 'critical',
				enabled: true,
				condition: 'checkEvalUsage',
				remediation: 'Avoid eval() and use safer alternatives',
				custom: false
			},
			// DOM manipulation security
			{
				id: 'dom-manipulation',
				name: 'Secure DOM Manipulation',
				description: 'Ensure secure DOM manipulation practices',
				category: 'vulnerability',
				severity: 'medium',
				enabled: true,
				condition: 'checkDOMManipulation',
				remediation: 'Use secure DOM manipulation methods',
				custom: false
			},
			// Error handling security
			{
				id: 'error-handling',
				name: 'Secure Error Handling',
				description: 'Prevent information disclosure in errors',
				category: 'vulnerability',
				severity: 'medium',
				enabled: true,
				condition: 'checkErrorHandling',
				remediation: 'Implement secure error handling practices',
				custom: false
			},
			// Regular expression security
			{
				id: 'regex-security',
				name: 'Regular Expression Security',
				description: 'Prevent ReDoS attacks in regex patterns',
				category: 'vulnerability',
				severity: 'medium',
				enabled: true,
				condition: 'checkRegexSecurity',
				remediation: 'Use safe regular expression patterns',
				custom: false
			},
			// Data serialization security
			{
				id: 'serialization-security',
				name: 'Data Serialization Security',
				description: 'Ensure secure data serialization/deserialization',
				category: 'vulnerability',
				severity: 'high',
				enabled: true,
				condition: 'checkSerializationSecurity',
				remediation: 'Use secure serialization methods',
				custom: false
			}
		];

		securityRules.forEach(rule => {
			this.rules.set(rule.id, rule);
		});
	}

	/**
	 * Analyze code security
	 */
	async analyzeCode(filePath: string, content: string): Promise<CodeSecurityAnalysis> {
		const cacheKey = `${filePath}:${this.generateContentHash(content)}`;

		// Check cache first
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!;
		}

		const language = this.detectLanguage(filePath);
		const analyzer = this.analyzers.get(language);

		if (!analyzer) {
			throw new Error(`No analyzer available for language: ${language}`);
		}

		const analysis: CodeSecurityAnalysis = {
			id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			filePath,
			language,
			analysisType: 'static',
			status: 'running',
			vulnerabilities: [],
			metrics: this.calculateMetrics(content),
			summary: this.createEmptySummary(),
			lastAnalyzed: new Date()
		};

		try {
			// Run security analysis
			const vulnerabilities = await analyzer.analyze(content, this.rules);
			analysis.vulnerabilities = vulnerabilities;

			// Calculate security metrics
			analysis.summary = this.calculateSecuritySummary(vulnerabilities);
			analysis.status = 'completed';
			analysis.lastAnalyzed = new Date();

			// Cache the analysis
			this.cache.set(cacheKey, analysis);

		} catch (error) {
			analysis.status = 'failed';
			console.error(`Code analysis failed for ${filePath}:`, error);
		}

		return analysis;
	}

	/**
	 * Analyze multiple files
	 */
	async analyzeMultipleFiles(files: Array<{ path: string; content: string }>): Promise<CodeSecurityAnalysis[]> {
		const analyses: CodeSecurityAnalysis[] = [];

		for (const file of files) {
			try {
				const analysis = await this.analyzeCode(file.path, file.content);
				analyses.push(analysis);
			} catch (error) {
				console.error(`Failed to analyze ${file.path}:`, error);
			}
		}

		return analyses;
	}

	/**
	 * Analyze code base
	 */
	async analyzeCodeBase(directory: string, filePatterns: string[]): Promise<CodeSecurityAnalysis[]> {
		const files = await this.getCodeFiles(directory, filePatterns);
		return this.analyzeMultipleFiles(files);
	}

	/**
	 * Get security vulnerabilities by type
	 */
	getVulnerabilitiesByType(analyses: CodeSecurityAnalysis[]): Map<string, CodeVulnerability[]> {
		const vulnerabilitiesByType = new Map<string, CodeVulnerability[]>();

		analyses.forEach(analysis => {
			analysis.vulnerabilities.forEach(vulnerability => {
				const type = vulnerability.category;
				if (!vulnerabilitiesByType.has(type)) {
					vulnerabilitiesByType.set(type, []);
				}
				vulnerabilitiesByType.get(type)!.push(vulnerability);
			});
		});

		return vulnerabilitiesByType;
	}

	/**
	 * Get security statistics
	 */
	getSecurityStatistics(analyses: CodeSecurityAnalysis[]): SecurityStatistics {
		const totalVulnerabilities = analyses.reduce((sum, analysis) => sum + analysis.vulnerabilities.length, 0);
		const severityCounts = this.countBySeverity(analyses);
		const categoryCounts = this.countByCategory(analyses);
		const averageSecurityScore = this.calculateAverageSecurityScore(analyses);

		return {
			totalFiles: analyses.length,
			totalVulnerabilities,
			severityCounts,
			categoryCounts,
			averageSecurityScore,
			highRiskFiles: analyses.filter(a => a.summary.riskLevel === 'critical' || a.summary.riskLevel === 'high').length,
			securityDebt: this.calculateSecurityDebt(analyses)
		};
	}

	/**
	 * Detect programming language from file path
	 */
	private detectLanguage(filePath: string): string {
		const ext = filePath.split('.').pop()?.toLowerCase();

		switch (ext) {
			case 'ts': return 'typescript';
			case 'tsx': return 'tsx';
			case 'js': return 'javascript';
			case 'jsx': return 'jsx';
			case 'json': return 'json';
			default: return 'unknown';
		}
	}

	/**
	 * Generate content hash for caching
	 */
	private generateContentHash(content: string): string {
		// Simple hash function - in production, use a proper hash library
		let hash = 0;
		for (let i = 0; i < content.length; i++) {
			const char = content.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return hash.toString(36);
	}

	/**
	 * Calculate code metrics
	 */
	private calculateMetrics(content: string): CodeSecurityMetrics {
		const lines = content.split('\n');
		const linesOfCode = lines.filter(line => line.trim().length > 0).length;

		// Calculate cyclomatic complexity (simplified)
		const complexityKeywords = ['if', 'else', 'while', 'for', 'case', 'catch', '&&', '||'];
		let cyclomaticComplexity = 1;

		lines.forEach(line => {
			complexityKeywords.forEach(keyword => {
				if (line.includes(keyword)) {
					cyclomaticComplexity++;
				}
			});
		});

		// Calculate maintainability index (simplified formula)
		const maintainabilityIndex = Math.max(0, Math.min(100, 171 - 5.2 * Math.log(cyclomaticComplexity) - 0.23 * cyclomaticComplexity));

		return {
			linesOfCode,
			cyclomaticComplexity,
			securityDensity: 0, // Will be calculated after vulnerability analysis
			maintainabilityIndex,
			technicalDebt: 0,
			securityDebt: 0
		};
	}

	/**
	 * Create empty security summary
	 */
	private createEmptySummary() {
		return {
			totalVulnerabilities: 0,
			criticalCount: 0,
			highCount: 0,
			mediumCount: 0,
			lowCount: 0,
			infoCount: 0,
			securityScore: 100,
			complianceScore: 100,
			privacyScore: 100,
			riskLevel: 'info' as SecuritySeverity
		};
	}

	/**
	 * Calculate security summary from vulnerabilities
	 */
	private calculateSecuritySummary(vulnerabilities: CodeVulnerability[]) {
		const summary = this.createEmptySummary();

		summary.totalVulnerabilities = vulnerabilities.length;

		vulnerabilities.forEach(vuln => {
			switch (vuln.severity) {
				case 'critical':
					summary.criticalCount++;
					break;
				case 'high':
					summary.highCount++;
					break;
				case 'medium':
					summary.mediumCount++;
					break;
				case 'low':
					summary.lowCount++;
					break;
				case 'info':
					summary.infoCount++;
					break;
			}
		});

		// Calculate security score
		const weights = { critical: 10, high: 5, medium: 2, low: 1, info: 0.1 };
		const totalScore = vulnerabilities.reduce((acc, vuln) => {
			return acc - weights[vuln.severity];
		}, 100);

		summary.securityScore = Math.max(0, Math.min(100, totalScore));

		// Determine risk level
		if (summary.criticalCount > 0) {
			summary.riskLevel = 'critical';
		} else if (summary.highCount > 2) {
			summary.riskLevel = 'high';
		} else if (summary.mediumCount > 5) {
			summary.riskLevel = 'medium';
		} else if (summary.lowCount > 10) {
			summary.riskLevel = 'low';
		} else {
			summary.riskLevel = 'info';
		}

		return summary;
	}

	/**
	 * Get code files from directory
	 */
	private async getCodeFiles(directory: string, patterns: string[]): Promise<Array<{ path: string; content: string }>> {
		// In a real implementation, this would read files from the filesystem
		// For now, return empty array
		return [];
	}

	/**
	 * Count vulnerabilities by severity
	 */
	private countBySeverity(analyses: CodeSecurityAnalysis[]): Record<SecuritySeverity, number> {
		const counts = {
			critical: 0,
			high: 0,
			medium: 0,
			low: 0,
			info: 0
		};

		analyses.forEach(analysis => {
			analysis.vulnerabilities.forEach(vuln => {
				counts[vuln.severity]++;
			});
		});

		return counts;
	}

	/**
	 * Count vulnerabilities by category
	 */
	private countByCategory(analyses: CodeSecurityAnalysis[]): Record<string, number> {
		const counts: Record<string, number> = {};

		analyses.forEach(analysis => {
			analysis.vulnerabilities.forEach(vuln => {
				counts[vuln.category] = (counts[vuln.category] || 0) + 1;
			});
		});

		return counts;
	}

	/**
	 * Calculate average security score
	 */
	private calculateAverageSecurityScore(analyses: CodeSecurityAnalysis[]): number {
		if (analyses.length === 0) return 100;

		const totalScore = analyses.reduce((sum, analysis) => sum + analysis.summary.securityScore, 0);
		return totalScore / analyses.length;
	}

	/**
	 * Calculate security debt
	 */
	private calculateSecurityDebt(analyses: CodeSecurityAnalysis[]): number {
		return analyses.reduce((debt, analysis) => {
			const severityWeights = { critical: 10, high: 5, medium: 2, low: 1, info: 0.1 };
			const analysisDebt = analysis.vulnerabilities.reduce((sum, vuln) => {
				return sum + severityWeights[vuln.severity];
			}, 0);
			return debt + analysisDebt;
		}, 0);
	}
}

// Code analysis strategy interface
interface CodeAnalysisStrategy {
	analyze(content: string, rules: Map<string, SecurityRule>): Promise<CodeVulnerability[]>;
}

// TypeScript security analyzer
class TypeScriptSecurityAnalyzer implements CodeAnalysisStrategy {
	async analyze(content: string, rules: Map<string, SecurityRule>): Promise<CodeVulnerability[]> {
		const vulnerabilities: CodeVulnerability[] = [];
		const lines = content.split('\n');

		// Check for type safety issues
		const typeSafetyRule = rules.get('typescript-type-safety');
		if (typeSafetyRule?.enabled) {
			const typeIssues = this.checkTypeSafety(content, lines);
			vulnerabilities.push(...typeIssues);
		}

		// Check for input validation
		const inputValidationRule = rules.get('input-validation');
		if (inputValidationRule?.enabled) {
			const inputIssues = this.checkInputValidation(content, lines);
			vulnerabilities.push(...inputIssues);
		}

		// Check for XSS prevention
		const xssRule = rules.get('xss-prevention');
		if (xssRule?.enabled) {
			const xssIssues = this.checkXSSPrevention(content, lines);
			vulnerabilities.push(...xssIssues);
		}

		// Check for eval usage
		const evalRule = rules.get('eval-usage');
		if (evalRule?.enabled) {
			const evalIssues = this.checkEvalUsage(content, lines);
			vulnerabilities.push(...evalIssues);
		}

		// Check for DOM manipulation security
		const domRule = rules.get('dom-manipulation');
		if (domRule?.enabled) {
			const domIssues = this.checkDOMManipulation(content, lines);
			vulnerabilities.push(...domIssues);
		}

		// Check for error handling
		const errorRule = rules.get('error-handling');
		if (errorRule?.enabled) {
			const errorIssues = this.checkErrorHandling(content, lines);
			vulnerabilities.push(...errorIssues);
		}

		// Check for regex security
		const regexRule = rules.get('regex-security');
		if (regexRule?.enabled) {
			const regexIssues = this.checkRegexSecurity(content, lines);
			vulnerabilities.push(...regexIssues);
		}

		// Check for serialization security
		const serialRule = rules.get('serialization-security');
		if (serialRule?.enabled) {
			const serialIssues = this.checkSerializationSecurity(content, lines);
			vulnerabilities.push(...serialIssues);
		}

		return vulnerabilities;
	}

	private checkTypeSafety(content: string, lines: string[]): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];

		// Check for 'any' type usage
		const anyTypeRegex = /\bany\b/g;
		let match;
		while ((match = anyTypeRegex.exec(content)) !== null) {
			const lineNumber = this.getLineNumber(content, match.index);
			const lineContent = lines[lineNumber - 1];

			vulnerabilities.push({
				id: `typescript-any-${lineNumber}`,
				title: 'TypeScript Any Type Usage',
				description: 'Using "any" type reduces type safety',
				category: 'vulnerability',
				severity: 'medium',
				affectedTools: [],
				affectedFiles: [],
				condition: 'any type detected',
				impact: 'Reduced type safety and potential runtime errors',
				remediation: 'Use specific types instead of any',
				references: ['https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any'],
				firstDetected: new Date(),
				lastDetected: new Date(),
				status: 'warning',
				falsePositive: false,
				filePath: '',
				lineNumber,
				codeSnippet: lineContent.trim(),
				confidence: 'high'
			});
		}

		return vulnerabilities;
	}

	private checkInputValidation(content: string, lines: string[]): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];

		// Look for functions that handle user input without validation
		const userInputPatterns = [
			/getElementById\([^)]+\)\.value/g,
			/querySelector\([^)]+\)\.value/g,
			/e\.target\.value/g,
			/formData\.get/g,
			/URLSearchParams/g
		];

		userInputPatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = this.getLineNumber(content, match.index);
				const lineContent = lines[lineNumber - 1];

				// Check if there's validation nearby (within 5 lines)
				const contextStart = Math.max(0, lineNumber - 5);
				const contextEnd = Math.min(lines.length, lineNumber + 5);
				const context = lines.slice(contextStart, contextEnd).join('\n');

				const validationPatterns = [
					/validate/i,
					/sanitize/i,
					/check/i,
					/test/i,
					/trim\(\)/,
					/escape/i
				];

				const hasValidation = validationPatterns.some(regex => regex.test(context));

				if (!hasValidation) {
					vulnerabilities.push({
						id: `input-validation-${lineNumber}`,
						title: 'Missing Input Validation',
						description: 'User input is used without proper validation',
						category: 'vulnerability',
						severity: 'high',
						affectedTools: [],
						affectedFiles: [],
						condition: 'input validation missing',
						impact: 'Potential for injection attacks or data corruption',
						remediation: 'Implement comprehensive input validation and sanitization',
						references: ['https://owasp.org/www-project-cheat-sheets/cheatsheets/Input_Validation_Cheat_Sheet.html'],
						firstDetected: new Date(),
						lastDetected: new Date(),
						status: 'warning',
						falsePositive: false,
						filePath: '',
						lineNumber,
						codeSnippet: lineContent.trim(),
						confidence: 'medium'
					});
				}
			}
		});

		return vulnerabilities;
	}

	private checkXSSPrevention(content: string, lines: string[]): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];

		// Look for potentially dangerous HTML/JS injection patterns
		const dangerousPatterns = [
			/innerHTML\s*=/g,
			/outerHTML\s*=/g,
			/document\.write/g,
			/eval\(/g,
			/Function\(/g,
			/setTimeout\s*\(/g,
			/setInterval\s*\(/g
		];

		dangerousPatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = this.getLineNumber(content, match.index);
				const lineContent = lines[lineNumber - 1];

				// Check if there's sanitization or validation
				const sanitizationPatterns = [
					/sanitize/i,
					/escape/i,
					/encode/i,
					/textContent/,
					/createTextNode/,
					/safeHTML/i
				];

				const hasSanitization = sanitizationPatterns.some(regex => regex.test(lineContent));

				if (!hasSanitization) {
					vulnerabilities.push({
						id: `xss-risk-${lineNumber}`,
						title: 'Potential XSS Vulnerability',
						description: 'Code may be vulnerable to cross-site scripting attacks',
						category: 'vulnerability',
						severity: 'critical',
						affectedTools: [],
						affectedFiles: [],
						condition: 'potential XSS detected',
						impact: 'Malicious scripts could be executed in users\' browsers',
						remediation: 'Use proper output encoding and input sanitization',
						references: ['https://owasp.org/www-community/attacks/xss/'],
						firstDetected: new Date(),
						lastDetected: new Date(),
						status: 'warning',
						falsePositive: false,
						filePath: '',
						lineNumber,
						codeSnippet: lineContent.trim(),
						confidence: 'high'
					});
				}
			}
		});

		return vulnerabilities;
	}

	private checkEvalUsage(content: string, lines: string[]): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];

		const evalPatterns = [/eval\(/g, /Function\(/g, /setTimeout\s*\(\s*["']/g, /setInterval\s*\(\s*["']/g];

		evalPatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = this.getLineNumber(content, match.index);
				const lineContent = lines[lineNumber - 1];

				vulnerabilities.push({
					id: `eval-usage-${lineNumber}`,
					title: 'Dangerous eval() or Function() Usage',
					description: 'Use of eval() or Function() constructor can be dangerous',
					category: 'vulnerability',
					severity: 'critical',
					affectedTools: [],
					affectedFiles: [],
					condition: 'dangerous eval usage detected',
					impact: 'Code injection vulnerability',
					remediation: 'Use safer alternatives like JSON.parse() or specific functions',
					references: ['https://owasp.org/www-project-top-ten/2017/A1_2017-Injection'],
					firstDetected: new Date(),
					lastDetected: new Date(),
					status: 'warning',
					falsePositive: false,
					filePath: '',
					lineNumber,
					codeSnippet: lineContent.trim(),
					confidence: 'high'
				});
			}
		});

		return vulnerabilities;
	}

	private checkDOMManipulation(content: string, lines: string[]): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];

		// Look for unsafe DOM manipulation
		const unsafeDOMPatterns = [
			/insertAdjacentHTML/g,
			/createHTML/g,
			/pasteHTML/g,
			/write\(/
		];

		unsafeDOMPatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = this.getLineNumber(content, match.index);
				const lineContent = lines[lineNumber - 1];

				vulnerabilities.push({
					id: `dom-manipulation-${lineNumber}`,
					title: 'Unsafe DOM Manipulation',
					description: 'DOM manipulation that could lead to security issues',
					category: 'vulnerability',
					severity: 'medium',
					affectedTools: [],
					affectedFiles: [],
					condition: 'unsafe DOM manipulation detected',
					impact: 'Potential for XSS attacks',
					remediation: 'Use safe DOM manipulation methods and sanitize inputs',
					references: ['https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML'],
					firstDetected: new Date(),
					lastDetected: new Date(),
					status: 'warning',
					falsePositive: false,
					filePath: '',
					lineNumber,
					codeSnippet: lineContent.trim(),
					confidence: 'medium'
				});
			}
		});

		return vulnerabilities;
	}

	private checkErrorHandling(content: string, lines: string[]): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];

		// Look for error handling that might leak information
		const errorPatterns = [
			/console\.error/g,
			/console\.log/g,
			/throw\s+new\s+Error/g,
			/alert\s*\(/g
		];

		errorPatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = this.getLineNumber(content, match.index);
				const lineContent = lines[lineNumber - 1];

				// Check if it might leak sensitive information
				const sensitivePatterns = [
					/password/i,
					/token/i,
					/key/i,
					/secret/i,
					/auth/i
				];

				const mightLeakInfo = sensitivePatterns.some(regex => regex.test(lineContent));

				if (mightLeakInfo) {
					vulnerabilities.push({
						id: `error-handling-${lineNumber}`,
						title: 'Information Disclosure in Error Handling',
						description: 'Error handling may expose sensitive information',
						category: 'vulnerability',
						severity: 'medium',
						affectedTools: [],
						affectedFiles: [],
						condition: 'potential information disclosure',
						impact: 'Sensitive information may be exposed to users',
						remediation: 'Implement secure error handling without exposing sensitive data',
						references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'],
						firstDetected: new Date(),
						lastDetected: new Date(),
						status: 'warning',
						falsePositive: false,
						filePath: '',
						lineNumber,
						codeSnippet: lineContent.trim(),
						confidence: 'low'
					});
				}
			}
		});

		return vulnerabilities;
	}

	private checkRegexSecurity(content: string, lines: string[]): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];

		// Look for potentially dangerous regex patterns
		const regexPatterns = [
			/\(\.\*\*\)/g,  // Catastrophic backtracking
			/\(\.\+\*\)/g,  // Similar issue
			/\(\[\^]\*\)/g, // Inefficient character class
			/\(\(\.\|\?\)\*\)/g // Complex alternation
		];

		regexPatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = this.getLineNumber(content, match.index);
				const lineContent = lines[lineNumber - 1];

				vulnerabilities.push({
					id: `regex-security-${lineNumber}`,
					title: 'Potential ReDoS Vulnerability',
					description: 'Regular expression may be vulnerable to denial of service',
					category: 'vulnerability',
					severity: 'medium',
					affectedTools: [],
					affectedFiles: [],
					condition: 'potentially dangerous regex pattern',
					impact: 'Application may become unresponsive with malicious input',
					remediation: 'Simplify regex pattern or use input validation',
					references: ['https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS'],
					firstDetected: new Date(),
					lastDetected: new Date(),
					status: 'warning',
					falsePositive: false,
					filePath: '',
					lineNumber,
					codeSnippet: lineContent.trim(),
					confidence: 'medium'
				});
			}
		});

		return vulnerabilities;
	}

	private checkSerializationSecurity(content: string, lines: string[]): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];

		// Look for insecure JSON parsing
		const insecurePatterns = [
			/JSON\.parse/g,
			/JSON\.stringify/g
		];

		insecurePatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = this.getLineNumber(content, match.index);
				const lineContent = lines[lineNumber - 1];

				// Check if there's validation
				const validationPatterns = [
					/try\s*{/,
					/catch\s*\(/,
					/validate/,
					/sanitize/
				];

				const hasValidation = validationPatterns.some(regex => {
					const contextStart = Math.max(0, lineNumber - 3);
					const contextEnd = Math.min(lines.length, lineNumber + 3);
					const context = lines.slice(contextStart, contextEnd).join('\n');
					return regex.test(context);
				});

				if (!hasValidation) {
					vulnerabilities.push({
						id: `serialization-${lineNumber}`,
						title: 'Insecure JSON Serialization',
						description: 'JSON parsing without proper validation',
						category: 'vulnerability',
						severity: 'high',
						affectedTools: [],
						affectedFiles: [],
						condition: 'insecure JSON serialization',
						impact: 'Potential for prototype pollution or injection attacks',
						remediation: 'Validate and sanitize JSON input before parsing',
						references: ['https://owasp.org/www-project-top-ten/2017/A8_2017-Insecure_Deserialization'],
						firstDetected: new Date(),
						lastDetected: new Date(),
						status: 'warning',
						falsePositive: false,
						filePath: '',
						lineNumber,
						codeSnippet: lineContent.trim(),
						confidence: 'medium'
					});
				}
			}
		});

		return vulnerabilities;
	}

	private getLineNumber(content: string, index: number): number {
		const beforeIndex = content.substring(0, index);
		return beforeIndex.split('\n').length;
	}
}

// JavaScript security analyzer (extends TypeScript analyzer)
class JavaScriptSecurityAnalyzer implements CodeAnalysisStrategy {
	async analyze(content: string, rules: Map<string, SecurityRule>): Promise<CodeVulnerability[]> {
		// JavaScript analysis is similar to TypeScript but with additional considerations
		const typeScriptAnalyzer = new TypeScriptSecurityAnalyzer();
		const vulnerabilities = await typeScriptAnalyzer.analyze(content, rules);

		// Add JavaScript-specific checks
		const jsSpecificVulnerabilities = this.checkJavaScriptSpecificIssues(content);
		vulnerabilities.push(...jsSpecificVulnerabilities);

		return vulnerabilities;
	}

	private checkJavaScriptSpecificIssues(content: string): CodeVulnerability[] {
		const vulnerabilities: CodeVulnerability[] = [];
		const lines = content.split('\n');

		// Check for global variable pollution
		const globalPatterns = [/window\./g, /global\./g];

		globalPatterns.forEach(pattern => {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = this.getLineNumber(content, match.index);
				const lineContent = lines[lineNumber - 1];

				vulnerabilities.push({
					id: `global-pollution-${lineNumber}`,
					title: 'Global Variable Pollution',
					description: 'Modifying global variables can lead to security issues',
					category: 'vulnerability',
					severity: 'low',
					affectedTools: [],
					affectedFiles: [],
					condition: 'global variable modification detected',
					impact: 'Potential for variable collision and security issues',
					remediation: 'Avoid modifying global variables, use local scope',
					references: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects'],
					firstDetected: new Date(),
					lastDetected: new Date(),
					status: 'warning',
					falsePositive: false,
					filePath: '',
					lineNumber,
					codeSnippet: lineContent.trim(),
					confidence: 'low'
				});
			}
		});

		return vulnerabilities;
	}

	private getLineNumber(content: string, index: number): number {
		const beforeIndex = content.substring(0, index);
		return beforeIndex.split('\n').length;
	}
}

// JSON security analyzer
class JSONSecurityAnalyzer implements CodeAnalysisStrategy {
	async analyze(content: string, rules: Map<string, SecurityRule>): Promise<CodeVulnerability[]> {
		const vulnerabilities: CodeVulnerability[] = [];

		try {
			// Try to parse the JSON
			JSON.parse(content);

			// Check for sensitive data patterns
			const sensitivePatterns = [
				/"password"\s*:/i,
				/"secret"\s*:/i,
				/"token"\s*:/i,
				/"api[_-]?key"\s*:/i,
				/"private[_-]?key"\s*:/i,
				/"auth[_-]?token"\s*:/i
			];

			const lines = content.split('\n');
			sensitivePatterns.forEach(pattern => {
				let match;
				while ((match = pattern.exec(content)) !== null) {
					const lineNumber = this.getLineNumber(content, match.index);
					const lineContent = lines[lineNumber - 1];

					vulnerabilities.push({
						id: `sensitive-data-${lineNumber}`,
						title: 'Sensitive Data in JSON',
						description: 'JSON contains potentially sensitive information',
						category: 'privacy',
						severity: 'high',
						affectedTools: [],
						affectedFiles: [],
						condition: 'sensitive data detected',
						impact: 'Sensitive information may be exposed',
						remediation: 'Remove or encrypt sensitive data',
						references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'],
						firstDetected: new Date(),
						lastDetected: new Date(),
						status: 'warning',
						falsePositive: false,
						filePath: '',
						lineNumber,
						codeSnippet: lineContent.trim(),
						confidence: 'medium'
					});
				}
			});

		} catch (error) {
			// JSON is malformed
			vulnerabilities.push({
				id: 'malformed-json',
				title: 'Malformed JSON',
				description: 'JSON structure is invalid',
				category: 'vulnerability',
				severity: 'low',
				affectedTools: [],
				affectedFiles: [],
				condition: 'invalid JSON syntax',
				impact: 'Application errors or crashes',
				remediation: 'Fix JSON syntax errors',
				references: ['https://www.json.org/'],
				firstDetected: new Date(),
				lastDetected: new Date(),
				status: 'error',
				falsePositive: false,
				filePath: '',
				codeSnippet: content.substring(0, 100) + '...',
				confidence: 'high'
			});
		}

		return vulnerabilities;
	}

	private getLineNumber(content: string, index: number): number {
		const beforeIndex = content.substring(0, index);
		return beforeIndex.split('\n').length;
	}
}

// Security statistics interface
export interface SecurityStatistics {
	totalFiles: number;
	totalVulnerabilities: number;
	severityCounts: Record<SecuritySeverity, number>;
	categoryCounts: Record<string, number>;
	averageSecurityScore: number;
	highRiskFiles: number;
	securityDebt: number;
}

// Security rule interface (extended from types/security.ts)
interface SecurityRule {
	id: string;
	name: string;
	description: string;
	category: string;
	severity: SecuritySeverity;
	enabled: boolean;
	condition: string;
	remediation: string;
	custom: boolean;
}

// Export main code security analyzer
export const codeSecurityAnalyzer = new CodeSecurityAnalyzer();
