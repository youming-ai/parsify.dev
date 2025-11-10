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
import { FileText, Format, Copy, Upload, Download, Settings, Trash2, Zap } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface FormattingResult {
	originalText: string;
	formattedText: string;
	options: FormattingOptions;
	stats: FormattingStats;
	timestamp: Date;
	success: boolean;
	error?: string;
}

export interface FormattingOptions {
	// Case conversion
	caseConversion: 'none' | 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'pascal' | 'snake' | 'kebab';

	// Whitespace handling
	trimLines: boolean;
	trimWhitespace: boolean;
	normalizeWhitespace: boolean;
	convertTabsToSpaces: boolean;

	// Line handling
	removeEmptyLines: boolean;
	removeDuplicateEmptyLines: boolean;
	maxLineLength: number;
	lineEndings: 'lf' | 'crlf' | 'cr';

	// Text cleaning
	removeSpecialChars: boolean;
	preserveNumbers: boolean;
	preserveEmails: boolean;
	preserveUrls: boolean;

	// Indentation
	indentationType: 'spaces' | 'tabs';
	indentationSize: number;

	// Advanced options
	preserveFormatting: boolean;
	escapeMarkdown: boolean;
	unescapeMarkdown: boolean;
}

export interface FormattingStats {
	originalLength: number;
	formattedLength: number;
	originalLines: number;
	formattedLines: number;
	changes: number;
	charactersRemoved: number;
	charactersAdded: number;
}

interface TextFormatterProps {
	onFormattingComplete?: (result: FormattingResult) => void;
	className?: string;
}

// Case conversion options
const caseConversionOptions = [
	{ value: 'none', label: 'No Change', example: 'Hello World' },
	{ value: 'upper', label: 'UPPERCASE', example: 'HELLO WORLD' },
	{ value: 'lower', label: 'lowercase', example: 'hello world' },
	{ value: 'title', label: 'Title Case', example: 'Hello World' },
	{ value: 'sentence', label: 'Sentence case', example: 'Hello world' },
	{ value: 'camel', label: 'camelCase', example: 'helloWorld' },
	{ value: 'pascal', label: 'PascalCase', example: 'HelloWorld' },
	{ value: 'snake', label: 'snake_case', example: 'hello_world' },
	{ value: 'kebab', label: 'kebab-case', example: 'hello-world' },
];

// Example texts for formatting
const formattingExamples = [
	{
		name: 'Messy Text',
		input: '  Hello   WORLD!   \n\n\n  This   is   a   messY   text   with   EXTRA   spaces...   \n\n   ',
		description: 'Text with excessive whitespace and inconsistent casing',
	},
	{
		name: 'Code Variables',
		input: 'user_name_var = get_user_data();\nprocess_user_information(user_name_var);\nreturn_formatted_result();',
		description: 'Programming code with inconsistent naming',
	},
	{
		name: 'Mixed Content',
		input: 'Contact: user.email@example.com or visit https://example.com/path?query=value\nCall: +1-555-123-4567',
		description: 'Text with emails and URLs to preserve',
	},
	{
		name: 'Markdown Text',
		input: '# **Bold** Title\n\nThis is *italic* text with `code` snippets.\n\n- List item 1\n- List item 2',
		description: 'Markdown formatted text',
	},
];

