import type React from 'react';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/theme-provider';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1">
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
