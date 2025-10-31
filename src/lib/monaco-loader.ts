/**
 * Optimized Monaco Editor loader with dynamic language support
 * Reduces bundle size by loading languages on-demand
 */

let monacoInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/**
 * Supported languages for lazy loading
 */
export const SUPPORTED_LANGUAGES = {
	javascript: 'javascript',
	typescript: 'typescript',
	json: 'json',
	html: 'html',
	css: 'css',
	sql: 'sql',
	python: 'python',
	xml: 'xml',
	yaml: 'yaml',
	markdown: 'markdown',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Core Monaco loader - loads only the base editor
 */
async function loadCoreMonaco(): Promise<any> {
	// Dynamic import to avoid including in main bundle
	const monaco = await import('monaco-editor');

	// Configure essential features only
	monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
		noSemanticValidation: true,
		noSyntaxValidation: false,
	});

	monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
		noSemanticValidation: true,
		noSyntaxValidation: false,
	});

	// Configure basic themes
	monaco.editor.defineTheme('custom-dark', {
		base: 'vs-dark',
		inherit: true,
		rules: [
			{ token: 'comment', foreground: '6a9955' },
			{ token: 'keyword', foreground: '569cd6' },
			{ token: 'string', foreground: 'ce9178' },
			{ token: 'number', foreground: 'b5cea8' },
		],
		colors: {
			'editor.background': '#1e1e1e',
			'editor.foreground': '#d4d4d4',
		},
	});

	return monaco;
}

/**
 * Load language support dynamically
 */
async function loadLanguage(monaco: any, language: string): Promise<void> {
	try {
		// Only load languages we support
		if (language in SUPPORTED_LANGUAGES) {
			await import(`monaco-editor/esm/vs/basic-languages/${language}/${language}.contrib`);
		}
	} catch (error) {
		console.warn(`Failed to load language support for ${language}:`, error);
	}
}

/**
 * Get Monaco Editor instance with optional language support
 * @param language - Optional language to load
 * @returns Promise resolving to Monaco instance
 */
export async function getMonacoInstance(language?: SupportedLanguage): Promise<any> {
	// Return existing instance if already loaded
	if (monacoInstance) {
		if (language && !monacoInstance.languages.getLanguages().some((lang: any) => lang.id === language)) {
			await loadLanguage(monacoInstance, language);
		}
		return monacoInstance;
	}

	// Return existing loading promise if already loading
	if (loadingPromise) {
		const monaco = await loadingPromise;
		if (language) {
			await loadLanguage(monaco, language);
		}
		return monaco;
	}

	// Start loading core Monaco
	loadingPromise = loadCoreMonaco();
	monacoInstance = await loadingPromise;

	// Load language if specified
	if (language) {
		await loadLanguage(monacoInstance, language);
	}

	return monacoInstance;
}

/**
 * Create Monaco Editor instance with optimized settings
 * @param container - HTML element to host the editor
 * @param options - Editor configuration options
 * @param language - Programming language
 * @returns Promise resolving to editor instance
 */
export async function createMonacoEditor(
	container: HTMLElement,
	options: any = {},
	language?: SupportedLanguage,
): Promise<any> {
	const monaco = await getMonacoInstance(language);

	// Optimized default options
	const defaultOptions = {
		theme: 'vs-dark',
		fontSize: 14,
		fontFamily: 'Monaco, "Courier New", monospace',
		lineNumbers: 'on',
		minimap: { enabled: false }, // Disable minimap to save resources
		scrollBeyondLastLine: false,
		automaticLayout: true,
		wordWrap: 'on',
		tabSize: 2,
		insertSpaces: true,
		renderWhitespace: 'selection',
		contextmenu: true,
		quickSuggestions: true,
		suggestOnTriggerCharacters: true,
		acceptSuggestionOnEnter: 'on',
		tabCompletion: 'on',
		wordBasedSuggestions: true,
		parameterHints: { enabled: true },
		hover: { enabled: true },
		definitionLinkOpensInPeek: true,
		links: true,
		colorDecorators: true,
		lightbulb: { enabled: true },
		codeActionsOnSave: {
			'source.fixAll': 'explicit',
		},
		...options,
	};

	const editor = monaco.editor.create(container, defaultOptions);

	// Set language if specified
	if (language) {
		const model = monaco.editor.createModel('', language);
		editor.setModel(model);
	}

	return editor;
}

/**
 * Preload commonly used languages for better UX
 * Call this during app initialization for critical tools
 */
export async function preloadCommonLanguages(): Promise<void> {
	const commonLanguages: SupportedLanguage[] = ['javascript', 'typescript', 'json'];

	try {
		const monaco = await getMonacoInstance();
		await Promise.all(commonLanguages.map((lang) => loadLanguage(monaco, lang)));
	} catch (error) {
		console.warn('Failed to preload common languages:', error);
	}
}

/**
 * Dispose Monaco instance and cleanup resources
 * Call this when the editor is no longer needed
 */
export function disposeMonaco(): void {
	if (monacoInstance) {
		// Dispose all models
		for (const model of monacoInstance.editor.getModels()) {
			model.dispose();
		}

		// Clear instance
		monacoInstance = null;
		loadingPromise = null;
	}
}

/**
 * Check if a language is supported
 * @param language - Language to check
 * @returns True if language is supported
 */
export function isLanguageSupported(language: string): language is SupportedLanguage {
	return language in SUPPORTED_LANGUAGES;
}
