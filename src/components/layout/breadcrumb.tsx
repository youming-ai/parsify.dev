import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      className={`flex items-center space-x-2 text-sm text-muted-foreground ${className}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="h-4 w-4 text-muted-foreground/50">›</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
              aria-current={index === items.length - 1 ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

export function ToolBreadcrumb({
  toolName,
  category,
  categoryHref,
  className = '',
}: {
  toolName: string;
  category: string;
  categoryHref: string;
  className?: string;
}) {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: category, href: categoryHref },
    { label: toolName },
  ];

  return <Breadcrumb items={items} className={className} />;
}

export function CategoryBreadcrumb({
  categoryName,
  categoryHref,
  className = '',
}: {
  categoryName: string;
  categoryHref: string;
  className?: string;
}) {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: categoryName, href: categoryHref },
  ];

  return <Breadcrumb items={items} className={className} />;
}
