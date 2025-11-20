import {
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Send,
  Terminal as TerminalIcon,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TerminalLine, TerminalProps } from "./code-types";

interface TerminalComponentProps extends TerminalProps {
  maxLines?: number;
  autoScroll?: boolean;
  showLineNumbers?: boolean;
  showTimestamps?: boolean;
  inputPlaceholder?: string;
  allowClear?: boolean;
  allowCopy?: boolean;
  allowDownload?: boolean;
  onCopy?: (lines: TerminalLine[]) => void;
  onDownload?: (lines: TerminalLine[]) => void;
  className?: string;
}

export function Terminal({
  lines,
  onInput,
  onClear,
  readonly = false,
  height = 400,
  theme = "dark",
  showTimestamps = true,
  showLineNumbers = false,
  maxLines = 1000,
  autoScroll = true,
  inputPlaceholder = "Enter input...",
  allowClear = true,
  allowCopy = true,
  allowDownload = true,
  onCopy,
  onDownload,
  className,
}: TerminalComponentProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [lineNumbers, setLineNumbers] = React.useState(true);
  const [timestamps, setTimestamps] = React.useState(showTimestamps);
  const [showControls, setShowControls] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);

  const terminalRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const linesEndRef = React.useRef<HTMLDivElement>(null);

  // Limit lines to maxLines
  const limitedLines = React.useMemo(() => {
    if (lines.length <= maxLines) return lines;
    return lines.slice(-maxLines);
  }, [lines, maxLines]);

  // Auto scroll to bottom when new lines are added
  React.useEffect(() => {
    if (autoScroll && linesEndRef.current) {
      linesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [autoScroll]);

  // Focus input when terminal is clicked
  const handleTerminalClick = () => {
    if (!readonly && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onInput) {
      onInput(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit(e);
    }
  };

  const clearTerminal = () => {
    if (onClear) {
      onClear();
    }
  };

  const copyTerminalContent = () => {
    const content = limitedLines
      .map((line) => {
        const timestamp = timestamps ? `[${new Date(line.timestamp).toLocaleTimeString()}] ` : "";
        const lineNumber = lineNumbers ? `${limitedLines.indexOf(line) + 1}: ` : "";
        const prefix = line.type === "input" ? "> " : line.type === "error" ? "! " : "  ";
        return `${timestamp}${lineNumber}${prefix}${line.content}`;
      })
      .join("\n");

    navigator.clipboard.writeText(content).then(() => {
      if (onCopy) {
        onCopy(limitedLines);
      }
    });
  };

  const downloadTerminalContent = () => {
    const content = limitedLines
      .map((line) => {
        const timestamp = timestamps ? `[${new Date(line.timestamp).toLocaleTimeString()}] ` : "";
        const lineNumber = lineNumbers ? `${limitedLines.indexOf(line) + 1}: ` : "";
        const prefix = line.type === "input" ? "> " : line.type === "error" ? "! " : "  ";
        return `${timestamp}${lineNumber}${prefix}${line.content}`;
      })
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-output-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onDownload) {
      onDownload(limitedLines);
    }
  };

  const getLineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input":
        return "text-blue-600 dark:text-blue-400";
      case "output":
        return "text-gray-900 dark:text-gray-100";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "info":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-900 dark:text-gray-100";
    }
  };

  const getLineIcon = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input":
        return "❯";
      case "error":
        return "✕";
      case "info":
        return "ℹ";
      default:
        return "";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (isMinimized) {
    return (
      <Card className={cn("border", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalIcon className="h-4 w-4" />
              <span className="font-medium">Terminal</span>
              <Badge variant="secondary">{limitedLines.length} lines</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(false)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border", className)}>
      {/* Terminal Header */}
      <div className="border-b bg-gray-50 px-4 py-2 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4" />
            <span className="font-medium">Terminal</span>
            <Badge variant="secondary">{limitedLines.length} lines</Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View Options */}
            <Button variant="ghost" size="sm" onClick={() => setShowControls(!showControls)}>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", showControls && "rotate-180")}
              />
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
              <ChevronDown className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </div>

        {/* Terminal Controls */}
        {showControls && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lineNumbers}
                  onChange={(e) => setLineNumbers(e.target.checked)}
                  className="rounded"
                />
                Line Numbers
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={timestamps}
                  onChange={(e) => setTimestamps(e.target.checked)}
                  className="rounded"
                />
                Timestamps
              </label>
            </div>

            <div className="flex items-center gap-2">
              {allowCopy && (
                <Button variant="outline" size="sm" onClick={copyTerminalContent}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              )}

              {allowDownload && (
                <Button variant="outline" size="sm" onClick={downloadTerminalContent}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}

              {allowClear && (
                <Button variant="outline" size="sm" onClick={clearTerminal}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Terminal Content */}
      <div
        className={cn(
          "overflow-auto font-mono text-sm",
          theme === "dark"
            ? "bg-gray-900 text-gray-100"
            : theme === "high-contrast"
              ? "bg-black text-white"
              : "bg-white text-gray-900",
        )}
        style={{ height }}
        onClick={handleTerminalClick}
        ref={terminalRef}
      >
        <div className="p-4">
          {/* Terminal Lines */}
          <div className="space-y-1">
            {limitedLines.map((line, index) => (
              <div key={line.id} className="flex items-start gap-2">
                {lineNumbers && (
                  <span className="w-8 select-none text-right text-gray-500 text-xs dark:text-gray-400">
                    {index + 1}
                  </span>
                )}

                {timestamps && (
                  <span className="flex w-20 select-none items-center gap-1 text-gray-500 text-xs dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(line.timestamp)}
                  </span>
                )}

                <span className={cn("w-4 flex-shrink-0", getLineColor(line.type))}>
                  {getLineIcon(line.type)}
                </span>

                <span className={cn("flex-1 break-words", getLineColor(line.type))}>
                  {line.content}
                </span>
              </div>
            ))}
            <div ref={linesEndRef} />
          </div>

          {/* Input Area */}
          {!readonly && onInput && (
            <form onSubmit={handleInputSubmit} className="mt-4 flex items-center gap-2">
              {lineNumbers && <div className="w-8" />}
              {timestamps && <div className="w-20" />}
              <span className="text-blue-600 dark:text-blue-400">❯</span>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                className={cn(
                  "flex-1 border-0 bg-transparent focus:outline-none focus:ring-0",
                  theme === "dark"
                    ? "text-gray-100 placeholder-gray-500"
                    : "text-gray-900 placeholder-gray-400",
                )}
              />
              <Button type="submit" size="sm" variant="ghost">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
}

// Utility functions for terminal
export const createTerminalLine = (
  content: string,
  type: TerminalLine["type"] = "output",
): TerminalLine => ({
  id: `${Date.now()}-${Math.random()}`,
  type,
  content,
  timestamp: Date.now(),
});

export const formatTerminalOutput = (output: string): TerminalLine[] => {
  return output
    .split("\n")
    .map((line) => createTerminalLine(line, line.trim() ? "output" : "info"));
};

export const formatTerminalError = (error: string): TerminalLine[] => {
  return error.split("\n").map((line) => createTerminalLine(line, "error"));
};

// Terminal presets
export const TERMINAL_PRESETS = {
  minimal: {
    showLineNumbers: false,
    showTimestamps: false,
    showControls: false,
    allowClear: false,
    allowCopy: true,
    allowDownload: true,
  },
  detailed: {
    showLineNumbers: true,
    showTimestamps: true,
    showControls: true,
    allowClear: true,
    allowCopy: true,
    allowDownload: true,
  },
  interactive: {
    showLineNumbers: false,
    showTimestamps: false,
    showControls: true,
    allowClear: true,
    allowCopy: true,
    allowDownload: false,
  },
} as const;

export type TerminalPreset = keyof typeof TERMINAL_PRESETS;
