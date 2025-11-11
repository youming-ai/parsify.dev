/**
 * Tool-Specific Fallback Strategies for All 6 Categories
 * Implements fallback methods for JSON, Code, File, Network, Text, and Security tools
 */

import {
	BaseFallbackStrategy,
	FallbackContext,
	FallbackResult,
	FallbackQuality,
	DataLossRisk,
	ToolCategory,
	AnalyticsError
} from './fallback-processing-system';

// ============================================================================
// JSON Processing Fallback Strategies
// ============================================================================

export class JSONSimplifiedFallback extends BaseFallbackStrategy {
	public id = 'json-simplified';
	public name = 'Simplified JSON Processing';
	public description = 'Basic JSON parsing with minimal features';
	public priority = 90;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 100;
	public dataLossRisk: DataLossRisk = 'low';
	public compatibility = ['JSON Processing Suite'];

	public isAvailable(): boolean {
		return typeof JSON !== 'undefined' && typeof JSON.parse === 'function';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const validation = await this.validateJSON(context.inputData);
			if (!validation.isValid) {
				return this.createBaseResult(
					false,
					'minimal',
					['Invalid JSON format'],
					['Basic JSON parsing only'],
					{
						outputComplete: false,
						dataLoss: [{
							type: 'content',
							description: 'Unable to parse JSON',
							severity: 'critical',
							impact: 'Cannot process invalid JSON'
						}]
					}
				);
			}

			// Perform simplified processing
			let processedData;
			try {
				processedData = JSON.parse(context.inputData);
			} catch (parseError) {
				// Try to fix common JSON issues
				processedData = this.attemptJSONFix(context.inputData);
			}

			return this.createBaseResult(
				true,
				'medium',
				['Using simplified JSON processing'],
				['No advanced features available'],
				{
					outputComplete: true,
					dataLoss: [],
					transformations: [{
						from: 'advanced JSON processing',
						to: 'basic JSON parsing',
						reason: 'Primary processing method failed',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Simplified JSON processing failed'],
				['No JSON processing available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Complete processing failure',
						severity: 'critical',
						impact: 'No output generated'
					}]
				}
			);
		}
	}

	private async validateJSON(data: any): Promise<{ isValid: boolean; error?: string }> {
		try {
			JSON.parse(data);
			return { isValid: true };
		} catch (error) {
			return { isValid: false, error: (error as Error).message };
		}
	}

	private attemptJSONFix(data: string): any {
		// Common JSON fixes
		let fixedData = data;

		// Remove trailing commas
		fixedData = fixedData.replace(/,(\s*[}\]])/g, '$1');

		// Fix single quotes
		fixedData = fixedData.replace(/'/g, '"');

		// Add missing quotes around keys
		fixedData = fixedData.replace(/(\w+):/g, '"$1":');

		try {
			return JSON.parse(fixedData);
		} catch {
			throw new AnalyticsError('Unable to fix JSON format');
		}
	}
}

export class JSONValidationFallback extends BaseFallbackStrategy {
	public id = 'json-validation';
	public name = 'JSON Validation Only';
	public description = 'Validate JSON structure without processing';
	public priority = 70;
	public qualityLevel: FallbackQuality = 'low';
	public processingTime = 50;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['JSON Processing Suite'];

	public isAvailable(): boolean {
		return true; // Always available as basic validation
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		const validation = await this.performBasicValidation(context.inputData);

		return this.createBaseResult(
			validation.isValid,
			'low',
			validation.warnings,
			validation.limitations,
			{
				outputComplete: validation.isValid,
				dataLoss: validation.errors.map(error => ({
					type: 'structure' as const,
					description: error,
					severity: 'medium' as const,
					impact: 'Structure may not be preserved'
				})),
				transformations: [{
					from: 'full JSON processing',
					to: 'JSON validation only',
					reason: 'Processing unavailable, validation fallback',
					potentialDataLoss: false
				}]
			}
		);
	}

	private async performBasicValidation(data: any): Promise<{
		isValid: boolean;
		errors: string[];
		warnings: string[];
		limitations: string[];
	}> {
		const errors: string[] = [];
		const warnings: string[] = [];
		const limitations: string[] = [];

		// Basic structure validation
		if (typeof data === 'string') {
			try {
				JSON.parse(data);
			} catch (error) {
				errors.push('Invalid JSON syntax');
			}
		} else {
			warnings.push('Input is not a string, cannot validate JSON syntax');
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			limitations: ['Validation only, no processing performed']
		};
	}
}

