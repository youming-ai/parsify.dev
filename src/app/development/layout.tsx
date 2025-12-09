import { ToolsLayout } from '@/components/layout/tools-layout';

export default function DevelopmentLayout({ children }: { children: React.ReactNode }) {
    return <ToolsLayout showSidebar={false}>{children}</ToolsLayout>;
}
