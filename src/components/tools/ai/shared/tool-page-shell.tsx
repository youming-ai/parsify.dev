import type { ReactNode } from 'react';

interface ToolPageShellProps {
  title: string;
  description: string;
  backHref: string;
  children: ReactNode;
}

export function ToolPageShell({ title, description, backHref, children }: ToolPageShellProps) {
  return (
    <div className="space-y-6">
      <a
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <title>Back</title>
          <path d="m15 18-6-6 6-6" />
        </svg>
        All tools
      </a>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">{children}</div>
    </div>
  );
}
