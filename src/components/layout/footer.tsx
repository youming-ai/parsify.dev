import { Code, Github, Mail, Twitter } from 'lucide-react';
import Link from 'next/link';

const navigation = {
  tools: [
    { name: 'JSON Tools', href: '/tools/json' },
    { name: 'Code Tools', href: '/tools/code' },
    { name: 'All Tools', href: '/tools' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/docs/api' },
    { name: 'Examples', href: '/docs/examples' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
};

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/parsify-dev/parsify',
    icon: Github,
  },
  { name: 'Twitter', href: 'https://twitter.com/parsifydev', icon: Twitter },
  { name: 'Email', href: 'mailto:contact@parsify.dev', icon: Mail },
];

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <Code className="h-6 w-6" />
              <span className="font-bold">Parsify.dev</span>
            </Link>
            <p className="mt-4 max-w-xs text-muted-foreground text-sm">
              A comprehensive online platform for developers with JSON processing, code formatting,
              and execution tools. Built with modern web technologies.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Tools</h3>
            <ul className="mt-4 space-y-3">
              {navigation.tools.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground text-sm hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Resources</h3>
            <ul className="mt-4 space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground text-sm hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Company</h3>
            <ul className="mt-4 space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground text-sm hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Legal</h3>
            <ul className="mt-4 space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground text-sm hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Parsify.dev. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
