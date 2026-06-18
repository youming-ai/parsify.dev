import { ScanText } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useI18n } from '~/components/i18n-provider';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
  /** 0–1 OCR progress; drives the scan beam over the preview while processing. */
  scanProgress?: number | null;
  className?: string;
}

const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'application/pdf',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const PDF_MAX_SIZE = 200 * 1024 * 1024; // 200MB

export function ImageUpload({
  onImageSelect,
  disabled,
  scanProgress,
  className,
}: ImageUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  const validate = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return t('upload.errFormat');
      }
      const limit = file.type === 'application/pdf' ? PDF_MAX_SIZE : MAX_SIZE;
      if (file.size > limit) {
        const limitMB = file.type === 'application/pdf' ? 200 : 10;
        return t('upload.errSize', { mb: limitMB });
      }
      return null;
    },
    [t]
  );

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setIsPdf(file.type === 'application/pdf');
      setPreview(URL.createObjectURL(file));
      onImageSelect(file);
    },
    [onImageSelect, validate]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const scanning = scanProgress != null && scanProgress > 0 && scanProgress < 1;

  return (
    <div className={cn('w-full', className)}>
      {preview ? (
        <div className="relative overflow-hidden rounded-lg border bg-surface">
          {isPdf ? (
            <div className="flex h-[400px] w-full items-center justify-center bg-muted">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  role="img"
                  aria-label="PDF document"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">PDF Document</p>
              </div>
            </div>
          ) : (
            <img src={preview} alt="Uploaded" className="max-h-[400px] w-full object-contain" />
          )}
          {scanning && (
            <span
              className="pointer-events-none absolute inset-x-0 h-0.5 bg-detect shadow-[0_0_12px_2px_var(--color-detect)] transition-[top] duration-300 ease-linear"
              style={{ top: `${Math.round((scanProgress ?? 0) * 100)}%` }}
            />
          )}
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2"
            onClick={() => {
              setPreview(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            disabled={disabled}
          >
            {t('upload.change')}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            'relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-surface p-12 transition-colors',
            isDragging ? 'border-detect bg-detect/5' : 'border-line hover:border-detect/50',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={handleClick}
          aria-label={t('upload.aria')}
        >
          {/* scanner-bed registration brackets + idle sweep */}
          <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-detect/70" />
          <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-detect/70" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-detect/70" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-detect/70" />
          {!disabled && <span className="scan-beam" />}

          <span className="mb-1 font-mono text-[10px] tracking-[0.2em] text-detect">
            {t('upload.idle')}
          </span>
          <ScanText className="mb-3 mt-2 h-9 w-9 text-foreground" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">{t('upload.drop')}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('upload.hint')}</p>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
            PNG JPG WEBP BMP TIFF · 10MB &nbsp;·&nbsp; PDF · 200MB
          </p>
        </button>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
