import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FilePreviewOptions, UploadedFile } from "./file-upload-types";

interface FilePreviewProps {
  /** File to preview */
  file: UploadedFile | File;
  /** Preview options */
  options?: FilePreviewOptions;
  /** Custom class name */
  className?: string;
  /** Maximum height for the preview */
  maxHeight?: number;
  /** Whether to show copy button */
  showCopyButton?: boolean;
  /** Whether to show download button */
  showDownloadButton?: boolean;
  /** Event handlers */
  onCopy?: (content: string) => void;
  onDownload?: (file: UploadedFile | File) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  options = {},
  className,
  maxHeight = 400,
  showCopyButton = true,
  showDownloadButton = true,
  onCopy,
  onDownload,
}) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const { maxLength = 10000, showLineNumbers = true, theme = "light" } = options;

  const isTextFile = useMemo(() => {
    const textMimeTypes = [
      "text/plain",
      "text/json",
      "application/json",
      "text/csv",
      "text/markdown",
      "text/html",
      "text/xml",
      "application/xml",
      "text/javascript",
      "application/javascript",
      "text/css",
      "text/yaml",
      "application/x-yaml",
    ];

    const fileName = file.name.toLowerCase();
    const textExtensions = [
      ".txt",
      ".json",
      ".csv",
      ".md",
      ".html",
      ".xml",
      ".js",
      ".css",
      ".yaml",
      ".yml",
    ];

    return (
      textMimeTypes.includes(file.type) || textExtensions.some((ext) => fileName.endsWith(ext))
    );
  }, [file.type, file.name]);

  const isImageFile = useMemo(() => {
    return file.type.startsWith("image/");
  }, [file.type]);

  useEffect(() => {
    if (!isTextFile && !isImageFile) {
      setIsLoading(false);
      return;
    }

    const loadContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (file instanceof File) {
          if (isTextFile) {
            const text = await file.text();
            setContent(text.length > maxLength ? `${text.substring(0, maxLength)}...` : text);
          } else if (isImageFile) {
            const url = URL.createObjectURL(file);
            setContent(url);
          }
        } else if ("url" in file && file.url) {
          if (isTextFile) {
            const response = await fetch(file.url);
            const text = await response.text();
            setContent(text.length > maxLength ? `${text.substring(0, maxLength)}...` : text);
          } else if (isImageFile) {
            setContent(file.url);
          }
        } else if ("preview" in file && file.preview) {
          setContent(file.preview);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file content");
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [file, isTextFile, isImageFile, maxLength]);

  const handleCopy = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      onCopy?.(content);

      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleDownload = () => {
    onDownload?.(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.toLowerCase().split(".").pop();
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      json: "json",
      xml: "xml",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      md: "markdown",
      yaml: "yaml",
      yml: "yaml",
      sql: "sql",
      py: "python",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      swift: "swift",
      kt: "kotlin",
      scala: "scala",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      fish: "fish",
      ps1: "powershell",
      bat: "batch",
      cmd: "batch",
      dockerfile: "dockerfile",
      tf: "hcl",
      hcl: "hcl",
      toml: "toml",
      ini: "ini",
      conf: "ini",
      log: "log",
      txt: "text",
      csv: "csv",
    };
    return languageMap[ext || ""] || "text";
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-blue-500 border-b-2" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-32 items-center justify-center text-red-500">
          <div className="text-center">
            <svg
              className="mx-auto mb-2 h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-label="Error icon"
            >
              <title>Error</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">Failed to load preview</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      );
    }

    if (!isTextFile && !isImageFile) {
      return (
        <div className="flex h-32 items-center justify-center text-gray-500">
          <div className="text-center">
            <svg
              className="mx-auto mb-2 h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-label="File icon"
            >
              <title>File</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">Preview not available</p>
            <p className="mt-1 text-xs">File type: {file.type || "Unknown"}</p>
          </div>
        </div>
      );
    }

    if (isImageFile && content) {
      return (
        <div className="flex items-center justify-center p-4">
          <img
            src={content}
            alt={file.name}
            className="max-h-full max-w-full rounded object-contain"
          />
        </div>
      );
    }

    if (isTextFile && content) {
      const language = getLanguageFromFileName(file.name);
      const lines = content.split("\n");

      return (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10 flex space-x-2">
            {showCopyButton && (
              <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            )}
            {showDownloadButton && (
              <Button variant="outline" size="sm" onClick={handleDownload} className="text-xs">
                Download
              </Button>
            )}
          </div>

          <div className="overflow-auto" style={{ maxHeight }}>
            <pre
              className={cn(
                "rounded-lg p-4 text-sm",
                theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900",
              )}
            >
              {showLineNumbers ? (
                <div className="flex">
                  <div
                    className={cn(
                      "select-none border-r pr-4 text-right",
                      theme === "dark"
                        ? "border-gray-700 text-gray-500"
                        : "border-gray-300 text-gray-400",
                    )}
                  >
                    {lines.map((_, index) => (
                      <div key={`line-number-${index + 1}`} className="leading-6">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto pl-4">
                    <code className={`language-${language}`}>{content}</code>
                  </div>
                </div>
              ) : (
                <code className={`language-${language}`}>{content}</code>
              )}
            </pre>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="truncate font-medium text-lg">{file.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {file.type || "Unknown"}
            </Badge>
          </div>
          <div className="text-gray-500 text-sm">{formatFileSize(file.size)}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{renderPreview()}</CardContent>
    </Card>
  );
};

export default FilePreview;
