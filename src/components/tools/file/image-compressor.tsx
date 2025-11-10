/**
 * Image Compressor Component
 * Compress and optimize images with quality control and format conversion
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Image,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Zap,
  Settings,
  RefreshCw,
  AlertTriangle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface CompressionResult {
  originalFile: File;
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  quality: number;
  dimensions: {
    width: number;
    height: number;
  };
  processingTime: number;
}

interface CompressionOptions {
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
  preserveAspectRatio: boolean;
  progressive: boolean;
}

export function ImageCompressor({ className }: { className?: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  const [options, setOptions] = useState<CompressionOptions>({
    quality: 80,
    format: 'jpeg',
    maxWidth: 1920,
    maxHeight: 1080,
    preserveAspectRatio: true,
    progressive: true
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize session
  useEffect(() => {
    const session = createSession('image-compressor', {
      options,
      initialFile: null
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setCompressionResult(null);

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { fileName: file.name, fileSize: file.size, fileType: file.type },
          lastActivity: new Date()
        });
      }
    } else {
      toast.error('Please select a valid image file');
    }
  }, [sessionId]);

  // Handle file input change
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Compress image
  const compressImage = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Create image reader
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          // Create canvas for compression
          const canvas = canvasRef.current;
          if (!canvas) {
            throw new Error('Canvas not available');
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('2D context not available');
          }

          // Calculate new dimensions
          let { width, height } = img;
          const aspectRatio = width / height;

          if (options.maxWidth && width > options.maxWidth) {
            width = options.maxWidth;
            height = width / aspectRatio;
          }

          if (options.maxHeight && height > options.maxHeight) {
            height = options.maxHeight;
            width = height * aspectRatio;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const originalSize = selectedFile.size;
              const compressedSize = blob.size;
              const compressionRatio = originalSize > 0 ? (compressedSize / originalSize) * 100 : 100;
              const processingTime = Date.now() - startTime;

              const result: CompressionResult = {
                originalFile: selectedFile,
                compressedBlob: blob,
                originalSize,
                compressedSize,
                compressionRatio,
                format: options.format,
                quality: options.quality,
                dimensions: { width, height },
                processingTime
              };

              setCompressionResult(result);

              const savings = (100 - compressionRatio).toFixed(1);
              toast.success(`Image compressed successfully! Saved ${savings}% space`);

              if (sessionId) {
                updateSession(sessionId, {
                  results: {
                    compressedSize,
                    originalSize,
                    compressionRatio,
                    dimensions: result.dimensions,
                    format: result.format
                  },
                  lastActivity: new Date()
                });
                addToHistory(sessionId, 'compress', true);
              }
            }
          }, `image/${options.format}`, options.quality / 100);
        };

        img.onerror = () => {
          throw new Error('Failed to load image');
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };

      reader.readAsDataURL(selectedFile);

    } catch (error) {
      toast.error('Failed to compress image');
      if (sessionId) addToHistory(sessionId, 'compress', false);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, options, sessionId]);

  // Download compressed image
  const downloadCompressed = useCallback(() => {
    if (!compressionResult) return;

    const blob = compressionResult.compressedBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Generate filename
    const originalName = compressionResult.originalFile.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const extension = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
    a.download = `${nameWithoutExt}_compressed.${extension}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Compressed image downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [compressionResult, sessionId]);

  // Copy compressed image to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!compressionResult) return;

    try {
      // Create a ClipboardItem for the image
      const clipboardItem = new ClipboardItem({
        'image/png': compressionResult.compressedBlob,
        'image/jpeg': compressionResult.compressedBlob,
        'image/webp': compressionResult.compressedBlob,
      });

      await navigator.clipboard.write([clipboardItem]);
      toast.success('Compressed image copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy image to clipboard');
    }
  }, [compressionResult]);

  // Reset everything
  const reset = useCallback(() => {
    setSelectedFile(null);
    setCompressionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load sample image
  const loadSample = useCallback(() => {
    // Create a sample image using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 800, 600);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);

      // Add some text
      ctx.fillStyle = 'white';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Sample Image', 400, 300);

      ctx.font = '24px Arial';
      ctx.fillText('800x600 pixels', 400, 350);

      // Convert to blob and create file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'sample-image.jpg', { type: 'image/jpeg' });
          handleFileSelect(file);
        }
      }, 'image/jpeg', 90);
    }
  }, [handleFileSelect]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Image className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">Image Compressor</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={loadSample}
          >
            Load Sample
          </Button>
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={reset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <ImageIcon className=\"h-5 w-5 mr-2\" />
            Select Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className=\"border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors\"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type=\"file\"
              accept=\"image/*\"
              onChange={handleFileInput}
              className=\"hidden\"
            />

            {selectedFile ? (
              <div className=\"space-y-2\">
                <div className=\"flex items-center justify-center space-x-2 text-green-600\">
                  <CheckCircle2 className=\"h-8 w-8\" />
                  <div>
                    <div className=\"font-medium\">{selectedFile.name}</div>
                    <div className=\"text-sm text-muted-foreground\">
                      {formatBytes(selectedFile.size)} • {selectedFile.type}
                    </div>
                  </div>
                </div>
                <div className=\"text-sm text-muted-foreground\">
                  Click or drag to replace this image
                </div>
              </div>
            ) : (
              <div className=\"space-y-2\">
                <ImageIcon className=\"h-12 w-12 mx-auto text-muted-foreground\" />
                <div>
                  <div className=\"font-medium\">Drop image here or click to browse</div>
                  <div className=\"text-sm text-muted-foreground\">
                    Supports JPG, PNG, WebP, GIF, and more
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compression Options */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <Settings className=\"h-5 w-5 mr-2\" />
            Compression Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-6\">
            {/* Quality Setting */}
            <div className=\"space-y-2\">
              <div className=\"flex items-center justify-between\">
                <Label htmlFor=\"quality\">Quality: {options.quality}%</Label>
                <Badge variant={options.quality >= 80 ? \"default\" : options.quality >= 60 ? \"secondary\" : \"destructive\"}>
                  {options.quality >= 80 ? 'High' : options.quality >= 60 ? 'Medium' : 'Low'}
                </Badge>
              </div>
              <Slider
                id=\"quality\"
                value={[options.quality]}
                onValueChange={(value) => setOptions(prev => ({ ...prev, quality: value[0] }))}
                max={100}
                min={10}
                step={5}
                className=\"w-full\"
              />
            </div>

            {/* Format Selection */}
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"format\">Format</Label>
                <Select
                  value={options.format}
                  onValueChange={(value: 'jpeg' | 'png' | 'webp') =>
                    setOptions(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=\"jpeg\">JPEG</SelectItem>
                    <SelectItem value=\"png\">PNG</SelectItem>
                    <SelectItem value=\"webp\">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className=\"space-y-2\">
                <Label htmlFor=\"maxWidth\">Max Width: {options.maxWidth}px</Label>
                <Slider
                  id=\"maxWidth\"
                  value={[options.maxWidth || 1920]}
                  onValueChange={(value) => setOptions(prev => ({ ...prev, maxWidth: value[0] }))}
                  max={3840}
                  min={100}
                  step={100}
                  className=\"w-full\"
                />
              </div>

              <div className=\"space-y-2\">
                <Label htmlFor=\"maxHeight\">Max Height: {options.maxHeight}px</Label>
                <Slider
                  id=\"maxHeight\"
                  value={[options.maxHeight || 1080]}
                  onValueChange={(value) => setOptions(prev => ({ ...prev, maxHeight: value[0] }))}
                  max={2160}
                  min={100}
                  step={100}
                  className=\"w-full\"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              <div className=\"flex items-center space-x-2\">
                <input
                  type=\"checkbox\"
                  id=\"preserve-aspect\"
                  checked={options.preserveAspectRatio}
                  onChange={(e) => setOptions(prev => ({ ...prev, preserveAspectRatio: e.target.checked }))}
                  className=\"rounded\"
                />
                <Label htmlFor=\"preserve-aspect\">Preserve aspect ratio</Label>
              </div>

              <div className=\"flex items-center space-x-2\">
                <input
                  type=\"checkbox\"
                  id=\"progressive\"
                  checked={options.progressive}
                  onChange={(e) => setOptions(prev => ({ ...prev, progressive: e.target.checked }))}
                  className=\"rounded\"
                />
                <Label htmlFor=\"progressive\">Progressive loading</Label>
              </div>
            </div>

            {/* Compress Button */}
            <div className=\"flex items-center space-x-4\">
              <Button
                onClick={compressImage}
                disabled={isProcessing || !selectedFile}
                className=\"flex items-center space-x-2\"
              >
                <Zap className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
                <span>{isProcessing ? 'Compressing...' : 'Compress Image'}</span>
              </Button>

              {compressionResult && (
                <>
                  <Button
                    variant=\"outline\"
                    onClick={copyToClipboard}
                  >
                    <Copy className=\"h-4 w-4 mr-2\" />
                    Copy
                  </Button>

                  <Button
                    variant=\"outline\"
                    onClick={downloadCompressed}
                  >
                    <Download className=\"h-4 w-4 mr-2\" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {compressionResult && (
        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
          {/* Original Image */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center justify-between\">
                <div className=\"flex items-center\">
                  <ImageIcon className=\"h-5 w-5 mr-2\" />
                  Original Image
                </div>
                <div className=\"flex items-center space-x-2\">
                  <Badge variant=\"outline\">
                    {formatBytes(compressionResult.originalSize)}
                  </Badge>
                  <Badge variant=\"outline\">
                    {compressionResult.dimensions.width}×{compressionResult.dimensions.height}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                <div className=\"text-sm text-muted-foreground\">
                  <div>File: {compressionResult.originalFile.name}</div>
                  <div>Type: {compressionResult.originalFile.type}</div>
                  <div>Size: {formatBytes(compressionResult.originalSize)}</div>
                </div>
                {selectedFile && (
                  <div className=\"relative bg-muted/20 rounded-lg overflow-hidden\">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt=\"Original image\"
                      className=\"w-full h-auto max-h-64 object-contain\"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compressed Image */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center justify-between\">
                <div className=\"flex items-center\">
                  <Zap className=\"h-5 w-5 mr-2\" />
                  Compressed Image
                </div>
                <div className=\"flex items-center space-x-2\">
                  <Badge variant=\"outline\">
                    {formatBytes(compressionResult.compressedSize)}
                  </Badge>
                  <Badge variant=\"outline\">
                    {compressionResult.dimensions.width}×{compressionResult.dimensions.height}
                  </Badge>
                  <Button
                    variant=\"ghost\"
                    size=\"sm\"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                <div className=\"text-sm text-muted-foreground\">
                  <div>Format: {compressionResult.format.toUpperCase()}</div>
                  <div>Quality: {compressionResult.quality}%</div>
                  <div>Size: {formatBytes(compressionResult.compressedSize)}</div>
                </div>
                {showPreview && (
                  <div className=\"relative bg-muted/20 rounded-lg overflow-hidden\">
                    <img
                      src={URL.createObjectURL(compressionResult.compressedBlob)}
                      alt=\"Compressed image\"
                      className=\"w-full h-auto max-h-64 object-contain\"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics */}
      {compressionResult && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <FileText className=\"h-5 w-5 mr-2\" />
              Compression Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-5 gap-4 mb-6\">
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-blue-600\">
                  {formatBytes(compressionResult.originalSize)}
                </div>
                <div className=\"text-sm text-muted-foreground\">Original Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-green-600\">
                  {formatBytes(compressionResult.compressedSize)}
                </div>
                <div className=\"text-sm text-muted-foreground\">Compressed Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-purple-600\">
                  {(100 - compressionResult.compressionRatio).toFixed(1)}%
                </div>
                <div className=\"text-sm text-muted-foreground\">Space Saved</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-orange-600\">
                  {compressionResult.compressionRatio.toFixed(1)}%
                </div>
                <div className=\"text-sm text-muted-foreground\">Compression Ratio</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-pink-600\">
                  {compressionResult.processingTime}ms
                </div>
                <div className=\"text-sm text-muted-foreground\">Processing Time</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className=\"space-y-2\">
              <div className=\"flex justify-between text-sm\">
                <span>Compression Efficiency</span>
                <span>{(100 - compressionResult.compressionRatio).toFixed(1)}% saved</span>
              </div>
              <Progress
                value={100 - compressionResult.compressionRatio}
                className=\"h-2\"
              />
            </div>

            {/* Additional Info */}
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-4 border-t\">
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {compressionResult.format.toUpperCase()}
                </div>
                <div className=\"text-xs text-muted-foreground\">Output Format</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {compressionResult.quality}%
                </div>
                <div className=\"text-xs text-muted-foreground\">Quality Setting</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {compressionResult.dimensions.width}×{compressionResult.dimensions.height}
                </div>
                <div className=\"text-xs text-muted-foreground\">Dimensions</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {(compressionResult.originalSize / compressionResult.compressedSize).toFixed(1)}x
                </div>
                <div className=\"text-xs text-muted-foreground\">Size Reduction</div>
              </div>
            </div>

            {/* Format Benefits */}
            <Alert className=\"mt-4\">
              <AlertTriangle className=\"h-4 w-4\" />
              <AlertDescription>
                <strong>Format Benefits:</strong>
                <ul className=\"list-disc list-inside mt-2 text-sm\">
                  <li><strong>JPEG:</strong> Best for photographs, small file sizes</li>
                  <li><strong>PNG:</strong> Best for graphics with transparency, lossless</li>
                  <li><strong>WebP:</strong> Modern format, excellent compression, broad browser support</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className=\"hidden\" />
    </div>
  );
}
