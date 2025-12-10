import { ToolsLayout } from '@/components/layout/tools-layout';

export default function DataFormatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolsLayout>
      <div className="relative min-h-screen">
        {/* Subtle pixel grid for all tools in this category */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
            backgroundSize: '24px 24px',
          }}
        />
        {children}
      </div>
    </ToolsLayout>
  );
}
