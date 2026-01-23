import { Footer } from './footer';
import { Header } from './header';

interface ToolsLayoutProps {
  children: React.ReactNode;
}

export function ToolsLayout({ children }: ToolsLayoutProps) {
  return (
    <div className="flex flex-col bg-background">
      <Header />
      <main className="w-full">{children}</main>
      <Footer />
    </div>
  );
}
