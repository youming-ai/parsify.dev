import { AppShell } from '~/components/layout/app-shell';
import '~/styles/app.css';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRouteWithContext<object>()({
  component: RootComponent,
});
