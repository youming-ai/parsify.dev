import type { Router } from '@tanstack/react-router';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

function NotFound() {
  return (
    <main className="container mx-auto max-w-7xl px-6 py-24 text-center lg:px-8">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a
        href="/"
        className="mt-8 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Back to home
      </a>
    </main>
  );
}

export function getRouter(): Router<typeof routeTree> {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
