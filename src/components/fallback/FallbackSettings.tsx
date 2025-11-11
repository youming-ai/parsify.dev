/**
 * Fallback Settings and Preferences Component
 * Comprehensive user controls for fallback preferences and settings
 */

import React, { useState, useEffect } from 'react';
import {
	Settings,
	Save,
	Download,
	Upload,
	RotateCcw,
	Info,
	Shield,
	Activity,
	Zap,
	AlertTriangle,
	CheckCircle,
	X,
	Eye,
	EyeOff,
	HelpCircle,
	BarChart3,
	Sliders,
	Users,
	Bell,
	Database,
	Clock,
	Target,
	Filter,
	ToggleLeft,
	ToggleRight
} from 'lucide-react';
import {
	FallbackUserPreferences,
	FallbackQuality,
	fallbackProcessor,
	FallbackStrategyRegistry,
	fallbackAnalyticsEngine
} from '../../monitoring/fallback-processing-system';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../ui/use-toast';

interface FallbackSettingsProps {
	sessionId?: string;
	onPreferencesChange?: (preferences: FallbackUserPreferences) => void;
	className?: string;
	showAnalytics?: boolean;
}

export const FallbackSettings: React.FC<FallbackSettingsProps> = ({
	sessionId = 'default',
	onPreferencesChange,
	className = '',
	showAnalytics = true,
}) => {
	const { toast } = useToast();
	const [preferences, setPreferences] = useState<FallbackUserPreferences>({
		enableFallbacks: true,
		qualityThreshold: 'medium',
		allowDataLoss: false,
		preferredStrategies: [],
		notifyOnFallback: true,
		autoRetryPrimary: true,
		analyticsOptOut: false,
	});

	const [isLoading, setIsLoading] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [previewMode, setPreviewMode] = useState(false);
	const [availableStrategies, setAvailableStrategies] = useState<any[]>([]);

	const registry = FallbackStrategyRegistry.getInstance();

	useEffect(() => {
		loadPreferences();
		loadAvailableStrategies();
	}, [sessionId]);

	const loadPreferences = async () => {
		try {
			// Load preferences from storage or API
			const saved = localStorage.getItem(`fallback_preferences_${sessionId}`);
			if (saved) {
				const savedPrefs = JSON.parse(saved);
				setPreferences(savedPrefs);
			}
		} catch (error) {
			console.error('Failed to load preferences:', error);
			toast({
				title: "Error",
				description: "Failed to load fallback preferences",
				variant: "destructive",
			});
		}
	};

	const loadAvailableStrategies = () => {
		const strategies = registry.getAllStrategies().map(strategy => ({
			id: strategy.id,
			name: strategy.name,
			description: strategy.description,
			qualityLevel: strategy.qualityLevel,
			priority: strategy.priority,
			compatibility: strategy.compatibility,
			isAvailable: strategy.isAvailable(),
		}));
		setAvailableStrategies(strategies);
	};

	const savePreferences = async () => {
		setIsLoading(true);
		try {
			// Save to localStorage (in production, this would be saved to backend)
			localStorage.setItem(`fallback_preferences_${sessionId}`, JSON.stringify(preferences));

			// Update analytics opt-out if changed
			if (preferences.analyticsOptOut) {
				fallbackAnalyticsEngine.updateConfig({
					enableRealTimeMonitoring: false,
				});
			} else {
				fallbackAnalyticsEngine.updateConfig({
					enableRealTimeMonitoring: true,
				});
			}

			setHasChanges(false);
			onPreferencesChange?.(preferences);

			toast({
				title: "Success",
				description: "Fallback preferences saved successfully",
			});
		} catch (error) {
			console.error('Failed to save preferences:', error);
			toast({
				title: "Error",
				description: "Failed to save fallback preferences",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const resetPreferences = () => {
		setPreferences({
			enableFallbacks: true,
			qualityThreshold: 'medium',
			allowDataLoss: false,
			preferredStrategies: [],
			notifyOnFallback: true,
			autoRetryPrimary: true,
			analyticsOptOut: false,
		});
		setHasChanges(true);
	};

	const exportPreferences = () => {
		const dataStr = JSON.stringify(preferences, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `fallback_preferences_${sessionId}_${Date.now()}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const importPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const imported = JSON.parse(e.target?.result as string);
					setPreferences(imported);
					setHasChanges(true);
					toast({
						title: "Success",
						description: "Preferences imported successfully",
					});
				} catch (error) {
					toast({
						title: "Error",
						description: "Failed to import preferences file",
						variant: "destructive",
					});
				}
			};
			reader.readAsText(file);
		}
	};

	const updatePreference = <K extends keyof FallbackUserPreferences>(
		key: K,
		value: FallbackUserPreferences[K]
	) => {
		setPreferences(prev => ({ ...prev, [key]: value }));
		setHasChanges(true);
	};

	const toggleStrategy = (strategyId: string) => {
		setPreferences(prev => ({
			...prev,
			preferredStrategies: prev.preferredStrategies.includes(strategyId)
				? prev.preferredStrategies.filter(id => id !== strategyId)
				: [...prev.preferredStrategies, strategyId],
		}));
		setHasChanges(true);
	};

	const getQualityColor = (quality: FallbackQuality): string => {
		switch (quality) {
			case 'full': return 'text-green-600 bg-green-50';
			case 'high': return 'text-blue-600 bg-blue-50';
			case 'medium': return 'text-yellow-600 bg-yellow-50';
			case 'low': return 'text-orange-600 bg-orange-50';
			case 'minimal': return 'text-red-600 bg-red-50';
			default: return 'text-gray-600 bg-gray-50';
		}
	};

	const getQualityIcon = (quality: FallbackQuality) => {
		switch (quality) {
			case 'full': return <CheckCircle className="w-4 h-4" />;
			case 'high': return <Shield className="w-4 h-4" />;
			case 'medium': return <Activity className="w-4 h-4" />;
			case 'low': return <AlertTriangle className="w-4 h-4" />;
			case 'minimal': return <X className="w-4 h-4" />;
			default: return <Info className="w-4 h-4" />;
		}
	};

	return (
		<TooltipProvider>
			<div className={`space-y-6 ${className}`}>
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Settings className="w-6 h-6" />
						<h2 className="text-2xl font-bold">Fallback Settings</h2>
						{hasChanges && (
							<Badge variant="secondary">Unsaved Changes</Badge>
						)}
					</div>
					<div className="flex items-center space-x-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPreviewMode(!previewMode)}
								>
									{previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{previewMode ? 'Hide' : 'Show'} Preview Mode</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									onClick={exportPreferences}
								>
									<Download className="w-4 h-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Export Preferences</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									onClick={() => document.getElementById('import-preferences')?.click()}
								>
									<Upload className="w-4 h-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Import Preferences</p>
							</TooltipContent>
						</Tooltip>
						<input
							id="import-preferences"
							type="file"
							accept=".json"
							style={{ display: 'none' }}
							onChange={importPreferences}
						/>
						<Button
							variant="outline"
							size="sm"
							onClick={resetPreferences}
						>
							<RotateCcw className="w-4 h-4" />
						</Button>
						<Button
							onClick={savePreferences}
							disabled={!hasChanges || isLoading}
						>
							<Save className="w-4 h-4 mr-2" />
							{isLoading ? 'Saving...' : 'Save'}
						</Button>
					</div>
				</div>

				{/* Main Settings */}
				<Tabs defaultValue="general" className="w-full">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="general" className="flex items-center space-x-2">
							<Sliders className="w-4 h-4" />
							<span>General</span>
						</TabsTrigger>
						<TabsTrigger value="strategies" className="flex items-center space-x-2">
							<Zap className="w-4 h-4" />
							<span>Strategies</span>
						</TabsTrigger>
						<TabsTrigger value="notifications" className="flex items-center space-x-2">
							<Bell className="w-4 h-4" />
							<span>Notifications</span>
						</TabsTrigger>
						<TabsTrigger value="analytics" className="flex items-center space-x-2">
							<BarChart3 className="w-4 h-4" />
							<span>Analytics</span>
						</TabsTrigger>
					</TabsList>

					{/* General Settings */}
					<TabsContent value="general" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Settings className="w-5 h-5" />
									<span>General Settings</span>
								</CardTitle>
								<CardDescription>
									Basic fallback processing configuration
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label className="text-base font-medium">Enable Fallback Processing</Label>
										<p className="text-sm text-gray-600">
											Allow fallback strategies when primary processing fails
										</p>
									</div>
									<Switch
										checked={preferences.enableFallbacks}
										onCheckedChange={(checked) => updatePreference('enableFallbacks', checked)}
									/>
								</div>

								<Separator />

								<div className="space-y-3">
									<Label className="text-base font-medium">Quality Threshold</Label>
									<Select
										value={preferences.qualityThreshold}
										onValueChange={(value: FallbackQuality) => updatePreference('qualityThreshold', value)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="full">
												<div className="flex items-center space-x-2">
													{getQualityIcon('full')}
													<span>Full Quality</span>
													<Badge variant="outline" className={getQualityColor('full')}>
														Only best results
													</Badge>
												</div>
											</SelectItem>
											<SelectItem value="high">
												<div className="flex items-center space-x-2">
													{getQualityIcon('high')}
													<span>High Quality</span>
													<Badge variant="outline" className={getQualityColor('high')}>
														Good results
													</Badge>
												</div>
											</SelectItem>
											<SelectItem value="medium">
												<div className="flex items-center space-x-2">
													{getQualityIcon('medium')}
													<span>Medium Quality</span>
													<Badge variant="outline" className={getQualityColor('medium')}>
														Balanced approach
													</Badge>
												</div>
											</SelectItem>
											<SelectItem value="low">
												<div className="flex items-center space-x-2">
													{getQualityIcon('low')}
													<span>Low Quality</span>
													<Badge variant="outline" className={getQualityColor('low')}>
													Basic functionality
													</Badge>
												</div>
											</SelectItem>
											<SelectItem value="minimal">
												<div className="flex items-center space-x-2">
													{getQualityIcon('minimal')}
													<span>Minimal Quality</span>
													<Badge variant="outline" className={getQualityColor('minimal')}>
														Any result
													</Badge>
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-sm text-gray-600">
										Minimum quality level for fallback processing
									</p>
								</div>

								<Separator />

								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label className="text-base font-medium">Allow Data Loss</Label>
											<p className="text-sm text-gray-600">
												Permit fallbacks that may result in data loss
											</p>
										</div>
										<Switch
											checked={preferences.allowDataLoss}
											onCheckedChange={(checked) => updatePreference('allowDataLoss', checked)}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label className="text-base font-medium">Auto-Retry Primary</Label>
											<p className="text-sm text-gray-600">
												Automatically retry the primary tool after fallback
											</p>
										</div>
										<Switch
											checked={preferences.autoRetryPrimary}
											onCheckedChange={(checked) => updatePreference('autoRetryPrimary', checked)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						{previewMode && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center space-x-2">
										<Eye className="w-5 h-5" />
										<span>Settings Preview</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
										{JSON.stringify(preferences, null, 2)}
									</pre>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					{/* Strategy Settings */}
					<TabsContent value="strategies" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Zap className="w-5 h-5" />
									<span>Preferred Strategies</span>
								</CardTitle>
								<CardDescription>
									Select which fallback strategies you prefer to use
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-96">
									<div className="space-y-4">
										{availableStrategies.map((strategy) => (
											<div
												key={strategy.id}
												className={`p-4 border rounded-lg space-y-3 ${
													preferences.preferredStrategies.includes(strategy.id)
														? 'border-blue-200 bg-blue-50'
														: 'border-gray-200'
												}`}
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-3">
														<Switch
															checked={preferences.preferredStrategies.includes(strategy.id)}
															onCheckedChange={() => toggleStrategy(strategy.id)}
														/>
														<div>
															<h4 className="font-medium">{strategy.name}</h4>
															<p className="text-sm text-gray-600">{strategy.description}</p>
														</div>
													</div>
													<div className="flex items-center space-x-2">
														<Badge variant="outline" className={getQualityColor(strategy.qualityLevel)}>
															{strategy.qualityLevel}
														</Badge>
														<Badge variant="secondary">
															Priority: {strategy.priority}
														</Badge>
														{!strategy.isAvailable && (
															<Badge variant="destructive">Unavailable</Badge>
														)}
													</div>
												</div>
												<div className="text-xs text-gray-500">
													<span className="font-medium">Compatible with:</span> {strategy.compatibility.join(', ')}
												</div>
											</div>
										))}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Notifications Settings */}
					<TabsContent value="notifications" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Bell className="w-5 h-5" />
									<span>Notification Preferences</span>
								</CardTitle>
								<CardDescription>
									Configure how and when you're notified about fallback processing
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label className="text-base font-medium">Notify on Fallback</Label>
										<p className="text-sm text-gray-600">
											Show notifications when fallback processing is used
										</p>
									</div>
									<Switch
										checked={preferences.notifyOnFallback}
										onCheckedChange={(checked) => updatePreference('notifyOnFallback', checked)}
									/>
								</div>

								<Separator />

								<div className="space-y-3">
									<Label className="text-base font-medium">Notification Types</Label>
									<div className="space-y-2">
										{[
											{ id: 'quality_low', label: 'Low Quality Fallbacks', description: 'When quality drops below threshold' },
											{ id: 'data_loss', label: 'Data Loss Detected', description: 'When data loss occurs during fallback' },
											{ id: 'strategy_failed', label: 'Strategy Failures', description: 'When all strategies fail' },
											{ id: 'auto_retry', label: 'Auto-Retry Events', description: 'When automatic retries occur' },
										].map((type) => (
											<div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
												<div>
													<h4 className="font-medium">{type.label}</h4>
													<p className="text-sm text-gray-600">{type.description}</p>
												</div>
												<Switch defaultChecked={type.id !== 'auto_retry'} />
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Analytics Settings */}
					<TabsContent value="analytics" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<BarChart3 className="w-5 h-5" />
									<span>Analytics & Privacy</span>
								</CardTitle>
								<CardDescription>
									Control data collection and analytics for fallback processing
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label className="text-base font-medium">Analytics Opt-Out</Label>
										<p className="text-sm text-gray-600">
											Don't share fallback usage analytics for improvement
										</p>
									</div>
									<Switch
										checked={preferences.analyticsOptOut}
										onCheckedChange={(checked) => updatePreference('analyticsOptOut', checked)}
									/>
								</div>

								{showAnalytics && !preferences.analyticsOptOut && (
									<>
										<Separator />
										<div className="space-y-4">
											<h4 className="font-medium">Usage Statistics</h4>
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label className="text-sm">Total Fallbacks</Label>
													<div className="text-2xl font-bold">0</div>
												</div>
												<div className="space-y-2">
													<Label className="text-sm">Success Rate</Label>
													<div className="text-2xl font-bold">0%</div>
												</div>
												<div className="space-y-2">
													<Label className="text-sm">Average Quality</Label>
													<div className="text-2xl font-bold">0</div>
												</div>
												<div className="space-y-2">
													<Label className="text-sm">User Satisfaction</Label>
													<div className="text-2xl font-bold">0</div>
												</div>
											</div>
										</div>
									</>
								)}

								<Separator />

								<div className="space-y-3">
									<Label className="text-base font-medium">Data Retention</Label>
									<Select defaultValue="30">
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="7">7 days</SelectItem>
											<SelectItem value="30">30 days</SelectItem>
											<SelectItem value="90">90 days</SelectItem>
											<SelectItem value="365">1 year</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-sm text-gray-600">
										How long to retain fallback analytics data
									</p>
								</div>
							</CardContent>
						</Card>

						{showAnalytics && !preferences.analyticsOptOut && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center space-x-2">
										<Target className="w-5 h-5" />
										<span>Performance Targets</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{[
										{ label: 'Processing Time', current: '1.2s', target: '2.0s', unit: 'seconds' },
										{ label: 'Success Rate', current: '94%', target: '90%', unit: '%' },
										{ label: 'User Satisfaction', current: '4.2', target: '4.0', unit: 'stars' },
									].map((metric) => (
										<div key={metric.label} className="space-y-2">
											<div className="flex justify-between">
												<Label>{metric.label}</Label>
												<span className="text-sm text-gray-600">
													{metric.current} / {metric.target} {metric.unit}
												</span>
											</div>
											<Progress value={85} className="h-2" />
										</div>
									))}
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>

				{/* Info Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<HelpCircle className="w-5 h-5" />
							<span>About Fallback Processing</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h4 className="font-medium text-blue-800 mb-2">How It Works</h4>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• When a tool fails, fallback strategies automatically activate</li>
								<li>• Strategies are ranked by priority and quality level</li>
								<li>• Only strategies meeting your quality requirements are used</li>
								<li>• You can customize which strategies to prefer for each tool</li>
								<li>• All fallback usage is monitored for quality and reliability</li>
							</ul>
						</div>

						<Separator />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<h4 className="font-medium text-green-800 flex items-center">
									<CheckCircle className="w-4 h-4 mr-2" />
									Benefits
								</h4>
								<ul className="text-sm text-green-700 space-y-1">
									<li>• Improved reliability</li>
									<li>• Better user experience</li>
									<li>• Reduced frustration</li>
									<li>• Continuous operation</li>
								</ul>
							</div>
							<div className="space-y-2">
								<h4 className="font-medium text-orange-800 flex items-center">
									<AlertTriangle className="w-4 h-4 mr-2" />
									Considerations
								</h4>
								<ul className="text-sm text-orange-700 space-y-1">
									<li>• Potential data loss</li>
									<li>• Lower quality results</li>
									<li>• Increased processing time</li>
									<li>• Feature limitations</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</TooltipProvider>
	);
};

// Advanced Settings Dialog Component
interface FallbackAdvancedSettingsProps {
	preferences: FallbackUserPreferences;
	onChange: (preferences: FallbackUserPreferences) => void;
}

export const FallbackAdvancedSettings: React.FC<FallbackAdvancedSettingsProps> = ({
	preferences,
	onChange,
}) => {
	const [localPreferences, setLocalPreferences] = useState(preferences);
	const [customRules, setCustomRules] = useState<Array<{
		id: string;
		condition: string;
		action: string;
		enabled: boolean;
	}>>([]);

	const handleSave = () => {
		onChange(localPreferences);
	};

	const addCustomRule = () => {
		setCustomRules([
			...customRules,
			{
				id: Date.now().toString(),
				condition: '',
				action: '',
				enabled: true,
			},
		]);
	};

	const removeCustomRule = (id: string) => {
		setCustomRules(customRules.filter(rule => rule.id !== id));
	};

	return (
		<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>Advanced Fallback Settings</DialogTitle>
				<DialogDescription>
					Advanced configuration for fallback processing behavior
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-6">
				{/* Performance Settings */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Performance Settings</h3>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Max Processing Time (ms)</Label>
							<Input
								type="number"
								defaultValue="10000"
								onChange={(e) => setLocalPreferences(prev => ({
									...prev,
									maxProcessingTime: parseInt(e.target.value),
								}))}
							/>
						</div>
						<div className="space-y-2">
							<Label>Max Memory Usage (MB)</Label>
							<Input
								type="number"
								defaultValue="100"
								onChange={(e) => setLocalPreferences(prev => ({
									...prev,
									maxMemoryUsage: parseInt(e.target.value),
								}))}
							/>
						</div>
					</div>
				</div>

				{/* Custom Rules */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Custom Rules</h3>
						<Button onClick={addCustomRule} variant="outline" size="sm">
							Add Rule
						</Button>
					</div>
					<div className="space-y-2">
						{customRules.map((rule) => (
							<div key={rule.id} className="flex items-center space-x-2 p-3 border rounded-lg">
								<Switch
									checked={rule.enabled}
									onChange={(checked) => {
										setCustomRules(customRules.map(r =>
											r.id === rule.id ? { ...r, enabled: checked } : r
										));
									}}
								/>
								<Input
									placeholder="Condition"
									value={rule.condition}
									onChange={(e) => {
										setCustomRules(customRules.map(r =>
											r.id === rule.id ? { ...r, condition: e.target.value } : r
										));
									}}
								/>
								<Input
									placeholder="Action"
									value={rule.action}
									onChange={(e) => {
										setCustomRules(customRules.map(r =>
											r.id === rule.id ? { ...r, action: e.target.value } : r
										));
									}}
								/>
								<Button
									onClick={() => removeCustomRule(rule.id)}
									variant="outline"
									size="sm"
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
						))}
					</div>
				</div>

				{/* Debug Settings */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Debug Settings</h3>
					<div className="space-y-2">
						{[
							{ id: 'enable_logging', label: 'Enable Detailed Logging' },
							{ id: 'show_debug_info', label: 'Show Debug Information' },
							{ id: 'enable_performance_profiling', label: 'Enable Performance Profiling' },
						].map((setting) => (
							<div key={setting.id} className="flex items-center justify-between">
								<Label>{setting.label}</Label>
								<Switch />
							</div>
						))}
					</div>
				</div>

				<div className="flex justify-end space-x-2">
					<Button variant="outline">Cancel</Button>
					<Button onClick={handleSave}>Save Changes</Button>
				</div>
			</div>
		</DialogContent>
	);
};

export default FallbackSettings;
