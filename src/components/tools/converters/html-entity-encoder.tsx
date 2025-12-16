'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function HtmlEntityEncoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const handleEncode = () => {
    const textarea = document.createElement('textarea');
    textarea.innerText = input;
    setOutput(textarea.innerHTML);
  };

  const handleDecode = () => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = input;
    setOutput(textarea.value);
  };

  const process = () => {
    if (mode === 'encode') {
      handleEncode();
    } else {
      handleDecode();
    }
  };

  const toggleMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput(input);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTML Entity Encoder/Decoder</CardTitle>
          <CardDescription>
            Encode special characters to HTML entities or decode them back
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="flex items-center gap-4 rounded-lg bg-muted p-1 dark:bg-card">
              <Button
                variant={mode === 'encode' ? 'default' : 'ghost'}
                onClick={() => setMode('encode')}
                className="w-32"
              >
                Encode
              </Button>
              <Button
                variant={mode === 'decode' ? 'default' : 'ghost'}
                onClick={() => setMode('decode')}
                className="w-32"
              >
                Decode
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Input</Label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === 'encode' ? 'Enter text to encode...' : 'Enter HTML entities to decode...'
                }
                className="h-64 resize-none font-mono"
              />
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setInput('')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(input)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Output</Label>
              <Textarea
                value={output}
                readOnly
                placeholder="Result will appear here..."
                className="h-64 resize-none bg-muted font-mono dark:bg-card"
              />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(output)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Result
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={process} className="w-40">
              {mode === 'encode' ? 'Encode' : 'Decode'}
            </Button>
            <Button variant="outline" size="lg" onClick={toggleMode}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Swap
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HtmlEntityEncoder;
