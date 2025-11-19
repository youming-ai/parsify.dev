/**
 * Monaco Editor Extension System
 * Provides language support and extensions for Monaco Editor
 */

import * as monaco from "monaco-editor";

export interface LanguageDefinition {
  id: string;
  name: string;
  extensions: string[];
  aliases: string[];
  mimetypes: string[];
  configuration?: LanguageConfiguration;
  theme?: EditorThemeDefinition;
  tokenizer?: TokenizerDefinition;
  worker?: WorkerDefinition;
  completion?: CompletionDefinition;
  formatting?: FormattingDefinition;
  diagnostics?: DiagnosticsDefinition;
}

export interface LanguageConfiguration {
  comments?: {
    lineComment?: string;
    blockComment?: [string, string];
  };
  brackets?: [string, string][];
  autoClosingPairs?: AutoClosingPair[];
  surroundingPairs?: AutoClosingPair[];
  indentationRules?: IndentationRules;
  folding?: FoldingRules;
  wordPattern?: RegExp;
}

export interface AutoClosingPair {
  open: string;
  close: string;
  notIn?: string[];
}

export interface IndentationRules {
  increaseIndentPattern: RegExp;
  decreaseIndentPattern: RegExp;
  indentNextLinePattern?: RegExp;
  unIndentedLinePattern?: RegExp;
}

export interface FoldingRules {
  offSide?: boolean;
  markers?: {
    start?: RegExp;
    end?: RegExp;
  };
}

export interface TokenizerDefinition {
  root: TokenRule[];
  [state: string]: TokenRule[];
}

export interface TokenRule {
  regex: RegExp | string;
  action: TokenAction;
  next?: string;
}

export interface TokenAction {
  token?: string;
  next?: string;
  nextEmbedded?: string;
  log?: string;
}

export interface EditorThemeDefinition {
  base: "vs" | "vs-dark" | "hc-black";
  inherit: boolean;
  rules: TokenThemeRule[];
  colors: ThemeColors;
}

export interface TokenThemeRule {
  token: string;
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

export interface ThemeColors {
  [colorName: string]: string;
}

export interface WorkerDefinition {
  getWorker: () => Promise<any>;
  label: string;
  entry?: string;
}

export interface CompletionDefinition {
  triggerCharacters?: string[];
  provider: CompletionProvider;
}

export interface CompletionProvider {
  provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
  ): Promise<monaco.languages.CompletionItem[]>;
  resolveCompletionItem?(
    item: monaco.languages.CompletionItem,
  ): Promise<monaco.languages.CompletionItem>;
}

export interface FormattingDefinition {
  provideDocumentFormattingEdits(
    model: monaco.editor.ITextModel,
    options: monaco.languages.FormattingOptions,
  ): Promise<monaco.languages.TextEdit[]>;
  provideDocumentRangeFormattingEdits?(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions,
  ): Promise<monaco.languages.TextEdit[]>;
}

export interface DiagnosticsDefinition {
  validate?: (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
  ) => Promise<monaco.languages.Diagnostic[]>;
  doValidation?: (
    model: monaco.editor.ITextModel,
  ) => Promise<monaco.languages.Diagnostic[]>;
}

export interface MonacoExtension {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  languages: LanguageDefinition[];
  themes?: EditorThemeDefinition[];
  dependencies?: string[];
  enabled: boolean;
  loaded: boolean;
}

export class MonacoExtensionManager {
  private static instance: MonacoExtensionManager;
  private extensions: Map<string, MonacoExtension>;
  private languageRegistry: Map<string, LanguageDefinition>;
  private themeRegistry: Map<string, EditorThemeDefinition>;
  private workerManager: MonacoWorkerManager;
  private completionProviders: Map<string, monaco.Disposable>;
  private formattingProviders: Map<string, monaco.Disposable>;
  private diagnosticsProviders: Map<string, monaco.Disposable>;
  private eventListeners: Map<string, Function[]>;

