import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CheckCircle, Copy, Download, RotateCcw, Settings, Wand, XCircle } from 'lucide-react';
import * as React from 'react';
import type { CodeFormatOptions, CodeFormatterProps } from './code-types';
import { getLanguageConfig } from './language-configs';

interface FormatOption {
	key: keyof CodeFormatOptions;
	label: string;
	description: string;
	type: 'number' | 'boolean' | 'select';
	options?: string[];
	min?: number;
	max?: number;
}

const DEFAULT_FORMAT_OPTIONS: CodeFormatOptions = {
	indentSize: 2,
	indentType: 'spaces',
	maxLineLength: 80,
	semicolons: true,
	quotes: 'double',
	trailingComma: false,
};

const FORMAT_OPTIONS: FormatOption[] = [
	{
		key: 'indentSize',
		label: 'Indent Size',
		description: 'Number of spaces or tabs for indentation',
		type: 'number',
		min: 1,
		max: 8,
	},
	{
		key: 'indentType',
		label: 'Indent Type',
		description: 'Use spaces or tabs for indentation',
		type: 'select',
		options: ['spaces', 'tabs'],
	},
	{
		key: 'maxLineLength',
		label: 'Max Line Length',
		description: 'Maximum characters per line',
		type: 'number',
		min: 40,
		max: 200,
	},
	{
		key: 'semicolons',
		label: 'Semicolons',
		description: 'Add semicolons where appropriate',
		type: 'boolean',
	},
	{
		key: 'quotes',
		label: 'Quote Style',
		description: 'Prefer single or double quotes',
		type: 'select',
		options: ['single', 'double'],
	},
	{
		key: 'trailingComma',
		label: 'Trailing Comma',
		description: 'Add trailing commas in objects and arrays',
		type: 'boolean',
	},
];

