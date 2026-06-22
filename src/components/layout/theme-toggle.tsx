// Deprecated: kept as a placeholder for the future Vercel dark theme.
// Currently not rendered in the header. Clicking is a no-op.
import { Sun } from 'lucide-react';
import { Button } from '~/components/ui/button';

export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" disabled aria-label="Toggle theme (coming soon)">
      <Sun className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
