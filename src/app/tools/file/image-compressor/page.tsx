/**
 * Image Compressor Page
 * Compress and optimize images with quality control and format conversion
 */

import { ImageCompressor } from '@/components/tools/file/image-compressor';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Image Compressor - Compress & Optimize Images | Parsify.dev',
	description:
		'Compress JPEG, PNG, and WebP images with quality control. Reduce file size while maintaining visual quality. Format conversion and optimization.',
	keywords: [
		'image compressor',
		'compress image',
		'image optimizer',
		'jpeg compression',
		'png optimization',
		'webp converter',
	],
};

export default function ImageCompressorPage() {
	return (
		<ToolPageWrapper
			title="Image Compressor"
			description="Compress and optimize images with quality control and format conversion"
			toolId="image-compressor"
		>
			<ImageCompressor />
		</ToolPageWrapper>
	);
}
