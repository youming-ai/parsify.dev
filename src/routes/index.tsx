import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Download, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '~/components/i18n-provider';
import { EnhanceOutput } from '~/components/ocr/enhance-output';
import { ImageUpload } from '~/components/ocr/image-upload';
import { OcrCanvas } from '~/components/ocr/ocr-canvas';
import { OcrProgressIndicator } from '~/components/ocr/ocr-progress';
import { OcrResult } from '~/components/ocr/ocr-result';
import { Button } from '~/components/ui/button';
import { CopyButton } from '~/components/ui/copy-button';
import { DetectionFrame } from '~/components/ui/detection-frame';
import type { OcrEngine } from '~/lib/ocr/engine';
import type { OcrProgress, OcrResult as OcrResultType, PdfPageResult } from '~/lib/ocr/types';
import { useEnhance } from '~/lib/ocr/use-enhance';
import { cn } from '~/lib/utils';
import type { EnhanceRequest } from '~/schemas/enhance';

export const Route = createFileRoute('/')({
  component: HomePage,
});

let enginePromise: Promise<OcrEngine> | null = null;
const getEngine = (): Promise<OcrEngine> => {
  if (!enginePromise) {
    enginePromise = import('~/lib/ocr/engine').then(({ OcrEngine }) => new OcrEngine());
  }
  return enginePromise;
};

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
  // Set when a PDF has more pages than we render, so the partial result is
  // never silently mistaken for a complete scan.
  const [pdfTruncated, setPdfTruncated] = useState<{ rendered: number; total: number } | null>(
    null
  );
  const [outputTab, setOutputTab] = useState<'doc' | 'json'>('doc');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const { t } = useI18n();
  const enhance = useEnhance();

  // Object URLs we created (PDF pages + single images). Tracked so they can be
  // revoked when a new file is loaded or the component unmounts, instead of
  // leaking one blob per page for the lifetime of the tab.
  const objectUrlsRef = useRef<string[]>([]);
  // Lets an in-flight PDF render be cancelled when a new file is selected.
  const renderAbortRef = useRef<AbortController | null>(null);

  const releaseObjectUrls = useCallback(() => {
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current = [];
  }, []);

  useEffect(
    () => () => {
      renderAbortRef.current?.abort();
      releaseObjectUrls();
    },
    [releaseObjectUrls]
  );

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
      // Cancel any in-flight PDF render and release the previous file's blobs
      // before we start, so memory does not accumulate across uploads.
      renderAbortRef.current?.abort();
      releaseObjectUrls();

      setError(null);
      setOcrResult(null);
      setPdfPageResults([]);
      setCurrentPage(0);
      setTotalPdfPages(0);
      setPdfTruncated(null);
      setFileName(file.name);
      setFileSize(file.size);
      enhance.reset();
      setIsProcessing(true);

      const isPdf = file.type === 'application/pdf';
      const ensureModels = async () => {
        const loadedEngine = await getEngine();
        if (loadedEngine.isReady) return loadedEngine;
        setOcrProgress({
          stage: 'loading-models',
          progress: 0,
          message: 'Loading OCR models...',
        });
        await loadedEngine.load((name, fromCache) => {
          setOcrProgress({
            stage: 'loading-models',
            progress: fromCache ? 0.8 : 0.5,
            message: `Loaded ${name} model${fromCache ? ' (cached)' : ''}`,
          });
        });
        return loadedEngine;
      };

      try {
        if (isPdf) {
          const loadedEngine = await ensureModels();
          const controller = new AbortController();
          renderAbortRef.current = controller;

          // Render and OCR one page at a time: each page is rendered, scanned,
          // then the next is rendered — bounding peak memory regardless of page
          // count, and letting an upload mid-flight be cancelled.
          const results: PdfPageResult[] = [];
          const { renderPdfPages } = await import('~/lib/ocr/pdf-renderer');
          await renderPdfPages(file, {
            signal: controller.signal,
            onPage: async ({ pageNumber, imageSrc, totalPages, pagesToRender }) => {
              objectUrlsRef.current.push(imageSrc);
              setTotalPdfPages(totalPages);
              if (totalPages > pagesToRender) {
                setPdfTruncated({ rendered: pagesToRender, total: totalPages });
              }
              setImageSrc(imageSrc);
              setCurrentPage(pageNumber);
              setOcrProgress({
                stage: 'detecting',
                progress: (pageNumber - 0.5) / pagesToRender,
                message: `Processing page ${pageNumber}/${pagesToRender}...`,
              });
              const ocr = await loadedEngine.recognize(imageSrc, setOcrProgress);
              results.push({ pageNumber, ocr, imageSrc });
              setPdfPageResults([...results]);
              setOcrResult(ocr);
            },
          });
        } else {
          const src = URL.createObjectURL(file);
          objectUrlsRef.current.push(src);
          setImageSrc(src);

          const loadedEngine = await ensureModels();
          const result = await loadedEngine.recognize(src, setOcrProgress);
          setOcrResult(result);
        }
      } catch (err) {
        // A cancelled render is expected when the user picks another file.
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : t('error.ocrFailed'));
      } finally {
        setIsProcessing(false);
        setOcrProgress(null);
      }
    },
    [enhance, releaseObjectUrls, t]
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
  const hasOcrData = useMemo(() => {
    if (pdfPageResults.length > 0) {
      return pdfPageResults.some((r) => r.ocr.text.trim() && r.ocr.boxes.length > 0);
    }
    return !!(ocrResult && ocrResult.boxes.length > 0 && ocrResult.text.trim());
  }, [ocrResult, pdfPageResults]);
  const canEnhance = hasOcrData && !isProcessing && !enhanceStreaming;
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
        <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
          ◢ {t('hero.eyebrow')}
        </p>
        <h1 className="font-mono text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
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
      <ImageUpload onImageSelect={handleImageSelect} disabled={isProcessing} />

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

      {/* Partial-PDF warning — surfaced so truncated output isn't mistaken for a full scan */}
      {pdfTruncated && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-amber-700 text-sm dark:text-amber-400">
          <span>
            {t('upload.truncated', {
              rendered: pdfTruncated.rendered,
              total: pdfTruncated.total,
            })}
          </span>
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
          <div className="flex flex-col overflow-hidden rounded-lg border bg-card lg:h-[70vh] lg:max-h-[760px]">
            <div className="flex items-center justify-between gap-2 border-b bg-muted px-3 py-2">
              <div className="flex items-center gap-1">
                <OutputTab active={outputTab === 'doc'} onClick={() => setOutputTab('doc')}>
                  {t('output.doc')}
                  {enhanceStreaming && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-700 align-middle" />
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
        <section className="mt-12 grid overflow-hidden rounded-lg border bg-card sm:grid-cols-3">
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
        active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
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
      <p className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-foreground">
        <span className="h-1.5 w-1.5 bg-foreground" />
        {label}
      </p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
