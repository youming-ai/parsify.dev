import { createFileRoute } from '@tanstack/react-router';
import { Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { EnhanceOutput } from '~/components/ocr/enhance-output';
import { ImageUpload } from '~/components/ocr/image-upload';
import { OcrCanvas } from '~/components/ocr/ocr-canvas';
import { OcrProgressIndicator } from '~/components/ocr/ocr-progress';
import { OcrResult } from '~/components/ocr/ocr-result';
import { OcrEngine } from '~/lib/ocr/engine';
import type { OcrProgress, OcrResult as OcrResultType } from '~/lib/ocr/types';
import { useEnhance } from '~/lib/ocr/use-enhance';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const engine = new OcrEngine();

function HomePage() {
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResultType | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [highlightedBox, setHighlightedBox] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const enhance = useEnhance();

  const handleImageSelect = useCallback(
    async (file: File) => {
      setError(null);
      setOcrResult(null);
      enhance.reset();
      setIsProcessing(true);

      const src = URL.createObjectURL(file);
      setImageSrc(src);

      try {
        // Load models if needed
        if (!engine.isReady) {
          setOcrProgress({
            stage: 'loading-models',
            progress: 0,
            message: 'Downloading models...',
          });
          await engine.load((name, fromCache) => {
            setOcrProgress({
              stage: 'loading-models',
              progress: fromCache ? 0.8 : 0.5,
              message: `Loaded ${name} model${fromCache ? ' (cached)' : ''}`,
            });
          });
        }

        // Run OCR
        const result = await engine.recognize(src, setOcrProgress);
        setOcrResult(result);

        // Auto-send to enhance
        if (result.boxes.length > 0) {
          await enhance.run({
            text: result.text,
            boxes: result.boxes,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'OCR processing failed');
      } finally {
        setIsProcessing(false);
        setOcrProgress(null);
      }
    },
    [enhance]
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Parsify OCR</h1>
        <p className="mt-2 text-muted-foreground">
          Browser-local OCR powered by PaddleOCR PP-OCRv6. Images never leave your device.
        </p>
      </section>

      {/* Upload */}
      <ImageUpload onImageSelect={handleImageSelect} disabled={isProcessing} />

      {/* Progress */}
      {ocrProgress && (
        <div className="mt-4">
          <OcrProgressIndicator progress={ocrProgress} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {ocrResult && imageSrc && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Left: Image with boxes */}
          <OcrCanvas
            imageSrc={imageSrc}
            boxes={ocrResult.boxes}
            highlightedIndex={highlightedBox}
            onBoxClick={(i) => setHighlightedBox(i)}
          />

          {/* Right: Text results */}
          <div className="space-y-6">
            <OcrResult
              boxes={ocrResult.boxes}
              highlightedIndex={highlightedBox}
              onBoxHover={setHighlightedBox}
            />

            <EnhanceOutput
              text={enhance.text}
              isStreaming={enhance.status === 'streaming'}
              error={enhance.error}
            />
          </div>
        </div>
      )}

      {/* Features */}
      {!ocrResult && (
        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Lightning Fast"
            description="PP-OCRv6 Tiny runs entirely in your browser — no uploads, no waiting."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Privacy First"
            description="Images never leave your device. All processing happens locally."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="50+ Languages"
            description="Recognizes Chinese, English, Japanese, and 46 Latin-script languages."
          />
        </section>
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 text-primary">{icon}</div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
