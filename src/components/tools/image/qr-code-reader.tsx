'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQRScanner } from '@/lib/image/qr-scanner';
import {
  ArrowSquareOut,
  ArrowsClockwise,
  Camera,
  CameraSlash,
  CheckCircle,
  Copy,
  DownloadSimple,
  QrCode,
  UploadSimple,
  Warning,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
// import type { QRScanResult } from "@/types/image";

// Temporary type definition
interface QRScanResult {
  success: boolean;
  data?: string;
  error?: string;
  confidence?: number;
  fileName?: string;
  fileSize?: number;
  timestamp?: Date;
  parsed?: any;
}

interface QRCodeReaderProps {
  onScanComplete?: (result: QRScanResult) => void;
  supportedFormats?: string[];
}

interface ParsedResult {
  type: 'url' | 'email' | 'phone' | 'wifi' | 'text' | 'vcard' | 'sms' | 'geo';
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
  supportedFormats = ['image/png', 'image/jpeg', 'image/webp'],
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

  const qrScanner = useQRScanner({});

  // Stub functions for missing hooks
  const startMonitoring = (_name: string) => {};
  const endMonitoring = () => {};
  const getMetrics = () => ({ executionTime: 0 });

  const addLogEntry = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLog((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const parseQRContent = useCallback((content: string): ParsedResult => {
    // URL detection
    if (content.match(/^https?:\/\//)) {
      return {
        type: 'url',
        content,
        displayContent: content,
        actions: [
          {
            label: 'Open URL',
            action: () => window.open(content, '_blank'),
            icon: <ArrowSquareOut className="h-4 w-4" />,
          },
          {
            label: 'Copy URL',
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
        type: 'email',
        content,
        displayContent: emailMatch[1],
        actions: [
          {
            label: 'Send Email',
            action: () => window.open(content, '_blank'),
            icon: <ArrowSquareOut className="h-4 w-4" />,
          },
        ],
      };
    }

    // Phone detection
    const phoneMatch = content.match(/^tel:([^\s]+)$/i);
    if (phoneMatch) {
      return {
        type: 'phone',
        content,
        displayContent: phoneMatch[1],
        actions: [
          {
            label: 'Call',
            action: () => window.open(content, '_blank'),
            icon: <ArrowSquareOut className="h-4 w-4" />,
          },
        ],
      };
    }

    // WiFi detection
    const wifiMatch = content.match(
      /^WIFI:T:(WEP|WPA|nopass);S:([^;]*);P:([^;]*);H:(true|false);?$/i
    );
    if (wifiMatch) {
      return {
        type: 'wifi',
        content,
        displayContent: `WiFi: ${wifiMatch[2]}`,
        metadata: {
          authentication: wifiMatch[1],
          ssid: wifiMatch[2],
          password: wifiMatch[3],
          hidden: wifiMatch[4] === 'true',
        },
      };
    }

    // SMS detection
    const smsMatch = content.match(/^sms:([^\?]+)(?:\?body=([^\s]*))?$/i);
    if (smsMatch) {
      const body = smsMatch[2] ? decodeURIComponent(smsMatch[2]) : '';
      return {
        type: 'sms',
        content,
        displayContent: `SMS to ${smsMatch[1]}${body ? `: ${body}` : ''}`,
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
        type: 'geo',
        content,
        displayContent: `Location: ${geoMatch[1]}, ${geoMatch[2]}`,
        metadata: {
          lat: Number.parseFloat(geoMatch[1]),
          lng: Number.parseFloat(geoMatch[2]),
        },
        actions: [
          {
            label: 'View on Map',
            action: () =>
              window.open(`https://maps.google.com/?q=${geoMatch[1]},${geoMatch[2]}`, '_blank'),
            icon: <ArrowSquareOut className="h-4 w-4" />,
          },
        ],
      };
    }

    // vCard detection (simplified)
    if (content.includes('BEGIN:VCARD') && content.includes('END:VCARD')) {
      return {
        type: 'vcard',
        content,
        displayContent: 'Contact Card',
        metadata: { type: 'vcard' },
      };
    }

    // Default to text
    return {
      type: 'text',
      content,
      displayContent: content,
      actions: [
        {
          label: 'Copy Text',
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
    [supportedFormats, addLogEntry]
  );

  const scanImages = useCallback(async () => {
    if (imageFiles.length === 0) return;

    setIsScanning(true);
    startMonitoring('qr-scan-batch');
    setProgress(0);

    try {
      const results: QRScanResult[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        addLogEntry(`Scanning image ${i + 1}/${imageFiles.length}: ${imageFiles[i].name}`);
        setProgress((i / imageFiles.length) * 100);

        let result: { success: boolean; data?: string; error?: string } = { success: false };
        try {
          const scanResults = await qrScanner.scanFromImage(imageFiles[i]);
          if (scanResults && scanResults.length > 0) {
            result = { success: true, data: scanResults[0].data };
          } else {
            result = { success: false, error: 'No QR code found' };
          }
        } catch (e) {
          result = { success: false, error: e instanceof Error ? e.message : 'Scan failed' };
        }

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
        `Scan complete: ${successfulScans}/${imageFiles.length} images contained QR codes (${metrics.executionTime.toFixed(2)}ms)`
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to scan images');
      addLogEntry(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsUsingCamera(true);
        addLogEntry('Camera started successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
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
    addLogEntry('Camera stopped');
  }, [addLogEntry]);

  const captureFromCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `camera_capture_${Date.now()}.png`, { type: 'image/png' });
      const previewUrl = URL.createObjectURL(file);

      setImageFiles((prev) => [...prev, file]);
      setImagePreviewUrls((prev) => [...prev, previewUrl]);
      setCurrentImageIndex(imageFiles.length);

      addLogEntry('Camera image captured successfully');
      stopCamera();
    }, 'image/png');
  }, [imageFiles.length, stopCamera, addLogEntry]);

  const scanFromCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    setIsScanning(true);
    startMonitoring('qr-scan-camera');

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `camera_scan_${Date.now()}.png`, { type: 'image/png' });

        addLogEntry('Scanning from camera feed...');

        let result: { success: boolean; data?: string; error?: string } = { success: false };
        try {
          const scanResults = await qrScanner.scanFromImage(file);
          if (scanResults && scanResults.length > 0) {
            result = { success: true, data: scanResults[0].data };
          } else {
            result = { success: false, error: 'No QR code found' };
          }
        } catch (e) {
          result = { success: false, error: e instanceof Error ? e.message : 'Scan failed' };
        }

        const scanResult: QRScanResult = {
          ...result,
          fileName: 'Camera Capture',
          fileSize: file.size,
          timestamp: new Date(),
          parsed: result.success && result.data ? parseQRContent(result.data) : undefined,
        };

        setScanResults((prev) => [scanResult, ...prev]);

        if (result.success && result.data) {
          addLogEntry('✓ QR code found in camera feed');
        } else {
          addLogEntry('✗ No QR code found in camera feed');
        }

        const metrics = getMetrics();
        addLogEntry(`Camera scan complete (${metrics.executionTime.toFixed(2)}ms)`);

        if (onScanComplete) {
          onScanComplete(scanResult);
        }
      }, 'image/png');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to scan from camera');
      addLogEntry(`Camera scan error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      const link = document.createElement('a');
      link.href = imagePreviewUrls[index];
      link.download = `qr_scan_${result.fileName || index}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addLogEntry(`Downloaded: ${result.fileName || `Image ${index}`}`);
    },
    [imagePreviewUrls, addLogEntry]
  );

  const getResultIcon = useCallback((result: QRScanResult) => {
    if (!result.success) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }

    if (!result.parsed) {
      return <Warning className="h-5 w-5 text-yellow-500" />;
    }

    switch (result.parsed.type) {
      case 'url':
        return <QrCode className="h-5 w-5 text-blue-500" />;
      case 'email':
        return <QrCode className="h-5 w-5 text-green-500" />;
      case 'phone':
        return <QrCode className="h-5 w-5 text-purple-500" />;
      case 'wifi':
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* File UploadSimple */}
              <div className="rounded-lg border-2 border-border border-dashed p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={supportedFormats.join(',')}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isScanning}
                >
                  <UploadSimple className="mr-2 h-4 w-4" />
                  UploadSimple Images
                </Button>
                <p className="mt-2 text-muted-foreground text-sm">Scan from files</p>
              </div>

              {/* Camera */}
              <div className="rounded-lg border-2 border-border border-dashed p-6 text-center">
                {isUsingCamera ? (
                  <Button onClick={stopCamera} variant="outline" disabled={isScanning}>
                    <CameraSlash className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                ) : (
                  <Button onClick={startCamera} variant="outline" disabled={isScanning}>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                )}
                <p className="mt-2 text-muted-foreground text-sm">Live scanning</p>
              </div>

              {/* Batch Scan */}
              <div className="rounded-lg border-2 border-border border-dashed p-6 text-center">
                <Button
                  onClick={scanImages}
                  disabled={imageFiles.length === 0 || isScanning}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <ArrowsClockwise className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan All ({imageFiles.length})
                    </>
                  )}
                </Button>
                <p className="mt-2 text-muted-foreground text-sm">Batch process</p>
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
                <div className="overflow-hidden rounded-lg border bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="h-auto w-full" />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={scanFromCamera} disabled={isScanning}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Scan QR Code
                  </Button>
                  <Button onClick={captureFromCamera} variant="outline">
                    <Camera className="mr-2 h-4 w-4" />
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
                        className={result.success ? 'border-green-200' : 'border-gray-200'}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getResultIcon(result)}
                            <div className="flex-1">
                              <div className="mb-2 flex items-center justify-between">
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
                                      <DownloadSimple className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {result.success && result.data && (
                                <div className="space-y-2">
                                  {result.parsed && (
                                    <div>
                                      <div className="mb-1 flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {result.parsed.type.toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="break-all font-mono text-gray-700 text-sm">
                                        {result.parsed.displayContent}
                                      </p>

                                      {result.parsed.actions && (
                                        <div className="mt-2 flex gap-2">
                                          {result.parsed.actions.map(
                                            (action: any, actionIndex: number) => (
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
                                            )
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {result.confidence !== undefined && (
                                    <div className="text-muted-foreground text-xs">
                                      Confidence: {Math.round(result.confidence * 100)}%
                                    </div>
                                  )}
                                </div>
                              )}

                              {!result.success && result.error && (
                                <p className="text-red-600 text-sm">{result.error}</p>
                              )}

                              <div className="mt-2 text-muted-foreground text-xs">
                                {result.timestamp?.toLocaleString() || new Date().toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div
                        key={index}
                        className={`cursor-pointer overflow-hidden rounded-lg border transition-colors ${
                          index === currentImageIndex
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={url}
                          alt={imageFiles[index]?.name || `Image ${index}`}
                          className="h-24 w-full object-cover"
                        />
                        <div className="p-2">
                          <div className="truncate text-muted-foreground text-xs">
                            {imageFiles[index]?.name || `Image ${index}`}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {imageFiles[index]
                              ? `${(imageFiles[index].size / 1024).toFixed(1)}KB`
                              : ''}
                          </div>
                          {scanResults[index] && (
                            <Badge
                              variant={scanResults[index].success ? 'default' : 'secondary'}
                              className="mt-1 text-xs"
                            >
                              {scanResults[index].success ? 'QR Found' : 'No QR'}
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
                <div className="mb-1 font-medium text-sm">Processing Log</div>
                <div className="max-h-20 overflow-y-auto rounded bg-muted p-2 font-mono text-xs">
                  {processingLog.slice(-3).join('\n')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
