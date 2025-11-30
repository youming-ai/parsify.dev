import { getToolById, toolsData } from '@/data/tools-data';
import { notFound, redirect } from 'next/navigation';

interface ToolPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all tools
export async function generateStaticParams() {
  return toolsData.map((tool) => ({
    slug: tool.id,
  }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolById(slug);

  // If tool doesn't exist, show 404
  if (!tool) {
    notFound();
  }

  // Redirect to the actual tool page
  // All 28 tools now have their own dedicated pages in /tools/{category}/{tool-id}
  redirect(tool.href);
}
