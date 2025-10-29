import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileJson, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JsonPathQueriesPage() {
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
					<span className="font-medium text-gray-900">JSONPath Queries</span>
				</nav>

				{/* Tool Header */}
				<div className="mb-6">
					<div className="mb-4 flex items-center gap-3">
						<FileJson className="h-8 w-8 text-blue-600" />
						<div>
							<h1 className="font-bold text-3xl text-gray-900 dark:text-white">JSONPath Queries</h1>
							<div className="flex items-center gap-2">
								<Badge variant="outline">Intermediate</Badge>
								<Badge variant="secondary">Beta</Badge>
							</div>
						</div>
					</div>
					<p className="text-gray-600 dark:text-gray-400">
						Extract and query data from JSON using JSONPath expressions
					</p>
				</div>

				{/* Tool Coming Soon */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-yellow-500" />
							Tool Coming Soon
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-gray-600">
							This tool is currently under development and will be available soon. Please check back later or try one of
							our other tools.
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

				{/* Tool Features */}
				<div className="mt-8 grid gap-6 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Features</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2">
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">JSONPath Expressions</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Real-time Results</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Syntax Highlighting</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Query History</span>
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
								<span className="text-gray-600 dark:text-gray-400">JSON Processing</span>
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
									href="/tools/json/formatter"
									className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
								>
									<div className="flex items-center gap-3">
										<FileJson className="h-5 w-5 text-blue-600" />
										<div className="flex-1">
											<h4 className="font-medium text-gray-900 dark:text-white">JSON Formatter</h4>
											<p className="text-gray-600 text-sm dark:text-gray-400">
												Format and beautify JSON data with customizable options
											</p>
										</div>
									</div>
								</Link>
								<Link
									href="/tools/json/validator"
									className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
								>
									<div className="flex items-center gap-3">
										<FileJson className="h-5 w-5 text-blue-600" />
										<div className="flex-1">
											<h4 className="font-medium text-gray-900 dark:text-white">JSON Validator</h4>
											<p className="text-gray-600 text-sm dark:text-gray-400">
												Comprehensive JSON validation with detailed error messages
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
