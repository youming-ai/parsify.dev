'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeHtml } from '@/lib/security/sanitize';
import { Check, CheckCircle, Code, Copy, Play, Trash, WarningCircle } from '@phosphor-icons/react';
import { useCallback, useMemo, useState } from 'react';

interface MatchResult {
  fullMatch: string;
  groups: string[];
  index: number;
  input: string;
}

interface RegexFlag {
  key: string;
  label: string;
  description: string;
}

const FLAGS: RegexFlag[] = [
  { key: 'g', label: 'Global', description: 'Match all occurrences' },
  { key: 'i', label: 'Case Insensitive', description: 'Ignore case' },
  { key: 'm', label: 'Multiline', description: 'Treat string as multiple lines' },
  { key: 's', label: 'Dot All', description: 'Dot matches newlines' },
  { key: 'u', label: 'Unicode', description: 'Enable Unicode support' },
];

const COMMON_PATTERNS = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { name: 'URL', pattern: "https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+" },
  { name: 'Phone (US)', pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}' },
  { name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: 'Date (ISO)', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { name: 'Hex Color', pattern: '#[0-9A-Fa-f]{6}\\b|#[0-9A-Fa-f]{3}\\b' },
  {
    name: 'UUID',
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
  },
  { name: 'HTML Tag', pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>.*?</\\1>' },
];

const SAMPLE_TEXTS = {
  mixed: `Contact: john.doe@example.com
Phone: (555) 123-4567
Website: https://example.com/path
Color: #FF5733
Date: 2024-01-15
IP: 192.168.1.1`,
  code: `function greet(name: string) {
  const uuid = "550e8400-e29b-41d4-a716-446655440000";
  console.log(\`Hello, \${name}!\`);
  return true;
}`,
};

export function RegexValidator() {
  const [pattern, setPattern] = useState('');
  const [replacement, setReplacement] = useState('');
  const [testString, setTestString] = useState(SAMPLE_TEXTS.mixed);
  const [selectedFlags, setSelectedFlags] = useState<Set<string>>(new Set(['g']));
  const [activeTab, setActiveTab] = useState<'match' | 'replace'>('match');
  const [copied, setCopied] = useState(false);

  const toggleFlag = useCallback((flag: string) => {
    setSelectedFlags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(flag)) {
        newSet.delete(flag);
      } else {
        newSet.add(flag);
      }
      return newSet;
    });
  }, []);

  const flagsString = useMemo(() => {
    return Array.from(selectedFlags).join('');
  }, [selectedFlags]);

  const { matches, highlightedText, replacedText } = useMemo(() => {
    if (!pattern) {
      return {
        matches: [],
        highlightedText: testString,
        replacedText: testString,
      };
    }

    try {
      const matchResults: MatchResult[] = [];
      const rxForMatching = new RegExp(pattern, flagsString);

      if (selectedFlags.has('g')) {
        let match: RegExpExecArray | null;
        while ((match = rxForMatching.exec(testString)) !== null) {
          matchResults.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
            input: testString.substring(
              Math.max(0, match.index - 10),
              match.index + match[0].length + 10
            ),
          });
          if (match.index === rxForMatching.lastIndex) {
            rxForMatching.lastIndex++;
          }
        }
      } else {
        const match = rxForMatching.exec(testString);
        if (match) {
          matchResults.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
            input: testString.substring(
              Math.max(0, match.index - 10),
              match.index + match[0].length + 10
            ),
          });
        }
      }

      let highlighted = testString;
      let offset = 0;
      for (const m of matchResults) {
        const before = highlighted.substring(0, m.index + offset);
        const after = highlighted.substring(m.index + offset + m.fullMatch.length);
        const wrapped = `<mark class="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">${m.fullMatch}</mark>`;
        highlighted = before + wrapped + after;
        offset += wrapped.length - m.fullMatch.length;
      }

      const rx = new RegExp(pattern, flagsString);
      const replaced = testString.replace(rx, replacement);

      return {
        matches: matchResults,
        highlightedText: highlighted,
        replacedText: replaced,
      };
    } catch (_e) {
      return {
        matches: [],
        highlightedText: testString,
        replacedText: testString,
      };
    }
  }, [pattern, flagsString, testString, replacement, selectedFlags]);

  const error = useMemo(() => {
    if (!pattern) return null;
    try {
      new RegExp(pattern, flagsString);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid regex';
    }
  }, [pattern, flagsString]);

  const handleCopyPattern = useCallback(async () => {
    if (!pattern) return;
    const fullPattern = `/${pattern}/${flagsString}`;
    await navigator.clipboard.writeText(fullPattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pattern, flagsString]);

  const handleLoadSample = useCallback((text: string) => {
    setTestString(text);
  }, []);

  const handleLoadPattern = useCallback((p: string) => {
    setPattern(p);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-sm">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Regex Validator</CardTitle>
              <CardDescription>
                Test and validate regular expressions with live highlighting
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Live</Badge>
            <Badge variant="outline">Offline</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Regular Expression</Label>
            <Button variant="ghost" size="sm" onClick={handleCopyPattern} disabled={!pattern}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
            <span className="text-lg text-muted-foreground">/</span>
            <Input
              placeholder="Enter regex pattern..."
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="border-0 bg-transparent font-mono focus-visible:ring-0"
            />
            <span className="text-lg text-muted-foreground">/</span>
            <span className="font-mono text-sm text-blue-500">{flagsString}</span>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <WarningCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {!error && pattern && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" />
              Valid regex - {matches.length} match{matches.length !== 1 ? 'es' : ''} found
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Flags</Label>
          <div className="flex flex-wrap gap-2">
            {FLAGS.map((flag) => (
              <Button
                key={flag.key}
                variant={selectedFlags.has(flag.key) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFlag(flag.key)}
                title={flag.description}
                aria-pressed={selectedFlags.has(flag.key)}
                aria-label={flag.description}
              >
                <code className="mr-1">{flag.key}</code>
                {flag.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Common Patterns</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_PATTERNS.map((p) => (
              <Button
                key={p.name}
                variant="outline"
                size="sm"
                onClick={() => handleLoadPattern(p.pattern)}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'match' | 'replace')}>
          <TabsList className="mb-4">
            <TabsTrigger value="match">
              <Play className="mr-2 h-4 w-4" />
              Match
            </TabsTrigger>
            <TabsTrigger value="replace">
              <Code className="mr-2 h-4 w-4" />
              Replace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="match" className="mt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Test String</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoadSample(SAMPLE_TEXTS.mixed)}
                  >
                    Sample: Mixed
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoadSample(SAMPLE_TEXTS.code)}
                  >
                    Sample: Code
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setTestString('')}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Enter test string..."
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="min-h-[400px] font-mono text-sm resize-none"
              />
            </div>

            {pattern && !error && (
              <div className="space-y-2">
                <Label>Highlighted Matches</Label>
                <div
                  className="min-h-[400px] whitespace-pre-wrap rounded-lg border bg-background p-4 font-mono text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedText) }}
                />
              </div>
            )}

            {matches.length > 0 && (
              <div className="space-y-2">
                <Label>Match Details ({matches.length})</Label>
                <div className="max-h-[600px] overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">#</th>
                        <th className="px-4 py-2 text-left font-medium">Match</th>
                        <th className="px-4 py-2 text-left font-medium">Index</th>
                        <th className="px-4 py-2 text-left font-medium">Groups</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((m, idx) => (
                        <tr key={idx} className="border-t border-border/50">
                          <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-2 font-mono">
                            <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-900/30 dark:text-yellow-200">
                              {m.fullMatch}
                            </code>
                          </td>
                          <td className="px-4 py-2">{m.index}</td>
                          <td className="px-4 py-2">
                            {m.groups.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {m.groups.map((g, gi) => (
                                  <Badge key={gi} variant="outline" className="font-mono text-xs">
                                    ${gi + 1}: {g}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">
                                No groups
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="replace" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label>Replacement String</Label>
              <Input
                placeholder="Enter replacement (use $1, $2 for groups)..."
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Input</Label>
              <Textarea
                placeholder="Enter test string..."
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="min-h-[400px] font-mono text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Result</Label>
              <div className="min-h-[400px] whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 font-mono text-sm">
                {replacedText}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border p-4 bg-card">
          <h3 className="mb-3 text-sm font-medium">Quick Reference</h3>
          <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">.</code>{' '}
              <span>Any character</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">\d</code>{' '}
              <span>Digit [0-9]</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">\w</code>{' '}
              <span>Word char</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">\s</code>{' '}
              <span>Whitespace</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">^</code>{' '}
              <span>Start of line</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">$</code>{' '}
              <span>End of line</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">*</code>{' '}
              <span>0 or more</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">+</code>{' '}
              <span>1 or more</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">?</code>{' '}
              <span>0 or 1</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">
                {'{n}'}
              </code>{' '}
              <span>Exactly n</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">
                [abc]
              </code>{' '}
              <span>Character class</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">
                (group)
              </code>{' '}
              <span>Capture group</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
