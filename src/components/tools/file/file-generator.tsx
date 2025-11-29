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
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save } from 'lucide-react';
import { useMemo, useState } from 'react';

type Preset = 'lorem' | 'zeros' | 'random' | 'custom';

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';

const generateContent = (preset: Preset, custom: string, bytes: number) => {
  let source = '';
  if (preset === 'lorem') source = lorem;
  else if (preset === 'zeros') source = '\\0';
  else if (preset === 'random') source = Math.random().toString(36).slice(2);
  else source = custom || 'sample';

  const repeatCount = Math.ceil(bytes / source.length);
  return source.repeat(Math.max(repeatCount, 1)).slice(0, bytes);
};

export const FileGenerator = () => {
  const [preset, setPreset] = useState<Preset>('lorem');
  const [sizeKb, setSizeKb] = useState(32);
  const [fileName, setFileName] = useState('sample.txt');
  const [customContent, setCustomContent] = useState('');
  const [preview, setPreview] = useState('');

  const sizeBytes = useMemo(() => sizeKb * 1024, [sizeKb]);

  const handleGenerate = () => {
    const content = generateContent(preset, customContent, sizeBytes);
    setPreview(content.slice(0, 4000));
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'generated.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5" /> File Generator
        </CardTitle>
        <CardDescription>Create test files with custom size and content instantly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Label>File size: {sizeKb} KB</Label>
            <Slider
              value={[sizeKb]}
              min={1}
              max={1024}
              step={1}
              onValueChange={(vals) => setSizeKb(vals[0])}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="file-name">File name</Label>
                <Input
                  id="file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Content preset</Label>
                <Select value={preset} onValueChange={(val) => setPreset(val as Preset)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lorem">Lorem Ipsum</SelectItem>
                    <SelectItem value="zeros">Zeros</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {preset === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-content">Custom content</Label>
                <Textarea
                  id="custom-content"
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Content to repeat"
                />
              </div>
            )}

            <Button onClick={handleGenerate}>
              <Save className="mr-2 h-4 w-4" /> Generate & Download
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Preview (first 4 KB)</Label>
            <Textarea
              readOnly
              value={preview}
              className="h-48 font-mono"
              placeholder="Preview will appear after generation"
            />
            <div className="text-muted-foreground text-xs">
              Approx. {sizeBytes.toLocaleString()} bytes
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileGenerator;
