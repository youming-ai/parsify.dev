import { Command, Github, Mail, Twitter } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight transition-opacity hover:opacity-80"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Command className="h-3.5 w-3.5" />
          </div>
          <span>Parsify</span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            {socialLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
          <div className="h-4 w-[1px] bg-border mx-2" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
