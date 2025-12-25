'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, DownloadSimple, Image, Trash, UploadSimple } from '@phosphor-icons/react';
import { useCallback, useRef, useState } from 'react';

export function Base64ImageConverter() {
  const [imageBase64, setImageBase64] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageBase64(base64);
      setImageSrc(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleBase64Input = useCallback((value: string) => {
    setImageBase64(value);
    if (value.startsWith('data:image')) {
      setImageSrc(value);
    } else if (value.trim()) {
      // Try to add data URL prefix
      setImageSrc(`data:image/png;base64,${value}`);
    } else {
      setImageSrc('');
    }
  }, []);

  const handleCopy = async () => {
    if (!imageBase64) return;
    await navigator.clipboard.writeText(imageBase64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = fileName || 'image.png';
    link.click();
  };

  const handleClear = () => {
    setImageBase64('');
    setImageSrc('');
    setFileName('');
    setFileSize(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" /> Base64 Image Converter
        </CardTitle>
        <CardDescription>
          Convert images to Base64 strings and vice versa. Upload an image or paste Base64 data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Upload Image</Label>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={handleClear}>
                <Trash className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
            <div
              className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 transition-colors hover:border-primary/50"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <UploadSimple className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, GIF, WebP, SVG</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            {fileName && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">{fileName}</p>
                <p className="text-muted-foreground">{formatFileSize(fileSize)}</p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Preview</Label>
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-muted/30 p-4">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Preview"
                  className="max-h-[300px] max-w-full rounded object-contain"
                />
              ) : (
                <p className="text-sm text-muted-foreground">No image to preview</p>
              )}
            </div>
          </div>
        </div>

        {/* Base64 Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Base64 String</Label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} disabled={!imageBase64}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload} disabled={!imageSrc}>
                <DownloadSimple className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </div>
          <Textarea
            value={imageBase64}
            onChange={(e) => handleBase64Input(e.target.value)}
            placeholder="Paste Base64 string here or upload an image..."
            className="min-h-[150px] font-mono text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default Base64ImageConverter;
