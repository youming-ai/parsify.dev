import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import type { TextBox } from '~/lib/ocr/types';
import { cn } from '~/lib/utils';

interface OcrCanvasProps {
  imageSrc: string;
  boxes: TextBox[];
  highlightedIndex: number | null;
  onBoxClick: (index: number) => void;
  className?: string;
}

export function OcrCanvas({
  imageSrc,
  boxes,
  highlightedIndex,
  onBoxClick,
  className,
}: OcrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const maxW = canvas.parentElement?.clientWidth ?? 800;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (showOverlay && boxes.length > 0) {
        for (let i = 0; i < boxes.length; i++) {
          const box = boxes[i];
          if (!box) continue;
          const isHighlighted = i === highlightedIndex;
          ctx.strokeStyle = isHighlighted ? '#ef4444' : '#22c55e';
          ctx.lineWidth = isHighlighted ? 3 : 2;
          ctx.globalAlpha = isHighlighted ? 1 : 0.7;

          ctx.beginPath();
          const points = box.points.map((p) => [(p[0] ?? 0) * scale, (p[1] ?? 0) * scale]);
          ctx.moveTo(points[0]?.[0] ?? 0, points[0]?.[1] ?? 0);
          for (let j = 1; j < points.length; j++) {
            ctx.lineTo(points[j]?.[0] ?? 0, points[j]?.[1] ?? 0);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    };
    img.src = imageSrc;
  }, [imageSrc, boxes, highlightedIndex, showOverlay]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || boxes.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scale = canvasRef.current.width / (imageSize.width || 1);

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (!box) continue;
      const pts = box.points.map((p) => [(p[0] ?? 0) * scale, (p[1] ?? 0) * scale]);
      if (isPointInPolygon(x, y, pts)) {
        onBoxClick(i);
        return;
      }
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowOverlay(!showOverlay)}
          aria-label={showOverlay ? 'Hide text boxes' : 'Show text boxes'}
        >
          {showOverlay ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full rounded-lg border cursor-crosshair"
      />
    </div>
  );
}

function isPointInPolygon(x: number, y: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]?.[0] ?? 0;
    const yi = polygon[i]?.[1] ?? 0;
    const xj = polygon[j]?.[0] ?? 0;
    const yj = polygon[j]?.[1] ?? 0;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