export class JSONFormattingFallback extends BaseFallbackStrategy {
	public id = 'json-formatting';
	public name = 'Basic JSON Formatting';
	public description = 'Simple JSON formatting and indentation';
	public priority = 80;
	public qualityLevel: FallbackQuality = 'high';
	public processingTime = 150;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['JSON Processing Suite'];

	public isAvailable(): boolean {
		return typeof JSON !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const parsed = JSON.parse(context.inputData);
			const formatted = JSON.stringify(parsed, null, 2);

			return this.createBaseResult(
				true,
				'high',
				['Basic formatting applied'],
				['No advanced formatting options'],
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced JSON formatting',
						to: 'basic JSON.stringify formatting',
						reason: 'Primary formatter unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['JSON formatting failed'],
				['No formatting possible'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'formatting',
						description: 'Unable to format JSON',
						severity: 'medium',
						impact: 'Output not formatted'
					}]
				}
			);
		}
	}
}

// ============================================================================
// Code Processing Fallback Strategies
// ============================================================================

export class CodeValidationFallback extends BaseFallbackStrategy {
	public id = 'code-validation';
	public name = 'Basic Code Validation';
	public description = 'Syntax checking and basic validation';
	public priority = 85;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 200;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['Code Processing Suite'];

	public isAvailable(): boolean {
		return typeof Function === 'function';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const validation = await this.validateCode(context.inputData, context.operation);

			return this.createBaseResult(
				validation.isValid,
				'medium',
				validation.warnings,
				validation.limitations,
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced code analysis',
						to: 'basic syntax validation',
						reason: 'Advanced code processing unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Code validation failed'],
				['No validation possible'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Validation process failed',
						severity: 'medium',
						impact: 'Code quality unknown'
					}]
				}
			);
		}
	}

	private async validateCode(code: string, language?: string): Promise<{
		isValid: boolean;
		warnings: string[];
		limitations: string[];
	}> {
		const warnings: string[] = [];
		const limitations: string[] = [];

		try {
			// Basic syntax validation
			new Function(code);

			// Add warnings for common issues
			if (code.includes('eval(')) {
				warnings.push('Code contains eval() function');
			}
			if (code.includes('innerHTML')) {
				warnings.push('Code may manipulate DOM directly');
			}

		} catch (error) {
			return {
				isValid: false,
				warnings: [],
				limitations: ['Syntax validation failed']
			};
		}

		limitations.push('Basic syntax validation only');
		limitations.push('No language-specific validation');

		return {
			isValid: true,
			warnings,
			limitations
		};
	}
}

export class CodeHighlightingFallback extends BaseFallbackStrategy {
	public id = 'code-highlighting';
	public name = 'Basic Syntax Highlighting';
	public description = 'Simple keyword-based syntax highlighting';
	public priority = 60;
	public qualityLevel: FallbackQuality = 'low';
	public processingTime = 100;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['Code Processing Suite'];

	public isAvailable(): boolean {
		return typeof document !== 'undefined' || typeof window !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const highlighted = this.applyBasicHighlighting(context.inputData);

			return this.createBaseResult(
				true,
				'low',
				['Basic keyword highlighting applied'],
				['No context-aware highlighting', 'Limited language support'],
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced syntax highlighting',
						to: 'basic keyword highlighting',
						reason: 'Advanced highlighter unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Syntax highlighting failed'],
				['Plain text output only'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'formatting',
						description: 'No highlighting applied',
						severity: 'low',
						impact: 'Reduced readability'
					}]
				}
			);
		}
	}

	private applyBasicHighlighting(code: string): string {
		// Basic keyword highlighting using simple regex
		const keywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return'];
		let highlighted = code;

		keywords.forEach(keyword => {
			const regex = new RegExp(`\\b${keyword}\\b`, 'g');
			highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
		});

		// String highlighting
		highlighted = highlighted.replace(/(["'])([^"']*?)\1/g, '<span class="string">$&</span>');

		// Number highlighting
		highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

		return highlighted;
	}
}

export class CodeFormattingFallback extends BaseFallbackStrategy {
	public id = 'code-formatting';
	public name = 'Basic Code Formatting';
	public description = 'Simple indentation and line breaks';
	public priority = 75;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 150;
	public dataLossRisk: DataLossRisk = 'low';
	public compatibility = ['Code Processing Suite'];

	public isAvailable(): boolean {
		return true;
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const formatted = this.formatCode(context.inputData);

			return this.createBaseResult(
				true,
				'medium',
				['Basic formatting applied'],
				['No style-specific formatting', 'Limited brace handling'],
				{
					outputComplete: true,
					dataLoss: [],
					transformations: [{
						from: 'advanced code formatting',
						to: 'basic indentation',
						reason: 'Advanced formatter unavailable',
						potentialDataLoss: true
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Code formatting failed'],
				['No formatting applied'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'formatting',
						description: 'Formatting failed',
						severity: 'low',
						impact: 'Code remains unformatted'
					}]
				}
			);
		}
	}

	private formatCode(code: string): string {
		// Very basic formatting
		let formatted = code;
		let indentLevel = 0;
		const lines = formatted.split('\n');

		const formattedLines = lines.map(line => {
			const trimmed = line.trim();

			// Decrease indent for closing braces
			if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
				indentLevel = Math.max(0, indentLevel - 1);
			}

			const indentedLine = '  '.repeat(indentLevel) + trimmed;

			// Increase indent for opening braces
			if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
				indentLevel++;
			}

			return indentedLine;
		});

		return formattedLines.join('\n');
	}
}

