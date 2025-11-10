/**
 * OCR Tool Page
 * Extract text from images using optical character recognition
 */

import { OCRTool } from '@/components/tools/file/ocr-tool';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'OCR Tool - Extract Text from Images | Parsify.dev',
	description:
		'Extract text from images using optical character recognition. Support for multiple languages and confidence scoring. Upload images and extract text instantly.',
	keywords: ['ocr tool', 'text extraction', 'image to text', 'ocr scanner', 'tesseract', 'character recognition'],
};

export default function OCRToolPage() {
	return (
		<ToolPageWrapper
			title="OCR Tool"
			description="Extract text from images using optical character recognition"
			toolId="ocr-tool"
		>
			<OCRTool />
		</ToolPageWrapper>
	);
}
