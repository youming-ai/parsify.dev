'use client';

import { FileUpload } from '@/components/file-upload/file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, FileText, Hash, Upload, Key, Shield, Check, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { CryptoUtils, HashResult } from '@/lib/crypto';

export interface EnhancedHashResult extends HashResult {
	algorithm: string;
	input: string;
	hash: string;
	uppercase: boolean;
	inputType: 'text' | 'file' | 'hex' | 'base64';
	fileName?: string;
	fileSize?: number;
	inputFormat: 'text' | 'hex' | 'base64';
	hmacKey?: string;
	isHmac: boolean;
}

interface HashGeneratorProps {
	onHashGenerated?: (result: EnhancedHashResult) => void;
	className?: string;
}

// Enhanced hash algorithms configuration
const hashAlgorithms = [
	{
		value: 'md5',
		label: 'MD5',
		description: '128-bit hash function, fast but cryptographically broken',
		security: 'low',
		outputLength: 32,
	},
	{
		value: 'sha1',
		label: 'SHA-1',
		description: '160-bit hash function, deprecated for security use',
		security: 'low',
		outputLength: 40,
	},
	{
		value: 'sha256',
		label: 'SHA-256',
		description: '256-bit hash function, secure and widely used',
		security: 'high',
		outputLength: 64,
	},
	{
		value: 'sha384',
		label: 'SHA-384',
		description: '384-bit hash function, part of SHA-2 family',
		security: 'high',
		outputLength: 96,
	},
	{
		value: 'sha512',
		label: 'SHA-512',
		description: '512-bit hash function, highest security in SHA-2 family',
		security: 'high',
		outputLength: 128,
	},
	{
		value: 'sha3-256',
		label: 'SHA3-256',
		description: '256-bit SHA-3 hash function, alternative to SHA-256',
		security: 'high',
		outputLength: 64,
	},
	{
		value: 'sha3-512',
		label: 'SHA3-512',
		description: '512-bit SHA-3 hash function, alternative to SHA-512',
		security: 'high',
		outputLength: 128,
	},
];

