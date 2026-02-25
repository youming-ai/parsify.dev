'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTextStats } from '@/hooks/use-text-stats';
import {
  ArrowsClockwise,
  ChartBar,
  Chat,
  Clock,
  Copy,
  DownloadSimple,
  Eye,
  EyeSlash,
  FileText,
  Gear,
  Hash,
  TextT,
  UploadSimple,
} from '@phosphor-icons/react';
import { useCallback, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';

interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

interface CharFrequency {
  char: string;
  count: number;
  percentage: number;
}

export function TextInspector() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includePunctuation, setIncludePunctuation] = useState(true);

  const stats = useTextStats(text, includeNumbers, includePunctuation);

  const wordFrequency: WordFrequency[] = (() => {
    if (!text) return [];
    const wordPattern = includeNumbers
      ? /[a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?/g
      : /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
    const words = (text.match(wordPattern) || [])
      .map((word) => (caseSensitive ? word : word.toLowerCase()))
      .filter((word) => word.length > 2);
    const frequencyMap: Record<string, number> = {};
    for (const word of words) {
      frequencyMap[word] = (frequencyMap[word] || 0) + 1;
    }
    return Object.entries(frequencyMap)
      .map(([word, count]) => ({
        word,
        count,
        percentage: (count / words.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  })();

  const charFrequency: CharFrequency[] = (() => {
    if (!text) return [];
    const chars = text.split('');
    let relevantChars = chars;
    if (!includePunctuation) {
      relevantChars = chars.filter((char) => /[a-zA-Z0-9\s]/.test(char));
    }
    const frequencyMap: Record<string, number> = {};
    for (const char of relevantChars) {
      const key = caseSensitive ? char : char.toLowerCase();
      if (key.trim()) {
        frequencyMap[key] = (frequencyMap[key] || 0) + 1;
      }
    }
    const totalRelevantChars = Object.values(frequencyMap).reduce((sum, count) => sum + count, 0);
    return Object.entries(frequencyMap)
      .map(([char, count]) => ({
        char,
        count,
        percentage: (count / totalRelevantChars) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  })();

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  const generateReport = useCallback(() => {
    const report = `
Text Analysis Report
===================

Basic Statistics:
- Characters: ${stats.characters} (${stats.charactersNoSpaces} without spaces)
- Words: ${stats.words}
- Lines: ${stats.lines}
- Paragraphs: ${stats.paragraphs}
- Sentences: ${stats.sentences}

Readability:
- Average word length: ${stats.avgWordLength.toFixed(1)} characters
- Average sentence length: ${stats.avgSentenceLength.toFixed(1)} words
- Reading time: ${stats.readingTime} minutes
- Speaking time: ${stats.speakingTime} minutes
- Lexical density: ${stats.lexicalDensity.toFixed(1)}%
- Readability score: ${Math.max(0, Math.min(100, stats.readabilityScore)).toFixed(1)}/100

Top 10 Words:
${wordFrequency
  .slice(0, 10)
  .map((wf, i) => `${i + 1}. ${wf.word}: ${wf.count} times (${wf.percentage.toFixed(1)}%)`)
  .join('\n')}

Text content:
${text.substring(0, 500)}${text.length > 500 ? '...' : ''}
    `.trim();

    return report;
  }, [stats, text, wordFrequency]);

  const downloadReport = useCallback(() => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateReport]);

  const readFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const getReadabilityLevel = (score: number) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-600' };
    if (score >= 80) return { level: 'Easy', color: 'text-green-500' };
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-500' };
    if (score >= 60) return { level: 'Standard', color: 'text-yellow-600' };
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-500' };
    if (score >= 30) return { level: 'Difficult', color: 'text-red-500' };
    return { level: 'Very Difficult', color: 'text-red-600' };
  };

  const readability = getReadabilityLevel(stats.readabilityScore);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Text Input
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.characters} chars</Badge>
              <Badge variant="secondary">{stats.words} words</Badge>
            </div>
          </CardTitle>
          <CardDescription>Paste your text or upload a file to analyze</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="file"
              accept=".txt,.md,.csv"
              onChange={readFile}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="flex items-center gap-2"
            >
              <UploadSimple className="h-4 w-4" />
              Upload File
            </Button>
            <Button
              variant="outline"
              onClick={() => setText('')}
              className="flex items-center gap-2"
            >
              <ArrowsClockwise className="h-4 w-4" />
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(text)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <Textarea
            placeholder="Enter your text here to analyze characters, words, lines, and more..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[400px]"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TextT className="mx-auto mb-2 h-8 w-8 text-blue-500" />
              <p className="font-bold text-2xl">{stats.characters}</p>
              <p className="text-muted-foreground text-sm">Characters</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Hash className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <p className="font-bold text-2xl">{stats.words}</p>
              <p className="text-muted-foreground text-sm">Words</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Chat className="mx-auto mb-2 h-8 w-8 text-purple-500" />
              <p className="font-bold text-2xl">{stats.sentences}</p>
              <p className="text-muted-foreground text-sm">Sentences</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-orange-500" />
              <p className="font-bold text-2xl">{stats.readingTime}</p>
              <p className="text-muted-foreground text-sm">Min Read</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ChartBar className="h-5 w-5" />
              Detailed Analysis
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold">Basic Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Characters (with spaces):</span>
                  <span className="font-mono">{stats.characters}</span>
                </div>
                <div className="flex justify-between">
                  <span>Characters (no spaces):</span>
                  <span className="font-mono">{stats.charactersNoSpaces}</span>
                </div>
                <div className="flex justify-between">
                  <span>Words:</span>
                  <span className="font-mono">{stats.words}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lines:</span>
                  <span className="font-mono">{stats.lines}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paragraphs:</span>
                  <span className="font-mono">{stats.paragraphs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sentences:</span>
                  <span className="font-mono">{stats.sentences}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Readability Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Avg Word Length:</span>
                  <span className="font-mono">{stats.avgWordLength.toFixed(1)} chars</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Sentence Length:</span>
                  <span className="font-mono">{stats.avgSentenceLength.toFixed(1)} words</span>
                </div>
                <div className="flex justify-between">
                  <span>Reading Time:</span>
                  <span className="font-mono">{stats.readingTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Speaking Time:</span>
                  <span className="font-mono">{stats.speakingTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Lexical Density:</span>
                  <span className="font-mono">{stats.lexicalDensity.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Readability:</span>
                  <span className={`font-mono ${readability.color}`}>{readability.level}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-sm">Readability Score</span>
              <span className={`text-sm ${readability.color}`}>{readability.level}</span>
            </div>
            <Progress value={Math.max(0, Math.min(100, stats.readabilityScore))} className="h-2" />
            <div className="mt-1 flex justify-between text-muted-foreground text-xs">
              <span>Very Difficult</span>
              <span>Standard</span>
              <span>Very Easy</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetails && (
        <Tabs defaultValue="words" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="words">Word Frequency</TabsTrigger>
            <TabsTrigger value="chars">Character Frequency</TabsTrigger>
          </TabsList>

          <TabsContent value="words" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Most Frequent Words
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wordFrequency.map((wf, index) => (
                    <div key={wf.word} className="flex items-center gap-2">
                      <span className="w-8 text-muted-foreground text-sm">#{index + 1}</span>
                      <span className="flex-1 font-mono">{wf.word}</span>
                      <span className="w-12 text-right text-muted-foreground text-sm">
                        {wf.count}
                      </span>
                      <div className="w-24">
                        <Progress value={wf.percentage * 5} className="h-2" />
                      </div>
                      <span className="w-12 text-right text-muted-foreground text-xs">
                        {wf.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chars" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TextT className="h-5 w-5" />
                  Most Frequent Characters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {charFrequency.map((cf, index) => (
                    <div key={cf.char} className="flex items-center gap-2">
                      <span className="w-8 text-muted-foreground text-sm">#{index + 1}</span>
                      <span className="w-8 font-mono">{cf.char}</span>
                      <span className="w-12 text-right text-muted-foreground text-sm">
                        {cf.count}
                      </span>
                      <div className="w-24">
                        <Progress value={cf.percentage * 5} className="h-2" />
                      </div>
                      <span className="w-12 text-right text-muted-foreground text-xs">
                        {cf.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gear className="h-5 w-5" />
            Analysis Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={setCaseSensitive}
              />
              <Label htmlFor="case-sensitive">Case Sensitive</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="include-numbers"
                checked={includeNumbers}
                onCheckedChange={setIncludeNumbers}
              />
              <Label htmlFor="include-numbers">Include Numbers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="include-punctuation"
                checked={includePunctuation}
                onCheckedChange={setIncludePunctuation}
              />
              <Label htmlFor="include-punctuation">Include Punctuation</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DownloadSimple className="h-5 w-5" />
            Export Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(generateReport())}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Report
            </Button>
            <Button onClick={downloadReport} className="flex items-center gap-2">
              <DownloadSimple className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
