import * as React from "react";
import { cn } from "@/lib/utils";
import type { CodeEditorProps } from "./code-types";
import { getLanguageConfig } from "./language-configs";

// Use lazy loading for better performance
const Editor = React.lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor })),
);

export function CodeEditor({
  value,
  language,
  onChange,
  onLanguageChange,
  height = 400,
  width = "100%",
  readOnly = false,
  theme = "dark",
  fontSize = 14,
  wordWrap = true,
  showLineNumbers = true,
  minimap = false,
  className,
}: CodeEditorProps) {
  const [editor, setEditor] = React.useState<any>(null);
  const [monaco, setMonaco] = React.useState<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    setEditor(editor);
    setMonaco(monaco);

    // Configure editor options
    editor.updateOptions({
      fontSize,
      wordWrap: wordWrap ? "on" : "off",
      lineNumbers: showLineNumbers ? "on" : "off",
      minimap: { enabled: minimap },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderLineHighlight: "line",
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save shortcut - could be implemented
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      // Format shortcut
      monaco.editor.trigger(editor, "editor.action.formatDocument", {});
    });

    // Handle cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      const _position = e.position;
      // Could propagate cursor position to parent if needed
    });

    // Handle content changes
    editor.onDidChangeModelContent(() => {
      if (onChange) {
        const newValue = editor.getValue();
        onChange(newValue);
      }
    });
  };

  // Update editor options when props change
  React.useEffect(() => {
    if (editor) {
      editor.updateOptions({
        fontSize,
        wordWrap: wordWrap ? "on" : "off",
        lineNumbers: showLineNumbers ? "on" : "off",
        readOnly,
        minimap: { enabled: minimap },
      });
    }
  }, [editor, fontSize, wordWrap, showLineNumbers, readOnly, minimap]);

  // Update theme
  React.useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(
        theme === "dark" ? "vs-dark" : theme === "high-contrast" ? "hc-black" : "vs-light",
      );
    }
  }, [monaco, theme]);

  const languageConfig = getLanguageConfig(language);

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <div className="border-b bg-gray-50 px-3 py-2 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700 text-sm dark:text-gray-300">
              {languageConfig.name}
            </span>
            {languageConfig.version && (
              <span className="text-gray-500 text-xs dark:text-gray-400">
                v{languageConfig.version}
              </span>
            )}
          </div>
          {onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as any)}
              className="rounded border bg-white px-2 py-1 text-xs dark:bg-gray-700 dark:text-gray-200"
            >
              {Object.entries({
                javascript: "JavaScript",
                typescript: "TypeScript",
                python: "Python",
                java: "Java",
                cpp: "C++",
                c: "C",
                csharp: "C#",
                go: "Go",
                rust: "Rust",
                php: "PHP",
                ruby: "Ruby",
                swift: "Swift",
                kotlin: "Kotlin",
                bash: "Bash",
                powershell: "PowerShell",
                sql: "SQL",
              }).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <React.Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
              <p className="text-gray-600 text-sm dark:text-gray-400">Loading editor...</p>
            </div>
          </div>
        }
      >
        <Editor
          height={height}
          width={width}
          language={languageConfig.monacoLanguage}
          value={value}
          onChange={(newValue) => {
            if (onChange && newValue !== undefined) {
              onChange(newValue);
            }
          }}
          onMount={handleEditorDidMount}
          theme={theme === "dark" ? "vs-dark" : theme === "high-contrast" ? "hc-black" : "vs-light"}
          options={{
            readOnly,
            minimap: { enabled: minimap },
            fontSize,
            wordWrap: wordWrap ? "on" : "off",
            lineNumbers: showLineNumbers ? "on" : "off",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            renderLineHighlight: "line",
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
          }}
        />
      </React.Suspense>
    </div>
  );
}

// Utility functions for code editor
export const formatCode = async (code: string, _language: string): Promise<string> => {
  try {
    // This would typically call a formatting service
    // For now, return the code as-is
    return code;
  } catch (error) {
    console.error("Error formatting code:", error);
    return code;
  }
};

// Safe JavaScript syntax validation using try-catch with Function constructor restrictions
const validateJavaScriptSyntax = (code: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /global\./gi,
      /process\./gi,
      /require\s*\(/gi,
      /import\s+.*\s+from/gi,
      /fetch\s*\(/gi,
      /XMLHttpRequest/gi,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        reject(new Error("Code contains potentially unsafe operations"));
        return;
      }
    }

    // Basic syntax validation - wrapped in try-catch for safety
    try {
      // Remove any potential IIFE (Immediately Invoked Function Expressions)
      const sanitizedCode = code.replace(/\(\s*function\s*\([^)]*\)\s*\{[^}]*\}\s*\)/gi, "");

      // Simple bracket and parenthesis matching
      const openBrackets = (sanitizedCode.match(/\{/g) || []).length;
      const closeBrackets = (sanitizedCode.match(/\}/g) || []).length;
      const openParens = (sanitizedCode.match(/\(/g) || []).length;
      const closeParens = (sanitizedCode.match(/\)/g) || []).length;

      if (openBrackets !== closeBrackets || openParens !== closeParens) {
        reject(new Error("Unmatched brackets or parentheses"));
        return;
      }

      // If we get here, basic syntax looks OK
      resolve();
    } catch (_error) {
      reject(new Error("Syntax validation failed"));
    }
  });
};

export const validateCode = async (
  code: string,
  language: string,
): Promise<{
  isValid: boolean;
  errors: Array<{ line: number; column: number; message: string }>;
}> => {
  try {
    // This would typically call a validation service
    // For now, return basic validation
    if (!code.trim()) {
      return { isValid: true, errors: [] };
    }

    // Basic syntax checking for common languages
    switch (language) {
      case "json":
        JSON.parse(code);
        break;
      case "javascript":
        // Safe JS syntax check
        await validateJavaScriptSyntax(code);
        break;
      default:
        break;
    }

    return { isValid: true, errors: [] };
  } catch (error: any) {
    return {
      isValid: false,
      errors: [
        {
          line: 1,
          column: 1,
          message: error.message || "Syntax error",
        },
      ],
    };
  }
};

export const getCodeStats = (code: string) => {
  const lines = code.split("\n").length;
  const words = code.split(/\s+/).filter((word) => word.length > 0).length;
  const characters = code.length;
  const charactersWithoutSpaces = code.replace(/\s/g, "").length;

  return {
    lines,
    words,
    characters,
    charactersWithoutSpaces,
  };
};
