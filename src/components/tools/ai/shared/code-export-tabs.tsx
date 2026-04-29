'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CodeExportTabsProps {
  examples: Record<string, string>;
}

export function CodeExportTabs({ examples }: CodeExportTabsProps) {
  const entries = Object.entries(examples);
  const defaultValue = entries[0]?.[0] ?? 'text';

  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        {entries.map(([name]) => (
          <TabsTrigger key={name} value={name}>
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
      {entries.map(([name, code]) => (
        <TabsContent key={name} value={name}>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            <code>{code}</code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  );
}
