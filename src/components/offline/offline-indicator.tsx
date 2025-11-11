'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useServiceWorker';
import { offlineManager } from '@/lib/offline-manager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface OfflineIndicatorProps {
	variant?: 'default' | 'minimal' | 'detailed';
	showReconnectButton?: boolean;
	className?: string;
}

export function OfflineIndicator({
	variant = 'default',
	showReconnectButton = true,
	className = ''
}: OfflineIndicatorProps) {
	const isOnline = useOfflineStatus();
	const [networkStatus, setNetworkStatus] = useState(offlineManager.getNetworkStatus());
	const [isReconnecting, setIsReconnecting] = useState(false);
	const [reconnectStatus, setReconnectStatus] = useState({ attempts: 0, nextAttemptIn: 0 });

	useEffect(() => {
		return offlineManager.subscribe((status) => {
			setNetworkStatus(status);
			setReconnectStatus(offlineManager.getReconnectStatus());
		});
	}, []);

	const handleReconnect = async () => {
		setIsReconnecting(true);
		try {
			const isConnected = await offlineManager.checkConnectivity();
			if (isConnected) {
				window.location.reload();
			}
		} finally {
			setIsReconnecting(false);
		}
	};

	const isSlowConnection = offlineManager.isSlowConnection();

	if (variant === 'minimal') {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				{isOnline ? (
					<Tooltip>
						<TooltipTrigger>
							<Wifi className="h-4 w-4 text-green-500" />
						</TooltipTrigger>
						<TooltipContent>
							<p>Connected</p>
							{networkStatus.effectiveType && (
								<p className="text-xs text-muted-foreground">
									{networkStatus.effectiveType}
								</p>
							)}
						</TooltipContent>
					</Tooltip>
				) : (
					<Tooltip>
						<TooltipTrigger>
							<WifiOff className="h-4 w-4 text-red-500" />
						</TooltipTrigger>
						<TooltipContent>
							<p>Offline</p>
							{reconnectStatus.attempts > 0 && (
								<p className="text-xs text-muted-foreground">
									Reconnecting... ({reconnectStatus.attempts})
								</p>
							)}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		);
	}

	if (variant === 'detailed') {
		return (
			<div className={`p-4 rounded-lg border ${className} ${
				isOnline
					? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
					: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
			}`}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{isOnline ? (
							<Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
						) : (
							<WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
						)}

						<div>
							<h3 className="font-medium">
								{isOnline ? 'Connected' : 'Offline Mode'}
							</h3>
							<div className="text-sm text-muted-foreground">
								{!isOnline && reconnectStatus.attempts > 0 && (
									<p>
										Attempting to reconnect ({reconnectStatus.attempts}/{5})
										{reconnectStatus.nextAttemptIn > 0 && (
											<span> in {Math.round(reconnectStatus.nextAttemptIn / 1000)}s</span>
										)}
									</p>
								)}
								{isOnline && networkStatus.effectiveType && (
									<p>
										Connection: {networkStatus.effectiveType}
										{isSlowConnection && (
											<span className="text-yellow-600 dark:text-yellow-400">
												{' '} (Slow)
											</span>
										)}
									</p>
								)}
							</div>
						</div>
					</div>

					{!isOnline && showReconnectButton && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleReconnect}
							disabled={isReconnecting}
						>
							{isReconnecting ? (
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<RefreshCw className="h-4 w-4 mr-2" />
							)}
							Reconnect
						</Button>
					)}
				</div>

				{isSlowConnection && isOnline && (
					<div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded dark:bg-yellow-900/20 dark:border-yellow-800">
						<div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
							<AlertTriangle className="h-4 w-4" />
							<span>Slow connection detected. Some features may be limited.</span>
						</div>
					</div>
				)}
			</div>
		);
	}

	// Default variant
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{isOnline ? (
				<Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
					<Wifi className="h-3 w-3 mr-1" />
					Online
				</Badge>
			) : (
				<Badge variant="destructive">
					<WifiOff className="h-3 w-3 mr-1" />
					Offline
				</Badge>
			)}

			{isOnline && isSlowConnection && (
				<Tooltip>
					<TooltipTrigger>
						<Badge variant="outline" className="border-yellow-200 text-yellow-800 dark:border-yellow-800 dark:text-yellow-300">
							<AlertTriangle className="h-3 w-3 mr-1" />
							Slow
						</Badge>
					</TooltipTrigger>
					<TooltipContent>
						<p>Slow connection detected</p>
					</TooltipContent>
				</Tooltip>
			)}

			{!isOnline && showReconnectButton && (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleReconnect}
					disabled={isReconnecting}
					className="h-6 px-2"
				>
					{isReconnecting ? (
						<RefreshCw className="h-3 w-3 animate-spin" />
					) : (
						<RefreshCw className="h-3 w-3" />
					)}
				</Button>
			)}
		</div>
	);
}
