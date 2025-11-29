'use client';

import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import type { Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  basicSetup?: ReactCodeMirrorProps['basicSetup'];
  extensions?: Extension[];
}

const languageExtensions: Record<string, () => Extension> = {
  javascript: javascript,
  typescript: () => javascript({ typescript: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  json: json,
  html: html,
  css: css,
  xml: xml,
  sql: sql,
  python: python,
  java: java,
  cpp: cpp,
  c: cpp,
  'c++': cpp,
  rust: rust,
  php: php,
};

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  height = '400px',
  width = '100%',
  readOnly = false,
  placeholder,
  className,
  basicSetup,
  extensions: customExtensions = [],
}: CodeEditorProps) {
  const { theme } = useTheme();

  const extensions = useMemo(() => {
    const langExtension = languageExtensions[language.toLowerCase()];
    const exts: Extension[] = [...customExtensions];

    if (langExtension) {
      exts.push(langExtension());
    }

    return exts;
  }, [language, customExtensions]);

  return (
    <CodeMirror
      value={value}
      height={typeof height === 'number' ? `${height}px` : height}
      width={typeof width === 'number' ? `${width}px` : width}
      theme={theme === 'dark' ? oneDark : 'light'}
      extensions={extensions}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      className={className}
      basicSetup={
        basicSetup ?? {
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }
      }
    />
  );
}
