import { Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export function ImageUpload({ onImageSelect, disabled, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported format. Please use PNG, JPEG, WebP, BMP, or TIFF.`;
    }
    if (file.size > MAX_SIZE) {
      return `File too large. Maximum size is 20MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
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

  return (
    <div className={cn('w-full', className)}>
      {preview ? (
        <div className="relative rounded-lg border overflow-hidden">
          <img src={preview} alt="Uploaded" className="max-h-[400px] w-full object-contain" />
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
            Change image
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={handleClick}
          aria-label="Upload image for OCR"
        >
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop an image, paste from clipboard, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            PNG, JPEG, WebP, BMP, TIFF — up to 20MB
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
