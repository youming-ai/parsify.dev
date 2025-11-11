/**
 * Fallback Mode Indicator Component
 * Visual indicator showing when fallback processing is active
 */

import React, { useState, useEffect } from 'react';
import {
	AlertTriangle,
	CheckCircle,
	Info,
	Settings,
	X,
	ChevronDown,
	ChevronUp,
	Zap,
	Shield,
	Activity
} from 'lucide-react';
import {
	FallbackResult,
	FallbackQuality,
	DegradationLevel,
	fallbackProcessor
} from '../../monitoring/fallback-processing-system';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
	Alert,
	AlertDescription,
	AlertTitle
} from '../ui/alert';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../ui/collapsible";

interface FallbackModeIndicatorProps {
	isActive: boolean;
	result?: FallbackResult;
	onDismiss?: () => void;
	onSettingsClick?: () => void;
	className?: string;
	showDetails?: boolean;
	autoHide?: boolean;
}

export const FallbackModeIndicator: React.FC<FallbackModeIndicatorProps> = ({
	isActive,
	result,
	onDismiss,
	onSettingsClick,
	className = '',
	showDetails = false,
	autoHide = false,
}) => {
	const [isExpanded, setIsExpanded] = useState(showDetails);
	const [isVisible, setIsVisible] = useState(isActive);
	const [animatingOut, setAnimatingOut] = useState(false);

	useEffect(() => {
		setIsVisible(isActive);
		if (isActive) {
			setAnimatingOut(false);
		}
	}, [isActive]);

	useEffect(() => {
		if (autoHide && result?.success && result.quality === 'full') {
			const timer = setTimeout(() => {
				handleDismiss();
			}, 5000); // Auto-hide after 5 seconds for successful full-quality fallbacks

			return () => clearTimeout(timer);
		}
	}, [result, autoHide]);

	const handleDismiss = () => {
		setAnimatingOut(true);
		setTimeout(() => {
			setIsVisible(false);
			onDismiss?.();
		}, 300);
	};

	if (!isVisible) return null;

	const getQualityColor = (quality: FallbackQuality): string => {
		switch (quality) {
			case 'full': return 'text-green-600 bg-green-50 border-green-200';
			case 'high': return 'text-blue-600 bg-blue-50 border-blue-200';
			case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
			case 'minimal': return 'text-red-600 bg-red-50 border-red-200';
			default: return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	};

	const getQualityIcon = (quality: FallbackQuality) => {
		switch (quality) {
			case 'full': return <CheckCircle className="w-4 h-4" />;
			case 'high': return <Shield className="w-4 h-4" />;
			case 'medium': return <Activity className="w-4 h-4" />;
			case 'low': return <Info className="w-4 h-4" />;
			case 'minimal': return <AlertTriangle className="w-4 h-4" />;
			default: return <Info className="w-4 h-4" />;
		}
	};

	const getDegradationColor = (level: DegradationLevel): string => {
		switch (level) {
			case 'none': return 'text-green-600';
			case 'minor': return 'text-blue-600';
			case 'moderate': return 'text-yellow-600';
			case 'significant': return 'text-orange-600';
			case 'severe': return 'text-red-600';
			default: return 'text-gray-600';
		}
	};

	const getAlertVariant = (quality: FallbackQuality): 'default' | 'destructive' => {
		return quality === 'minimal' || quality === 'low' ? 'destructive' : 'default';
	};

	return (
		<div className={`
			transition-all duration-300 ease-in-out
			${animatingOut ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'}
			${className}
		`}>
			{result ? (
				<Alert
					variant={getAlertVariant(result.quality)}
					className={`
						relative border-l-4
						${getQualityColor(result.quality)}
					`}
				>
					<div className="flex items-start justify-between">
						<div className="flex items-start space-x-3">
							{getQualityIcon(result.quality)}
							<div className="flex-1">
								<AlertTitle className="flex items-center space-x-2">
									<span>Fallback Processing Active</span>
									<Badge variant="secondary" className="text-xs">
										{result.quality.charAt(0).toUpperCase() + result.quality.slice(1)} Quality
									</Badge>
									<Badge variant="outline" className="text-xs">
										{result.strategyUsed}
									</Badge>
								</AlertTitle>
								<AlertDescription className="mt-1">
									{result.success
										? `Processing completed using ${result.strategyUsed.replace(/-/g, ' ')}`
										: 'Fallback processing failed'
									}
								</AlertDescription>
							</div>
						</div>

						<div className="flex items-center space-x-2">
							{onSettingsClick && (
								<Button
									variant="ghost"
									size="sm"
									onClick={onSettingsClick}
									className="h-8 w-8 p-0"
								>
									<Settings className="w-4 h-4" />
								</Button>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDismiss}
								className="h-8 w-8 p-0"
							>
								<X className="w-4 h-4" />
							</Button>
						</div>
					</div>

					{(result.userWarnings.length > 0 || result.limitations.length > 0) && (
						<Collapsible
							open={isExpanded}
							onOpenChange={setIsExpanded}
							className="mt-3"
						>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-between text-xs"
								>
									<span>Details & Warnings</span>
									{isExpanded ? (
										<ChevronUp className="w-3 h-3" />
									) : (
										<ChevronDown className="w-3 h-3" />
									)}
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-2 space-y-2">
								{result.userWarnings.length > 0 && (
									<div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
										<h4 className="font-medium text-yellow-800 text-sm flex items-center">
											<AlertTriangle className="w-4 h-4 mr-2" />
											Warnings
										</h4>
										<ul className="mt-1 text-xs text-yellow-700 space-y-1">
											{result.userWarnings.map((warning, index) => (
												<li key={index} className="flex items-start">
													<span className="mr-2">•</span>
													<span>{warning}</span>
												</li>
											))}
										</ul>
									</div>
								)}

								{result.limitations.length > 0 && (
									<div className="bg-blue-50 border border-blue-200 rounded-md p-3">
										<h4 className="font-medium text-blue-800 text-sm flex items-center">
											<Info className="w-4 h-4 mr-2" />
											Limitations
										</h4>
										<ul className="mt-1 text-xs text-blue-700 space-y-1">
											{result.limitations.map((limitation, index) => (
												<li key={index} className="flex items-start">
													<span className="mr-2">•</span>
													<span>{limitation}</span>
												</li>
											))}
										</ul>
									</div>
								)}

								<div className="grid grid-cols-2 gap-4 text-xs">
									<div>
										<span className="font-medium text-gray-600">Quality Score:</span>
										<span className="ml-2 font-mono">
											{result.dataIntegrity.qualityScore}%
										</span>
									</div>
									<div>
										<span className="font-medium text-gray-600">Processing Time:</span>
										<span className="ml-2 font-mono">
											{result.processingTime}ms
										</span>
									</div>
									<div>
										<span className="font-medium text-gray-600">Accuracy:</span>
										<span className={`ml-2 font-mono ${getDegradationColor(result.degradationLevel)}`}>
											{result.metrics.accuracy}%
										</span>
									</div>
									<div>
										<span className="font-medium text-gray-600">Degradation:</span>
										<span className={`ml-2 font-mono capitalize ${getDegradationColor(result.degradationLevel)}`}>
											{result.degradationLevel}
										</span>
									</div>
								</div>
							</CollapsibleContent>
						</Collapsible>
					)}
				</Alert>
			) : (
				<Alert className="relative border-l-4 border-yellow-400 bg-yellow-50">
					<Zap className="w-4 h-4" />
					<AlertTitle className="flex items-center space-x-2">
						<span>Fallback Processing</span>
						<Badge variant="secondary" className="text-xs">
							Preparing
						</Badge>
					</AlertTitle>
					<AlertDescription>
						Attempting fallback processing strategies...
					</AlertDescription>
					{onSettingsClick && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onSettingsClick}
							className="absolute top-2 right-2 h-6 w-6 p-0"
						>
							<Settings className="w-3 h-3" />
						</Button>
					)}
				</Alert>
			)}
		</div>
	);
};