  private constructor() {
    this.extensions = new Map();
    this.languageRegistry = new Map();
    this.themeRegistry = new Map();
    this.workerManager = new MonacoWorkerManager();
    this.completionProviders = new Map();
    this.formattingProviders = new Map();
    this.diagnosticsProviders = new Map();
    this.eventListeners = new Map();

    this.initializeDefaultLanguages();
  }

  public static getInstance(): MonacoExtensionManager {
    if (!MonacoExtensionManager.instance) {
      MonacoExtensionManager.instance = new MonacoExtensionManager();
    }
    return MonacoExtensionManager.instance;
  }

  /**
   * Register an extension
   */
  public async registerExtension(extension: MonacoExtension): Promise<void> {
    try {
      // Validate extension
      this.validateExtension(extension);

      // Register languages
      for (const language of extension.languages) {
        await this.registerLanguage(language);
      }

      // Register themes
      if (extension.themes) {
        for (const theme of extension.themes) {
          this.registerTheme(theme);
        }
      }

      // Mark as loaded
      extension.loaded = true;
      this.extensions.set(extension.id, extension);

      this.emit("extension:registered", { extension });
    } catch (error) {
      extension.loaded = false;
      throw new Error(`Failed to register extension ${extension.id}: ${error}`);
    }
  }

  /**
   * Unregister an extension
   */
  public unregisterExtension(extensionId: string): boolean {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return false;
    }

    // Dispose of language providers
    for (const language of extension.languages) {
      this.disposeLanguageProviders(language.id);
    }

    // Remove from registry
    this.extensions.delete(extensionId);

