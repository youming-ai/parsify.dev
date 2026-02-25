'use client';

import { Badge } from '@/components/ui/badge';
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
import { toolsData } from '@/data/tools-data';
import {
  ArrowsClockwise,
  CheckCircle,
  Copy,
  Robot,
  Sparkle,
  Spinner,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';
import { toast } from 'sonner';

type DataFormat = 'auto' | 'json' | 'toml' | 'text' | 'base64';
type DetectedFormat = Exclude<DataFormat, 'auto'>;

const FORMAT_OPTIONS: Array<{ value: DataFormat; label: string }> = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'json', label: 'JSON' },
  { value: 'toml', label: 'TOML' },
  { value: 'text', label: 'Text' },
  { value: 'base64', label: 'Base64' },
];

const TARGET_OPTIONS: Array<{ value: DetectedFormat; label: string }> = [
  { value: 'json', label: 'JSON' },
  { value: 'toml', label: 'TOML' },
  { value: 'text', label: 'Text' },
  { value: 'base64', label: 'Base64' },
];

const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const SAMPLE_INPUT = `{
  "service": "parsify",
  "mode": "workbench",
  "features": ["parse", "validate", "convert"],
  "privacy": {
    "localOnly": true
  }
}`;

const BASE64_PATTERN = /^[A-Za-z0-9+/\s]+=*$/;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const encodeBase64 = (value: string): string => {
  let binary = '';
  for (const byte of textEncoder.encode(value)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const decodeBase64 = (value: string): string => {
  const normalized = value.replace(/\s+/g, '');
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return textDecoder.decode(bytes);
};

const detectFormat = (input: string): DetectedFormat => {
  const trimmed = input.trim();

  if (!trimmed) return 'text';

  try {
    JSON.parse(trimmed);
    return 'json';
  } catch (_e) {
    /* not JSON — try next format */
  }

  try {
    parseToml(trimmed);
    return 'toml';
  } catch (_e) {
    /* not TOML — try next format */
  }

  if (BASE64_PATTERN.test(trimmed)) {
    try {
      decodeBase64(trimmed);
      return 'base64';
    } catch (_e) {
      /* not valid base64 */
    }
  }

  return 'text';
};

const parseInput = (
  input: string,
  sourceFormat: DataFormat
): { value: unknown; detected: DetectedFormat } => {
  const detected = sourceFormat === 'auto' ? detectFormat(input) : sourceFormat;

  switch (detected) {
    case 'json':
      return { value: JSON.parse(input), detected };
    case 'toml':
      return { value: parseToml(input), detected };
    case 'base64':
      return { value: decodeBase64(input), detected };
    case 'text':
      return { value: input, detected };
    default:
      return { value: input, detected: 'text' };
  }
};

const stringifyJson = (value: unknown): string => {
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return JSON.stringify({ value }, null, 2);
    }
  }

  if (value === null || typeof value !== 'object') {
    return JSON.stringify({ value }, null, 2);
  }

  return JSON.stringify(value, null, 2);
};

const stringifyTomlOutput = (value: unknown): string => {
  if (isRecord(value)) return stringifyToml(value);

  if (typeof value === 'string') {
    const parsed = JSON.parse(value);
    if (isRecord(parsed)) return stringifyToml(parsed);
  }

  throw new Error('TOML output requires an object-like input.');
};

const serializeOutput = (value: unknown, targetFormat: DetectedFormat): string => {
  switch (targetFormat) {
    case 'json':
      return stringifyJson(value);
    case 'toml':
      return stringifyTomlOutput(value);
    case 'base64': {
      const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      return encodeBase64(text);
    }
    case 'text':
      return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    default:
      return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }
};

const runGroqRequest = async ({
  model,
  userPrompt,
}: {
  model: string;
  userPrompt: string;
}): Promise<string> => {
  const response = await fetch('/api/ai/groq', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: userPrompt,
    }),
  });

  const payload = (await response.json()) as { text?: string; error?: string };

  if (!response.ok || !payload.text) {
    throw new Error(payload.error || `Groq request failed (${response.status}).`);
  }

  return payload.text;
};

