'use client';

import { FileUpload } from '@/components/file-upload/file-upload';
import { DownloadButton } from '@/components/file-upload/download-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Code, Copy, FileText, Upload, Zap, RotateCcw, Info } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface EncodingResult {
	operation: 'encode' | 'decode';
	encodingType: string;
	inputType: 'text' | 'file';
	input: string;
	output: string;
	fileName?: string;
	fileSize?: number;
	timestamp: Date;
	success: boolean;
	error?: string;
}

interface TextEncoderProps {
	onEncodingComplete?: (result: EncodingResult) => void;
	className?: string;
}

// Encoding types supported
const encodingTypes = [
	{
		value: 'base64',
		label: 'Base64',
		description: 'Base64 encoding for binary data',
	},
	{
		value: 'url',
		label: 'URL Encoding',
		description: 'URL encoding (percent-encoding)',
	},
	{
		value: 'html',
		label: 'HTML Entities',
		description: 'HTML character entity encoding',
	},
	{
		value: 'unicode',
		label: 'Unicode Escape',
		description: 'Unicode escape sequences',
	},
	{
		value: 'hex',
		label: 'Hexadecimal',
		description: 'Hexadecimal representation',
	},
	{ value: 'binary', label: 'Binary', description: 'Binary representation' },
];

// Example texts for different encodings
const encodingExamples = [
	{
		name: 'Simple Text',
		input: 'Hello World!',
		description: 'Basic text encoding',
	},
	{
		name: 'Special Characters',
		input: 'Special chars: äöü ñ @#$%^&*()',
		description: 'Unicode and special characters',
	},
	{
		name: 'URL String',
		input: 'https://example.com/search?q=test query&param=value',
		description: 'URL with parameters',
	},
	{
		name: 'HTML Content',
		input: '<div class="test">Hello & welcome to "Parsify.dev"!</div>',
		description: 'HTML with entities',
	},
];

