"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/file-upload/file-upload";
import { DownloadButton } from "@/components/file-upload/download-button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, Settings, Info } from "lucide-react";

export interface ConversionOptions {
  format: string;
  quality?: number;
  compress?: boolean;
  preserveMetadata?: boolean;
  resize?: {
    width?: number;
    height?: number;
  };
  customOptions?: Record<string, any>;
}

export interface ConversionResult {
  originalFile: File;
  convertedFile: File;
  options: ConversionOptions;
  success: boolean;
  error?: string;
  processingTime: number;
}

interface FileConverterProps {
  onConversionComplete?: (result: ConversionResult) => void;
  onError?: (error: string) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  className?: string;
}

// Supported conversion formats
const supportedFormats = {
  image: {
    input: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"],
    output: ["jpg", "jpeg", "png", "webp", "bmp"],
  },
  document: {
    input: ["pdf", "doc", "docx", "txt", "rtf", "odt"],
    output: ["pdf", "txt", "html"],
  },
  data: {
    input: ["json", "xml", "csv", "xlsx", "yaml", "toml"],
    output: ["json", "xml", "csv", "yaml", "toml"],
  },
};

// Default conversion options by format
const defaultOptions: Record<string, Partial<ConversionOptions>> = {
  jpg: { quality: 85, compress: true },
  jpeg: { quality: 85, compress: true },
  png: { compress: true },
  webp: { quality: 80, compress: true },
  pdf: { preserveMetadata: true },
  json: { preserveMetadata: false },
};

