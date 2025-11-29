import ToolWrapper from '@/components/shared/ToolWrapper';
import { TextCaseConverter } from '@/components/tools/text/text-case-converter';

export default function TextCaseConverterPage() {
  return (
    <ToolWrapper
      title="Text Case Converter"
      description="Convert text between different case formats (camelCase, snake_case, etc.)"
    >
      <TextCaseConverter />
    </ToolWrapper>
  );
}

export const metadata = {
  title: 'Text Case Converter - Parsify',
  description: 'Convert text between different case formats (camelCase, snake_case, etc.)',
};
