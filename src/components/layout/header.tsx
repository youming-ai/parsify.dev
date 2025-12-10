import { Github, Mail, Twitter } from 'lucide-react';
import Link from 'next/link';
import { Press_Start_2P } from 'next/font/google';
import { ThemeToggle } from './theme-toggle';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
});

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
    <header className="fixed top-6 left-1/2 z-50 w-full max-w-[95%] -translate-x-1/2 border-2 border-foreground bg-background shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] md:max-w-3xl">
      <div className="mx-auto flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className={`${pixelFont.className} flex items-center space-x-3 text-xs tracking-widest transition-opacity hover:opacity-80`}
        >
          <div className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-primary/20 text-primary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5" // Thicker stroke for pixel feel
              strokeLinecap="square" // Square caps
              strokeLinejoin="miter" // Sharp joints
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="hidden text-foreground sm:inline-block">PARSIFY</span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 border-r-2 border-foreground/20 pr-4">
            {socialLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground hover:-translate-y-0.5 transition-transform duration-200"
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