// ============================================================================
// File Processing Fallback Strategies
// ============================================================================

export class TextFileFallback extends BaseFallbackStrategy {
	public id = 'text-file';
	public name = 'Text File Processing';
	public description = 'Basic text file processing capabilities';
	public priority = 95;
	public qualityLevel: FallbackQuality = 'high';
	public processingTime = 200;
	public dataLossRisk: DataLossRisk = 'low';
	public compatibility = ['File Processing Suite'];

	public isAvailable(): boolean {
		return typeof FileReader !== 'undefined' || typeof Buffer !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const processed = await this.processAsText(context.inputData);

			return this.createBaseResult(
				true,
				'high',
				['Processed as text file'],
				['Binary data may be lost', 'No specialized format handling'],
				{
					outputComplete: true,
					dataLoss: this.analyzeDataLoss(context.inputData),
					transformations: [{
						from: 'specialized file processing',
						to: 'text-only processing',
						reason: 'File type-specific processor unavailable',
						potentialDataLoss: true
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Text file processing failed'],
				['No file processing available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Unable to process file as text',
						severity: 'critical',
						impact: 'Complete processing failure'
					}]
				}
			);
		}
	}

	private async processAsText(fileData: any): Promise<string> {
		// Handle different input types
		if (fileData instanceof File) {
			return await fileData.text();
		} else if (fileData instanceof ArrayBuffer) {
			return new TextDecoder().decode(fileData);
		} else if (typeof fileData === 'string') {
			return fileData;
		} else {
			return JSON.stringify(fileData);
		}
	}

	private analyzeDataLoss(data: any): Array<{ type: string; description: string; severity: string; impact: string }> {
		const dataLoss: Array<{ type: string; description: string; severity: string; impact: string }> = [];

		// Check for binary data indicators
		if (data instanceof ArrayBuffer) {
			dataLoss.push({
				type: 'content',
				description: 'Binary data converted to text',
				severity: 'medium',
				impact: 'Binary data may be corrupted'
			});
		}

		// Check for null bytes (binary indicator)
		if (typeof data === 'string' && data.includes('\0')) {
			dataLoss.push({
				type: 'content',
				description: 'Binary data detected in text',
				severity: 'high',
				impact: 'Data corruption likely'
			});
		}

		return dataLoss;
	}
}

export class BinaryFileFallback extends BaseFallbackStrategy {
	public id = 'binary-file';
	public name = 'Binary Safe Processing';
	public description = 'Safe handling of binary files';
	public priority = 70;
	public qualityLevel: FallbackQuality = 'low';
	public processingTime = 100;
	public dataLossRisk: DataLossRisk = 'medium';
	public compatibility = ['File Processing Suite'];

