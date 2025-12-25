'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { ArrowsClockwise, Copy } from '@phosphor-icons/react';
import { useState } from 'react';

const LOREM_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc. Nullam arcu. Aliquam consequat. Curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Aenean magna nisl, mollis quis, molestie eu, feugiat in, orci. In hac habitasse platea dictumst.`;

export function LoremIpsumGenerator() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [output, setOutput] = useState('');

  const generateLorem = () => {
    let result = '';
    const sentences = LOREM_TEXT.replace(/([.?!])\s*(?=[A-Z])/g, '$1|').split('|');
    const words = LOREM_TEXT.replace(/[.,?!]/g, '').split(/\s+/);

    if (type === 'paragraphs') {
      const paragraphs = LOREM_TEXT.split('\n\n');
      const repeatedParagraphs = [];
      for (let i = 0; i < count; i++) {
        repeatedParagraphs.push(paragraphs[i % paragraphs.length]);
      }
      result = repeatedParagraphs.join('\n\n');
    } else if (type === 'sentences') {
      const selectedSentences = [];
      for (let i = 0; i < count; i++) {
        selectedSentences.push(sentences[i % sentences.length]);
      }
      result = selectedSentences.join(' ');
    } else {
      const selectedWords = [];
      for (let i = 0; i < count; i++) {
        selectedWords.push(words[i % words.length]);
      }
      result = selectedWords.join(' ');
    }

    setOutput(result);
  };

  // Generate initial content
  useState(() => {
    generateLorem();
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lorem Ipsum Generator</CardTitle>
          <CardDescription>Generate placeholder text for your designs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-32 space-y-2">
              <Label>Count</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Number.parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="w-48 space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraphs">Paragraphs</SelectItem>
                  <SelectItem value="sentences">Sentences</SelectItem>
                  <SelectItem value="words">Words</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateLorem} className="gap-2">
              <ArrowsClockwise className="h-4 w-4" />
              Generate
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Output</Label>
            <Textarea value={output} readOnly className="h-64 resize-none bg-muted dark:bg-card" />
            <div className="flex justify-end">
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoremIpsumGenerator;
