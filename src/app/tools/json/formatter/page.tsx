import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileJson } from 'lucide-react';
import Link from 'next/link';

export default function JsonFormatterPage() {
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
					<span className="font-medium text-gray-900">JSON Formatter</span>
				</nav>

				{/* Tool Header */}
				<div className="mb-6">
					<div className="mb-4 flex items-center gap-3">
						<FileJson className="h-8 w-8 text-blue-600" />
						<div>
							<h1 className="font-bold text-3xl text-gray-900 dark:text-white">JSON Formatter</h1>
							<div className="flex items-center gap-2">
								<Badge variant="outline">Beginner</Badge>
								<Badge variant="default">Stable</Badge>
								<Badge variant="outline">Popular</Badge>
							</div>
						</div>
					</div>
					<p className="text-gray-600 dark:text-gray-400">
						Format, beautify, and validate JSON data with customizable indentation and sorting options
					</p>
				</div>

				{/* Tool Component */}
				<div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
					<div className="p-6 text-center">
						<p className="text-gray-600">JSON Formatter tool is coming soon!</p>
						<p className="text-gray-500 text-sm mt-2">
							This tool will allow you to format, beautify, and validate JSON data with customizable options.
						</p>
					</div>
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
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Format & Beautify</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Syntax Validation</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Custom Indentation</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Key Sorting</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
									<span className="text-gray-700 dark:text-gray-300">Error Detection</span>
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
								<Link
									href="/tools/json/converter"
									className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
								>
									<div className="flex items-center gap-3">
										<FileJson className="h-5 w-5 text-blue-600" />
										<div className="flex-1">
											<h4 className="font-medium text-gray-900 dark:text-white">JSON Converter</h4>
											<p className="text-gray-600 text-sm dark:text-gray-400">
												Convert JSON to various formats like XML, CSV, YAML
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
