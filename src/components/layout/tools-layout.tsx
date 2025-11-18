import { cn } from "@/lib/utils";
import { Footer } from "./footer";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface ToolsLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function ToolsLayout({ children, showSidebar = false }: ToolsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {showSidebar && (
          <aside className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-700">
            {/* Sidebar content would go here if needed */}
          </aside>
        )}
        <main className={cn("flex-1", showSidebar ? "ml-64" : "")}>{children}</main>
      </div>
      <Footer />
    </div>
  );
}
