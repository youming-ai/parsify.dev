/**
 * User Controls for Retry Configuration
 * Provides comprehensive UI components for managing retry settings and preferences
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog';
import {
	Settings,
	Save,
	RotateCcw,
	Download,
	Upload,
	Info,
	AlertTriangle,
	CheckCircle,
	XCircle
} from 'lucide-react';

import {
	AdvancedRetryConfig,
	ToolCategory,
	OperationType,
	ToolRetryStrategies,
	retryEngine,
	retryAnalytics
} from '../retry-mechanisms';

// ============================================================================
// Configuration Storage Types
// ============================================================================

export interface UserRetryPreferences {
	globalSettings: {
		enabled: boolean;
		autoRetry: boolean;
		showProgress: boolean;
		maxDefaultAttempts: number;
		defaultBackoffStrategy: 'exponential' | 'linear' | 'fixed';
	};
	toolSpecificSettings: Record<ToolCategory, Partial<AdvancedRetryConfig>>;
	customProfiles: Record<string, AdvancedRetryConfig>;
	notifications: {
		onRetry: boolean;
		onFailure: boolean;
		onCircuitBreakerTrip: boolean;
	};
}

// ============================================================================
// Retry Configuration Manager
// ============================================================================

export class RetryConfigurationManager {
	private static instance: RetryConfigurationManager;
	private storageKey = 'parsify-retry-preferences';
	private preferences: UserRetryPreferences;

	private constructor() {
		this.preferences = this.loadPreferences();
	}

	public static getInstance(): RetryConfigurationManager {
		if (!RetryConfigurationManager.instance) {
			RetryConfigurationManager.instance = new RetryConfigurationManager();
		}
		return RetryConfigurationManager.instance;
	}

	/**
	 * Get current user preferences
	 */
	public getPreferences(): UserRetryPreferences {
		return { ...this.preferences };
	}

	/**
	 * Update user preferences
	 */
	public updatePreferences(updates: Partial<UserRetryPreferences>): void {
		this.preferences = { ...this.preferences, ...updates };
		this.savePreferences();
	}

	/**
	 * Get retry configuration for a specific tool category
	 */
	public getToolConfiguration(category: ToolCategory): AdvancedRetryConfig {
		// Start with default strategy
		const defaultConfig = ToolRetryStrategies.getStrategyByCategory(category);

		// Apply user customizations if any
		const userConfig = this.preferences.toolSpecificSettings[category];
		if (userConfig) {
			return { ...defaultConfig, ...userConfig };
		}

		// Apply global settings
		return {
			...defaultConfig,
			maxAttempts: this.preferences.globalSettings.maxDefaultAttempts,
			backoffStrategy: this.preferences.globalSettings.defaultBackoffStrategy
		};
	}

	/**
	 * Save custom configuration profile
	 */
	public saveCustomProfile(name: string, config: AdvancedRetryConfig): void {
		this.preferences.customProfiles[name] = config;
		this.savePreferences();
	}

	/**
	 * Load custom configuration profile
	 */
	public loadCustomProfile(name: string): AdvancedRetryConfig | undefined {
		return this.preferences.customProfiles[name];
	}

	/**
	 * Delete custom configuration profile
	 */
	public deleteCustomProfile(name: string): void {
		delete this.preferences.customProfiles[name];
		this.savePreferences();
	}

	/**
	 * Get all custom profiles
	 */
	public getCustomProfiles(): Record<string, AdvancedRetryConfig> {
		return { ...this.preferences.customProfiles };
	}

	/**
	 * Export preferences
	 */
	public exportPreferences(): string {
		return JSON.stringify(this.preferences, null, 2);
	}

	/**
	 * Import preferences
	 */
	public importPreferences(jsonData: string): boolean {
		try {
			const imported = JSON.parse(jsonData) as UserRetryPreferences;
			this.preferences = this.validateAndMergePreferences(imported);
			this.savePreferences();
			return true;
		} catch (error) {
			console.error('Failed to import preferences:', error);
			return false;
		}
	}

	/**
	 * Reset preferences to defaults
	 */
	public resetToDefaults(): void {
		this.preferences = this.getDefaultPreferences();
		this.savePreferences();
	}

	// Private methods

	private getDefaultPreferences(): UserRetryPreferences {
		return {
			globalSettings: {
				enabled: true,
				autoRetry: true,
				showProgress: true,
				maxDefaultAttempts: 3,
				defaultBackoffStrategy: 'exponential'
			},
			toolSpecificSettings: {} as Record<ToolCategory, Partial<AdvancedRetryConfig>>,
			customProfiles: {},
			notifications: {
				onRetry: true,
				onFailure: true,
				onCircuitBreakerTrip: true
			}
		};
	}

	private loadPreferences(): UserRetryPreferences {
		try {
			const stored = localStorage.getItem(this.storageKey);
			if (stored) {
				const parsed = JSON.parse(stored) as UserRetryPreferences;
				return this.validateAndMergePreferences(parsed);
			}
		} catch (error) {
			console.warn('Failed to load retry preferences:', error);
		}
		return this.getDefaultPreferences();
	}

	private savePreferences(): void {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
		} catch (error) {
			console.error('Failed to save retry preferences:', error);
		}
	}

	private validateAndMergePreferences(imported: UserRetryPreferences): UserRetryPreferences {
		const defaults = this.getDefaultPreferences();

		return {
			globalSettings: {
				...defaults.globalSettings,
				...imported.globalSettings
			},
			toolSpecificSettings: {
				...defaults.toolSpecificSettings,
				...imported.toolSpecificSettings
			},
			customProfiles: imported.customProfiles || {},
			notifications: {
				...defaults.notifications,
				...imported.notifications
			}
		};
	}
}

