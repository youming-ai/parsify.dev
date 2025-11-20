"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Upload,
  Download,
  RefreshCw,
  QrCode,
  CameraOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useQRScanner } from "@/lib/image/qr-scanner";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";
import type { QRScanResult } from "@/types/image";

interface QRCodeReaderProps {
  onScanComplete?: (result: QRScanResult) => void;
  supportedFormats?: string[];
}

interface ParsedResult {
  type: "url" | "email" | "phone" | "wifi" | "text" | "vcard" | "sms" | "geo";
  content: string;
  metadata?: Record<string, any>;
  displayContent: string;
  actions?: Array<{
    label: string;
    action: () => void;
    icon?: React.ReactNode;
  }>;
}

export const QRCodeReader: React.FC<QRCodeReaderProps> = ({
  onScanComplete,
  supportedFormats = ["image/png", "image/jpeg", "image/webp"],
}) => {
  const [scanResults, setScanResults] = useState<QRScanResult[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const qrScanner = useQRScanner({
    preferBuiltinDecoder: true,
    highlightScanRegion: true,
    highlightCodeOutline: true,
  });
  const { startMonitoring, endMonitoring, getMetrics } = usePerformanceMonitor();

  const addLogEntry = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLog((prev) => `[${timestamp}] ${message}`);
  }, []);

  const parseQRContent = useCallback((content: string): ParsedResult => {
    // URL detection
    if (content.match(/^https?:\/\//)) {
      return {
        type: "url",
        content,
        displayContent: content,
        actions: [
          {
            label: "Open URL",
            action: () => window.open(content, "_blank"),
            icon: <ExternalLink className="h-4 w-4" />,
          },
          {
            label: "Copy URL",
            action: () => navigator.clipboard.writeText(content),
            icon: <Copy className="h-4 w-4" />,
          },
        ],
      };
    }

    // Email detection
    const emailMatch = content.match(/^mailto:([^\s]+)$/i);
    if (emailMatch) {
      return {
        type: "email",
        content,
        displayContent: emailMatch[1],
        actions: [
          {
            label: "Send Email",
            action: () => window.open(content, "_blank"),
            icon: <ExternalLink className="h-4 w-4" />,
          },
        ],
      };
    }

    // Phone detection
    const phoneMatch = content.match(/^tel:([^\s]+)$/i);
    if (phoneMatch) {
      return {
        type: "phone",
        content,
        displayContent: phoneMatch[1],
        actions: [
          {
            label: "Call",
            action: () => window.open(content, "_blank"),
            icon: <ExternalLink className="h-4 w-4" />,
          },
        ],
      };
    }

    // WiFi detection
    const wifiMatch = content.match(
      /^WIFI:T:(WEP|WPA|nopass);S:([^;]*);P:([^;]*);H:(true|false);?$/i,
    );
    if (wifiMatch) {
      return {
        type: "wifi",
        content,
        displayContent: `WiFi: ${wifiMatch[2]}`,
        metadata: {
          authentication: wifiMatch[1],
          ssid: wifiMatch[2],
          password: wifiMatch[3],
          hidden: wifiMatch[4] === "true",
        },
      };
    }

    // SMS detection
    const smsMatch = content.match(/^sms:([^\?]+)(?:\?body=([^\s]*))?$/i);
    if (smsMatch) {
      const body = smsMatch[2] ? decodeURIComponent(smsMatch[2]) : "";
      return {
        type: "sms",
        content,
        displayContent: `SMS to ${smsMatch[1]}${body ? ": " + body : ""}`,
        metadata: {
          phone: smsMatch[1],
          body,
        },
      };
    }

    // Geo location detection
    const geoMatch = content.match(/^geo:(-?\d+\.?\d*),(-?\d+\.?\d*)$/i);
    if (geoMatch) {
      return {
        type: "geo",
        content,
        displayContent: `Location: ${geoMatch[1]}, ${geoMatch[2]}`,
        metadata: {
          lat: parseFloat(geoMatch[1]),
          lng: parseFloat(geoMatch[2]),
        },
        actions: [
          {
            label: "View on Map",
            action: () =>
              window.open(`https://maps.google.com/?q=${geoMatch[1]},${geoMatch[2]}`, "_blank"),
            icon: <ExternalLink className="h-4 w-4" />,
          },
        ],
      };
    }

    // vCard detection (simplified)
    if (content.includes("BEGIN:VCARD") && content.includes("END:VCARD")) {
      return {
        type: "vcard",
        content,
        displayContent: "Contact Card",
        metadata: { type: "vcard" },
      };
    }

    // Default to text
    return {
      type: "text",
      content,
      displayContent: content,
      actions: [
        {
          label: "Copy Text",
          action: () => navigator.clipboard.writeText(content),
          icon: <Copy className="h-4 w-4" />,
        },
      ],
    };
  }, []);

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const validFiles = Array.from(files).filter((file) => {
        if (!supportedFormats.includes(file.type)) {
          setError(`Unsupported file type: ${file.type}`);
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setError(null);
      addLogEntry(`Loaded ${validFiles.length} image(s) for QR scanning`);

      // Create preview URLs
      const previewUrls = validFiles.map((file) => URL.createObjectURL(file));
      setImageFiles(validFiles);
      setImagePreviewUrls(previewUrls);
      setScanResults([]);
      setCurrentImageIndex(0);
    },
    [supportedFormats, addLogEntry],
  );

  const scanImages = useCallback(async () => {
    if (imageFiles.length === 0) return;

    setIsScanning(true);
    startMonitoring("qr-scan-batch");
    setProgress(0);

    try {
      const results: QRScanResult[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        addLogEntry(`Scanning image ${i + 1}/${imageFiles.length}: ${imageFiles[i].name}`);
        setProgress((i / imageFiles.length) * 100);

        const result = await qrScanner.scanImage(imageFiles[i]);

        if (result.success && result.data) {
          results.push({
            ...result,
            fileName: imageFiles[i].name,
            fileSize: imageFiles[i].size,
            timestamp: new Date(),
            parsed: parseQRContent(result.data),
          });
          addLogEntry(`✓ QR code found in ${imageFiles[i].name}`);
        } else {
          results.push({
            ...result,
            fileName: imageFiles[i].name,
            fileSize: imageFiles[i].size,
            timestamp: new Date(),
          });
          addLogEntry(`✗ No QR code found in ${imageFiles[i].name}`);
        }
      }

      setProgress(100);
      setScanResults(results);

      const successfulScans = results.filter((r) => r.success).length;
      const metrics = getMetrics();
      addLogEntry(
        `Scan complete: ${successfulScans}/${imageFiles.length} images contained QR codes (${metrics.executionTime.toFixed(2)}ms)`,
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to scan images");
      addLogEntry(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      endMonitoring();
      setIsScanning(false);
      setProgress(0);
    }
  }, [
    imageFiles,
    qrScanner,
    startMonitoring,
    endMonitoring,
    getMetrics,
    addLogEntry,
    parseQRContent,
  ]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsUsingCamera(true);
        addLogEntry("Camera started successfully");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to access camera";
      setCameraError(errorMessage);
      addLogEntry(`Camera error: ${errorMessage}`);
    }
  }, [addLogEntry]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsUsingCamera(false);
    addLogEntry("Camera stopped");
  }, [addLogEntry]);

  const captureFromCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `camera_capture_${Date.now()}.png`, { type: "image/png" });
      const previewUrl = URL.createObjectURL(file);

      setImageFiles((prev) => [...prev, file]);
      setImagePreviewUrls((prev) => [...prev, previewUrl]);
      setCurrentImageIndex(imageFiles.length);

      addLogEntry("Camera image captured successfully");
      stopCamera();
    }, "image/png");
  }, [imageFiles.length, stopCamera, addLogEntry]);

  const scanFromCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    setIsScanning(true);
    startMonitoring("qr-scan-camera");

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `camera_scan_${Date.now()}.png`, { type: "image/png" });

        addLogEntry("Scanning from camera feed...");
        const result = await qrScanner.scanImage(file);

        const scanResult: QRScanResult = {
          ...result,
          fileName: "Camera Capture",
          fileSize: file.size,
          timestamp: new Date(),
          parsed: result.success && result.data ? parseQRContent(result.data) : undefined,
        };

        setScanResults((prev) => [scanResult, ...prev]);

        if (result.success && result.data) {
          addLogEntry(`✓ QR code found in camera feed`);
        } else {
          addLogEntry(`✗ No QR code found in camera feed`);
        }

        const metrics = getMetrics();
        addLogEntry(`Camera scan complete (${metrics.executionTime.toFixed(2)}ms)`);

        if (onScanComplete) {
          onScanComplete(scanResult);
        }
      }, "image/png");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to scan from camera");
      addLogEntry(`Camera scan error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      endMonitoring();
      setIsScanning(false);
    }
  }, [
    qrScanner,
    startMonitoring,
    endMonitoring,
    getMetrics,
    addLogEntry,
    parseQRContent,
    onScanComplete,
  ]);

  const downloadResult = useCallback(
    (result: QRScanResult, index: number) => {
      if (!imagePreviewUrls[index]) return;

      const link = document.createElement("a");
      link.href = imagePreviewUrls[index];
      link.download = `qr_scan_${result.fileName || index}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addLogEntry(`Downloaded: ${result.fileName || `Image ${index}`}`);
    },
    [imagePreviewUrls, addLogEntry],
  );

  const getResultIcon = useCallback((result: QRScanResult) => {
    if (!result.success) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }

    if (!result.parsed) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }

    switch (result.parsed.type) {
      case "url":
        return <QrCode className="h-5 w-5 text-blue-500" />;
      case "email":
        return <QrCode className="h-5 w-5 text-green-500" />;
      case "phone":
        return <QrCode className="h-5 w-5 text-purple-500" />;
      case "wifi":
        return <QrCode className="h-5 w-5 text-orange-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Cleanup preview URLs
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Reader
          </CardTitle>
          <CardDescription>
            Scan QR codes from images or camera with intelligent content detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Input Methods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={supportedFormats.join(",")}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isScanning}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
                <p className="text-sm text-gray-500 mt-2">Scan from files</p>
              </div>

              {/* Camera */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {isUsingCamera ? (
                  <Button onClick={stopCamera} variant="outline" disabled={isScanning}>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                ) : (
                  <Button onClick={startCamera} variant="outline" disabled={isScanning}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                )}
                <p className="text-sm text-gray-500 mt-2">Live scanning</p>
              </div>

              {/* Batch Scan */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Button
                  onClick={scanImages}
                  disabled={imageFiles.length === 0 || isScanning}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan All ({imageFiles.length})
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">Batch process</p>
              </div>
            </div>

            {cameraError && (
              <Alert variant="destructive">
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isScanning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Scanning...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Camera View */}
            {isUsingCamera && (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={scanFromCamera} disabled={isScanning}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan QR Code
                  </Button>
                  <Button onClick={captureFromCamera} variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Image
                  </Button>
                </div>
              </div>
            )}

            {/* Results */}
            {scanResults.length > 0 && (
              <Tabs defaultValue="results" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="results">Results ({scanResults.length})</TabsTrigger>
                  <TabsTrigger value="images">Source Images ({imageFiles.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-4">
                  <div className="grid gap-4">
                    {scanResults.map((result, index) => (
                      <Card
                        key={index}
                        className={result.success ? "border-green-200" : "border-gray-200"}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getResultIcon(result)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">
                                  {result.fileName || `Scan ${index + 1}`}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {result.success ? (
                                    <Badge
                                      variant="default"
                                      className="bg-green-100 text-green-800"
                                    >
                                      Success
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">Not Found</Badge>
                                  )}
                                  {imagePreviewUrls[index] && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => downloadResult(result, index)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {result.success && result.data && (
                                <div className="space-y-2">
                                  {result.parsed && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">
                                          {result.parsed.type.toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-700 font-mono break-all">
                                        {result.parsed.displayContent}
                                      </p>

                                      {result.parsed.actions && (
                                        <div className="flex gap-2 mt-2">
                                          {result.parsed.actions.map((action, actionIndex) => (
                                            <Button
                                              key={actionIndex}
                                              size="sm"
                                              variant="outline"
                                              onClick={action.action}
                                              className="flex items-center gap-1"
                                            >
                                              {action.icon}
                                              <span className="text-xs">{action.label}</span>
                                            </Button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {result.confidence !== undefined && (
                                    <div className="text-xs text-gray-500">
                                      Confidence: {Math.round(result.confidence * 100)}%
                                    </div>
                                  )}
                                </div>
                              )}

                              {!result.success && result.error && (
                                <p className="text-sm text-red-600">{result.error}</p>
                              )}

                              <div className="text-xs text-gray-400 mt-2">
                                {result.timestamp.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                          index === currentImageIndex
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={url}
                          alt={imageFiles[index]?.name || `Image ${index}`}
                          className="w-full h-24 object-cover"
                        />
                        <div className="p-2">
                          <div className="text-xs text-gray-600 truncate">
                            {imageFiles[index]?.name || `Image ${index}`}
                          </div>
                          <div className="text-xs text-gray-400">
                            {imageFiles[index]
                              ? `${(imageFiles[index].size / 1024).toFixed(1)}KB`
                              : ""}
                          </div>
                          {scanResults[index] && (
                            <Badge
                              variant={scanResults[index].success ? "default" : "secondary"}
                              className="mt-1 text-xs"
                            >
                              {scanResults[index].success ? "QR Found" : "No QR"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* Processing Log */}
            {processingLog.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-1">Processing Log</div>
                <div className="text-xs font-mono bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                  {processingLog.slice(-3).join("\n")}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