export function TextEncoder({ onEncodingComplete, className }: TextEncoderProps) {
	const [inputText, setInputText] = React.useState('');
	const [outputText, setOutputText] = React.useState('');
	const [inputFiles, setInputFiles] = React.useState<File[]>([]);
	const [results, setResults] = React.useState<EncodingResult[]>([]);
	const [activeTab, setActiveTab] = React.useState<'encode' | 'decode'>('encode');
	const [activeInputTab, setActiveInputTab] = React.useState<'text' | 'file'>('text');
	const [encodingType, setEncodingType] = React.useState('base64');
	const [isProcessing, setIsProcessing] = React.useState(false);

	// Encoding functions
	const encodeText = (text: string, type: string): string => {
		try {
			switch (type) {
				case 'base64':
					return btoa(unescape(encodeURIComponent(text)));
				case 'url':
					return encodeURIComponent(text);
				case 'html':
					return text
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;')
						.replace(/'/g, '&#39;');
				case 'unicode':
					return text
						.split('')
						.map((char) => {
							const code = char.charCodeAt(0);
							return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
						})
						.join('');
				case 'hex':
					return text
						.split('')
						.map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
						.join('');
				case 'binary':
					return text
						.split('')
						.map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
						.join(' ');
				default:
					throw new Error(`Unsupported encoding type: ${type}`);
			}
		} catch (error) {
			throw new Error(`Failed to encode text: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	};

	// Decoding functions
	const decodeText = (text: string, type: string): string => {
		try {
			switch (type) {
				case 'base64':
					return decodeURIComponent(escape(atob(text)));
				case 'url':
					return decodeURIComponent(text);
				case 'html':
					const textarea = document.createElement('textarea');
					textarea.innerHTML = text;
					return textarea.value;
				case 'unicode':
					return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)));
				case 'hex':
					return (
						text
							.match(/.{1,2}/g)
							?.map((hex) => String.fromCharCode(parseInt(hex, 16)))
							.join('') || ''
					);
				case 'binary':
					return text
						.split(' ')
						.map((binary) => String.fromCharCode(parseInt(binary, 2)))
						.join('');
				default:
					throw new Error(`Unsupported encoding type: ${type}`);
			}
		} catch (error) {
			throw new Error(`Failed to decode text: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	};

	// Process text encoding/decoding
	const processText = async () => {
		if (!inputText.trim()) {
			toast.error('Please enter text to process');
			return;
		}

		setIsProcessing(true);
		try {
			let output: string;
			if (activeTab === 'encode') {
				output = encodeText(inputText, encodingType);
			} else {
				output = decodeText(inputText, encodingType);
			}

			setOutputText(output);

			const result: EncodingResult = {
				operation: activeTab,
				encodingType,
				inputType: 'text',
				input: inputText,
				output,
				timestamp: new Date(),
				success: true,
			};

			setResults((prev) => [result, ...prev].slice(0, 10));
			onEncodingComplete?.(result);

			toast.success(`${activeTab === 'encode' ? 'Encoded' : 'Decoded'} successfully using ${encodingType}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Processing failed';
			toast.error(errorMessage);
			setOutputText('');

			const errorResult: EncodingResult = {
				operation: activeTab,
				encodingType,
				inputType: 'text',
				input: inputText,
				output: '',
				timestamp: new Date(),
				success: false,
				error: errorMessage,
			};
			setResults((prev) => [errorResult, ...prev].slice(0, 10));
		} finally {
			setIsProcessing(false);
		}
	};

	// Process file encoding/decoding
	const processFiles = async () => {
		if (inputFiles.length === 0) {
			toast.error('Please select files to process');
			return;
		}

		setIsProcessing(true);
		for (const file of inputFiles) {
			try {
				const text = await file.text();
				let output: string;

				if (activeTab === 'encode') {
					output = encodeText(text, encodingType);
				} else {
					output = decodeText(text, encodingType);
				}

				const result: EncodingResult = {
					operation: activeTab,
					encodingType,
					inputType: 'file',
					input: file.name,
					output,
					fileName: file.name,
					fileSize: file.size,
					timestamp: new Date(),
					success: true,
				};

				setResults((prev) => [result, ...prev].slice(0, 10));
				onEncodingComplete?.(result);

				toast.success(`${activeTab === 'encode' ? 'Encoded' : 'Decoded'} ${file.name}`);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
				toast.error(`${file.name}: ${errorMessage}`);

				const errorResult: EncodingResult = {
					operation: activeTab,
					encodingType,
					inputType: 'file',
					input: file.name,
					output: '',
					fileName: file.name,
					fileSize: file.size,
					timestamp: new Date(),
					success: false,
					error: errorMessage,
				};
				setResults((prev) => [errorResult, ...prev].slice(0, 10));
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
	const loadExample = (example: (typeof encodingExamples)[0]) => {
		setInputText(example.input);
	};

	// Clear all
	const clearAll = () => {
		setInputText('');
		setOutputText('');
		setInputFiles([]);
	};

	// Swap input and output
	const swapInputOutput = () => {
		if (outputText) {
			setInputText(outputText);
			setOutputText('');
			setActiveTab(activeTab === 'encode' ? 'decode' : 'encode');
		}
	};

	// Auto-process when input changes
	React.useEffect(() => {
		if (activeInputTab === 'text' && inputText.trim()) {
			const timer = setTimeout(() => {
				try {
					let output: string;
					if (activeTab === 'encode') {
						output = encodeText(inputText, encodingType);
					} else {
						output = decodeText(inputText, encodingType);
					}
					setOutputText(output);
				} catch {
					setOutputText('');
				}
			}, 300);

			return () => clearTimeout(timer);
		} else {
			setOutputText('');
		}
	}, [inputText, activeTab, activeInputTab, encodingType]);

	// Get current encoding type info
	const currentEncoding = encodingTypes.find((type) => type.value === encodingType);

	return (
		<div className={className}>
			<div className="space-y-6">
				{/* Encoding Type Selection */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Code className="h-5 w-5" />
							Encoding Type
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Select value={encodingType} onValueChange={setEncodingType}>
								<SelectTrigger>
									<SelectValue placeholder="Select encoding type" />
								</SelectTrigger>
								<SelectContent>
									{encodingTypes.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											<div>
												<div className="font-medium">{type.label}</div>
												<div className="text-xs text-gray-500">{type.description}</div>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{currentEncoding && (
								<div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
									<p className="text-sm text-blue-800 dark:text-blue-200">
										<strong>{currentEncoding.label}:</strong> {currentEncoding.description}
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Operation Selection */}
				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'encode' | 'decode')}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="encode" className="flex items-center gap-2">
							<Zap className="h-4 w-4" />
							Encode Text
						</TabsTrigger>
						<TabsTrigger value="decode" className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Decode Text
						</TabsTrigger>
					</TabsList>

					<TabsContent value="encode" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Zap className="h-5 w-5" />
									Text Encoding
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
									<p className="text-sm text-blue-800 dark:text-blue-200">
										<strong>Text Encoding:</strong> Convert plain text into {currentEncoding?.label} format. Useful for
										data transmission, storage, and security purposes.
									</p>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="decode">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Text Decoding
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
									<p className="text-sm text-green-800 dark:text-green-200">
										<strong>Text Decoding:</strong> Convert {currentEncoding?.label} encoded text back to its original
										format. Automatically handles validation and error correction.
									</p>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Input Selection */}
				<Tabs value={activeInputTab} onValueChange={(value) => setActiveInputTab(value as 'text' | 'file')}>
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
									<span>{activeTab === 'encode' ? 'Text to Encode' : 'Text to Decode'}</span>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" onClick={swapInputOutput}>
											<RotateCcw className="h-4 w-4 mr-1" />
											Swap
										</Button>
										<Button variant="outline" size="sm" onClick={clearAll}>
											Clear
										</Button>
									</div>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Textarea
										value={inputText}
										onChange={(e) => setInputText(e.target.value)}
										placeholder={
											activeTab === 'encode'
												? `Enter text to encode to ${currentEncoding?.label}...`
												: `Enter ${currentEncoding?.label} text to decode...`
										}
										className="min-h-32 font-mono"
									/>
									<div className="text-sm text-gray-500 mt-1">{inputText.length} characters</div>
								</div>

								{outputText && (
									<div>
										<div className="flex items-center justify-between mb-2">
											<label className="text-sm font-medium">
												{activeTab === 'encode' ? `${currentEncoding?.label} Output` : 'Decoded Output'}
											</label>
											<div className="flex gap-2">
												<Button variant="ghost" size="sm" onClick={() => copyToClipboard(outputText)}>
													<Copy className="h-4 w-4 mr-1" />
													Copy
												</Button>
												<DownloadButton
													content={outputText}
													fileName={`${activeTab === 'encode' ? 'encoded' : 'decoded'}.txt`}
													mimeType="text/plain"
												/>
											</div>
										</div>
										<div className="p-3 bg-gray-50 border rounded">
											<div className="font-mono text-sm break-all max-h-40 overflow-y-auto">{outputText}</div>
										</div>
										<div className="text-sm text-gray-500 mt-1">{outputText.length} characters</div>
									</div>
								)}

								<Button onClick={processText} disabled={isProcessing} className="w-full">
									{isProcessing ? 'Processing...' : `${activeTab === 'encode' ? 'Encode' : 'Decode'} Text`}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="file" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>{activeTab === 'encode' ? 'Files to Encode' : 'Files to Decode'}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FileUpload
									files={inputFiles}
									onFilesChange={setInputFiles}
									maxFiles={10}
									acceptedFormats={['txt', 'json', 'xml', 'html', 'css', 'js', 'ts']}
								/>
								<Button onClick={processFiles} disabled={inputFiles.length === 0 || isProcessing} className="w-full">
									{isProcessing
										? 'Processing...'
										: `Process ${inputFiles.length} File${inputFiles.length !== 1 ? 's' : ''}`}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Examples */}
				<Card>
					<CardHeader>
						<CardTitle>Examples</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid md:grid-cols-2 gap-4">
							{encodingExamples.map((example, index) => (
								<div key={index} className="p-3 border rounded">
									<div className="font-medium mb-1">{example.name}</div>
									<div className="text-sm text-gray-600 mb-2">{example.description}</div>
									<div className="bg-gray-50 p-2 rounded">
										<div className="text-xs text-gray-500 mb-1">Input:</div>
										<div className="font-mono text-xs truncate">{example.input}</div>
									</div>
									<Button variant="outline" size="sm" onClick={() => loadExample(example)} className="mt-2 w-full">
										Load Example
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Encoding Reference */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Info className="h-5 w-5" />
							Encoding Reference
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4 text-sm">
							<div>
								<h4 className="font-medium mb-2">Use Cases:</h4>
								<ul className="list-disc list-inside space-y-1 text-gray-600">
									<li>
										<strong>Base64:</strong> Email attachments, data URLs, binary data transmission
									</li>
									<li>
										<strong>URL Encoding:</strong> Query parameters, form data, URL paths
									</li>
									<li>
										<strong>HTML Entities:</strong> Web content, XSS prevention, HTML validation
									</li>
									<li>
										<strong>Unicode Escape:</strong> JavaScript strings, JSON, Unicode support
									</li>
									<li>
										<strong>Hexadecimal:</strong> Binary data representation, debugging
									</li>
									<li>
										<strong>Binary:</strong> Low-level data processing, bitwise operations
									</li>
								</ul>
							</div>
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
								{results.map((result, index) => (
									<div key={index} className="p-3 border rounded">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<Badge variant={result.success ? 'default' : 'destructive'}>
													{result.operation === 'encode' ? 'Encoded' : 'Decoded'}
												</Badge>
												<Badge variant="outline">{result.encodingType}</Badge>
												{result.inputType === 'file' && <Badge variant="secondary">File</Badge>}
											</div>
											<span className="text-xs text-gray-500">{result.timestamp.toLocaleTimeString()}</span>
										</div>
										<div className="text-sm">
											<div className="font-medium truncate">{result.input}</div>
											{result.fileSize && <div className="text-xs text-gray-500">{result.fileSize} bytes</div>}
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
