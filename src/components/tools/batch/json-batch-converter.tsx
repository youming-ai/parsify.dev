'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Database,
  FileDown,
  FileText,
  FolderOpen,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';

interface ConversionTask {
  id: string;
  fileName: string;
  inputContent: string;
  outputContent: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  conversionType: string;
  errorMessage?: string;
  startTime?: Date;
  endTime?: Date;
  inputSize: number;
  outputSize: number;
}

interface BatchResult {
  totalTasks: number;
  completedTasks: number;
  errorTasks: number;
  totalInputSize: number;
  totalOutputSize: number;
  startTime: Date;
  endTime?: Date;
  averageProcessingTime: number;
}

const conversionTypes = [
  {
    id: 'minify',
    name: 'Minify',
    description: 'Compress JSON by removing whitespace',
  },
  {
    id: 'prettify',
    name: 'Prettify',
    description: 'Format JSON with proper indentation',
  },
  {
    id: 'validate',
    name: 'Validate',
    description: 'Validate JSON syntax and structure',
  },
  {
    id: 'sort-keys',
    name: 'Sort Keys',
    description: 'Sort JSON object keys alphabetically',
  },
  {
    id: 'convert-to-xml',
    name: 'Convert to XML',
    description: 'Convert JSON to XML format',
  },
  {
    id: 'convert-to-yaml',
    name: 'Convert to YAML',
    description: 'Convert JSON to YAML format',
  },
  {
    id: 'convert-to-csv',
    name: 'Convert to CSV',
    description: 'Convert JSON to CSV format',
  },
  {
    id: 'extract-keys',
    name: 'Extract Keys',
    description: 'Extract all keys from JSON',
  },
  {
    id: 'json-to-xml',
    name: 'JSON to XML',
    description: 'Convert JSON to XML with proper formatting',
  },
  {
    id: 'json-to-yaml',
    name: 'JSON to YAML',
    description: 'Convert JSON to YAML with proper structure',
  },
  {
    id: 'json-to-csv',
    name: 'JSON to CSV',
    description: 'Convert JSON to CSV with headers',
  },
];

const sampleFiles = [
  {
    name: 'user-data.json',
    content: '{"name": "John Doe", "email": "john@example.com", "age": 30}',
  },
  {
    name: 'products.json',
    content:
      '[{"id": 1, "name": "Product A", "price": 99.99}, {"id": 2, "name": "Product B", "price": 149.99}]',
  },
  {
    name: 'config.json',
    content:
      '{"app": {"name": "MyApp", "version": "1.0.0", "debug": true}, "database": {"host": "localhost", "port": 5432}}',
  },
  {
    name: 'api-response.json',
    content:
      '{"status": "success", "data": [{"id": 1, "title": "Item 1"}, {"id": 2, "title": "Item 2"}], "pagination": {"page": 1, "total": 10}}',
  },
];

