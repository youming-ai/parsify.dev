import { NumberBaseConverter } from '@/components/tools/converters/number-base-converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Number Base Converter | Parsify',
  description: 'Convert numbers between binary, octal, decimal, and hexadecimal.',
};

export default function NumberBaseConverterPage() {
  return (
    <div className="container mx-auto py-8">
      <NumberBaseConverter />
    </div>
  );
}
