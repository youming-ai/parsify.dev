import { Icon } from '@/components/ui/icon';
import { iconNames } from '@/lib/icon-map';
import type { Tool } from '@/types/tools';
import Link from 'next/link';

interface ToolsGridProps {
  tools: Tool[];
  categories: string[];
}

function ToolCard({ tool }: { tool: Tool }) {
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
}

export function ToolsGrid({ tools, categories }: ToolsGridProps) {
  const groupedTools = categories.reduce(
    (acc, category) => {
      acc[category] = tools.filter((tool) => tool.category === category);
      return acc;
    },
    {} as Record<string, Tool[]>
  );

  return (
    <section className="mx-auto max-w-screen-2xl px-6 py-16 lg:px-8">
      {categories.map((category, categoryIndex) => (
        <div
          key={category}
          className="fade-in slide-in-from-bottom-8 mb-16 animate-in fill-mode-backwards duration-700 last:mb-0"
          style={{ animationDelay: `${categoryIndex * 100}ms` }}
        >
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{category}</h2>
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
      ))}
    </section>
  );
}
