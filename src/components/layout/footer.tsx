'use client';

import { toolsData } from '@/data/tools-data';
import { Command, EnvelopeSimple, GithubLogo, TwitterLogo } from '@phosphor-icons/react';
import Link from 'next/link';

const footerSections = [
  {
    title: 'Data Format',
    items: toolsData
      .filter((t) => t.category === 'Data Format & Conversion')
      .map((t) => ({ name: t.name, href: t.href })),
  },
  {
    title: 'Security',
    items: toolsData
      .filter((t) => t.category === 'Security & Authentication')
      .map((t) => ({ name: t.name, href: t.href })),
  },
  {
    title: 'Development',
    items: toolsData
      .filter((t) => t.category === 'Development & Testing')
      .map((t) => ({ name: t.name, href: t.href })),
  },
  {
    title: 'Network & Utility',
    items: toolsData
      .filter((t) => t.category === 'Network & Utility')
      .map((t) => ({ name: t.name, href: t.href })),
  },
];

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/youming-ai/parsify.dev',
    icon: GithubLogo,
  },
  { name: 'Twitter', href: 'https://x.com/um1ng_x', icon: TwitterLogo },
  { name: 'Email', href: 'mailto:ikashue@gmail.com', icon: EnvelopeSimple },
];

export function Footer() {
  return (
    <footer className="border-t bg-background text-foreground">
      <div className="mx-auto max-w-screen-2xl px-6 py-16 lg:px-8 md:py-24">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Column */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Command className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">Parsify.dev</span>
            </Link>
          </div>

          {/* Navigation Grid */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            {footerSections
              .map((section, idx) => (
                <div
                  key={section.title}
                  className={idx % 2 === 0 ? 'md:grid md:grid-cols-2 md:gap-8' : ''}
                >
                  {idx % 2 === 0 ? (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold leading-6 text-foreground">
                          {section.title}
                        </h3>
                        <ul className="mt-6 space-y-4">
                          {section.items.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className="text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {footerSections[idx + 1] && (
                        <div className="mt-10 md:mt-0">
                          <h3 className="text-sm font-semibold leading-6 text-foreground">
                            {footerSections[idx + 1]?.title}
                          </h3>
                          <ul className="mt-6 space-y-4">
                            {footerSections[idx + 1]?.items.map((item) => (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className="text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              ))
              .filter((_, idx) => idx % 2 === 0)}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-border/50 pt-8 sm:mt-20 lg:mt-24">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <p className="text-xs leading-5 text-muted-foreground order-2 md:order-1">
              &copy; {new Date().getFullYear()} Parsify.dev. All rights reserved.
            </p>

            <div className="flex items-center gap-6 order-1 md:order-2">
              <div className="flex gap-4">
                {socialLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>

              <div className="hidden h-4 w-[1px] bg-border md:block" />

              <span className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                All Systems Normal
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