export default function DataWorkbench() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [output, setOutput] = useState('');
  const [sourceFormat, setSourceFormat] = useState<DataFormat>('auto');
  const [targetFormat, setTargetFormat] = useState<DetectedFormat>('toml');
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat>('json');
  const [error, setError] = useState('');
  const [model, setModel] = useState(GROQ_DEFAULT_MODEL);
  const [aiPrompt, setAiPrompt] = useState(
    'Explain issues in my data and propose corrected output for the selected target format.'
  );
  const [aiResult, setAiResult] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const quickLinks = useMemo(() => toolsData.filter((tool) => tool.href !== '/data-format'), []);

  const handleValidate = () => {
    try {
      const { detected } = parseInput(input, sourceFormat);
      setDetectedFormat(detected);
      setError('');
      toast.success(`Valid input (${detected.toUpperCase()})`);
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : 'Validation failed.';
      setError(message);
      toast.error(message);
    }
  };

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    try {
      const { value, detected } = parseInput(input, sourceFormat);
      const converted = serializeOutput(value, targetFormat);
      setDetectedFormat(detected);
      setOutput(converted);
      setError('');
      toast.success(`Converted ${detected.toUpperCase()} to ${targetFormat.toUpperCase()}`);
    } catch (conversionError) {
      const message =
        conversionError instanceof Error ? conversionError.message : 'Conversion failed.';
      setError(message);
      setOutput('');
      toast.error(message);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success('Output copied to clipboard');
  };

  const handleAiAssist = async () => {
    const activeModel = model.trim() || GROQ_DEFAULT_MODEL;
    const dataForAi = output || input;

    if (!dataForAi.trim()) {
      setAiError('No input or output data available for AI analysis.');
      return;
    }

    const contextPrompt = [
      `Source format setting: ${sourceFormat}`,
      `Detected format: ${detectedFormat}`,
      `Target format: ${targetFormat}`,
      error ? `Last conversion error: ${error}` : 'Last conversion error: none',
      '',
      `Instruction: ${aiPrompt}`,
      '',
      'Data:',
      dataForAi,
    ].join('\n');

    try {
      setAiLoading(true);
      setAiError('');
      const response = await runGroqRequest({
        model: activeModel,
        userPrompt: contextPrompt,
      });
      setAiResult(response);
      toast.success('AI assistant completed analysis');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'AI request failed.';
      setAiError(message);
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkle className="h-5 w-5" /> Unified Data Workbench
          </CardTitle>
          <CardDescription>
            Single workspace for parsing, validating, and converting structured developer data.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Transformer</CardTitle>
              <Badge variant={error ? 'destructive' : 'secondary'}>
                {error ? 'Needs Fix' : `Detected: ${detectedFormat.toUpperCase()}`}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Source Format</Label>
                <Select
                  value={sourceFormat}
                  onValueChange={(value) => setSourceFormat(value as DataFormat)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source format" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Format</Label>
                <Select
                  value={targetFormat}
                  onValueChange={(value) => setTargetFormat(value as DetectedFormat)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target format" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-[280px] resize-y font-mono text-sm"
              placeholder="Paste JSON / TOML / Base64 / text input"
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleValidate} variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" /> Validate
              </Button>
              <Button onClick={handleConvert}>
                <ArrowsClockwise className="mr-2 h-4 w-4" /> Convert
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setInput('');
                  setOutput('');
                  setError('');
                }}
              >
                <XCircle className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>

            <Textarea
              value={output}
              readOnly
              className="min-h-[220px] resize-y font-mono text-sm"
              placeholder="Converted output appears here"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              {error ? (
                <p className="flex items-center gap-1 text-destructive text-sm">
                  <WarningCircle className="h-4 w-4" /> {error}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Conversion runs entirely in your browser.
                </p>
              )}
              <Button variant="outline" onClick={handleCopy} disabled={!output}>
                <Copy className="mr-2 h-4 w-4" /> Copy Output
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Robot className="h-5 w-5" /> AI Assistant (Groq)
              </CardTitle>
              <CardDescription>
                Powered by Groq through Vercel AI SDK. AI helps explain parse errors and suggest
                corrected output. Running AI Assist sends your selected input/output data to Groq.
                Server reads `GROQ_API_KEY` from environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input value="Groq" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder={GROQ_DEFAULT_MODEL}
                />
              </div>
              <div className="space-y-2">
                <Label>Instruction</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  className="min-h-[90px] text-sm"
                  placeholder="What should AI do with your data?"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAiAssist}
                disabled={aiLoading || !aiPrompt.trim()}
              >
                {aiLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" /> Running AI Assist
                  </>
                ) : (
                  'Run AI Assist'
                )}
              </Button>
              {aiError ? <p className="text-destructive text-xs">{aiError}</p> : null}
              <Textarea
                value={aiResult}
                readOnly
                className="min-h-[170px] text-sm"
                placeholder="AI response appears here"
              />
            </CardContent>
          </Card>

          {quickLinks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Launch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {quickLinks.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
