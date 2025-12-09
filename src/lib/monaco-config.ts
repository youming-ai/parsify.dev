/**
 * Monaco Editor Configuration
 * Configures Monaco Editor with custom themes, language support, and options
 */

import type * as Monaco from 'monaco-editor';

// Editor theme definitions
export const editorThemes = {
  light: 'vs',
  dark: 'vs-dark',
  highContrast: 'hc-black',
};

// Font configurations optimized for project fonts
export const fontConfig = {
  // Project's PaperMono font configuration
  paperMono: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    lineHeight: 1.6,
    letterSpacing: 0.5,
    fontWeight: '400' as const,
  },
  // Alternative monospace fonts for different preferences
  firaCode: {
    fontFamily:
      "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace",
    fontSize: 14,
    lineHeight: 1.5,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  jetbrainsMono: {
    fontFamily:
      "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Courier New', monospace",
    fontSize: 14,
    lineHeight: 1.5,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  cascadiaCode: {
    fontFamily:
      "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace",
    fontSize: 14,
    lineHeight: 1.5,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  // Compact font option for more code visibility
  compact: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    lineHeight: 1.4,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  // Large font option for better readability
  large: {
    fontFamily: 'var(--font-mono)',
    fontSize: 16,
    lineHeight: 1.7,
    letterSpacing: 0.5,
    fontWeight: '400' as const,
  },
};

// Language mapping for Monaco
export const monacoLanguages: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  json: 'json',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  xml: 'xml',
  sql: 'sql',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  'c++': 'cpp',
  rust: 'rust',
  php: 'php',
  go: 'go',
  ruby: 'ruby',
  csharp: 'csharp',
  markdown: 'markdown',
  yaml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  dockerfile: 'dockerfile',
  powershell: 'powershell',
  shell: 'shell',
  batch: 'batch',
  plaintext: 'plaintext',
};

// Default editor options
export const defaultEditorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
  // Basic options
  value: '',
  language: 'javascript',
  theme: 'vs',

  // Editor behavior - using project's PaperMono font
  fontSize: 14,
  // Use CSS variable for consistent font stack with project
  fontFamily: 'var(--font-mono)',
  lineHeight: 1.6,
  letterSpacing: 0.5,
  fontWeight: '400',

  // Layout
  padding: { top: 16, bottom: 16 },
  lineNumbers: 'on',
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  automaticLayout: true,

  // Features
  wordWrap: 'off',
  wordWrapColumn: 120,
  wrappingIndent: 'indent',
  smartSelect: { selectLeadingAndTrailingWhitespace: true },
  multiCursorModifier: 'ctrlCmd',
  renderControlCharacters: false,
  renderWhitespace: 'selection',
  renderLineHighlight: 'line',

  // Code editing
  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: true,
    indentation: true,
    highlightActiveIndentation: true,
  },

  // Accessibility
  accessibilitySupport: 'auto',

  // Performance
  fastScrollSensitivity: 5,
  scrollPredominantAxis: true,
  smoothScrolling: true,

  // Development
  showFoldingControls: 'mouseover',
  folding: true,
  foldingStrategy: 'indentation',
  renderValidationDecorations: 'on',

  // Hover and suggestions
  hover: { enabled: true },
  suggest: {
    showKeywords: true,
    showSnippets: true,
    showFunctions: true,
    showConstructors: true,
    showFields: true,
    showVariables: true,
    showClasses: true,
    showStructs: true,
    showInterfaces: true,
    showModules: true,
    showProperties: true,
    showEvents: true,
    showOperators: true,
    showUnits: true,
    showValues: true,
    showConstants: true,
    showEnums: true,
    showEnumMembers: true,
    showColors: true,
    showFiles: true,
    showReferences: true,
    showFolders: true,
    showTypeParameters: true,
    showUsers: true,
    showIssues: true,
  },

  // Quick suggestions
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false,
  },
  quickSuggestionsDelay: 10,

  // Parameter hints
  parameterHints: { enabled: true },

  // Auto closing
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'languageDefined',

  // Copy/paste
  copyWithSyntaxHighlighting: true,

  // Find/replace
  find: {
    addExtraSpaceOnTop: true,
    autoFindInSelection: 'never',
    cursorMoveOnType: true,
    loop: true,
    seedSearchStringFromSelection: 'always',
  },

  // Selection
  multiCursorMergeOverlapping: true,
  multiCursorPaste: 'spread',

  // Links
  links: true,

  // Unicode
  unicodeHighlight: {
    ambiguousCharacters: true,
    invisibleCharacters: true,
    nonBasicASCII: false,
    includeComments: false,
    includeStrings: false,
  },

  // Rulers
  rulers: [80, 120],

  // Glyph margin
  glyphMargin: true,

  // Line decorations
  lineDecorationsWidth: 10,

  // Code lens
  codeLens: false,

  // Inlay hints
  inlayHints: {
    enabled: 'on',
  },

  // Suggest selection
  suggestSelection: 'first',

  // Inline completions
  inlineSuggest: {
    enabled: true,
    showToolbar: 'onHover',
    mode: 'prefix',
  },

  // Sticky scrolling
  stickyScroll: { enabled: true },

  // Suggest
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',

  // Formatting
  formatOnPaste: true,
  formatOnType: true,

  // Color decorators
  colorDecorators: true,
  colorDecoratorsLimit: 1000,
};

