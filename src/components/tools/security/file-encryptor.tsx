'use client';

import { FileUpload } from '@/components/file-upload/file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
	Copy,
	Download,
	Lock,
	Unlock,
	Upload,
	Shield,
	Key,
	FileText,
	Eye,
	EyeOff,
	Check,
	AlertTriangle,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { CryptoUtils, EncryptionResult, EncryptionOptions } from '@/lib/crypto';

export interface EncryptionJob {
	id: string;
	fileName: string;
	fileSize: number;
	status: 'pending' | 'processing' | 'completed' | 'error';
	progress: number;
	result?: EncryptionResult;
	error?: string;
	algorithm: string;
	keySize: number;
	operation: 'encrypt' | 'decrypt';
	startedAt?: Date;
	completedAt?: Date;
}

export interface PasswordStrength {
	score: number;
	level: 'very_weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
	feedback: string[];
}

interface FileEncryptorProps {
	onEncryptionComplete?: (job: EncryptionJob) => void;
	onDecryptionComplete?: (job: EncryptionJob) => void;
	className?: string;
}

// Encryption algorithms configuration
const encryptionAlgorithms = [
	{
		value: 'AES',
		label: 'AES (Advanced Encryption Standard)',
		description: 'Symmetric encryption algorithm, widely used and secure',
		keySizes: [128, 192, 256],
		defaultKeySize: 256,
		security: 'high',
	},
	{
		value: 'ChaCha20',
		label: 'ChaCha20',
		description: 'Modern stream cipher, designed for better performance',
		keySizes: [256],
		defaultKeySize: 256,
		security: 'high',
	},
];

// Key derivation functions
const keyDerivationFunctions = [
	{
		value: 'PBKDF2',
		label: 'PBKDF2',
		description: 'Password-Based Key Derivation Function 2',
		iterations: 100000,
		security: 'high',
	},
	{
		value: 'Scrypt',
		label: 'Scrypt',
		description: 'Memory-hard key derivation function',
		iterations: 32768,
		security: 'very_high',
	},
];