    this.emit("extension:unregistered", { extensionId });
    return true;
  }

  /**
   * Get extension by ID
   */
  public getExtension(extensionId: string): MonacoExtension | null {
    return this.extensions.get(extensionId) || null;
  }

  /**
   * Get all extensions
   */
  public getAllExtensions(): MonacoExtension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extensions by language
   */
  public getExtensionsByLanguage(languageId: string): MonacoExtension[] {
    return Array.from(this.extensions.values()).filter((ext) =>
      ext.languages.some((lang) => lang.id === languageId),
    );
  }

  /**
   * Register a single language
   */
  public async registerLanguage(language: LanguageDefinition): Promise<void> {
    try {
      // Register language definition
      monaco.languages.register({ id: language.id });

      // Set language configuration
      if (language.configuration) {
        monaco.languages.setLanguageConfiguration(
          language.id,
          language.configuration,
        );
      }

      // Set tokens provider
      if (language.tokenizer) {
        monaco.languages.setMonarchTokensProvider(
          language.id,
          language.tokenizer,
        );
      }

      // Set up worker if provided
      if (language.worker) {
        this.workerManager.setupWorker(language);
      }

      // Set up completion provider
      if (language.completion) {
        const disposable = monaco.languages.registerCompletionItemProvider(
          language.id,
          {
            provideCompletionItems:
              language.completion.provider.provideCompletionItems,
            resolveCompletionItem:
              language.completion.provider.resolveCompletionItem,
            triggerCharacters: language.completion.triggerCharacters,
          },
        );
        this.completionProviders.set(language.id, disposable);
      }

      // Set up formatting provider
      if (language.formatting) {
        const disposable =
          monaco.languages.registerDocumentFormattingEditProvider(language.id, {
            provideDocumentFormattingEdits:
              language.formatting.provideDocumentFormattingEdits,
            provideDocumentRangeFormattingEdits:
              language.formatting.provideDocumentRangeFormattingEdits,
          });
        this.formattingProviders.set(language.id, disposable);
      }

      // Set up diagnostics provider
      if (language.diagnostics) {
        const disposable =
          monaco.languages.registerDocumentSemanticTokensProvider(language.id, {
            provideDocumentSemanticTokens: async (model) => {
              if (language.diagnostics?.validate) {
                const diagnostics = await language.diagnostics.validate(
                  model,
                  model.getPositionAt(0),
                );
                return {
                  data: new Uint32Array([0]),
                  resultId: "",
                };
              }
              return { data: new Uint32Array([0]), resultId: "" };
            },
            getLegend: () => ({
              tokenTypes: ["type", "class", "function"],
              tokenModifiers: [],
            }),
            releaseDocumentSemanticTokens: () => {},
          });
        this.diagnosticsProviders.set(language.id, disposable);
      }

      this.languageRegistry.set(language.id, language);
      this.emit("language:registered", { language });
    } catch (error) {
      throw new Error(`Failed to register language ${language.id}: ${error}`);
    }
  }

  /**
   * Register theme
   */
  public registerTheme(theme: EditorThemeDefinition): void {
    const themeName = `theme-${Date.now()}`;
    monaco.editor.defineTheme(themeName, theme);
    this.themeRegistry.set(themeName, theme);
    this.emit("theme:registered", { theme, themeName });
  }

  /**
   * Get language support
   */
  public getLanguageSupport(languageId: string): LanguageDefinition | null {
    return this.languageRegistry.get(languageId) || null;
  }

  /**
   * Get supported languages
   */
  public getSupportedLanguages(): string[] {
    return Array.from(this.languageRegistry.keys());
  }

  /**
   * Check if language is supported
   */
  public isLanguageSupported(languageId: string): boolean {
    return this.languageRegistry.has(languageId);
  }

  /**
   * Get language for file extension
   */
  public getLanguageForExtension(extension: string): string | null {
    for (const language of this.languageRegistry.values()) {
      if (language.extensions.includes(extension)) {
        return language.id;
      }
    }
    return null;
  }

  /**
   * Get language for MIME type
   */
  public getLanguageForMimeType(mimeType: string): string | null {
    for (const language of this.languageRegistry.values()) {
      if (language.mimetypes.includes(mimeType)) {
        return language.id;
      }
    }
    return null;
  }

  /**
   * Create editor with language support
   */
  public createEditor(
    container: HTMLElement,
    options: monaco.editor.IStandaloneEditorConstructionOptions = {},
    languageId?: string,
  ): monaco.editor.IStandaloneCodeEditor {
    const editor = monaco.editor.create(container, options);

    if (languageId) {
      const model = monaco.editor.createModel("", languageId);
      editor.setModel(model);
    }

    return editor;
  }

  /**
   * Create diff editor
   */
  public createDiffEditor(
    container: HTMLElement,
    options: monaco.editor.IStandaloneDiffEditorConstructionOptions = {},
    originalLanguageId?: string,
    modifiedLanguageId?: string,
  ): monaco.editor.IStandaloneDiffEditor {
    const editor = monaco.editor.createDiffEditor(container, options);

    if (originalLanguageId || modifiedLanguageId) {
      const originalModel = monaco.editor.createModel(
        "",
        originalLanguageId || modifiedLanguageId || "plaintext",
      );
      const modifiedModel = monaco.editor.createModel(
        "",
        modifiedLanguageId || originalLanguageId || "plaintext",
      );

      editor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });
    }

    return editor;
  }

  /**
   * Enable/disable extension
   */
  public setExtensionEnabled(extensionId: string, enabled: boolean): boolean {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return false;
    }

    extension.enabled = enabled;

    if (enabled) {
      // Re-enable language providers
      for (const language of extension.languages) {
        this.enableLanguageProviders(language.id);
      }
    } else {
      // Disable language providers
      for (const language of extension.languages) {
        this.disableLanguageProviders(language.id);
      }
    }

    this.emit("extension:toggled", { extensionId, enabled });
    return true;
  }

  /**
   * Load language on demand
   */
  public async loadLanguage(languageId: string): Promise<void> {
    if (this.isLanguageSupported(languageId)) {
      return;
    }

    // Try to load from built-in language definitions
    const languageDefinition = this.getBuiltInLanguage(languageId);
    if (languageDefinition) {
      await this.registerLanguage(languageDefinition);
    } else {
      throw new Error(`Language ${languageId} not found`);
    }
  }

  /**
   * Dispose of manager
   */
  public dispose(): void {
    // Dispose all providers
    for (const disposable of this.completionProviders.values()) {
      disposable.dispose();
    }
    for (const disposable of this.formattingProviders.values()) {
      disposable.dispose();
    }
    for (const disposable of this.diagnosticsProviders.values()) {
      disposable.dispose();
    }

    // Clear registries
    this.extensions.clear();
    this.languageRegistry.clear();
    this.themeRegistry.clear();
    this.completionProviders.clear();
    this.formattingProviders.clear();
    this.diagnosticsProviders.clear();

    // Dispose worker manager
    this.workerManager.dispose();

    this.emit("manager:disposed");
  }

  /**
   * Private methods
   */
  private initializeDefaultLanguages(): void {
    // Define built-in languages
    const builtInLanguages = [
      this.createTypeScriptDefinition(),
      this.createJavaScriptDefinition(),
      this.createPythonDefinition(),
      this.createGoDefinition(),
      this.createRustDefinition(),
      this.createJavaDefinition(),
      this.createCppDefinition(),
      this.createJsonDefinition(),
      this.createYamlDefinition(),
      this.createMarkdownDefinition(),
    ];

    builtInLanguages.forEach((language) => {
      this.languageRegistry.set(language.id, language);
    });
  }

  private createTypeScriptDefinition(): LanguageDefinition {
    return {
      id: "typescript",
      name: "TypeScript",
      extensions: [".ts", ".tsx"],
      aliases: ["TypeScript", "ts"],
      mimetypes: ["text/typescript"],
      configuration: {
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"', notIn: ["string"] },
          { open: "'", close: "'", notIn: ["string", "comment"] },
          { open: "`", close: "`", notIn: ["string", "comment"] },
        ],
      },
    };
  }

  private createJavaScriptDefinition(): LanguageDefinition {
    return {
      id: "javascript",
      name: "JavaScript",
      extensions: [".js", ".jsx", ".mjs"],
      aliases: ["JavaScript", "js"],
      mimetypes: ["text/javascript", "application/javascript"],
      configuration: {
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"', notIn: ["string"] },
          { open: "'", close: "'", notIn: ["string", "comment"] },
          { open: "`", close: "`", notIn: ["string", "comment"] },
        ],
      },
    };
  }

  private createPythonDefinition(): LanguageDefinition {
    return {
      id: "python",
      name: "Python",
      extensions: [".py", ".pyw", ".pyi"],
      aliases: ["Python", "py"],
      mimetypes: ["text/x-python", "text/x-script.python"],
      configuration: {
        comments: {
          lineComment: "#",
          blockComment: ['"""', '"""'],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"', notIn: ["string"] },
          { open: "'", close: "'", notIn: ["string", "comment"] },
        ],
        indentationRules: {
          increaseIndentPattern: /^.*:\s*$/,
          decreaseIndentPattern: /^\s*(pass|return|break|continue|raise)\b.*$/,
        },
      },
    };
  }

  private createGoDefinition(): LanguageDefinition {
    return {
      id: "go",
      name: "Go",
      extensions: [".go"],
      aliases: ["Go", "golang"],
      mimetypes: ["text/x-go"],
      configuration: {
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"', notIn: ["string"] },
          { open: "'", close: "'", notIn: ["string", "comment"] },
          { open: "`", close: "`" },
        ],
      },
    };
  }

  private createRustDefinition(): LanguageDefinition {
    return {
      id: "rust",
      name: "Rust",
      extensions: [".rs"],
      aliases: ["Rust", "rs"],
      mimetypes: ["text/x-rust"],
      configuration: {
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"', notIn: ["string"] },
          { open: "'", close: "'", notIn: ["string", "comment"] },
        ],
      },
    };
  }

  private createJavaDefinition(): LanguageDefinition {
    return {
      id: "java",
      name: "Java",
      extensions: [".java", ".class"],
      aliases: ["Java"],
      mimetypes: ["text/x-java", "text/x-java-source"],
      configuration: {
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"', notIn: ["string"] },
          { open: "'", close: "'", notIn: ["string", "comment"] },
        ],
      },
    };
  }

  private createCppDefinition(): LanguageDefinition {
    return {
      id: "cpp",
      name: "C++",
      extensions: [".cpp", ".cxx", ".cc", ".c++", ".h", ".hh", ".hpp", ".hxx"],
      aliases: ["C++", "cpp", "c++"],
      mimetypes: ["text/x-c++", "text/x-c++src"],
      configuration: {
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
          ["<", ">"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: "<", close: ">" },
          { open: '"', close: '"', notIn: ["string"] },
          { open: "'", close: "'", notIn: ["string", "comment"] },
        ],
      },
    };
  }

  private createJsonDefinition(): LanguageDefinition {
    return {
      id: "json",
      name: "JSON",
      extensions: [".json", ".jsonc", ".jsonl"],
      aliases: ["JSON", "json"],
      mimetypes: ["application/json", "application/jsonc"],
      configuration: {
        brackets: [
          ["{", "}"],
          ["[", "]"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: '"', close: '"' },
        ],
      },
    };
  }

  private createYamlDefinition(): LanguageDefinition {
    return {
      id: "yaml",
      name: "YAML",
      extensions: [".yaml", ".yml"],
      aliases: ["YAML", "yaml", "yml"],
      mimetypes: ["text/x-yaml", "application/x-yaml"],
      configuration: {
        comments: {
          lineComment: "#",
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
      },
    };
  }

  private createMarkdownDefinition(): LanguageDefinition {
    return {
      id: "markdown",
      name: "Markdown",
      extensions: [".md", ".markdown", ".mdown", ".mkd"],
      aliases: ["Markdown", "md"],
      mimetypes: ["text/x-markdown", "text/markdown"],
      configuration: {
        comments: {
          blockComment: ["<!--", "-->"],
        },
      },
    };
  }

  private validateExtension(extension: MonacoExtension): void {
    if (!extension.id || !extension.name) {
      throw new Error("Extension must have id and name");
    }

    if (!extension.languages || extension.languages.length === 0) {
      throw new Error("Extension must provide at least one language");
    }

    for (const language of extension.languages) {
      if (!language.id || !language.name) {
        throw new Error("Language must have id and name");
      }
    }
  }

  private disposeLanguageProviders(languageId: string): void {
    const completionProvider = this.completionProviders.get(languageId);
    if (completionProvider) {
      completionProvider.dispose();
      this.completionProviders.delete(languageId);
    }

    const formattingProvider = this.formattingProviders.get(languageId);
    if (formattingProvider) {
      formattingProvider.dispose();
      this.formattingProviders.delete(languageId);
    }

    const diagnosticsProvider = this.diagnosticsProviders.get(languageId);
    if (diagnosticsProvider) {
      diagnosticsProvider.dispose();
      this.diagnosticsProviders.delete(languageId);
    }
  }

  private enableLanguageProviders(languageId: string): void {
    const language = this.languageRegistry.get(languageId);
    if (!language) return;

    // Re-register providers
    if (language.completion) {
      const disposable = monaco.languages.registerCompletionItemProvider(
        languageId,
        {
          provideCompletionItems:
            language.completion.provider.provideCompletionItems,
          resolveCompletionItem:
            language.completion.provider.resolveCompletionItem,
          triggerCharacters: language.completion.triggerCharacters,
        },
      );
      this.completionProviders.set(languageId, disposable);
    }
  }

  private disableLanguageProviders(languageId: string): void {
    this.disposeLanguageProviders(languageId);
  }

  private getBuiltInLanguage(languageId: string): LanguageDefinition | null {
    return this.languageRegistry.get(languageId) || null;
  }

  /**
   * Event handling
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(
          `Error in Monaco extension manager event listener for ${event}:`,
          error,
        );
      }
    });
  }
}

class MonacoWorkerManager {
  private workers: Map<string, Worker>;
  private workerPromises: Map<string, Promise<any>>;

  constructor() {
    this.workers = new Map();
    this.workerPromises = new Map();
  }

  public setupWorker(language: LanguageDefinition): void {
    if (!language.worker) return;

    const workerId = `${language.id}-worker`;

    if (!this.workerPromises.has(workerId)) {
      this.workerPromises.set(workerId, language.worker.getWorker());
    }
  }

  public dispose(): void {
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    this.workers.clear();
    this.workerPromises.clear();
  }
}

export default MonacoExtensionManager;
