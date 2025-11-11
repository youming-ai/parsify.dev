'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, X, ChevronDown, ChevronUp, Smartphone, Database } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useServiceWorker';
import { offlineManager } from '@/lib/offline-manager';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface OfflineBannerProps {
	showDismissButton?: boolean;
	autoHide?: boolean;
	className?: string;
}

export function OfflineBanner({
	showDismissButton = true,
	autoHide = true,
	className = ''
}: OfflineBannerProps) {
	const isOnline = useOfflineStatus();
	const [isDismissed, setIsDismissed] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [reconnectStatus, setReconnectStatus] = useState({ attempts: 0, nextAttemptIn: 0 });

	useEffect(() => {
		if (isOnline && autoHide) {
			// Auto-hide after 3 seconds when coming back online
			const timer = setTimeout(() => {
				setIsDismissed(true);
			}, 3000);

			return () => clearTimeout(timer);
		} else if (!isOnline) {
			setIsDismissed(false);
		}
	}, [isOnline, autoHide]);

	useEffect(() => {
		return offlineManager.subscribe(() => {
			setReconnectStatus(offlineManager.getReconnectStatus());
		});
	}, []);

	if (isOnline || isDismissed) {
		return null;
	}

	const handleDismiss = () => {
		setIsDismissed(true);
	};

	const availableOfflineTools = [
		{ name: 'JSON Formatter', icon: '📋', description: 'Format and validate JSON files' },
		{ name: 'Base64 Encoder', icon: '🔐', description: 'Encode and decode Base64 strings' },
		{ name: 'URL Encoder', icon: '🔗', description: 'Encode and decode URLs' },
		{ name: 'Hash Generator', icon: '#️⃣', description: 'Generate MD5, SHA1, SHA256 hashes' },
		{ name: 'Text Diff', icon: '📝', description: 'Compare text differences' },
		{ name: 'Color Picker', icon: '🎨', description: 'Convert color formats' },
	];

	return (
		<div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg ${className}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between py-3">
					<div className="flex items-center gap-3">
						<WifiOff className="h-5 w-5 flex-shrink-0" />
						<div>
							<h3 className="font-semibold text-sm">You're offline</h3>
							<p className="text-xs opacity-90">
								Some features may be limited. {reconnectStatus.attempts > 0 &&
									`Attempting to reconnect (${reconnectStatus.attempts}/5)`
								}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="text-white hover:bg-white/20 h-8 px-2"
								>
									{isExpanded ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</Button>
							</CollapsibleTrigger>

							<CollapsibleContent>
								<div className="absolute top-full left-0 right-0 bg-white text-gray-900 shadow-xl border-t border-gray-200">
									<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
													<Smartphone className="h-4 w-4" />
													Available Offline Tools
												</h4>
												<div className="space-y-2">
													{availableOfflineTools.slice(0, 3).map((tool, index) => (
														<div key={index} className="flex items-start gap-2 text-sm">
															<span className="text-lg">{tool.icon}</span>
															<div>
																<div className="font-medium">{tool.name}</div>
																<div className="text-xs text-gray-600">{tool.description}</div>
															</div>
														</div>
													))}
												</div>
											</div>

											<div>
												<h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
													<Database className="h-4 w-4" />
													Offline Data
												</h4>
												<div className="space-y-2 text-sm">
													<div className="flex items-center gap-2">
														<AlertTriangle className="h-3 w-3 text-yellow-500" />
														<span>Your work is saved locally</span>
													</div>
													<div className="flex items-center gap-2">
														<AlertTriangle className="h-3 w-3 text-blue-500" />
														<span>Will sync when connection is restored</span>
													</div>
													<div className="text-xs text-gray-600 mt-2">
														Recent changes are automatically saved to your device and will be synced to the cloud when you're back online.
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</CollapsibleContent>
						</Collapsible>

						{showDismissButton && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDismiss}
								className="text-white hover:bg-white/20 h-8 px-2"
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
