/**
 * React Components for Retry UI and Progress Indication
 * Provides visual feedback for retry operations and user controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Alert,
	AlertDescription,
	AlertTitle
} from '@/components/ui/alert';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
	AlertTriangle,
	RefreshCw,
	CheckCircle,
	XCircle,
	Settings,
	Activity,
	Clock,
	Zap,
	Shield
} from 'lucide-react';

import {
	RetryResult,
	AdvancedRetryConfig,
	ToolCategory,
	OperationType,
	ToolRetryStrategies,
	retryEngine,
	retryAnalytics
} from '../retry-mechanisms';

// ============================================================================
// Retry Progress Component
// ============================================================================

export interface RetryProgressProps {
	retryResult?: RetryResult;
	isActive: boolean;
	showDetails?: boolean;
	className?: string;
}

export const RetryProgress: React.FC<RetryProgressProps> = ({
	retryResult,
	isActive,
	showDetails = false,
	className = ''
}) => {
	const [currentAttempt, setCurrentAttempt] = useState(0);
	const [timeRemaining, setTimeRemaining] = useState(0);

	useEffect(() => {
		if (!isActive || !retryResult) return;

		const latestAttempt = retryResult.attempts[retryResult.attempts.length - 1];
		if (latestAttempt && !latestAttempt.success) {
			setCurrentAttempt(latestAttempt.attempt);
			setTimeRemaining(latestAttempt.delay);

			const interval = setInterval(() => {
				setTimeRemaining(prev => Math.max(0, prev - 100));
			}, 100);

			return () => clearInterval(interval);
		}
	}, [isActive, retryResult]);

	if (!retryResult) {
		return null;
	}

	const { attempts, success } = retryResult;
	const maxAttempts = Math.max(...attempts.map(a => a.attempt));
	const successCount = attempts.filter(a => a.success).length;
	const failedCount = attempts.filter(a => !a.success).length;

	return (
		<div className={`space-y-3 ${className}`}>
			{/* Overall Status */}
			<div className="flex items-center space-x-2">
				{success ? (
					<CheckCircle className="h-5 w-5 text-green-500" />
				) : isActive ? (
					<RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
				) : (
					<XCircle className="h-5 w-5 text-red-500" />
				)}
				<span className="text-sm font-medium">
					{success
						? 'Operation completed successfully'
						: isActive
							? `Attempt ${currentAttempt} of ${maxAttempts}`
							: 'Operation failed'
					}
				</span>
			</div>

			{/* Progress Bar */}
			<div className="space-y-2">
				<Progress
					value={(successCount / Math.max(1, successCount + failedCount)) * 100}
					className="h-2"
				/>
				<div className="flex justify-between text-xs text-gray-500">
					<span>{successCount} successful</span>
					<span>{failedCount} failed</span>
				</div>
			</div>

			{/* Countdown for next retry */}
			{isActive && timeRemaining > 0 && (
				<div className="flex items-center space-x-2 text-sm text-blue-600">
					<Clock className="h-4 w-4" />
					<span>Next retry in {(timeRemaining / 1000).toFixed(1)}s</span>
				</div>
			)}

			{showDetails && attempts.length > 0 && (
				<RetryAttemptDetails attempts={attempts} />
			)}
		</div>
	);
};

// ============================================================================
// Retry Attempt Details Component
// ============================================================================

interface RetryAttemptDetailsProps {
	attempts: Array<{
		attempt: number;
		timestamp: Date;
		delay: number;
		error: Error;
		success: boolean;
		duration?: number;
	}>;
}

