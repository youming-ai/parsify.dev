import { ColorConverter } from '@/components/tools/converters/color-converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Converter | Parsify',
  description: 'Convert HEX, RGB, and HSL values with live preview.',
};

export default function ColorConverterPage() {
  return (
    <div className="container mx-auto py-8">
      <ColorConverter />
    </div>
  );
}
