'use client';

import {
  applyFontConfig,
  defaultEditorOptions,
  editorManager,
  type fontConfig,
  getMonacoLanguage,
  injectFontStyles,
} from '@/lib/monaco-config';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// Dynamic import of Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-md border border-border bg-muted" />
  ),
});

export interface MonacoCodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  options?: Monaco.editor.IStandaloneEditorConstructionOptions;
  onMount?: (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => void;
  id?: string;
  theme?: 'light' | 'dark' | 'parsify-light' | 'parsify-dark';
  minimap?: boolean;
  wordWrap?: 'on' | 'off';
  fontSize?: number;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  folding?: boolean;
  autoClosingBrackets?: 'always' | 'never' | 'languageDefined';
  autoClosingQuotes?: 'always' | 'never' | 'languageDefined';
  suggestOnTriggerCharacters?: boolean;
  quickSuggestions?: boolean;
  parameterHints?: boolean;
  hover?: boolean;
  contextmenu?: boolean;
  scrollBeyondLastLine?: boolean;
  smoothScrolling?: boolean;
  cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle?: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  fontConfig?: keyof typeof fontConfig;
  tabSize?: number;
  insertSpaces?: boolean;
  detectIndentation?: boolean;
  trimAutoWhitespace?: boolean;
  largeFileOptimizations?: boolean;
  showFoldingControls?: 'always' | 'mouseover';
  showLastEditLine?: boolean;
  renderControlCharacters?: boolean;
  renderWhitespace?: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  renderLineHighlight?: 'none' | 'gutter' | 'line' | 'all';
  renderIndentGuides?: boolean;
  highlightActiveIndentGuide?: boolean;
  bracketPairColorization?: boolean;
  guides?: {
    bracketPairs?: boolean;
    indentation?: boolean;
    highlightActiveIndentation?: boolean;
  };
  stickyScroll?: boolean;
  codeLens?: boolean;
  lightbulb?: boolean;
  inlayHints?: 'on' | 'off' | 'onForComments';
  glyphMargin?: boolean;
  lineNumbersMinChars?: number;
  revealHorizontalRightPadding?: number;
  roundedSelection?: boolean;
  scrollbar?: {
    useShadows?: boolean;
    verticalHasArrows?: boolean;
    horizontalHasArrows?: boolean;
    vertical?: 'visible' | 'hidden' | 'auto';
    horizontal?: 'visible' | 'hidden' | 'auto';
    verticalScrollbarSize?: number;
    horizontalScrollbarSize?: number;
  };
  enhanceFontRendering?: boolean; // Enable enhanced font rendering features
}

