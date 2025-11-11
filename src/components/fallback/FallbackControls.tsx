/**
 * Fallback Controls Component
 * User controls for fallback preferences and settings
 */

import React, { useState, useEffect } from 'react';
import {
	Settings,
	Shield,
	Zap,
	Activity,
	AlertTriangle,
	Save,
	RotateCcw,
	Info,
	ChevronDown,
	ChevronUp,
	HelpCircle
} from 'lucide-react';
import {
	FallbackUserPreferences,
	FallbackQuality,
	fallbackProcessor,
	FallbackStrategyRegistry
} from '../../monitoring/fallback-processing-system';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";
import { Separator } from '../ui/separator';

interface FallbackControlsProps {
	onPreferencesChange?: (preferences: FallbackUserPreferences) => void;
	sessionId?: string;
	className?: string;
	showAdvanced?: boolean;
}

export const FallbackControls: React.FC<FallbackControlsProps> = ({
	onPreferencesChange,
	sessionId = 'default',
	className = '',
	showAdvanced = false,
}) => {
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
	const [showAdvancedSection, setShowAdvancedSection] = useState(showAdvanced);

	const registry = FallbackStrategyRegistry.getInstance();

	useEffect(() => {
		loadPreferences();
	}, [sessionId]);

	const loadPreferences = async () => {
		try {
			const currentPrefs = await fallbackProcessor.getFallbackAnalytics(); // This should be updated to use preferences manager
			setPreferences(currentPrefs as FallbackUserPreferences);
		} catch (error) {
			console.warn('Failed to load fallback preferences:', error);
		}
	};

	const savePreferences = async () => {
		setIsLoading(true);
		try {
			// Save preferences (this should be implemented in the preferences manager)
			await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save

			setHasChanges(false);
			onPreferencesChange?.(preferences);
		} catch (error) {
			console.error('Failed to save preferences:', error);
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

	const updatePreference = <K extends keyof FallbackUserPreferences>(
		key: K,
		value: FallbackUserPreferences[K]
	) => {
		setPreferences(prev => ({ ...prev, [key]: value }));
		setHasChanges(true);
	};

	const getQualityDescription = (quality: FallbackQuality): string => {
		switch (quality) {
			case 'full': return 'Require full-quality fallbacks only';
			case 'high': return 'Accept high-quality or better';
			case 'medium': return 'Accept medium-quality or better (recommended)';
			case 'low': return 'Accept low-quality or better';
			case 'minimal': return 'Accept any fallback, even minimal quality';
			default: return '';
		}
	};

	const getAvailableStrategies = () => {
		return registry.getAllStrategies().map(strategy => ({
			id: strategy.id,
			name: strategy.name,
			description: strategy.description,
			quality: strategy.qualityLevel,
			priority: strategy.priority,
		}));
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Settings className="w-5 h-5" />
						<span>Fallback Processing Settings</span>
						{hasChanges && (
							<Badge variant="secondary" className="text-xs">
								Unsaved Changes
							</Badge>
						)}
					</CardTitle>
					<CardDescription>
						Configure how fallback processing behaves when primary tools fail
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Basic Settings */}
					<div className="space-y-4">
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

						<div className="space-y-2">
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
											<CheckCircle className="w-4 h-4 text-green-600" />
											<span>Full Quality</span>
										</div>
									</SelectItem>
									<SelectItem value="high">
										<div className="flex items-center space-x-2">
											<Shield className="w-4 h-4 text-blue-600" />
											<span>High Quality</span>
										</div>
									</SelectItem>
									<SelectItem value="medium">
										<div className="flex items-center space-x-2">
											<Activity className="w-4 h-4 text-yellow-600" />
											<span>Medium Quality</span>
										</div>
									</SelectItem>
									<SelectItem value="low">
										<div className="flex items-center space-x-2">
											<Info className="w-4 h-4 text-orange-600" />
											<span>Low Quality</span>
										</div>
									</SelectItem>
									<SelectItem value="minimal">
										<div className="flex items-center space-x-2">
											<AlertTriangle className="w-4 h-4 text-red-600" />
											<span>Minimal Quality</span>
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-sm text-gray-600">
								{getQualityDescription(preferences.qualityThreshold)}
							</p>
						</div>

						<Separator />

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label className="text-base font-medium">Allow Data Loss</Label>
									<p className="text-sm text-gray-600">
										Permit fallbacks that may result in some data loss
									</p>
								</div>
								<Switch
									checked={preferences.allowDataLoss}
									onCheckedChange={(checked) => updatePreference('allowDataLoss', checked)}
								/>
							</div>

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

							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label className="text-base font-medium">Auto-Retry Primary</Label>
									<p className="text-sm text-gray-600">
										Automatically retry the primary tool after a fallback
									</p>
								</div>
								<Switch
									checked={preferences.autoRetryPrimary}
									onCheckedChange={(checked) => updatePreference('autoRetryPrimary', checked)}
								/>
							</div>
						</div>
					</div>

					{/* Advanced Settings */}
					{showAdvancedSection && (
						<>
							<Separator />
							<Accordion type="single" collapsible defaultValue="strategies">
								<AccordionItem value="strategies">
									<AccordionTrigger className="text-base font-medium">
										Preferred Strategies
									</AccordionTrigger>
									<AccordionContent className="space-y-3">
										<p className="text-sm text-gray-600">
											Select specific fallback strategies you prefer to use
										</p>
										<div className="space-y-2 max-h-60 overflow-y-auto">
											{getAvailableStrategies().map((strategy) => (
												<div key={strategy.id} className="flex items-center space-x-3 p-3 border rounded-lg">
													<Switch
														checked={preferences.preferredStrategies.includes(strategy.id)}
														onCheckedChange={(checked) => {
															const updated = checked
																? [...preferences.preferredStrategies, strategy.id]
																: preferences.preferredStrategies.filter(id => id !== strategy.id);
															updatePreference('preferredStrategies', updated);
														}}
													/>
													<div className="flex-1">
														<div className="flex items-center space-x-2">
															<span className="font-medium">{strategy.name}</span>
															<Badge variant="outline" className="text-xs">
																{strategy.quality}
															</Badge>
															<Badge variant="secondary" className="text-xs">
																Priority: {strategy.priority}
															</Badge>
														</div>
														<p className="text-sm text-gray-600">{strategy.description}</p>
													</div>
												</div>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>

								<AccordionItem value="analytics">
									<AccordionTrigger className="text-base font-medium">
										Analytics & Privacy
									</AccordionTrigger>
									<AccordionContent className="space-y-4">
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
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</>
					)}

					{/* Action Buttons */}
					<div className="flex items-center justify-between pt-4">
						<div className="flex space-x-2">
							<Button
								variant="outline"
								onClick={resetPreferences}
								disabled={isLoading}
							>
								<RotateCcw className="w-4 h-4 mr-2" />
								Reset to Default
							</Button>
							<Button
								variant="ghost"
								onClick={() => setShowAdvancedSection(!showAdvancedSection)}
							>
								{showAdvancedSection ? (
									<ChevronUp className="w-4 h-4 mr-2" />
								) : (
									<ChevronDown className="w-4 h-4 mr-2" />
								)}
								{showAdvancedSection ? 'Hide' : 'Show'} Advanced
							</Button>
						</div>

						<Button
							onClick={savePreferences}
							disabled={!hasChanges || isLoading}
						>
							<Save className="w-4 h-4 mr-2" />
							{isLoading ? 'Saving...' : 'Save Preferences'}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Information Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Info className="w-5 h-5" />
						<span>About Fallback Processing</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<h4 className="font-medium text-green-800 flex items-center">
								<CheckCircle className="w-4 h-4 mr-2" />
								Full Quality
							</h4>
							<p className="text-sm text-gray-600">
								Complete functionality with no limitations
							</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-medium text-blue-800 flex items-center">
								<Shield className="w-4 h-4 mr-2" />
								High Quality
							</h4>
							<p className="text-sm text-gray-600">
								Most features available, minor limitations
							</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-medium text-yellow-800 flex items-center">
								<Activity className="w-4 h-4 mr-2" />
								Medium Quality
							</h4>
							<p className="text-sm text-gray-600">
								Basic functionality with notable limitations
							</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-medium text-orange-800 flex items-center">
								<Info className="w-4 h-4 mr-2" />
								Low Quality
							</h4>
							<p className="text-sm text-gray-600">
								Limited functionality, significant limitations
							</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-medium text-red-800 flex items-center">
								<AlertTriangle className="w-4 h-4 mr-2" />
								Minimal Quality
							</h4>
							<p className="text-sm text-gray-600">
								Basic processing only, severe limitations
							</p>
						</div>
					</div>

					<Separator />

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 className="font-medium text-blue-800 mb-2">How Fallback Processing Works</h4>
						<ul className="text-sm text-blue-700 space-y-1">
							<li>• When a tool fails, the system automatically tries alternative strategies</li>
							<li>• Strategies are ranked by priority and quality level</li>
							<li>• Only strategies meeting your quality threshold are used</li>
							<li>• You can configure which strategies you prefer to use</li>
							<li>• All fallback usage is monitored for quality and reliability</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

interface FallbackQuickSettingsProps {
	className?: string;
	onToggle?: (enabled: boolean) => void;
	onQualityChange?: (quality: FallbackQuality) => void;
	defaultEnabled?: boolean;
	defaultQuality?: FallbackQuality;
}

export const FallbackQuickSettings: React.FC<FallbackQuickSettingsProps> = ({
	className = '',
	onToggle,
	onQualityChange,
	defaultEnabled = true,
	defaultQuality = 'medium',
}) => {
	const [enabled, setEnabled] = useState(defaultEnabled);
	const [quality, setQuality] = useState(defaultQuality);

	const handleToggle = (checked: boolean) => {
		setEnabled(checked);
		onToggle?.(checked);
	};

	const handleQualityChange = (newQuality: FallbackQuality) => {
		setQuality(newQuality);
		onQualityChange?.(newQuality);
	};

	return (
		<TooltipProvider>
			<div className={`flex items-center space-x-3 ${className}`}>
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center space-x-2">
							<Switch
								checked={enabled}
								onCheckedChange={handleToggle}
							/>
							<Label className="text-sm font-medium">Fallback</Label>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>Enable fallback processing when tools fail</p>
					</TooltipContent>
				</Tooltip>

				{enabled && (
					<Select
						value={quality}
						onValueChange={handleQualityChange}
					>
						<Tooltip>
							<TooltipTrigger asChild>
								<SelectTrigger className="w-32 h-8">
									<SelectValue />
								</SelectTrigger>
							</TooltipTrigger>
							<TooltipContent>
								<p>Minimum quality level for fallbacks</p>
							</TooltipContent>
						</Tooltip>
						<SelectContent>
							<SelectItem value="medium">Medium</SelectItem>
							<SelectItem value="high">High</SelectItem>
							<SelectItem value="low">Low</SelectItem>
							<SelectItem value="full">Full</SelectItem>
							<SelectItem value="minimal">Minimal</SelectItem>
						</SelectContent>
					</Select>
				)}
			</div>
		</TooltipProvider>
	);
};
