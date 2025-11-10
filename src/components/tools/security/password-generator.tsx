'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Key, RefreshCw, Shield, Volume2, Check, AlertTriangle, Download, Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { CryptoUtils, PasswordStrength, PasswordOptions } from '@/lib/crypto';

export interface GeneratedPassword {
	password: string;
	strength: PasswordStrength;
	entropy: number;
	createdAt: Date;
}

export interface PassphraseOptions {
	wordCount: number;
	separator: string;
	capitalize: boolean;
	includeNumbers: boolean;
	wordList: 'eff' | 'common' | 'custom';
	customWords?: string[];
}

interface PasswordGeneratorProps {
	onPasswordGenerated?: (password: GeneratedPassword) => void;
	className?: string;
}

// Word lists for passphrase generation
const wordLists = {
	eff: [
		'ability', 'able', 'about', 'above', 'accept', 'across', 'action', 'active', 'actual', 'address',
		'advance', 'advice', 'afford', 'afraid', 'agency', 'agent', 'agree', 'ahead', 'allow', 'almost',
		'alone', 'along', 'already', 'also', 'although', 'always', 'amount', 'ancient', 'anger', 'angle',
		'angry', 'animal', 'annoy', 'another', 'answer', 'appear', 'apple', 'apply', 'approach', 'approve',
		'argue', 'arise', 'armed', 'armor', 'arrest', 'arrive', 'article', 'artist', 'aspect', 'assign',
	],
	common: [
		'password', 'admin', 'user', 'login', 'secure', 'access', 'account', 'system', 'service', 'network',
		'database', 'server', 'client', 'session', 'token', 'secret', 'private', 'public', 'internal', 'external',
		'development', 'production', 'testing', 'staging', 'backup', 'restore', 'archive', 'temporary', 'permanent', 'cache',
	],
};

