'use client';

import { FileConverter } from '@/components/tools/file/file-converter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function FileConverterPage() {
	return (
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
				<span className="font-medium text-gray-900">File Converter</span>
			</nav>

			{/* Tool Header */}
			<div className="mb-6">
				<div className="mb-4 flex items-center gap-3">
					<FileText className="h-8 w-8 text-blue-600" />
					<div>
						<h1 className="font-bold text-3xl text-gray-900 dark:text-white">
							File Converter
						</h1>
						<div className="flex items-center gap-2">
							<Badge variant="outline">Beginner</Badge>
							<Badge variant="default">Beta</Badge>
							<Badge variant="secondary">New</Badge>
						</div>
					</div>
				</div>
				<p className="text-gray-600 dark:text-gray-400">
					Convert between different file formats including images, documents, and data files
				</p>
			</div>

			{/* Tool Component */}
			<div className="space-y-6">
				<FileConverter />

				{/* Supported Formats */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Supported Formats</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid md:grid-cols-3 gap-6">
							<div>
								<h4 className="font-medium mb-3">Images</h4>
								<div className="space-y-2">
									<div className="text-sm">
										<span className="font-medium">Input:</span> JPG, PNG, GIF, BMP, WebP, SVG
									</div>
									<div className="text-sm">
										<span className="font-medium">Output:</span> JPG, PNG, WebP, BMP
									</div>
								</div>
							</div>
							<div>
								<h4 className="font-medium mb-3">Documents</h4>
								<div className="space-y-2">
									<div className="text-sm">
										<span className="font-medium">Input:</span> PDF, DOC, DOCX, TXT, RTF
									</div>
									<div className="text-sm">
										<span className="font-medium">Output:</span> PDF, TXT, HTML
									</div>
								</div>
							</div>
							<div>
								<h4 className="font-medium mb-3">Data Files</h4>
								<div className="space-y-2">
									<div className="text-sm">
										<span className="font-medium">Input:</span> JSON, XML, CSV, XLSX, YAML
									</div>
									<div className="text-sm">
										<span className="font-medium">Output:</span> JSON, XML, CSV, YAML
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Features */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Features</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							<li className="flex items-start gap-2">
								<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
								<span className="text-gray-700 dark:text-gray-300">Batch processing - convert multiple files at once</span>
							</li>
							<li className="flex items-start gap-2">
								<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
								<span className="text-gray-700 dark:text-gray-300">Quality settings for image compression</span>
							</li>
							<li className="flex items-start gap-2">
								<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
								<span className="text-gray-700 dark:text-gray-300">Preview mode to verify conversions</span>
							</li>
							<li className="flex items-start gap-2">
								<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
								<span className="text-gray-700 dark:text-gray-300">Metadata preservation options</span>
							</li>
							<li className="flex items-start gap-2">
								<div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
								<span className="text-gray-700 dark:text-gray-300">Client-side processing - files never leave your browser</span>
							</li>
						</ul>
					</CardContent>
				</Card>

				{/* How it Works */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">How it Works</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h4 className="font-medium mb-2">1. Upload Files</h4>
							<p className="text-gray-600 text-sm">
								Drag and drop or select files to convert. Maximum 10 files per batch.
							</p>
						</div>
						<div>
							<h4 className="font-medium mb-2">2. Choose Output Format</h4>
							<p className="text-gray-600 text-sm">
								Select your desired output format from the available options based on your file type.
							</p>
						</div>
						<div>
							<h4 className="font-medium mb-2">3. Configure Options</h4>
							<p className="text-gray-600 text-sm">
								Adjust quality, compression, and other settings specific to your chosen format.
							</p>
						</div>
						<div>
							<h4 className="font-medium mb-2">4. Convert & Download</h4>
							<p className="text-gray-600 text-sm">
								Process your files and download the converted versions individually or as a ZIP archive.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