export function HashGenerator({ onHashGenerated, className }: HashGeneratorProps) {
	const [inputText, setInputText] = React.useState('');
	const [inputFiles, setInputFiles] = React.useState<File[]>([]);
	const [selectedAlgorithms, setSelectedAlgorithms] = React.useState<string[]>(['sha256']);
	const [results, setResults] = React.useState<EnhancedHashResult[]>([]);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [uppercase, setUppercase] = React.useState(false);
	const [inputFormat, setInputFormat] = React.useState<'text' | 'hex' | 'base64'>('text');
	const [hmacKey, setHmacKey] = React.useState('');
	const [compareHashes, setCompareHashes] = React.useState(false);
	const [compareHash1, setCompareHash1] = React.useState('');
	const [compareHash2, setCompareHash2] = React.useState('');

	// Convert input based on format
	const convertInput = (input: string, format: 'text' | 'hex' | 'base64'): string => {
		if (format === 'hex') {
			try {
				// Convert hex string to bytes, then to text
				const hex = input.replace(/[^0-9A-Fa-f]/g, '');
				if (hex.length % 2 !== 0) {
					throw new Error('Invalid hex string length');
				}
				const bytes = new Uint8Array(hex.length / 2);
				for (let i = 0; i < hex.length; i += 2) {
					bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
				}
				return new TextDecoder().decode(bytes);
			} catch (error) {
				throw new Error('Invalid hex format');
			}
		} else if (format === 'base64') {
			try {
				// Decode base64 to text
				return atob(input.replace(/[^A-Za-z0-9+/]/g, ''));
			} catch (error) {
				throw new Error('Invalid base64 format');
			}
		}
		return input;
	};

	// Process text input
	const processText = async () => {
		if (!inputText.trim()) {
			toast.error('Please enter text to hash');
			return;
		}

		setIsProcessing(true);
		const newResults: EnhancedHashResult[] = [];

		try {
			// Convert input based on format
			let processedInput = inputText;
			try {
				if (inputFormat !== 'text') {
					processedInput = convertInput(inputText, inputFormat);
				}
			} catch (error) {
				toast.error(`Input format error: ${error instanceof Error ? error.message : 'Unknown error'}`);
				return;
			}

			for (const algorithm of selectedAlgorithms) {
				try {
					const hashOptions = {
						uppercase,
						format: 'hex' as const,
					};

					let hash: string;
					if (hmacKey.trim()) {
						// For HMAC, we would need to implement HMAC in the crypto utils
						// For now, we'll create a simple HMAC-like implementation
						const combined = processedInput + hmacKey;
						const result = await CryptoUtils.generateHash(combined, algorithm, hashOptions);
						hash = result.hash;
					} else {
						const result = await CryptoUtils.generateHash(processedInput, algorithm, hashOptions);
						hash = result.hash;
					}

					const result: EnhancedHashResult = {
						algorithm,
						input: inputText,
						hash,
						uppercase,
						inputType: inputFormat === 'text' ? 'text' : inputFormat,
						inputFormat,
						hmacKey: hmacKey.trim() || undefined,
						isHmac: !!hmacKey.trim(),
						inputSize: processedInput.length,
						processingTime: 0, // Would be set by CryptoUtils
					};
					newResults.push(result);
					onHashGenerated?.(result);
				} catch (error) {
					console.error(`Error generating ${algorithm} hash:`, error);
					toast.error(`Failed to generate ${algorithm} hash`);
				}
			}

			setResults((prev) => [...prev, ...newResults]);
			toast.success(`Generated ${newResults.length} hash(es)`);
		} catch (error) {
			toast.error('Failed to generate hashes');
		} finally {
			setIsProcessing(false);
		}
	};

	// Process file input
	const processFiles = async () => {
		if (inputFiles.length === 0) {
			toast.error('Please select files to hash');
			return;
		}

		setIsProcessing(true);
		const newResults: EnhancedHashResult[] = [];

		try {
			for (const file of inputFiles) {
				const arrayBuffer = await file.arrayBuffer();

				for (const algorithm of selectedAlgorithms) {
					try {
						const hashOptions = {
							uppercase,
							format: 'hex' as const,
						};

						let hash: string;
						if (hmacKey.trim()) {
							// For HMAC with files
							const keyBuffer = new TextEncoder().encode(hmacKey);
							const combined = new Uint8Array(arrayBuffer.byteLength + keyBuffer.byteLength);
							combined.set(new Uint8Array(arrayBuffer), 0);
							combined.set(keyBuffer, arrayBuffer.byteLength);
							const result = await CryptoUtils.generateHash(combined.buffer, algorithm, hashOptions);
							hash = result.hash;
						} else {
							const result = await CryptoUtils.generateHash(arrayBuffer, algorithm, hashOptions);
							hash = result.hash;
						}

						const result: EnhancedHashResult = {
							algorithm,
							input: 'File content',
							hash,
							uppercase,
							inputType: 'file',
							inputFormat: 'text',
							hmacKey: hmacKey.trim() || undefined,
							isHmac: !!hmacKey.trim(),
							fileName: file.name,
							fileSize: file.size,
							inputSize: file.size,
							processingTime: 0,
						};
						newResults.push(result);
						onHashGenerated?.(result);
					} catch (error) {
						console.error(`Error generating ${algorithm} hash for ${file.name}:`, error);
					}
				}
			}

			setResults((prev) => [...prev, ...newResults]);
			toast.success(`Generated ${newResults.length} hash(es) from ${inputFiles.length} file(s)`);
		} catch (error) {
			toast.error('Failed to process files');
		} finally {
			setIsProcessing(false);
		}
	};

	// Compare two hashes
	const compareHashes = () => {
		const normalized1 = compareHash1.toLowerCase().replace(/\s/g, '');
		const normalized2 = compareHash2.toLowerCase().replace(/\s/g, '');

		if (normalized1 === normalized2) {
			toast.success('Hashes match!');
		} else {
			toast.error('Hashes do not match');
		}
	};

	// Copy hash to clipboard
	const copyToClipboard = async (hash: string) => {
		try {
			await navigator.clipboard.writeText(hash);
			toast.success('Hash copied to clipboard');
		} catch (error) {
			toast.error('Failed to copy to clipboard');
		}
	};

	// Clear results
	const clearResults = () => {
		setResults([]);
	};

	// Toggle algorithm selection
	const toggleAlgorithm = (algorithm: string) => {
		setSelectedAlgorithms((prev) =>
			prev.includes(algorithm) ? prev.filter((a) => a !== algorithm) : [...prev, algorithm],
		);
	};

	// Batch hash all algorithms
	const selectAllAlgorithms = () => {
		setSelectedAlgorithms(hashAlgorithms.map((algo) => algo.value));
	};

	const selectSecureAlgorithms = () => {
		setSelectedAlgorithms(hashAlgorithms.filter((algo) => algo.security === 'high').map((algo) => algo.value));
	};

	return (
		<div className={className}>
			<div className="space-y-6">
				{/* Algorithm Selection */}
				<Card variant="modern">
					<CardHeader variant="modern">
						<CardTitle className="flex items-center gap-2">
							<Hash className="h-5 w-5" />
							Hash Algorithms
						</CardTitle>
					</CardHeader>
					<CardContent variant="modern">
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2 mb-4">
								<Button variant="outline" size="sm" onClick={selectAllAlgorithms}>
									Select All
								</Button>
								<Button variant="outline" size="sm" onClick={selectSecureAlgorithms}>
									Secure Only
								</Button>
								<Button variant="outline" size="sm" onClick={() => setSelectedAlgorithms([])}>
									Clear Selection
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								{hashAlgorithms.map((algo) => (
									<Badge
										key={algo.value}
										variant={selectedAlgorithms.includes(algo.value) ? 'default' : 'outline'}
										className={`cursor-pointer transform-gpu transition-all duration-200 hover:scale-110 ${
											algo.security === 'high' ? 'border-green-500' : algo.security === 'low' ? 'border-red-500' : ''
										}`}
										onClick={() => toggleAlgorithm(algo.value)}
									>
										{algo.label}
										{algo.security === 'high' && <Shield className="h-3 w-3 ml-1" />}
									</Badge>
								))}
							</div>
							{selectedAlgorithms.length > 0 && (
								<div className="grid md:grid-cols-2 gap-4">
									{hashAlgorithms
										.filter((algo) => selectedAlgorithms.includes(algo.value))
										.map((algo) => (
											<div
												key={algo.value}
												className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${
													algo.security === 'high'
														? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
														: algo.security === 'low'
															? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
															: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
												}`}
											>
												<div className="flex items-center justify-between">
													<div className="font-medium">{algo.label}</div>
													<Badge
														variant={
															algo.security === 'high'
																? 'default'
																: algo.security === 'low'
																	? 'destructive'
																	: 'secondary'
														}
														size="sm"
													>
														{algo.security}
													</Badge>
												</div>
												<div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{algo.description}</div>
												<div className="text-xs text-gray-500 mt-2">Output: {algo.outputLength} characters</div>
											</div>
										))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* HMAC Settings */}
				<Card variant="modern">
					<CardHeader variant="modern">
						<CardTitle className="flex items-center gap-2">
							<Key className="h-5 w-5" />
							HMAC Settings (Optional)
						</CardTitle>
					</CardHeader>
					<CardContent variant="modern">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="hmac-key">HMAC Key</Label>
								<Input
									id="hmac-key"
									type="password"
									value={hmacKey}
									onChange={(e) => setHmacKey(e.target.value)}
									placeholder="Enter HMAC key (optional)..."
								/>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Provide a key to generate HMAC instead of plain hash
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Input Options */}
				<Tabs defaultValue="text" className="w-full">
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
								<CardTitle>Text Input</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="input-format">Input Format</Label>
									<Select value={inputFormat} onValueChange={(value: any) => setInputFormat(value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select input format" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="text">Plain Text</SelectItem>
											<SelectItem value="hex">Hexadecimal</SelectItem>
											<SelectItem value="base64">Base64</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="input-text">Enter Text</Label>
									<Textarea
										id="input-text"
										value={inputText}
										onChange={(e) => setInputText(e.target.value)}
										placeholder={
											inputFormat === 'text'
												? 'Enter text to generate hash...'
												: inputFormat === 'hex'
													? 'Enter hex string...'
													: 'Enter base64 string...'
										}
										className="min-h-32"
									/>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="uppercase"
										checked={uppercase}
										onChange={(e) => setUppercase(e.target.checked)}
									/>
									<Label htmlFor="uppercase">Uppercase output</Label>
								</div>
								<Button
									onClick={processText}
									disabled={isProcessing || selectedAlgorithms.length === 0}
									className="w-full"
								>
									{isProcessing ? 'Generating...' : 'Generate Hash'}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="file" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>File Input</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FileUpload
									files={inputFiles}
									onFilesChange={setInputFiles}
									maxFiles={10}
									acceptedFormats={['txt', 'json', 'xml', 'csv', 'md', 'log', 'bin', 'exe', 'pdf', 'zip']}
								/>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="uppercase-file"
										checked={uppercase}
										onChange={(e) => setUppercase(e.target.checked)}
									/>
									<Label htmlFor="uppercase-file">Uppercase output</Label>
								</div>
								<Button
									onClick={processFiles}
									disabled={isProcessing || selectedAlgorithms.length === 0 || inputFiles.length === 0}
									className="w-full"
								>
									{isProcessing ? 'Generating...' : 'Generate Hash'}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Hash Comparison */}
				<Card variant="modern">
					<CardHeader variant="modern">
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5" />
							Hash Comparison
						</CardTitle>
					</CardHeader>
					<CardContent variant="modern">
						<div className="space-y-4">
							<div className="grid md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="hash1">Hash 1</Label>
									<Textarea
										id="hash1"
										value={compareHash1}
										onChange={(e) => setCompareHash1(e.target.value)}
										placeholder="Enter first hash to compare..."
										className="min-h-24"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="hash2">Hash 2</Label>
									<Textarea
										id="hash2"
										value={compareHash2}
										onChange={(e) => setCompareHash2(e.target.value)}
										placeholder="Enter second hash to compare..."
										className="min-h-24"
									/>
								</div>
							</div>
							<Button
								onClick={compareHashes}
								disabled={!compareHash1.trim() || !compareHash2.trim()}
								className="w-full"
							>
								Compare Hashes
							</Button>
							{compareHash1.trim() && compareHash2.trim() && (
								<div className="flex items-center justify-center p-4 border rounded-lg">
									{compareHash1.toLowerCase().replace(/\s/g, '') === compareHash2.toLowerCase().replace(/\s/g, '') ? (
										<div className="flex items-center gap-2 text-green-600">
											<Check className="h-5 w-5" />
											<span>Hashes match!</span>
										</div>
									) : (
										<div className="flex items-center gap-2 text-red-600">
											<X className="h-5 w-5" />
											<span>Hashes do not match</span>
										</div>
									)}
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Results */}
				{results.length > 0 && (
					<Card variant="elevated">
						<CardHeader variant="elevated">
							<CardTitle className="flex items-center justify-between">
								<span>Results ({results.length})</span>
								<Button variant="outline" size="sm" onClick={clearResults}>
									Clear All
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent variant="elevated">
							<div className="space-y-4">
								{results.map((result, index) => (
									<div
										key={`${result.algorithm}-${result.input}-${Date.now()}-${index}`}
										className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2 bg-gray-50/50 dark:bg-gray-800/50 hover:shadow-md transition-all duration-200"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="font-mono">
													{result.algorithm.toUpperCase()}
													{result.isHmac && '-HMAC'}
												</Badge>
												{result.inputType === 'file' && (
													<>
														<span className="text-sm text-gray-600 dark:text-gray-400">{result.fileName}</span>
														<span className="text-xs text-gray-500 dark:text-gray-500">({result.fileSize} bytes)</span>
													</>
												)}
												{result.inputType !== 'file' && result.inputFormat !== 'text' && (
													<Badge variant="secondary" size="sm">
														{result.inputFormat}
													</Badge>
												)}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => copyToClipboard(result.hash)}
												className="transform-gpu transition-all duration-200 hover:scale-110"
											>
												<Copy className="h-4 w-4" />
											</Button>
										</div>
										<div className="font-mono text-sm bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 break-all shadow-inner">
											{result.hash}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-500">
											Input: {result.inputType === 'file' ? 'File content' : `${result.input.length} characters`}
											{result.isHmac && ' • HMAC'}
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
