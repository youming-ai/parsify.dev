import { getToolById, toolsData } from '@/data/tools-data';
import { notFound } from 'next/navigation';
import * as React from 'react';

interface ToolPageProps {
	params: Promise<{
		slug: string;
	}>;
}

// Tool component mapping - all available tools
const toolComponents: Record<string, React.ComponentType<any>> = {
	// JSON Tools
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
	'json-converter': React.lazy(() =>
		import('@/components/tools/json/json-converter').then((module) => ({
			default: module.JsonConverter,
		})),
	),
	'json-path-queries': React.lazy(() =>
		import('@/components/tools/json/json-path-queries').then((module) => ({
			default: module.JsonPathQueries,
		})),
	),

	// Code Tools
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
	'regex-tester': React.lazy(() =>
		import('@/components/tools/code/regex-tester').then((module) => ({
			default: module.RegexTester,
		})),
	),

	// Data Tools
	'hash-generator': React.lazy(() =>
		import('@/components/tools/data/hash-generator').then((module) => ({
			default: module.HashGenerator,
		})),
	),

	// File Tools
	'file-converter': React.lazy(() =>
		import('@/components/tools/file/file-converter').then((module) => ({
			default: module.FileConverter,
		})),
	),
	'csv-processor': React.lazy(() =>
		import('@/components/tools/file/csv-processor').then((module) => ({
			default: module.CSVProcessor,
		})),
	),
	'text-processor': React.lazy(() =>
		import('@/components/tools/file/text-processor').then((module) => ({
			default: module.TextProcessor,
		})),
	),

	// Utility Tools
	'base64-converter': React.lazy(() =>
		import('@/components/tools/utilities/base64-converter').then((module) => ({
			default: module.Base64Converter,
		})),
	),
	'url-encoder': React.lazy(() =>
		import('@/components/tools/utilities/url-encoder').then((module) => ({
			default: module.URLEncoder,
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

	const ToolComponent = toolComponents[slug];

	return (
		<>
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
				<div className="text-center py-12">
					<div className="mb-4">
						<div className="text-6xl mb-4">🔧</div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tool Coming Soon</h2>
						<p className="text-gray-600 dark:text-gray-400 mb-6">
							This tool is currently under development and will be available soon. Please check back later or try one of
							our other tools.
						</p>
						<a
							href="/tools"
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							← Back to Tools
						</a>
					</div>
				</div>
			)}
		</>
	);
}