export const JSONBatchConverter: React.FC = () => {
  const [tasks, setTasks] = useState<ConversionTask[]>([]);
  const [selectedConversion, setSelectedConversion] = useState('prettify');
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [autoProcess, setAutoProcess] = useState(false);
  const [maxConcurrency, setMaxConcurrency] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const processTask = async (task: ConversionTask): Promise<ConversionTask> => {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          try {
            let outputContent = task.inputContent;

            switch (task.conversionType) {
              case 'prettify':
                outputContent = JSON.stringify(JSON.parse(task.inputContent), null, 2);
                break;
              case 'minify':
                outputContent = JSON.stringify(JSON.parse(task.inputContent));
                break;
              case 'validate':
                JSON.parse(task.inputContent);
                outputContent = task.inputContent;
                break;
              case 'sort-keys': {
                const parsed = JSON.parse(task.inputContent);
                outputContent = JSON.stringify(sortObjectKeys(parsed), null, 2);
                break;
              }
              case 'convert-to-xml':
              case 'json-to-xml':
                outputContent = jsonToXml(JSON.parse(task.inputContent));
                break;
              case 'convert-to-yaml':
              case 'json-to-yaml':
                outputContent = jsonToYaml(JSON.parse(task.inputContent));
                break;
              case 'convert-to-csv':
              case 'json-to-csv':
                outputContent = jsonToCsv(JSON.parse(task.inputContent));
                break;
              case 'extract-keys':
                outputContent = JSON.stringify(extractKeys(JSON.parse(task.inputContent)), null, 2);
                break;
              default:
                outputContent = task.inputContent;
            }

            resolve({
              ...task,
              outputContent,
              status: 'completed',
              endTime: new Date(),
              outputSize: outputContent.length,
            });
          } catch (error) {
            resolve({
              ...task,
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Processing failed',
              endTime: new Date(),
            });
          }
        },
        Math.random() * 1000 + 500
      ); // Simulate processing time
    });
  };

  const sortObjectKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
          result[key] = sortObjectKeys(obj[key]);
          return result;
        }, {} as any);
    }
    return obj;
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const jsonToXml = (obj: any): string => {
    const convertValue = (value: any, key = ''): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value ? 'true' : 'false';

      if (Array.isArray(value)) {
        return value
          .map((item, index) => `<${key}_${index}>${convertValue(item)}</${key}_${index}>`)
          .join('');
      }

      if (typeof value === 'object') {
        return Object.entries(value)
          .map(([k, v]) => `<${k}>${convertValue(v, k)}</${k}>`)
          .join('');
      }

      return String(value);
    };

    const rootKey = Object.keys(obj)[0] || 'root';
    return `<${rootKey}>${convertValue(obj[rootKey] || obj, rootKey)}</${rootKey}>`;
  };

  const jsonToYaml = (obj: any): string => {
    const convertToYaml = (value: any, indent = 0): string => {
      const spaces = '  '.repeat(indent);

      if (value === null || value === undefined) return 'null';
      if (typeof value === 'string') return `"${value}"`;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value ? 'true' : 'false';

      if (Array.isArray(value)) {
        return value
          .map((item, _index) => `${spaces}- ${convertToYaml(item, indent + 1)}`)
          .join('\n');
      }

      if (typeof value === 'object') {
        return Object.entries(value)
          .map(([key, val]) => {
            const yamlValue = convertToYaml(val, indent + 1);
            if (typeof val === 'object' && !Array.isArray(val)) {
              return `${spaces}${key}:\n${yamlValue}`;
            }
            return `${spaces}${key}: ${yamlValue}`;
          })
          .join('\n');
      }

      return String(value);
    };

    return convertToYaml(obj);
  };

  const jsonToCsv = (obj: any): string => {
    if (!Array.isArray(obj)) {
      // If it's an object, convert to array of objects
      if (typeof obj === 'object' && obj !== null) {
        obj = [obj];
      } else {
        return 'No data to convert to CSV';
      }
    }

    if (obj.length === 0) return 'No data to convert to CSV';

    // Get all possible headers from all objects
    const allKeys = new Set<string>();
    obj.forEach((item: any) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach((key) => allKeys.add(key));
      }
    });

    const headers = Array.from(allKeys);
    const csvLines = [headers.join(',')];

    obj.forEach((item: any) => {
      const row = headers.map((header) => {
        const value = item?.[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return String(value);
      });
      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  };

  const extractKeys = (obj: any): string[] => {
    const keys = new Set<string>();

    const extractKeysFromObject = (o: any, prefix = '') => {
      if (o === null || typeof o !== 'object') return;

      Object.keys(o).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.add(fullKey);

        if (typeof o[key] === 'object' && o[key] !== null && !Array.isArray(o[key])) {
          extractKeysFromObject(o[key], fullKey);
        }
      });
    };

    extractKeysFromObject(obj);
    return Array.from(keys).sort();
  };

  const processBatch = async () => {
    setIsProcessing(true);
    const startTime = new Date();

    try {
      const tasksToProcess = tasks.filter((task) => task.status === 'pending');
      const processedTasks = [...tasks];

      // Process tasks with concurrency limit
      for (let i = 0; i < tasksToProcess.length; i += maxConcurrency) {
        const batch = tasksToProcess.slice(i, i + maxConcurrency);

        const batchPromises = batch.map(async (task) => {
          const updatedTask = {
            ...task,
            status: 'processing' as const,
            startTime: new Date(),
          };
          const taskIndex = processedTasks.findIndex((t) => t.id === task.id);
          if (taskIndex !== -1) {
            processedTasks[taskIndex] = updatedTask;
          }
          setTasks([...processedTasks]);

          const result = await processTask(updatedTask);
          const resultIndex = processedTasks.findIndex((t) => t.id === result.id);
          if (resultIndex !== -1) {
            processedTasks[resultIndex] = result;
          }
          setTasks([...processedTasks]);

          return result;
        });

        await Promise.all(batchPromises);
      }

      setTasks(processedTasks);

      const endTime = new Date();
      const completedCount = processedTasks.filter((t) => t.status === 'completed').length;
      const errorCount = processedTasks.filter((t) => t.status === 'error').length;
      const totalInputSize = processedTasks.reduce((sum, task) => sum + task.inputSize, 0);
      const totalOutputSize = processedTasks.reduce((sum, task) => sum + task.outputSize, 0);
      const averageTime =
        completedCount > 0
          ? processedTasks
              .filter((t) => t.status === 'completed')
              .reduce(
                (sum, task) =>
                  sum + ((task.endTime?.getTime() ?? 0) - (task.startTime?.getTime() ?? 0)),
                0
              ) / completedCount
          : 0;

      setBatchResult({
        totalTasks: tasks.length,
        completedTasks: completedCount,
        errorTasks: errorCount,
        totalInputSize,
        totalOutputSize,
        startTime,
        endTime,
        averageProcessingTime: averageTime,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newTasks: ConversionTask[] = [];

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        newTasks.push({
          id: `file-${Date.now()}-${index}`,
          fileName: file.name,
          inputContent: content,
          outputContent: '',
          status: 'pending',
          conversionType: selectedConversion,
          inputSize: content.length,
          outputSize: 0,
        });

        // Only update state once all files are processed
        if (newTasks.length === files.length) {
          setTasks((prev) => [...prev, ...newTasks]);

          // Auto process if enabled
          if (autoProcess) {
            setTimeout(() => processBatch(), 100);
          }
        }
      };
      reader.readAsText(file);
    });
  };

  const loadSampleFiles = () => {
    const sampleTasks: ConversionTask[] = sampleFiles.map((sample, index) => ({
      id: `sample-${index}`,
      fileName: sample.name,
      inputContent: sample.content,
      outputContent: '',
      status: 'pending' as const,
      conversionType: selectedConversion,
      inputSize: sample.content.length,
      outputSize: 0,
    }));

    setTasks((prev) => [...prev, ...sampleTasks]);
  };

  const clearAll = () => {
    setTasks([]);
    setBatchResult(null);
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const retryTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'pending' as const, errorMessage: undefined } : t
      )
    );

    const updatedTask = {
      ...task,
      status: 'processing' as const,
      startTime: new Date(),
    };
    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));

    const result = await processTask(updatedTask);
    setTasks((prev) => prev.map((t) => (t.id === id ? result : t)));
  };

  const downloadResults = () => {
    if (tasks.length === 0) return;

    const results = tasks.map((task) => ({
      fileName: task.fileName,
      conversionType: task.conversionType,
      status: task.status,
      inputSize: task.inputSize,
      outputSize: task.outputSize,
      outputContent: task.outputContent,
      errorMessage: task.errorMessage,
    }));

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-conversion-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadConvertedFiles = () => {
    if (tasks.length === 0) return;

    tasks.forEach((task) => {
      if (task.status === 'completed' && task.outputContent) {
        const blob = new Blob([task.outputContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${task.fileName.replace(/\.[^/.]+$/, '')}_converted.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-600">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const filteredTasks = tasks.filter(
    (task) => filterStatus === 'all' || task.status === filterStatus
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            JSON Batch Converter
          </CardTitle>
          <CardDescription>
            Process multiple JSON files at once with various conversion operations and batch
            processing capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Conversion Type</Label>
              <Select value={selectedConversion} onValueChange={setSelectedConversion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conversionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {conversionTypes.find((t) => t.id === selectedConversion)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Max Concurrency</Label>
              <Select
                value={maxConcurrency.toString()}
                onValueChange={(value) => setMaxConcurrency(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Sequential)</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="auto-process" checked={autoProcess} onCheckedChange={setAutoProcess} />
              <Label htmlFor="auto-process">Auto Process</Label>
            </div>

            <div className="space-y-2">
              <Label>Load Samples</Label>
              <Button onClick={loadSampleFiles} variant="outline" size="sm">
                <FolderOpen className="mr-2 h-4 w-4" />
                Load Sample Files
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-lg">Upload Files</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".json,.jsn,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <Button
                  onClick={processBatch}
                  disabled={
                    tasks.filter((t) => t.status === 'pending').length === 0 || isProcessing
                  }
                >
                  {isProcessing ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Process Batch
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            {tasks.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="font-bold text-2xl text-blue-600">{tasks.length}</div>
                  <div className="text-muted-foreground text-sm">Total Files</div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="font-bold text-2xl text-green-600">
                    {tasks.filter((t) => t.status === 'completed').length}
                  </div>
                  <div className="text-muted-foreground text-sm">Completed</div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="font-bold text-2xl text-yellow-600">
                    {tasks.filter((t) => t.status === 'processing').length}
                  </div>
                  <div className="text-muted-foreground text-sm">Processing</div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="font-bold text-2xl text-red-600">
                    {tasks.filter((t) => t.status === 'error').length}
                  </div>
                  <div className="text-muted-foreground text-sm">Errors</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Processing Queue</span>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={clearAll} variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`font-medium text-sm ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span className="ml-2">{task.fileName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {task.conversionType}
                        </Badge>
                        {getStatusBadge(task.status)}
                      </div>
                      <div className="mt-1 text-muted-foreground text-sm">
                        Size: {task.inputSize.toLocaleString()} bytes
                        {task.outputSize > 0 && ` → ${task.outputSize.toLocaleString()} bytes`}
                      </div>
                      {task.errorMessage && (
                        <div className="mt-1 text-red-600 text-sm">Error: {task.errorMessage}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' && (
                        <Button
                          onClick={() => copyToClipboard(task.outputContent)}
                          variant="ghost"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {task.status === 'error' && (
                        <Button onClick={() => retryTask(task.id)} variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button onClick={() => removeTask(task.id)} variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Batch Results */}
      {batchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batch Processing Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="font-bold text-2xl text-blue-600">
                  {batchResult.completedTasks}/{batchResult.totalTasks}
                </div>
                <div className="text-muted-foreground text-sm">Success Rate</div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="font-bold text-2xl text-green-600">
                  {batchResult.averageProcessingTime.toFixed(0)}ms
                </div>
                <div className="text-muted-foreground text-sm">Avg Time</div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="font-bold text-2xl text-purple-600">
                  {(batchResult.totalInputSize / 1024).toFixed(1)}KB
                </div>
                <div className="text-muted-foreground text-sm">Input Size</div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="font-bold text-2xl text-orange-600">
                  {(batchResult.totalOutputSize / 1024).toFixed(1)}KB
                </div>
                <div className="text-muted-foreground text-sm">Output Size</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadResults} variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Download Report
              </Button>
              <Button
                onClick={downloadConvertedFiles}
                variant="outline"
                disabled={tasks.filter((t) => t.status !== 'completed').length > 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                Download Converted Files
              </Button>
            </div>

            <div className="text-muted-foreground text-sm">
              Processing completed at: {batchResult.endTime?.toLocaleString()}
              Duration:{' '}
              {batchResult.endTime &&
                batchResult.startTime &&
                ((batchResult.endTime.getTime() - batchResult.startTime.getTime()) / 1000).toFixed(
                  1
                )}
              s
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JSONBatchConverter;
