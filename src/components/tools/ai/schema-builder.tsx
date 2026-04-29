'use client';

import { CodeExportTabs } from '@/components/tools/ai/shared/code-export-tabs';
import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type SchemaParameter, buildProviderFormats } from '@/lib/llm/schema-builder';
import { useMemo, useState } from 'react';

const typeOptions = ['string', 'number', 'boolean', 'array', 'object', 'enum'] as const;

export function SchemaBuilder() {
  const [name, setName] = useState('search_web');
  const [description, setDescription] = useState('Search the web.');
  const [parameters, setParameters] = useState<SchemaParameter[]>([
    {
      id: '1',
      name: 'query',
      type: 'string',
      required: true,
      description: 'Search query',
      enumValues: '',
    },
  ]);

  const outputs = useMemo(() => {
    const formats = buildProviderFormats({ name, description, parameters });
    return Object.fromEntries(
      Object.entries(formats).map(([key, value]) => [key, JSON.stringify(value, null, 2)])
    );
  }, [name, description, parameters]);

  const addParameter = () => {
    const id = String(Date.now());
    setParameters((prev) => [
      ...prev,
      { id, name: '', type: 'string', required: false, description: '', enumValues: '' },
    ]);
  };

  const updateParameter = (id: string, field: keyof SchemaParameter, value: string | boolean) => {
    setParameters((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removeParameter = (id: string) => {
    setParameters((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tool Schema Builder</CardTitle>
          <CardDescription>
            Build LLM tool schemas with form rows and export provider-specific tool formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Function name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Parameters</CardTitle>
            <CardDescription>Define parameter rows for your tool schema.</CardDescription>
          </div>
          <Button type="button" onClick={addParameter} size="sm">
            Add parameter
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {parameters.map((param) => (
            <div key={param.id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Parameter</span>
                {parameters.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParameter(param.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-5">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={param.name}
                    onChange={(event) => updateParameter(param.id, 'name', event.target.value)}
                    placeholder="query"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={param.type}
                    onValueChange={(value) => updateParameter(param.id, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Required</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={param.required}
                      onChange={(event) =>
                        updateParameter(param.id, 'required', event.target.checked)
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {param.required ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={param.description}
                    onChange={(event) =>
                      updateParameter(param.id, 'description', event.target.value)
                    }
                    placeholder="Description"
                  />
                </div>
                {param.type === 'enum' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Enum values</Label>
                    <Input
                      value={param.enumValues ?? ''}
                      onChange={(event) =>
                        updateParameter(param.id, 'enumValues', event.target.value)
                      }
                      placeholder="a, b, c"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <MetricCard label="Parameters" value={parameters.length} />
        <MetricCard label="Required" value={parameters.filter((p) => p.required).length} />
        <MetricCard
          label="Schema types"
          value={[...new Set(parameters.map((p) => p.type))].join(', ')}
        />
        <MetricCard
          label="Valid output"
          value={
            parameters.filter((p) => p.name.trim().length > 0).length === parameters.length
              ? '✅ valid'
              : '⚠️ incomplete'
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeExportTabs examples={outputs} />
        </CardContent>
      </Card>

      <RelatedTools toolId="schema-builder" />
    </div>
  );
}
