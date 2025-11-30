'use client';

import { ToolWrapper } from '@/components/tools/tool-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCanvasOperations } from '@/lib/image/canvas-operations';
import { useFormatConverter } from '@/lib/image/format-converters';
import { Download, Maximize2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

// Types
export interface ResizeResult {
  file: File;
  dataUrl: string;
  originalSize: { width: number; height: number };
  newSize: { width: number; height: number };
  originalName: string;
  format: string;
  quality: number;
}

export interface ResizePreset {
  name: string;
  width?: number;
  height?: number;
  unit: 'pixels' | 'percent';
  maintainAspectRatio: boolean;
  description?: string;
}

interface ImageResizerProps {
  onComplete?: (result: ResizeResult) => void;
}

// Common resize presets
const RESIZE_PRESETS: ResizePreset[] = [
  {
    name: 'Original',
    width: 100,
    height: 100,
    unit: 'percent',
    maintainAspectRatio: true,
  },
  {
    name: 'Half Size',
    width: 50,
    height: 50,
    unit: 'percent',
    maintainAspectRatio: true,
  },
  {
    name: 'Double Size',
    width: 200,
    height: 200,
    unit: 'percent',
    maintainAspectRatio: true,
  },
  {
    name: 'Thumbnail',
    width: 150,
    height: 150,
    unit: 'pixels',
    maintainAspectRatio: true,
  },
  {
    name: 'Small',
    width: 320,
    height: 240,
    unit: 'pixels',
    maintainAspectRatio: true,
  },
  {
    name: 'Medium',
    width: 800,
    height: 600,
    unit: 'pixels',
    maintainAspectRatio: true,
  },
  {
    name: 'Large',
    width: 1920,
    height: 1080,
    unit: 'pixels',
    maintainAspectRatio: true,
  },
  {
    name: 'Square',
    width: 512,
    height: 512,
    unit: 'pixels',
    maintainAspectRatio: false,
  },
  {
    name: 'Instagram',
    width: 1080,
    height: 1080,
    unit: 'pixels',
    maintainAspectRatio: false,
  },
  {
    name: 'Twitter Header',
    width: 1500,
    height: 500,
    unit: 'pixels',
    maintainAspectRatio: false,
  },
];

const QUALITY_PRESETS = [
  { name: 'High', value: 0.95 },
  { name: 'Good', value: 0.85 },
  { name: 'Medium', value: 0.75 },
  { name: 'Low', value: 0.6 },
];

export const ImageResizer: React.FC<ImageResizerProps> = ({ onComplete }) => {
  // Stub functions for missing hooks
  const capturePerformance = async <T,>(_name: string, fn: () => Promise<T>): Promise<T> => fn();
  const validateProcessing = async (_file: File) => ({ isCompliant: true, reason: '' });
  const _getComplianceStatus = () => 'ready';

  const { resizeImage } = useCanvasOperations();
  const { estimateFileSize } = useFormatConverter();

  // State
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File>();
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [resizeMode, setResizeMode] = useState<'dimensions' | 'preset'>('dimensions');
  const [selectedPreset, setSelectedPreset] = useState<ResizePreset>(RESIZE_PRESETS[0]);
  const [targetWidth, setTargetWidth] = useState<string>('');
  const [targetHeight, setTargetHeight] = useState<string>('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [unit, setUnit] = useState<'pixels' | 'percent'>('pixels');
  const [fitType, setFitType] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(0.85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [estimatedFileSize, setEstimatedFileSize] = useState<string>('');

  const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** index;
    return `${value.toFixed(1)} ${units[index]}`;
  };

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse image size on load
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.target as HTMLImageElement;
      setOriginalSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      if (unit === 'percent') {
        setTargetWidth('100');
        setTargetHeight('100');
      } else {
        setTargetWidth(img.naturalWidth.toString());
        setTargetHeight(img.naturalHeight.toString());
      }
    },
    [unit]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        // Validate constitutional compliance
        const complianceCheck = await validateProcessing(file);
        if (!complianceCheck.isCompliant) {
          throw new Error(complianceCheck.reason || 'Image does not meet processing requirements');
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          setImageUrl(url);
          setPreviewUrl('');
          setEstimatedFileSize('');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error loading image:', error);
        // Handle error with user notification
      }
    },
    [validateProcessing]
  );

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Calculate dimensions while maintaining aspect ratio
  const calculateMaintainedDimension = useCallback(
    (width: number, height: number, changedField: 'width' | 'height') => {
      if (!maintainAspectRatio || originalSize.width === 0 || originalSize.height === 0) {
        return { width, height };
      }

      const aspectRatio = originalSize.width / originalSize.height;

      if (changedField === 'width') {
        return {
          width,
          height: Math.round(width / aspectRatio),
        };
      }
      return {
        width: Math.round(height * aspectRatio),
        height,
      };
    },
    [maintainAspectRatio, originalSize]
  );

  // Handle dimension changes
  const handleDimensionChange = useCallback(
    (field: 'width' | 'height', value: string) => {
      const numValue = Number.parseFloat(value) || 0;

      if (field === 'width') {
        setTargetWidth(value);
        if (maintainAspectRatio) {
          const { height } = calculateMaintainedDimension(
            numValue,
            Number.parseFloat(targetHeight) || 0,
            'width'
          );
          setTargetHeight(height.toString());
        }
      } else {
        setTargetHeight(value);
        if (maintainAspectRatio) {
          const { width } = calculateMaintainedDimension(
            Number.parseFloat(targetWidth) || 0,
            numValue,
            'height'
          );
          setTargetWidth(width.toString());
        }
      }
    },
    [targetWidth, targetHeight, maintainAspectRatio, calculateMaintainedDimension]
  );

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (preset: ResizePreset) => {
      setSelectedPreset(preset);
      setUnit(preset.unit);
      setMaintainAspectRatio(preset.maintainAspectRatio);

      if (preset.unit === 'percent') {
        setTargetWidth(preset.width?.toString() || '100');
        setTargetHeight(preset.height?.toString() || '100');
      } else {
        if (originalSize.width > 0 && preset.maintainAspectRatio) {
          // Calculate based on the provided dimension
          if (preset.width) {
            setTargetWidth(preset.width.toString());
            const aspectRatio = originalSize.width / originalSize.height;
            setTargetHeight(Math.round(preset.width / aspectRatio).toString());
          } else if (preset.height) {
            setTargetHeight(preset.height.toString());
            const aspectRatio = originalSize.width / originalSize.height;
            setTargetWidth(Math.round(preset.height * aspectRatio).toString());
          }
        } else {
          setTargetWidth(preset.width?.toString() || '');
          setTargetHeight(preset.height?.toString() || '');
        }
      }
    },
    [originalSize]
  );

  // Calculate actual target dimensions
  const targetDimensions = useMemo(() => {
    let width = Number.parseFloat(targetWidth) || 0;
    let height = Number.parseFloat(targetHeight) || 0;

    if (unit === 'percent') {
      width = Math.round((width / 100) * originalSize.width);
      height = Math.round((height / 100) * originalSize.height);
    }

    return { width, height };
  }, [targetWidth, targetHeight, unit, originalSize]);

  // Calculate size reduction
  const sizeChange = useMemo(() => {
    if (originalSize.width === 0 || originalSize.height === 0)
      return { width: 0, height: 0, percentage: 0 };

    const widthChange = ((targetDimensions.width - originalSize.width) / originalSize.width) * 100;
    const heightChange =
      ((targetDimensions.height - originalSize.height) / originalSize.height) * 100;
    const avgChange = (widthChange + heightChange) / 2;

    return { width: widthChange, height: heightChange, percentage: avgChange };
  }, [targetDimensions, originalSize]);

  // Estimate file size
  const estimateFileSizeEffect = useCallback(async () => {
    if (!imageFile || targetDimensions.width === 0 || targetDimensions.height === 0) {
      setEstimatedFileSize('');
      return;
    }

    try {
      const estimatedSize = await estimateFileSize(
        {
          width: targetDimensions.width,
          height: targetDimensions.height,
        },
        outputFormat,
        quality
      );
      setEstimatedFileSize(formatBytes(estimatedSize));
    } catch (error) {
      console.error('Error estimating file size:', error);
      setEstimatedFileSize('');
    }
  }, [imageFile, targetDimensions, outputFormat, quality, estimateFileSize]);

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (!imageFile || targetDimensions.width === 0 || targetDimensions.height === 0) return;

    setIsProcessing(true);

    try {
      const result = await capturePerformance('resize-preview', async () => {
        const reader = new FileReader();
        const imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });

        return await resizeImage(img, {
          width: targetDimensions.width,
          height: targetDimensions.height,
          maintainAspectRatio: !resizeMode || maintainAspectRatio,
          fitType,
        });
      });

      if (result) {
        const previewDataUrl = result.toDataURL(`image/${outputFormat}`, quality);
        setPreviewUrl(previewDataUrl);
        await estimateFileSizeEffect();
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    imageFile,
    targetDimensions,
    resizeMode,
    maintainAspectRatio,
    fitType,
    outputFormat,
    quality,
    capturePerformance,
    resizeImage,
    estimateFileSizeEffect,
  ]);

  // Apply resize
  const handleResize = useCallback(async () => {
    if (!imageFile || targetDimensions.width === 0 || targetDimensions.height === 0) return;

    setIsProcessing(true);

    try {
      const result = await capturePerformance('image-resize', async () => {
        const reader = new FileReader();
        const imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });

        const canvas = await resizeImage(img, {
          width: targetDimensions.width,
          height: targetDimensions.height,
          maintainAspectRatio: !resizeMode || maintainAspectRatio,
          fitType,
        });

        return new Promise<{
          file: File;
          dataUrl: string;
        }>((resolve) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const fileName = imageFile.name.replace(/\.[^/.]+$/, `_resized.${outputFormat}`);
                const file = new File([blob], fileName, {
                  type: `image/${outputFormat}`,
                });
                const dataUrl = canvas.toDataURL(`image/${outputFormat}`, quality);
                resolve({ file, dataUrl });
              }
            },
            `image/${outputFormat}`,
            quality
          );
        });
      });

      if (result) {
        const resizeResult: ResizeResult = {
          file: result.file,
          dataUrl: result.dataUrl,
          originalSize: { ...originalSize },
          newSize: targetDimensions,
          originalName: imageFile.name,
          format: outputFormat,
          quality,
        };

        setPreviewUrl(result.dataUrl);
        onComplete?.(resizeResult);
      }
    } catch (error) {
      console.error('Error resizing image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    imageFile,
    targetDimensions,
    resizeMode,
    maintainAspectRatio,
    fitType,
    outputFormat,
    quality,
    originalSize,
    capturePerformance,
    resizeImage,
    onComplete,
  ]);

  // Reset
  const handleReset = useCallback(() => {
    setImageUrl('');
    setImageFile(undefined);
    setPreviewUrl('');
    setEstimatedFileSize('');
    setTargetWidth('');
    setTargetHeight('');
    setMaintainAspectRatio(true);
    setQuality(0.85);
  }, []);

  const toolConfig = {
    id: 'image-resizer',
    name: 'Image Resizer',
    description:
      'Resize images with precise control, aspect ratio preservation, and quality optimization',
    category: 'image',
    version: '1.0.0',
    icon: <Maximize2 className="h-5 w-5" />,
    tags: ['image', 'resize', 'scale'],
    hasSettings: true,
    hasHelp: true,
    canExport: true,
    canImport: true,
    canCopy: false,
    canReset: true,
  };

  return (
    <ToolWrapper config={toolConfig}>
      <div className="space-y-6">
        {/* File Input */}
        {!imageUrl && (
          <Card
            className="cursor-pointer border-2 border-gray-300 border-dashed p-8 transition-colors hover:border-gray-400"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <Maximize2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 font-medium text-gray-900 text-sm">
                Drop an image here or click to select
              </h3>
              <p className="mt-1 text-gray-500 text-xs">Supports PNG, JPEG, WebP, BMP up to 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </Card>
        )}

        {imageUrl && (
          <>
            {/* Resize Controls */}
            <Tabs
              value={resizeMode}
              onValueChange={(value) => setResizeMode(value as 'dimensions' | 'preset')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                <TabsTrigger value="preset">Presets</TabsTrigger>
              </TabsList>

              <TabsContent value="dimensions" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resize-width">Width</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="resize-width"
                        type="number"
                        value={targetWidth}
                        onChange={(e) => handleDimensionChange('width', e.target.value)}
                        min="1"
                        max={unit === 'percent' ? 200 : 10000}
                      />
                      <Select
                        value={unit}
                        onValueChange={(value: 'pixels' | 'percent') => setUnit(value)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pixels">px</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="resize-height">Height</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="resize-height"
                        type="number"
                        value={targetHeight}
                        onChange={(e) => handleDimensionChange('height', e.target.value)}
                        min="1"
                        max={unit === 'percent' ? 200 : 10000}
                      />
                      <span className="flex w-20 items-center justify-center text-gray-500 text-sm">
                        {unit === 'percent' ? '%' : 'px'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="maintain-aspect"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="maintain-aspect">Maintain aspect ratio</Label>
                  </div>

                  {!maintainAspectRatio && (
                    <div>
                      <Label>Fit Type</Label>
                      <Select
                        value={fitType}
                        onValueChange={(value: 'contain' | 'cover' | 'fill') => setFitType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contain">Contain (fit within bounds)</SelectItem>
                          <SelectItem value="cover">Cover (fill bounds, may crop)</SelectItem>
                          <SelectItem value="fill">Fill (stretch to fit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preset" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {RESIZE_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant={selectedPreset.name === preset.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetSelect(preset)}
                      className="justify-start"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Quality Settings */}
            <div className="space-y-4">
              <div>
                <Label>Output Format</Label>
                <Select
                  value={outputFormat}
                  onValueChange={(value: 'png' | 'jpeg' | 'webp') => setOutputFormat(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG (Lossless, supports transparency)</SelectItem>
                    <SelectItem value="jpeg">JPEG (Smaller file size)</SelectItem>
                    <SelectItem value="webp">WebP (Modern format, smaller size)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {outputFormat !== 'png' && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label>Quality: {Math.round(quality * 100)}%</Label>
                    <div className="flex space-x-1">
                      {QUALITY_PRESETS.map((preset) => (
                        <Button
                          key={preset.name}
                          variant={quality === preset.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setQuality(preset.value)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Slider
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                </div>
              )}
            </div>

            {/* Size Information */}
            <Card className="p-4">
              <h3 className="mb-3 font-medium text-sm">Size Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Original:</span>
                  <p className="font-mono">
                    {originalSize.width} × {originalSize.height} px
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Target:</span>
                  <p className="font-mono">
                    {targetDimensions.width} × {targetDimensions.height} px
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Change:</span>
                  <p className="font-mono">
                    {sizeChange.percentage > 0 ? '+' : ''}
                    {sizeChange.percentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Estimated Size:</span>
                  <p className="font-mono">{estimatedFileSize || '—'}</p>
                </div>
              </div>
            </Card>

            {/* Current Image */}
            <div className="space-y-2">
              <Label>Original Image</Label>
              <div className="overflow-hidden rounded-lg border bg-gray-100">
                <img
                  src={imageUrl}
                  alt="Original"
                  className="mx-auto w-full max-w-md object-contain"
                  style={{ maxHeight: '200px' }}
                  onLoad={handleImageLoad}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button onClick={generatePreview} disabled={isProcessing || !imageFile}>
                {isProcessing ? 'Processing...' : 'Preview'}
              </Button>
              <Button onClick={handleResize} disabled={isProcessing || !imageFile}>
                <Download className="mr-2 h-4 w-4" />
                Resize Image
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>

            {/* Preview */}
            {previewUrl && (
              <Card className="p-4">
                <h3 className="mb-2 font-medium text-sm">Preview</h3>
                <img
                  src={previewUrl}
                  alt="Resized preview"
                  className="mx-auto w-full max-w-sm rounded border"
                />
              </Card>
            )}
          </>
        )}
      </div>
    </ToolWrapper>
  );
};
