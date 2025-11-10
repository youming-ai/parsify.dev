'use client';

import { FileUpload } from '@/components/file-upload/file-upload';
import { DownloadButton } from '@/components/file-upload/download-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { GitCompare, FileText, Copy, Upload, Download, Settings, ArrowLeftRight, Zap, Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface TextComparisonResult {
	originalText: string;
	modifiedText: string;
	options: ComparisonOptions;
	stats: ComparisonStats;
	timestamp: Date;
	success: boolean;
	error?: string;
}

export interface ComparisonOptions {
	// Comparison type
	comparisonMode: 'side-by-side' | 'unified' | 'inline';

	// Sensitivity options
	caseSensitive: boolean;
	ignoreWhitespace: boolean;
	ignoreEmptyLines: boolean;

	// Display options
	showLineNumbers: boolean;
	showContext: boolean;
	contextLines: number;
	highlightChanges: boolean;

	// Analysis options
	calculateSimilarity: boolean;
	showStatistics: boolean;
	detectMoves: boolean;
}

export interface ComparisonStats {
	originalLines: number;
	modifiedLines: number;
	additions: number;
	deletions: number;
	modifications: number;
	moves: number;
	unchanged: number;
	similarity: number;
	differences: TextDifference[];
}

export interface TextDifference {
	type: 'addition' | 'deletion' | 'modification' | 'unchanged' | 'move';
	originalLine?: number;
	modifiedLine?: number;
	originalContent?: string;
	modifiedContent?: string;
	context?: string[];
}

interface TextComparatorProps {
	onComparisonComplete?: (result: TextComparisonResult) => void;
	className?: string;
}

// Comparison mode options
const comparisonModeOptions = [
	{ value: 'side-by-side', label: 'Side by Side', description: 'Show original and modified texts side by side' },
	{ value: 'unified', label: 'Unified', description: 'Show differences in unified format' },
	{ value: 'inline', label: 'Inline', description: 'Show changes inline within the text' },
];

// Example texts for comparison
const comparisonExamples = [
	{
		name: 'Simple Text Changes',
		original: 'Hello World!\nThis is the original text.\nIt has some content.\nEnd of text.',
		modified: 'Hello World!\nThis is the modified text.\nIt has different content.\nAnd a new line.\nEnd of text.',
		description: 'Basic text modifications with additions and changes',
	},
	{
		name: 'Code Example',
		original: 'function calculateSum(a, b) {\n    return a + b;\n}\n\nconst result = calculateSum(5, 3);',
		modified: 'function calculateSum(a, b) {\n    const sum = a + b;\n    return sum;\n}\n\nconst result = calculateSum(5, 3);\nconsole.log(result);',
		description: 'Code changes with variable modifications',
	},
	{
		name: 'List Changes',
		original: '- Item 1\n- Item 2\n- Item 3\n- Item 4',
		modified: '- Item 1\n- Item 2\n- Updated Item 3\n- Item 4\n- Item 5',
		description: 'List modifications with additions and updates',
	},
];

