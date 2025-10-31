import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getToolById, toolsData } from '@/data/tools-data';
import type { Tool } from '@/types/tools';
import {
	AlertCircle,
	ArrowLeft,
	Code,
	FileJson,
	FileText,
	Hash,
	Play,
	Search,
	Settings,
	Shield,
	Terminal,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import * as React from 'react';

interface ToolPageProps {
	params: Promise<{
		slug: string;
	}>;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	FileJson,
	Terminal,
	Code,
	FileText,
	Hash,
	Zap,
	Settings,
	Shield,
	Play,
	Search,
};

// Tool component mapping - only include existing components
const toolComponents: Record<string, React.ComponentType<any>> = {
	'json-formatter': React.lazy(() =>
		import('@/components/tools/json/json-formatter').then((module) => ({
			default: module.JsonFormatter,
		})),
	),
	'json-validator': React.lazy(() =>
		import('@/components/tools/json/json-validator').then((module) => ({
			default: module.JsonValidator,
		})),
	),
	'code-executor': React.lazy(() =>
		import('@/components/tools/code/code-execution').then((module) => ({
			default: module.CodeExecution,
		})),
	),
	'code-formatter': React.lazy(() =>
		import('@/components/tools/code/code-formatter').then((module) => ({
			default: module.CodeFormatter,
		})),
	),
};

// Generate static params for all tools
export async function generateStaticParams() {
	return toolsData.map((tool) => ({
		slug: tool.id,
	}));
}

// Opt out of static generation for pages with interactive components
export const dynamic = 'force-dynamic';

export default async function ToolPage({ params }: ToolPageProps) {
	const { slug } = await params;
	const tool = getToolById(slug);

	// If tool doesn't exist, show 404
	if (!tool) {
		notFound();
	}

	const Icon = iconMap[tool.icon] || Settings;

	// Get related tools
	const relatedTools = toolsData
		.filter((t) => t.id !== slug && (t.category === tool.category || t.tags.some((tag) => tool.tags.includes(tag))))
		.slice(0, 3);

	const ToolComponent = toolComponents[slug];

	return (
		<MainLayout>
			<div className="container mx-auto py-6">
				{/* Breadcrumb Navigation */}
				<nav className="mb-6 flex items-center space-x-2 text-gray-600 text-sm">
					<Link href="/" className="hover:text-gray-900">
						Home
					</Link>
					<span>/</span>
					<Link href="/tools" className="hover:text-gray-900">
						Tools
					</Link>
					<span>/</span>
					<span className="font-medium text-gray-900">{tool.name}</span>
				</nav>

				<div className="grid gap-6 lg:grid-cols-4">
					{/* Main Content */}
					<div className="lg:col-span-3">
						{/* Tool Header */}
						<div className="mb-6">
							<div className="mb-4 flex items-center gap-3">
								<Icon className="h-8 w-8 text-blue-600" />
								<div>
									<h1 className="font-bold text-3xl text-gray-900 dark:text-white">{tool.name}</h1>
									<div className="flex items-center gap-2">
										<Badge variant="outline">{tool.difficulty}</Badge>
										<Badge variant={tool.status === 'stable' ? 'default' : 'secondary'}>{tool.status}</Badge>
										{tool.isNew && <Badge variant="secondary">New</Badge>}
										{tool.isPopular && <Badge variant="outline">Popular</Badge>}
									</div>
								</div>
							</div>
							<p className="text-gray-600 dark:text-gray-400">{tool.description}</p>
						</div>

						{/* Tool Content */}
						<div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
							{ToolComponent ? (
								<React.Suspense
									fallback={
										<div className="flex items-center justify-center py-12">
											<div className="text-center">
												<div className="mb-4 inline-block animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 h-8 w-8"></div>
												<p className="text-gray-600">Loading {tool.name}...</p>
											</div>
										</div>
									}
								>
									<div>
										<ToolComponent />
									</div>
								</React.Suspense>
							) : (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<AlertCircle className="h-5 w-5 text-yellow-500" />
											Tool Coming Soon
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600">
											This tool is currently under development and will be available soon. Please check back later or
											try one of our other tools.
										</p>
										<div className="mt-4">
											<Link href="/tools">
												<Button variant="outline">
													<ArrowLeft className="mr-2 h-4 w-4" />
													Back to Tools
												</Button>
											</Link>
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-1">
						{/* Features */}
						<Card className="mb-6">
							<CardHeader>
								<CardTitle className="text-lg">Features</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{tool.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2">
											<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
											<span className="text-gray-700 dark:text-gray-300">{feature}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>

						{/* Tags */}
						<Card className="mb-6">
							<CardHeader>
								<CardTitle className="text-lg">Tags</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{tool.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 text-xs dark:bg-gray-700 dark:text-gray-300"
										>
											{tag}
										</span>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Info */}
						<Card className="mb-6">
							<CardHeader>
								<CardTitle className="text-lg">Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<span className="font-medium text-gray-900 dark:text-white">Category:</span>{' '}
									<span className="text-gray-600 dark:text-gray-400">{tool.category}</span>
								</div>
								<div>
									<span className="font-medium text-gray-900 dark:text-white">Processing:</span>{' '}
									<span className="text-gray-600 dark:text-gray-400 capitalize">
										{tool.processingType?.replace('-', ' ')}
									</span>
								</div>
								<div>
									<span className="font-medium text-gray-900 dark:text-white">Security:</span>{' '}
									<span className="text-gray-600 dark:text-gray-400 capitalize">
										{tool.security?.replace('-', ' ')}
									</span>
								</div>
							</CardContent>
						</Card>

						{/* Related Tools */}
						{relatedTools.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Related Tools</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{relatedTools.map((relatedTool) => {
											const RelatedIcon = iconMap[relatedTool.icon] || Settings;
											return (
												<Link
													key={relatedTool.id}
													href={relatedTool.href}
													className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
												>
													<div className="flex items-center gap-3">
														<RelatedIcon className="h-5 w-5 text-blue-600" />
														<div className="flex-1">
															<h4 className="font-medium text-gray-900 dark:text-white">{relatedTool.name}</h4>
															<p className="text-gray-600 text-sm dark:text-gray-400">{relatedTool.description}</p>
														</div>
													</div>
												</Link>
											);
										})}
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
