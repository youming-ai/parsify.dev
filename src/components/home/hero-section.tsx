'use client';

import { Link } from '@/components/link';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { iconNames } from '@/lib/icon-map';
import { SEO_CONFIG } from '@/lib/seo-config';
import type { Tool } from '@/types/tools';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

const difficultyColor: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

const subcategories = [
  { id: 'all', name: 'All' },
  { id: 'Tokens & Cost', name: 'Tokens & Cost' },
  { id: 'Tool Calling', name: 'Tool Calling' },
  { id: 'RAG & Data', name: 'RAG & Data' },
  { id: 'API Debugging', name: 'API Debugging' },
  { id: 'Models & Providers', name: 'Models & Providers' },
];

interface HeroSectionProps {
  tools: Tool[];
}

function ToolCard({ tool }: { tool: Tool }) {
  const iconName = iconNames[tool.icon] || 'Database';
  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon name={iconName} className="h-5 w-5" />
        </div>
        {tool.isPopular && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Popular
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="mb-1 font-semibold tracking-tight text-foreground">{tool.name}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tool.difficulty && (
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${difficultyColor[tool.difficulty]}`}
          >
            {tool.difficulty === 'beginner'
              ? 'Beginner'
              : tool.difficulty === 'intermediate'
                ? 'Intermediate'
                : 'Advanced'}
          </span>
        )}
        {tool.features.slice(0, 3).map((f) => (
          <span
            key={f}
            className="rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {f}
          </span>
        ))}
      </div>
    </Link>
  );
}

export function HeroSection({ tools }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    let result = [...tools];
    if (activeCategory !== 'all') {
      result = result.filter((t) => t.subcategory === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tools, activeCategory, searchQuery]);

  return (
    <>
      <section className="relative flex flex-col items-center justify-center overflow-hidden border-b p-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

        <div className="relative z-10 mx-auto flex w-full flex-col items-center justify-center space-y-8 text-center">
          <div className="fade-in animate-in slide-in-from-bottom-4 duration-500">
            <span className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm">
              <span className="relative mr-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              {SEO_CONFIG.SITE_NAME}
            </span>
          </div>

          <h1 className="fade-in animate-in slide-in-from-bottom-6 mx-auto text-4xl font-bold tracking-tight duration-700 sm:text-5xl md:text-6xl lg:text-7xl whitespace-nowrap">
            {SEO_CONFIG.DEFAULT_TITLE.split(' - ')[1]}
          </h1>

          <p className="fade-in animate-in slide-in-from-bottom-8 mx-auto max-w-2xl text-lg text-muted-foreground duration-900 sm:text-xl">
            {SEO_CONFIG.DEFAULT_DESCRIPTION}
          </p>

          <div className="fade-in animate-in slide-in-from-bottom-10 w-full max-w-md duration-1000">
            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 opacity-50 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
              <div className="relative flex items-center rounded-lg bg-background shadow-sm ring-1 ring-border transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
                <MagnifyingGlass
                  className="ml-3 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <label htmlFor="tool-search" className="sr-only">
                  Search tools
                </label>
                <Input
                  id="tool-search"
                  type="text"
                  placeholder="Search tools (e.g., token counter, cost calculator, SSE parser)..."
                  className="h-12 border-0 bg-transparent py-3 pl-3 pr-4 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveCategory('all');
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mr-3 rounded-full p-1 opacity-50 hover:bg-muted hover:opacity-100"
                    aria-label="Clear search"
                  >
                    <span className="sr-only">Clear</span>
                    <div className="h-4 w-4 text-sm font-medium">\u2715</div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-6 py-10 lg:px-8">
        {/* Subcategory filters */}
        <div className="mb-10 flex flex-wrap items-center gap-2">
          {subcategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count =
              cat.id === 'all'
                ? tools.length
                : tools.filter((t) => t.subcategory === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.name}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="fade-in zoom-in animate-in py-20 text-center duration-500">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <MagnifyingGlass className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No tools found</h3>
            <p className="mx-auto max-w-sm text-muted-foreground">
              Couldn&apos;t find any tools matching &quot;{searchQuery}&quot;. Try different
              keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
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
