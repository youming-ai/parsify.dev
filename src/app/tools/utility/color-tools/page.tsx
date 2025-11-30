import { ColorConverter } from '@/components/tools/converters/color-converter';
import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Binary, Code, Palette } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Converter | Parsify',
  description: 'Convert HEX, RGB, and HSL values with live preview.',
};

export default function ColorConverterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <ColorConverter />

      <ToolInfoSection
        features={[
          'Convert between HEX, RGB, HSL, HSB formats',
          'Live color preview and picker',
          'Copy color values in any format',
          'Color palette generation',
          'Complementary color suggestions',
          'CSS color name support',
        ]}
        info={{
          category: 'Converters',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Beginner',
        }}
        related={[
          {
            name: 'Number Base Converter',
            description: 'Convert between binary, octal, decimal, hex',
            href: '/tools/converters/number-base',
            icon: <Binary className="h-5 w-5" />,
          },
          {
            name: 'HTML Entity Encoder',
            description: 'Encode and decode HTML entities',
            href: '/tools/converters/html-entity',
            icon: <Code className="h-5 w-5" />,
          },
          {
            name: 'CSS Tools',
            description: 'Format and minify CSS stylesheets',
            href: '/tools/code/formatter',
            icon: <Palette className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
