export type CodeLanguage =
	| 'javascript'
	| 'typescript'
	| 'python'
	| 'java'
	| 'cpp'
	| 'c'
	| 'csharp'
	| 'go'
	| 'rust'
	| 'php'
	| 'ruby'
	| 'swift'
	| 'kotlin'
	| 'scala'
	| 'bash'
	| 'powershell'
	| 'sql';

export interface CodeExecutionRequest {
	language: CodeLanguage;
	code: string;
	input?: string;
	version?: string;
	compilerOptions?: Record<string, any>;
}

export interface CodeExecutionResult {
	output: string;
	error?: string;
	exitCode: number;
	executionTime: number;
	memoryUsage: number;
	compileTime?: number;
	compileOutput?: string;
	signal?: string;
}

export interface CodeTemplate {
	id: string;
	name: string;
	language: CodeLanguage;
	description: string;
	code: string;
	input?: string;
	category: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface CodeEditorState {
	content: string;
	language: CodeLanguage;
	isDirty: boolean;
	cursorPosition: { line: number; column: number };
	selection?: {
		start: { line: number; column: number };
		end: { line: number; column: number };
	};
}

export type ExecutionStatus =
	| 'idle'
	| 'compiling'
	| 'running'
	| 'completed'
	| 'error'
	| 'timeout'
	| 'cancelled';

export interface CodeExecutionState {
	status: ExecutionStatus;
	request?: CodeExecutionRequest;
	result?: CodeExecutionResult;
	error?: string;
	startTime?: number;
	endTime?: number;
	progress?: number;
}

export interface TerminalLine {
	id: string;
	type: 'input' | 'output' | 'error' | 'info';
	content: string;
	timestamp: number;
}

export interface CodeFormatOptions {
	indentSize: number;
	indentType: 'spaces' | 'tabs';
	maxLineLength: number;
	semicolons: boolean;
	quotes: 'single' | 'double';
	trailingComma: boolean;
}

export interface LanguageConfig {
	name: string;
	version: string;
	extensions: string[];
	compiler?: string;
	interpreter?: string;
	defaultCode: string;
	compileTimeLimit: number;
	executionTimeLimit: number;
	memoryLimit: number;
	supportsStdin: boolean;
	supportsCompilation: boolean;
	monacoLanguage: string;
}

export interface CodeExecutionSettings {
	timeout: number;
	memoryLimit: number;
	enableCompilationCache: boolean;
	enableSyntaxChecking: boolean;
	autoFormat: boolean;
	showLineNumbers: boolean;
	wordWrap: boolean;
	fontSize: number;
	theme: 'light' | 'dark' | 'high-contrast';
}

export interface CodeEditorProps {
	value: string;
	language: CodeLanguage;
	onChange: (value: string) => void;
	onLanguageChange: (language: CodeLanguage) => void;
	height?: string | number;
	width?: string | number;
	readOnly?: boolean;
	theme?: 'light' | 'dark' | 'high-contrast';
	fontSize?: number;
	wordWrap?: boolean;
	showLineNumbers?: boolean;
	minimap?: boolean;
	className?: string;
}

export interface LanguageSelectorProps {
	selectedLanguage: CodeLanguage;
	onLanguageChange: (language: CodeLanguage) => void;
	showVersion?: boolean;
	compact?: boolean;
	className?: string;
}

export interface CodeExecutionProps {
	request: CodeExecutionRequest;
	onExecutionStart: () => void;
	onExecutionComplete: (result: CodeExecutionResult) => void;
	onExecutionError: (error: string) => void;
	onCancel?: () => void;
	showProgress?: boolean;
	showStats?: boolean;
	className?: string;
}

export interface TerminalProps {
	lines: TerminalLine[];
	onInput?: (input: string) => void;
	onClear?: () => void;
	readonly?: boolean;
	height?: string | number;
	theme?: 'light' | 'dark' | 'high-contrast';
	showTimestamps?: boolean;
	showLineNumbers?: boolean;
	className?: string;
}

export interface CodeFormatterProps {
	code: string;
	language: CodeLanguage;
	options: CodeFormatOptions;
	onFormat: (formattedCode: string) => void;
	onError: (error: string) => void;
	className?: string;
}

export interface ExecutionStatusProps {
	status: ExecutionStatus;
	progress?: number;
	executionTime?: number;
	memoryUsage?: number;
	error?: string;
	onCancel?: () => void;
	compact?: boolean;
	className?: string;
}

export interface CodeTemplateGalleryProps {
	templates: CodeTemplate[];
	onSelectTemplate: (template: CodeTemplate) => void;
	selectedLanguage?: CodeLanguage;
	category?: string;
	search?: string;
	className?: string;
}
