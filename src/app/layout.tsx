import { ReactNode } from 'react';

interface RootLayoutProps {
  children: ReactNode;
}

// This layout is used for the root route only
export default function RootLayout({ children }: RootLayoutProps) {
  return children;
}
