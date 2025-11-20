"use client";

import { Download, Eye, FileSpreadsheet } from "lucide-react";
import * as React from "react";
import { FileUpload } from "@/components/file-upload/file-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface CSVRow extends Record<string, string | number> {
  [index: string]: string | number;
}

export interface CSVProcessingOptions {
  // Import options
  delimiter: string;
  hasHeaders: boolean;
  encoding: string;
  skipEmptyRows: boolean;
  trimFields: boolean;

  // Data transformation
  dateFormat: string;
  numberFormat: "us" | "eu";

  // Filter options
  filters: {
    column: string;
    operator: "equals" | "contains" | "startsWith" | "endsWith" | "greater" | "less";
    value: string;
  }[];

  // Sort options
  sortBy: string;
  sortOrder: "asc" | "desc";

  // Export options
  exportDelimiter: string;
  exportFormat: "csv" | "json" | "xlsx" | "html";
  includeHeaders: boolean;
}

export interface CSVProcessingResult {
  originalData: CSVRow[];
  processedData: CSVRow[];
  headers: string[];
  options: CSVProcessingOptions;
  stats: {
    totalRows: number;
    processedRows: number;
    filteredRows: number;
    columns: number;
    fileSize: number;
  };
  success: boolean;
  error?: string;
}

interface CSVProcessorProps {
  onProcessingComplete?: (result: CSVProcessingResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

const delimiters = [
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
];

const dateFormats = [
  { value: "auto", label: "Auto-detect" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "ISO", label: "ISO 8601" },
];

export function CSVProcessor({ onProcessingComplete, onError, className }: CSVProcessorProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [csvData, setCsvData] = React.useState<CSVRow[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [options, setOptions] = React.useState<CSVProcessingOptions>({
    delimiter: ",",
    hasHeaders: true,
    encoding: "utf-8",
    skipEmptyRows: true,
    trimFields: true,
    dateFormat: "auto",
    numberFormat: "us",
    filters: [],
    sortBy: "",
    sortOrder: "asc",
    exportDelimiter: ",",
    exportFormat: "csv",
    includeHeaders: true,
  });
  const [result, setResult] = React.useState<CSVProcessingResult | null>(null);
  const [_isProcessing, setIsProcessing] = React.useState(false);

  const parseCSV = (content: string): { data: CSVRow[]; headers: string[] } => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return { data: [], headers: [] };

    const delimiter = options.delimiter;
    const hasHeaders = options.hasHeaders;

    // Parse headers
    let headers: string[] = [];
    let dataStartIndex = 0;

    if (hasHeaders && lines.length > 0) {
      headers = parseCSVLine(lines[0], delimiter);
      dataStartIndex = 1;
    } else if (lines.length > 0) {
      // Generate headers from first row
      const firstRow = parseCSVLine(lines[0], delimiter);
      headers = firstRow.map((_, index) => `Column ${index + 1}`);
    }

    // Parse data rows
    const data: CSVRow[] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line && options.skipEmptyRows) continue;

      const values = parseCSVLine(line, delimiter);
      if (options.trimFields) {
        values.forEach((val, idx) => {
          values[idx] = typeof val === "string" ? val.trim() : val;
        });
      }

      const row: CSVRow = {};
      headers.forEach((header, index) => {
        let value: string | number = values[index] || "";

        // Convert numbers
        if (!Number.isNaN(Number(value)) && value !== "") {
          value = Number(value);
        }

        row[header] = value;
      });

      data.push(row);
    }

    return { data, headers };
  };

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const processCSV = React.useCallback(() => {
    if (csvData.length === 0) return;

    setIsProcessing(true);
    try {
      let processedData = [...csvData];

      // Apply filters
      if (options.filters.length > 0) {
        processedData = processedData.filter((row) => {
          return options.filters.every((filter) => {
            const cellValue = String(row[filter.column] || "").toLowerCase();
            const filterValue = filter.value.toLowerCase();

            switch (filter.operator) {
              case "equals":
                return cellValue === filterValue;
              case "contains":
                return cellValue.includes(filterValue);
              case "startsWith":
                return cellValue.startsWith(filterValue);
              case "endsWith":
                return cellValue.endsWith(filterValue);
              case "greater":
                return Number(cellValue) > Number(filterValue);
              case "less":
                return Number(cellValue) < Number(filterValue);
              default:
                return true;
            }
          });
        });
      }

      // Apply sorting
      if (options.sortBy && headers.includes(options.sortBy)) {
        processedData.sort((a, b) => {
          const aVal = a[options.sortBy];
          const bVal = b[options.sortBy];

          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          if (aVal > bVal) comparison = 1;

          return options.sortOrder === "desc" ? -comparison : comparison;
        });
      }

      const processingResult: CSVProcessingResult = {
        originalData: csvData,
        processedData,
        headers,
        options,
        stats: {
          totalRows: csvData.length,
          processedRows: processedData.length,
          filteredRows: csvData.length - processedData.length,
          columns: headers.length,
          fileSize: new Blob([files[0]]).size,
        },
        success: true,
      };

      setResult(processingResult);
      onProcessingComplete?.(processingResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Processing failed";
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [csvData, headers, options, files, onProcessingComplete, onError]);

  const _handleFilesDrop = (newFiles: File[]) => {
    const csvFiles = newFiles.filter(
      (file) => file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv"),
    );

    csvFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const { data, headers: parsedHeaders } = parseCSV(content);
        setCsvData(data);
        setHeaders(parsedHeaders);
      };
      reader.readAsText(file, options.encoding);
    });

    setFiles((prev) => [...prev, ...csvFiles]);
  };