export function PasswordGenerator({ onPasswordGenerated, className }: PasswordGeneratorProps) {
	const [password, setPassword] = React.useState('');
	const [passwordStrength, setPasswordStrength] = React.useState<PasswordStrength | null>(null);
	const [passwordHistory, setPasswordHistory] = React.useState<GeneratedPassword[]>([]);
	const [showPassword, setShowPassword] = React.useState(false);
	const [isGenerating, setIsGenerating] = React.useState(false);

	// Password generation options
	const [length, setLength] = React.useState([16]);
	const [includeUppercase, setIncludeUppercase] = React.useState(true);
	const [includeLowercase, setIncludeLowercase] = React.useState(true);
	const [includeNumbers, setIncludeNumbers] = React.useState(true);
	const [includeSymbols, setIncludeSymbols] = React.useState(true);
	const [excludeSimilar, setExcludeSimilar] = React.useState(false);
	const [excludeAmbiguous, setExcludeAmbiguous] = React.useState(false);
	const [customCharset, setCustomCharset] = React.useState('');
	const [useCustomCharset, setUseCustomCharset] = React.useState(false);

	// Batch generation options
	const [batchCount, setBatchCount] = React.useState([5]);
	const [batchPasswords, setBatchPasswords] = React.useState<GeneratedPassword[]>([]);

	// Passphrase options
	const [passphraseOptions, setPassphraseOptions] = React.useState<PassphraseOptions>({
		wordCount: 6,
		separator: '-',
		capitalize: false,
		includeNumbers: false,
		wordList: 'eff',
	});

	// Pronounceable password options
	const [syllableCount, setSyllableCount] = React.useState([4]);
	const [usePronounceable, setUsePronounceable] = React.useState(false);

	// Generate password
	const generatePassword = React.useCallback(() => {
		setIsGenerating(true);

		try {
			let newPassword = '';

			if (usePronounceable) {
				newPassword = generatePronounceablePassword(syllableCount[0]);
			} else {
				const options: PasswordOptions = {
					length: length[0],
					includeUppercase,
					includeLowercase,
					includeNumbers,
					includeSymbols,
					excludeSimilar,
					excludeAmbiguous,
					customCharset: useCustomCharset && customCharset ? customCharset : undefined,
				};

				const result = CryptoUtils.generatePassword(options);
				newPassword = result.password;
				setPasswordStrength(result.strength);
			}

			setPassword(newPassword);

			// Calculate strength for pronounceable passwords
			if (usePronounceable) {
				const strength = CryptoUtils.calculatePasswordStrength(newPassword);
				setPasswordStrength(strength);
			}

			const generatedPassword: GeneratedPassword = {
				password: newPassword,
				strength: passwordStrength || CryptoUtils.calculatePasswordStrength(newPassword),
				entropy: calculateEntropy(newPassword),
				createdAt: new Date(),
			};

			setPasswordHistory((prev) => [generatedPassword, ...prev.slice(0, 9)]);
			onPasswordGenerated?.(generatedPassword);

		} catch (error) {
			toast.error('Failed to generate password');
		} finally {
			setIsGenerating(false);
		}
	}, [
		length, includeUppercase, includeLowercase, includeNumbers, includeSymbols,
		excludeSimilar, excludeAmbiguous, customCharset, useCustomCharset,
		usePronounceable, syllableCount, passwordStrength, onPasswordGenerated
	]);

	// Generate pronounceable password (simple implementation)
	const generatePronounceablePassword = (syllables: number): string => {
		const consonants = 'bcdfghjklmnpqrstvwxyz';
		const vowels = 'aeiou';
		let password = '';

		for (let i = 0; i < syllables; i++) {
			const consonant = consonants[Math.floor(Math.random() * consonants.length)];
			const vowel = vowels[Math.floor(Math.random() * vowels.length)];
			const consonant2 = consonants[Math.floor(Math.random() * consonants.length)];

			password += consonant + vowel + consonant2;

			// Occasionally add number or symbol
			if (Math.random() < 0.3) {
				password += Math.floor(Math.random() * 10);
			}
		}

		// Randomly capitalize some letters
		if (Math.random() < 0.5) {
			password = password.charAt(0).toUpperCase() + password.slice(1);
		}

		return password;
	};

	// Generate passphrase
	const generatePassphrase = (): string => {
		const { wordCount, separator, capitalize, includeNumbers, wordList } = passphraseOptions;
		let words: string[];

		if (wordList === 'custom' && passphraseOptions.customWords) {
			words = passphraseOptions.customWords;
		} else {
			words = wordLists[wordList];
		}

		const selectedWords: string[] = [];
		for (let i = 0; i < wordCount; i++) {
			const word = words[Math.floor(Math.random() * words.length)];
			const processedWord = capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
			const finalWord = includeNumbers && Math.random() < 0.5 ? processedWord + Math.floor(Math.random() * 100) : processedWord;
			selectedWords.push(finalWord);
		}

		return selectedWords.join(separator);
	};

	// Generate batch passwords
	const generateBatchPasswords = () => {
		setIsGenerating(true);
		const passwords: GeneratedPassword[] = [];

		try {
			for (let i = 0; i < batchCount[0]; i++) {
				const options: PasswordOptions = {
					length: length[0],
					includeUppercase,
					includeLowercase,
					includeNumbers,
					includeSymbols,
					excludeSimilar,
					excludeAmbiguous,
					customCharset: useCustomCharset && customCharset ? customCharset : undefined,
				};

				const result = CryptoUtils.generatePassword(options);
				const generatedPassword: GeneratedPassword = {
					password: result.password,
					strength: result.strength,
					entropy: calculateEntropy(result.password),
					createdAt: new Date(),
				};

				passwords.push(generatedPassword);
			}

			setBatchPasswords(passwords);
			toast.success(`Generated ${passwords.length} passwords`);
		} catch (error) {
			toast.error('Failed to generate batch passwords');
		} finally {
			setIsGenerating(false);
		}
	};

	// Calculate password entropy
	const calculateEntropy = (password: string): number => {
		let charsetSize = 0;
		if (/[a-z]/.test(password)) charsetSize += 26;
		if (/[A-Z]/.test(password)) charsetSize += 26;
		if (/[0-9]/.test(password)) charsetSize += 10;
		if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

		return password.length * Math.log2(charsetSize);
	};

	// Copy to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Password copied to clipboard');
		} catch (error) {
			toast.error('Failed to copy to clipboard');
		}
	};

	// Download passwords
	const downloadPasswords = (passwords: GeneratedPassword[], filename: string) => {
		const content = passwords.map((p, index) => `${index + 1}. ${p.password} (Strength: ${p.strength.level}, Entropy: ${p.entropy.toFixed(2)} bits)`).join('\n');
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success('Passwords downloaded');
	};

	// Speak password (for accessibility)
	const speakPassword = (text: string) => {
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.rate = 0.7;
			speechSynthesis.speak(utterance);
		}
	};

	// Get strength color
	const getStrengthColor = (level: string) => {
		switch (level) {
			case 'very_weak':
				return 'bg-red-500';
			case 'weak':
				return 'bg-orange-500';
			case 'fair':
				return 'bg-yellow-500';
			case 'good':
				return 'bg-blue-500';
			case 'strong':
				return 'bg-green-500';
			case 'very_strong':
				return 'bg-green-600';
			default:
				return 'bg-gray-500';
		}
	};

	// Generate initial password on mount
	React.useEffect(() => {
		generatePassword();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className={className}>
			<div className="space-y-6">
				{/* Main Password Display */}
				<Card variant="modern">
					<CardHeader variant="modern">
						<CardTitle className="flex items-center gap-2">
							<Key className="h-5 w-5" />
							Generated Password
						</CardTitle>
					</CardHeader>
					<CardContent variant="modern">
						<div className="space-y-4">
							<div className="relative">
								<Input
									value={password}
									readOnly
									className="font-mono text-lg pr-20"
									type={showPassword ? 'text' : 'password'}
								/>
								<div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setShowPassword(!showPassword)}
									>
										{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => copyToClipboard(password)}
									>
										<Copy className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={generatePassword}
										disabled={isGenerating}
									>
										<RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
									</Button>
								</div>
							</div>

							{passwordStrength && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Shield className="h-4 w-4" />
											<span className="text-sm font-medium">Password Strength</span>
										</div>
										<Badge variant="outline" className="capitalize">
											{passwordStrength.level.replace('_', ' ')}
										</Badge>
									</div>
									<Progress value={passwordStrength.score} className="h-2" />
									<div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
										<div>Crack Time: {passwordStrength.crackTime}</div>
										<div>Entropy: {calculateEntropy(password).toFixed(2)} bits</div>
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

							<div className="flex gap-2">
								<Button onClick={generatePassword} disabled={isGenerating} className="flex-1">
									<RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
									Generate New
								</Button>
								<Button variant="outline" onClick={() => speakPassword(password)}>
									<Volume2 className="h-4 w-4 mr-2" />
									Speak
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Password Generation Options */}
				<Card variant="modern">
					<CardHeader variant="modern">
						<CardTitle>Generation Options</CardTitle>
					</CardHeader>
					<CardContent variant="modern">
						<div className="space-y-6">
							{/* Password Type Selection */}
							<Tabs defaultValue="random" className="w-full">
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="random">Random</TabsTrigger>
									<TabsTrigger value="pronounceable">Pronounceable</TabsTrigger>
									<TabsTrigger value="passphrase">Passphrase</TabsTrigger>
								</TabsList>

								<TabsContent value="random" className="space-y-4">
									<div className="space-y-2">
										<Label>Password Length: {length[0]}</Label>
										<Slider
											value={length}
											onValueChange={setLength}
											max={128}
											min={4}
											step={1}
											className="w-full"
										/>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="flex items-center space-x-2">
											<Switch
												id="uppercase"
												checked={includeUppercase}
												onCheckedChange={setIncludeUppercase}
											/>
											<Label htmlFor="uppercase">Uppercase (A-Z)</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												id="lowercase"
												checked={includeLowercase}
												onCheckedChange={setIncludeLowercase}
											/>
											<Label htmlFor="lowercase">Lowercase (a-z)</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												id="numbers"
												checked={includeNumbers}
												onCheckedChange={setIncludeNumbers}
											/>
											<Label htmlFor="numbers">Numbers (0-9)</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												id="symbols"
												checked={includeSymbols}
												onCheckedChange={setIncludeSymbols}
											/>
											<Label htmlFor="symbols">Symbols (!@#$...)</Label>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="flex items-center space-x-2">
											<Switch
												id="exclude-similar"
												checked={excludeSimilar}
												onCheckedChange={setExcludeSimilar}
											/>
											<Label htmlFor="exclude-similar">Exclude Similar (i, l, 1, L, o, 0, O)</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												id="exclude-ambiguous"
												checked={excludeAmbiguous}
												onCheckedChange={setExcludeAmbiguous}
											/>
											<Label htmlFor="exclude-ambiguous">Exclude Ambiguous ({'{', '}', '[', ']', '(', ')', '/', '\\', '\'', '"', '`', '~', ',', ';', '.', '<', '>'})</Label>
										</div>
									</div>

									<div className="space-y-2">
										<div className="flex items-center space-x-2">
											<Switch
												id="custom-charset"
												checked={useCustomCharset}
												onCheckedChange={setUseCustomCharset}
											/>
											<Label htmlFor="custom-charset">Use Custom Character Set</Label>
										</div>
										{useCustomCharset && (
											<Input
												value={customCharset}
												onChange={(e) => setCustomCharset(e.target.value)}
												placeholder="Enter custom characters..."
											/>
										)}
									</div>
								</TabsContent>

								<TabsContent value="pronounceable" className="space-y-4">
									<div className="space-y-2">
										<Label>Syllable Count: {syllableCount[0]}</Label>
										<Slider
											value={syllableCount}
											onValueChange={setSyllableCount}
											max={12}
											min={3}
											step={1}
											className="w-full"
										/>
									</div>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Generates passwords that are easier to pronounce and remember while maintaining security.
									</p>
								</TabsContent>

								<TabsContent value="passphrase" className="space-y-4">
									<div className="space-y-2">
										<Label>Word Count: {passphraseOptions.wordCount}</Label>
										<Slider
											value={[passphraseOptions.wordCount]}
											onValueChange={([value]) => setPassphraseOptions(prev => ({ ...prev, wordCount: value }))}
											max={12]
											min={4}
											step={1}
											className="w-full"
										/>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Separator</Label>
											<Select
												value={passphraseOptions.separator}
												onValueChange={(value) => setPassphraseOptions(prev => ({ ...prev, separator: value }))}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="-">Hyphen (-)</SelectItem>
													<SelectItem value="_">Underscore (_)</SelectItem>
													<SelectItem value=" ">Space ( )</SelectItem>
													<SelectItem value=".">Period (.)</SelectItem>
													<SelectItem value="">No Separator</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label>Word List</Label>
											<Select
												value={passphraseOptions.wordList}
												onValueChange={(value: any) => setPassphraseOptions(prev => ({ ...prev, wordList: value }))}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="eff">EFF (Long Word List)</SelectItem>
													<SelectItem value="common">Common Words</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="flex items-center space-x-2">
											<Switch
												id="capitalize-words"
												checked={passphraseOptions.capitalize}
												onCheckedChange={(checked) => setPassphraseOptions(prev => ({ ...prev, capitalize: checked }))}
											/>
											<Label htmlFor="capitalize-words">Capitalize Words</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												id="include-numbers"
												checked={passphraseOptions.includeNumbers}
												onCheckedChange={(checked) => setPassphraseOptions(prev => ({ ...prev, includeNumbers: checked }))}
											/>
											<Label htmlFor="include-numbers">Include Numbers</Label>
										</div>
									</div>

									<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
										<p className="text-sm font-medium mb-2">Preview:</p>
										<p className="font-mono text-lg">{generatePassphrase()}</p>
									</div>
								</TabsContent>
							</Tabs>
						</div>
					</CardContent>
				</Card>

				{/* Batch Generation */}
				<Card variant="modern">
					<CardHeader variant="modern">
						<CardTitle>Batch Generation</CardTitle>
					</CardHeader>
					<CardContent variant="modern">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Number of Passwords: {batchCount[0]}</Label>
								<Slider
									value={batchCount}
									onValueChange={setBatchCount}
									max={50}
									min={1}
									step={1}
									className="w-full"
								/>
							</div>

							<Button onClick={generateBatchPasswords} disabled={isGenerating} className="w-full">
								<RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
								Generate {batchCount[0]} Passwords
							</Button>

							{batchPasswords.length > 0 && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label>Generated Passwords</Label>
										<Button
											onClick={() => downloadPasswords(batchPasswords, 'passwords.txt')}
											variant="outline"
											size="sm"
										>
											<Download className="h-4 w-4 mr-2" />
											Download All
										</Button>
									</div>
									<div className="max-h-60 overflow-y-auto space-y-2">
										{batchPasswords.map((pwd, index) => (
											<div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
												<span className="font-mono text-sm">{pwd.password}</span>
												<div className="flex items-center gap-2">
													<Badge variant="outline" className="text-xs">
														{pwd.strength.level.replace('_', ' ')}
													</Badge>
													<Button
														onClick={() => copyToClipboard(pwd.password)}
														variant="ghost"
														size="sm"
													>
														<Copy className="h-3 w-3" />
													</Button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Password History */}
				{passwordHistory.length > 0 && (
					<Card variant="modern">
						<CardHeader variant="modern">
							<CardTitle>Recent Passwords</CardTitle>
						</CardHeader>
						<CardContent variant="modern">
							<div className="space-y-2">
								{passwordHistory.map((pwd, index) => (
									<div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
										<span className="font-mono text-sm">{pwd.password}</span>
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="text-xs">
												{pwd.strength.level.replace('_', ' ')}
											</Badge>
											<Button
												onClick={() => copyToClipboard(pwd.password)}
												variant="ghost"
												size="sm"
											>
												<Copy className="h-3 w-3" />
											</Button>
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
