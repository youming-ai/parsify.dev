import type { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import { logger } from '~/lib/logger';

// Configure worker — use CDN for pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface RenderPdfOptions {
  maxPages?: number;
  scale?: number;
  maxWidth?: number;
}

export interface PdfRenderResult {
  pages: string[];
  totalPages: number;
}

export async function renderPdfPages(
  file: File,
  opts?: RenderPdfOptions
): Promise<PdfRenderResult> {
  const maxPages = opts?.maxPages ?? 1000;
  const scale = opts?.scale ?? 2;
  const maxWidth = opts?.maxWidth ?? 960;

  const arrayBuffer = await file.arrayBuffer();
  const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pagesToRender = Math.min(totalPages, maxPages);

  if (totalPages > maxPages) {
    logger.warn(`PDF has ${totalPages} pages, limiting to ${maxPages}`);
  }

  const pages: string[] = [];

  for (let i = 1; i <= pagesToRender; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const actualScale =
      viewport.width > maxWidth ? maxWidth / page.getViewport({ scale: 1 }).width : scale;
    const cappedViewport = page.getViewport({ scale: actualScale });

    const canvas = document.createElement('canvas');
    canvas.width = cappedViewport.width;
    canvas.height = cappedViewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2d context');

    await page.render({ canvas, canvasContext: ctx, viewport: cappedViewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to convert canvas to blob'));
      }, 'image/png');
    });

    pages.push(URL.createObjectURL(blob));
  }

  logger.info(`Rendered ${pagesToRender}/${totalPages} PDF pages`);

  return { pages, totalPages };
}