export function CodeFormatter({ code, language, options, onFormat, onError, className }: CodeFormatterProps) {
	const [isFormatting, setIsFormatting] = React.useState(false);
	const [showOptions, setShowOptions] = React.useState(false);
	const [localOptions, setLocalOptions] = React.useState<CodeFormatOptions>(options);
	const [formattedCode, setFormattedCode] = React.useState('');
	const [error, setError] = React.useState('');
	const [success, setSuccess] = React.useState(false);

	const languageConfig = getLanguageConfig(language);

	// Update local options when props change
	React.useEffect(() => {
		setLocalOptions(options);
	}, [options]);

	const formatCode = async () => {
		if (!code.trim()) {
			setError('No code to format');
			return;
		}

		setIsFormatting(true);
		setError('');
		setSuccess(false);

		try {
			// Simulate API call to formatting service
			const response = await fetch('/api/code/format', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					code,
					language,
					options: localOptions,
				}),
			});

			if (!response.ok) {
				throw new Error(`Formatting failed: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			const formatted = result.formattedCode || result.output || code;
			setFormattedCode(formatted);
			setSuccess(true);

			if (onFormat) {
				onFormat(formatted);
			}

			// Clear success message after 3 seconds
			setTimeout(() => setSuccess(false), 3000);
		} catch (err: any) {
			const errorMessage = err.message || 'An error occurred during formatting';
			setError(errorMessage);
			if (onError) {
				onError(errorMessage);
			}
		} finally {
			setIsFormatting(false);
		}
	};

	const resetToDefaults = () => {
		setLocalOptions(DEFAULT_FORMAT_OPTIONS);
	};

	const copyFormattedCode = () => {
		if (formattedCode) {
			navigator.clipboard.writeText(formattedCode).then(() => {
				// Could show a toast notification here
				console.log('Formatted code copied to clipboard');
			});
		}
	};

	const downloadFormattedCode = () => {
		if (formattedCode) {
			const extension = languageConfig.extensions[0] || '.txt';
			const blob = new Blob([formattedCode], {
				type: 'text/plain',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `formatted-code-${Date.now()}${extension}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	};

	const updateOption = (key: keyof CodeFormatOptions, value: any) => {
		const newOptions = { ...localOptions, [key]: value };
		setLocalOptions(newOptions);
	};

	const formatOptionComponent = (option: FormatOption) => {
		const value = localOptions[option.key];

		switch (option.type) {
			case 'boolean':
				return (
					<div className="flex items-center space-x-2">
						<Switch
							id={option.key}
							checked={value as boolean}
							onCheckedChange={(checked) => updateOption(option.key, checked)}
						/>
						<Label htmlFor={option.key} className="text-sm">
							{option.label}
						</Label>
					</div>
				);

			case 'number':
				return (
					<div className="space-y-2">
						<Label htmlFor={option.key} className="text-sm">
							{option.label}
						</Label>
						<Input
							id={option.key}
							type="number"
							min={option.min}
							max={option.max}
							value={value as number}
							onChange={(e) => updateOption(option.key, Number.parseInt(e.target.value, 10))}
							className="w-20"
						/>
					</div>
				);

			case 'select':
				return (
					<div className="space-y-2">
						<Label htmlFor={option.key} className="text-sm">
							{option.label}
						</Label>
						<select
							id={option.key}
							value={value as string}
							onChange={(e) => updateOption(option.key, e.target.value)}
							className="w-full rounded-md border px-3 py-2 text-sm"
						>
							{option.options?.map((opt) => (
								<option key={opt} value={opt}>
									{opt.charAt(0).toUpperCase() + opt.slice(1)}
								</option>
							))}
						</select>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className={cn('space-y-4', className)}>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Wand className="h-5 w-5" />
							Code Formatter
							<Badge variant="secondary">{languageConfig.name}</Badge>
						</CardTitle>

						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={() => setShowOptions(!showOptions)}>
								<Settings className="mr-2 h-4 w-4" />
								Options
							</Button>

							<Button onClick={formatCode} disabled={isFormatting || !code.trim()} size="sm">
								<Wand className={cn('mr-2 h-4 w-4', isFormatting && 'animate-spin')} />
								{isFormatting ? 'Formatting...' : 'Format Code'}
							</Button>
						</div>
					</div>
				</CardHeader>

				{/* Format Options */}
				{showOptions && (
					<CardContent className="border-t">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="font-medium">Formatting Options</h3>
								<Button variant="outline" size="sm" onClick={resetToDefaults}>
									<RotateCcw className="mr-2 h-4 w-4" />
									Reset to Defaults
								</Button>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{FORMAT_OPTIONS.map((option) => (
									<div key={option.key} className="space-y-1">
										{formatOptionComponent(option)}
										<p className="text-gray-500 text-xs dark:text-gray-400">{option.description}</p>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Success Message */}
			{success && (
				<Alert>
					<CheckCircle className="h-4 w-4" />
					<AlertDescription>Code formatted successfully!</AlertDescription>
				</Alert>
			)}

			{/* Error Message */}
			{error && (
				<Alert variant="destructive">
					<XCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Formatted Code */}
			{formattedCode && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">Formatted Code</CardTitle>

							<div className="flex items-center gap-2">
								<Button variant="outline" size="sm" onClick={copyFormattedCode}>
									<Copy className="mr-2 h-4 w-4" />
									Copy
								</Button>

								<Button variant="outline" size="sm" onClick={downloadFormattedCode}>
									<Download className="mr-2 h-4 w-4" />
									Download
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent>
						<div className="overflow-auto rounded-md border bg-gray-50 p-4 dark:bg-gray-900">
							<pre className="whitespace-pre-wrap font-mono text-sm">
								<code>{formattedCode}</code>
							</pre>
						</div>

						{/* Format Stats */}
						<div className="mt-4 flex flex-wrap gap-4 text-gray-600 text-sm dark:text-gray-400">
							<div>Original: {code.split('\n').length} lines</div>
							<div>Formatted: {formattedCode.split('\n').length} lines</div>
							<div>Size: {formattedCode.length} characters</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// Preset format configurations
export const FORMAT_PRESETS = {
	prettier: {
		indentSize: 2,
		indentType: 'spaces' as const,
		maxLineLength: 80,
		semicolons: true,
		quotes: 'double' as const,
		trailingComma: true,
	},
	standardjs: {
		indentSize: 2,
		indentType: 'spaces' as const,
		maxLineLength: 100,
		semicolons: true,
		quotes: 'single' as const,
		trailingComma: false,
	},
	google: {
		indentSize: 2,
		indentType: 'spaces' as const,
		maxLineLength: 100,
		semicolons: true,
		quotes: 'single' as const,
		trailingComma: false,
	},
	tabs: {
		indentSize: 4,
		indentType: 'tabs' as const,
		maxLineLength: 120,
		semicolons: true,
		quotes: 'double' as const,
		trailingComma: false,
	},
};

export function FormatPresetSelector({
	selectedPreset,
	onPresetChange,
	className,
}: {
	selectedPreset: keyof typeof FORMAT_PRESETS;
	onPresetChange: (preset: keyof typeof FORMAT_PRESETS, options: CodeFormatOptions) => void;
	className?: string;
}) {
	return (
		<div className={cn('flex flex-wrap gap-2', className)}>
			{Object.entries(FORMAT_PRESETS).map(([key, options]) => (
				<Button
					key={key}
					variant={selectedPreset === key ? 'default' : 'outline'}
					size="sm"
					onClick={() => onPresetChange(key as keyof typeof FORMAT_PRESETS, options)}
				>
					{key.charAt(0).toUpperCase() + key.slice(1)}
				</Button>
			))}
		</div>
	);
}
