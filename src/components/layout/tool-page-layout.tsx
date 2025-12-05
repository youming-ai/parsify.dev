'use client';

interface ToolPageLayoutProps {
  title: string;
  description: string;
  category?: string;
  badges?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function ToolPageLayout({
  title: _title,
  description: _description,
  category: _category = 'Tools',
  badges: _badges,
  icon: _icon,
  children,
}: ToolPageLayoutProps) {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Tool Area */}
      <div>{children}</div>
    </div>
  );
}