export function FileEncryptor({ onEncryptionComplete, onDecryptionComplete, className }: FileEncryptorProps) {
	const [inputFiles, setInputFiles] = React.useState<File[]>([]);
	const [password, setPassword] = React.useState('');
	const [confirmPassword, setConfirmPassword] = React.useState('');
	const [showPassword, setShowPassword] = React.useState(false);
	const [selectedAlgorithm, setSelectedAlgorithm] = React.useState('AES');
	const [keySize, setKeySize] = React.useState(256);
	const [keyDerivation, setKeyDerivation] = React.useState('PBKDF2');
	const [encryptionJobs, setEncryptionJobs] = React.useState<EncryptionJob[]>([]);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [textInput, setTextInput] = React.useState('');
	const [encryptedData, setEncryptedData] = React.useState('');
	const [decryptedData, setDecryptedData] = React.useState('');
	const [passwordStrength, setPasswordStrength] = React.useState<PasswordStrength | null>(null);

	// Calculate password strength
	React.useEffect(() => {
		if (password) {
			const strength = CryptoUtils.calculatePasswordStrength(password);
			setPasswordStrength(strength);
		} else {
			setPasswordStrength(null);
		}
	}, [password]);

	// Validate password
	const validatePassword = (): boolean => {
		if (!password.trim()) {
			toast.error('Please enter a password');
			return false;
		}

		if (password.length < 8) {
			toast.error('Password must be at least 8 characters long');
			return false;
		}

		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return false;
		}

		if (passwordStrength && passwordStrength.score < 50) {
			toast.error('Please use a stronger password');
			return false;
		}

		return true;
	};

	// Encrypt files
	const encryptFiles = async () => {
		if (!validatePassword() || inputFiles.length === 0) {
			return;
		}

		setIsProcessing(true);
		const jobs: EncryptionJob[] = [];

		try {
			for (const file of inputFiles) {
				const jobId = `encrypt-${Date.now()}-${Math.random()}`;
				const job: EncryptionJob = {
					id: jobId,
					fileName: file.name,
					fileSize: file.size,
					status: 'processing',
					progress: 0,
					algorithm: selectedAlgorithm,
					keySize,
					operation: 'encrypt',
					startedAt: new Date(),
				};

				setEncryptionJobs((prev) => [...prev, job]);
				jobs.push(job);

				try {
					// Read file content
					const fileContent = await file.text();

					// Update progress
					setEncryptionJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, progress: 25 } : j)));

					// Encrypt data
					const encryptionOptions: EncryptionOptions = {
						algorithm: selectedAlgorithm as 'AES' | 'RSA',
						keySize: keySize as 128 | 192 | 256,
					};

					const result = await CryptoUtils.encryptData(fileContent, password, encryptionOptions);

					// Update progress
					setEncryptionJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, progress: 75 } : j)));

					// Create downloadable file
					const encryptedFileName = `${file.name}.encrypted`;
					const encryptedBlob = new Blob([result.encryptedData], { type: 'text/plain' });
					const encryptedUrl = URL.createObjectURL(encryptedBlob);

					// Update job with result
					const completedJob: EncryptionJob = {
						...job,
						status: 'completed',
						progress: 100,
						result: {
							...result,
							encryptedData: result.encryptedData,
							downloadUrl: encryptedUrl,
							fileName: encryptedFileName,
						},
						completedAt: new Date(),
					};

					setEncryptionJobs((prev) => prev.map((j) => (j.id === jobId ? completedJob : j)));
					onEncryptionComplete?.(completedJob);
				} catch (error) {
					const errorJob: EncryptionJob = {
						...job,
						status: 'error',
						error: error instanceof Error ? error.message : 'Unknown error',
						completedAt: new Date(),
					};

					setEncryptionJobs((prev) => prev.map((j) => (j.id === jobId ? errorJob : j)));
				}
			}

			toast.success(`Encrypted ${inputFiles.length} file(s) successfully`);
		} catch (error) {
			toast.error('Encryption failed');
		} finally {
			setIsProcessing(false);
		}
	};

	// Decrypt files
	const decryptFiles = async (encryptedFiles: File[]) => {
		if (!validatePassword() || encryptedFiles.length === 0) {
			return;
		}

		setIsProcessing(true);
		const jobs: EncryptionJob[] = [];

		try {
			for (const file of encryptedFiles) {
				const jobId = `decrypt-${Date.now()}-${Math.random()}`;
				const job: EncryptionJob = {
					id: jobId,
					fileName: file.name,
					fileSize: file.size,
					status: 'processing',
					progress: 0,
					algorithm: selectedAlgorithm,
					keySize,
					operation: 'decrypt',
					startedAt: new Date(),
				};

				setEncryptionJobs((prev) => [...prev, job]);
				jobs.push(job);

				try {
					// Read encrypted file content
					const encryptedContent = await file.text();

					// Parse encrypted data (assuming format: salt:iv:data)
					const parts = encryptedContent.split(':');
					if (parts.length !== 3) {
						throw new Error('Invalid encrypted file format');
					}

					const [saltB64, ivB64, encryptedDataB64] = parts;

					// Update progress
					setEncryptionJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, progress: 25 } : j)));

					// Decrypt data
					const decryptedContent = await CryptoUtils.decryptData(encryptedDataB64, password, saltB64, ivB64, keySize);

					// Update progress
					setEncryptionJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, progress: 75 } : j)));

					// Create downloadable file
					const originalFileName = file.name.replace('.encrypted', '');
					const decryptedBlob = new Blob([decryptedContent], { type: 'text/plain' });
					const decryptedUrl = URL.createObjectURL(decryptedBlob);

					// Update job with result
					const completedJob: EncryptionJob = {
						...job,
						status: 'completed',
						progress: 100,
						result: {
							algorithm: `${selectedAlgorithm}-${keySize}`,
							encryptedData: decryptedContent,
							downloadUrl: decryptedUrl,
							fileName: originalFileName,
						},
						completedAt: new Date(),
					};

					setEncryptionJobs((prev) => prev.map((j) => (j.id === jobId ? completedJob : j)));
					onDecryptionComplete?.(completedJob);
				} catch (error) {
					const errorJob: EncryptionJob = {
						...job,
						status: 'error',
						error: error instanceof Error ? error.message : 'Unknown error',
						completedAt: new Date(),
					};

					setEncryptionJobs((prev) => prev.map((j) => (j.id === jobId ? errorJob : j)));
				}
			}

			toast.success(`Decrypted ${encryptedFiles.length} file(s) successfully`);
		} catch (error) {
			toast.error('Decryption failed');
		} finally {
			setIsProcessing(false);
		}
	};

	// Encrypt text
	const encryptText = async () => {
		if (!validatePassword() || !textInput.trim()) {
			return;
		}

		setIsProcessing(true);

		try {
			const encryptionOptions: EncryptionOptions = {
				algorithm: selectedAlgorithm as 'AES' | 'RSA',
				keySize: keySize as 128 | 192 | 256,
			};

			const result = await CryptoUtils.encryptData(textInput, password, encryptionOptions);
			setEncryptedData(result.encryptedData);
			toast.success('Text encrypted successfully');
		} catch (error) {
			toast.error('Text encryption failed');
		} finally {
			setIsProcessing(false);
		}
	};

	// Decrypt text
	const decryptText = async () => {
		if (!validatePassword() || !encryptedData.trim()) {
			return;
		}

		setIsProcessing(true);

		try {
			// Parse encrypted data
			const parts = encryptedData.split(':');
			if (parts.length !== 3) {
				throw new Error('Invalid encrypted data format');
			}

			const [saltB64, ivB64, encryptedDataB64] = parts;
			const decryptedContent = await CryptoUtils.decryptData(encryptedDataB64, password, saltB64, ivB64, keySize);

			setDecryptedData(decryptedContent);
			toast.success('Text decrypted successfully');
		} catch (error) {
			toast.error('Text decryption failed');
		} finally {
			setIsProcessing(false);
		}
	};

	// Download encrypted/decrypted file
	const downloadFile = (job: EncryptionJob) => {
		if (job.result?.downloadUrl) {
			const a = document.createElement('a');
			a.href = job.result.downloadUrl;
			a.download = job.result.fileName || 'output.txt';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
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

	// Clear jobs
	const clearJobs = () => {
		setEncryptionJobs([]);
	};

	// Get password strength color
	const getStrengthColor = (level: string) => {
		switch (level) {
			case 'very_weak':
				return 'text-red-600';
			case 'weak':
				return 'text-orange-600';
			case 'fair':
				return 'text-yellow-600';
			case 'good':
				return 'text-blue-600';
			case 'strong':
				return 'text-green-600';
			case 'very_strong':
				return 'text-green-700';
			default:
				return 'text-gray-600';
		}
	};

	return (
		<div className={className}>
			<div className="space-y-6">
				{/* Algorithm Selection */}
				<Card variant="modern">
					<CardHeader variant="modern">
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5" />
							Encryption Settings
						</CardTitle>
					</CardHeader>
					<CardContent variant="modern">
						<div className="space-y-4">
							<div className="grid md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="algorithm">Encryption Algorithm</Label>
									<Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
										<SelectTrigger>
											<SelectValue placeholder="Select algorithm" />
										</SelectTrigger>
										<SelectContent>
											{encryptionAlgorithms.map((algo) => (
												<SelectItem key={algo.value} value={algo.value}>
													{algo.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="key-size">Key Size</Label>
									<Select value={keySize.toString()} onValueChange={(value) => setKeySize(Number(value))}>
										<SelectTrigger>
											<SelectValue placeholder="Select key size" />
										</SelectTrigger>
										<SelectContent>
											{encryptionAlgorithms
												.find((algo) => algo.value === selectedAlgorithm)
												?.keySizes.map((size) => (
													<SelectItem key={size} value={size.toString()}>
														{size} bits
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="key-derivation">Key Derivation Function</Label>
								<Select value={keyDerivation} onValueChange={setKeyDerivation}>
									<SelectTrigger>
										<SelectValue placeholder="Select key derivation function" />
									</SelectTrigger>
									<SelectContent>
										{keyDerivationFunctions.map((kdf) => (
											<SelectItem key={kdf.value} value={kdf.value}>
												{kdf.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Password Settings */}
				<Card variant="modern">
					<CardHeader variant="modern">
						<CardTitle className="flex items-center gap-2">
							<Key className="h-5 w-5" />
							Password Settings
						</CardTitle>
					</CardHeader>
					<CardContent variant="modern">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? 'text' : 'password'}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Enter encryption password..."
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
										onClick={() => setShowPassword(!showPassword)}
									>
										{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</Button>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="confirm-password">Confirm Password</Label>
								<Input
									id="confirm-password"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Confirm password..."
								/>
							</div>
							{passwordStrength && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label>Password Strength</Label>
										<Badge variant="outline" className={getStrengthColor(passwordStrength.level)}>
											{passwordStrength.level.replace('_', ' ')}
										</Badge>
									</div>
									<Progress value={passwordStrength.score} className="h-2" />
									<div className="text-sm text-gray-600 dark:text-gray-400">
										Crack time: {passwordStrength.crackTime}
									</div>
									{passwordStrength.feedback.length > 0 && (
										<div className="text-sm text-gray-600 dark:text-gray-400">
											<ul className="list-disc list-inside">
												{passwordStrength.feedback.map((feedback, index) => (
													<li key={index}>{feedback}</li>
												))}
											</ul>
										</div>
									)}
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Input Options */}
				<Tabs defaultValue="file" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="file" className="flex items-center gap-2">
							<Upload className="h-4 w-4" />
							File Encryption
						</TabsTrigger>
						<TabsTrigger value="text" className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Text Encryption
						</TabsTrigger>
					</TabsList>

					<TabsContent value="file" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Lock className="h-5 w-5" />
									Encrypt Files
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FileUpload
									files={inputFiles}
									onFilesChange={setInputFiles}
									maxFiles={10}
									acceptedFormats={['txt', 'json', 'xml', 'csv', 'md', 'log', 'pdf', 'doc', 'docx', 'encrypted']}
								/>
								<div className="grid grid-cols-2 gap-4">
									<Button
										onClick={encryptFiles}
										disabled={isProcessing || inputFiles.length === 0 || !password || !validatePassword()}
										className="w-full"
									>
										<Lock className="h-4 w-4 mr-2" />
										{isProcessing ? 'Encrypting...' : 'Encrypt Files'}
									</Button>
									<Button
										onClick={() => decryptFiles(inputFiles)}
										disabled={isProcessing || inputFiles.length === 0 || !password || !validatePassword()}
										variant="outline"
										className="w-full"
									>
										<Unlock className="h-4 w-4 mr-2" />
										{isProcessing ? 'Decrypting...' : 'Decrypt Files'}
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="text" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Lock className="h-5 w-5" />
									Text Encryption
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="text-input">Text to Encrypt</Label>
									<Textarea
										id="text-input"
										value={textInput}
										onChange={(e) => setTextInput(e.target.value)}
										placeholder="Enter text to encrypt..."
										className="min-h-32"
									/>
								</div>
								<Button
									onClick={encryptText}
									disabled={isProcessing || !textInput.trim() || !password || !validatePassword()}
									className="w-full"
								>
									<Lock className="h-4 w-4 mr-2" />
									{isProcessing ? 'Encrypting...' : 'Encrypt Text'}
								</Button>

								{encryptedData && (
									<div className="space-y-2">
										<Label htmlFor="encrypted-output">Encrypted Output</Label>
										<Textarea
											id="encrypted-output"
											value={encryptedData}
											readOnly
											className="min-h-32 font-mono text-sm"
										/>
										<div className="flex gap-2">
											<Button onClick={() => copyToClipboard(encryptedData)} variant="outline" size="sm">
												<Copy className="h-4 w-4 mr-2" />
												Copy
											</Button>
											<Button
												onClick={decryptText}
												disabled={isProcessing || !password || !validatePassword()}
												variant="outline"
												size="sm"
											>
												<Unlock className="h-4 w-4 mr-2" />
												Decrypt
											</Button>
										</div>
									</div>
								)}

								{decryptedData && (
									<div className="space-y-2">
										<Label htmlFor="decrypted-output">Decrypted Output</Label>
										<Textarea
											id="decrypted-output"
											value={decryptedData}
											readOnly
											className="min-h-32 font-mono text-sm"
										/>
										<Button onClick={() => copyToClipboard(decryptedData)} variant="outline" size="sm">
											<Copy className="h-4 w-4 mr-2" />
											Copy Decrypted
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Results */}
				{encryptionJobs.length > 0 && (
					<Card variant="elevated">
						<CardHeader variant="elevated">
							<CardTitle className="flex items-center justify-between">
								<span>Encryption Jobs ({encryptionJobs.length})</span>
								<Button variant="outline" size="sm" onClick={clearJobs}>
									Clear All
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent variant="elevated">
							<div className="space-y-4">
								{encryptionJobs.map((job) => (
									<div
										key={job.id}
										className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 bg-gray-50/50 dark:bg-gray-800/50"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{job.status === 'completed' ? (
													<Check className="h-5 w-5 text-green-600" />
												) : job.status === 'error' ? (
													<AlertTriangle className="h-5 w-5 text-red-600" />
												) : job.status === 'processing' ? (
													<div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
												) : (
													<Lock className="h-5 w-5 text-gray-600" />
												)}
												<span className="font-medium">{job.fileName}</span>
												<Badge variant="outline" className="capitalize">
													{job.operation}
												</Badge>
												<Badge variant="secondary">
													{job.algorithm}-{job.keySize}
												</Badge>
											</div>
											{job.status === 'completed' && job.result && (
												<Button onClick={() => downloadFile(job)} variant="outline" size="sm">
													<Download className="h-4 w-4 mr-2" />
													Download
												</Button>
											)}
										</div>

										{job.status === 'processing' && (
											<div className="space-y-2">
												<Progress value={job.progress} className="h-2" />
												<div className="text-sm text-gray-600 dark:text-gray-400">Processing... {job.progress}%</div>
											</div>
										)}

										{job.status === 'error' && (
											<div className="text-sm text-red-600 dark:text-red-400">Error: {job.error}</div>
										)}

										{job.status === 'completed' && (
											<div className="text-sm text-gray-600 dark:text-gray-400">
												{job.operation === 'encrypt' ? 'Encrypted' : 'Decrypted'} successfully •{' '}
												{(job.fileSize / 1024).toFixed(2)} KB
											</div>
										)}
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
