"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Monitor,
  Window,
  Camera,
  Download,
  RefreshCw,
  Clock,
  Save,
  Crop,
  Edit3,
  Maximize2,
  Grid3X3,
  MousePointer,
  Square,
  Circle,
  Type,
  Palette,
} from "lucide-react";
import { useCanvasOperations } from "@/lib/image/canvas-operations";
import { useFormatConverter } from "@/lib/image/format-converters";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";
import type { ScreenshotOptions, Annotation } from "@/types/image";

interface ScreenshotToolProps {
  onCaptureComplete?: (screenshot: File) => void;
  outputFormat?: "png" | "jpeg" | "webp";
  enableAnnotations?: boolean;
}

interface AnnotationTool {
  type: "rectangle" | "circle" | "arrow" | "text" | "blur";
  icon: React.ReactNode;
  label: string;
}

export const ScreenshotTool: React.FC<ScreenshotToolProps> = ({
  onCaptureComplete,
  outputFormat = "png",
  enableAnnotations = true,
}) => {
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captureMode, setCaptureMode] = useState<"screen" | "window" | "tab">("screen");
  const [autoSave, setAutoSave] = useState(false);
  const [copyToClipboard, setCopyToClipboard] = useState(true);

  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("rectangle");
  const [annotationColor, setAnnotationColor] = useState("#ff0000");
  const [annotationSize, setAnnotationSize] = useState(3);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationStart, setAnnotationStart] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canvasOps = useCanvasOperations();
  const formatConverter = useFormatConverter();
  const { startMonitoring, endMonitoring, getMetrics } = usePerformanceMonitor();

  const annotationTools: AnnotationTool[] = [
    { type: "rectangle", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
    { type: "circle", icon: <Circle className="h-4 w-4" />, label: "Circle" },
    { type: "arrow", icon: <MousePointer className="h-4 w-4" />, label: "Arrow" },
    { type: "text", icon: <Type className="h-4 w-4" />, label: "Text" },
    { type: "blur", icon: <Grid3X3 className="h-4 w-4" />, label: "Blur" },
  ];

  const addLogEntry = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLog((prev) => `[${timestamp}] ${message}`);
  }, []);

  const startCapture = useCallback(
    async (delaySeconds: number = 0) => {
      try {
        setError(null);
        setIsCapturing(true);

        if (delaySeconds > 0) {
          setCountdown(delaySeconds);
          for (let i = delaySeconds; i > 0; i--) {
            setCountdown(i);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          setCountdown(null);
        }

        startMonitoring("screenshot-capture");

        let captureOptions: DisplayMediaStreamOptions = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
            displaySurface:
              captureMode === "window" ? "window" : captureMode === "tab" ? "browser" : "monitor",
          },
          audio: false,
          preferCurrentTab: captureMode === "tab",
        };

        const stream = await navigator.mediaDevices.getDisplayMedia(captureOptions);
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          throw new Error("Video element not available");
        }

        video.srcObject = stream;
        await video.play();

        // Capture frame
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error("Canvas element not available");
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not get canvas context");
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Stop the stream
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        video.srcObject = null;

        // Convert to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to create blob"));
              }
            },
            `image/${outputFormat}`,
            outputFormat === "jpeg" ? 0.9 : 1.0,
          );
        });

        const file = new File([blob], `screenshot_${Date.now()}.${outputFormat}`, {
          type: `image/${outputFormat}`,
          lastModified: Date.now(),
        });

        const url = URL.createObjectURL(file);

        setScreenshots((prev) => [file, ...prev]);
        setScreenshotUrls((prev) => [url, ...prev]);
        setCurrentScreenshotIndex(0);
        setAnnotations([]);

        const metrics = getMetrics();
        addLogEntry(
          `Screenshot captured: ${canvas.width}×${canvas.height}px (${metrics.executionTime.toFixed(2)}ms)`,
        );

        if (copyToClipboard) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                [`image/${outputFormat}`]: blob,
              }),
            ]);
            addLogEntry("Screenshot copied to clipboard");
          } catch (clipboardError) {
            addLogEntry("Could not copy to clipboard (browser may not support this feature)");
          }
        }

        if (autoSave) {
          downloadScreenshot(file);
          addLogEntry("Screenshot auto-saved");
        }

        if (onCaptureComplete) {
          onCaptureComplete(file);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to capture screenshot";
        setError(errorMessage);
        addLogEntry(`Capture error: ${errorMessage}`);
      } finally {
        endMonitoring();
        setIsCapturing(false);
      }
    },
    [
      captureMode,
      outputFormat,
      copyToClipboard,
      autoSave,
      startMonitoring,
      endMonitoring,
      getMetrics,
      addLogEntry,
      onCaptureComplete,
    ],
  );

  const startAnnotation = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enableAnnotations || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsAnnotating(true);
      setAnnotationStart({ x, y });

      if (selectedTool === "text") {
        const text = prompt("Enter annotation text:");
        if (text && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.font = `${annotationSize * 4}px Arial`;
            ctx.fillStyle = annotationColor;
            ctx.fillText(text, x, y);

            setAnnotations((prev) => [
              ...prev,
              {
                type: "text",
                x,
                y,
                text,
                color: annotationColor,
                size: annotationSize * 4,
                timestamp: new Date(),
              },
            ]);
          }
        }
        setIsAnnotating(false);
        setAnnotationStart(null);
      }
    },
    [enableAnnotations, selectedTool, annotationColor, annotationSize],
  );

  const updateAnnotation = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isAnnotating || !annotationStart || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Redraw current screenshot
      const currentScreenshot = screenshots[currentScreenshotIndex];
      if (currentScreenshot && screenshotUrls[currentScreenshotIndex]) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Redraw existing annotations
          annotations.forEach((annotation) => {
            drawAnnotation(ctx, annotation);
          });

          // Draw current annotation preview
          ctx.strokeStyle = annotationColor;
          ctx.lineWidth = annotationSize;

          switch (selectedTool) {
            case "rectangle":
              ctx.strokeRect(
                annotationStart.x,
                annotationStart.y,
                currentX - annotationStart.x,
                currentY - annotationStart.y,
              );
              break;
            case "circle":
              const radius = Math.sqrt(
                Math.pow(currentX - annotationStart.x, 2) +
                  Math.pow(currentY - annotationStart.y, 2),
              );
              ctx.beginPath();
              ctx.arc(annotationStart.x, annotationStart.y, radius, 0, 2 * Math.PI);
              ctx.stroke();
              break;
          }
        };
        img.src = screenshotUrls[currentScreenshotIndex];
      }
    },
    [
      isAnnotating,
      annotationStart,
      selectedTool,
      annotationColor,
      annotationSize,
      annotations,
      screenshots,
      screenshotUrls,
      currentScreenshotIndex,
    ],
  );

  const finishAnnotation = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isAnnotating || !annotationStart || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;

      const annotation: Annotation = {
        type: selectedTool as Annotation["type"],
        x: annotationStart.x,
        y: annotationStart.y,
        endX,
        endY,
        color: annotationColor,
        size: annotationSize,
        timestamp: new Date(),
      };

      setAnnotations((prev) => [...prev, annotation]);
      setIsAnnotating(false);
      setAnnotationStart(null);

      addLogEntry(`Added ${selectedTool} annotation`);
    },
    [isAnnotating, annotationStart, selectedTool, annotationColor, annotationSize, addLogEntry],
  );

  const drawAnnotation = useCallback((ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.size;
    ctx.fillStyle = annotation.color;

    switch (annotation.type) {
      case "rectangle":
        if (annotation.endX && annotation.endY) {
          ctx.strokeRect(
            annotation.x,
            annotation.y,
            annotation.endX - annotation.x,
            annotation.endY - annotation.y,
          );
        }
        break;
      case "circle":
        if (annotation.endX && annotation.endY) {
          const radius = Math.sqrt(
            Math.pow(annotation.endX - annotation.x, 2) +
              Math.pow(annotation.endY - annotation.y, 2),
          );
          ctx.beginPath();
          ctx.arc(annotation.x, annotation.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      case "arrow":
        if (annotation.endX && annotation.endY) {
          // Draw line
          ctx.beginPath();
          ctx.moveTo(annotation.x, annotation.y);
          ctx.lineTo(annotation.endX, annotation.endY);
          ctx.stroke();

          // Draw arrowhead
          const angle = Math.atan2(annotation.endY - annotation.y, annotation.endX - annotation.x);
          const headLength = 15;
          ctx.beginPath();
          ctx.moveTo(annotation.endX, annotation.endY);
          ctx.lineTo(
            annotation.endX - headLength * Math.cos(angle - Math.PI / 6),
            annotation.endY - headLength * Math.sin(angle - Math.PI / 6),
          );
          ctx.moveTo(annotation.endX, annotation.endY);
          ctx.lineTo(
            annotation.endX - headLength * Math.cos(angle + Math.PI / 6),
            annotation.endY - headLength * Math.sin(angle + Math.PI / 6),
          );
          ctx.stroke();
        }
        break;
      case "text":
        ctx.font = `${annotation.size}px Arial`;
        ctx.fillText(annotation.text || "", annotation.x, annotation.y);
        break;
    }
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);

    // Redraw canvas without annotations
    if (canvasRef.current && screenshotUrls[currentScreenshotIndex]) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = screenshotUrls[currentScreenshotIndex];
      }
    }

    addLogEntry("Annotations cleared");
  }, [screenshotUrls, currentScreenshotIndex, addLogEntry]);

  const downloadScreenshot = useCallback(
    (file?: File) => {
      const screenshot = file || screenshots[currentScreenshotIndex];
      if (!screenshot) return;

      const url = URL.createObjectURL(screenshot);
      const a = document.createElement("a");
      a.href = url;
      a.download = screenshot.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLogEntry(`Downloaded: ${screenshot.name}`);
    },
    [screenshots, currentScreenshotIndex, addLogEntry],
  );

  const deleteScreenshot = useCallback(
    (index: number) => {
      URL.revokeObjectURL(screenshotUrls[index]);

      setScreenshots((prev) => prev.filter((_, i) => i !== index));
      setScreenshotUrls((prev) => prev.filter((_, i) => i !== index));

      if (currentScreenshotIndex >= screenshots.length - 1) {
        setCurrentScreenshotIndex(Math.max(0, screenshots.length - 2));
      }

      addLogEntry(`Screenshot ${index + 1} deleted`);
    },
    [screenshotUrls, screenshots.length, currentScreenshotIndex, addLogEntry],
  );

  useEffect(() => {
    return () => {
      // Cleanup streams and URLs
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      screenshotUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [screenshotUrls]);

  useEffect(() => {
    // Redraw canvas when annotations or current screenshot changes
    if (canvasRef.current && screenshotUrls[currentScreenshotIndex]) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Draw annotations
          annotations.forEach((annotation) => {
            drawAnnotation(ctx, annotation);
          });
        };
        img.src = screenshotUrls[currentScreenshotIndex];
      }
    }
  }, [screenshotUrls, currentScreenshotIndex, annotations, drawAnnotation]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Screenshot Tool
          </CardTitle>
          <CardDescription>
            Capture screenshots from your screen, windows, or browser tabs with annotation support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Capture Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Capture Settings */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Capture Mode</Label>
                  <Select value={captureMode} onValueChange={(value: any) => setCaptureMode(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screen">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Entire Screen
                        </div>
                      </SelectItem>
                      <SelectItem value="window">
                        <div className="flex items-center gap-2">
                          <Window className="h-4 w-4" />
                          Application Window
                        </div>
                      </SelectItem>
                      <SelectItem value="tab">
                        <div className="flex items-center gap-2">
                          <Maximize2 className="h-4 w-4" />
                          Browser Tab
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Output Format</Label>
                  <Select value={outputFormat} onValueChange={(value: any) => {}} disabled>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG (Lossless)</SelectItem>
                      <SelectItem value="jpeg">JPEG (Compressed)</SelectItem>
                      <SelectItem value="webp">WebP (Modern)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Auto-save</Label>
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Copy to Clipboard</Label>
                    <Switch checked={copyToClipboard} onCheckedChange={setCopyToClipboard} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => startCapture(0)} disabled={isCapturing} variant="default">
                    <Camera className="h-4 w-4 mr-2" />
                    Now
                  </Button>
                  <Button onClick={() => startCapture(3)} disabled={isCapturing} variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    3s
                  </Button>
                  <Button onClick={() => startCapture(10)} disabled={isCapturing} variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    10s
                  </Button>
                </div>

                {countdown && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{countdown}</div>
                    <div className="text-sm text-blue-500">Capturing in {countdown} seconds...</div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <div className="text-sm font-medium">Statistics</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Total Screenshots</div>
                    <div className="text-2xl font-bold text-gray-900">{screenshots.length}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Annotations</div>
                    <div className="text-2xl font-bold text-gray-900">{annotations.length}</div>
                  </div>
                </div>

                {screenshots.length > 0 && (
                  <div className="space-y-2">
                    <Button onClick={() => downloadScreenshot()} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Current
                    </Button>
                    <Button
                      onClick={() => {
                        screenshots.forEach((screenshot, index) => {
                          setTimeout(() => downloadScreenshot(screenshot), index * 100);
                        });
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isCapturing && (
              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-blue-600">Capturing screenshot...</span>
              </div>
            )}

            {/* Screenshot Display and Annotation */}
            {screenshotUrls.length > 0 && (
              <Tabs defaultValue="view" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="view">View & Edit</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                  <TabsTrigger value="annotations">Annotations</TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Screenshot {currentScreenshotIndex + 1} of {screenshots.length}
                      </Label>
                      <div className="flex items-center gap-2">
                        {screenshots[currentScreenshotIndex] && (
                          <Badge variant="outline">
                            {(screenshots[currentScreenshotIndex].size / 1024).toFixed(1)}KB
                          </Badge>
                        )}
                      </div>
                    </div>

                    {enableAnnotations && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Label className="text-sm font-medium">Tools:</Label>
                        {annotationTools.map((tool) => (
                          <Button
                            key={tool.type}
                            size="sm"
                            variant={selectedTool === tool.type ? "default" : "outline"}
                            onClick={() => setSelectedTool(tool.type)}
                            className="flex items-center gap-1"
                          >
                            {tool.icon}
                            <span className="text-xs">{tool.label}</span>
                          </Button>
                        ))}

                        <div className="flex items-center gap-2 ml-4">
                          <Label className="text-xs">Color:</Label>
                          <input
                            type="color"
                            value={annotationColor}
                            onChange={(e) => setAnnotationColor(e.target.value)}
                            className="w-6 h-6 border rounded"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Size:</Label>
                          <Slider
                            value={[annotationSize]}
                            onValueChange={(value) => setAnnotationSize(value[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="w-20"
                          />
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearAnnotations}
                          disabled={annotations.length === 0}
                        >
                          Clear
                        </Button>
                      </div>
                    )}

                    <div className="border rounded-lg overflow-hidden bg-gray-100">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-auto cursor-crosshair"
                        onMouseDown={startAnnotation}
                        onMouseMove={updateAnnotation}
                        onMouseUp={finishAnnotation}
                        onMouseLeave={() => {
                          if (isAnnotating) {
                            setIsAnnotating(false);
                            setAnnotationStart(null);
                          }
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="gallery" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {screenshotUrls.map((url, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                          index === currentScreenshotIndex
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setCurrentScreenshotIndex(index)}
                      >
                        <img
                          src={url}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        <div className="p-2">
                          <div className="text-xs text-gray-600">Screenshot {index + 1}</div>
                          <div className="text-xs text-gray-400">
                            {screenshots[index]
                              ? `${(screenshots[index].size / 1024).toFixed(1)}KB`
                              : ""}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadScreenshot(screenshots[index]);
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteScreenshot(index);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="annotations" className="space-y-4">
                  {annotations.length > 0 ? (
                    <div className="space-y-2">
                      {annotations.map((annotation, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: annotation.color }}
                            />
                            <span className="text-sm capitalize">{annotation.type}</span>
                            <span className="text-xs text-gray-500">
                              at ({Math.round(annotation.x)}, {Math.round(annotation.y)})
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setAnnotations((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button onClick={clearAnnotations} variant="outline" className="w-full">
                        Clear All Annotations
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Edit3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No annotations yet</p>
                      <p className="text-sm">Select a tool and start drawing on the screenshot</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Hidden elements */}
            <video ref={videoRef} className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Processing Log */}
            {processingLog.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Processing Log</Label>
                <div className="mt-1 text-xs font-mono bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                  {processingLog.slice(-5).join("\n")}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
