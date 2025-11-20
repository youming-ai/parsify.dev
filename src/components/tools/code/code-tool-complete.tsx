import { Copy, Download, Play, RotateCcw, Settings, Upload } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToolWrapper } from "../tool-wrapper";
import { CodeEditor } from "./code-editor";
import { CodeFormatter, type FORMAT_PRESETS, FormatPresetSelector } from "./code-formatter";
import type {
  CodeExecutionRequest,
  CodeExecutionResult,
  CodeFormatOptions,
  CodeLanguage,
  CodeTemplate,
  ExecutionStatus as ExecutionStatusEnum,
  TerminalLine,
} from "./code-types";
import { ExecutionStatus } from "./execution-status";
import { getLanguageConfig, getTemplatesByLanguage } from "./language-configs";
import { LanguageSelector, QuickLanguageSelector } from "./language-selector";
import {
  createTerminalLine,
  formatTerminalError,
  formatTerminalOutput,
  Terminal,
} from "./terminal";

interface CodeToolCompleteProps {
  className?: string;
}

export function CodeToolComplete({ className }: CodeToolCompleteProps) {
  // Code Editor State
  const [code, setCode] = React.useState("");
  const [language, setLanguage] = React.useState<CodeLanguage>("javascript");
  const [stdin, setStdin] = React.useState("");

  // Execution State
  const [executionStatus, setExecutionStatus] = React.useState<ExecutionStatusEnum>("idle");
  const [executionResult, setExecutionResult] = React.useState<CodeExecutionResult | null>(null);
  const [executionError, setExecutionError] = React.useState("");
  const [executionProgress, setExecutionProgress] = React.useState(0);

  // Terminal State
  const [terminalLines, setTerminalLines] = React.useState<TerminalLine[]>([]);

  // Formatting State
  const [formatOptions, setFormatOptions] = React.useState<CodeFormatOptions>({
    indentSize: 2,
    indentType: "spaces",
    maxLineLength: 80,
    semicolons: true,
    quotes: "double",
    trailingComma: false,
  });
  const [_formattedCode, setFormattedCode] = React.useState("");
  const [selectedFormatPreset, setSelectedFormatPreset] =
    React.useState<keyof typeof FORMAT_PRESETS>("prettier");

  // UI State
  const [activeTab, setActiveTab] = React.useState("editor");
  const [_showSettings, _setShowSettings] = React.useState(false);
  const [_selectedTemplate, setSelectedTemplate] = React.useState<CodeTemplate | null>(null);

  const languageConfig = getLanguageConfig(language);

  // Initialize with default code when language changes
  React.useEffect(() => {
    if (!code.trim()) {
      setCode(languageConfig.defaultCode);
    }
  }, [languageConfig.defaultCode, code]);

  // Initialize terminal with welcome message
  React.useEffect(() => {
    const welcomeLine = createTerminalLine(
      `Welcome to Code Runner! Selected language: ${languageConfig.name}`,
      "info",
    );
    setTerminalLines([welcomeLine]);
  }, [languageConfig.name]);

  const handleExecutionStart = () => {
    setExecutionStatus("compiling");
    setExecutionProgress(0);
    setExecutionResult(null);
    setExecutionError("");

    // Add to terminal
    const startLine = createTerminalLine("Starting code execution...", "info");
    setTerminalLines((prev) => [...prev, startLine]);
  };

  const handleExecutionComplete = (result: CodeExecutionResult) => {
    setExecutionStatus("completed");
    setExecutionProgress(100);
    setExecutionResult(result);

    // Add to terminal
    const lines = [
      createTerminalLine("Execution completed successfully!", "info"),
      createTerminalLine(`Exit code: ${result.exitCode}`, "info"),
      createTerminalLine(`Execution time: ${result.executionTime}ms`, "info"),
      createTerminalLine(`Memory usage: ${result.memoryUsage}KB`, "info"),
    ];

    if (result.output) {
      lines.push(...formatTerminalOutput(result.output));
    }

    if (result.error) {
      lines.push(...formatTerminalError(result.error));
    }

    setTerminalLines((prev) => [...prev, ...lines]);
  };

  const _handleExecutionError = (error: string) => {
    setExecutionStatus("error");
    setExecutionError(error);

    // Add to terminal
    const errorLines = [
      createTerminalLine("Execution failed!", "error"),
      createTerminalLine(`Error: ${error}`, "error"),
    ];
    setTerminalLines((prev) => [...prev, ...errorLines]);
  };

  const handleCancelExecution = () => {
    setExecutionStatus("cancelled");
    setExecutionProgress(0);

    const cancelLine = createTerminalLine("Execution cancelled by user", "info");
    setTerminalLines((prev) => [...prev, cancelLine]);
  };

  const handleFormat = (formatted: string) => {
    setFormattedCode(formatted);
    setCode(formatted);

    const formatLine = createTerminalLine("Code formatted successfully", "info");
    setTerminalLines((prev) => [...prev, formatLine]);
  };

  const handleFormatError = (error: string) => {
    const errorLine = createTerminalLine(`Formatting error: ${error}`, "error");
    setTerminalLines((prev) => [...prev, errorLine]);
  };

  const handleTemplateSelect = (template: CodeTemplate) => {
    setCode(template.code);
    setLanguage(template.language);
    if (template.input) {
      setStdin(template.input);
    }
    setSelectedTemplate(template);
    setActiveTab("editor");

    const templateLine = createTerminalLine(
      `Loaded template: ${template.name} (${template.language})`,
      "info",
    );
    setTerminalLines((prev) => [...prev, templateLine]);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      const copyLine = createTerminalLine("Code copied to clipboard", "info");
      setTerminalLines((prev) => [...prev, copyLine]);
    });
  };

  const handleDownloadCode = () => {
    const extension = languageConfig.extensions[0] || ".txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-${Date.now()}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const downloadLine = createTerminalLine("Code downloaded successfully", "info");
    setTerminalLines((prev) => [...prev, downloadLine]);
  };

  const handleUploadCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);

        // Try to detect language from file extension
        const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const detectedLanguage = Object.entries(languageConfig.extensions).find(([_, exts]) =>
          exts.includes(extension),
        )?.[0] as CodeLanguage;

        if (detectedLanguage) {
          setLanguage(detectedLanguage);
        }

        const uploadLine = createTerminalLine(`File uploaded: ${file.name}`, "info");
        setTerminalLines((prev) => [...prev, uploadLine]);
      };
      reader.readAsText(file);
    }
  };

  const handleFormatPresetChange = (
    preset: keyof typeof FORMAT_PRESETS,
    options: CodeFormatOptions,
  ) => {
    setSelectedFormatPreset(preset);
    setFormatOptions(options);
  };

  const handleTerminalInput = (input: string) => {
    const inputLine = createTerminalLine(input, "input");
    setTerminalLines((prev) => [...prev, inputLine]);

    // Echo input back (in a real implementation, this would be sent to the running process)
    const outputLine = createTerminalLine(`Received input: ${input}`, "output");
    setTerminalLines((prev) => [...prev, outputLine]);
  };

  const handleClearTerminal = () => {
    setTerminalLines([]);
  };

  const runCode = () => {
    const _request: CodeExecutionRequest = {
      language,
      code,
      input: stdin,
    };

    // This would normally call the actual execution component
    // For now, we'll simulate the execution process
    handleExecutionStart();

    // Simulate compilation
    setTimeout(() => {
      setExecutionStatus("running");
      setExecutionProgress(50);

      // Simulate execution completion
      setTimeout(() => {
        const mockResult: CodeExecutionResult = {
          output: "Hello, World!\nCode executed successfully.",
          exitCode: 0,
          executionTime: 150,
          memoryUsage: 1024,
        };
        handleExecutionComplete(mockResult);
      }, 2000);
    }, 1000);
  };

  const resetAll = () => {
    setCode("");
    setStdin("");
    setExecutionStatus("idle");
    setExecutionResult(null);
    setExecutionError("");
    setExecutionProgress(0);
    setTerminalLines([]);
    setFormattedCode("");
  };

  const templates = getTemplatesByLanguage(language);

  return (
    <ToolWrapper
      title="Code Runner & IDE"
      description="Comprehensive code execution environment with multi-language support, formatting, and terminal interface"
      error={executionError}
    >
      <div className="space-y-4">
        {/* Language Selection Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="language-select">Language:</Label>
                <LanguageSelector
                  selectedLanguage={language}
                  onLanguageChange={setLanguage}
                  compact={true}
                />
              </div>

              <div className="flex items-center gap-2">
                <QuickLanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>

                <Button variant="outline" size="sm" onClick={handleDownloadCode}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>

                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" type="button">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.js,.ts,.py,.java,.cpp,.c,.cs,.go,.rs,.php,.rb,.swift,.kt,.sh,.ps1,.sql"
                    onChange={handleUploadCode}
                    className="hidden"
                  />
                </label>

                <Button variant="outline" size="sm" onClick={resetAll}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="terminal">Terminal</TabsTrigger>
            <TabsTrigger value="formatter">Formatter</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Code Editor */}
              <div className="lg:col-span-2">
                <CodeEditor
                  value={code}
                  language={language}
                  onChange={setCode}
                  onLanguageChange={setLanguage}
                  height={500}
                  className="w-full"
                />
              </div>

              {/* Input & Execution Panel */}
              <div className="space-y-4">
                {/* Stdin Input */}
                {languageConfig.supportsStdin && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Standard Input</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        placeholder="Enter input for the program..."
                        className="min-h-[100px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Run Button */}
                <Button
                  onClick={runCode}
                  disabled={executionStatus === "running" || executionStatus === "compiling"}
                  className="w-full"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {executionStatus === "running" ? "Running..." : "Run Code"}
                </Button>

                {/* Execution Status */}
                <ExecutionStatus
                  status={executionStatus}
                  progress={executionProgress}
                  executionTime={executionResult?.executionTime}
                  memoryUsage={executionResult?.memoryUsage}
                  error={executionError}
                  onCancel={handleCancelExecution}
                  compact={true}
                />

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleCopyCode}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleDownloadCode}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveTab("formatter")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Format Code
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Terminal Tab */}
          <TabsContent value="terminal" className="space-y-4">
            <Terminal
              lines={terminalLines}
              onInput={handleTerminalInput}
              onClear={handleClearTerminal}
              height={600}
              showTimestamps={true}
              allowClear={true}
              allowCopy={true}
              allowDownload={true}
            />
          </TabsContent>

          {/* Formatter Tab */}
          <TabsContent value="formatter" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Formatting Presets</CardTitle>
                    <Badge variant="secondary">{selectedFormatPreset}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormatPresetSelector
                    selectedPreset={selectedFormatPreset}
                    onPresetChange={handleFormatPresetChange}
                  />
                </CardContent>
              </Card>

              <CodeFormatter
                code={code}
                language={language}
                options={formatOptions}
                onFormat={handleFormat}
                onError={handleFormatError}
              />
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Code Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {template.difficulty}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-2 text-gray-600 text-xs dark:text-gray-400">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                            <Button size="sm" onClick={() => handleTemplateSelect(template)}>
                              Use
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Editor Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="font-size">Font Size</Label>
                      <Input id="font-size" type="number" defaultValue={14} min={10} max={24} />
                    </div>
                    <div>
                      <Label htmlFor="tab-size">Tab Size</Label>
                      <Input id="tab-size" type="number" defaultValue={2} min={1} max={8} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Execution Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="timeout">Timeout (ms)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        defaultValue={5000}
                        min={1000}
                        max={30000}
                      />
                    </div>
                    <div>
                      <Label htmlFor="memory-limit">Memory Limit (KB)</Label>
                      <Input
                        id="memory-limit"
                        type="number"
                        defaultValue={128000}
                        min={1024}
                        max={1024000}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ToolWrapper>
  );
}