// ============================================================================
// Global Retry Settings Component
// ============================================================================

export interface GlobalRetrySettingsProps {
	onSettingsChange?: (settings: UserRetryPreferences['globalSettings']) => void;
}

export const GlobalRetrySettings: React.FC<GlobalRetrySettingsProps> = ({
	onSettingsChange
}) => {
	const [settings, setSettings] = useState(
		RetryConfigurationManager.getInstance().getPreferences().globalSettings
	);

	const updateSetting = useCallback((updates: Partial<UserRetryPreferences['globalSettings']>) => {
		const newSettings = { ...settings, ...updates };
		setSettings(newSettings);
		RetryConfigurationManager.getInstance().updatePreferences({ globalSettings: newSettings });
		onSettingsChange?.(newSettings);
	}, [settings, onSettingsChange]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<Settings className="h-5 w-5" />
					<span>Global Retry Settings</span>
				</CardTitle>
				<CardDescription>
					Default retry behavior that applies to all tools unless overridden
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Enable/Disable Retry System */}
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Label>Enable Retry System</Label>
						<p className="text-sm text-gray-500">
							Enable automatic retry for transient failures
						</p>
					</div>
					<Switch
						checked={settings.enabled}
						onCheckedChange={(checked) => updateSetting({ enabled: checked })}
					/>
				</div>

				<Separator />

				{/* Auto Retry */}
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Label>Auto Retry</Label>
						<p className="text-sm text-gray-500">
							Automatically retry failed operations
						</p>
					</div>
					<Switch
						checked={settings.autoRetry}
						onCheckedChange={(checked) => updateSetting({ autoRetry: checked })}
						disabled={!settings.enabled}
					/>
				</div>

				{/* Show Progress */}
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Label>Show Progress</Label>
						<p className="text-sm text-gray-500">
							Display retry progress and status
						</p>
					</div>
					<Switch
						checked={settings.showProgress}
						onCheckedChange={(checked) => updateSetting({ showProgress: checked })}
						disabled={!settings.enabled}
					/>
				</div>

				<Separator />

				{/* Max Default Attempts */}
				<div className="space-y-2">
					<Label>Max Default Attempts: {settings.maxDefaultAttempts}</Label>
					<Slider
						value={[settings.maxDefaultAttempts]}
						onValueChange={([value]) => updateSetting({ maxDefaultAttempts: value })}
						min={1}
						max={10}
						step={1}
						disabled={!settings.enabled}
					/>
					<div className="flex justify-between text-xs text-gray-500">
						<span>1</span>
						<span>10</span>
					</div>
				</div>

				{/* Default Backoff Strategy */}
				<div className="space-y-2">
					<Label>Default Backoff Strategy</Label>
					<Select
						value={settings.defaultBackoffStrategy}
						onValueChange={(value: any) => updateSetting({ defaultBackoffStrategy: value })}
						disabled={!settings.enabled}
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
			</CardContent>
		</Card>
	);
};