	public isAvailable(): boolean {
		return typeof Uint8Array !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const processed = this.processAsBinary(context.inputData);

			return this.createBaseResult(
				true,
				'low',
				['Binary-safe processing'],
				['No content analysis', 'Limited functionality'],
				{
					outputComplete: true,
					dataLoss: [{
						type: 'content',
						description: 'Binary processing only',
						severity: 'medium',
						impact: 'No content analysis available'
					}],
					transformations: [{
						from: 'content-aware processing',
						to: 'binary-safe handling',
						reason: 'Content analysis unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Binary processing failed'],
				['No file processing available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Binary processing failed',
						severity: 'high',
						impact: 'Complete processing failure'
					}]
				}
			);
		}
	}

	private processAsBinary(data: any): ArrayBuffer {
		if (data instanceof ArrayBuffer) {
			return data;
		} else if (data instanceof Uint8Array) {
			return data.buffer;
		} else if (typeof data === 'string') {
			return new TextEncoder().encode(data).buffer;
		} else {
			return new TextEncoder().encode(JSON.stringify(data)).buffer;
		}
	}
}

export class ImageMetadataFallback extends BaseFallbackStrategy {
	public id = 'image-metadata';
	public name = 'Basic Image Metadata';
	public description = 'Extract basic image information';
	public priority = 60;
	public qualityLevel: FallbackQuality = 'low';
	public processingTime = 300;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['File Processing Suite'];

	public isAvailable(): boolean {
		return typeof Image !== 'undefined' || typeof document !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const metadata = await this.extractBasicMetadata(context.inputData);

			return this.createBaseResult(
				true,
				'low',
				['Basic metadata extracted'],
				['No detailed analysis', 'Limited format support'],
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced image analysis',
						to: 'basic metadata extraction',
						reason: 'Advanced image processor unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Metadata extraction failed'],
				['No metadata available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'metadata',
						description: 'Unable to extract metadata',
						severity: 'low',
						impact: 'No file information available'
					}]
				}
			);
		}
	}

	private async extractBasicMetadata(fileData: any): Promise<any> {
		const metadata: any = {
			type: 'unknown',
			size: 0,
			lastModified: null,
		};

		// Extract basic file information
		if (fileData instanceof File) {
			metadata.type = fileData.type;
			metadata.size = fileData.size;
			metadata.lastModified = fileData.lastModified;
			metadata.name = fileData.name;
		} else if (fileData instanceof ArrayBuffer) {
			metadata.size = fileData.byteLength;

			// Basic format detection from magic numbers
			const view = new Uint8Array(fileData);
			if (view.length >= 4) {
				// PNG signature
				if (view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47) {
					metadata.type = 'image/png';
				}
				// JPEG signature
				else if (view[0] === 0xFF && view[1] === 0xD8) {
					metadata.type = 'image/jpeg';
				}
				// GIF signature
				else if (view[0] === 0x47 && view[1] === 0x49 && view[2] === 0x46) {
					metadata.type = 'image/gif';
				}
			}
		}

		return metadata;
	}
}

// ============================================================================
// Network Utilities Fallback Strategies
// ============================================================================

export class LocalValidationFallback extends BaseFallbackStrategy {
	public id = 'local-validation';
	public name = 'Local Validation Only';
	public description = 'Validate requests without network calls';
	public priority = 100;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 50;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['Network Utilities'];

	public isAvailable(): boolean {
		return true; // Always available
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const validation = await this.validateLocally(context.inputData, context.operation);

			return this.createBaseResult(
				validation.isValid,
				'medium',
				validation.warnings,
				validation.limitations,
				{
					outputComplete: true,
					transformations: [{
						from: 'network operation',
						to: 'local validation',
						reason: 'Network unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Local validation failed'],
				['No validation possible'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Validation process failed',
						severity: 'medium',
						impact: 'Request validity unknown'
					}]
				}
			);
		}
	}

	private async validateLocally(data: any, operation: string): Promise<{
		isValid: boolean;
		warnings: string[];
		limitations: string[];
	}> {
		const warnings: string[] = [];
		const limitations: string[] = [];
		let isValid = true;

		// Basic URL validation
		if (typeof data === 'string' && data.startsWith('http')) {
			try {
				new URL(data);
			} catch {
				isValid = false;
			}
		}

		// Add warnings based on operation type
		if (operation === 'api-test') {
			warnings.push('API endpoint not actually tested');
			limitations.push('No network connectivity verification');
		} else if (operation === 'network-analysis') {
			warnings.push('No actual network analysis performed');
			limitations.push('Latency and reliability unknown');
		}

		limitations.push('Local validation only');
		limitations.push('No network verification');

		return { isValid, warnings, limitations };
	}
}