// Custom theme configuration
export const customThemes = {
  // Enhanced dark theme with better contrast
  'parsify-dark': {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A737D' },
      { token: 'keyword', foreground: 'F97583' },
      { token: 'string', foreground: '9ECBFF' },
      { token: 'number', foreground: '79B8FF' },
      { token: 'regexp', foreground: 'DBAB79' },
      { token: 'operator', foreground: 'B392F0' },
      { token: 'namespace', foreground: 'F97583' },
      { token: 'type', foreground: '85E89D' },
      { token: 'struct', foreground: '85E89D' },
      { token: 'class', foreground: '85E89D' },
      { token: 'interface', foreground: '85E89D' },
      { token: 'parameter', foreground: 'FFAB70' },
      { token: 'variable', foreground: 'E1E4E8' },
      { token: 'function', foreground: 'B392F0' },
      { token: 'method', foreground: 'B392F0' },
      { token: 'property', foreground: '79B8FF' },
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#E1E4E8',
      'editor.lineHighlightBackground': '#161B22',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#1C2128',
      'editorCursor.foreground': '#58A6FF',
      'editorWhitespace.foreground': '#30363D',
      'editorIndentGuide.background': '#30363D',
      'editorIndentGuide.activeBackground': '#58A6FF33',
      'editorLineNumber.foreground': '#484F58',
      'editorLineNumber.activeForeground': '#E1E4E8',
    },
  },

  // Enhanced light theme
  'parsify-light': {
    base: 'vs' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A737D' },
      { token: 'keyword', foreground: 'D73A49' },
      { token: 'string', foreground: '032F62' },
      { token: 'number', foreground: '005CC5' },
      { token: 'regexp', foreground: '22863A' },
      { token: 'operator', foreground: 'D73A49' },
      { token: 'namespace', foreground: '6F42C1' },
      { token: 'type', foreground: '6F42C1' },
      { token: 'struct', foreground: '6F42C1' },
      { token: 'class', foreground: '6F42C1' },
      { token: 'interface', foreground: '6F42C1' },
      { token: 'parameter', foreground: 'E36209' },
      { token: 'variable', foreground: '24292E' },
      { token: 'function', foreground: '6F42C1' },
      { token: 'method', foreground: '6F42C1' },
      { token: 'property', foreground: '005CC5' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#24292E',
      'editor.lineHighlightBackground': '#F6F8FA',
      'editor.selectionBackground': '#0366D620',
      'editor.inactiveSelectionBackground': '#0366D615',
      'editorCursor.foreground': '#044289',
      'editorWhitespace.foreground': '#D1D5DA',
      'editorIndentGuide.background': '#E1E4E8',
      'editorIndentGuide.activeBackground': '#0366D620',
      'editorLineNumber.foreground': '#1B1F234D',
      'editorLineNumber.activeForeground': '#1B1F23',
    },
  },
};

