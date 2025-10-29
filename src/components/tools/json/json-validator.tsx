import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { JsonErrorDisplay } from './json-error-display';
import type { JsonValidationResult, JsonValidatorProps } from './json-types';
import { validateJson } from './json-utils';

export function JsonValidator({ input, onValidationChange, showLineNumbers = true, className }: JsonValidatorProps) {
	const [validationResult, setValidationResult] = React.useState<JsonValidationResult>({
		isValid: false,
		errors: [],
	});
	const [isValidating, setIsValidating] = React.useState(false);

	// Perform validation when input changes
	React.useEffect(() => {
		setIsValidating(true);

		// Small debounce to prevent excessive validation during typing
		const timer = setTimeout(() => {
			try {
				const result = validateJson(input);
				setValidationResult(result);
				onValidationChange?.(result);
			} catch (error) {
				const errorResult: JsonValidationResult = {
					isValid: false,
					errors: [
						{
							line: 1,
							column: 1,
							message: error instanceof Error ? error.message : 'Unknown validation error',
							severity: 'error',
						},
					],
				};
				setValidationResult(errorResult);
				onValidationChange?.(errorResult);
			} finally {
				setIsValidating(false);
			}
		}, 300);

		return () => {
			clearTimeout(timer);
			setIsValidating(false);
		};
	}, [input, onValidationChange]);

	const handleRevalidate = () => {
		setIsValidating(true);
		try {
			const result = validateJson(input);
			setValidationResult(result);
			onValidationChange?.(result);
		} catch (error) {
			const errorResult: JsonValidationResult = {
				isValid: false,
				errors: [
					{
						line: 1,
						column: 1,
						message: error instanceof Error ? error.message : 'Unknown validation error',
						severity: 'error',
					},
				],
			};
			setValidationResult(errorResult);
			onValidationChange?.(errorResult);
		} finally {
			setIsValidating(false);
		}
	};

	const getStatusIcon = () => {
		if (isValidating) {
			return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
		}
		if (validationResult.isValid) {
			return <CheckCircle className="h-4 w-4 text-green-600" />;
		}
		return <AlertCircle className="h-4 w-4 text-red-600" />;
	};

	const getStatusColor = () => {
		if (isValidating) return 'bg-blue-50 border-blue-200';
		if (validationResult.isValid) return 'bg-green-50 border-green-200';
		return 'bg-red-50 border-red-200';
	};

	const getStatusText = () => {
		if (isValidating) return 'Validating...';
		if (validationResult.isValid) return 'Valid JSON';
		if (validationResult.errors.length > 0) {
			return `${validationResult.errors.length} ${validationResult.errors.length === 1 ? 'error' : 'errors'} found`;
		}
		return 'Invalid JSON';
	};

	const getStats = () => {
		const lines = input.split('\n').length;
		const chars = input.length;
		const words = input.trim() ? input.trim().split(/\s+/).length : 0;

		return { lines, chars, words };
	};

	const stats = getStats();

	return (
		<div className={cn('space-y-4', className)}>
			{/* Status Bar */}
			<div className={cn('rounded-lg border p-4 transition-colors duration-200', getStatusColor())}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{getStatusIcon()}
						<div>
							<h3 className="font-medium text-gray-900">{getStatusText()}</h3>
							<p className="mt-1 text-gray-600 text-sm">JSON validation {isValidating ? 'in progress' : 'complete'}</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleRevalidate}
							disabled={isValidating}
							className="flex items-center gap-1"
						>
							<RefreshCw className={cn('h-3 w-3', isValidating && 'animate-spin')} />
							Revalidate
						</Button>
					</div>
				</div>

				{/* Statistics */}
				<div className="mt-4 border-gray-200 border-t pt-4">
					<div className="flex items-center gap-4 text-gray-600 text-sm">
						<span>Lines: {stats.lines}</span>
						<span>Characters: {stats.chars}</span>
						<span>Words: {stats.words}</span>
					</div>
				</div>
			</div>

			{/* Validation Errors */}
			{!validationResult.isValid && validationResult.errors.length > 0 && (
				<JsonErrorDisplay errors={validationResult.errors} content={input} />
			)}

			{/* Success Message */}
			{validationResult.isValid && input.trim() && (
				<Alert>
					<CheckCircle className="h-4 w-4 text-green-600" />
					<AlertDescription className="text-green-800">
						Your JSON is valid and properly formatted. No syntax errors detected.
					</AlertDescription>
				</Alert>
			)}

			{/* Empty State */}
			{!input.trim() && (
				<div className="py-8 text-center text-gray-500">
					<AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
					<p>Enter JSON content above to validate</p>
				</div>
			)}
		</div>
	);
}
