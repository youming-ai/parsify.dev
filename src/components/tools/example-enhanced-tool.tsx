/**
 * Example Enhanced Developer Tool
 * Demonstrates screen reader enhancements integrated into a developer tool
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility, useAccessibleAnnouncements } from '@/components/ui/accessibility-provider';
import { AccessibleForm, AccessibleInput, AccessibleButton } from '@/components/ui/accessible-form';
import { AccessibleTable } from '@/components/ui/accessible-table';
import { AccessibleProgressBar, AccessibleStatusIndicator } from '@/components/ui/accessible-progress';
import { AccessibleAlert, ToastNotification } from '@/components/ui/accessible-messages';
import { LiveRegion } from '@/components/ui/live-region';

// Example tool that processes JSON data
export default function ExampleEnhancedTool() {
	const { announce, preferences } = useAccessibility();
	const { enabled: announcementsEnabled } = useAccessibleAnnouncements();
	const [inputData, setInputData] = useState('');
	const [processedData, setProcessedData] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingProgress, setProcessingProgress] = useState(0);
	const [errors, setErrors] = useState([]);
	const [showResults, setShowResults] = useState(false);
	const [validationResults, setValidationResults] = useState(null);
	const processingRef = useRef(null);

	// Handle form submission with accessibility enhancements
	const handleSubmit = async (formData) => {
		try {
			setIsProcessing(true);
			setProcessingProgress(0);
			setErrors([]);
			setShowResults(false);

			// Announce processing start
			announce('Processing JSON data...', { type: 'info' });

			// Simulate processing with progress updates
			const steps = [
				{ progress: 25, message: 'Parsing JSON data...' },
				{ progress: 50, message: 'Validating structure...' },
				{ progress: 75, message: 'Processing data...' },
				{ progress: 100, message: 'Complete!' }
			];

			for (const step of steps) {
				await new Promise(resolve => setTimeout(resolve, 1000));
				setProcessingProgress(step.progress);
				announce(step.message, { type: 'info' });
			}

			// Parse and process JSON
			const parsedData = JSON.parse(formData.jsonInput);
			const processed = processJSON(parsedData);

			setProcessedData(processed);
			setValidationResults(validateJSON(parsedData));
			setShowResults(true);

			// Announce completion
			announce('JSON processing completed successfully', { type: 'success' });

		} catch (error) {
			const errorMessage = `Processing failed: ${error.message}`;
			announce(errorMessage, { type: 'error', priority: 'assertive' });
			setErrors([errorMessage]);
		} finally {
			setIsProcessing(false);
			setProcessingProgress(0);
		}
	};

	// Simulated JSON processing function
	const processJSON = (data) => {
		// Add processing logic here
		return {
			original: data,
			processed: {
				itemCount: Array.isArray(data) ? data.length : Object.keys(data).length,
				dataType: Array.isArray(data) ? 'array' : typeof data,
				timestamp: new Date().toISOString(),
				// Add more processing results
			}
		};
	};

	// JSON validation function
	const validateJSON = (data) => {
		const results = {
			isValid: true,
			warnings: [],
			info: []
		};

		// Add validation logic
		if (Array.isArray(data)) {
			results.info.push(`${data.length} items in array`);
			if (data.length === 0) {
				results.warnings.push('Empty array');
			}
		} else if (typeof data === 'object') {
			const keys = Object.keys(data);
			results.info.push(`${keys.length} properties in object`);
			if (keys.length === 0) {
				results.warnings.push('Empty object');
			}
		}

		return results;
	};

	// Table columns for results
	const resultColumns = [
		{
			key: 'property',
			label: 'Property',
			sortable: true,
		},
		{
			key: 'value',
			label: 'Value',
			sortable: true,
		},
		{
			key: 'type',
			label: 'Type',
			sortable: true,
		},
	];

	// Generate table data from processed results
	const generateTableData = () => {
		if (!processedData || !processedData.processed) return [];

		const data = processedData.processed;
		return [
			{ property: 'Item Count', value: data.itemCount, type: 'number' },
			{ property: 'Data Type', value: data.dataType, type: 'string' },
			{ property: 'Processed At', value: new Date(data.timestamp).toLocaleString(), type: 'datetime' },
		];
	};

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Tool Header with accessibility */}
			<header role="banner">
				<h1 className="text-2xl font-bold mb-2">Enhanced JSON Processor</h1>
				<p className="text-gray-600 mb-4">
					Process and validate JSON data with full screen reader support
				</p>
			</header>

			{/* Status Indicator */}
			{preferences.announcementsEnabled && (
				<div className="mb-4" role="status" aria-live="polite">
					<span className="text-sm text-gray-600">
						Screen reader announcements: {announcementsEnabled ? 'Enabled' : 'Disabled'}
					</span>
				</div>
			)}

			{/* Main Form */}
			<AccessibleForm
				title="JSON Input"
				description="Enter JSON data to process and validate"
				onSubmit={handleSubmit}
				className="mb-6"
			>
				<AccessibleInput
					name="jsonInput"
					label="JSON Data"
					type="textarea"
					required
					placeholder='{"example": "data"}'
					description="Enter valid JSON data for processing"
					hint="The data will be parsed and validated for structure"
					validator={(value) => {
						if (!value.trim()) return 'JSON data is required';
						try {
							JSON.parse(value);
							return null;
						} catch (e) {
							return 'Invalid JSON format';
						}
					}}
					className="mb-4"
					rows={6}
				/>

				<div className="flex items-center space-x-4">
					<button
						type="submit"
						disabled={isProcessing}
						className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
						aria-describedby={isProcessing ? 'processing-status' : undefined}
					>
						{isProcessing ? 'Processing...' : 'Process JSON'}
					</button>

					<button
						type="button"
						onClick={() => setInputData('')}
						disabled={isProcessing}
						className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Clear
					</button>
				</div>
			</AccessibleForm>

			{/* Processing Progress */}
			{isProcessing && (
				<div className="mb-6">
					<h2 className="text-lg font-semibold mb-3">Processing Progress</h2>
					<AccessibleProgressBar
						value={processingProgress}
						max={100}
						label="JSON Processing"
						showPercentage={true}
						busy={isProcessing}
					/>
					<div
						id="processing-status"
						role="status"
						aria-live="polite"
						className="mt-2 text-sm text-gray-600"
					>
						Processing is {processingProgress}% complete
					</div>
				</div>
			)}

			{/* Error Display */}
			{errors.length > 0 && (
				<div className="mb-6">
					<AccessibleAlert
						type="error"
						title="Processing Error"
						message={errors[0]}
						dismissible
						onDismiss={() => setErrors([])}
					/>
				</div>
			)}

			{/* Results Display */}
			{showResults && processedData && (
				<section aria-labelledby="results-heading" className="mb-6">
					<h2 id="results-heading" className="text-lg font-semibold mb-4">
						Processing Results
					</h2>

					{/* Validation Results */}
					{validationResults && (
						<div className="mb-4">
							<h3 className="text-md font-medium mb-2">Validation Results</h3>
							{validationResults.warnings.length > 0 && (
								<AccessibleAlert
									type="warning"
									title="Validation Warnings"
									message={validationResults.warnings.join('; ')}
									className="mb-2"
								/>
							)}
							{validationResults.info.length > 0 && (
								<AccessibleAlert
									type="info"
									title="Validation Info"
									message={validationResults.info.join('; ')}
									className="mb-2"
								/>
							)}
						</div>
					)}

					{/* Results Table */}
					<div className="mb-4">
						<AccessibleTable
							title="Processed Data Properties"
							description="Overview of the processed JSON data"
							columns={resultColumns}
							data={generateTableData()}
							sortable={true}
							selectable={false}
							className="border rounded-lg overflow-hidden"
						/>
					</div>

					{/* Raw Data Display */}
					<div>
						<h3 className="text-md font-medium mb-2">Processed Data</h3>
						<pre
							role="region"
							aria-label="Processed JSON data"
							className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto"
						>
							{JSON.stringify(processedData, null, 2)}
						</pre>
					</div>
				</section>
			)}

			{/* Live Regions for Dynamic Content */}
			<LiveRegion id="dynamic-updates" politeness="polite" />

			{/* Accessibility Info */}
			<aside
				role="complementary"
				aria-labelledby="accessibility-info-heading"
				className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
			>
				<h3 id="accessibility-info-heading" className="text-md font-semibold text-blue-900 mb-2">
					Accessibility Features
				</h3>
				<ul className="text-sm text-blue-800 space-y-1">
					<li>• Full keyboard navigation support</li>
					<li>• Screen reader announcements for all actions</li>
					<li>• ARIA labels and descriptions for all interactive elements</li>
					<li>• Live regions for dynamic content updates</li>
					<li>• Progress announcements for long-running operations</li>
					<li>• Error messages with clear context and recovery options</li>
					<li>• Form validation with accessible error messaging</li>
					<li>• Data tables with sorting and navigation support</li>
				</ul>
			</aside>
		</div>
	);
}

