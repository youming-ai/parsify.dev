'use client';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChevronDown, Code, FileJson, Menu, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from './theme-toggle';

const tools = [
	{
		title: 'JSON Tools',
		href: '/tools/json',
		description: 'Format, validate, and transform JSON data',
	},
	{
		title: 'Code Execution',
		href: '/tools/code',
		description: 'Execute and debug code in browser',
	},
	{
		title: 'File Processing',
		href: '/tools/file',
		description: 'Process and convert files',
	},
];

export function Header() {
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter:bg-white/60] dark:border-gray-800 dark:bg-gray-900/95">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				{/* Logo */}
				<Link href="/" className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white">
					<FileJson className="h-8 w-8 text-blue-600" />
					<span>Parsify.dev</span>
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center space-x-6">
					<Link href="/tools" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
						Tools
					</Link>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex items-center space-x-1">
								<Code className="h-4 w-4" />
								<span className="hidden sm:inline">Tools</span>
								<ChevronDown className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{tools.map((tool) => (
								<DropdownMenuItem key={tool.href} asChild>
									<Link href={tool.href} className="w-full">
										<div>
											<div className="font-medium">{tool.title}</div>
											<div className="text-sm text-gray-500">{tool.description}</div>
										</div>
									</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>

				{/* Desktop Actions */}
				<div className="hidden md:flex items-center space-x-4">
					<ThemeToggle />
					<Button variant="outline" size="sm">
						<Wrench className="mr-2 h-4 w-4" />
						Quick Actions
					</Button>
				</div>

				{/* Mobile Navigation */}
				<div className="md:hidden flex items-center space-x-2">
					<ThemeToggle />
					<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon">
								<Menu className="h-6 w-6" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-64">
							<div className="flex flex-col gap-4 p-6">
								<div className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white">
									<FileJson className="h-8 w-8 text-blue-600" />
									<span>Parsify.dev</span>
								</div>
								<nav className="flex flex-col space-y-2">
									<Link
										href="/tools"
										className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
										onClick={() => setIsSheetOpen(false)}
									>
										Tools
									</Link>
								</nav>
								<div className="flex items-center justify-between">
									<ThemeToggle />
									<Button variant="outline" size="sm">
										<Wrench className="mr-2 h-4 w-4" />
										Quick Actions
									</Button>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