export function TextComparator({ onComparisonComplete, className }: TextComparatorProps) {
	const [originalText, setOriginalText] = React.useState('');
	const [modifiedText, setModifiedText] = React.useState('');
	const [comparisonResult, setComparisonResult] = React.useState<TextComparisonResult | null>(null);
	const [originalFiles, setOriginalFiles] = React.useState<File[]>([]);
	const [modifiedFiles, setModifiedFiles] = React.useState<File[]>([]);
	const [results, setResults] = React.useState<TextComparisonResult[]>([]);
	const [activeTab, setActiveTab] = React.useState<'text' | 'file'>('text');
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [showDifferences, setShowDifferences] = React.useState(true);

	const [options, setOptions] = React.useState<ComparisonOptions>({
		comparisonMode: 'side-by-side',
		caseSensitive: true,
		ignoreWhitespace: false,
		ignoreEmptyLines: false,
		showLineNumbers: true,
		showContext: true,
		contextLines: 3,
		highlightChanges: true,
		calculateSimilarity: true,
		showStatistics: true,
		detectMoves: true,
	});

	// Compare two texts
	const compareTexts = (original: string, modified: string, opts: ComparisonOptions): ComparisonStats => {
		const originalLines = preprocessText(original, opts).split('\n');
		const modifiedLines = preprocessText(modified, opts).split('\n');

		const differences: TextDifference[] = [];
		let additions = 0;
		let deletions = 0;
		let modifications = 0;
		let moves = 0;
		let unchanged = 0;

		// Simple line-by-line comparison algorithm
		// In a real implementation, you might use a more sophisticated diff algorithm
		const maxLines = Math.max(originalLines.length, modifiedLines.length);

		for (let i = 0; i < maxLines; i++) {
			const originalLine = i < originalLines.length ? originalLines[i] : '';
			const modifiedLine = i < modifiedLines.length ? modifiedLines[i] : '';

			if (originalLine === '' && modifiedLine !== '') {
				// Addition
				differences.push({
					type: 'addition',
					modifiedLine: i + 1,
					modifiedContent: modifiedLine,
				});
				additions++;
			} else if (originalLine !== '' && modifiedLine === '') {
				// Deletion
				differences.push({
					type: 'deletion',
					originalLine: i + 1,
					originalContent: originalLine,
				});
				deletions++;
			} else if (originalLine !== modifiedLine) {
				// Modification
				differences.push({
					type: 'modification',
					originalLine: i + 1,
					modifiedLine: i + 1,
					originalContent: originalLine,
					modifiedContent: modifiedLine,
				});
				modifications++;
			} else {
				// Unchanged
				differences.push({
					type: 'unchanged',
					originalLine: i + 1,
					modifiedLine: i + 1,
					originalContent: originalLine,
					modifiedContent: modifiedLine,
				});
				unchanged++;
			}
		}

		// Calculate similarity
		const totalLines = originalLines.length + modifiedLines.length;
		const similarity = totalLines > 0 ? ((unchanged * 2) / totalLines) * 100 : 100;

		return {
			originalLines: originalLines.length,
			modifiedLines: modifiedLines.length,
			additions,
			deletions,
			modifications,
			moves,
			unchanged,
			similarity,
			differences,
		};
	};

	// Preprocess text based on options
	const preprocessText = (text: string, opts: ComparisonOptions): string => {
		let processed = text;

		// Handle case sensitivity
		if (!opts.caseSensitive) {
			processed = processed.toLowerCase();
		}

		// Split into lines for line-based processing
		let lines = processed.split('\n');

		// Remove empty lines if option is enabled
		if (opts.ignoreEmptyLines) {
			lines = lines.filter(line => line.trim().length > 0);
		}

		// Handle whitespace
		if (opts.ignoreWhitespace) {
			lines = lines.map(line => line.trim().replace(/\s+/g, ' '));
		}

		return lines.join('\n');
	};

	// Process text comparison
	const processComparison = async () => {
		if (!originalText.trim() || !modifiedText.trim()) {
			toast.error('Please enter both original and modified text');
			return;
		}

		setIsProcessing(true);
		try {
			const stats = compareTexts(originalText, modifiedText, options);

			const result: TextComparisonResult = {
				originalText,
				modifiedText,
				options,
				stats,
				timestamp: new Date(),
				success: true,
			};

			setComparisonResult(result);
			setResults((prev) => [result, ...prev].slice(0, 10));
			onComparisonComplete?.(result);

			toast.success('Text comparison completed');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Comparison failed';
			toast.error(errorMessage);

			const errorResult: TextComparisonResult = {
				originalText,
				modifiedText,
				options,
				stats: {
					originalLines: originalText.split('\n').length,
					modifiedLines: modifiedText.split('\n').length,
					additions: 0,
					deletions: 0,
					modifications: 0,
					moves: 0,
					unchanged: 0,
					similarity: 0,
					differences: [],
				},
				timestamp: new Date(),
				success: false,
				error: errorMessage,
			};
			setResults((prev) => [errorResult, ...prev].slice(0, 10]);
		} finally {
			setIsProcessing(false);
		}
	};

	// Process file comparison
	const processFileComparison = async () => {
		if (originalFiles.length === 0 || modifiedFiles.length === 0) {
			toast.error('Please select both original and modified files');
			return;
		}

		setIsProcessing(true);
		try {
			for (let i = 0; i < Math.min(originalFiles.length, modifiedFiles.length); i++) {
				const originalFile = originalFiles[i];
				const modifiedFile = modifiedFiles[i];

				const originalText = await originalFile.text();
				const modifiedText = await modifiedFile.text();

				const stats = compareTexts(originalText, modifiedText, options);

				const result: TextComparisonResult = {
					originalText,
					modifiedText,
					options,
					stats,
					timestamp: new Date(),
					success: true,
				};

				setResults((prev) => [result, ...prev].slice(0, 10)]);
				onComparisonComplete?.(result);

				toast.success(`Compared ${originalFile.name} with ${modifiedFile.name}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'File comparison failed';
			toast.error(errorMessage);
		} finally {
			setIsProcessing(false);
		}
	};

	// Swap original and modified
	const swapTexts = () => {
		const temp = originalText;
		setOriginalText(modifiedText);
		setModifiedText(temp);
		toast.success('Texts swapped');
	};

	// Copy to clipboard
	const copyToClipboard = async (text: string, type: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`${type} copied to clipboard`);
		} catch (error) {
			toast.error(`Failed to copy ${type}`);
		}
	};

	// Download comparison report
	const downloadReport = () => {
		if (!comparisonResult) return;

		const report = generateComparisonReport(comparisonResult);
		const blob = new Blob([report], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'comparison-report.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success('Comparison report downloaded');
	};

	// Generate comparison report
	const generateComparisonReport = (result: TextComparisonResult): string => {
		return `
Text Comparison Report
======================

Generated: ${result.timestamp.toLocaleString()}
Comparison Mode: ${result.options.comparisonMode}

Summary:
--------
Original lines: ${result.stats.originalLines}
Modified lines: ${result.stats.modifiedLines}
Additions: ${result.stats.additions}
Deletions: ${result.stats.deletions}
Modifications: ${result.stats.modifications}
Similarity: ${result.stats.similarity.toFixed(2)}%

Detailed Changes:
---------------
${result.stats.differences.map(diff => {
		const typeSymbol = diff.type === 'addition' ? '+' :
						   diff.type === 'deletion' ? '-' :
						   diff.type === 'modification' ? '~' : ' ';
		const lineInfo = diff.originalLine ? `Line ${diff.originalLine}` :
						diff.modifiedLine ? `Line ${diff.modifiedLine}` : '';
		const content = diff.originalContent || diff.modifiedContent || '';
		return `${typeSymbol} ${lineInfo}: ${content}`;
	}).join('\n')}
		`.trim();
	};

	// Load example
	const loadExample = (example: typeof comparisonExamples[0]) => {
		setOriginalText(example.original);
		setModifiedText(example.modified);
	};

	// Clear all
	const clearAll = () => {
		setOriginalText('');
		setModifiedText('');
		setOriginalFiles([]);
		setModifiedFiles([]);
		setComparisonResult(null);
	};

	// Update option
	const updateOption = <K extends keyof ComparisonOptions>(
		key: K,
		value: ComparisonOptions[K]
	) => {
		setOptions(prev => ({ ...prev, [key]: value }));
	};

	// Render differences based on mode
	const renderDifferences = () => {
		if (!comparisonResult || !showDifferences) return null;

		const { stats, options } = comparisonResult;

		switch (options.comparisonMode) {
			case 'side-by-side':
				return renderSideBySide(stats.differences);
			case 'unified':
				return renderUnified(stats.differences);
			case 'inline':
				return renderInline(stats.differences);
			default:
				return renderSideBySide(stats.differences);
		}
	};

	// Render side-by-side view
	const renderSideBySide = (differences: TextDifference[]) => {
		return (
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<h4 className="font-medium text-sm mb-2">Original</h4>
					{differences.map((diff, index) => (
						<div key={index} className={`p-2 text-sm font-mono rounded ${
							diff.type === 'deletion' ? 'bg-red-50 text-red-800' :
							diff.type === 'modification' ? 'bg-yellow-50 text-yellow-800' :
							'bg-gray-50'
						}`}>
							{options.showLineNumbers && diff.originalLine && (
								<span className="text-gray-500 mr-2">{diff.originalLine}:</span>
							)}
							{diff.originalContent || ''}
						</div>
					))}
				</div>
				<div className="space-y-1">
					<h4 className="font-medium text-sm mb-2">Modified</h4>
					{differences.map((diff, index) => (
						<div key={index} className={`p-2 text-sm font-mono rounded ${
							diff.type === 'addition' ? 'bg-green-50 text-green-800' :
							diff.type === 'modification' ? 'bg-yellow-50 text-yellow-800' :
							'bg-gray-50'
						}`}>
							{options.showLineNumbers && diff.modifiedLine && (
								<span className="text-gray-500 mr-2">{diff.modifiedLine}:</span>
							)}
							{diff.modifiedContent || ''}
						</div>
					))}
				</div>
			</div>
		);
	};

	// Render unified view
	const renderUnified = (differences: TextDifference[]) => {
		return (
			<div className="space-y-1">
				{differences.map((diff, index) => (
					<div key={index} className={`p-2 text-sm font-mono rounded ${
						diff.type === 'addition' ? 'bg-green-50 text-green-800' :
						diff.type === 'deletion' ? 'bg-red-50 text-red-800' :
						diff.type === 'modification' ? 'bg-yellow-50 text-yellow-800' :
						'bg-gray-50'
					}`}>
						<span className="text-gray-500 mr-2">
							{diff.type === 'addition' ? '+' :
							 diff.type === 'deletion' ? '-' : ' '}
						</span>
						{options.showLineNumbers && (diff.originalLine || diff.modifiedLine) && (
							<span className="text-gray-500 mr-2">
								Line {diff.originalLine || diff.modifiedLine}:
							</span>
						)}
						{diff.originalContent || diff.modifiedContent || ''}
					</div>
				))}
			</div>
		);
	};

	// Render inline view
	const renderInline = (differences: TextDifference[]) => {
		return (
			<div className="space-y-2">
				{differences.map((diff, index) => (
					<div key={index} className="text-sm">
						{diff.type === 'modification' && (
							<div className="space-y-1">
								<div className="p-2 bg-red-50 text-red-800 font-mono rounded line-through">
									{diff.originalContent}
								</div>
								<div className="p-2 bg-green-50 text-green-800 font-mono rounded">
									{diff.modifiedContent}
								</div>
							</div>
						)}
						{diff.type !== 'modification' && (
							<div className={`p-2 font-mono rounded ${
								diff.type === 'addition' ? 'bg-green-50 text-green-800' :
								diff.type === 'deletion' ? 'bg-red-50 text-red-800' :
								'bg-gray-50'
							}`}>
								{diff.originalContent || diff.modifiedContent || ''}
							</div>
						)}
					</div>
				))}
			</div>
		);
	};

	return (
		<div className={className}>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<GitCompare className="h-6 w-6" />
						<h1 className="text-2xl font-bold">Text Comparator</h1>
					</div>
					<div className="flex items-center space-x-2">
						<div className="flex items-center space-x-2">
							<Switch
								checked={showDifferences}
								onCheckedChange={setShowDifferences}
							/>
							<Label>Show Differences</Label>
						</div>
						<Button variant="outline" size="sm" onClick={swapTexts}>
							<ArrowLeftRight className="h-4 w-4 mr-2" />
							Swap
						</Button>
					</div>
				</div>

				{/* Comparison Options */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Comparison Settings
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="basic" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="basic">Basic</TabsTrigger>
								<TabsTrigger value="display">Display</TabsTrigger>
								<TabsTrigger value="analysis">Analysis</TabsTrigger>
							</TabsList>

							<TabsContent value="basic" className="space-y-4">
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Comparison Mode</Label>
										<Select
											value={options.comparisonMode}
											onValueChange={(value: ComparisonOptions['comparisonMode']) => updateOption('comparisonMode', value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{comparisonModeOptions.map((mode) => (
													<SelectItem key={mode.value} value={mode.value}>
														<div>
															<div className="font-medium">{mode.label}</div>
															<div className="text-xs text-gray-500">{mode.description}</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.caseSensitive}
											onCheckedChange={(checked) => updateOption('caseSensitive', checked)}
										/>
										<Label>Case Sensitive</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.ignoreWhitespace}
											onCheckedChange={(checked) => updateOption('ignoreWhitespace', checked)}
										/>
										<Label>Ignore Whitespace</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.ignoreEmptyLines}
											onCheckedChange={(checked) => updateOption('ignoreEmptyLines', checked)}
										/>
										<Label>Ignore Empty Lines</Label>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="display" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.showLineNumbers}
											onCheckedChange={(checked) => updateOption('showLineNumbers', checked)}
										/>
										<Label>Show Line Numbers</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.showContext}
											onCheckedChange={(checked) => updateOption('showContext', checked)}
										/>
										<Label>Show Context</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.highlightChanges}
											onCheckedChange={(checked) => updateOption('highlightChanges', checked)}
										/>
										<Label>Highlight Changes</Label>
									</div>
								</div>
								<div className="space-y-2">
									<Label>Context Lines</Label>
									<Input
										type="number"
										min="0"
										max="10"
										value={options.contextLines}
										onChange={(e) => updateOption('contextLines', parseInt(e.target.value) || 3)}
									/>
								</div>
							</TabsContent>

							<TabsContent value="analysis" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.calculateSimilarity}
											onCheckedChange={(checked) => updateOption('calculateSimilarity', checked)}
										/>
										<Label>Calculate Similarity</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.showStatistics}
											onCheckedChange={(checked) => updateOption('showStatistics', checked)}
										/>
										<Label>Show Statistics</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.detectMoves}
											onCheckedChange={(checked) => updateOption('detectMoves', checked)}
										/>
										<Label>Detect Moves</Label>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{/* Input Selection */}
				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'text' | 'file')}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="text" className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Text Input
						</TabsTrigger>
						<TabsTrigger value="file" className="flex items-center gap-2">
							<Upload className="h-4 w-4" />
							File Input
						</TabsTrigger>
					</TabsList>

					<TabsContent value="text" className="space-y-4">
						<div className="grid md:grid-cols-2 gap-6">
							{/* Original Text */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span>Original Text</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => copyToClipboard(originalText, 'Original text')}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Textarea
										value={originalText}
										onChange={(e) => setOriginalText(e.target.value)}
										placeholder="Enter original text here..."
										className="min-h-40 font-mono"
									/>
									<div className="text-sm text-gray-500 mt-1">
										{originalText.length} characters, {originalText.split('\n').length} lines
									</div>
								</CardContent>
							</Card>

							{/* Modified Text */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span>Modified Text</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => copyToClipboard(modifiedText, 'Modified text')}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Textarea
										value={modifiedText}
										onChange={(e) => setModifiedText(e.target.value)}
										placeholder="Enter modified text here..."
										className="min-h-40 font-mono"
									/>
									<div className="text-sm text-gray-500 mt-1">
										{modifiedText.length} characters, {modifiedText.split('\n').length} lines
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Compare Button */}
						<div className="flex justify-center">
							<Button
								onClick={processComparison}
								disabled={isProcessing || !originalText.trim() || !modifiedText.trim()}
								size="lg"
								className="w-full md:w-auto"
							>
								{isProcessing ? (
									<>
										<Zap className="h-4 w-4 mr-2 animate-spin" />
										Comparing...
									</>
								) : (
									<>
										<GitCompare className="h-4 w-4 mr-2" />
										Compare Texts
									</>
								)}
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="file" className="space-y-4">
						<div className="grid md:grid-cols-2 gap-6">
							{/* Original Files */}
							<Card>
								<CardHeader>
									<CardTitle>Original Files</CardTitle>
								</CardHeader>
								<CardContent>
									<FileUpload
										files={originalFiles}
										onFilesChange={setOriginalFiles}
										maxFiles={5}
										acceptedFormats={['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c']}
									/>
								</CardContent>
							</Card>

							{/* Modified Files */}
							<Card>
								<CardHeader>
									<CardTitle>Modified Files</CardTitle>
								</CardHeader>
								<CardContent>
									<FileUpload
										files={modifiedFiles}
										onFilesChange={setModifiedFiles}
										maxFiles={5}
										acceptedFormats={['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c']}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Compare Files Button */}
						<div className="flex justify-center">
							<Button
								onClick={processFileComparison}
								disabled={isProcessing || originalFiles.length === 0 || modifiedFiles.length === 0}
								size="lg"
								className="w-full md:w-auto"
							>
								{isProcessing ? (
									<>
										<Zap className="h-4 w-4 mr-2 animate-spin" />
										Comparing Files...
									</>
								) : (
									<>
										<GitCompare className="h-4 w-4 mr-2" />
										Compare Files
									</>
								)}
							</Button>
						</div>
					</TabsContent>
				</Tabs>

				{/* Comparison Results */}
				{comparisonResult && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Comparison Results</span>
								<div className="flex gap-2">
									<Button variant="outline" size="sm" onClick={downloadReport}>
										<Download className="h-4 w-4 mr-2" />
										Report
									</Button>
									<Button variant="outline" size="sm" onClick={clearAll}>
										Clear
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="overview" className="w-full">
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="overview">Overview</TabsTrigger>
									<TabsTrigger value="differences">Differences</TabsTrigger>
									<TabsTrigger value="statistics">Statistics</TabsTrigger>
								</TabsList>

								<TabsContent value="overview" className="space-y-4">
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
										<div className="p-4 bg-muted/50 rounded-lg">
											<div className="text-2xl font-bold text-green-600">
												{comparisonResult.stats.additions}
											</div>
											<div className="text-sm text-muted-foreground">Additions</div>
										</div>
										<div className="p-4 bg-muted/50 rounded-lg">
											<div className="text-2xl font-bold text-red-600">
												{comparisonResult.stats.deletions}
											</div>
											<div className="text-sm text-muted-foreground">Deletions</div>
										</div>
										<div className="p-4 bg-muted/50 rounded-lg">
											<div className="text-2xl font-bold text-yellow-600">
												{comparisonResult.stats.modifications}
											</div>
											<div className="text-sm text-muted-foreground">Modifications</div>
										</div>
										<div className="p-4 bg-muted/50 rounded-lg">
											<div className="text-2xl font-bold text-blue-600">
												{comparisonResult.stats.similarity.toFixed(1)}%
											</div>
											<div className="text-sm text-muted-foreground">Similarity</div>
										</div>
									</div>
								</TabsContent>

								<TabsContent value="differences" className="space-y-4">
									<div className="space-y-2">
										<div className="flex items-center space-x-4 text-sm font-medium">
											<div className="flex items-center space-x-2">
												<div className="w-3 h-3 bg-green-500 rounded"></div>
												<span>Additions</span>
											</div>
											<div className="flex items-center space-x-2">
												<div className="w-3 h-3 bg-red-500 rounded"></div>
												<span>Deletions</span>
											</div>
											<div className="flex items-center space-x-2">
												<div className="w-3 h-3 bg-yellow-500 rounded"></div>
												<span>Modifications</span>
											</div>
										</div>
										<div className="max-h-96 overflow-auto border rounded">
											{renderDifferences()}
										</div>
									</div>
								</TabsContent>

								<TabsContent value="statistics" className="space-y-4">
									<div className="grid md:grid-cols-2 gap-6">
										<div>
											<h4 className="font-medium mb-2">Text Statistics</h4>
											<div className="space-y-1 text-sm">
												<div>Original Lines: {comparisonResult.stats.originalLines}</div>
												<div>Modified Lines: {comparisonResult.stats.modifiedLines}</div>
												<div>Original Characters: {comparisonResult.originalText.length}</div>
												<div>Modified Characters: {comparisonResult.modifiedText.length}</div>
											</div>
										</div>
										<div>
											<h4 className="font-medium mb-2">Change Summary</h4>
											<div className="space-y-1 text-sm">
												<div>Total Changes: {comparisonResult.stats.differences.length}</div>
												<div>Unchanged Lines: {comparisonResult.stats.unchanged}</div>
												<div>Similarity Score: {comparisonResult.stats.similarity.toFixed(2)}%</div>
												<div>Comparison Mode: {options.comparisonMode}</div>
											</div>
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				)}

				{/* Examples */}
				<Card>
					<CardHeader>
						<CardTitle>Examples</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid md:grid-cols-3 gap-4">
							{comparisonExamples.map((example, index) => (
								<div key={index} className="p-3 border rounded">
									<div className="font-medium mb-1">{example.name}</div>
									<div className="text-sm text-gray-600 mb-2">{example.description}</div>
									<div className="bg-gray-50 p-2 rounded max-h-16 overflow-y-auto">
										<div className="font-mono text-xs">{example.original}</div>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => loadExample(example)}
										className="mt-2 w-full"
									>
										Load Example
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Recent Results */}
				{results.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Recent Comparisons</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{results.slice(0, 5).map((result, index) => (
									<div key={index} className="p-3 border rounded">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<Badge variant={result.success ? "default" : "destructive"}>
													{result.success ? 'Success' : 'Error'}
												</Badge>
												<Badge variant="outline">{result.options.comparisonMode}</Badge>
												{result.stats.similarity > 0 && (
													<Badge variant="secondary">
														{result.stats.similarity.toFixed(1)}% similar
													</Badge>
												)}
											</div>
											<span className="text-xs text-gray-500">{result.timestamp.toLocaleTimeString()}</span>
										</div>
										<div className="text-sm">
											<div>
												{result.stats.additions} additions, {result.stats.deletions} deletions,
												{result.stats.modifications} modifications
											</div>
											{result.error && <div className="text-xs text-red-600 mt-1">{result.error}</div>}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
