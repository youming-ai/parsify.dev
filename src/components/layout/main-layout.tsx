'use client';

import { cn } from '@/lib/utils';
import { Footer } from './footer';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

import { useState } from 'react';

export function MainLayout({ children, showSidebar = false }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            showSidebar ? (isSidebarCollapsed ? 'md:ml-[70px]' : 'md:ml-64') : ''
          )}
        >
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
