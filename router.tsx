import {
  createRouter as createTanStackRouter,
} from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type { Router } from '@tanstack/react-router';

export function createRouter(): Router<typeof routeTree> {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
