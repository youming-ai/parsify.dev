import { cn } from '@/lib/utils';
import { Footer } from './footer';
import { Header } from './header';

interface ToolsLayoutProps {
  children: React.ReactNode;
}

export function ToolsLayout({ children }: ToolsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <main className={cn('flex-1 py-4 lg:pt-16 lg:pb-6')}>{children}</main>
      </div>
      <Footer />
    </div>
  );
}
