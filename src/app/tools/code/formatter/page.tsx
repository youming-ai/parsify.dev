import { MainLayout } from '@/components/layout/main-layout';
import { CodeFormatter } from '@/components/tools/code/code-formatter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import type { CodeFormatOptions, CodeLanguage } from '@/components/tools/code/code-types';

// Code Formatter Wrapper Component
function CodeFormatterWrapper() {
	return (
		<div className="p-6 text-center">
			<p className="text-gray-600">Code Formatter tool is coming soon!</p>
			<p className="text-gray-500 text-sm mt-2">
				This tool will allow you to format and beautify code in multiple programming languages.
			</p>
		</div>
	);
}

export default function CodeFormatterPage() {
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
					<span className="font-medium text-gray-900">Code Formatter</span>
				</nav>

				{/* Tool Header */}
				<div className="mb-6">
					<div className="mb-4 flex items-center gap-3">
						<Code className="h-8 w-8 text-purple-600" />
						<div>
							<h1 className="font-bold text-3xl text-gray-900 dark:text-white">Code Formatter</h1>
							<div className="flex items-center gap-2">
								<Badge variant="outline">Beginner</Badge>
								<Badge variant="default">Stable</Badge>
							</div>
						</div>
					</div>
					<p className="text-gray-600 dark:text-gray-400">Format and beautify code in multiple programming languages</p>
				</div>

				{/* Tool Component */}
				<div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
					<CodeFormatterWrapper />
				</div>

				{/* Tool Features */}
				<div className="mt-8 grid gap-6 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Features</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2">
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-purple-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Multiple Languages</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-purple-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Prettier Integration</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-purple-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Custom Rules</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-purple-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Batch Formatting</span>
								</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div>
								<span className="font-medium text-gray-900 dark:text-white">Category:</span>{' '}
								<span className="text-gray-600 dark:text-gray-400">Code Execution</span>
							</div>
							<div>
								<span className="font-medium text-gray-900 dark:text-white">Processing:</span>{' '}
								<span className="text-gray-600 dark:text-gray-400">Client Side</span>
							</div>
							<div>
								<span className="font-medium text-gray-900 dark:text-white">Security:</span>{' '}
								<span className="text-gray-600 dark:text-gray-400">Local Only</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Related Tools</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<Link
									href="/tools/code/executor"
									className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
								>
									<div className="flex items-center gap-3">
										<Code className="h-5 w-5 text-purple-600" />
										<div className="flex-1">
											<h4 className="font-medium text-gray-900 dark:text-white">Code Executor</h4>
											<p className="text-gray-600 text-sm dark:text-gray-400">
												Execute code in a secure WASM sandbox with multiple language support
											</p>
										</div>
									</div>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</MainLayout>
	);
}