export class CachedResultFallback extends BaseFallbackStrategy {
	public id = 'cached-result';
	public name = 'Use Cached Results';
	public description = 'Return previously cached results';
	public priority = 85;
	public qualityLevel: FallbackQuality = 'high';
	public processingTime = 10;
	public dataLossRisk: DataLossRisk = 'low';
	public compatibility = ['Network Utilities'];

	public isAvailable(): boolean {
		return typeof localStorage !== 'undefined' || typeof sessionStorage !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const cached = this.getCachedResult(context);

			if (cached) {
				return this.createBaseResult(
					true,
					'high',
					['Using cached result'],
					['Data may be outdated'],
					{
						outputComplete: true,
						dataLoss: [{
							type: 'content',
							description: 'Data may not be current',
							severity: 'low',
							impact: 'Stale information possible'
						}],
						transformations: [{
							from: 'fresh network data',
							to: 'cached data',
							reason: 'Network unavailable',
							potentialDataLoss: true
						}]
					}
				);
			} else {
				return this.createBaseResult(
					false,
					'minimal',
					['No cached data available'],
					['Network operation required'],
					{
						outputComplete: false,
						dataLoss: [{
							type: 'content',
							description: 'No cached result found',
							severity: 'medium',
							impact: 'Must wait for network access'
						}]
					}
				);
			}
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Cache access failed'],
				['No cached data available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Cache system error',
						severity: 'medium',
						impact: 'Cannot access cached data'
					}]
				}
			);
		}
	}

	private getCachedResult(context: FallbackContext): any {
		const cacheKey = this.generateCacheKey(context);
		const cached = localStorage.getItem(`fallback_cache_${cacheKey}`);

		if (cached) {
			try {
				const data = JSON.parse(cached);
				const age = Date.now() - data.timestamp;
				const maxAge = 5 * 60 * 1000; // 5 minutes

				if (age < maxAge) {
					return data.result;
				} else {
					// Remove expired cache entry
					localStorage.removeItem(`fallback_cache_${cacheKey}`);
				}
			} catch {
				// Remove corrupted cache entry
				localStorage.removeItem(`fallback_cache_${cacheKey}`);
			}
		}

		return null;
	}

	private generateCacheKey(context: FallbackContext): string {
		const hash = this.simpleHash(JSON.stringify(context.inputData) + context.operation);
		return `${context.toolId}_${context.operation}_${hash}`;
	}

	private simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(36);
	}
}

export class ManualInputFallback extends BaseFallbackStrategy {
	public id = 'manual-input';
	public name = 'Manual Input Mode';
	public description = 'Prompt user for manual input';
	public priority = 30;
	public qualityLevel: FallbackQuality = 'minimal';
	public processingTime = 1000;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['Network Utilities'];

	public isAvailable(): boolean {
		return typeof window !== 'undefined' || typeof confirm !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			// In a real implementation, this would show a dialog
			// For now, we'll simulate manual input
			const manualResult = await this.simulateManualInput(context);

			return this.createBaseResult(
				true,
				'minimal',
				['Manual input provided'],
				['User intervention required', 'No automated processing'],
				{
					outputComplete: true,
					transformations: [{
						from: 'automated network operation',
						to: 'manual user input',
						reason: 'Network unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Manual input failed'],
				['No fallback available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Manual input unavailable',
						severity: 'critical',
						impact: 'No processing possible'
					}]
				}
			);
		}
	}

	private async simulateManualInput(context: FallbackContext): Promise<any> {
		// Simulate manual input delay
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Return a placeholder result
		return {
			status: 'manual_input',
			message: 'User provided manual input',
			data: 'Manually entered data'
		};
	}
}

// ============================================================================
// Text Processing Fallback Strategies
// ============================================================================

export class BasicTextFallback extends BaseFallbackStrategy {
	public id = 'basic-text';
	public name = 'Basic Text Processing';
	public description = 'Simple text operations';
	public priority = 95;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 100;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['Text Processing Suite'];

	public isAvailable(): boolean {
		return typeof String === 'function';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const processed = this.processBasicText(context.inputData, context.operation);

			return this.createBaseResult(
				true,
				'medium',
				['Basic text processing applied'],
				['Limited functionality', 'No advanced features'],
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced text processing',
						to: 'basic string operations',
						reason: 'Advanced processor unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Basic text processing failed'],
				['No text processing available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Text processing failed',
						severity: 'medium',
						impact: 'No text transformation'
					}]
				}
			);
		}
	}

	private processBasicText(text: string, operation: string): string {
		switch (operation) {
			case 'uppercase':
				return text.toUpperCase();
			case 'lowercase':
				return text.toLowerCase();
			case 'trim':
				return text.trim();
			case 'reverse':
				return text.split('').reverse().join('');
			default:
				return text; // No processing for unknown operations
		}
	}
}

