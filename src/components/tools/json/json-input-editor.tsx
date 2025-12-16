import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import * as React from 'react';
import type { JsonEditorProps } from './json-types';
import { validateJson } from './json-utils';

export function JsonInputEditor({
  value,
  onChange,
  onValidate,
  placeholder = 'Enter or paste JSON here...',
  height = 400,
  className,
}: JsonEditorProps) {
  const [isComposing, setIsComposing] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Debounced validation
  React.useEffect(() => {
    if (!onValidate || isComposing) return;

    const timer = setTimeout(() => {
      const result = validateJson(value);
      onValidate(result);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, onValidate, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleInsertTemplate = (template: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newValue = value.substring(0, start) + template + value.substring(end);
      onChange(newValue);

      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(start + template.length, start + template.length);
      }, 0);
    }
  };

  const templates = [
    { name: 'Object', template: '{\n  "key": "value"\n}' },
    { name: 'Array', template: '[\n  {\n    "item": "value"\n  }\n]' },
    {
      name: 'Nested',
      template: '{\n  "user": {\n    "id": 1,\n    "name": "John"\n  },\n  "items": []\n}',
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">Templates:</span>
        {templates.map((template) => (
          <Button
            key={template.name}
            variant="outline"
            size="sm"
            onClick={() => handleInsertTemplate(template.template)}
            className="text-xs"
          >
            {template.name}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          className={cn(
            'resize-none font-mono text-sm',
            'focus:border-blue-500 focus:ring-2 focus:ring-blue-500',
            'border-border'
          )}
          style={{
            height: typeof height === 'number' ? `${height}px` : height,
          }}
          spellCheck={false}
        />

        <div className="absolute top-2 right-2 flex items-center gap-1 text-muted-foreground text-xs">
          <span>{value.length} chars</span>
          <span>•</span>
          <span>{value.split('\n').length} lines</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <div className="flex items-center gap-4">
          <span>Press Tab for indentation</span>
          <span>Ctrl/Cmd + Enter to format</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onChange('')} className="text-xs">
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.readText().then((text) => onChange(text))}
            className="text-xs"
          >
            Paste
          </Button>
        </div>
      </div>
    </div>
  );
}
