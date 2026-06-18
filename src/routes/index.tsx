import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Download, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useI18n } from '~/components/i18n-provider';
import { EnhanceOutput } from '~/components/ocr/enhance-output';
import { ImageUpload } from '~/components/ocr/image-upload';
import { OcrCanvas } from '~/components/ocr/ocr-canvas';
import { OcrProgressIndicator } from '~/components/ocr/ocr-progress';
import { OcrResult } from '~/components/ocr/ocr-result';
import { Button } from '~/components/ui/button';
import { CopyButton } from '~/components/ui/copy-button';
import { DetectionFrame } from '~/components/ui/detection-frame';
import { OcrEngine } from '~/lib/ocr/engine';
import { renderPdfPages } from '~/lib/ocr/pdf-renderer';
import type { OcrProgress, OcrResult as OcrResultType, PdfPageResult } from '~/lib/ocr/types';
import { useEnhance } from '~/lib/ocr/use-enhance';
import { cn } from '~/lib/utils';
import type { EnhanceRequest } from '~/schemas/enhance';

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
  const [outputTab, setOutputTab] = useState<'doc' | 'json'>('doc');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const { t } = useI18n();
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
      setFileName(file.name);
      setFileSize(file.size);
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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error.ocrFailed'));
      } finally {
        setIsProcessing(false);
        setOcrProgress(null);
      }
    },
    [enhance, t]
  );

  const buildEnhanceRequest = useCallback((): EnhanceRequest | null => {
    if (pdfPageResults.length > 0) {
      const text = pdfPageResults
        .map((r) => `--- Page ${r.pageNumber} ---\n${r.ocr.text}`)
        .join('\n\n');
      const boxes = pdfPageResults.flatMap((r) => r.ocr.boxes);
      return text.trim() && boxes.length > 0 ? { text, boxes } : null;
    }

    if (!ocrResult || ocrResult.boxes.length === 0 || !ocrResult.text.trim()) {
      return null;
    }

    return { text: ocrResult.text, boxes: ocrResult.boxes };
  }, [ocrResult, pdfPageResults]);

  const handleEnhance = useCallback(async () => {
    const request = buildEnhanceRequest();
    if (!request) return;
    await enhance.run(request);
  }, [buildEnhanceRequest, enhance]);

  const enhanceStreaming = enhance.status === 'streaming';
  const recognizedText = ocrResult?.text ?? '';
  const docText = enhance.text || recognizedText;
  const canEnhance = buildEnhanceRequest() !== null && !isProcessing && !enhanceStreaming;
  const jsonText = ocrResult
    ? JSON.stringify(
        { boxes: ocrResult.boxes, text: ocrResult.text, elapsed: ocrResult.elapsed },
        null,
        2
      )
    : '';
  const activeText = outputTab === 'json' ? jsonText : docText;

  const handleDownload = () => {
    const isJson = outputTab === 'json';
    const blob = new Blob([activeText], {
      type: isJson ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isJson ? 'parsify-result.json' : 'parsify-result.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const pdfPager =
    pdfPageResults.length > 0 ? (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={t('source.prevPage')}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
          {String(currentPage).padStart(2, '0')}/{String(totalPdfPages).padStart(2, '0')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={currentPage >= pdfPageResults.length}
          aria-label={t('source.nextPage')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    ) : null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14">
      {/* Hero — the engine reads a word in front of you */}
      <section className="mb-10">
        <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-detect">
          ◢ {t('hero.eyebrow')}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
          {t('hero.headPre')}{' '}
          <DetectionFrame
            label="99.7%"
            coord="x:0 y:0"
            scan="once"
            className="inline-block align-baseline"
            contentClassName="px-2 py-0.5"
          >
            {t('hero.headWord')}
          </DetectionFrame>
          {t('hero.headPost') ? <> {t('hero.headPost')}</> : null}
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground">{t('hero.sub')}</p>
      </section>

      {/* Scanner bed */}
      <ImageUpload
        onImageSelect={handleImageSelect}
        disabled={isProcessing}
        scanProgress={ocrProgress?.progress ?? null}
      />

      {/* Progress */}
      {ocrProgress && (
        <div className="mt-4">
          <OcrProgressIndicator progress={ocrProgress} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <span className="font-mono text-[11px] tracking-wider">{t('common.error')}</span>
          <span>{error}</span>
        </div>
      )}

      {/* Results — source vs. parsed comparison */}
      {ocrResult && imageSrc && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Left: source file with detection overlay */}
          <OcrCanvas
            imageSrc={imageSrc}
            boxes={ocrResult.boxes}
            highlightedIndex={highlightedBox}
            onBoxClick={(i) => setHighlightedBox(i)}
            fileName={fileName ?? undefined}
            fileSize={fileSize ?? undefined}
            pager={pdfPager}
            className="lg:h-[70vh] lg:max-h-[760px]"
          />

          {/* Right: parsed result */}
          <div className="flex flex-col overflow-hidden rounded-lg border bg-surface lg:h-[70vh] lg:max-h-[760px]">
            <div className="flex items-center justify-between gap-2 border-b bg-surface-2 px-3 py-2">
              <div className="flex items-center gap-1">
                <OutputTab active={outputTab === 'doc'} onClick={() => setOutputTab('doc')}>
                  {t('output.doc')}
                  {enhanceStreaming && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-detect align-middle" />
                  )}
                </OutputTab>
                <OutputTab active={outputTab === 'json'} onClick={() => setOutputTab('json')}>
                  {t('output.json')}
                </OutputTab>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  onClick={handleEnhance}
                  disabled={!canEnhance}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{enhanceStreaming ? t('output.enhancing') : t('output.enhance')}</span>
                </Button>
                <CopyButton
                  text={activeText}
                  className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleDownload}
                  aria-label={t('common.download')}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {outputTab === 'doc' ? (
                <div className="space-y-4">
                  <EnhanceOutput
                    text={enhance.text}
                    isStreaming={enhanceStreaming}
                    error={enhance.error}
                  />
                  <div>
                    <p className="mb-2 font-mono text-[11px] tracking-wider text-muted-foreground">
                      {t('output.lines', { n: ocrResult.boxes.length })}
                    </p>
                    <OcrResult
                      boxes={ocrResult.boxes}
                      highlightedIndex={highlightedBox}
                      onBoxHover={setHighlightedBox}
                    />
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all font-mono text-xs text-foreground">
                  {jsonText}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spec strip — replaces the placeholder feature cards */}
      {!ocrResult && (
        <section className="mt-12 grid overflow-hidden rounded-lg border bg-surface sm:grid-cols-3">
          <SpecCell label={t('spec.local.label')} description={t('spec.local.desc')} />
          <SpecCell
            label={t('spec.model.label')}
            description={t('spec.model.desc')}
            className="border-t sm:border-l sm:border-t-0"
          />
          <SpecCell
            label={t('spec.scripts.label')}
            description={t('spec.scripts.desc')}
            className="border-t sm:border-l sm:border-t-0"
          />
        </section>
      )}
    </div>
  );
}

function OutputTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-2.5 py-1 font-mono text-[11px] tracking-wider transition-colors',
        active ? 'bg-detect text-detect-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function SpecCell({
  label,
  description,
  className,
}: {
  label: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn('p-5', className)}>
      <p className="mb-2 flex items-center gap-2 font-display text-[11px] font-semibold tracking-[0.16em] text-foreground">
        <span className="h-1.5 w-1.5 bg-detect" />
        {label}
      </p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
