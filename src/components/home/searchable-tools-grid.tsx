'use client';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { iconNames } from '@/lib/icon-map';
import type { Tool } from '@/types/tools';
import { MagnifyingGlass } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

interface SearchableToolsGridProps {
  tools: Tool[];
  categories: string[];
}

export function SearchableToolsGrid({ tools, categories }: SearchableToolsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCategories = categories.filter((category) =>
    filteredTools.some((tool) => tool.category === category)
  );

  const groupedTools = filteredCategories.reduce(
    (acc, category) => {
      acc[category] = filteredTools.filter((tool) => tool.category === category);
      return acc;
    },
    {} as Record<string, Tool[]>
  );

  const ToolCard = ({ tool }: { tool: Tool }) => {
    const iconName = iconNames[tool.icon] || 'Database';

    return (
      <Link
        href={tool.href}
        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon name={iconName} className="h-5 w-5" />
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
    <>
      <div className="fade-in animate-in slide-in-from-bottom-10 mx-auto w-full max-w-md duration-1000">
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 opacity-50 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
          <div className="relative flex items-center rounded-lg bg-background shadow-sm ring-1 ring-border transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
            <MagnifyingGlass className="ml-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="tool-search" className="sr-only">
              Search tools
            </label>
            <Input
              id="tool-search"
              type="text"
              placeholder="Search tools (e.g., JSON, Base64, Formatting)..."
              className="h-12 border-0 bg-transparent py-3 pl-3 pr-4 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mr-3 rounded-full p-1 opacity-50 hover:bg-muted hover:opacity-100"
                aria-label="Clear search"
              >
                <span className="sr-only">Clear</span>
                <div className="h-4 w-4 text-sm font-medium">✕</div>
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-screen-2xl px-6 py-16 lg:px-8">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category, categoryIndex) => (
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
                  {groupedTools[category]?.length ?? 0}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupedTools[category]?.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="fade-in zoom-in animate-in py-20 text-center duration-500">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <MagnifyingGlass className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No tools found</h3>
            <p className="mx-auto max-w-sm text-muted-foreground">
              We couldn't find any tools matching "{searchQuery}". Try adjusting your search terms.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>
    </>
  );
}
