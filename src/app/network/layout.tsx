import { ToolsLayout } from '@/components/layout/tools-layout';

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
    return <ToolsLayout showSidebar={false}>{children}</ToolsLayout>;
}
