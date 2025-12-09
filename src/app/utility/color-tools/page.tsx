import { ColorConverter } from '@/components/tools/converters/color-converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Converter - HEX, RGB, HSL, CMYK Color Tool Online',
  description:
    'Free online color converter. Convert between HEX, RGB, HSL, CMYK, and OKLCH color formats. Generate color harmonies and check contrast for accessibility.',
  keywords: [
    'color converter',
    'hex to rgb',
    'rgb to hex',
    'hsl converter',
    'cmyk converter',
    'color picker',
    'color palette',
    'contrast checker',
  ],
  openGraph: {
    title: 'Color Converter - Parsify.dev',
    description: 'Convert colors between HEX, RGB, HSL, CMYK formats with live preview.',
  },
};

export default function ColorConverterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <ColorConverter />
    </div>
  );
}
