/**
 * Bundle Size Monitor Component
 * Real-time monitoring of application bundle sizes and assets
 * Tracks bundle growth, chunk analysis, and optimization opportunities
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Database,
	Package,
	TrendingUp,
	AlertTriangle,
	CheckCircle,
	Download,
	RefreshCw,
	Compress,
	FileText,
	Image,
	Code,
	Zap
} from 'lucide-react';

interface BundleChunk {
	name: string;
	size: number;
	gzipped: number;
	type: 'js' | 'css' | 'image' | 'font' | 'other';
	change: number;
	status: 'good' | 'warning' | 'critical';
}

interface BundleMetrics {
	totalSize: number;
	gzippedSize: number;
	chunkCount: number;
	largestChunk: number;
	totalChunks: BundleChunk[];
	lastUpdated: Date;
	budgetUsage: number;
	optimizationScore: number;
}

export function BundleSizeMonitor() {
	const [timeRange, setTimeRange] = useState<'current' | '1h' | '24h' | '7d'>('current');
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	// Generate bundle metrics
	const bundleMetrics: BundleMetrics = useMemo(() => {
		const chunks: BundleChunk[] = [
			{ name: 'main.js', size: 245000, gzipped: 68000, type: 'js', change: 2.3, status: 'good' },
			{ name: 'vendor.js', size: 189000, gzipped: 52000, type: 'js', change: -1.2, status: 'good' },
			{ name: 'runtime.js', size: 12000, gzipped: 4000, type: 'js', change: 0.0, status: 'good' },
			{ name: 'styles.css', size: 45000, gzipped: 12000, type: 'css', change: 5.6, status: 'warning' },
			{ name: 'monaco-editor.js', size: 2340000, gzipped: 680000, type: 'js', change: 0.0, status: 'good' },
			{ name: 'chart-library.js', size: 156000, gzipped: 42000, type: 'js', change: 8.9, status: 'warning' },
			{ name: 'ui-components.js', size: 78000, gzipped: 22000, type: 'js', change: -3.4, status: 'good' },
			{ name: 'fonts.css', size: 89000, gzipped: 78000, type: 'font', change: 0.0, status: 'good' },
			{ name: 'images-sprite.png', size: 234000, gzipped: 198000, type: 'image', change: 0.0, status: 'good' },
		];

		const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
		const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzipped, 0);
		const largestChunk = Math.max(...chunks.map(chunk => chunk.size));

		// Budget: 5MB total, 2MB gzipped
		const budgetUsage = (gzippedSize / (2 * 1024 * 1024)) * 100;

		// Optimization score based on various factors
		let optimizationScore = 100;
		if (budgetUsage > 90) optimizationScore -= 30;
		else if (budgetUsage > 75) optimizationScore -= 15;
		else if (budgetUsage > 50) optimizationScore -= 5;

		const largeChunks = chunks.filter(chunk => chunk.size > 500000).length;
		optimizationScore -= largeChunks * 10;

		const growingChunks = chunks.filter(chunk => chunk.change > 5).length;
		optimizationScore -= growingChunks * 5;

		return {
			totalSize,
			gzippedSize,
			chunkCount: chunks.length,
			largestChunk,
			totalChunks: chunks,
			lastUpdated: new Date(),
			budgetUsage,
			optimizationScore: Math.max(0, optimizationScore),
		};
	}, [timeRange]);

	// Get file type icon
	const getFileIcon = (type: string) => {
		switch (type) {
			case 'js': return <Code className="h-4 w-4" />;
			case 'css': return <FileText className="h-4 w-4" />;
			case 'image': return <Image className="h-4 w-4" />;
			case 'font': return <FileText className="h-4 w-4" />;
			default: return <Package className="h-4 w-4" />;
		}
	};

	// Get status color
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'good': return 'text-green-600 bg-green-50 border-green-200';
			case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'critical': return 'text-red-600 bg-red-50 border-red-200';
			default: return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	};

	// Format file size
	const formatSize = (bytes: number) => {
		if (bytes >= 1024 * 1024) {
			return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
		} else if (bytes >= 1024) {
			return `${(bytes / 1024).toFixed(1)}KB`;
		}
		return `${bytes}B`;
	};

	// Handle bundle analysis
	const handleAnalyzeBundle = async () => {
		setIsAnalyzing(true);
		// Simulate bundle analysis
		await new Promise(resolve => setTimeout(resolve, 2000));
		setIsAnalyzing(false);
	};

	// Handle optimization suggestions
	const handleOptimization = () => {
		// Trigger bundle optimization
		console.log('Starting bundle optimization...');
	};

	return (
		<div className="space-y-6">
			{/* Bundle Overview */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="flex items-center">
							<Database className="h-5 w-5 mr-2" />
							Bundle Size Monitor
						</CardTitle>
						<CardDescription>
							Real-time monitoring of application bundle sizes and assets
						</CardDescription>
					</div>
					<div className="flex items-center space-x-2">
						<select
							value={timeRange}
							onChange={(e) => setTimeRange(e.target.value as any)}
							className="px-3 py-2 text-sm border rounded-md bg-background"
						>
							<option value="current">Current</option>
							<option value="1h">Last Hour</option>
							<option value="24h">Last 24 Hours</option>
							<option value="7d">Last 7 Days</option>
						</select>
						<Button variant="outline" size="sm" onClick={handleAnalyzeBundle} disabled={isAnalyzing}>
							<RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
							Analyze
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						{/* Total Bundle Size */}
						<div>
							<div className="text-2xl font-bold">{formatSize(bundleMetrics.totalSize)}</div>
							<p className="text-sm text-muted-foreground">Total Size</p>
							<p className="text-xs text-muted-foreground">{formatSize(bundleMetrics.gzippedSize)} gzipped</p>
						</div>

						{/* Budget Usage */}
						<div>
							<div className="text-2xl font-bold">{bundleMetrics.budgetUsage.toFixed(1)}%</div>
							<p className="text-sm text-muted-foreground">Budget Usage</p>
							<Progress value={bundleMetrics.budgetUsage} className="mt-2" />
						</div>

						{/* Optimization Score */}
						<div>
							<div className="text-2xl font-bold">{bundleMetrics.optimizationScore}/100</div>
							<p className="text-sm text-muted-foreground">Optimization Score</p>
							<Badge
								variant={bundleMetrics.optimizationScore >= 80 ? 'default' : 'destructive'}
								className="mt-2"
							>
								{bundleMetrics.optimizationScore >= 80 ? 'Optimized' : 'Needs Optimization'}
							</Badge>
						</div>

						{/* Chunk Count */}
						<div>
							<div className="text-2xl font-bold">{bundleMetrics.chunkCount}</div>
							<p className="text-sm text-muted-foreground">Total Chunks</p>
							<p className="text-xs text-muted-foreground">Largest: {formatSize(bundleMetrics.largestChunk)}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Bundle Analysis */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Package className="h-5 w-5 mr-2" />
							Bundle Analysis
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{/* Size Distribution */}
							<div>
								<h4 className="font-medium mb-2">Size Distribution</h4>
								<div className="space-y-2">
									{['JavaScript', 'CSS', 'Images', 'Fonts', 'Other'].map((category, index) => {
										const categoryData = bundleMetrics.totalChunks.filter(chunk => {
											if (category === 'JavaScript') return chunk.type === 'js';
											if (category === 'CSS') return chunk.type === 'css';
											if (category === 'Images') return chunk.type === 'image';
											if (category === 'Fonts') return chunk.type === 'font';
											return chunk.type === 'other';
										});

										const size = categoryData.reduce((sum, chunk) => sum + chunk.size, 0);
										const percentage = (size / bundleMetrics.totalSize) * 100;

										return (
											<div key={category} className="flex items-center space-x-3">
												<span className="text-sm w-20">{category}</span>
												<Progress value={percentage} className="flex-1" />
												<span className="text-sm w-16 text-right">{formatSize(size)}</span>
											</div>
										);
									})}
								</div>
							</div>

							{/* Performance Impact */}
							<div>
								<h4 className="font-medium mb-2">Performance Impact</h4>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">Estimated Load Time:</span>
										<div className="font-medium">
											{bundleMetrics.gzippedSize < 500000 ? '< 2s' :
											 bundleMetrics.gzippedSize < 1500000 ? '2-4s' : '4-8s'}
										</div>
									</div>
									<div>
										<span className="text-muted-foreground">Cache Efficiency:</span>
										<div className="font-medium">85%</div>
									</div>
									<div>
										<span className="text-muted-foreground">Compression Ratio:</span>
										<div className="font-medium">
											{((1 - bundleMetrics.gzippedSize / bundleMetrics.totalSize) * 100).toFixed(1)}%
										</div>
									</div>
									<div>
										<span className="text-muted-foreground">Critical Chunks:</span>
										<div className="font-medium">
											{bundleMetrics.totalChunks.filter(chunk => chunk.size > 100000).length}
										</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Chunk Details */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<FileText className="h-5 w-5 mr-2" />
							Chunk Details
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-80">
							<div className="space-y-2">
								{bundleMetrics.totalChunks.map((chunk, index) => (
									<div key={index} className="flex items-center justify-between p-2 border rounded">
										<div className="flex items-center space-x-3 flex-1">
											{getFileIcon(chunk.type)}
											<div>
												<div className="font-medium text-sm">{chunk.name}</div>
												<div className="text-xs text-muted-foreground">
													{formatSize(chunk.size)} → {formatSize(chunk.gzipped)} gzipped
												</div>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<div className="text-right">
												<div className="text-sm">
													{chunk.change > 0 ? '+' : ''}{chunk.change.toFixed(1)}%
												</div>
												<div className="text-xs text-muted-foreground">change</div>
											</div>
											<Badge className={getStatusColor(chunk.status)}>
												{chunk.status}
											</Badge>
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Optimization Suggestions */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Compress className="h-5 w-5 mr-2" />
						Optimization Suggestions
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 className="font-medium mb-3 flex items-center">
								<Zap className="h-4 w-4 mr-2 text-yellow-600" />
								Immediate Actions
							</h4>
							<ul className="space-y-2 text-sm">
								<li className="flex items-start">
									<AlertTriangle className="h-4 w-4 mr-2 text-yellow-600 mt-0.5 flex-shrink-0" />
									<span>Chart library increased by 8.9% - consider code splitting</span>
								</li>
								<li className="flex items-start">
									<AlertTriangle className="h-4 w-4 mr-2 text-yellow-600 mt-0.5 flex-shrink-0" />
									<span>Styles CSS growing by 5.6% - review unused CSS rules</span>
								</li>
								<li className="flex items-start">
									<AlertTriangle className="h-4 w-4 mr-2 text-yellow-600 mt-0.5 flex-shrink-0" />
									<span>Budget usage at {bundleMetrics.budgetUsage.toFixed(1)}% - monitor growth</span>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="font-medium mb-3 flex items-center">
								<TrendingUp className="h-4 w-4 mr-2 text-green-600" />
								Optimization Opportunities
							</h4>
							<ul className="space-y-2 text-sm">
								<li className="flex items-start">
									<CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
									<span>UI-components.js decreased by 3.4% - good optimization</span>
								</li>
								<li className="flex items-start">
									<CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
									<span>Vendor.js stable - consider updating dependencies</span>
								</li>
								<li className="flex items-start">
									<CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
									<span>Compression ratio at {((1 - bundleMetrics.gzippedSize / bundleMetrics.totalSize) * 100).toFixed(1)}% - effective</span>
								</li>
							</ul>
						</div>
					</div>

					<div className="mt-6 flex items-center justify-between pt-4 border-t">
						<div className="text-sm text-muted-foreground">
							Last analyzed: {bundleMetrics.lastUpdated.toLocaleString()}
						</div>
						<Button onClick={handleOptimization}>
							<Compress className="h-4 w-4 mr-2" />
							Run Optimization
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
