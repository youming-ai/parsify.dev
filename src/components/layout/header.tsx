'use client';
import { Github, Mail, Twitter } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/youming-ai/parsify.dev',
    icon: Github,
  },
  { name: 'Twitter', href: 'https://x.com/um1ng_x', icon: Twitter },
  { name: 'Email', href: 'mailto:ikashue@gmail.com', icon: Mail },
];

export function Header() {
  return (
    <header className="fixed top-6 left-1/2 z-50 w-full max-w-[95%] -translate-x-1/2 rounded-full border bg-background/70 backdrop-blur-xl shadow-sm md:max-w-3xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 font-bold text-xl tracking-tight transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="hidden bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent sm:inline-block">
            Parsify
          </span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r pr-4">
            {socialLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
