import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { EnhanceOutput } from '~/components/ocr/enhance-output';
import { ImageUpload } from '~/components/ocr/image-upload';
import { OcrCanvas } from '~/components/ocr/ocr-canvas';
import { OcrProgressIndicator } from '~/components/ocr/ocr-progress';
import { OcrResult } from '~/components/ocr/ocr-result';
import { Button } from '~/components/ui/button';
import { OcrEngine } from '~/lib/ocr/engine';
import { renderPdfPages } from '~/lib/ocr/pdf-renderer';
import type { OcrProgress, OcrResult as OcrResultType, PdfPageResult } from '~/lib/ocr/types';
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
  const [pdfPageResults, setPdfPageResults] = useState<PdfPageResult[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const enhance = useEnhance();

  const navigateToPage = useCallback(
    (page: number) => {
      const result = pdfPageResults[page - 1];
      if (!result) return;
      setCurrentPage(page);
      setImageSrc(result.imageSrc);
      setOcrResult(result.ocr);
      setHighlightedBox(null);
    },
    [pdfPageResults]
  );

  const handleImageSelect = useCallback(
    async (file: File) => {
      setError(null);
      setOcrResult(null);
      setPdfPageResults([]);
      setCurrentPage(0);
      setTotalPdfPages(0);
      enhance.reset();
      setIsProcessing(true);

      const isPdf = file.type === 'application/pdf';

      try {
        if (isPdf) {
          setOcrProgress({
            stage: 'loading-models',
            progress: 0,
            message: 'Rendering PDF pages...',
          });
          const { pages, totalPages } = await renderPdfPages(file);
          setTotalPdfPages(totalPages);

          // Load models if needed
          if (!engine.isReady) {
            setOcrProgress({
              stage: 'loading-models',
              progress: 0.1,
              message: 'Loading OCR models...',
            });
            await engine.load((name, fromCache) => {
              setOcrProgress({
                stage: 'loading-models',
                progress: fromCache ? 0.8 : 0.5,
                message: `Loaded ${name}`,
              });
            });
          }

          // Process each page
          const results: PdfPageResult[] = [];
          for (let i = 0; i < pages.length; i++) {
            const pageSrc = pages[i];
            if (!pageSrc) continue;
            setImageSrc(pageSrc);
            setCurrentPage(i + 1);
            setOcrProgress({
              stage: 'detecting',
              progress: (i + 0.5) / pages.length,
              message: `Processing page ${i + 1}/${pages.length}...`,
            });
            const ocr = await engine.recognize(pageSrc, setOcrProgress);
            results.push({ pageNumber: i + 1, ocr, imageSrc: pageSrc });
            setPdfPageResults([...results]);
            setOcrResult(ocr);
          }

          // Aggregate all text for enhance
          const allText = results
            .map((r) => `--- Page ${r.pageNumber} ---\n${r.ocr.text}`)
            .join('\n\n');
          const allBoxes = results.flatMap((r) => r.ocr.boxes);
          if (allBoxes.length > 0) {
            await enhance.run({ text: allText, boxes: allBoxes });
          }
        } else {
          const src = URL.createObjectURL(file);
          setImageSrc(src);

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

      {/* PDF Page Navigation */}
      {pdfPageResults.length > 0 && !isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPdfPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={currentPage >= pdfPageResults.length}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
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
