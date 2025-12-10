'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Code2,
  Play,
  Regex,
  Trash2,
} from 'lucide-react';
import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
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

export default function RegexValidatorPage() {
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

  const { regex, error, matches, highlightedText, replacedText } = useMemo(() => {
    if (!pattern) {
      return {
        regex: null,
        error: null,
        matches: [],
        highlightedText: testString,
        replacedText: testString,
      };
    }

    try {
      const rx = new RegExp(pattern, flagsString);
      const matchResults: MatchResult[] = [];
      let match: RegExpExecArray | null;
      const rxForMatching = new RegExp(pattern, flagsString);

      // Find all matches
      if (selectedFlags.has('g')) {
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
          // Prevent infinite loops with zero-length matches
          if (match.index === rxForMatching.lastIndex) {
            rxForMatching.lastIndex++;
          }
        }
      } else {
        match = rxForMatching.exec(testString);
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

      // Create highlighted text
      let highlighted = testString;
      let offset = 0;
      for (const m of matchResults) {
        const before = highlighted.substring(0, m.index + offset);
        const after = highlighted.substring(m.index + offset + m.fullMatch.length);
        const wrapped = `<mark class="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">${m.fullMatch}</mark>`;
        highlighted = before + wrapped + after;
        offset += wrapped.length - m.fullMatch.length;
      }

      // Replace text
      const replaced = testString.replace(rx, replacement);

      return {
        regex: rx,
        error: null,
        matches: matchResults,
        highlightedText: highlighted,
        replacedText: replaced,
      };
    } catch (e) {
      return {
        regex: null,
        error: e instanceof Error ? e.message : 'Invalid regex',
        matches: [],
        highlightedText: testString,
        replacedText: testString,
      };
    }
  }, [pattern, flagsString, testString, replacement, selectedFlags]);

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
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="REGEX VALIDATOR"
        description="Test and validate regular expressions with live highlighting. Explains your regex pattern and groups."
        category="Development"
        icon={<Regex className="h-8 w-8" />}
      />
      <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
                <Regex className="h-5 w-5" />
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
          {/* Pattern Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Regular Expression</Label>
              <Button variant="ghost" size="sm" onClick={handleCopyPattern} disabled={!pattern}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-800">
              <span className="text-lg text-slate-400">/</span>
              <Input
                placeholder="Enter regex pattern..."
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="border-0 bg-transparent font-mono focus-visible:ring-0"
              />
              <span className="text-lg text-slate-400">/</span>
              <span className="font-mono text-sm text-blue-500">{flagsString}</span>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {!error && pattern && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                Valid regex - {matches.length} match{matches.length !== 1 ? 'es' : ''} found
              </div>
            )}
          </div>

          {/* Flags */}
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
                >
                  <code className="mr-1">{flag.key}</code>
                  {flag.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Common Patterns */}
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'match' | 'replace')}>
            <TabsList>
              <TabsTrigger value="match">
                <Play className="mr-2 h-4 w-4" />
                Match
              </TabsTrigger>
              <TabsTrigger value="replace">
                <Code2 className="mr-2 h-4 w-4" />
                Replace
              </TabsTrigger>
            </TabsList>

            <TabsContent value="match" className="space-y-4">
              {/* Test String */}
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
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="Enter test string..."
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>

              {/* Highlighted Result */}
              {pattern && !error && (
                <div className="space-y-2">
                  <Label>Highlighted Matches</Label>
                  <div
                    className="min-h-[150px] whitespace-pre-wrap rounded-lg border bg-white p-4 font-mono text-sm dark:bg-slate-900"
                    dangerouslySetInnerHTML={{ __html: highlightedText }}
                  />
                </div>
              )}

              {/* Match Details */}
              {matches.length > 0 && (
                <div className="space-y-2">
                  <Label>Match Details ({matches.length})</Label>
                  <div className="max-h-[300px] overflow-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-left">Match</th>
                          <th className="px-4 py-2 text-left">Index</th>
                          <th className="px-4 py-2 text-left">Groups</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((m, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono">
                              <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-900">
                                {m.fullMatch}
                              </code>
                            </td>
                            <td className="px-4 py-2">{m.index}</td>
                            <td className="px-4 py-2">
                              {m.groups.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {m.groups.map((g, gi) => (
                                    <Badge key={gi} variant="outline">
                                      ${gi + 1}: {g}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400">No groups</span>
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

            <TabsContent value="replace" className="space-y-4">
              {/* Replacement */}
              <div className="space-y-2">
                <Label>Replacement String</Label>
                <Input
                  placeholder="Enter replacement (use $1, $2 for groups)..."
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Test String */}
              <div className="space-y-2">
                <Label>Input</Label>
                <Textarea
                  placeholder="Enter test string..."
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>

              {/* Result */}
              <div className="space-y-2">
                <Label>Result</Label>
                <div className="min-h-[100px] whitespace-pre-wrap rounded-lg border bg-slate-50 p-4 font-mono text-sm dark:bg-slate-800">
                  {replacedText}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Regex Reference */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-medium">Quick Reference</h3>
            <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <code className="text-blue-500">.</code> - Any character
              </div>
              <div>
                <code className="text-blue-500">\\d</code> - Digit [0-9]
              </div>
              <div>
                <code className="text-blue-500">\\w</code> - Word char
              </div>
              <div>
                <code className="text-blue-500">\\s</code> - Whitespace
              </div>
              <div>
                <code className="text-blue-500">^</code> - Start of line
              </div>
              <div>
                <code className="text-blue-500">$</code> - End of line
              </div>
              <div>
                <code className="text-blue-500">*</code> - 0 or more
              </div>
              <div>
                <code className="text-blue-500">+</code> - 1 or more
              </div>
              <div>
                <code className="text-blue-500">?</code> - 0 or 1
              </div>
              <div>
                <code className="text-blue-500">{'{n}'}</code> - Exactly n
              </div>
              <div>
                <code className="text-blue-500">[abc]</code> - Character class
              </div>
              <div>
                <code className="text-blue-500">(group)</code> - Capture group
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