export class RegexFallback extends BaseFallbackStrategy {
	public id = 'regex-processing';
	public name = 'Regex-based Processing';
	public description = 'Use regular expressions for text processing';
	public priority = 80;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 200;
	public dataLossRisk: DataLossRisk = 'low';
	public compatibility = ['Text Processing Suite'];

	public isAvailable(): boolean {
		return typeof RegExp !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const processed = this.processWithRegex(context.inputData, context.operation);

			return this.createBaseResult(
				true,
				'medium',
				['Regex processing applied'],
				['Limited pattern support', 'No context awareness'],
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced text analysis',
						to: 'regex-based processing',
						reason: 'Advanced analyzer unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Regex processing failed'],
				['No processing available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Regex processing failed',
						severity: 'medium',
						impact: 'No text transformation'
					}]
				}
			);
		}
	}

	private processWithRegex(text: string, operation: string): string {
		// Simple regex patterns for common operations
		const patterns: Record<string, RegExp> = {
			'remove-extra-spaces': /\s+/g,
			'remove-special-chars': /[^a-zA-Z0-9\s]/g,
			'extract-emails': /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
			'extract-urls': /https?:\/\/[^\s]+/g,
		};

		const pattern = patterns[operation];
		if (pattern) {
			switch (operation) {
				case 'remove-extra-spaces':
					return text.replace(pattern, ' ');
				case 'remove-special-chars':
					return text.replace(pattern, '');
				case 'extract-emails':
				case 'extract-urls':
					return text.match(pattern)?.join('\n') || '';
				default:
					return text;
			}
		}

		return text; // No processing for unknown operations
	}
}

export class EncodingFallback extends BaseFallbackStrategy {
	public id = 'encoding-processing';
	public name = 'Basic Encoding/Decoding';
	public description = 'Simple encoding and decoding operations';
	public priority = 90;
	public qualityLevel: FallbackQuality = 'high';
	public processingTime = 150;
	public dataLossRisk: DataLossRisk = 'low';
	public compatibility = ['Text Processing Suite'];

	public isAvailable(): boolean {
		return typeof btoa !== 'undefined' && typeof atob !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const processed = this.processEncoding(context.inputData, context.operation);

			return this.createBaseResult(
				true,
				'high',
				['Encoding/decoding applied'],
				['Limited encoding support'],
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced encoding',
						to: 'basic encoding/decoding',
						reason: 'Advanced encoder unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Encoding/decoding failed'],
				['No encoding available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Encoding operation failed',
						severity: 'medium',
						impact: 'No transformation applied'
					}]
				}
			);
		}
	}

	private processEncoding(text: string, operation: string): string {
		switch (operation) {
			case 'base64-encode':
				return btoa(text);
			case 'base64-decode':
				return atob(text);
			case 'url-encode':
				return encodeURIComponent(text);
			case 'url-decode':
				return decodeURIComponent(text);
			default:
				return text; // No processing for unknown operations
		}
	}
}

// ============================================================================
// Security & Encryption Fallback Strategies
// ============================================================================

export class ClientSideHashingFallback extends BaseFallbackStrategy {
	public id = 'client-side-hashing';
	public name = 'Client-Side Hashing';
	public description = 'Basic hashing algorithms in browser';
	public priority = 100;
	public qualityLevel: FallbackQuality = 'high';
	public processingTime = 300;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['Security & Encryption Suite'];

	public isAvailable(): boolean {
		return typeof crypto !== 'undefined' && crypto.subtle;
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const hashed = await this.performHashing(context.inputData, context.operation);

			return this.createBaseResult(
				true,
				'high',
				['Client-side hashing applied'],
				['Limited algorithm support'],
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced cryptographic operations',
						to: 'client-side hashing',
						reason: 'Advanced crypto unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Client-side hashing failed'],
				['No hashing available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Hashing operation failed',
						severity: 'high',
						impact: 'No hash generated'
					}]
				}
			);
		}
	}

	private async performHashing(data: string, algorithm: string): Promise<string> {
		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(data);

		let hashAlgorithm: string;
		switch (algorithm) {
			case 'sha256':
				hashAlgorithm = 'SHA-256';
				break;
			case 'sha1':
				hashAlgorithm = 'SHA-1';
				break;
			case 'md5':
				// MD5 not supported in Web Crypto, fallback to simple hash
				return this.simpleHash(data);
			default:
				hashAlgorithm = 'SHA-256';
		}

		const hashBuffer = await crypto.subtle.digest(hashAlgorithm, dataBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	}

	private simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(16);
	}
}

