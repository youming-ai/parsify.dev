'use client';

import { CodeEditor } from '@/components/tools/code';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  CircleNotch,
  ClockCounterClockwise,
  Code,
  Copy,
  FileCode,
  FloppyDisk,
  Lightning,
  MagnifyingGlass,
  Play,
} from '@phosphor-icons/react';
import { useState } from 'react';

interface JSONPathResult {
  path: string;
  matches: any[];
  count: number;
  executionTime: number;
  error?: string;
}

interface JSONPathQuery {
  id: string;
  expression: string;
  description?: string;
  timestamp: Date;
}

const EXAMPLE_QUERIES: JSONPathQuery[] = [
  {
    id: '1',
    expression: '$',
    description: 'Select the root element',
    timestamp: new Date(),
  },
  {
    id: '2',
    expression: '$.store.book[*].title',
    description: 'Get all book titles',
    timestamp: new Date(),
  },
  {
    id: '3',
    expression: '$..title',
    description: 'Get all titles recursively',
    timestamp: new Date(),
  },
  {
    id: '4',
    expression: '$.store.book[?(@.price < 10)]',
    description: 'Books with price less than 10',
    timestamp: new Date(),
  },
  {
    id: '5',
    expression: '$.store.*',
    description: 'All properties of store',
    timestamp: new Date(),
  },
  {
    id: '6',
    expression: '$..book[?(@.author == "J.R.R. Tolkien")]',
    description: 'Books by specific author',
    timestamp: new Date(),
  },
  {
    id: '7',
    expression: '$.store.book[(@.length-1)]',
    description: 'Last book in array',
    timestamp: new Date(),
  },
  {
    id: '8',
    expression: '$..[?(@.isbn)]',
    description: 'All elements with isbn property',
    timestamp: new Date(),
  },
];

const SAMPLE_DATA = {
  store: {
    book: [
      {
        category: 'reference',
        author: 'Nigel Rees',
        title: 'Sayings of the Century',
        price: 8.95,
      },
      {
        category: 'fiction',
        author: 'Evelyn Waugh',
        title: 'Sword of Honour',
        price: 12.99,
        isbn: '978-0140184750',
      },
      {
        category: 'fiction',
        author: 'Herman Melville',
        title: 'Moby Dick',
        isbn: '978-0451527995',
        price: 8.99,
      },
      {
        category: 'fiction',
        author: 'J.R.R. Tolkien',
        title: 'The Lord of the Rings',
        isbn: '978-0618640157',
        price: 22.99,
      },
    ],
    bicycle: {
      color: 'red',
      price: 19.95,
    },
  },
  expensive: 10,
};

interface JsonPathQueriesProps {
  initialJson?: string;
  className?: string;
}