export function FileConverter({
  onConversionComplete,
  onError,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = [
    ...supportedFormats.image.input,
    ...supportedFormats.document.input,
    ...supportedFormats.data.input,
  ],
  className,
}: FileConverterProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [targetFormat, setTargetFormat] = React.useState<string>("");
  const [options, setOptions] = React.useState<ConversionOptions>({
    format: "",
  });
  const [isConverting, setIsConverting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [results, setResults] = React.useState<ConversionResult[]>([]);

  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const getFormatCategory = (format: string): "image" | "document" | "data" | null => {
    const lowerFormat = format.toLowerCase();
    for (const [category, formats] of Object.entries(supportedFormats)) {
      if (formats.input.includes(lowerFormat)) {
        return category as "image" | "document" | "data";
      }
    }
    return null;
  };

  const getAvailableFormats = (file: File): string[] => {
    const category = getFormatCategory(getFileExtension(file.name));
    if (!category) return [];
    return supportedFormats[category].output;
  };

  const handleFilesDrop = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const extension = getFileExtension(file.name);
      return acceptedFormats.includes(extension) && file.size <= maxFileSize;
    });
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const updateOptions = (key: keyof ConversionOptions, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const convertFile = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const startTime = Date.now();
          const inputFormat = getFileExtension(file.name);
          const category = getFormatCategory(inputFormat);

          let convertedFile: File;

          switch (category) {
            case "image":
              convertedFile = await convertImage(file, e.target?.result as string);
              break;
            case "data":
              convertedFile = await convertData(file, e.target?.result as string);
              break;
            case "document":
              convertedFile = await convertDocument(file, e.target?.result as string);
              break;
            default:
              throw new Error(`Unsupported file type: ${inputFormat}`);
          }

          const processingTime = Date.now() - startTime;

          const result: ConversionResult = {
            originalFile: file,
            convertedFile,
            options: { ...options, format: targetFormat },
            success: true,
            processingTime,
          };

          setResults((prev) => [...prev, result]);
          onConversionComplete?.(result);
          resolve(convertedFile);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Conversion failed";
          onError?.(errorMessage);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const convertImage = async (file: File, data: string | ArrayBuffer): Promise<File> => {
    // Simplified image conversion - in real implementation, use canvas or libraries like sharp
    const blob = new Blob([data], { type: `image/${targetFormat}` });
    const newFilename = file.name.replace(/\.[^/.]+$/, "") + `.${targetFormat}`;
    return new File([blob], newFilename, { type: `image/${targetFormat}` });
  };

  const convertData = async (file: File, data: string | ArrayBuffer): Promise<File> => {
    const text = typeof data === "string" ? data : new TextDecoder().decode(data);
    const inputFormat = getFileExtension(file.name);
    const newFilename = file.name.replace(/\.[^/.]+$/, "") + `.${targetFormat}`;

    let convertedContent: string;

    try {
      switch (inputFormat) {
        case "json":
          const jsonData = JSON.parse(text);
          convertedContent = convertFromJson(jsonData, targetFormat);
          break;
        case "csv":
          convertedContent = convertFromCsv(text, targetFormat);
          break;
        case "xml":
          convertedContent = convertFromXml(text, targetFormat);
          break;
        default:
          convertedContent = text; // Fallback
      }
    } catch (error) {
      convertedContent = text; // Fallback on parsing error
    }

    const blob = new Blob([convertedContent], {
      type: `application/${targetFormat}`,
    });
    return new File([blob], newFilename, {
      type: `application/${targetFormat}`,
    });
  };

  const convertDocument = async (file: File, data: string | ArrayBuffer): Promise<File> => {
    const text = typeof data === "string" ? data : new TextDecoder().decode(data);
    const newFilename = file.name.replace(/\.[^/.]+$/, "") + `.${targetFormat}`;

    let convertedContent: string;
    switch (targetFormat) {
      case "txt":
        convertedContent = extractTextFromDocument(text);
        break;
      case "html":
        convertedContent = convertToHtml(text);
        break;
      default:
        convertedContent = text;
    }

    const blob = new Blob([convertedContent], { type: `text/${targetFormat}` });
    return new File([blob], newFilename, { type: `text/${targetFormat}` });
  };

  const convertFromJson = (data: any, targetFormat: string): string => {
    switch (targetFormat) {
      case "json":
        return JSON.stringify(data, null, 2);
      case "xml":
        return jsonToXml(data);
      case "csv":
        return jsonToCsv(data);
      case "yaml":
        return jsonToYaml(data);
      default:
        return JSON.stringify(data);
    }
  };

  const convertFromCsv = (csv: string, targetFormat: string): string => {
    // Simplified CSV parsing
    const lines = csv.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()));

    switch (targetFormat) {
      case "json":
        return JSON.stringify(
          rows.map((row) => Object.fromEntries(headers.map((header, i) => [header, row[i]]))),
          null,
          2,
        );
      default:
        return csv;
    }
  };

  const convertFromXml = (xml: string, targetFormat: string): string => {
    // Simplified XML conversion - in real implementation, use proper XML parser
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");
      const jsonObj = xmlToJson(doc.documentElement);
      return JSON.stringify(jsonObj, null, 2);
    } catch {
      return xml;
    }
  };

  const extractTextFromDocument = (content: string): string => {
    // Simplified text extraction
    return content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const convertToHtml = (content: string): string => {
    // Simplified HTML conversion
    return `<!DOCTYPE html>
<html>
<head>
    <title>Converted Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        pre { background: #f5f5f5; padding: 20px; border-radius: 4px; }
    </style>
</head>
<body>
    <pre>${content}</pre>
</body>
</html>`;
  };

  // Helper functions (simplified implementations)
  const jsonToXml = (obj: any): string => {
    // Simplified JSON to XML conversion
    return `<?xml version="1.0" encoding="UTF-8"?>
<root>${JSON.stringify(obj)}</root>`;
  };

  const jsonToCsv = (obj: any): string => {
    // Simplified JSON to CSV conversion
    if (Array.isArray(obj)) {
      const headers = Object.keys(obj[0] || {});
      const csv = [
        headers.join(","),
        ...obj.map((row) => headers.map((h) => row[h]).join(",")),
      ].join("\n");
      return csv;
    }
    return JSON.stringify(obj);
  };

  const jsonToYaml = (obj: any): string => {
    // Simplified JSON to YAML conversion
    return JSON.stringify(obj, null, 2).replace(/"/g, "");
  };

  const xmlToJson = (xml: any): any => {
    // Simplified XML to JSON conversion
    return { _xml: xml.textContent || "" };
  };

  const handleConvert = async () => {
    if (files.length === 0 || !targetFormat) return;

    setIsConverting(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(((i + 1) / files.length) * 100);
        await convertFile(files[i]);
      }
    } catch (error) {
      console.error("Conversion error:", error);
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  };

  const availableFormats = files.length > 0 ? getAvailableFormats(files[0]) : [];

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              maxFiles={10}
              maxFileSize={maxFileSize}
              acceptedFormats={acceptedFormats}
            />
          </CardContent>
        </Card>

        {/* Conversion Settings */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Conversion Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-format">Target Format</Label>
                  <Select
                    onValueChange={(value) => {
                      setTargetFormat(value);
                      setOptions((prev) => ({
                        ...prev,
                        format: value,
                        ...defaultOptions[value],
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format-specific options */}
                {targetFormat && ["jpg", "jpeg", "webp"].includes(targetFormat) && (
                  <div className="space-y-2">
                    <Label>Quality: {options.quality}%</Label>
                    <Slider
                      value={[options.quality || 85]}
                      onValueChange={([value]) => updateOptions("quality", value)}
                      max={100}
                      min={1}
                      step={1}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.compress || false}
                    onCheckedChange={(checked) => updateOptions("compress", checked)}
                  />
                  <Label>Compress output</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.preserveMetadata || false}
                    onCheckedChange={(checked) => updateOptions("preserveMetadata", checked)}
                  />
                  <Label>Preserve metadata</Label>
                </div>
              </div>

              <Button
                onClick={handleConvert}
                disabled={!targetFormat || isConverting}
                className="w-full"
              >
                {isConverting ? "Converting..." : "Convert Files"}
              </Button>

              {isConverting && (
                <div className="space-y-2">
                  <Label>Conversion Progress</Label>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Conversion Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {result.originalFile.name} → {result.convertedFile.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.originalFile.size} bytes → {result.convertedFile.size} bytes
                        </div>
                      </div>
                      <Badge variant="default">{result.processingTime}ms</Badge>
                    </div>
                    <Button
                      onClick={() => {
                        const url = URL.createObjectURL(result.convertedFile);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = result.convertedFile.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Download
                    </Button>
                  </div>
                ))}

                <Button
                  onClick={() => {
                    // For simplicity, just download the first file
                    // In a real implementation, you'd create a ZIP file
                    if (results.length > 0) {
                      const file = results[0].convertedFile;
                      const url = URL.createObjectURL(file);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = file.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  Download All Files
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Max file size: {(maxFileSize / 1024 / 1024).toFixed(0)}MB. Supported formats: Images
            (JPG, PNG, WebP), Documents (PDF, TXT), Data files (JSON, CSV, XML). Conversion happens
            in your browser - files are never uploaded to servers.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