export function MonacoCodeEditor({
  value,
  onChange,
  language = 'javascript',
  height = '400px',
  width = '100%',
  readOnly = false,
  placeholder,
  className,
  options = {},
  onMount,
  id = 'monaco-editor',
  theme: propTheme,
  minimap = true,
  wordWrap = 'off',
  fontSize,
  lineNumbers = 'on',
  folding = true,
  autoClosingBrackets = 'always',
  autoClosingQuotes = 'always',
  suggestOnTriggerCharacters = true,
  quickSuggestions = true,
  parameterHints = true,
  hover = true,
  contextmenu = true,
  scrollBeyondLastLine = false,
  smoothScrolling = true,
  cursorBlinking = 'blink',
  cursorStyle = 'line',
  fontFamily,
  lineHeight,
  letterSpacing,
  fontConfig: fontConfigName,
  tabSize = 2,
  insertSpaces = true,
  detectIndentation = false,
  trimAutoWhitespace = true,
  largeFileOptimizations = false,
  showFoldingControls = 'mouseover',
  showLastEditLine = true,
  renderControlCharacters = false,
  renderWhitespace = 'selection',
  renderLineHighlight = 'line',
  renderIndentGuides = true,
  highlightActiveIndentGuide = true,
  bracketPairColorization = true,
  guides,
  stickyScroll = true,
  codeLens = false,
  lightbulb = true,
  inlayHints = 'on',
  glyphMargin = true,
  lineNumbersMinChars = 1,
  revealHorizontalRightPadding = 15,
  roundedSelection = true,
  scrollbar,
  enhanceFontRendering = true,
  ...rest
}: MonacoCodeEditorProps) {
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // Inject font styles when component mounts
  useEffect(() => {
    if (enhanceFontRendering && isMounted) {
      injectFontStyles();
    }
  }, [enhanceFontRendering, isMounted]);

  // Ensure component is mounted before rendering Monaco
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Determine the theme to use
  const editorTheme = propTheme || (theme === 'dark' ? 'parsify-dark' : 'parsify-light');

  // Start with default options
  let editorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
    ...defaultEditorOptions,
    readOnly,
    minimap: { enabled: minimap },
    wordWrap,
    lineNumbers,
    folding,
    autoClosingBrackets,
    autoClosingQuotes,
    suggestOnTriggerCharacters,
    quickSuggestions: quickSuggestions
      ? {
          other: true,
          comments: false,
          strings: false,
        }
      : {
          other: false,
          comments: false,
          strings: false,
        },
    parameterHints: { enabled: parameterHints },
    hover: { enabled: hover },
    contextmenu,
    scrollBeyondLastLine,
    smoothScrolling,
    cursorBlinking,
    cursorStyle,
    tabSize,
    insertSpaces,
    detectIndentation,
    trimAutoWhitespace,
    largeFileOptimizations,
    showFoldingControls,
    // showLastEditLine,
    renderControlCharacters,
    renderWhitespace,
    renderLineHighlight,
    // renderIndentGuides,
    // highlightActiveIndentGuide,
    bracketPairColorization: { enabled: bracketPairColorization },
    guides: {
      bracketPairs: true,
      indentation: true,
      highlightActiveIndentation: true,
      ...guides,
    },
    stickyScroll: { enabled: stickyScroll },
    codeLens,
    // lightbulb: { enabled: lightbulb },
    // inlayHints: { enabled: inlayHints },
    glyphMargin,
    lineNumbersMinChars,
    revealHorizontalRightPadding,
    roundedSelection,
    scrollbar: {
      useShadows: false,
      vertical: 'auto',
      horizontal: 'auto',
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
      ...scrollbar,
    },
    ...options,
  };

  // Apply font configuration
  if (fontConfigName) {
    editorOptions = applyFontConfig(editorOptions, fontConfigName);
  } else {
    // Apply manual font settings if provided
    if (fontFamily || fontSize || lineHeight || letterSpacing) {
      editorOptions.fontFamily = fontFamily || editorOptions.fontFamily;
      editorOptions.fontSize = fontSize || editorOptions.fontSize;
      editorOptions.lineHeight = lineHeight || editorOptions.lineHeight;
      editorOptions.letterSpacing =
        letterSpacing !== undefined ? letterSpacing : editorOptions.letterSpacing;
    }
  }

  // Handle editor mount
  const handleEditorDidMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco
  ) => {
    editorRef.current = editor;
    editorManager.setMonacoInstance(monaco);
    editorManager.addEditor(id, editor);

    // Set up change handler
    if (onChange) {
      const disposable = editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        onChange(value);
      });

      // Store disposable for cleanup
      (editor as any)._changeDisposable = disposable;
    }

    // Set up placeholder
    if (placeholder) {
      const disposable = editor.onDidLayoutChange(() => {
        const model = editor.getModel();
        if (model && model.getValueLength() === 0) {
          // Add placeholder visualization
          editor.updateOptions({
            placeholder,
          });
        }
      });

      (editor as any)._layoutDisposable = disposable;
    }

    // Call custom onMount callback
    onMount?.(editor, monaco);
  };

  // Handle editor unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        // Clean up disposables
        if ((editorRef.current as any)._changeDisposable) {
          (editorRef.current as any)._changeDisposable.dispose();
        }
        if ((editorRef.current as any)._layoutDisposable) {
          (editorRef.current as any)._layoutDisposable.dispose();
        }

        editorManager.removeEditor(id);
        editorRef.current = null;
      }
    };
  }, [id]);

  // Update language when it changes
  useEffect(() => {
    if (editorRef.current && isMounted) {
      const monaco = (window as any).monaco;
      if (monaco?.editor) {
        const model = editorRef.current.getModel();
        if (model) {
          const newLanguage = getMonacoLanguage(language);
          monaco.editor.setModelLanguage(model, newLanguage);
        }
      }
    }
  }, [language, isMounted]);

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current && isMounted) {
      const monaco = (window as any).monaco;
      if (monaco?.editor) {
        monaco.editor.setTheme(editorTheme);
      }
    }
  }, [editorTheme, isMounted]);

  // Update value when it changes
  useEffect(() => {
    if (editorRef.current && isMounted) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value, isMounted]);

  // Don't render until mounted
  if (!isMounted) {
    return (
      <div
        className={className}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: typeof width === 'number' ? `${width}px` : width,
        }}
      >
        <div className="h-full w-full animate-pulse rounded-md border border-border bg-muted" />
      </div>
    );
  }

  return (
    <div className={className}>
      <MonacoEditor
        height={height}
        width={width}
        language={getMonacoLanguage(language)}
        theme={editorTheme}
        value={value}
        options={editorOptions}
        onMount={handleEditorDidMount}
        loading={
          <div className="h-full w-full animate-pulse rounded-md border border-border bg-muted" />
        }
      />
    </div>
  );
}

// Export a simpler component with basic props
export function CodeEditor(props: Omit<MonacoCodeEditorProps, 'theme'>) {
  return <MonacoCodeEditor {...props} />;
}

// Export with backward compatibility
export default MonacoCodeEditor;
