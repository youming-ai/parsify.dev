'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Crop,
  Download,
  Eye,
  FileDown,
  Filter,
  Filter as FilterIcon,
  FolderOpen,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  Settings,
  Sliders,
  Tag,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';

interface BatchOperation {
  id: string;
  name: string;
  type: 'resize' | 'convert' | 'compress' | 'filter' | 'watermark' | 'crop' | 'rotate';
  description: string;
  icon: string;
}

interface BatchImageTask {
  id: string;
  fileName: string;
  originalFile: File;
  outputDataUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  operationType: string;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  originalSize: number;
  outputSize?: number;
  processingOptions?: any;
  errorMessage?: string;
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
  operationsSummary: Record<string, { count: number; success: number; totalSize: number }>;
}

const batchOperations: BatchOperation[] = [
  {
    id: 'resize',
    name: 'Resize Images',
    type: 'resize',
    description: 'Resize multiple images to specified dimensions',
    icon: 'maximize-2',
  },
  {
    id: 'convert',
    name: 'Convert Format',
    type: 'convert',
    description: 'Convert images to different formats (PNG, JPG, WebP, etc.)',
    icon: 'refresh-cw',
  },
  {
    id: 'compress',
    name: 'Compress Images',
    type: 'compress',
    description: 'Compress images while maintaining quality',
    icon: 'minimize-2',
  },
  {
    id: 'filter',
    name: 'Apply Filters',
    type: 'filter',
    description: 'Apply filters to multiple images at once',
    icon: 'sliders',
  },
  {
    id: 'watermark',
    name: 'Add Watermark',
    type: 'watermark',
    description: 'Add watermarks to multiple images',
    icon: 'tag',
  },
  {
    id: 'crop',
    name: 'Crop Images',
    type: 'crop',
    description: 'Crop images to specified dimensions',
    icon: 'crop',
  },
  {
    id: 'rotate',
    name: 'Rotate Images',
    type: 'rotate',
    description: 'Rotate images by specified degrees',
    icon: 'rotate-cw',
  },
];

const imageFormats = [
  { value: 'png', label: 'PNG', extension: '.png' },
  { value: 'jpg', label: 'JPEG', extension: '.jpg' },
  { value: 'webp', label: 'WebP', extension: '.webp' },
  { value: 'bmp', label: 'BMP', extension: '.bmp' },
  { value: 'gif', label: 'GIF', extension: '.gif' },
  { value: 'tiff', label: 'TIFF', extension: '.tiff' },
];

const filterPresets = [
  { id: 'vintage', name: 'Vintage', description: 'Classic vintage look' },
  {
    id: 'black-white',
    name: 'Black & White',
    description: 'Convert to grayscale',
  },
  { id: 'sepia', name: 'Sepia', description: 'Warm sepia tone' },
  { id: 'blur', name: 'Blur', description: 'Soft blur effect' },
  { id: 'sharpen', name: 'Sharpen', description: 'Enhance details' },
  { id: 'brightness', name: 'Brightness', description: 'Adjust brightness' },
  { id: 'contrast', name: 'Contrast', description: 'Adjust contrast' },
  {
    id: 'saturation',
    name: 'Saturation',
    description: 'Adjust color saturation',
  },
  { id: 'hue', name: 'Hue', description: 'Adjust color hue' },
];

