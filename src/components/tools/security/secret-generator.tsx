'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowsClockwise, Key } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

const charset = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?',
};

const generateSecret = (
  length: number,
  options: { lower: boolean; upper: boolean; numbers: boolean; symbols: boolean; prefix?: string }
) => {
  let pool = '';
  if (options.lower) pool += charset.lower;
  if (options.upper) pool += charset.upper;
  if (options.numbers) pool += charset.numbers;
  if (options.symbols) pool += charset.symbols;
  if (!pool) pool = charset.lower + charset.numbers;

  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes)
    .map((value) => pool[value % pool.length])
    .join('');
  return `${options.prefix ?? ''}${chars}`;
};

export const SecretGenerator = () => {
  const [length, setLength] = useState(32);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [secret, setSecret] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setSecret(
      generateSecret(length, {
        lower: useLower,
        upper: useUpper,
        numbers: useNumbers,
        symbols: useSymbols,
        prefix,
      })
    );
  }, []);

  const handleGenerate = () => {
    const next = generateSecret(length, {
      lower: useLower,
      upper: useUpper,
      numbers: useNumbers,
      symbols: useSymbols,
      prefix,
    });
    setSecret(next);
    setHistory((prev) => [next, ...prev].slice(0, 5));
  };

  const handleCopy = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
  };

  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Key className="h-5 w-5" /> Secret Generator
        </CardTitle>
        <CardDescription>Generate API keys, secrets, and tokens with one click.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-2">
              <Label>Length: {length} characters</Label>
              <Slider
                value={[length]}
                min={8}
                max={128}
                step={1}
                onValueChange={(vals) => setLength(vals[0])}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="lower">Lowercase</Label>
                <Switch id="lower" checked={useLower} onCheckedChange={setUseLower} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="upper">Uppercase</Label>
                <Switch id="upper" checked={useUpper} onCheckedChange={setUseUpper} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="numbers">Numbers</Label>
                <Switch id="numbers" checked={useNumbers} onCheckedChange={setUseNumbers} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="symbols">Symbols</Label>
                <Switch id="symbols" checked={useSymbols} onCheckedChange={setUseSymbols} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix (optional)</Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="sk_live_"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerate}>
                <ArrowsClockwise className="mr-2 h-4 w-4" /> Generate
              </Button>
              <Button variant="outline" onClick={handleCopy} disabled={!secret}>
                Copy
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Generated Secret</Label>
            <Textarea readOnly className="h-32 font-mono" value={secret} />
            <Label>Recent</Label>
            <Textarea
              readOnly
              className="h-40 font-mono"
              value={history.join('\n')}
              placeholder="No history yet"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecretGenerator;
