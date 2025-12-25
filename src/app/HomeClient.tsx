'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Input } from '@/components/ui/input';
import { toolsData } from '@/data/tools-data';
import { iconMap } from '@/lib/icon-map';
import type { Tool } from '@/types/tools';
import { Database, MagnifyingGlass } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

export default function HomeClient() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tools
  const filteredTools = toolsData.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by category
  const categories = Array.from(new Set(filteredTools.map((tool) => tool.category)));
  const groupedTools = categories.reduce(
    (acc, category) => {
      acc[category] = filteredTools.filter((tool) => tool.category === category);
      return acc;
    },
    {} as Record<string, Tool[]>
  );

  const ToolCard = ({ tool }: { tool: Tool }) => {
    const IconComponent = iconMap[tool.icon] || Database;

    return (
      <Link
        href={tool.href}
        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
        {/* Modern Hero Section */}
        <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden border-b px-6 py-24">
          {/* Subtle Background Gradient */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

          <div className="relative z-10 mx-auto flex flex-col items-center justify-center space-y-8 text-center">
            {/* Pill Badge */}
            <div className="fade-in animate-in slide-in-from-bottom-4 duration-500">
              <span className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm">
                <span className="relative mr-2 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                v1.0.0 Now Available
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="fade-in animate-in slide-in-from-bottom-6 mx-auto text-4xl font-bold tracking-tight duration-700 sm:text-5xl md:text-6xl lg:text-7xl whitespace-nowrap">
              Essential Tools for <span style={{ color: '#f54e00' }}>Developers</span>
            </h1>

            {/* Description */}
            <p className="fade-in animate-in slide-in-from-bottom-8 mx-auto max-w-2xl text-lg text-muted-foreground duration-900 sm:text-xl">
              A privacy-first collection of utilities for your daily workflow. No server-side
              processing—your data never leaves your browser.
            </p>

            {/* Modern MagnifyingGlass Box */}
            <div className="fade-in animate-in slide-in-from-bottom-10 mx-auto w-full max-w-lg duration-1000">
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 opacity-50 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
                <div className="relative flex items-center rounded-lg bg-background shadow-sm ring-1 ring-border transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
                  <MagnifyingGlass
                    className="ml-3 h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <label htmlFor="tool-search" className="sr-only">
                    MagnifyingGlass tools
                  </label>
                  <Input
                    id="tool-search"
                    type="text"
                    placeholder="MagnifyingGlass tools (e.g., JSON, Base64, Formatting)..."
                    className="h-12 border-0 bg-transparent py-3 pl-3 pr-4 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mr-3 rounded-full p-1 opacity-50 hover:bg-muted hover:opacity-100"
                    >
                      <span className="sr-only">Clear</span>
                      <div className="h-4 w-4 text-sm font-medium">✕</div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="mx-auto max-w-screen-2xl px-6 py-16 lg:px-8">
          {categories.length > 0 ? (
            categories.map((category, categoryIndex) => (
              <div
                key={category}
                className="fade-in slide-in-from-bottom-8 mb-16 animate-in fill-mode-backwards duration-700 last:mb-0"
                style={{ animationDelay: `${categoryIndex * 100}ms` }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {category}
                  </h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {groupedTools[category].length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedTools[category].map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="fade-in zoom-in animate-in py-20 text-center duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <MagnifyingGlass className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No tools found</h3>
              <p className="mx-auto max-w-sm text-muted-foreground">
                We couldn't find any tools matching "{searchQuery}". Try adjusting your search
                terms.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Clear MagnifyingGlass
              </button>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
