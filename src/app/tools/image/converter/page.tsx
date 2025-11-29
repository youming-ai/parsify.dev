import ToolWrapper from '@/components/shared/ToolWrapper';
import { ImageConverter } from '@/components/tools/image/image-converter';

export default function ImageConverterPage() {
  return (
    <ToolWrapper
      title="Image Format Converter"
      description="Convert images between different formats (JPG, PNG, WebP, GIF, etc.)"
    >
      <ImageConverter />
    </ToolWrapper>
  );
}

export const metadata = {
  title: 'Image Format Converter - Parsify',
  description: 'Convert images between different formats (JPG, PNG, WebP, GIF, etc.)',
};