export function TextFormatter({ onFormattingComplete, className }: TextFormatterProps) {
	const [inputText, setInputText] = React.useState('');
	const [formattedText, setFormattedText] = React.useState('');
	const [inputFiles, setInputFiles] = React.useState<File[]>([]);
	const [results, setResults] = React.useState<FormattingResult[]>([]);
	const [activeTab, setActiveTab] = React.useState<'text' | 'file'>('text');
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [autoFormat, setAutoFormat] = React.useState(true);

	const [options, setOptions] = React.useState<FormattingOptions>({
		caseConversion: 'none',
		trimLines: true,
		trimWhitespace: true,
		normalizeWhitespace: true,
		convertTabsToSpaces: true,
		removeEmptyLines: false,
		removeDuplicateEmptyLines: true,
		maxLineLength: 0,
		lineEndings: 'lf',
		removeSpecialChars: false,
		preserveNumbers: true,
		preserveEmails: true,
		preserveUrls: true,
		indentationType: 'spaces',
		indentationSize: 4,
		preserveFormatting: false,
		escapeMarkdown: false,
		unescapeMarkdown: false,
	});

	// Formatting functions
	const formatText = (text: string, opts: FormattingOptions): string => {
		let formatted = text;

		// Handle line endings first
		formatted = normalizeLineEndings(formatted, opts.lineEndings);

		// Convert tabs to spaces if enabled
		if (opts.convertTabsToSpaces) {
			const spaces = ' '.repeat(opts.indentationSize);
			formatted = formatted.replace(/\t/g, spaces);
		}

		// Split into lines for processing
		let lines = formatted.split('\n');

		// Trim lines if enabled
		if (opts.trimLines) {
			lines = lines.map((line) => line.trim());
		}

		// Remove empty lines if enabled
		if (opts.removeEmptyLines) {
			lines = lines.filter((line) => line.length > 0);
		} else if (opts.removeDuplicateEmptyLines) {
			lines = lines.filter((line, index, array) => line.length > 0 || index === 0 || array[index - 1].length > 0);
		}

		// Process each line
		lines = lines.map((line) => {
			let processedLine = line;

			// Whitespace normalization
			if (opts.normalizeWhitespace) {
				processedLine = processedLine.replace(/\s+/g, ' ');
			}

			// Trim whitespace if enabled
			if (opts.trimWhitespace) {
				processedLine = processedLine.trim();
			}

			// Remove special characters if enabled
			if (opts.removeSpecialChars) {
				processedLine = removeSpecialCharacters(processedLine, opts);
			}

			// Apply case conversion
			if (opts.caseConversion !== 'none') {
				processedLine = convertCase(processedLine, opts.caseConversion);
			}

			// Handle max line length
			if (opts.maxLineLength > 0 && processedLine.length > opts.maxLineLength) {
				processedLine = wrapText(processedLine, opts.maxLineLength);
			}

			return processedLine;
		});

		// Rejoin lines
		formatted = lines.join('\n');

		// Handle markdown escaping/unescaping
		if (opts.escapeMarkdown) {
			formatted = escapeMarkdownText(formatted);
		} else if (opts.unescapeMarkdown) {
			formatted = unescapeMarkdownText(formatted);
		}

		return formatted;
	};

	// Helper functions
	const normalizeLineEndings = (text: string, type: 'lf' | 'crlf' | 'cr'): string => {
		switch (type) {
			case 'lf':
				return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
			case 'crlf':
				return text
					.replace(/\r\n/g, '\n')
					.replace(/\n/g, '\r\n')
					.replace(/\r(?!\n)/g, '\r\n');
			case 'cr':
				return text.replace(/\r\n/g, '\n').replace(/\n/g, '\r');
			default:
				return text;
		}
	};

	const removeSpecialCharacters = (text: string, opts: FormattingOptions): string => {
		// Create regex pattern based on preservation options
		let pattern = '[^\\w\\s';

		if (opts.preserveEmails) {
			pattern += '@._-';
		}
		if (opts.preserveUrls) {
			pattern += ':/.?=&#-';
		}
		if (opts.preserveNumbers) {
			pattern += '+-()';
		}

		pattern += ']';

		const regex = new RegExp(pattern, 'g');
		return text.replace(regex, '');
	};

	const convertCase = (text: string, conversion: string): string => {
		switch (conversion) {
			case 'upper':
				return text.toUpperCase();
			case 'lower':
				return text.toLowerCase();
			case 'title':
				return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
			case 'sentence':
				return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
			case 'camel':
				return text
					.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
					.replace(/\s+/g, '');
			case 'pascal':
				return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, '');
			case 'snake':
				return text
					.toLowerCase()
					.replace(/\s+/g, '_')
					.replace(/[^a-z0-9_]/g, '');
			case 'kebab':
				return text
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, '');
			default:
				return text;
		}
	};

	const wrapText = (text: string, maxLength: number): string => {
		const words = text.split(' ');
		const lines: string[] = [];
		let currentLine = '';

		for (const word of words) {
			if ((currentLine + ' ' + word).length <= maxLength) {
				currentLine += (currentLine ? ' ' : '') + word;
			} else {
				if (currentLine) {
					lines.push(currentLine);
					currentLine = word;
				} else {
					// Word is longer than max length, break it
					lines.push(word.substring(0, maxLength));
					currentLine = word.substring(maxLength);
				}
			}
		}

		if (currentLine) {
			lines.push(currentLine);
		}

		return lines.join('\n');
	};

	const escapeMarkdownText = (text: string): string => {
		return text
			.replace(/\*/g, '\\*')
			.replace(/#/g, '\\#')
			.replace(/`/g, '\\`')
			.replace(/\[/g, '\\[')
			.replace(/\]/g, '\\]');
	};

	const unescapeMarkdownText = (text: string): string => {
		return text
			.replace(/\\\*/g, '*')
			.replace(/\\#/g, '#')
			.replace(/\\`/g, '`')
			.replace(/\\\[/g, '[')
			.replace(/\\\]/g, ']');
	};

	// Process text formatting
	const processText = async () => {
		if (!inputText.trim()) {
			toast.error('Please enter text to format');
			return;
		}

		setIsProcessing(true);
		try {
			const formatted = formatText(inputText, options);
			setFormattedText(formatted);

			const stats: FormattingStats = {
				originalLength: inputText.length,
				formattedLength: formatted.length,
				originalLines: inputText.split('\n').length,
				formattedLines: formatted.split('\n').length,
				changes: inputText !== formatted ? 1 : 0,
				charactersRemoved: Math.max(0, inputText.length - formatted.length),
				charactersAdded: Math.max(0, formatted.length - inputText.length),
			};

			const result: FormattingResult = {
				originalText: inputText,
				formattedText: formatted,
				options,
				stats,
				timestamp: new Date(),
				success: true,
			};

			setResults((prev) => [result, ...prev].slice(0, 10));
			onFormattingComplete?.(result);

			toast.success('Text formatted successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Formatting failed';
			toast.error(errorMessage);
			setFormattedText('');

			const errorResult: FormattingResult = {
				originalText: inputText,
				formattedText: '',
				options,
				stats: {
					originalLength: inputText.length,
					formattedLength: 0,
					originalLines: inputText.split('\n').length,
					formattedLines: 0,
					changes: 0,
					charactersRemoved: 0,
					charactersAdded: 0,
				},
				timestamp: new Date(),
				success: false,
				error: errorMessage,
			};
			setResults((prev) => [errorResult, ...prev].slice(0, 10));
		} finally {
			setIsProcessing(false);
		}
	};

	// Process file formatting
	const processFiles = async () => {
		if (inputFiles.length === 0) {
			toast.error('Please select files to format');
			return;
		}

		setIsProcessing(true);
		for (const file of inputFiles) {
			try {
				const text = await file.text();
				const formatted = formatText(text, options);

				const stats: FormattingStats = {
					originalLength: text.length,
					formattedLength: formatted.length,
					originalLines: text.split('\n').length,
					formattedLines: formatted.split('\n').length,
					changes: text !== formatted ? 1 : 0,
					charactersRemoved: Math.max(0, text.length - formatted.length),
					charactersAdded: Math.max(0, formatted.length - text.length),
				};

				const result: FormattingResult = {
					originalText: text,
					formattedText: formatted,
					options,
					stats,
					timestamp: new Date(),
					success: true,
				};

				setResults((prev) => [result, ...prev].slice(0, 10));
				onFormattingComplete?.(result);

				toast.success(`Formatted ${file.name}`);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
				toast.error(`${file.name}: ${errorMessage}`);
			}
		}
		setIsProcessing(false);
	};

	// Copy to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Copied to clipboard');
		} catch (error) {
			toast.error('Failed to copy to clipboard');
		}
	};

	// Load example
	const loadExample = (example: (typeof formattingExamples)[0]) => {
		setInputText(example.input);
	};

	// Clear all
	const clearAll = () => {
		setInputText('');
		setFormattedText('');
		setInputFiles([]);
	};

	// Reset options to defaults
	const resetOptions = () => {
		setOptions({
			caseConversion: 'none',
			trimLines: true,
			trimWhitespace: true,
			normalizeWhitespace: true,
			convertTabsToSpaces: true,
			removeEmptyLines: false,
			removeDuplicateEmptyLines: true,
			maxLineLength: 0,
			lineEndings: 'lf',
			removeSpecialChars: false,
			preserveNumbers: true,
			preserveEmails: true,
			preserveUrls: true,
			indentationType: 'spaces',
			indentationSize: 4,
			preserveFormatting: false,
			escapeMarkdown: false,
			unescapeMarkdown: false,
		});
		toast.success('Options reset to defaults');
	};

	// Update option
	const updateOption = <K extends keyof FormattingOptions>(key: K, value: FormattingOptions[K]) => {
		setOptions((prev) => ({ ...prev, [key]: value }));
	};

	// Auto-format when input or options change
	React.useEffect(() => {
		if (autoFormat && activeTab === 'text' && inputText.trim()) {
			const timer = setTimeout(() => {
				try {
					const formatted = formatText(inputText, options);
					setFormattedText(formatted);
				} catch {
					setFormattedText('');
				}
			}, 300);

			return () => clearTimeout(timer);
		} else if (!autoFormat) {
			setFormattedText('');
		}
	}, [inputText, options, autoFormat, activeTab]);

	return (
		<div className={className}>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Format className="h-6 w-6" />
						<h1 className="text-2xl font-bold">Text Formatter</h1>
					</div>
					<div className="flex items-center space-x-2">
						<div className="flex items-center space-x-2">
							<Switch checked={autoFormat} onCheckedChange={setAutoFormat} />
							<Label>Auto Format</Label>
						</div>
						<Button variant="outline" size="sm" onClick={resetOptions}>
							<Settings className="h-4 w-4 mr-2" />
							Reset Options
						</Button>
					</div>
				</div>

				{/* Formatting Options */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Formatting Options
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="basic" className="w-full">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="basic">Basic</TabsTrigger>
								<TabsTrigger value="whitespace">Whitespace</TabsTrigger>
								<TabsTrigger value="lines">Lines</TabsTrigger>
								<TabsTrigger value="advanced">Advanced</TabsTrigger>
							</TabsList>

							<TabsContent value="basic" className="space-y-4">
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Case Conversion</Label>
										<Select
											value={options.caseConversion}
											onValueChange={(value: FormattingOptions['caseConversion']) =>
												updateOption('caseConversion', value)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{caseConversionOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														<div>
															<div className="font-medium">{option.label}</div>
															<div className="text-xs text-gray-500">{option.example}</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="whitespace" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.trimWhitespace}
											onCheckedChange={(checked) => updateOption('trimWhitespace', checked)}
										/>
										<Label>Trim Whitespace</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.normalizeWhitespace}
											onCheckedChange={(checked) => updateOption('normalizeWhitespace', checked)}
										/>
										<Label>Normalize Whitespace</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.convertTabsToSpaces}
											onCheckedChange={(checked) => updateOption('convertTabsToSpaces', checked)}
										/>
										<Label>Convert Tabs to Spaces</Label>
									</div>
								</div>
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Indentation Type</Label>
										<Select
											value={options.indentationType}
											onValueChange={(value: FormattingOptions['indentationType']) =>
												updateOption('indentationType', value)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="spaces">Spaces</SelectItem>
												<SelectItem value="tabs">Tabs</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Indentation Size</Label>
										<Input
											type="number"
											min="1"
											max="16"
											value={options.indentationSize}
											onChange={(e) => updateOption('indentationSize', parseInt(e.target.value) || 4)}
										/>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="lines" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.trimLines}
											onCheckedChange={(checked) => updateOption('trimLines', checked)}
										/>
										<Label>Trim Lines</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.removeEmptyLines}
											onCheckedChange={(checked) => updateOption('removeEmptyLines', checked)}
										/>
										<Label>Remove Empty Lines</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.removeDuplicateEmptyLines}
											onCheckedChange={(checked) => updateOption('removeDuplicateEmptyLines', checked)}
										/>
										<Label>Remove Duplicate Empty Lines</Label>
									</div>
								</div>
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Line Endings</Label>
										<Select
											value={options.lineEndings}
											onValueChange={(value: FormattingOptions['lineEndings']) => updateOption('lineEndings', value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="lf">LF (Unix/Linux)</SelectItem>
												<SelectItem value="crlf">CRLF (Windows)</SelectItem>
												<SelectItem value="cr">CR (Classic Mac)</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Max Line Length (0 = no limit)</Label>
										<Input
											type="number"
											min="0"
											value={options.maxLineLength}
											onChange={(e) => updateOption('maxLineLength', parseInt(e.target.value) || 0)}
										/>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="advanced" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.removeSpecialChars}
											onCheckedChange={(checked) => updateOption('removeSpecialChars', checked)}
										/>
										<Label>Remove Special Characters</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.preserveNumbers}
											onCheckedChange={(checked) => updateOption('preserveNumbers', checked)}
										/>
										<Label>Preserve Numbers</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.preserveEmails}
											onCheckedChange={(checked) => updateOption('preserveEmails', checked)}
										/>
										<Label>Preserve Emails</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.preserveUrls}
											onCheckedChange={(checked) => updateOption('preserveUrls', checked)}
										/>
										<Label>Preserve URLs</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.escapeMarkdown}
											onCheckedChange={(checked) => updateOption('escapeMarkdown', checked)}
										/>
										<Label>Escape Markdown</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.unescapeMarkdown}
											onCheckedChange={(checked) => updateOption('unescapeMarkdown', checked)}
										/>
										<Label>Unescape Markdown</Label>
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
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									<span>Text to Format</span>
									<Button variant="outline" size="sm" onClick={clearAll}>
										<Trash2 className="h-4 w-4 mr-1" />
										Clear
									</Button>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Textarea
										value={inputText}
										onChange={(e) => setInputText(e.target.value)}
										placeholder="Enter text to format..."
										className="min-h-40 font-mono"
									/>
									<div className="text-sm text-gray-500 mt-1">
										{inputText.length} characters, {inputText.split('\n').length} lines
									</div>
								</div>

								{!autoFormat && (
									<Button onClick={processText} disabled={isProcessing} className="w-full">
										{isProcessing ? 'Processing...' : 'Format Text'}
									</Button>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="file" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Files to Format</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FileUpload
									files={inputFiles}
									onFilesChange={setInputFiles}
									maxFiles={10}
									acceptedFormats={[
										'txt',
										'md',
										'csv',
										'json',
										'xml',
										'html',
										'css',
										'js',
										'ts',
										'py',
										'java',
										'cpp',
										'c',
									]}
								/>
								<Button onClick={processFiles} disabled={inputFiles.length === 0 || isProcessing} className="w-full">
									{isProcessing
										? 'Processing...'
										: `Format ${inputFiles.length} File${inputFiles.length !== 1 ? 's' : ''}`}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Formatted Output */}
				{formattedText && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Formatted Text</span>
								<div className="flex gap-2">
									<Button variant="ghost" size="sm" onClick={() => copyToClipboard(formattedText)}>
										<Copy className="h-4 w-4 mr-1" />
										Copy
									</Button>
									<DownloadButton content={formattedText} fileName="formatted.txt" mimeType="text/plain" />
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								value={formattedText}
								onChange={(e) => setFormattedText(e.target.value)}
								className="min-h-40 font-mono"
							/>
							<div className="text-sm text-gray-500 mt-1">
								{formattedText.length} characters, {formattedText.split('\n').length} lines
							</div>
						</CardContent>
					</Card>
				)}

				{/* Examples */}
				<Card>
					<CardHeader>
						<CardTitle>Examples</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid md:grid-cols-2 gap-4">
							{formattingExamples.map((example, index) => (
								<div key={index} className="p-3 border rounded">
									<div className="font-medium mb-1">{example.name}</div>
									<div className="text-sm text-gray-600 mb-2">{example.description}</div>
									<div className="bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
										<div className="font-mono text-xs">{example.input}</div>
									</div>
									<Button variant="outline" size="sm" onClick={() => loadExample(example)} className="mt-2 w-full">
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
							<CardTitle>Recent Results</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{results.slice(0, 5).map((result, index) => (
									<div key={index} className="p-3 border rounded">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<Badge variant={result.success ? 'default' : 'destructive'}>
													{result.success ? 'Success' : 'Error'}
												</Badge>
												{result.stats.changes > 0 && (
													<Badge variant="secondary">
														{result.stats.charactersRemoved > 0 && `-${result.stats.charactersRemoved}`}
														{result.stats.charactersAdded > 0 && result.stats.charactersRemoved > 0 && '+'}
														{result.stats.charactersAdded > 0 && `+${result.stats.charactersAdded}`}
													</Badge>
												)}
											</div>
											<span className="text-xs text-gray-500">{result.timestamp.toLocaleTimeString()}</span>
										</div>
										<div className="text-sm">
											<div>
												{result.stats.originalLines} → {result.stats.formattedLines} lines,
												{result.stats.originalLength} → {result.stats.formattedLength} chars
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
