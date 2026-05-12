'use client';

import { Link } from '@/components/link';
import { Github, Mail, Twitter } from 'lucide-react';

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/youming-ai/parsify.dev',
    icon: Github,
  },
  { name: 'X', href: 'https://x.com/um1ng_x', icon: Twitter },
  { name: 'Email', href: 'mailto:ikashue@gmail.com', icon: Mail },
];

export function Footer() {
  return (
    <footer className="border-t bg-background text-foreground">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-8">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Parsify.dev
        </p>

        <div className="flex items-center gap-4">
          {socialLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