// Enhanced Button Component with Accessibility
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	loading?: boolean;
	loadingText?: string;
	variant?: 'primary' | 'secondary' | 'danger';
	size?: 'sm' | 'md' | 'lg';
}

function AccessibleButton({
	children,
	loading = false,
	loadingText = 'Loading...',
	variant = 'primary',
	size = 'md',
	className = '',
	disabled,
	onClick,
	...props
}: AccessibleButtonProps) {
	const { announce } = useAccessibility();
	const buttonRef = useRef<HTMLButtonElement>(null);

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (loading || disabled) return;

		// Announce button action for screen readers
		const buttonText = typeof children === 'string' ? children : 'Action button';
		announce(`${buttonText} activated`, { type: 'info' });

		onClick?.(e);
	};

	const variantClasses = {
		primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
		secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500',
		danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
	};

	return (
		<button
			ref={buttonRef}
			onClick={handleClick}
			disabled={disabled || loading}
			aria-disabled={disabled || loading}
			aria-busy={loading}
			className={`
				${variantClasses[variant]}
				${sizeClasses[size]}
				${loading || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
				rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200
				${className}
			`}
			{...props}
		>
			{loading ? (
				<span className="flex items-center">
					<span
						className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
						aria-hidden="true"
					/>
					{loadingText}
				</span>
			) : (
				children
			)}
		</button>
	);
}