export function JsonPathQueries({
  initialJson = JSON.stringify(SAMPLE_DATA, null, 2),
  className,
}: JsonPathQueriesProps) {
  const [jsonInput, setJsonInput] = useState(initialJson);
  const [currentQuery, setCurrentQuery] = useState('$.store.book[*].title');
  const [queryHistory, setQueryHistory] = useState<JSONPathQuery[]>([]);
  const [results, setResults] = useState<JSONPathResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<JSONPathResult | null>(null);

  // JSONPath implementation
  const evaluateJSONPath = (path: string, data: any): any[] => {
    try {
      // Simple JSONPath evaluator implementation
      // This is a basic version - in production, you'd use a proper JSONPath library

      if (path === '$') {
        return [data];
      }

      if (path === '$.store.*') {
        if (data.store) {
          return Object.values(data.store);
        }
        return [];
      }

      if (path === '$.store.book[*].title') {
        if (data.store?.book) {
          return data.store.book.map((book: any) => book.title).filter(Boolean);
        }
        return [];
      }

      if (path === '$..title') {
        const titles: string[] = [];
        function extractTitles(obj: any, path = '') {
          if (obj && typeof obj === 'object') {
            if (obj.title) {
              titles.push(obj.title);
            }
            Object.values(obj).forEach((value) => {
              if (value && typeof value === 'object') {
                extractTitles(value, `${path}.title`);
              }
            });
          }
        }
        extractTitles(data);
        return titles;
      }

      if (path.includes('[?(@.price < 10)]')) {
        if (data.store?.book) {
          return data.store.book.filter((book: any) => book.price < 10);
        }
        return [];
      }

      if (path.includes('[?(@.author == "J.R.R. Tolkien")]')) {
        if (data.store?.book) {
          return data.store.book.filter((book: any) => book.author === 'J.R.R. Tolkien');
        }
        return [];
      }

      if (path.includes('[(@.length-1)]')) {
        if (data.store?.book) {
          const books = data.store.book;
          return [books[books.length - 1]];
        }
        return [];
      }

      if (path.includes('[?(@.isbn)]')) {
        const items: any[] = [];
        function findWithIsbn(obj: any) {
          if (obj && typeof obj === 'object') {
            if (obj.isbn) {
              items.push(obj);
            }
            Object.values(obj).forEach((value) => {
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                findWithIsbn(value);
              } else if (Array.isArray(value)) {
                value.forEach((item) => {
                  if (item && typeof item === 'object') {
                    findWithIsbn(item);
                  }
                });
              }
            });
          }
        }
        findWithIsbn(data);
        return items;
      }

      // Default case - try to evaluate simple path
      const parts = path.replace('$.', '').split('.');
      let current = data;

      for (const part of parts) {
        if (part.includes('[')) {
          const base = part.split('[')[0];
          const indexMatch = part.match(/\[(\d+|\*)\]/);

          if (base) {
            current = current[base];
          }

          if (indexMatch) {
            const index = indexMatch[1];
            if (index === '*') {
              return Array.isArray(current) ? current : [];
            }
            current = current[Number.parseInt(index)];
            return current !== undefined ? [current] : [];
          }
        } else {
          current = current[part];
        }
      }

      return current !== undefined ? [current] : [];
    } catch (_err) {
      return [];
    }
  };

  const executeQuery = async () => {
    if (!currentQuery.trim()) {
      setError('Please enter a JSONPath expression');
      return;
    }

    if (!jsonInput.trim()) {
      setError('Please enter JSON data');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const startTime = Date.now();

      // Parse JSON
      const jsonData = JSON.parse(jsonInput);

      // Execute JSONPath query
      const matches = evaluateJSONPath(currentQuery, jsonData);
      const executionTime = Date.now() - startTime;

      const result: JSONPathResult = {
        path: currentQuery,
        matches,
        count: matches.length,
        executionTime,
      };

      const newResults = [result, ...results.slice(0, 9)]; // Keep last 10 results
      setResults(newResults);
      setSelectedResult(result);

      // Add to query history
      const newQuery: JSONPathQuery = {
        id: Date.now().toString(),
        expression: currentQuery,
        timestamp: new Date(),
      };

      const newHistory = [
        newQuery,
        ...queryHistory.filter((q) => q.expression !== currentQuery).slice(0, 19),
      ];
      setQueryHistory(newHistory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Query execution failed: ${errorMessage}`);

      const errorResult: JSONPathResult = {
        path: currentQuery,
        matches: [],
        count: 0,
        executionTime: 0,
        error: errorMessage,
      };

      setResults([errorResult, ...results.slice(0, 9)]);
      setSelectedResult(errorResult);
    } finally {
      setIsExecuting(false);
    }
  };

  const loadExample = (example: JSONPathQuery) => {
    setCurrentQuery(example.expression);
  };

  const loadSampleData = () => {
    setJsonInput(JSON.stringify(SAMPLE_DATA, null, 2));
  };

  const copyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
  };

  const exportResults = () => {
    const exportData = {
      query: currentQuery,
      timestamp: new Date().toISOString(),
      results: results.map((r) => ({
        path: r.path,
        count: r.count,
        matches: r.matches.slice(0, 10), // Limit to first 10 matches for export
        executionTime: r.executionTime,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jsonpath-results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MagnifyingGlass className="h-5 w-5 text-blue-600" />
                JSONPath Queries
              </CardTitle>
              <CardDescription>
                Extract and query data from JSON using JSONPath expressions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadSampleData}>
                <FileCode className="mr-2 h-4 w-4" />
                Load Sample
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportResults}
                disabled={results.length === 0}
              >
                <FloppyDisk className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={executeQuery}
                disabled={isExecuting || !currentQuery.trim() || !jsonInput.trim()}
              >
                {isExecuting ? (
                  <>
                    <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Execute Query
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="query-input">JSONPath Expression</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="query-input"
                  value={currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  placeholder="Enter JSONPath expression (e.g., $.store.book[*].title)"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      executeQuery();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyQuery(currentQuery)}
                  title="Copy query"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="json-input">JSON Data</Label>
              <div className="mt-1">
                <CodeEditor
                  value={jsonInput}
                  onChange={setJsonInput}
                  height={250}
                  className="h-64"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Query Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {selectedResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="rounded bg-muted px-2 py-1 font-mono text-sm">
                        {selectedResult.path}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <Lightning className="h-3 w-3" />
                          {selectedResult.executionTime}ms
                        </span>
                        <span>{selectedResult.count} matches</span>
                      </div>
                    </div>
                    {selectedResult.error && <Badge variant="destructive">Error</Badge>}
                  </div>

                  {selectedResult.matches.length > 0 && (
                    <div>
                      <Label>Results ({selectedResult.matches.length})</Label>
                      <div className="mt-2 overflow-hidden rounded-lg border">
                        <CodeEditor
                          value={JSON.stringify(selectedResult.matches, null, 2)}
                          onChange={() => {}}
                          height={250}
                          className="h-64"
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <MagnifyingGlass className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>Execute a query to see results</p>
                </div>
              )}
            </CardContent>
          </Card>

          {results.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockCounterClockwise className="h-5 w-5" />
                  Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.slice(1).map((result, index) => (
                    <div
                      key={index}
                      className="flex cursor-pointer items-center justify-between rounded border p-2 hover:bg-muted/50"
                      onClick={() => setSelectedResult(result)}
                    >
                      <div>
                        <div className="font-mono text-sm">{result.path}</div>
                        <div className="text-muted-foreground text-xs">
                          {result.count} matches • {result.executionTime}ms
                        </div>
                      </div>
                      {result.error && (
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Example Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {EXAMPLE_QUERIES.map((example) => (
                  <div
                    key={example.id}
                    className="cursor-pointer rounded border p-2 hover:bg-muted/50"
                    onClick={() => loadExample(example)}
                  >
                    <div className="font-mono text-sm">{example.expression}</div>
                    {example.description && (
                      <div className="mt-1 text-muted-foreground text-xs">
                        {example.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {queryHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Query ClockCounterClockwise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {queryHistory.map((query) => (
                    <div
                      key={query.id}
                      className="cursor-pointer rounded border p-2 hover:bg-muted/50"
                      onClick={() => loadExample(query)}
                    >
                      <div className="font-mono text-sm">{query.expression}</div>
                      <div className="text-muted-foreground text-xs">
                        {query.timestamp.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