interface FallbackStatusBadgeProps {
	result?: FallbackResult;
	showText?: boolean;
	className?: string;
}

export const FallbackStatusBadge: React.FC<FallbackStatusBadgeProps> = ({
	result,
	showText = true,
	className = '',
}) => {
	if (!result) return null;

	const getQualityColor = (quality: FallbackQuality): string => {
		switch (quality) {
			case 'full': return 'bg-green-100 text-green-800 border-green-200';
			case 'high': return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'low': return 'bg-orange-100 text-orange-800 border-orange-200';
			case 'minimal': return 'bg-red-100 text-red-800 border-red-200';
			default: return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	const getQualityIcon = (quality: FallbackQuality) => {
		switch (quality) {
			case 'full': return <CheckCircle className="w-3 h-3" />;
			case 'high': return <Shield className="w-3 h-3" />;
			case 'medium': return <Activity className="w-3 h-3" />;
			case 'low': return <Info className="w-3 h-3" />;
			case 'minimal': return <AlertTriangle className="w-3 h-3" />;
			default: return <Info className="w-3 h-3" />;
		}
	};

	return (
		<Badge
			variant="outline"
			className={`
				flex items-center space-x-1
				${getQualityColor(result.quality)}
				${className}
			`}
		>
			{getQualityIcon(result.quality)}
			{showText && (
				<span className="text-xs">
					{result.quality.charAt(0).toUpperCase() + result.quality.slice(1)}
				</span>
			)}
		</Badge>
	);
};

interface FallbackProgressIndicatorProps {
	isActive: boolean;
	progress?: number;
	currentStrategy?: string;
	totalStrategies?: number;
	className?: string;
}

export const FallbackProgressIndicator: React.FC<FallbackProgressIndicatorProps> = ({
	isActive,
	progress = 0,
	currentStrategy,
	totalStrategies = 1,
	className = '',
}) => {
	if (!isActive) return null;

	return (
		<div className={`space-y-2 ${className}`}>
			<div className="flex items-center justify-between text-sm">
				<span className="text-gray-600">Fallback Processing</span>
				{currentStrategy && (
					<span className="text-xs text-gray-500">
						Trying: {currentStrategy.replace(/-/g, ' ')}
					</span>
				)}
			</div>
			<div className="w-full bg-gray-200 rounded-full h-2">
				<div
					className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
					style={{ width: `${progress}%` }}
				/>
			</div>
			{totalStrategies > 1 && (
				<div className="text-xs text-gray-500 text-center">
					Strategy {Math.ceil(progress / (100 / totalStrategies))} of {totalStrategies}
				</div>
			)}
		</div>
	);
};
