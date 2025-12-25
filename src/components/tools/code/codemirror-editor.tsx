'use client';

import { Textarea } from '@/components/ui/textarea';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string | number;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  height = 400,
  readOnly = false,
  placeholder = 'Enter code here...',
  className,
}: CodeEditorProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`font-mono text-sm resize-none ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}

export default CodeEditor;
