import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { CopyButton } from '~/components/ui/copy-button';
import type { TextBox } from '~/lib/ocr/types';
import { cn } from '~/lib/utils';

interface OcrResultProps {
  boxes: TextBox[];
  highlightedIndex: number | null;
  onBoxHover: (index: number | null) => void;
  className?: string;
}

export function OcrResult({ boxes, highlightedIndex, onBoxHover, className }: OcrResultProps) {
  const [text, setText] = useState('');

  const fullText = boxes.map((b) => b.text).join('\n');

  const handleDownload = () => {
    const blob = new Blob([text || fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ocr-result.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recognized Text</h3>
        <div className="flex gap-2">
          <CopyButton text={text || fullText} />
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {boxes.length > 0 && (
        <ul className="max-h-[200px] space-y-1 overflow-y-auto rounded border p-2 text-xs">
          {boxes.map((box, i) => (
            <li
              key={i}
              className={cn(
                'rounded px-2 py-1 transition-colors',
                i === highlightedIndex ? 'bg-primary/10' : 'hover:bg-muted'
              )}
              onMouseEnter={() => onBoxHover(i)}
              onMouseLeave={() => onBoxHover(null)}
            >
              <span className="text-foreground">{box.text}</span>
              <span className="ml-2 text-muted-foreground">
                {(box.confidence * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      )}

      <textarea
        value={text || fullText}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[200px] w-full rounded-md border bg-muted/50 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="OCR text will appear here..."
        readOnly={boxes.length === 0}
      />
    </div>
  );
}