export class BasicValidationFallback extends BaseFallbackStrategy {
	public id = 'basic-validation';
	public name = 'Basic Security Validation';
	public description = 'Simple security checks and validation';
	public priority = 85;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 100;
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['Security & Encryption Suite'];

	public isAvailable(): boolean {
		return true; // Always available
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const validation = await this.performSecurityValidation(context.inputData);

			return this.createBaseResult(
				validation.isValid,
				'medium',
				validation.warnings,
				validation.limitations,
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced security analysis',
						to: 'basic validation',
						reason: 'Advanced security tools unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Security validation failed'],
				['No validation available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'content',
						description: 'Security validation failed',
						severity: 'medium',
						impact: 'Security status unknown'
					}]
				}
			);
		}
	}

	private async performSecurityValidation(data: any): Promise<{
		isValid: boolean;
		warnings: string[];
		limitations: string[];
	}> {
		const warnings: string[] = [];
		const limitations: string[] = [];
		let isValid = true;

		const text = typeof data === 'string' ? data : JSON.stringify(data);

		// Basic security checks
		if (text.includes('<script>')) {
			warnings.push('Potential script injection detected');
			isValid = false;
		}

		if (text.includes('SELECT * FROM') || text.includes('DROP TABLE')) {
			warnings.push('Potential SQL injection detected');
			isValid = false;
		}

		if (text.includes('eval(') || text.includes('Function(')) {
			warnings.push('Potentially unsafe code evaluation');
		}

		// Check for sensitive information patterns
		const sensitivePatterns = [
			/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
			/\b\d{3}-\d{2}-\d{4}\b/, // SSN
			/password/i,
			/api[_-]?key/i
		];

		sensitivePatterns.forEach(pattern => {
			if (pattern.test(text)) {
				warnings.push('Sensitive information pattern detected');
			}
		});

		limitations.push('Basic pattern matching only');
		limitations.push('No deep security analysis');
		limitations.push('Limited to common attack patterns');

		return { isValid, warnings, limitations };
	}
}

export class FormatPreservingFallback extends BaseFallbackStrategy {
	public id = 'format-preserving';
	public name = 'Format-Preserving Processing';
	public description = 'Process data while preserving original format';
	public priority = 75;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 200;
	public dataLossRisk: DataLossRisk = 'low';
	public compatibility = ['Security & Encryption Suite'];

	public isAvailable(): boolean {
		return true; // Always available as basic text processing
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const processed = this.preserveFormatProcessing(context.inputData, context.operation);

			return this.createBaseResult(
				true,
				'medium',
				['Format preserved'],
				['Limited processing options'],
				{
					outputComplete: true,
					transformations: [{
						from: 'advanced secure processing',
						to: 'format-preserving processing',
						reason: 'Secure processor unavailable',
						potentialDataLoss: false
					}]
				}
			);
		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				['Format-preserving processing failed'],
				['No processing available'],
				{
					outputComplete: false,
					dataLoss: [{
						type: 'formatting',
						description: 'Format preservation failed',
						severity: 'medium',
						impact: 'Format may be lost'
					}]
				}
			);
		}
	}

	private preserveFormatProcessing(data: string, operation: string): string {
		// Process data while attempting to preserve original format
		const lines = data.split('\n');
		const processedLines: string[] = [];

		for (const line of lines) {
			const trimmed = line.trim();
			const prefix = line.substring(0, line.indexOf(trimmed));
			const suffix = line.substring(line.indexOf(trimmed) + trimmed.length);

			let processed = trimmed;

			// Apply basic processing based on operation
			switch (operation) {
				case 'sanitize':
					processed = trimmed.replace(/[<>]/g, '');
					break;
				case 'escape':
					processed = trimmed.replace(/["']/g, '\\$&');
					break;
				case 'normalize':
					processed = trimmed.replace(/\s+/g, ' ').trim();
					break;
			}

			processedLines.push(prefix + processed + suffix);
		}

		return processedLines.join('\n');
	}
}
