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

				<ThemeToggle />
			</div>
		</header>
	);
}
