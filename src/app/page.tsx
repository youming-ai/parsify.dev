import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Parsify.dev - Online Developer Tools Platform | JSON & Code Processing',
	description:
		'Professional online tools for JSON processing, code execution, and file transformation. Secure, fast, and privacy-focused developer utilities.',
	keywords: 'JSON formatter, code executor, developer tools, online utilities, WASM sandbox, TypeScript tools',
	openGraph: {
		title: 'Parsify.dev - Online Developer Tools Platform',
		description: 'Professional online tools for JSON processing, code execution, and file transformation',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Parsify.dev - Online Developer Tools Platform',
		description: 'Professional online tools for JSON processing, code execution, and file transformation',
	},
};

import {
	ArrowRight,
	CheckCircle,
	Code,
	Cpu,
	FileJson,
	Globe,
	Lock,
	Play,
	Shield,
	Sparkles,
	Terminal,
	Zap,
} from 'lucide-react';

export default function Home() {
	const tools = [
		{
			id: 'json-tools',
			title: 'JSON Tools',
			description: 'Format, validate, and transform JSON data with advanced parsing capabilities',
			href: '/tools/json',
			icon: FileJson,
			features: ['Format & Beautify', 'Validate & Error Detection', 'Convert & Transform', 'Path Queries'],
			color: 'text-blue-600',
		},
		{
			id: 'code-execution',
			title: 'Code Execution',
			description: 'Execute code in a secure WASM sandbox with multiple language support',
			href: '/tools/code',
			icon: Terminal,
			features: ['Multi-language Support', 'Secure Sandboxing', 'Real-time Output', 'Debug Mode'],
			color: 'text-green-600',
		},
		{
			id: 'file-processing',
			title: 'File Processing',
			description: 'Process and transform various file formats with powerful tools',
			href: '/tools/file',
			icon: Code,
			features: ['Batch Processing', 'Format Conversion', 'Data Extraction', 'Validation'],
			color: 'text-purple-600',
		},
	];

	const features = [
		{
			icon: Zap,
			title: 'Lightning Fast',
			description: 'Built for performance with modern web technologies and optimized algorithms',
		},
		{
			icon: Shield,
			title: 'Secure Execution',
			description: 'Code runs in isolated WASM sandboxes ensuring complete security and isolation',
		},
		{
			icon: Globe,
			title: 'Browser Native',
			description: 'No server required - all processing happens directly in your browser',
		},
		{
			icon: Lock,
			title: 'Privacy First',
			description: 'Your data never leaves your browser. Complete privacy and data security',
		},
		{
			icon: Cpu,
			title: 'Modern Tech Stack',
			description: 'Built with TypeScript, Next.js, and Cloudflare Workers for reliability',
		},
		{
			icon: Sparkles,
			title: 'Developer Experience',
			description: 'Clean interface with powerful features designed for developers',
		},
	];

	return (
		<MainLayout>
			{/* Hero Section */}
			<section className="hero-section relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse-slow"></div>
				<div className="container mx-auto px-4 py-16 lg:py-24">
					<div className="mx-auto max-w-4xl text-center relative z-10">
						<Badge className="mb-6 badge-modern animate-fade-in">
							<Sparkles className="mr-2 h-4 w-4 animate-pulse" />
							Professional Developer Tools
						</Badge>
						<h1 className="mb-6 font-bold text-4xl text-gray-900 lg:text-6xl dark:text-white animate-slide-up">
							Powerful Tools for
							<span className="gradient-modern bg-clip-text text-transparent"> Modern Development</span>
						</h1>
						<p
							className="mx-auto mb-8 max-w-2xl text-gray-600 text-xl dark:text-gray-300 animate-slide-up"
							style={{ animationDelay: '0.2s' }}
						>
							Transform, validate, and execute your code with our suite of professional developer tools. Built for
							speed, security, and exceptional developer experience.
						</p>
						<div
							className="flex flex-col justify-center gap-4 sm:flex-row animate-fade-in"
							style={{ animationDelay: '0.4s' }}
						>
							<Link href="/tools">
								<Button size="lg" className="btn-modern btn-primary">
									<Play className="mr-2 h-5 w-5" />
									Try Tools Now
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
							<Link href="/docs">
								<Button size="lg" className="btn-modern btn-secondary">
									View Documentation
								</Button>
							</Link>
						</div>

						{/* Trust indicators */}
						<div
							className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500 text-sm dark:text-gray-400 animate-slide-up"
							style={{ animationDelay: '0.6s' }}
						>
							<div className="flex items-center">
								<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
								<span className="font-medium">No Registration Required</span>
							</div>
							<div className="flex items-center">
								<Shield className="mr-2 h-4 w-4 text-blue-500" />
								<span className="font-medium">100% Secure</span>
							</div>
							<div className="flex items-center">
								<Zap className="mr-2 h-4 w-4 text-yellow-500 animate-pulse" />
								<span className="font-medium">Instant Processing</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Tools Section */}
			<section className="py-16 lg:py-24 bg-white dark:bg-gray-800">
				<div className="container mx-auto px-4">
					<div className="mb-16 text-center">
						<h2 className="mb-4 font-bold text-3xl text-gray-900 lg:text-4xl dark:text-white animate-fade-in">
							Professional Development Tools
						</h2>
						<p
							className="mx-auto max-w-2xl text-gray-600 text-lg dark:text-gray-300 animate-fade-in"
							style={{ animationDelay: '0.2s' }}
						>
							Everything you need to process, transform, and execute your code efficiently
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						{tools.map((tool, index) => (
							<div key={tool.id} className="tool-card card-modern" style={{ animationDelay: `${0.1 * index}s` }}>
								<div className="tool-status-badge">
									<Badge
										className={
											tool.id === 'json-tools'
												? 'badge-stable'
												: tool.id === 'code-execution'
													? 'badge-stable'
													: tool.id === 'file-processing'
														? 'badge-beta'
														: 'badge-new'
										}
									>
										{tool.id === 'json-tools'
											? 'stable'
											: tool.id === 'code-execution'
												? 'stable'
												: tool.id === 'file-processing'
													? 'beta'
													: 'new'}
									</Badge>
								</div>
								<div className="tool-card-content">
									<div className="card-header-modern">
										<div
											className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${tool.color}/20 backdrop-blur-sm`}
										>
											<tool.icon className="h-6 w-6" />
										</div>
										<h3 className="text-xl font-semibold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
											{tool.title}
										</h3>
										<p className="text-gray-600 dark:text-gray-300">{tool.description}</p>
									</div>
									<div className="card-content-modern">
										<ul className="mb-6 space-y-2">
											{tool.features.map((feature) => (
												<li key={feature} className="flex items-center text-gray-600 text-sm dark:text-gray-300">
													<CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
													<span>{feature}</span>
												</li>
											))}
										</ul>
										<Link href={tool.href}>
											<Button className="btn-modern btn-primary w-full" size="lg">
												Try {tool.title}
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
				<div className="container mx-auto px-4">
					<div className="mb-16 text-center">
						<h2 className="mb-4 font-bold text-3xl text-gray-900 lg:text-4xl dark:text-white animate-fade-in">
							Why Choose Parsify.dev?
						</h2>
						<p
							className="mx-auto max-w-2xl text-gray-600 text-lg dark:text-gray-300 animate-fade-in"
							style={{ animationDelay: '0.2s' }}
						>
							Built with modern technologies and developer-first principles
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<div
								key={feature.title}
								className="text-center animate-slide-up"
								style={{ animationDelay: `${0.1 * index}s` }}
							>
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-glow">
									<feature.icon className="h-8 w-8 text-white" />
								</div>
								<h3 className="mb-2 font-semibold text-gray-900 text-xl dark:text-white">{feature.title}</h3>
								<p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-pulse-slow"></div>
				<div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
					<div className="text-center">
						<h2 className="mb-4 font-bold text-3xl lg:text-4xl text-white animate-fade-in">
							Ready to Boost Your Productivity?
						</h2>
						<p className="mx-auto mb-8 max-w-2xl text-xl opacity-90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
							Join thousands of developers who use our tools daily to streamline their workflow
						</p>
						<div
							className="flex flex-col justify-center gap-4 sm:flex-row animate-fade-in"
							style={{ animationDelay: '0.4s' }}
						>
							<Link href="/tools">
								<Button size="lg" className="btn-modern glass-effect text-white dark:text-gray-900 hover:bg-white/10">
									Start Using Tools
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
							<Link href="/docs">
								<Button
									size="lg"
									className="btn-modern glass-effect border-white/20 text-white hover:bg-white/10 dark:text-gray-900"
								>
									Read the Docs
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>
		</MainLayout>
	);
}
