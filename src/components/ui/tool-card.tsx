'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tool } from '@/types/tools';

interface ToolCardProps extends React.HTMLAttributes<HTMLDivElement> {
	tool: Tool;
	showNewBadge?: boolean;
	showPopularBadge?: boolean;
}

const ToolCard = React.forwardRef<HTMLDivElement, ToolCardProps>(
	({ className, tool, showNewBadge = true, showPopularBadge = true, ...props }, ref) => {
		return (
			<Card
				ref={ref}
				className={cn(
					'group hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 dark:border-gray-700',
					'hover:border-primary dark:hover:border-primary',
					className,
				)}
				{...props}
			>
				<Link href={tool.href} className="block">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div
								className={cn(
									'w-10 h-10 rounded-lg flex items-center justify-center',
									'bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800',
									'transition-colors duration-200',
								)}
							>
								<span className="text-blue-600 dark:text-blue-400 text-lg">{tool.icon}</span>
							</div>
							<div className="flex-1 min-w-0">
								<CardTitle className="text-lg group-hover:text-primary transition-colors">{tool.name}</CardTitle>
								{tool.isNew && showNewBadge && (
									<Badge variant="secondary" className="mt-1 text-xs">
										NEW
									</Badge>
								)}
								{tool.isPopular && showPopularBadge && (
									<Badge variant="outline" className="mt-1 text-xs ml-2">
										POPULAR
									</Badge>
								)}
							</div>
						</div>
						<CardDescription className="line-clamp-2 mt-2">{tool.description}</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex flex-wrap gap-1 mb-4">
							{tool.features.slice(0, 3).map((feature) => (
								<Badge key={feature} variant="secondary" className="text-xs px-2 py-0.5">
									{feature}
								</Badge>
							))}
							{tool.features.length > 3 && (
								<Badge variant="outline" className="text-xs px-2 py-0.5">
									+{tool.features.length - 3}
								</Badge>
							)}
						</div>
						<div className="flex items-center justify-between">
							<Badge
								variant={
									tool.difficulty === 'beginner'
										? 'secondary'
										: tool.difficulty === 'intermediate'
											? 'default'
											: 'destructive'
								}
								className="text-xs"
							>
								{tool.difficulty}
							</Badge>
							<Button
								variant="outline"
								size="sm"
								className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
							>
								Use Tool →
							</Button>
						</div>
					</CardContent>
				</Link>
			</Card>
		);
	},
);
ToolCard.displayName = 'ToolCard';

export { ToolCard };
