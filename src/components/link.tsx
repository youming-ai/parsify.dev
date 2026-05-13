import { Link as TanStackLink } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export function Link({ href, children, className, ...props }: LinkProps) {
  if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    );
  }

  return (
    <TanStackLink to={href} className={className} {...props}>
      {children}
    </TanStackLink>
  );
}
