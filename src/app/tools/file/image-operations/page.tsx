import ToolWrapper from '@/components/shared/ToolWrapper';
import { ImageResizer } from '@/components/tools/image/image-resizer';

export default function ImageResizerPage() {
  return (
    <ToolWrapper
      title="Image Resizer"
      description="Resize images with custom dimensions and maintain aspect ratio"
    >
      <ImageResizer />
    </ToolWrapper>
  );
}

export const metadata = {
  title: 'Image Resizer - Parsify',
  description: 'Resize images with custom dimensions and maintain aspect ratio',
};