// Helper function to get Monaco language ID
export function getMonacoLanguage(language: string): string {
  return monacoLanguages[language.toLowerCase()] || 'plaintext';
}

// Helper function to register custom themes
export function registerCustomThemes(monaco: typeof Monaco): void {
  // Register dark theme
  monaco.editor.defineTheme('parsify-dark', customThemes['parsify-dark']);

  // Register light theme
  monaco.editor.defineTheme('parsify-light', customThemes['parsify-light']);
}

// Font management utilities
export function getFontConfig(fontName: keyof typeof fontConfig = 'paperMono') {
  return fontConfig[fontName];
}

export function getAvailableFonts() {
  return Object.keys(fontConfig) as Array<keyof typeof fontConfig>;
}

// Apply font configuration to editor options
export function applyFontConfig(
  options: Monaco.editor.IStandaloneEditorConstructionOptions,
  fontName: keyof typeof fontConfig = 'paperMono'
): Monaco.editor.IStandaloneEditorConstructionOptions {
  const config = fontConfig[fontName];

  return {
    ...options,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    lineHeight: config.lineHeight,
    letterSpacing: config.letterSpacing,
    fontWeight: config.fontWeight,
  };
}

// CSS injection for better font loading
export function injectFontStyles() {
  if (typeof window !== 'undefined') {
    const styleId = 'monaco-font-styles';

    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .monaco-editor {
          /* Ensure PaperMono font is loaded properly */
          --monaco-font-family: var(--font-mono);
        }

        .monaco-editor .view-lines {
          /* Improve font rendering for PaperMono */
          font-feature-settings: "calt" 1, "liga" 1, "zero" 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Optimize for different font sizes */
        .monaco-editor.font-size-12 {
          line-height: 1.4 !important;
        }

        .monaco-editor.font-size-14 {
          line-height: 1.6 !important;
        }

        .monaco-editor.font-size-16 {
          line-height: 1.7 !important;
        }

        .monaco-editor.font-size-18 {
          line-height: 1.8 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Editor instance management
export class EditorManager {
  private static instance: EditorManager;
  private editors: Map<string, Monaco.editor.IStandaloneCodeEditor> = new Map();
  private monaco: typeof Monaco | null = null;

  private constructor() {}

  public static getInstance(): EditorManager {
    if (!EditorManager.instance) {
      EditorManager.instance = new EditorManager();
    }
    return EditorManager.instance;
  }

  public setMonacoInstance(monaco: typeof Monaco): void {
    this.monaco = monaco;
    this.registerThemes();
  }

  private registerThemes(): void {
    if (this.monaco) {
      registerCustomThemes(this.monaco);
    }
  }

  public addEditor(id: string, editor: Monaco.editor.IStandaloneCodeEditor): void {
    this.editors.set(id, editor);
  }

  public removeEditor(id: string): void {
    const editor = this.editors.get(id);
    if (editor) {
      editor.dispose();
      this.editors.delete(id);
    }
  }

  public getEditor(id: string): Monaco.editor.IStandaloneCodeEditor | undefined {
    return this.editors.get(id);
  }

  public getAllEditors(): Monaco.editor.IStandaloneCodeEditor[] {
    return Array.from(this.editors.values());
  }

  public disposeAll(): void {
    this.editors.forEach((editor) => editor.dispose());
    this.editors.clear();
  }
}

export const editorManager = EditorManager.getInstance();
