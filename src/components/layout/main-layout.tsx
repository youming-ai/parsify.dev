'use client';

import { Footer } from './footer';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