const RetryAttemptDetails: React.FC<RetryAttemptDetailsProps> = ({ attempts }) => {
	return (
		<div className="mt-4 space-y-2">
			<h4 className="text-sm font-medium">Attempt History</h4>
			<div className="max-h-40 overflow-y-auto space-y-1">
				{attempts.map((attempt, index) => (
					<div
						key={index}
						className={`flex items-center justify-between p-2 rounded text-xs ${
							attempt.success
								? 'bg-green-50 text-green-700'
								: 'bg-red-50 text-red-700'
						}`}
					>
						<div className="flex items-center space-x-2">
							{attempt.success ? (
								<CheckCircle className="h-3 w-3" />
							) : (
								<XCircle className="h-3 w-3" />
							)}
							<span>Attempt {attempt.attempt}</span>
						</div>
						<div className="flex items-center space-x-2 text-gray-500">
							{attempt.duration && (
								<span>{attempt.duration}ms</span>
							)}
							{attempt.delay > 0 && (
								<span>+{attempt.delay}ms</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

// ============================================================================
// Retry Status Badge Component
// ============================================================================

export interface RetryStatusBadgeProps {
	status: 'idle' | 'retrying' | 'success' | 'failed';
	attempts?: number;
	maxAttempts?: number;
	className?: string;
}

export const RetryStatusBadge: React.FC<RetryStatusBadgeProps> = ({
	status,
	attempts,
	maxAttempts,
	className = ''
}) => {
	const getStatusConfig = () => {
		switch (status) {
			case 'idle':
				return {
					variant: 'secondary' as const,
					icon: <Activity className="h-3 w-3" />,
					text: 'Ready'
				};
			case 'retrying':
				return {
					variant: 'default' as const,
					icon: <RefreshCw className="h-3 w-3 animate-spin" />,
					text: attempts && maxAttempts ? `Retrying (${attempts}/${maxAttempts})` : 'Retrying'
				};
			case 'success':
				return {
					variant: 'default' as const,
					icon: <CheckCircle className="h-3 w-3" />,
					text: 'Success'
				};
			case 'failed':
				return {
					variant: 'destructive' as const,
					icon: <XCircle className="h-3 w-3" />,
					text: 'Failed'
				};
		}
	};

	const config = getStatusConfig();

	return (
		<Badge variant={config.variant} className={className}>
			<span className="flex items-center space-x-1">
				{config.icon}
				<span>{config.text}</span>
			</span>
		</Badge>
	);
};

// ============================================================================
// Retry Controls Component
// ============================================================================

export interface RetryControlsProps {
	config: AdvancedRetryConfig;
	onConfigChange: (config: AdvancedRetryConfig) => void;
	disabled?: boolean;
	toolCategory?: ToolCategory;
	operationType?: OperationType;
}

export const RetryControls: React.FC<RetryControlsProps> = ({
	config,
	onConfigChange,
	disabled = false,
	toolCategory,
	operationType
}) => {
	const [showAdvanced, setShowAdvanced] = useState(false);

	const updateConfig = useCallback((updates: Partial<AdvancedRetryConfig>) => {
		onConfigChange({ ...config, ...updates });
	}, [config, onConfigChange]);

	const applyPreset = useCallback((preset: ToolCategory) => {
		const presetConfig = ToolRetryStrategies.getStrategyByCategory(preset);
		onConfigChange(presetConfig);
	}, [onConfigChange]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<Settings className="h-5 w-5" />
					<span>Retry Configuration</span>
				</CardTitle>
				<CardDescription>
					Configure retry behavior for transient failures
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Basic Settings */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="maxAttempts">Max Attempts</Label>
						<Input
							id="maxAttempts"
							type="number"
							min="1"
							max="10"
							value={config.maxAttempts}
							onChange={(e) => updateConfig({ maxAttempts: parseInt(e.target.value) || 1 })}
							disabled={disabled}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="baseDelay">Base Delay (ms)</Label>
						<Input
							id="baseDelay"
							type="number"
							min="100"
							max="30000"
							value={config.baseDelay}
							onChange={(e) => updateConfig({ baseDelay: parseInt(e.target.value) || 1000 })}
							disabled={disabled}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="maxDelay">Max Delay (ms)</Label>
						<Input
							id="maxDelay"
							type="number"
							min="1000"
							max="300000"
							value={config.maxDelay}
							onChange={(e) => updateConfig({ maxDelay: parseInt(e.target.value) || 10000 })}
							disabled={disabled}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="backoffFactor">Backoff Factor</Label>
						<Input
							id="backoffFactor"
							type="number"
							min="1"
							max="5"
							step="0.1"
							value={config.backoffFactor}
							onChange={(e) => updateConfig({ backoffFactor: parseFloat(e.target.value) || 2 })}
							disabled={disabled}
						/>
					</div>
				</div>

				{/* Backoff Strategy */}
				<div className="space-y-2">
					<Label>Backoff Strategy</Label>
					<Select
						value={config.backoffStrategy}
						onValueChange={(value: any) => updateConfig({ backoffStrategy: value })}
						disabled={disabled}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="exponential">Exponential</SelectItem>
							<SelectItem value="linear">Linear</SelectItem>
							<SelectItem value="fixed">Fixed</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Jitter Settings */}
				<div className="flex items-center space-x-2">
					<Switch
						id="jitter"
						checked={config.jitterEnabled}
						onCheckedChange={(checked) => updateConfig({ jitterEnabled: checked })}
						disabled={disabled}
					/>
					<Label htmlFor="jitter">Enable Jitter</Label>
				</div>

				{config.jitterEnabled && (
					<div className="space-y-2">
						<Label>Jitter Factor: {(config.jitterFactor || 0.1).toFixed(2)}</Label>
						<Slider
							value={[config.jitterFactor || 0.1]}
							onValueChange={([value]) => updateConfig({ jitterFactor: value })}
							max={0.5}
							min={0.05}
							step={0.05}
							disabled={disabled}
						/>
					</div>
				)}

				{/* Circuit Breaker Settings */}
				<div className="flex items-center space-x-2">
					<Switch
						id="circuitBreaker"
						checked={config.circuitBreaker?.enabled || false}
						onCheckedChange={(checked) => updateConfig({
							circuitBreaker: {
								...config.circuitBreaker,
								enabled: checked,
								failureThreshold: config.circuitBreaker?.failureThreshold || 5,
								recoveryTimeout: config.circuitBreaker?.recoveryTimeout || 30000,
								halfOpenMaxCalls: config.circuitBreaker?.halfOpenMaxCalls || 3
							}
						})}
						disabled={disabled}
					/>
					<Label htmlFor="circuitBreaker">Enable Circuit Breaker</Label>
				</div>

				{config.circuitBreaker?.enabled && (
					<div className="ml-4 space-y-4 p-4 bg-gray-50 rounded">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="failureThreshold">Failure Threshold</Label>
								<Input
									id="failureThreshold"
									type="number"
									min="1"
									max="20"
									value={config.circuitBreaker.failureThreshold}
									onChange={(e) => updateConfig({
										circuitBreaker: {
											...config.circuitBreaker,
											failureThreshold: parseInt(e.target.value) || 5
										}
									})}
									disabled={disabled}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="recoveryTimeout">Recovery Timeout (ms)</Label>
								<Input
									id="recoveryTimeout"
									type="number"
									min="5000"
									max="300000"
									value={config.circuitBreaker.recoveryTimeout}
									onChange={(e) => updateConfig({
										circuitBreaker: {
											...config.circuitBreaker,
											recoveryTimeout: parseInt(e.target.value) || 30000
										}
									})}
									disabled={disabled}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Presets */}
				{(toolCategory || operationType) && (
					<div className="space-y-2">
						<Label>Recommended Presets</Label>
						<div className="flex flex-wrap gap-2">
							{toolCategory && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => applyPreset(toolCategory)}
									disabled={disabled}
								>
									Apply {toolCategory} Preset
								</Button>
							)}
							{operationType && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const presetConfig = ToolRetryStrategies.getStrategyByOperationType(operationType);
										onConfigChange(presetConfig);
									}}
									disabled={disabled}
								>
									Apply {operationType} Preset
								</Button>
							)}
						</div>
					</div>
				)}

				{/* Advanced Toggle */}
				<Button
					variant="ghost"
					onClick={() => setShowAdvanced(!showAdvanced)}
					className="w-full"
				>
					{showAdvanced ? 'Hide' : 'Show'} Advanced Settings
				</Button>
			</CardContent>
		</Card>
	);
};

// ============================================================================
// Retry Analytics Dashboard Component
// ============================================================================

export interface RetryAnalyticsDashboardProps {
	refreshInterval?: number;
	showTrends?: boolean;
}

export const RetryAnalyticsDashboard: React.FC<RetryAnalyticsDashboardProps> = ({
	refreshInterval = 30000,
	showTrends = false
}) => {
	const [analytics, setAnalytics] = useState(() => retryAnalytics.getRetryAnalytics());
	const [autoRefresh, setAutoRefresh] = useState(true);

	useEffect(() => {
		if (!autoRefresh) return;

		const interval = setInterval(() => {
			setAnalytics(retryAnalytics.getRetryAnalytics());
		}, refreshInterval);

		return () => clearInterval(interval);
	}, [autoRefresh, refreshInterval]);

	const { global, health, recommendations } = analytics;

	return (
		<div className="space-y-6">
			{/* Health Status */}
			<Alert>
				<Shield className="h-4 w-4" />
				<AlertTitle>System Health</AlertTitle>
				<AlertDescription>
					<div className="flex items-center justify-between">
						<span className={`font-medium ${
							health.status === 'healthy'
								? 'text-green-600'
								: health.status === 'degraded'
									? 'text-yellow-600'
									: 'text-red-600'
						}`}>
							Status: {health.status.toUpperCase()} (Score: {health.score}/100)
						</span>
						<div className="flex items-center space-x-2">
							<Switch
								checked={autoRefresh}
								onCheckedChange={setAutoRefresh}
							/>
							<span className="text-sm">Auto-refresh</span>
						</div>
					</div>
				</AlertDescription>
			</Alert>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Activity className="h-4 w-4 text-blue-500" />
							<div>
								<p className="text-2xl font-bold">{global.totalOperations}</p>
								<p className="text-xs text-gray-500">Total Operations</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<CheckCircle className="h-4 w-4 text-green-500" />
							<div>
								<p className="text-2xl font-bold">{(global.successRate * 100).toFixed(1)}%</p>
								<p className="text-xs text-gray-500">Success Rate</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<RefreshCw className="h-4 w-4 text-orange-500" />
							<div>
								<p className="text-2xl font-bold">{global.totalRetries}</p>
								<p className="text-xs text-gray-500">Total Retries</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Zap className="h-4 w-4 text-purple-500" />
							<div>
								<p className="text-2xl font-bold">{global.averageAttempts.toFixed(1)}</p>
								<p className="text-xs text-gray-500">Avg Attempts</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recommendations */}
			{recommendations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Recommendations</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{recommendations.map((rec, index) => (
								<li key={index} className="flex items-start space-x-2">
									<AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
									<span className="text-sm">{rec}</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

// ============================================================================
// Manual Retry Dialog Component
// ============================================================================

export interface ManualRetryDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onRetry: () => Promise<void>;
	isRetrying: boolean;
	title?: string;
	description?: string;
}

export const ManualRetryDialog: React.FC<ManualRetryDialogProps> = ({
	isOpen,
	onClose,
	onRetry,
	isRetrying,
	title = 'Retry Operation',
	description = 'Would you like to retry this operation?'
}) => {
	const handleRetry = async () => {
		try {
			await onRetry();
			onClose();
		} catch (error) {
			// Error will be handled by the caller
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={onClose} disabled={isRetrying}>
						Cancel
					</Button>
					<Button onClick={handleRetry} disabled={isRetrying}>
						{isRetrying && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
						{isRetrying ? 'Retrying...' : 'Retry'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// ============================================================================
// Retry Overlay Component (for full-screen retry operations)
// ============================================================================

export interface RetryOverlayProps {
	isActive: boolean;
	message: string;
	progress?: number;
	onCancel?: () => void;
}

export const RetryOverlay: React.FC<RetryOverlayProps> = ({
	isActive,
	message,
	progress,
	onCancel
}) => {
	if (!isActive) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<Card className="w-96">
				<CardContent className="pt-6">
					<div className="flex flex-col items-center space-y-4">
						<RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
						<div className="text-center">
							<p className="text-lg font-medium">{message}</p>
							{progress !== undefined && (
								<div className="mt-2 w-full">
									<Progress value={progress} className="h-2" />
									<p className="text-sm text-gray-500 mt-1">{progress.toFixed(0)}%</p>
								</div>
							)}
						</div>
						{onCancel && (
							<Button variant="outline" onClick={onCancel}>
								Cancel
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

// ============================================================================
// Higher-order Component for Retry Operations
// ============================================================================

export interface WithRetryOptions {
	config?: AdvancedRetryConfig;
	showProgress?: boolean;
	showManualRetry?: boolean;
	fallbackMessage?: string;
}

export function withRetry<T extends Record<string, any>>(
	Component: React.ComponentType<T>,
	options: WithRetryOptions = {}
): React.FC<T & { operation: () => Promise<any> }> {
	return ({ operation, ...props }) => {
		const [retryResult, setRetryResult] = useState<RetryResult | undefined>();
		const [isRetrying, setIsRetrying] = useState(false);
		const [showManualRetry, setShowManualRetry] = useState(false);

		const executeWithRetry = async () => {
			setIsRetrying(true);
			setRetryResult(undefined);

			try {
				const config = options.config || ToolRetryStrategies.getUtilityStrategy();
				const result = await retryEngine.executeWithRetry(operation, config);
				setRetryResult(result);

				if (!result.success && options.showManualRetry !== false) {
					setShowManualRetry(true);
				}
			} catch (error) {
				console.error('Retry operation failed:', error);
			} finally {
				setIsRetrying(false);
			}
		};

		return (
			<>
				{options.showProgress && retryResult && (
					<RetryProgress
						retryResult={retryResult}
						isActive={isRetrying}
						showDetails={true}
					/>
				)}

				<Component
					{...(props as T)}
					executeWithRetry={executeWithRetry}
					isRetrying={isRetrying}
					retryResult={retryResult}
				/>

				{showManualRetry && (
					<ManualRetryDialog
						isOpen={showManualRetry}
						onClose={() => setShowManualRetry(false)}
						onRetry={executeWithRetry}
						isRetrying={isRetrying}
					/>
				)}
			</>
		);
	};
}

export default RetryProgress;