// ============================================================================
// Tool-Specific Retry Configuration Component
// ============================================================================

export interface ToolRetryConfigurationProps {
	selectedCategory: ToolCategory;
	onConfigChange?: (config: AdvancedRetryConfig) => void;
}

export const ToolRetryConfiguration: React.FC<ToolRetryConfigurationProps> = ({
	selectedCategory,
	onConfigChange
}) => {
	const [config, setConfig] = useState(() =>
		RetryConfigurationManager.getInstance().getToolConfiguration(selectedCategory)
	);

	const [useCustom, setUseCustom] = useState(false);

	const updateConfig = useCallback((updates: Partial<AdvancedRetryConfig>) => {
		const newConfig = { ...config, ...updates };
		setConfig(newConfig);

		if (useCustom) {
			const manager = RetryConfigurationManager.getInstance();
			manager.updatePreferences({
				toolSpecificSettings: {
					...manager.getPreferences().toolSpecificSettings,
					[selectedCategory]: newConfig
				}
			});
		}

		onConfigChange?.(newConfig);
	}, [config, useCustom, selectedCategory, onConfigChange]);

	const toggleCustom = useCallback((enabled: boolean) => {
		setUseCustom(enabled);
		if (!enabled) {
			// Reset to default configuration
			const defaultConfig = ToolRetryStrategies.getStrategyByCategory(selectedCategory);
			setConfig(defaultConfig);
		}
	}, [selectedCategory]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tool-Specific Configuration</CardTitle>
				<CardDescription>
					Customize retry behavior for {selectedCategory} tools
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Use Custom Settings Toggle */}
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Label>Use Custom Settings</Label>
						<p className="text-sm text-gray-500">
							Override default retry configuration for this tool category
						</p>
					</div>
					<Switch
						checked={useCustom}
						onCheckedChange={toggleCustom}
					/>
				</div>

				{useCustom && (
					<>
						<Separator />

						{/* Retry Configuration */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Max Attempts</Label>
								<Input
									type="number"
									min="1"
									max="10"
									value={config.maxAttempts}
									onChange={(e) => updateConfig({ maxAttempts: parseInt(e.target.value) || 1 })}
								/>
							</div>
							<div className="space-y-2">
								<Label>Base Delay (ms)</Label>
								<Input
									type="number"
									min="100"
									max="30000"
									value={config.baseDelay}
									onChange={(e) => updateConfig({ baseDelay: parseInt(e.target.value) || 1000 })}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Max Delay (ms)</Label>
								<Input
									type="number"
									min="1000"
									max="300000"
									value={config.maxDelay}
									onChange={(e) => updateConfig({ maxDelay: parseInt(e.target.value) || 10000 })}
								/>
							</div>
							<div className="space-y-2">
								<Label>Backoff Factor</Label>
								<Input
									type="number"
									min="1"
									max="5"
									step="0.1"
									value={config.backoffFactor}
									onChange={(e) => updateConfig({ backoffFactor: parseFloat(e.target.value) || 2 })}
								/>
							</div>
						</div>

						{/* Backoff Strategy */}
						<div className="space-y-2">
							<Label>Backoff Strategy</Label>
							<Select
								value={config.backoffStrategy}
								onValueChange={(value: any) => updateConfig({ backoffStrategy: value })}
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
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label>Enable Jitter</Label>
								<p className="text-sm text-gray-500">
									Add randomness to retry delays to prevent thundering herd
								</p>
							</div>
							<Switch
								checked={config.jitterEnabled}
								onCheckedChange={(checked) => updateConfig({ jitterEnabled: checked })}
							/>
						</div>

						{config.jitterEnabled && (
							<div className="space-y-2 ml-4">
								<Label>Jitter Factor: {config.jitterFactor?.toFixed(2)}</Label>
								<Slider
									value={[config.jitterFactor || 0.1]}
									onValueChange={([value]) => updateConfig({ jitterFactor: value })}
									max={0.5}
									min={0.05}
									step={0.05}
								/>
							</div>
						)}

						{/* Circuit Breaker Settings */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label>Enable Circuit Breaker</Label>
								<p className="text-sm text-gray-500">
									Prevent cascading failures by temporarily stopping retries
								</p>
							</div>
							<Switch
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
							/>
						</div>

						{config.circuitBreaker?.enabled && (
							<div className="ml-4 space-y-4 p-4 bg-gray-50 rounded">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Failure Threshold</Label>
										<Input
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
										/>
									</div>
									<div className="space-y-2">
										<Label>Recovery Timeout (ms)</Label>
										<Input
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
										/>
									</div>
								</div>
							</div>
						)}
					</>
				)}

				{/* Preset Buttons */}
				<div className="space-y-2">
					<Label>Quick Presets</Label>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								const presetConfig = ToolRetryStrategies.getStrategyByCategory(selectedCategory);
								setConfig(presetConfig);
								setUseCustom(false);
							}}
						>
							<RotateCcw className="h-4 w-4 mr-1" />
							Reset to Default
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

// ============================================================================
// Custom Configuration Profiles Component
// ============================================================================

export const CustomRetryProfiles: React.FC = () => {
	const [profiles, setProfiles] = useState(() =>
		RetryConfigurationManager.getInstance().getCustomProfiles()
	);
	const [newProfileName, setNewProfileName] = useState('');
	const [currentConfig, setCurrentConfig] = useState<AdvancedRetryConfig | undefined>();

	const manager = RetryConfigurationManager.getInstance();

	const saveProfile = useCallback(() => {
		if (!newProfileName.trim() || !currentConfig) return;

		manager.saveCustomProfile(newProfileName, currentConfig);
		setProfiles(manager.getCustomProfiles());
		setNewProfileName('');
		setCurrentConfig(undefined);
	}, [newProfileName, currentConfig, manager]);

	const loadProfile = useCallback((name: string) => {
		const config = manager.loadCustomProfile(name);
		if (config) {
			setCurrentConfig(config);
		}
	}, [manager]);

	const deleteProfile = useCallback((name: string) => {
		manager.deleteCustomProfile(name);
		setProfiles(manager.getCustomProfiles());
	}, [manager]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Custom Retry Profiles</CardTitle>
				<CardDescription>
					Save and load custom retry configurations for reuse
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Create New Profile */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium">Create New Profile</h4>
					<div className="flex gap-2">
						<Input
							placeholder="Profile name"
							value={newProfileName}
							onChange={(e) => setNewProfileName(e.target.value)}
						/>
						<Button
							onClick={saveProfile}
							disabled={!newProfileName.trim() || !currentConfig}
						>
							<Save className="h-4 w-4 mr-1" />
							Save Current
						</Button>
					</div>
				</div>

				<Separator />

				{/* Saved Profiles */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium">Saved Profiles</h4>
					{Object.keys(profiles).length === 0 ? (
						<p className="text-sm text-gray-500">No custom profiles saved yet</p>
					) : (
						<div className="space-y-2">
							{Object.entries(profiles).map(([name, config]) => (
								<div key={name} className="flex items-center justify-between p-3 border rounded">
									<div>
										<p className="font-medium">{name}</p>
										<p className="text-sm text-gray-500">
											{config.maxAttempts} attempts, {config.backoffStrategy} backoff
										</p>
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => loadProfile(name)}
										>
											Load
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => deleteProfile(name)}
										>
											Delete
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

// ============================================================================
// Import/Export Settings Component
// ============================================================================

export const ImportExportSettings: React.FC = () => {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [importData, setImportData] = useState('');
	const [importResult, setImportResult] = useState<{ success: boolean; message: string } | undefined>();

	const manager = RetryConfigurationManager.getInstance();

	const exportSettings = useCallback(() => {
		const data = manager.exportPreferences();
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'parsify-retry-settings.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [manager]);

	const importSettings = useCallback(() => {
		try {
			const success = manager.importPreferences(importData);
			setImportResult({
				success,
				message: success ? 'Settings imported successfully!' : 'Failed to import settings'
			});
		} catch (error) {
			setImportResult({
				success: false,
				message: 'Invalid JSON format'
			});
		}
	}, [importData, manager]);

	const resetToDefaults = useCallback(() => {
		manager.resetToDefaults();
		setImportResult({
			success: true,
			message: 'Settings reset to defaults'
		});
	}, [manager]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Import/Export Settings</CardTitle>
				<CardDescription>
					Backup, restore, or share your retry configuration
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					{/* Export */}
					<Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="outline">
								<Download className="h-4 w-4 mr-2" />
								Export Settings
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Export Retry Settings</DialogTitle>
								<DialogDescription>
									Download your retry configuration as a JSON file
								</DialogDescription>
							</DialogHeader>
							<div className="flex justify-end">
								<Button onClick={exportSettings}>
									<Download className="h-4 w-4 mr-2" />
									Download
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					{/* Import */}
					<Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="outline">
								<Upload className="h-4 w-4 mr-2" />
								Import Settings
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Import Retry Settings</DialogTitle>
								<DialogDescription>
									Paste JSON data to import retry configuration
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<textarea
									className="w-full h-32 p-3 border rounded"
									placeholder="Paste JSON here..."
									value={importData}
									onChange={(e) => setImportData(e.target.value)}
								/>
								{importResult && (
									<div className={`p-3 rounded ${
										importResult.success
											? 'bg-green-50 text-green-700'
											: 'bg-red-50 text-red-700'
									}`}>
										{importResult.message}
									</div>
								)}
								<div className="flex justify-end gap-2">
									<Button variant="outline" onClick={() => setImportDialogOpen(false)}>
										Cancel
									</Button>
									<Button onClick={importSettings}>
										Import
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>

					{/* Reset */}
					<Button variant="outline" onClick={resetToDefaults}>
						<RotateCcw className="h-4 w-4 mr-2" />
						Reset to Defaults
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

// ============================================================================
// Main Retry Settings Panel
// ============================================================================

export interface RetrySettingsPanelProps {
	selectedCategory?: ToolCategory;
	onCategoryChange?: (category: ToolCategory) => void;
}

export const RetrySettingsPanel: React.FC<RetrySettingsPanelProps> = ({
	selectedCategory = 'JSON Processing',
	onCategoryChange
}) {
	const [activeTab, setActiveTab] = useState('global');

	const toolCategories: ToolCategory[] = [
		'JSON Processing',
		'Code Execution',
		'File Processing',
		'Data Validation',
		'Utilities',
		'Network Utilities',
		'Text Processing',
		'Security & Encryption'
	];

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="global">Global Settings</TabsTrigger>
					<TabsTrigger value="tools">Tool Settings</TabsTrigger>
					<TabsTrigger value="profiles">Custom Profiles</TabsTrigger>
					<TabsTrigger value="backup">Import/Export</TabsTrigger>
				</TabsList>

				<TabsContent value="global" className="space-y-4">
					<GlobalRetrySettings />
				</TabsContent>

				<TabsContent value="tools" className="space-y-4">
					{/* Category Selection */}
					<Card>
						<CardHeader>
							<CardTitle>Select Tool Category</CardTitle>
						</CardHeader>
						<CardContent>
							<Select
								value={selectedCategory}
								onValueChange={(value: ToolCategory) => {
									onCategoryChange?.(value);
								}}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{toolCategories.map(category => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CardContent>
					</Card>

					{/* Tool-Specific Configuration */}
					<ToolRetryConfiguration
						selectedCategory={selectedCategory}
					/>
				</TabsContent>

				<TabsContent value="profiles" className="space-y-4">
					<CustomRetryProfiles />
				</TabsContent>

				<TabsContent value="backup" className="space-y-4">
					<ImportExportSettings />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default RetrySettingsPanel;