const ImageBatchProcessor = () => {
  const [tasks, setTasks] = useState<BatchImageTask[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<BatchOperation>(batchOperations[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingOptions, setProcessingOptions] = useState({
    resize: {
      width: 800,
      height: 600,
      maintainAspectRatio: true,
      quality: 'high',
    },
    convert: {
      format: 'png',
      quality: 80,
    },
    compress: {
      quality: 70,
      maxSizeKB: 500,
    },
    filter: {
      preset: 'none',
      intensity: 50,
    },
    watermark: {
      text: 'Sample Watermark',
      position: 'bottom-right',
      opacity: 50,
      color: '#ffffff',
    },
    crop: {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    },
    rotate: {
      angle: 0,
      maintainSize: true,
    },
  });
  const [maxConcurrency, setMaxConcurrency] = useState(3);
  const [autoProcess, setAutoProcess] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const processImage = useCallback(
    async (task: BatchImageTask): Promise<BatchImageTask> => {
      return new Promise((resolve) => {
        setTimeout(
          () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();

              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);

                // Check if context was successfully created
                if (!ctx) {
                  resolve({
                    ...task,
                    status: 'error' as const,
                    errorMessage: 'Failed to create canvas context',
                    endTime: new Date(),
                  });
                  return;
                }

                let outputDataUrl: string;
                let outputSize = 0;

                switch (task.operationType) {
                  case 'resize':
                    outputDataUrl = resizeImage(
                      canvas,
                      ctx,
                      task.processingOptions?.resize || processingOptions.resize
                    );
                    break;
                  case 'convert':
                    outputDataUrl = convertImageFormat(
                      canvas,
                      ctx,
                      task.processingOptions?.convert || processingOptions.convert
                    );
                    break;
                  case 'compress':
                    outputDataUrl = compressImage(
                      canvas,
                      ctx,
                      task.processingOptions?.compress || processingOptions.compress
                    );
                    break;
                  case 'filter':
                    outputDataUrl = applyImageFilter(
                      canvas,
                      ctx,
                      task.processingOptions?.filter || processingOptions.filter
                    );
                    break;
                  case 'watermark':
                    outputDataUrl = addWatermark(
                      canvas,
                      ctx,
                      task.processingOptions?.watermark || processingOptions.watermark
                    );
                    break;
                  case 'crop':
                    outputDataUrl = cropImage(
                      canvas,
                      ctx,
                      task.processingOptions?.crop || processingOptions.crop
                    );
                    break;
                  case 'rotate':
                    outputDataUrl = rotateImage(
                      canvas,
                      ctx,
                      task.processingOptions?.rotate || processingOptions.rotate
                    );
                    break;
                  default:
                    outputDataUrl = canvas.toDataURL();
                }

                // Simulate output size calculation
                const binaryString = atob(outputDataUrl.split(',')[1]);
                outputSize = binaryString.length;

                resolve({
                  ...task,
                  status: 'completed' as const,
                  outputDataUrl,
                  outputSize,
                  endTime: new Date(),
                  progress: 100,
                });
              };

              img.onerror = () => {
                resolve({
                  ...task,
                  status: 'error' as const,
                  errorMessage: 'Failed to load image',
                  endTime: new Date(),
                });
              };

              img.src = URL.createObjectURL(task.originalFile);
            } catch (error) {
              resolve({
                ...task,
                status: 'error' as const,
                errorMessage: error instanceof Error ? error.message : 'Processing failed',
                endTime: new Date(),
              });
            }
          },
          Math.random() * 2000 + 500
        ); // Simulate processing time
      });
    },
    [processingOptions]
  );

  const resizeImage = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    options: any
  ): string => {
    const { width, height, maintainAspectRatio } = options;

    if (maintainAspectRatio) {
      const aspectRatio = canvas.width / canvas.height;
      const targetAspectRatio = width / height;

      if (targetAspectRatio > aspectRatio) {
        canvas.height = width / aspectRatio;
      } else {
        canvas.width = height * aspectRatio;
      }
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
  };

  const convertImageFormat = (
    canvas: HTMLCanvasElement,
    _ctx: CanvasRenderingContext2D,
    options: any
  ): string => {
    const { format, quality } = options;
    const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    return canvas.toDataURL(mimeType, quality / 100);
  };

  const compressImage = (
    canvas: HTMLCanvasElement,
    _ctx: CanvasRenderingContext2D,
    options: any
  ): string => {
    const { quality, maxSizeKB } = options;

    // Simple compression simulation
    const scaleFactor = Math.max(
      0.1,
      Math.min(1, (maxSizeKB * 1024) / (canvas.width * canvas.height * 4))
    );
    const newWidth = Math.floor(canvas.width * scaleFactor);
    const newHeight = Math.floor(canvas.height * scaleFactor);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      throw new Error('Failed to create temporary canvas context for compression');
    }

    tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);

    return tempCanvas.toDataURL('image/jpeg', quality / 100);
  };

  const applyImageFilter = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    options: any
  ): string => {
    const { preset, intensity } = options;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (preset) {
      case 'vintage':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] * 0.9; // Red
          data[i + 1] = data[i + 1] * 0.7; // Green
          data[i + 2] = data[i + 2] * 0.5; // Blue
        }
        break;
      case 'black-white':
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        break;
      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        break;
      case 'blur': {
        // Simple blur simulation
        const radius = Math.floor(intensity / 10);
        ctx.filter = `blur(${radius}px)`;
        break;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  const addWatermark = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    options: any
  ): string => {
    const { text, position, opacity, color } = options;

    ctx.font = '20px Arial';
    ctx.fillStyle = color || '#ffffff';
    ctx.globalAlpha = opacity / 100;

    const textMetrics = ctx.measureText(text);
    let x = 10;
    let y = 10;

    switch (position) {
      case 'top-left':
        x = 10;
        y = 30;
        break;
      case 'top-right':
        x = canvas.width - textMetrics.width - 10;
        y = 30;
        break;
      case 'bottom-left':
        x = 10;
        y = canvas.height - 10;
        break;
      case 'bottom-right':
        x = canvas.width - textMetrics.width - 10;
        y = canvas.height - 10;
        break;
      case 'center':
        x = (canvas.width - textMetrics.width) / 2;
        y = (canvas.height + 20) / 2;
        break;
    }

    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;

    return canvas.toDataURL();
  };

  const cropImage = (
    canvas: HTMLCanvasElement,
    _ctx: CanvasRenderingContext2D,
    options: any
  ): string => {
    const { x, y, width, height } = options;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      throw new Error('Failed to create temporary canvas context for cropping');
    }

    tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

    return tempCanvas.toDataURL();
  };

  const rotateImage = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    options: any
  ): string => {
    const { angle, maintainSize } = options;

    if (maintainSize) {
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      const rotatedWidth = Math.abs(canvas.width * cos) + Math.abs(canvas.height * sin);
      const rotatedHeight = Math.abs(canvas.width * sin) + Math.abs(canvas.height * cos);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = rotatedWidth;
      tempCanvas.height = rotatedHeight;
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        throw new Error('Failed to create temporary canvas context for rotation');
      }

      tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
      tempCtx.rotate(radians);
      tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

      return tempCanvas.toDataURL();
    }
    const radians = (angle * Math.PI) / 180;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    return canvas.toDataURL();
  };

  const processBatch = async () => {
    setIsProcessing(true);
    const startTime = new Date();

    try {
      const tasksToProcess = tasks.filter((task) => task.status === 'pending');
      const processedTasks = [...tasks];

      for (let i = 0; i < tasksToProcess.length; i += maxConcurrency) {
        const batch = tasksToProcess.slice(i, i + maxConcurrency);

        const batchPromises = batch.map(async (task) => {
          const updatedTask = {
            ...task,
            status: 'processing' as const,
            startTime: new Date(),
            progress: 0,
          };
          const taskIndex = processedTasks.findIndex((t) => t.id === task.id);
          if (taskIndex !== -1) {
            processedTasks[taskIndex] = updatedTask;
          }
          setTasks([...processedTasks]);

          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setTasks((prev) => {
              const currentIndex = prev.findIndex((t) => t.id === task.id);
              if (currentIndex !== -1) {
                const updatedTasks = [...prev];
                updatedTasks[currentIndex] = {
                  ...updatedTasks[currentIndex],
                  progress: Math.min(90, updatedTasks[currentIndex].progress + 10),
                };
                return updatedTasks;
              }
              return prev;
            });
          }, 200);

          const result = await processImage(updatedTask);

          clearInterval(progressInterval);

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
      const totalInputSize = processedTasks.reduce((sum, task) => sum + task.originalSize, 0);
      const totalOutputSize = processedTasks.reduce((sum, task) => sum + (task.outputSize || 0), 0);
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

      const operationsSummary: Record<
        string,
        { count: number; success: number; totalSize: number }
      > = {};
      processedTasks.forEach((task) => {
        if (!operationsSummary[task.operationType]) {
          operationsSummary[task.operationType] = {
            count: 0,
            success: 0,
            totalSize: 0,
          };
        }
        operationsSummary[task.operationType].count++;
        if (task.status === 'completed') {
          operationsSummary[task.operationType].success++;
        }
        operationsSummary[task.operationType].totalSize += task.outputSize || 0;
      });

      setBatchResult({
        totalTasks: tasks.length,
        completedTasks: completedCount,
        errorTasks: errorCount,
        totalInputSize,
        totalOutputSize,
        startTime,
        endTime,
        averageProcessingTime: averageTime,
        operationsSummary,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newTasks: BatchImageTask[] = [];

    Array.from(files).forEach((file, index) => {
      // Validate file is an image
      if (file.type.startsWith('image/')) {
        newTasks.push({
          id: `file-${Date.now()}-${index}`,
          fileName: file.name,
          originalFile: file,
          status: 'pending' as const,
          operationType: selectedOperation.id,
          progress: 0,
          originalSize: file.size,
          processingOptions: processingOptions,
        });
      }
    });

    setTasks((prev) => [...prev, ...newTasks]);

    // Auto process if enabled
    if (autoProcess && newTasks.length > 0) {
      setTimeout(() => processBatch(), 100);
    }
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
        t.id === id
          ? {
              ...t,
              status: 'pending' as const,
              errorMessage: undefined,
              progress: 0,
            }
          : t
      )
    );

    const result = await processImage(task);
    setTasks((prev) => prev.map((t) => (t.id === id ? result : t)));
  };

  const downloadResults = () => {
    if (tasks.length === 0) return;

    const completedTasks = tasks.filter((task) => task.status === 'completed');
    if (completedTasks.length === 0) return;

    // Create a zip file with all processed images
    completedTasks.forEach((task, _index) => {
      if (task.outputDataUrl) {
        const a = document.createElement('a');
        a.href = task.outputDataUrl;
        a.download = `${task.fileName.replace(/\.[^/.]+$/, '')}_processed.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
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
        return 'text-gray-600';
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
            <ImageIcon className="h-5 w-5" />
            Image Batch Processor
          </CardTitle>
          <CardDescription>
            Process multiple images at once with various operations including resize, convert,
            compress, filter, watermark, crop, and rotate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="operations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="space-y-6">
              {/* Operation Selection */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Operation Type</Label>
                  <Select
                    value={selectedOperation.id}
                    onValueChange={(value) => {
                      const operation = batchOperations.find((op) => op.id === value);
                      if (operation) setSelectedOperation(operation);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {batchOperations.map((operation) => (
                        <SelectItem key={operation.id} value={operation.id}>
                          <div className="flex items-center gap-2">
                            {operation.id === 'resize' && <Maximize2 className="h-4 w-4" />}
                            {operation.id === 'convert' && <RefreshCw className="h-4 w-4" />}
                            {operation.id === 'compress' && <Minimize2 className="h-4 w-4" />}
                            {operation.id === 'filter' && <Sliders className="h-4 w-4" />}
                            {operation.id === 'watermark' && <Tag className="h-4 w-4" />}
                            {operation.id === 'crop' && <Crop className="h-4 w-4" />}
                            {operation.id === 'rotate' && <RotateCw className="h-4 w-4" />}
                            {operation.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-gray-600 text-sm">{selectedOperation.description}</p>
                </div>

                <div className="space-y-2">
                  <Label>File Upload</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Quick Stats</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <div className="font-bold text-lg">{tasks.length}</div>
                      <div className="text-gray-600">Total Files</div>
                    </div>
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <div className="font-bold text-lg">
                        {tasks.filter((t) => t.status === 'completed').length}
                      </div>
                      <div className="text-gray-600">Completed</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-process"
                    checked={autoProcess}
                    onCheckedChange={setAutoProcess}
                  />
                  <Label htmlFor="auto-process">Auto Process</Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={processBatch}
                  disabled={
                    tasks.filter((t) => t.status === 'pending').length === 0 || isProcessing
                  }
                  className="flex-1"
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
                <Button onClick={clearAll} variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">General Settings</h4>
                  <div className="space-y-3">
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
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Operation Settings</h4>
                  <div className="space-y-3">
                    {selectedOperation.id === 'resize' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label>Width</Label>
                            <Input
                              type="number"
                              value={processingOptions.resize.width}
                              onChange={(e) =>
                                setProcessingOptions((prev) => ({
                                  ...prev,
                                  resize: {
                                    ...prev.resize,
                                    width: Number.parseInt(e.target.value),
                                  },
                                }))
                              }
                              min="1"
                              max="4000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Height</Label>
                            <Input
                              type="number"
                              value={processingOptions.resize.height}
                              onChange={(e) =>
                                setProcessingOptions((prev) => ({
                                  ...prev,
                                  resize: {
                                    ...prev.resize,
                                    height: Number.parseInt(e.target.value),
                                  },
                                }))
                              }
                              min="1"
                              max="4000"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="maintain-aspect-ratio"
                            checked={processingOptions.resize.maintainAspectRatio}
                            onCheckedChange={(checked) =>
                              setProcessingOptions((prev) => ({
                                ...prev,
                                resize: {
                                  ...prev.resize,
                                  maintainAspectRatio: checked,
                                },
                              }))
                            }
                          />
                          <Label htmlFor="maintain-aspect-ratio">Maintain Aspect Ratio</Label>
                        </div>
                      </div>
                    )}

                    {selectedOperation.id === 'convert' && (
                      <div className="space-y-2">
                        <Label>Target Format</Label>
                        <Select
                          value={processingOptions.convert.format}
                          onValueChange={(value) =>
                            setProcessingOptions((prev) => ({
                              ...prev,
                              convert: { ...prev.convert, format: value },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {imageFormats.map((format) => (
                              <SelectItem key={format.value} value={format.value}>
                                {format.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="space-y-2">
                          <Label>Quality</Label>
                          <Slider
                            value={[processingOptions.convert.quality]}
                            onValueChange={(value) =>
                              setProcessingOptions((prev) => ({
                                ...prev,
                                convert: { ...prev.convert, quality: value[0] },
                              }))
                            }
                            min={10}
                            max={100}
                            className="w-full"
                          />
                          <div className="text-gray-600 text-sm">
                            Quality: {processingOptions.convert.quality}%
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedOperation.id === 'compress' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label>Quality</Label>
                            <Slider
                              value={[processingOptions.compress.quality]}
                              onValueChange={(value) =>
                                setProcessingOptions((prev) => ({
                                  ...prev,
                                  compress: {
                                    ...prev.compress,
                                    quality: value[0],
                                  },
                                }))
                              }
                              min={10}
                              max={100}
                              className="w-full"
                            />
                            <div className="text-gray-600 text-sm">
                              Quality: {processingOptions.compress.quality}%
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Max Size (KB)</Label>
                            <Input
                              type="number"
                              value={processingOptions.compress.maxSizeKB}
                              onChange={(e) =>
                                setProcessingOptions((prev) => ({
                                  ...prev,
                                  compress: {
                                    ...prev.compress,
                                    maxSizeKB: Number.parseInt(e.target.value),
                                  },
                                }))
                              }
                              min="1"
                              max="5000"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedOperation.id === 'filter' && (
                      <div className="space-y-2">
                        <Label>Filter Preset</Label>
                        <Select
                          value={processingOptions.filter.preset}
                          onValueChange={(value) =>
                            setProcessingOptions((prev) => ({
                              ...prev,
                              filter: { ...prev.filter, preset: value },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {filterPresets.map((preset) => (
                              <SelectItem key={preset.id} value={preset.id}>
                                {preset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {processingOptions.filter.preset !== 'none' && (
                          <div className="space-y-2">
                            <Label>Intensity</Label>
                            <Slider
                              value={[processingOptions.filter.intensity]}
                              onValueChange={(value) =>
                                setProcessingOptions((prev) => ({
                                  ...prev,
                                  filter: {
                                    ...prev.filter,
                                    intensity: value[0],
                                  },
                                }))
                              }
                              min={0}
                              max={100}
                              className="w-full"
                            />
                            <div className="text-gray-600 text-sm">
                              Intensity: {processingOptions.filter.intensity}%
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {batchResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Batch Processing Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <div className="font-bold text-2xl text-blue-600">
                          {batchResult.completedTasks}/{batchResult.totalTasks}
                        </div>
                        <div className="text-gray-600 text-sm">Success Rate</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <div className="font-bold text-2xl text-green-600">
                          {batchResult.averageProcessingTime.toFixed(0)}ms
                        </div>
                        <div className="text-gray-600 text-sm">Avg Time</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <div className="font-bold text-2xl text-purple-600">
                          {(batchResult.totalInputSize / 1024).toFixed(1)}KB
                        </div>
                        <div className="text-gray-600 text-sm">Input Size</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <div className="font-bold text-2xl text-orange-600">
                          {(batchResult.totalOutputSize / 1024).toFixed(1)}KB
                        </div>
                        <div className="text-gray-600 text-sm">Output Size</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Operations Summary</h4>
                      <div className="space-y-2">
                        {Object.entries(batchResult.operationsSummary).map(
                          ([operation, summary]) => (
                            <div
                              key={operation}
                              className="flex items-center justify-between rounded bg-gray-50 p-2"
                            >
                              <span className="font-medium">{operation}</span>
                              <div className="flex gap-4 text-sm">
                                <span>Count: {summary.count}</span>
                                <span>Success: {summary.success}</span>
                                <span>
                                  Size: {(summary.totalSize / 1024).toFixed(1)}
                                  KB
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={downloadResults}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`font-medium text-sm ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span className="ml-2">{task.fileName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {task.operationType}
                        </Badge>
                        {getStatusBadge(task.status)}
                      </div>

                      {task.status === 'processing' && (
                        <div className="mt-2">
                          <Progress value={task.progress} className="h-2 w-full" />
                        </div>
                      )}

                      <div className="mt-1 text-gray-600 text-sm">
                        Size: {(task.originalSize / 1024).toFixed(1)}KB
                        {task.outputSize && ` → ${(task.outputSize / 1024).toFixed(1)}KB`}
                      </div>

                      {task.errorMessage && (
                        <div className="mt-1 text-red-600 text-sm">Error: {task.errorMessage}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              if (task.outputDataUrl) {
                                const a = document.createElement('a');
                                a.href = task.outputDataUrl;
                                a.download = task.fileName;
                                a.target = '_blank';
                                a.click();
                              }
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              if (task.outputDataUrl) {
                                const a = document.createElement('a');
                                a.href = task.outputDataUrl;
                                a.download = task.fileName;
                                a.target = '_blank';
                                a.click();
                              }
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {task.status === 'error' && (
                        <Button onClick={() => retryTask(task.id)} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}

                      <Button onClick={() => removeTask(task.id)} variant="outline" size="sm">
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
    </div>
  );
};

export default ImageBatchProcessor;
export { ImageBatchProcessor };