  const exportData = (): string => {
    const data = result?.processedData || csvData;
    const exportHeaders = options.includeHeaders ? headers : [];

    switch (options.exportFormat) {
      case "csv":
        return exportToCSV(data, exportHeaders);
      case "json":
        return exportToJSON(data);
      case "html":
        return exportToHTML(data, exportHeaders);
      case "xlsx":
        // Simplified - in real implementation use a library like xlsx
        return exportToCSV(data, exportHeaders);
      default:
        return exportToCSV(data, exportHeaders);
    }
  };

  const exportToCSV = (data: CSVRow[], exportHeaders: string[]): string => {
    const delimiter = options.exportDelimiter;
    const rows: string[] = [];

    if (exportHeaders.length > 0) {
      rows.push(exportHeaders.map((h) => `"${h}"`).join(delimiter));
    }

    data.forEach((row) => {
      const values = exportHeaders.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        return typeof value === "string" && value.includes(delimiter)
          ? `"${value.replace(/"/g, '""')}"`
          : String(value);
      });
      rows.push(values.join(delimiter));
    });

    return rows.join("\n");
  };

  const exportToJSON = (data: CSVRow[]): string => {
    return JSON.stringify(data, null, 2);
  };

  const exportToHTML = (data: CSVRow[], exportHeaders: string[]): string => {
    let html = '<table class="csv-table">\n';

    if (exportHeaders.length > 0) {
      html += "<thead><tr>";
      exportHeaders.forEach((header) => {
        html += `<th>${header}</th>`;
      });
      html += "</tr></thead>\n";
    }

    html += "<tbody>\n";
    data.forEach((row) => {
      html += "<tr>";
      exportHeaders.forEach((header) => {
        html += `<td>${row[header] || ""}</td>`;
      });
      html += "</tr>\n";
    });
    html += "</tbody>\n</table>";

    return `<!DOCTYPE html>
<html>
<head>
    <title>CSV Data</title>
    <style>
        .csv-table { border-collapse: collapse; width: 100%; }
        .csv-table th, .csv-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .csv-table th { background-color: #f2f2f2; }
    </style>
</head>
<body>
${html}
</body>
</html>`;
  };

  const addFilter = () => {
    if (headers.length > 0) {
      setOptions((prev) => ({
        ...prev,
        filters: [
          ...prev.filters,
          {
            column: headers[0],
            operator: "contains",
            value: "",
          },
        ],
      }));
    }
  };

  const updateFilter = (index: number, field: string, value: any) => {
    setOptions((prev) => ({
      ...prev,
      filters: prev.filters.map((filter, i) =>
        i === index ? { ...filter, [field]: value } : filter,
      ),
    }));
  };

  const removeFilter = (index: number) => {
    setOptions((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  // Auto-process when data or options change
  React.useEffect(() => {
    if (csvData.length > 0) {
      processCSV();
    }
  }, [csvData, processCSV]);

  const updateOption = (key: keyof CSVProcessingOptions, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const displayData = result?.processedData || csvData;
  const displayHeaders = headers;

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              maxFiles={1}
              acceptedFormats={["csv"]}
            />
            {files.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Loaded: {files[0].name} ({headers.length} columns, {csvData.length} rows)
              </div>
            )}
          </CardContent>
        </Card>

        {csvData.length > 0 && (
          <>
            {/* Processing Options */}
            <Tabs defaultValue="import" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="import">Import</TabsTrigger>
                <TabsTrigger value="filter">Filter</TabsTrigger>
                <TabsTrigger value="sort">Sort</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="import" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Import Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Delimiter</Label>
                        <Select onValueChange={(value) => updateOption("delimiter", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select delimiter" />
                          </SelectTrigger>
                          <SelectContent>
                            {delimiters.map((delim) => (
                              <SelectItem key={delim.value} value={delim.value}>
                                {delim.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Encoding</Label>
                        <Select onValueChange={(value) => updateOption("encoding", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select encoding" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utf-8">UTF-8</SelectItem>
                            <SelectItem value="utf-16">UTF-16</SelectItem>
                            <SelectItem value="latin1">Latin-1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select onValueChange={(value) => updateOption("dateFormat", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                          <SelectContent>
                            {dateFormats.map((format) => (
                              <SelectItem key={format.value} value={format.value}>
                                {format.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Number Format</Label>
                        <Select
                          onValueChange={(value: "us" | "eu") =>
                            updateOption("numberFormat", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select number format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">US (1,234.56)</SelectItem>
                            <SelectItem value="eu">EU (1.234,56)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={options.hasHeaders}
                          onCheckedChange={(checked) => updateOption("hasHeaders", checked)}
                        />
                        <Label>First row contains headers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={options.skipEmptyRows}
                          onCheckedChange={(checked) => updateOption("skipEmptyRows", checked)}
                        />
                        <Label>Skip empty rows</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={options.trimFields}
                          onCheckedChange={(checked) => updateOption("trimFields", checked)}
                        />
                        <Label>Trim fields</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="filter" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Filter Data</span>
                      <Button onClick={addFilter} size="sm">
                        Add Filter
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {options.filters.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No filters applied. Click "Add Filter" to start filtering data.
                      </div>
                    ) : (
                      options.filters.map((filter, index) => (
                        <div key={index} className="grid md:grid-cols-4 gap-2">
                          <Select onValueChange={(value) => updateFilter(index, "column", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder={filter.column || "Select column"} />
                            </SelectTrigger>
                            <SelectContent>
                              {headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select onValueChange={(value) => updateFilter(index, "operator", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder={filter.operator || "Select operator"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="startsWith">Starts with</SelectItem>
                              <SelectItem value="endsWith">Ends with</SelectItem>
                              <SelectItem value="greater">Greater than</SelectItem>
                              <SelectItem value="less">Less than</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={filter.value}
                            onChange={(e) => updateFilter(index, "value", e.target.value)}
                            placeholder="Filter value..."
                          />
                          <Button onClick={() => removeFilter(index)} variant="outline" size="sm">
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sort" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sort Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sort by Column</Label>
                        <Select onValueChange={(value) => updateOption("sortBy", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {headers.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sort Order</Label>
                        <Select
                          onValueChange={(value: "asc" | "desc") =>
                            updateOption("sortOrder", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select order" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Export Format</Label>
                        <Select onValueChange={(value: any) => updateOption("exportFormat", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="html">HTML Table</SelectItem>
                            <SelectItem value="xlsx">Excel (CSV)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Delimiter (for CSV)</Label>
                        <Select onValueChange={(value) => updateOption("exportDelimiter", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select delimiter" />
                          </SelectTrigger>
                          <SelectContent>
                            {delimiters.map((delim) => (
                              <SelectItem key={delim.value} value={delim.value}>
                                {delim.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={options.includeHeaders}
                        onCheckedChange={(checked) => updateOption("includeHeaders", checked)}
                      />
                      <Label>Include headers in export</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Data Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Data Preview
                  {result && (
                    <Badge variant="outline">
                      {result.stats.processedRows} of {result.stats.totalRows} rows
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {displayHeaders.map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayData.slice(0, 100).map((row, index) => (
                        <TableRow key={index}>
                          {displayHeaders.map((header) => (
                            <TableCell key={header}>{String(row[header] || "")}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {displayData.length > 100 && (
                    <div className="text-center py-4 text-gray-500">
                      Showing first 100 rows of {displayData.length} total rows
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Processed Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    const data = exportData();
                    const blob = new Blob([data], {
                      type: options.exportFormat === "json" ? "application/json" : "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `processed.${options.exportFormat}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {options.exportFormat.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {csvData.length === 0 && (
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              Upload a CSV file to start processing. Supported features include filtering, sorting,
              data transformation, and export to multiple formats.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
