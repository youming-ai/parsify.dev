"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { usePerformanceMonitoring, useConstitutionalValidator } from "@/hooks";
import { useCanvasOperations } from "@/lib/image/canvas-operations";
import { ToolWrapper } from "@/components/tools/tool-wrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Download, RotateCw, Move, Square, Maximize2 } from "lucide-react";

// Types
export interface CropResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  x: number;
  y: number;
  originalName: string;
}

export interface CropPreset {
  name: string;
  aspectRatio: number;
  icon?: React.ReactNode;
}

interface ImageCropperProps {
  onComplete?: (result: CropResult) => void;
}

// Aspect ratio presets
const ASPECT_RATIO_PRESETS: CropPreset[] = [
  { name: "Free", aspectRatio: 0 },
  { name: "1:1", aspectRatio: 1 },
  { name: "4:3", aspectRatio: 4 / 3 },
  { name: "16:9", aspectRatio: 16 / 9 },
  { name: "3:2", aspectRatio: 3 / 2 },
  { name: "2:1", aspectRatio: 2 },
  { name: "9:16", aspectRatio: 9 / 16 },
  { name: "3:4", aspectRatio: 3 / 4 },
];

export const ImageCropper: React.FC<ImageCropperProps> = ({ onComplete }) => {
  const { capturePerformance } = usePerformanceMonitoring();
  const { validateProcessing, getComplianceStatus } = useConstitutionalValidator();
  const { cropImage } = useCanvasOperations();

  // State
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File>();
  const [cropMode, setCropMode] = useState<"manual" | "preset">("manual");
  const [selectedPreset, setSelectedPreset] = useState<CropPreset>(ASPECT_RATIO_PRESETS[0]);
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);

  // Refs
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse image size and reset crop area
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageSize({ width: naturalWidth, height: naturalHeight });

      // Initialize crop area to center 80% of image
      const initialSize = Math.min(naturalWidth, naturalHeight) * 0.8;
      setCropArea({
        x: (naturalWidth - initialSize) / 2,
        y: (naturalHeight - initialSize) / 2,
        width: initialSize,
        height: initialSize,
      });
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        // Validate constitutional compliance
        const complianceCheck = await validateProcessing(file);
        if (!complianceCheck.isCompliant) {
          throw new Error(complianceCheck.reason || "Image does not meet processing requirements");
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          setImageUrl(url);
          setRotation(0);
          setZoom(1);
          setPreviewUrl("");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error loading image:", error);
        // Handle error with user notification
      }
    },
    [validateProcessing],
  );

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle crop area adjustment
  const handleCropAreaChange = useCallback(
    (field: keyof typeof cropArea, value: number) => {
      setCropArea((prev) => {
        const updated = { ...prev, [field]: value };

        // Constrain to image boundaries
        updated.x = Math.max(0, Math.min(updated.x, imageSize.width - updated.width));
        updated.y = Math.max(0, Math.min(updated.y, imageSize.height - updated.height));
        updated.width = Math.min(updated.width, imageSize.width - updated.x);
        updated.height = Math.min(updated.height, imageSize.height - updated.y);

        // Apply aspect ratio constraint if in preset mode
        if (cropMode === "preset" && selectedPreset.aspectRatio > 0) {
          updated.height = updated.width / selectedPreset.aspectRatio;
        }

        return updated;
      });
    },
    [imageSize, cropMode, selectedPreset],
  );

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (preset: CropPreset) => {
      setSelectedPreset(preset);
      if (preset.aspectRatio > 0 && imageSize.width > 0) {
        // Calculate crop area to fit aspect ratio
        const imageRatio = imageSize.width / imageSize.height;
        let newWidth, newHeight;

        if (preset.aspectRatio > imageRatio) {
          // Width limited by image width
          newWidth = imageSize.width * 0.8;
          newHeight = newWidth / preset.aspectRatio;
        } else {
          // Height limited by image height
          newHeight = imageSize.height * 0.8;
          newWidth = newHeight * preset.aspectRatio;
        }

        setCropArea({
          x: (imageSize.width - newWidth) / 2,
          y: (imageSize.height - newHeight) / 2,
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [imageSize],
  );

  // Handle rotation
  const handleRotate = useCallback(
    (angle: number) => {
      const newRotation = (rotation + angle) % 360;
      setRotation(newRotation);

      // Adjust crop area for rotation
      if (imageSize.width > 0 && imageSize.height > 0) {
        const isRotated90 = Math.abs((newRotation % 180) - 90) < 1;
        if (isRotated90) {
          const { width, height } = imageSize;
          setImageSize({ width: height, height: width });

          // Swap and center crop area
          setCropArea((prev) => ({
            x: (height - prev.height) / 2,
            y: (width - prev.width) / 2,
            width: prev.height,
            height: prev.width,
          }));
        }
      }
    },
    [rotation, imageSize],
  );

  // Handle zoom
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(0.1, Math.min(3, newZoom)));
  }, []);

  // Mouse event handlers for crop area manipulation
  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setIsDragging(true);
      setDragHandle(handle || "move");
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;

      if (dragHandle === "move") {
        // Move entire crop area
        handleCropAreaChange("x", cropArea.x + deltaX);
        handleCropAreaChange("y", cropArea.y + deltaY);
      } else if (dragHandle) {
        // Resize crop area
        const newArea = { ...cropArea };

        switch (dragHandle) {
          case "nw":
            newArea.x += deltaX;
            newArea.y += deltaY;
            newArea.width -= deltaX;
            newArea.height -= deltaY;
            break;
          case "ne":
            newArea.y += deltaY;
            newArea.width += deltaX;
            newArea.height -= deltaY;
            break;
          case "sw":
            newArea.x += deltaX;
            newArea.width -= deltaX;
            newArea.height += deltaY;
            break;
          case "se":
            newArea.width += deltaX;
            newArea.height += deltaY;
            break;
        }

        // Apply constraints
        if (newArea.width > 20 && newArea.height > 20) {
          setCropArea(newArea);
        }
      }

      setDragStart({ x: currentX, y: currentY });
    },
    [isDragging, dragHandle, dragStart, cropArea, handleCropAreaChange],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (!imageFile || !imageRef.current) return;

    setIsProcessing(true);

    const startTime = performance.now();

    try {
      const result = await capturePerformance("crop-preview", async () => {
        return await cropImage(imageFile, {
          x: cropArea.x,
          y: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
          rotation,
          quality: 0.9,
        });
      });

      if (result) {
        setPreviewUrl(result.dataUrl);
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, cropArea, rotation, capturePerformance, cropImage]);

  // Apply crop
  const handleCrop = useCallback(async () => {
    if (!imageFile) return;

    setIsProcessing(true);

    const startTime = performance.now();

    try {
      const result = await capturePerformance("image-crop", async () => {
        return await cropImage(imageFile, {
          x: cropArea.x,
          y: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
          rotation,
          quality: 0.95,
        });
      });

      if (result) {
        const cropResult: CropResult = {
          file: result.file,
          dataUrl: result.dataUrl,
          width: cropArea.width,
          height: cropArea.height,
          x: cropArea.x,
          y: cropArea.y,
          originalName: imageFile.name,
        };

        setPreviewUrl(result.dataUrl);
        onComplete?.(cropResult);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, cropArea, rotation, capturePerformance, cropImage, onComplete]);

  // Calculate crop area percentage for display
  const cropPercentage = useMemo(() => {
    if (imageSize.width === 0 || imageSize.height === 0) return 0;
    return ((cropArea.width * cropArea.height) / (imageSize.width * imageSize.height)) * 100;
  }, [cropArea, imageSize]);

  // Calculate scaled crop area for display
  const displayCropArea = useMemo(() => {
    if (!containerRef.current || imageSize.width === 0) return cropArea;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    const scale = Math.min(scaleX, scaleY);

    return {
      x: cropArea.x * scale,
      y: cropArea.y * scale,
      width: cropArea.width * scale,
      height: cropArea.height * scale,
    };
  }, [cropArea, imageSize]);

  return (
    <ToolWrapper
      title="Image Cropper"
      description="Crop images with precise control, aspect ratios, and rotation"
      icon={<Square className="h-5 w-5" />}
      status={getComplianceStatus()}
    >
      <div className="space-y-6">
        {/* File Input */}
        {!imageUrl && (
          <Card
            className="p-8 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <Square className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Drop an image here or click to select
              </h3>
              <p className="mt-1 text-xs text-gray-500">Supports PNG, JPEG, WebP, BMP up to 10MB</p>
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
            <Tabs
              value={cropMode}
              onValueChange={(value) => setCropMode(value as "manual" | "preset")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="preset">Aspect Ratio</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="crop-x">X Position</Label>
                    <Input
                      id="crop-x"
                      type="number"
                      value={Math.round(cropArea.x)}
                      onChange={(e) => handleCropAreaChange("x", Number(e.target.value))}
                      min={0}
                      max={imageSize.width - cropArea.width}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop-y">Y Position</Label>
                    <Input
                      id="crop-y"
                      type="number"
                      value={Math.round(cropArea.y)}
                      onChange={(e) => handleCropAreaChange("y", Number(e.target.value))}
                      min={0}
                      max={imageSize.height - cropArea.height}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop-width">Width</Label>
                    <Input
                      id="crop-width"
                      type="number"
                      value={Math.round(cropArea.width)}
                      onChange={(e) => handleCropAreaChange("width", Number(e.target.value))}
                      min={20}
                      max={imageSize.width - cropArea.x}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop-height">Height</Label>
                    <Input
                      id="crop-height"
                      type="number"
                      value={Math.round(cropArea.height)}
                      onChange={(e) => handleCropAreaChange("height", Number(e.target.value))}
                      min={20}
                      max={imageSize.height - cropArea.y}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preset" className="space-y-4">
                <div>
                  <Label>Aspect Ratio</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {ASPECT_RATIO_PRESETS.map((preset) => (
                      <Button
                        key={preset.name}
                        variant={selectedPreset.name === preset.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect(preset)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Transform Controls */}
            <div className="space-y-4">
              <div>
                <Label>Rotation: {rotation}°</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => handleRotate(-90)}>
                    <RotateCw className="h-4 w-4 rotate-180" />
                  </Button>
                  <Slider
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                    max={360}
                    step={1}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => handleRotate(90)}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Zoom: {Math.round(zoom * 100)}%</Label>
                <Slider
                  value={[zoom]}
                  onValueChange={(value) => handleZoomChange(value[0])}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Image Editor */}
            <div className="relative border rounded-lg overflow-hidden bg-gray-100">
              <div
                ref={containerRef}
                className="relative overflow-hidden"
                style={{ height: "400px" }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Source"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                  }}
                  onLoad={handleImageLoad}
                  draggable={false}
                />

                {/* Crop Area Overlay */}
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10"
                  style={{
                    left: `${displayCropArea.x}px`,
                    top: `${displayCropArea.y}px`,
                    width: `${displayCropArea.width}px`,
                    height: `${displayCropArea.height}px`,
                    cursor: isDragging && dragHandle === "move" ? "grabbing" : "grab",
                  }}
                  onMouseDown={(e) => handleMouseDown(e, "move")}
                >
                  {/* Resize Handles */}
                  <div
                    className="absolute w-3 h-3 bg-blue-500 border border-white -top-1 -left-1 cursor-nw-resize"
                    onMouseDown={(e) => handleMouseDown(e, "nw")}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 border border-white -top-1 -right-1 cursor-ne-resize"
                    onMouseDown={(e) => handleMouseDown(e, "ne")}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 border border-white -bottom-1 -left-1 cursor-sw-resize"
                    onMouseDown={(e) => handleMouseDown(e, "sw")}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 border border-white -bottom-1 -right-1 cursor-se-resize"
                    onMouseDown={(e) => handleMouseDown(e, "se")}
                  />
                </div>
              </div>
            </div>

            {/* Crop Information */}
            <div className="text-sm text-gray-600">
              <p>
                Crop Area: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} pixels
              </p>
              <p>
                Position: ({Math.round(cropArea.x)}, {Math.round(cropArea.y)})
              </p>
              <p>Coverage: {cropPercentage.toFixed(1)}% of original image</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button onClick={generatePreview} disabled={isProcessing || !imageFile}>
                {isProcessing ? "Processing..." : "Preview"}
              </Button>
              <Button onClick={handleCrop} disabled={isProcessing || !imageFile}>
                <Download className="mr-2 h-4 w-4" />
                Crop Image
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImageUrl("");
                  setImageFile(undefined);
                  setPreviewUrl("");
                  setRotation(0);
                  setZoom(1);
                }}
              >
                Reset
              </Button>
            </div>

            {/* Preview */}
            {previewUrl && (
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-2">Preview</h3>
                <img
                  src={previewUrl}
                  alt="Cropped preview"
                  className="w-full max-w-sm mx-auto border rounded"
                />
              </Card>
            )}
          </>
        )}
      </div>
    </ToolWrapper>
  );
};
