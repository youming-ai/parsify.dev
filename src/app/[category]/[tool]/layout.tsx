import { ToolsLayout as ToolsLayoutComponent } from '@/components/layout/tools-layout';
import type { Metadata } from 'next';
import type React from 'react';

interface ToolLayoutProps {
  params: Promise<{
    category: string;
    tool: string;
  }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: ToolLayoutProps): Promise<Metadata> {
  const { category, tool } = await params;

  // Format category name for display
  const formatCategory = (cat: string) => {
    return cat
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatToolName = (t: string) => {
    return t
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const categoryDisplayName = formatCategory(category);
  const toolDisplayName = formatToolName(tool);

  return {
    title: `${toolDisplayName} - ${categoryDisplayName} | Parsify.dev`,
    description: `${toolDisplayName} - Professional ${categoryDisplayName.toLowerCase()} tool. Fast, secure, and runs entirely in your browser.`,
    keywords: [
      toolDisplayName,
      categoryDisplayName.toLowerCase(),
      'developer tools',
      'online tool',
    ],
    openGraph: {
      title: `${toolDisplayName} - ${categoryDisplayName}`,
      description: `${toolDisplayName} - Professional ${categoryDisplayName.toLowerCase()} tool.`,
      type: 'website',
    },
  };
}

export default function ToolLayout({ children }: ToolLayoutProps) {
  return <ToolsLayoutComponent>{children}</ToolsLayoutComponent>;
}
