'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, Database, Wifi, AlertTriangle } from 'lucide-react';
import { backgroundSyncManager, type SyncStats } from '@/lib/background-sync';
import { offlineManager } from '@/lib/offline-manager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusProps {
	variant?: 'default' | 'minimal' | 'detailed';
	showForceSyncButton?: boolean;
	className?: string;
}

export function SyncStatus({
	variant = 'default',
	showForceSyncButton = true,
	className = ''
}: SyncStatusProps) {
	const [syncStats, setSyncStats] = useState<SyncStats>({
		totalQueued: 0,
		synced: 0,
		failed: 0,
		lastSync: null,
	});
	const [isSyncing, setIsSyncing] = useState(false);
	const [syncProgress, setSyncProgress] = useState(0);
	const [isOnline, setIsOnline] = useState(offlineManager.isOnline());
	const [storageInfo, setStorageInfo] = useState({ quota: 0, usage: 0 });

	useEffect(() => {
		const loadSyncStats = async () => {
			const stats = await backgroundSyncManager.getSyncStats();
			setSyncStats(stats);
		};

		const loadStorageInfo = async () => {
			const info = await offlineManager.getStorageInfo();
			setStorageInfo(info);
		};

		loadSyncStats();
		loadStorageInfo();

		// Subscribe to sync updates
		const unsubscribeSync = backgroundSyncManager.subscribe((result) => {
			if (result.success) {
				setSyncStats(prev => ({
					...prev,
					totalQueued: Math.max(0, prev.totalQueued - 1),
					synced: prev.synced + 1,
				}));
			} else {
				setSyncStats(prev => ({
					...prev,
					failed: prev.failed + 1,
				}));
			}
		});

		// Subscribe to network status
		const unsubscribeNetwork = offlineManager.subscribe((status) => {
			setIsOnline(status.online);
		});

		return () => {
			unsubscribeSync();
			unsubscribeNetwork();
		};
	}, []);

	const handleForceSync = async () => {
		if (isSyncing) return;

		setIsSyncing(true);
		setSyncProgress(0);

		try {
			const queue = await backgroundSyncManager.getQueue();
			const totalItems = queue.length;

			if (totalItems === 0) {
				const stats = await backgroundSyncManager.getSyncStats();
				setSyncStats(stats);
				return;
			}

			const results = await backgroundSyncManager.forceSync();

			// Update progress
			for (let i = 0; i < results.length; i++) {
				setSyncProgress(((i + 1) / results.length) * 100);
				await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for visual feedback
			}

			// Reload stats after sync
			const updatedStats = await backgroundSyncManager.getSyncStats();
			setSyncStats(updatedStats);
		} catch (error) {
			console.error('[SyncStatus] Force sync failed:', error);
		} finally {
			setIsSyncing(false);
			setSyncProgress(0);
		}
	};

	const getSyncStatusColor = () => {
		if (syncStats.totalQueued === 0) return 'text-green-600 dark:text-green-400';
		if (syncStats.failed > 0) return 'text-red-600 dark:text-red-400';
		return 'text-yellow-600 dark:text-yellow-400';
	};

	const getSyncStatusIcon = () => {
		if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
		if (syncStats.totalQueued === 0) return <CheckCircle className="h-4 w-4" />;
		if (syncStats.failed > 0) return <XCircle className="h-4 w-4" />;
		return <Clock className="h-4 w-4" />;
	};

	const getSyncStatusText = () => {
		if (isSyncing) return 'Syncing...';
		if (syncStats.totalQueued === 0) return 'All synced';
		if (syncStats.failed > 0) return 'Some failed';
		return `${syncStats.totalQueued} pending`;
	};

	const storageUsagePercent = storageInfo.quota > 0 ? (storageInfo.usage / storageInfo.quota) * 100 : 0;

	if (variant === 'minimal') {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<Tooltip>
					<TooltipTrigger>
						<div className={`flex items-center gap-1 ${getSyncStatusColor()}`}>
							{getSyncStatusIcon()}
							{syncStats.totalQueued > 0 && (
								<span className="text-xs font-medium">{syncStats.totalQueued}</span>
							)}
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{getSyncStatusText()}</p>
						{syncStats.lastSync && (
							<p className="text-xs text-muted-foreground">
								Last sync: {syncStats.lastSync.toLocaleTimeString()}
							</p>
						)}
					</TooltipContent>
				</Tooltip>
			</div>
		);
	}

	if (variant === 'detailed') {
		return (
			<div className={`p-4 rounded-lg border bg-gray-50 dark:bg-gray-900 ${className}`}>
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<Database className="h-5 w-5" />
						<h3 className="font-semibold">Sync Status</h3>
					</div>

					{showForceSyncButton && isOnline && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleForceSync}
							disabled={isSyncing || syncStats.totalQueued === 0}
						>
							{isSyncing ? (
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<RefreshCw className="h-4 w-4 mr-2" />
							)}
							Force Sync
						</Button>
					)}
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
					<div className="text-center">
						<div className="text-2xl font-bold text-green-600 dark:text-green-400">
							{syncStats.synced}
						</div>
						<div className="text-xs text-muted-foreground">Synced</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
							{syncStats.totalQueued}
						</div>
						<div className="text-xs text-muted-foreground">Pending</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-red-600 dark:text-red-400">
							{syncStats.failed}
						</div>
						<div className="text-xs text-muted-foreground">Failed</div>
					</div>
					<div className="text-center">
						<div className={`flex items-center justify-center gap-1 ${getSyncStatusColor()}`}>
							{getSyncStatusIcon()}
							<span className="font-medium">{getSyncStatusText()}</span>
						</div>
						<div className="text-xs text-muted-foreground">Status</div>
					</div>
				</div>

				{isSyncing && (
					<div className="mb-4">
						<div className="flex items-center justify-between text-sm mb-1">
							<span>Sync Progress</span>
							<span>{Math.round(syncProgress)}%</span>
						</div>
						<Progress value={syncProgress} className="h-2" />
					</div>
				)}

				{!isOnline && (
					<div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded dark:bg-yellow-900/20 dark:border-yellow-800">
						<Wifi className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
						<span className="text-sm text-yellow-800 dark:text-yellow-200">
							Offline. Data will sync when connection is restored.
						</span>
					</div>
				)}

				<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between text-sm">
						<span>Storage Usage</span>
						<span>{(storageInfo.usage / 1024 / 1024).toFixed(1)} MB / {(storageInfo.quota / 1024 / 1024).toFixed(0)} MB</span>
					</div>
					<Progress value={storageUsagePercent} className="h-2 mt-1" />

					{storageUsagePercent > 80 && (
						<div className="flex items-center gap-2 mt-2 text-sm text-yellow-600 dark:text-yellow-400">
							<AlertTriangle className="h-3 w-3" />
							<span>Storage usage is high. Consider clearing cached data.</span>
						</div>
					)}
				</div>

				{syncStats.lastSync && (
					<div className="mt-2 text-xs text-muted-foreground">
						Last sync: {syncStats.lastSync.toLocaleString()}
					</div>
				)}
			</div>
		);
	}

	// Default variant
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<div className={`flex items-center gap-1 ${getSyncStatusColor()}`}>
				{getSyncStatusIcon()}
				<span className="text-sm font-medium">{getSyncStatusText()}</span>
			</div>

			{syncStats.totalQueued > 0 && (
				<Badge variant="secondary" className="text-xs">
					{syncStats.totalQueued}
				</Badge>
			)}

			{showForceSyncButton && isOnline && syncStats.totalQueued > 0 && (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleForceSync}
					disabled={isSyncing}
					className="h-7 px-2 text-xs"
				>
					{isSyncing ? (
						<RefreshCw className="h-3 w-3 animate-spin mr-1" />
					) : (
						<RefreshCw className="h-3 w-3 mr-1" />
					)}
					Sync Now
				</Button>
			)}

			{!isOnline && (
				<Badge variant="outline" className="text-xs">
					<Wifi className="h-3 w-3 mr-1" />
					Offline
				</Badge>
			)}
		</div>
	);
}
