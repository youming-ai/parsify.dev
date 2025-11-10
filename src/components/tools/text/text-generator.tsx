'use client';

import { DownloadButton } from '@/components/file-upload/download-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
	Zap,
	Copy,
	Download,
	RefreshCw,
	Hash,
	FileText,
	Key,
	Type,
	Settings,
	Info,
	Dice3
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface TextGenerationResult {
	generatedText: string;
	generatorType: string;
	options: GenerationOptions;
	timestamp: Date;
	success: boolean;
	error?: string;
}

export interface GenerationOptions {
	// Common options
	quantity: number;
	length: number;

	// Lorem ipsum options
	loremType: 'standard' | 'business' | 'tech' | 'legal' | 'medical';
	startWithLorem: boolean;

	// Password options
	passwordLength: number;
	includeUppercase: boolean;
	includeLowercase: boolean;
	includeNumbers: boolean;
	includeSymbols: boolean;
	excludeSimilar: boolean;

	// UUID options
	uuidVersion: 'v4' | 'v1' | 'v3' | 'v5';
	uuidNamespace?: string;
	uuidName?: string;

	// Random text options
	charset: string;
	separator: string;
	prefix: string;
	suffix: string;

	// Custom patterns
	customPattern?: string;

	// Advanced options
	caseFormat: 'original' | 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'kebab';
	includeSpaces: boolean;
	lineBreaks: number;
}

interface TextGeneratorProps {
	onGenerationComplete?: (result: TextGenerationResult) => void;
	className?: string;
}

// Generator types
const generatorTypes = [
	{ value: 'lorem', label: 'Lorem Ipsum', description: 'Generate placeholder text' },
	{ value: 'password', label: 'Password', description: 'Generate secure passwords' },
	{ value: 'uuid', label: 'UUID', description: 'Generate unique identifiers' },
	{ value: 'random', label: 'Random Text', description: 'Generate random character sequences' },
	{ value: 'hash', label: 'Hash', description: 'Generate hash values' },
	{ value: 'pattern', label: 'Custom Pattern', description: 'Generate text from patterns' },
];

// Lorem ipsum variations
const loremVariations = {
	standard: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
	business: `Strategic synergy drives innovative solutions across global markets. Our enterprise-level approach leverages cutting-edge technology to optimize workflow efficiency and maximize ROI. Key performance indicators demonstrate significant improvement in operational metrics. Stakeholder engagement remains paramount to sustainable growth and market penetration.`,
	tech: `Function initializeComponent(config) { const state = useState(); const effects = useEffect(() => { fetchData().then(response => { setState(response.data); }).catch(error => { console.error('API Error:', error); }); }, []); return <Component state={state} effects={effects} />; }`,
	legal: `WHEREAS, the parties hereto agree to the terms and conditions set forth herein; NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows: This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction specified herein.`,
	medical: `Patient presents with symptoms consistent with acute respiratory infection. Vital signs: BP 120/80, HR 72, RR 16, Temp 98.6°F. Physical examination reveals clear lung fields bilaterally, no cardiac murmurs, and regular rhythm. Recommend supportive care and follow-up in 48 hours if symptoms persist.`,
};

