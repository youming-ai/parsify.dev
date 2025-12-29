'use client';
import { MainLayout } from '@/components/layout/main-layout';
import { toolsData } from '@/data/tools-data';
import { iconMap } from '@/lib/icon-map';
import type { Tool } from '@/types/tools';
import { Database } from '@phosphor-icons/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CategoryViewProps {
  categoryName: string;
  categorySlug: string;
}

export function CategoryView({ categoryName, categorySlug }: CategoryViewProps) {
  const categoryTools = toolsData.filter((tool) => tool.category === categoryName);

  if (categoryTools.length === 0) {
    notFound();
  }

  const ToolCard = ({ tool }: { tool: Tool }) => {
    const IconComponent = iconMap[tool.icon] || Database;

    return (
      <Link
        href={tool.href}
        className="group relative flex flex-col justify-between overflow-hidden rounded-none border-2 border-foreground bg-card p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all duration-200 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] dark:hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.2)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-none border-2 border-foreground bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <IconComponent className="h-5 w-5" />
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold tracking-tight text-foreground">{tool.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{tool.description}</p>
        </div>
      </Link>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <section className="border-b bg-muted/30 px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-screen-2xl">
            <Link
              href="/"
              className="text-sm font-medium text-primary hover:underline mb-4 inline-block"
            >
              ← All Tools
            </Link>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{categoryName}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              A collection of professional utilities for {categoryName.toLowerCase()}. All tools run
              locally in your browser for maximum privacy.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
