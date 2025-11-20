"use client";

import {
  Download,
  Eye,
  EyeOff,
  FileImage,
  Image,
  RefreshCw,
  Settings,
  Trash2,
  TrendingDown,
  Upload,
  Zap,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ImageData {
  id: string;
  file: File;
  originalUrl: string;
  compressedUrl?: string;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  width: number;
  height: number;
  format: string;
  outputFormat: string;
  quality: number;
  isProcessing: boolean;
}

export default function ImageCompressionClient() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [globalQuality, setGlobalQuality] = useState([80]);
  const [outputFormat, setOutputFormat] = useState<"original" | "jpeg" | "png" | "webp">(
    "original",
  );
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [showComparison, setShowComparison] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getImageFormat = (file: File): string => {
    return file.type.split("/")[1]?.toUpperCase() || "UNKNOWN";
  };

  const getOutputFormat = (originalFormat: string): string => {
    if (outputFormat !== "original") {
      return outputFormat.toUpperCase();
    }
    return originalFormat;
  };

  const compressImage = useCallback(
    async (file: File, quality: number, format: string): Promise<{ blob: Blob; size: number }> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = document.createElement("img");

        img.onload = () => {
          try {
            canvas.width = img.width;
            canvas.height = img.height;

            if (ctx) {
              // Clear canvas and draw image
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              // Convert to blob with specified quality and format
              const mimeType =
                format === "JPEG"
                  ? "image/jpeg"
                  : format === "PNG"
                    ? "image/png"
                    : format === "WEBP"
                      ? "image/webp"
                      : file.type;

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve({
                      blob: blob,
                      size: blob.size,
                    });
                  } else {
                    reject(new Error("Failed to create blob"));
                  }
                },
                mimeType,
                quality / 100,
              );
            }
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
      });
    },
    [],
  );

  const handleFileSelect = async (files: FileList) => {
    const newImages: ImageData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        continue;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        continue;
      }

      // Get image dimensions
      const img = document.createElement("img");
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      newImages.push({
        id: Date.now().toString() + Math.random().toString(36),
        file,
        originalUrl: URL.createObjectURL(file),
        originalSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        format: getImageFormat(file),
        outputFormat: getOutputFormat(getImageFormat(file)),
        quality: globalQuality[0],
        isProcessing: false,
      });
    }

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const compressSingleImage = async (imageId: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, isProcessing: true } : img)),
    );

    try {
      const image = images.find((img) => img.id === imageId);
      if (!image) return;

      const outputFormat = image.outputFormat === "ORIGINAL" ? image.format : image.outputFormat;
      const { blob, size } = await compressImage(image.file, image.quality, outputFormat);

      const compressionRatio =
        image.originalSize > 0 ? ((image.originalSize - size) / image.originalSize) * 100 : 0;

      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                compressedUrl: URL.createObjectURL(blob),
                compressedSize: size,
                compressionRatio,
                isProcessing: false,
              }
            : img,
        ),
      );
    } catch (error) {
      console.error("Compression failed:", error);
      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, isProcessing: false } : img)),
      );
    }
  };

  const compressAllImages = async () => {
    setIsProcessing(true);

    const compressionPromises = images
      .filter((img) => !img.compressedUrl && !img.isProcessing)
      .map((img) => compressSingleImage(img.id));

    try {
      await Promise.all(compressionPromises);
    } catch (error) {
      console.error("Batch compression failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (image: ImageData) => {
    if (!image.compressedUrl) return;

    const link = document.createElement("a");
    link.href = image.compressedUrl;
    link.download = `${image.file.name.replace(/\.[^/.]+$/, "")}_compressed.${image.outputFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = async () => {
    const compressedImages = images.filter((img) => img.compressedUrl);

    for (const image of compressedImages) {
      downloadImage(image);
      // Small delay to prevent browser blocking
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.originalUrl);
        if (image.compressedUrl) {
          URL.revokeObjectURL(image.compressedUrl);
        }
      }
      return prev.filter((img) => img.id !== imageId);
    });
  };

  const clearAllImages = () => {
    images.forEach((image) => {
      URL.revokeObjectURL(image.originalUrl);
      if (image.compressedUrl) {
        URL.revokeObjectURL(image.compressedUrl);
      }
    });
    setImages([]);
  };

  const updateImageQuality = (imageId: string, quality: number) => {
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, quality, compressedUrl: undefined } : img)),
    );
  };

  const updateImageFormat = (imageId: string, format: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, outputFormat: format, compressedUrl: undefined } : img,
      ),
    );
  };

  const getTotalSavings = () => {
    const compressedImages = images.filter((img) => img.compressedSize);
    const totalOriginal = compressedImages.reduce((sum, img) => sum + img.originalSize, 0);
    const totalCompressed = compressedImages.reduce((sum, img) => sum + img.compressedSize!, 0);
    return totalOriginal > 0 ? ((totalOriginal - totalCompressed) / totalOriginal) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compression Settings
          </CardTitle>
          <CardDescription>Configure default settings for all images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quality: {globalQuality[0]}%</label>
              <Slider
                value={globalQuality}
                onValueChange={setGlobalQuality}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Lower quality = smaller file size</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <Select value={outputFormat} onValueChange={(value: any) => setOutputFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Keep Original</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="preserve-aspect"
                  checked={preserveAspectRatio}
                  onChange={(e) => setPreserveAspectRatio(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="preserve-aspect" className="text-sm">
                  Preserve aspect ratio
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-comparison"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="show-comparison" className="text-sm">
                  Show before/after
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Drop images here or click to upload</p>
            <p className="text-sm text-muted-foreground">
              Supports JPEG, PNG, WebP, GIF, BMP (Max 50MB per file)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {images.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button onClick={compressAllImages} disabled={isProcessing}>
                <Zap className="h-4 w-4 mr-2" />
                {isProcessing ? "Processing..." : "Compress All"}
              </Button>
              <Button variant="outline" onClick={downloadAllImages}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button variant="outline" onClick={clearAllImages}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button variant="outline" onClick={() => setShowComparison(!showComparison)}>
                {showComparison ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showComparison ? "Hide" : "Show"} Comparison
              </Button>
            </div>

            {images.some((img) => img.compressedSize) && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    Total Savings: {getTotalSavings().toFixed(1)}%
                  </span>
                  <TrendingDown className="h-4 w-4 text-green-600" />
                </div>
                <Progress value={getTotalSavings()} className="mt-2 h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <Card key={image.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={
                        showComparison && image.compressedUrl
                          ? image.compressedUrl
                          : image.originalUrl
                      }
                      alt={image.file.name}
                      className="w-full h-full object-cover"
                    />
                    {image.isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium truncate">{image.file.name}</span>
                      <Badge variant="outline">{image.format}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span>Original: {formatFileSize(image.originalSize)}</span>
                      </div>
                      <div>
                        <span>
                          Size: {image.width}×{image.height}
                        </span>
                      </div>
                      {image.compressedSize && (
                        <>
                          <div className="text-green-600">
                            <span>Compressed: {formatFileSize(image.compressedSize)}</span>
                          </div>
                          <div className="text-green-600">
                            <span>Saved: {image.compressionRatio?.toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Individual Settings */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Quality: {image.quality}%</label>
                      <Slider
                        value={[image.quality]}
                        onValueChange={([value]) => updateImageQuality(image.id, value)}
                        max={100}
                        min={1}
                        step={1}
                        className="w-full h-2"
                      />
                    </div>

                    <Select
                      value={image.outputFormat}
                      onValueChange={(value) => updateImageFormat(image.id, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORIGINAL">Original</SelectItem>
                        <SelectItem value="JPEG">JPEG</SelectItem>
                        <SelectItem value="PNG">PNG</SelectItem>
                        <SelectItem value="WEBP">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => compressSingleImage(image.id)}
                      disabled={image.isProcessing}
                    >
                      {image.isProcessing ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : image.compressedUrl ? (
                        <RefreshCw className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadImage(image)}
                      disabled={!image.compressedUrl}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => removeImage(image.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Image className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No images uploaded</h3>
            <p className="text-muted-foreground mb-4">Upload images to start compressing them</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Select Images
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