// Character sets for random generation
const charsets = {
	alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
	alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	numeric: '0123456789',
	hexadecimal: '0123456789ABCDEF',
	symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
	printable: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// Pattern tokens
const patternTokens = {
	'{l}': 'abcdefghijklmnopqrstuvwxyz',
	'{u}': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'{d}': '0123456789',
	'{s}': '!@#$%^&*()_+-=[]{}|;:,.<>?',
	'{a}': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
	'{w}': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',
};

export function TextGenerator({ onGenerationComplete, className }: TextGeneratorProps) {
	const [generatedText, setGeneratedText] = React.useState('');
	const [results, setResults] = React.useState<TextGenerationResult[]>([]);
	const [generatorType, setGeneratorType] = React.useState('lorem');
	const [isGenerating, setIsGenerating] = React.useState(false);
	const [autoCopy, setAutoCopy] = React.useState(false);

	const [options, setOptions] = React.useState<GenerationOptions>({
		quantity: 1,
		length: 100,
		loremType: 'standard',
		startWithLorem: true,
		passwordLength: 16,
		includeUppercase: true,
		includeLowercase: true,
		includeNumbers: true,
		includeSymbols: false,
		excludeSimilar: false,
		uuidVersion: 'v4',
		charset: 'alphanumeric',
		separator: '\n',
		prefix: '',
		suffix: '',
		caseFormat: 'original',
		includeSpaces: false,
		lineBreaks: 0,
	});

	// Generate lorem ipsum text
	const generateLorem = (opts: GenerationOptions): string => {
		const baseText = loremVariations[opts.loremType as keyof typeof loremVariations];
		const words = baseText.split(' ');
		const targetWords = Math.floor(opts.length / 5); // Average word length is 5

		let result = '';
		let wordCount = 0;

		// Add "Lorem ipsum" at the beginning if requested
		if (opts.startWithLorem) {
			result = 'Lorem ipsum ';
			wordCount = 2;
		}

		// Generate text by repeating and shuffling words
		while (wordCount < targetWords) {
			const word = words[wordCount % words.length];
			result += word + ' ';
			wordCount++;
		}

		// Trim to exact length
		result = result.substring(0, opts.length).trim();

		// Add line breaks if requested
		if (opts.lineBreaks > 0) {
			const wordsPerLine = Math.floor(result.length / (opts.lineBreaks + 1));
			let formattedResult = '';
			for (let i = 0; i < result.length; i += wordsPerLine) {
				formattedResult += result.substring(i, i + wordsPerLine) + '\n';
			}
			result = formattedResult.trim();
		}

		return applyCaseFormat(result, opts.caseFormat);
	};

	// Generate password
	const generatePassword = (opts: GenerationOptions): string => {
		let charset = '';
		if (opts.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
		if (opts.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		if (opts.includeNumbers) charset += '0123456789';
		if (opts.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

		if (opts.excludeSimilar) {
			charset = charset.replace(/[ilLI1oO0]/g, '');
		}

		if (charset === '') {
			throw new Error('At least one character type must be selected');
		}

		let password = '';
		for (let i = 0; i < opts.passwordLength; i++) {
			password += charset.charAt(Math.floor(Math.random() * charset.length));
		}

		return password;
	};

	// Generate UUID
	const generateUUID = (opts: GenerationOptions): string => {
		switch (opts.uuidVersion) {
			case 'v4':
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
					const r = Math.random() * 16 | 0;
					const v = c === 'x' ? r : (r & 0x3 | 0x8);
					return v.toString(16);
				});
			case 'v1':
				// Simplified v1 UUID (timestamp-based)
				const timestamp = Date.now();
				const randomHex = Math.random().toString(16).substring(2);
				return `${timestamp}-${randomHex.substring(0, 4)}-1${randomHex.substring(4, 7)}-8${randomHex.substring(7, 11)}-${randomHex.substring(0, 12)}`;
			default:
				// Fallback to v4
				return generateUUID({ ...opts, uuidVersion: 'v4' });
		}
	};

	// Generate random text
	const generateRandomText = (opts: GenerationOptions): string => {
		const charset = charsets[opts.charset as keyof typeof charsets] || charsets.alphanumeric;
		let result = '';

		for (let i = 0; i < opts.length; i++) {
			result += charset.charAt(Math.floor(Math.random() * charset.length));
		}

		return opts.prefix + result + opts.suffix;
	};

	// Generate hash
	const generateHash = (opts: GenerationOptions): string => {
		// Generate a random hash-like string
		const hashLength = opts.length || 64;
		const hashChars = '0123456789abcdef';
		let hash = '';

		for (let i = 0; i < hashLength; i++) {
			hash += hashChars.charAt(Math.floor(Math.random() * hashChars.length));
		}

		return hash;
	};

	// Generate text from custom pattern
	const generateFromPattern = (opts: GenerationOptions): string => {
		if (!opts.customPattern) {
			return generateRandomText(opts);
		}

		let pattern = opts.customPattern;
		let result = '';

		// Replace pattern tokens with random characters
		for (const [token, chars] of Object.entries(patternTokens)) {
			while (pattern.includes(token)) {
				const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
				pattern = pattern.replace(token, randomChar);
			}
		}

		// Handle numeric ranges like {1-100}
		const rangePattern = /\{(\d+)-(\d+)\}/g;
		pattern = pattern.replace(rangePattern, (match, min, max) => {
			const minVal = parseInt(min);
			const maxVal = parseInt(max);
			return Math.floor(Math.random() * (maxVal - minVal + 1) + minVal).toString();
		});

		// Handle fixed repetitions like {5}
		const repeatPattern = /\{(\d+)\}/g;
		pattern = pattern.replace(repeatPattern, (match, count) => {
			const repeatCount = parseInt(count);
			const lastChar = result.length > 0 ? result[result.length - 1] : 'a';
			const charset = charsets.alphanumeric;
			let repeatResult = '';

			for (let i = 0; i < repeatCount; i++) {
				repeatResult += charset.charAt(Math.floor(Math.random() * charset.length));
			}

			return repeatResult;
		});

		result = pattern;

		// Generate multiple items if quantity > 1
		if (opts.quantity > 1) {
			const items = [];
			for (let i = 0; i < opts.quantity; i++) {
				items.push(result);
			}
			result = items.join(opts.separator);
		}

		return result;
	};

	// Apply case formatting
	const applyCaseFormat = (text: string, format: string): string => {
		switch (format) {
			case 'upper':
				return text.toUpperCase();
			case 'lower':
				return text.toLowerCase();
			case 'title':
				return text.replace(/\w\S*/g, (txt) =>
					txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
				);
			case 'camel':
				return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
					index === 0 ? word.toLowerCase() : word.toUpperCase()
				).replace(/\s+/g, '');
			case 'snake':
				return text.toLowerCase().replace(/\s+/g, '_');
			case 'kebab':
				return text.toLowerCase().replace(/\s+/g, '-');
			default:
				return text;
		}
	};

	// Generate text based on type
	const generateText = React.useCallback(() => {
		setIsGenerating(true);

		try {
			let result = '';

			switch (generatorType) {
				case 'lorem':
					result = generateLorem(options);
					break;
				case 'password':
					result = generatePassword(options);
					break;
				case 'uuid':
					const uuids = [];
					for (let i = 0; i < options.quantity; i++) {
						uuids.push(generateUUID(options));
					}
					result = uuids.join(options.separator);
					break;
				case 'random':
					if (options.quantity > 1) {
						const items = [];
						for (let i = 0; i < options.quantity; i++) {
							items.push(generateRandomText(options));
						}
						result = items.join(options.separator);
					} else {
						result = generateRandomText(options);
					}
					break;
				case 'hash':
					const hashes = [];
					for (let i = 0; i < options.quantity; i++) {
						hashes.push(generateHash(options));
					}
					result = hashes.join(options.separator);
					break;
				case 'pattern':
					result = generateFromPattern(options);
					break;
				default:
					throw new Error(`Unknown generator type: ${generatorType}`);
			}

			setGeneratedText(result);

			const generationResult: TextGenerationResult = {
				generatedText: result,
				generatorType,
				options,
				timestamp: new Date(),
				success: true,
			};

			setResults((prev) => [generationResult, ...prev].slice(0, 10));
			onGenerationComplete?.(generationResult);

			// Auto copy if enabled
			if (autoCopy && result) {
				navigator.clipboard.writeText(result).then(() => {
					toast.success('Generated text copied to clipboard');
				}).catch(() => {
					toast.error('Failed to copy to clipboard');
				});
			} else {
				toast.success('Text generated successfully');
			}

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Generation failed';
			toast.error(errorMessage);

			const errorResult: TextGenerationResult = {
				generatedText: '',
				generatorType,
				options,
				timestamp: new Date(),
				success: false,
				error: errorMessage,
			};
			setResults((prev) => [errorResult, ...prev].slice(0, 10)]);
		} finally {
			setIsGenerating(false);
		}
	}, [generatorType, options, autoCopy, onGenerationComplete]);

	// Copy to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Copied to clipboard');
		} catch (error) {
			toast.error('Failed to copy to clipboard');
		}
	};

	// Clear all
	const clearAll = () => {
		setGeneratedText('');
	};

	// Reset options to defaults
	const resetOptions = () => {
		const defaultOptions: GenerationOptions = {
			quantity: 1,
			length: 100,
			loremType: 'standard',
			startWithLorem: true,
			passwordLength: 16,
			includeUppercase: true,
			includeLowercase: true,
			includeNumbers: true,
			includeSymbols: false,
			excludeSimilar: false,
			uuidVersion: 'v4',
			charset: 'alphanumeric',
			separator: '\n',
			prefix: '',
			suffix: '',
			caseFormat: 'original',
			includeSpaces: false,
			lineBreaks: 0,
		};
		setOptions(defaultOptions);
		toast.success('Options reset to defaults');
	};

	// Update option
	const updateOption = <K extends keyof GenerationOptions>(
		key: K,
		value: GenerationOptions[K]
	) => {
		setOptions(prev => ({ ...prev, [key]: value }));
	};

	// Get current generator info
	const currentGenerator = generatorTypes.find(type => type.value === generatorType);

	return (
		<div className={className}>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Dice3 className="h-6 w-6" />
						<h1 className="text-2xl font-bold">Text Generator</h1>
					</div>
					<div className="flex items-center space-x-2">
						<div className="flex items-center space-x-2">
							<Switch
								checked={autoCopy}
								onCheckedChange={setAutoCopy}
							/>
							<Label>Auto Copy</Label>
						</div>
						<Button variant="outline" size="sm" onClick={resetOptions}>
							<Settings className="h-4 w-4 mr-2" />
							Reset
						</Button>
					</div>
				</div>

				{/* Generator Type Selection */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Type className="h-5 w-5" />
							Generator Type
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Select value={generatorType} onValueChange={setGeneratorType}>
								<SelectTrigger>
									<SelectValue placeholder="Select generator type" />
								</SelectTrigger>
								<SelectContent>
									{generatorTypes.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											<div>
												<div className="font-medium">{type.label}</div>
												<div className="text-xs text-gray-500">{type.description}</div>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{currentGenerator && (
								<div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
									<p className="text-sm text-blue-800 dark:text-blue-200">
										<strong>{currentGenerator.label}:</strong> {currentGenerator.description}
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Generator Options */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Generation Options
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="basic" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="basic">Basic</TabsTrigger>
								<TabsTrigger value="format">Format</TabsTrigger>
								<TabsTrigger value="advanced">Advanced</TabsTrigger>
							</TabsList>

							<TabsContent value="basic" className="space-y-4">
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Quantity</Label>
										<Input
											type="number"
											min="1"
											max="1000"
											value={options.quantity}
											onChange={(e) => updateOption('quantity', parseInt(e.target.value) || 1)}
										/>
									</div>
									{generatorType !== 'password' && generatorType !== 'uuid' && (
										<div className="space-y-2">
											<Label>Length</Label>
											<Input
												type="number"
												min="1"
												max="10000"
												value={options.length}
												onChange={(e) => updateOption('length', parseInt(e.target.value) || 100)}
											/>
										</div>
									)}
									{generatorType === 'password' && (
										<div className="space-y-2">
											<Label>Password Length</Label>
											<Input
												type="number"
												min="4"
												max="128"
												value={options.passwordLength}
												onChange={(e) => updateOption('passwordLength', parseInt(e.target.value) || 16)}
											/>
										</div>
									)}
								</div>

								{generatorType === 'lorem' && (
									<div className="space-y-2">
										<Label>Lorem Type</Label>
										<Select
											value={options.loremType}
											onValueChange={(value: GenerationOptions['loremType']) => updateOption('loremType', value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="standard">Standard</SelectItem>
												<SelectItem value="business">Business</SelectItem>
												<SelectItem value="tech">Technology</SelectItem>
												<SelectItem value="legal">Legal</SelectItem>
												<SelectItem value="medical">Medical</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}

								{generatorType === 'uuid' && (
									<div className="space-y-2">
										<Label>UUID Version</Label>
										<Select
											value={options.uuidVersion}
											onValueChange={(value: GenerationOptions['uuidVersion']) => updateOption('uuidVersion', value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="v4">Version 4 (Random)</SelectItem>
												<SelectItem value="v1">Version 1 (Timestamp)</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}

								{generatorType === 'random' && (
									<div className="space-y-2">
										<Label>Character Set</Label>
										<Select
											value={options.charset}
											onValueChange={(value: GenerationOptions['charset']) => updateOption('charset', value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="alphanumeric">Alphanumeric</SelectItem>
												<SelectItem value="alphabetic">Alphabetic</SelectItem>
												<SelectItem value="numeric">Numeric</SelectItem>
												<SelectItem value="hexadecimal">Hexadecimal</SelectItem>
												<SelectItem value="symbols">Symbols</SelectItem>
												<SelectItem value="printable">Printable ASCII</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</TabsContent>

							<TabsContent value="format" className="space-y-4">
								{generatorType === 'password' && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="flex items-center space-x-2">
											<Switch
												checked={options.includeUppercase}
												onCheckedChange={(checked) => updateOption('includeUppercase', checked)}
											/>
											<Label>Include Uppercase</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												checked={options.includeLowercase}
												onCheckedChange={(checked) => updateOption('includeLowercase', checked)}
											/>
											<Label>Include Lowercase</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												checked={options.includeNumbers}
												onCheckedChange={(checked) => updateOption('includeNumbers', checked)}
											/>
											<Label>Include Numbers</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												checked={options.includeSymbols}
												onCheckedChange={(checked) => updateOption('includeSymbols', checked)}
											/>
											<Label>Include Symbols</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												checked={options.excludeSimilar}
												onCheckedChange={(checked) => updateOption('excludeSimilar', checked)}
											/>
											<Label>Exclude Similar (i, l, 1, o, 0)</Label>
										</div>
									</div>
								)}

								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Case Format</Label>
										<Select
											value={options.caseFormat}
											onValueChange={(value: GenerationOptions['caseFormat']) => updateOption('caseFormat', value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="original">Original</SelectItem>
												<SelectItem value="upper">UPPERCASE</SelectItem>
												<SelectItem value="lower">lowercase</SelectItem>
												<SelectItem value="title">Title Case</SelectItem>
												<SelectItem value="camel">camelCase</SelectItem>
												<SelectItem value="snake">snake_case</SelectItem>
												<SelectItem value="kebab">kebab-case</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Separator</Label>
										<Input
											value={options.separator}
											onChange={(e) => updateOption('separator', e.target.value)}
											placeholder="Separator between multiple items"
										/>
									</div>
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Prefix</Label>
										<Input
											value={options.prefix}
											onChange={(e) => updateOption('prefix', e.target.value)}
											placeholder="Text to add before generated content"
										/>
									</div>
									<div className="space-y-2">
										<Label>Suffix</Label>
										<Input
											value={options.suffix}
											onChange={(e) => updateOption('suffix', e.target.value)}
											placeholder="Text to add after generated content"
										/>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="advanced" className="space-y-4">
								{generatorType === 'pattern' && (
									<div className="space-y-2">
										<Label>Custom Pattern</Label>
										<Textarea
											value={options.customPattern || ''}
											onChange={(e) => updateOption('customPattern', e.target.value)}
											placeholder="Enter custom pattern (e.g., {u}{l}{d}{d}{d} for ULc123)"
											className="font-mono"
										/>
										<div className="text-xs text-gray-500">
											Pattern tokens: {l} (lowercase), {u} (uppercase), {d} (digits), {s} (symbols), {a} (alphanumeric)
											<br />
											Ranges: {1-100} (random number 1-100), Fixed: {5} (5 random characters)
										</div>
									</div>
								)}

								{generatorType === 'lorem' && (
									<div className="space-y-4">
										<div className="flex items-center space-x-2">
											<Switch
												checked={options.startWithLorem}
												onCheckedChange={(checked) => updateOption('startWithLorem', checked)}
											/>
											<Label>Start with "Lorem ipsum"</Label>
										</div>
										<div className="space-y-2">
											<Label>Line Breaks</Label>
											<Slider
												value={[options.lineBreaks]}
												onValueChange={([value]) => updateOption('lineBreaks', value)}
												max={20}
												step={1}
												className="w-full"
											/>
											<div className="text-sm text-gray-500">{options.lineBreaks} line breaks</div>
										</div>
									</div>
								)}
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{/* Generate Button */}
				<div className="flex justify-center">
					<Button
						onClick={generateText}
						disabled={isGenerating}
						size="lg"
						className="w-full md:w-auto"
					>
						{isGenerating ? (
							<>
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								Generating...
							</>
						) : (
							<>
								<Dice3 className="h-4 w-4 mr-2" />
								Generate Text
							</>
						)}
					</Button>
				</div>

				{/* Generated Output */}
				{generatedText && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Generated Text</span>
								<div className="flex gap-2">
									<Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedText)}>
										<Copy className="h-4 w-4 mr-1" />
										Copy
									</Button>
									<DownloadButton
										content={generatedText}
										fileName="generated-text.txt"
										mimeType="text/plain"
									/>
									<Button variant="ghost" size="sm" onClick={clearAll}>
										Clear
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								value={generatedText}
								onChange={(e) => setGeneratedText(e.target.value)}
								className="min-h-40 font-mono"
								readOnly={generatorType !== 'pattern'}
							/>
							<div className="text-sm text-gray-500 mt-1">
								{generatedText.length} characters, {generatedText.split('\n').length} lines
							</div>
						</CardContent>
					</Card>
				)}

				{/* Pattern Reference */}
				{generatorType === 'pattern' && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Info className="h-5 w-5" />
								Pattern Reference
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4 text-sm">
								<div>
									<h4 className="font-medium mb-2">Pattern Tokens:</h4>
									<div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs bg-gray-50 p-3 rounded">
										<div>{l} - Lowercase letters (a-z)</div>
										<div>{u} - Uppercase letters (A-Z)</div>
										<div>{d} - Digits (0-9)</div>
										<div>{s} - Symbols (!@#$%^&*)</div>
										<div>{a} - Alphanumeric (A-Z, a-z, 0-9)</div>
										<div>{w} - Alphanumeric + space</div>
									</div>
								</div>
								<div>
									<h4 className="font-medium mb-2">Examples:</h4>
									<ul className="list-disc list-inside space-y-1 text-gray-600">
										<li><code className="bg-gray-100 px-1">AA{d}{d}{d}</code> - License plate format</li>
										<li><code className="bg-gray-100 px-1">{u}{l}{l}{d}{d}{d}</code> - Product code</li>
										<li><code className="bg-gray-100 px-1">{d}{d}-{d}{d}-{d}{d}{d}{d}</code> - Phone number</li>
										<li><code className="bg-gray-100 px-1">{l}{l}{l}@{l}{l}{l}.com</code> - Email address</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Recent Results */}
				{results.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Recent Generations</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{results.slice(0, 5).map((result, index) => (
									<div key={index} className="p-3 border rounded">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<Badge variant={result.success ? "default" : "destructive"}>
													{result.generatorType}
												</Badge>
												{result.generatedText && (
													<Badge variant="outline">
														{result.generatedText.length} chars
													</Badge>
												)}
											</div>
											<span className="text-xs text-gray-500">{result.timestamp.toLocaleTimeString()}</span>
										</div>
										<div className="text-sm">
											<div className="font-mono text-xs truncate max-w-full">
												{result.generatedText || 'Generation failed'}
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
