/**
 * QR Scanner Integration with Error Handling
 *
 * Provides comprehensive QR code scanning capabilities with:
 * - qr-scanner library integration
 * - Error handling for damaged or low-quality codes
 * - Camera permission management
 * - Multiple scan attempts with different settings
 * - Barcode detection fallback
 * - Image preprocessing for better recognition
 * - Memory management and cleanup
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasOperations } from './canvas-operations';

export interface QRScanResult {
  data: string;
  format: string;
  confidence: number;
  scanTime: number;
  metadata?: {
    position?: { x: number; y: number; width: number; height: number };
    quality?: number;
    attempts?: number;
  };
}

export interface QRScannerConfig {
  preferCamera?: 'environment' | 'user';
  maxScanAttempts?: number;
  scanTimeout?: number;
  enableBarcodeDetection?: boolean;
  enablePreprocessing?: boolean;
  qualityThreshold?: number; // 0.0 - 1.0
}

export interface QRScanError {
  type: 'permission' | 'device' | 'timeout' | 'invalid' | 'unsupported';
  message: string;
  details?: any;
}

/**
 * Custom hook for QR code scanning
 */
export const useQRScanner = (config: QRScannerConfig = {}) => {
  const {
    preferCamera = 'environment',
    maxScanAttempts = 3,
    scanTimeout = 10000,
    enableBarcodeDetection = true,
    enablePreprocessing = true,
    qualityThreshold = 0.7,
  } = config;

  // State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<QRScanResult[]>([]);
  const [lastError, setLastError] = useState<QRScanError | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Refs
  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanAttemptsRef = useRef(0);

  // Canvas operations hook
  const { loadImage, applyFilters, getImageDimensions } = useCanvasOperations();

  /**
   * Check camera permissions
   */
  const checkCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if we can access permissions API
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasPermission(result.state === 'granted');
        return result.state === 'granted';
      }

      // Fallback: try to access camera directly
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      return true;
    } catch (_error) {
      setHasPermission(false);
      return false;
    }
  }, []);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: preferCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      setLastError(null);
      return true;
    } catch (error: any) {
      const permissionError: QRScanError = {
        type: 'permission',
        message: 'Camera permission denied',
        details: error,
      };
      setLastError(permissionError);
      setHasPermission(false);
      return false;
    }
  }, [preferCamera]);

  const handleSuccessfulScan = useCallback((data: string) => {
    const result: QRScanResult = {
      data,
      format: 'qr_code',
      confidence: 1.0,
      scanTime: 0,
      metadata: {
        attempts: scanAttemptsRef.current,
      },
    };

    setScanResults([result]);
    setIsScanning(false);

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  const handleScanError = useCallback((error: any) => {
    let scanError: QRScanError;

    if (error.name === 'NotFoundError') {
      scanError = {
        type: 'device',
        message: 'No camera found',
        details: error,
      };
    } else if (error.name === 'NotAllowedError') {
      scanError = {
        type: 'permission',
        message: 'Camera permission denied',
        details: error,
      };
    } else {
      scanError = {
        type: 'invalid',
        message: 'Scan failed',
        details: error,
      };
    }

    setLastError(scanError);
    setIsScanning(false);
  }, []);

  /**
   * Initialize scanner
   */
  const initializeScanner = useCallback(async (): Promise<void> => {
    try {
      // Check if qr-scanner is available
      if (typeof window === 'undefined' || !('QrScanner' in window)) {
        // Load qr-scanner dynamically
        await import('qr-scanner');
      }

      if (!scannerRef.current && videoRef.current) {
        const QrScanner = (window as any).QrScanner;

        scannerRef.current = new QrScanner(
          videoRef.current,
          (result: any) => {
            handleSuccessfulScan(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: preferCamera,
          }
        );

        // Set up error handling
        scannerRef.current.addEventListener('error', (error: any) => {
          handleScanError(error);
        });
      }
    } catch (error: any) {
      const scannerError: QRScanError = {
        type: 'unsupported',
        message: 'QR scanner not supported',
        details: error,
      };
      setLastError(scannerError);
    }
  }, [preferCamera, handleScanError, handleSuccessfulScan]);

  const handleScanTimeout = useCallback(() => {
    const timeoutError: QRScanError = {
      type: 'timeout',
      message: 'Scanning timed out',
      details: { timeout: scanTimeout },
    };

    setLastError(timeoutError);
    setIsScanning(false);
  }, [scanTimeout]);

  /**
   * Start camera scanning
   */
  const startCameraScanning = useCallback(async (): Promise<void> => {
    try {
      setLastError(null);
      scanAttemptsRef.current = 0;

      // Check permissions first
      const hasCamPermission = await checkCameraPermission();
      if (!hasCamPermission) {
        const granted = await requestCameraPermission();
        if (!granted) {
          return;
        }
      }

      // Initialize scanner if not done yet
      await initializeScanner();

      if (!scannerRef.current) {
        throw new Error('Failed to initialize QR scanner');
      }

      await scannerRef.current.start();
      setIsScanning(true);
      setIsCameraActive(true);

      // Set scan timeout
      scanTimeoutRef.current = setTimeout(() => {
        if (isScanning) {
          handleScanTimeout();
        }
      }, scanTimeout);
    } catch (error: any) {
      const scanError: QRScanError = {
        type: 'device',
        message: 'Failed to start camera scanning',
        details: error,
      };
      setLastError(scanError);
      setIsScanning(false);
      setIsCameraActive(false);
    }
  }, [
    checkCameraPermission,
    requestCameraPermission,
    initializeScanner,
    isScanning,
    scanTimeout,
    handleScanTimeout,
  ]);

  const estimateScanQuality = useCallback(
    (image: HTMLImageElement, result: QRScanResult): number => {
      let quality = 1.0;

      if (result.metadata?.position) {
        const { width, height } = result.metadata.position;
        const imageArea = image.width * image.height;
        const codeArea = width * height;
        const coverageRatio = codeArea / imageArea;

        if (coverageRatio < 0.05) {
          quality *= 0.7;
        } else if (coverageRatio > 0.5) {
          quality *= 0.8;
        }
      }

      return Math.max(0, quality);
    },
    []
  );

  /**
   * Scan with qr-scanner library
   */
  const scanWithQRScanner = useCallback(
    async (image: HTMLImageElement): Promise<QRScanResult[]> => {
      if (!('QrScanner' in window)) {
        throw new Error('QR Scanner not available');
      }

      const QrScanner = (window as any).QrScanner;
      const result = await QrScanner.scanImage(image, {
        returnDetailedScanResult: true,
      });

      if (result?.data) {
        return [
          {
            data: result.data,
            format: result.format || 'qr_code',
            confidence: 1.0,
            scanTime: 0,
            metadata: {
              position: result.cornerPoints
                ? {
                    x: Math.min(...result.cornerPoints.map((p: any) => p.x)),
                    y: Math.min(...result.cornerPoints.map((p: any) => p.y)),
                    width:
                      Math.max(...result.cornerPoints.map((p: any) => p.x)) -
                      Math.min(...result.cornerPoints.map((p: any) => p.x)),
                    height:
                      Math.max(...result.cornerPoints.map((p: any) => p.y)) -
                      Math.min(...result.cornerPoints.map((p: any) => p.y)),
                  }
                : undefined,
            },
          },
        ];
      }

      return [];
    },
    []
  );

  /**
   * Scan with BarcodeDetector API
   */
  const scanWithBarcodeDetector = useCallback(
    async (image: HTMLImageElement): Promise<QRScanResult[]> => {
      if (!('BarcodeDetector' in window)) {
        throw new Error('BarcodeDetector not supported');
      }

      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await barcodeDetector.detect(image);

      return barcodes.map((barcode: any) => ({
        data: barcode.rawValue,
        format: barcode.format,
        confidence: 1.0,
        scanTime: 0,
        metadata: {
          position: {
            x: barcode.boundingBox.x,
            y: barcode.boundingBox.y,
            width: barcode.boundingBox.width,
            height: barcode.boundingBox.height,
          },
        },
      }));
    },
    []
  );

  /**
   * Scan with image preprocessing
   */
  const scanWithPreprocessing = useCallback(
    async (image: HTMLImageElement, filterType: string): Promise<QRScanResult[]> => {
      let filters = {};

      switch (filterType) {
        case 'brightness':
          filters = { brightness: 20 };
          break;
        case 'contrast':
          filters = { contrast: 30 };
          break;
        case 'blur':
          filters = { blur: 0.5 };
          break;
        case 'grayscale':
          filters = { grayscale: true };
          break;
      }

      const processedCanvas = applyFilters(image, filters);

      // Convert canvas back to image for scanning
      const processedImage = new Image();
      processedImage.src = processedCanvas.toDataURL();

      await new Promise((resolve) => {
        processedImage.onload = resolve;
      });

      return scanWithQRScanner(processedImage);
    },
    [applyFilters, scanWithQRScanner]
  );

  /**
   * Scan from image file
   */
  const scanFromImage = useCallback(
    async (imageSource: File | Blob | string | HTMLImageElement): Promise<QRScanResult[]> => {
      try {
        setLastError(null);
        scanAttemptsRef.current = 0;
        const startTime = performance.now();

        let image: HTMLImageElement;
        if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
          image = await loadImage(imageSource);
        } else if (imageSource instanceof File || imageSource instanceof Blob) {
          image = await loadImage(imageSource);
        } else if (imageSource instanceof HTMLImageElement) {
          image = imageSource;
        } else {
          throw new Error('Invalid image source');
        }

        const results: QRScanResult[] = [];

        const strategies = [
          () => scanWithQRScanner(image),
          ...(enableBarcodeDetection ? [() => scanWithBarcodeDetector(image)] : []),
          ...(enablePreprocessing
            ? [
                () => scanWithPreprocessing(image, 'brightness'),
                () => scanWithPreprocessing(image, 'contrast'),
                () => scanWithPreprocessing(image, 'blur'),
                () => scanWithPreprocessing(image, 'grayscale'),
              ]
            : []),
        ];

        for (const strategy of strategies) {
          try {
            const strategyResults = await strategy();
            if (strategyResults.length > 0) {
              results.push(...strategyResults);
              break;
            }
          } catch (_strategyError) {
            continue;
          }

          scanAttemptsRef.current++;
          if (scanAttemptsRef.current >= maxScanAttempts) {
            break;
          }
        }

        if (results.length === 0) {
          throw new Error('No QR code found in image');
        }

        const scanTime = performance.now() - startTime;
        results.forEach((result) => {
          result.scanTime = scanTime;
          result.metadata = {
            ...result.metadata,
            attempts: scanAttemptsRef.current,
            quality: estimateScanQuality(image, result),
          };
        });

        setScanResults(results);
        return results;
      } catch (error: any) {
        const scanError: QRScanError = {
          type: 'invalid',
          message: 'No QR code found in image',
          details: error,
        };
        setLastError(scanError);
        return [];
      }
    },
    [
      loadImage,
      enableBarcodeDetection,
      enablePreprocessing,
      maxScanAttempts,
      estimateScanQuality,
      scanWithBarcodeDetector,
      scanWithPreprocessing,
      scanWithQRScanner,
    ]
  );

  /**
   * Stop scanning
   */
  const stopScanning = useCallback(async (): Promise<void> => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_error) {
        // Ignore stop errors
      }
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    setIsScanning(false);
    setIsCameraActive(false);
  }, []);

  /**
   * Clear results and errors
   */
  const clearResults = useCallback(() => {
    setScanResults([]);
    setLastError(null);
  }, []);

  /**
   * Check if QR scanning is supported
   */
  const isSupported = useCallback((): boolean => {
    return (
      'QrScanner' in window ||
      'BarcodeDetector' in window ||
      (typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        'getUserMedia' in navigator.mediaDevices)
    );
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      clearResults();
    };
  }, [stopScanning, clearResults]);

  return {
    // State
    isScanning,
    isCameraActive,
    hasPermission,
    scanResults,
    lastError,

    // Methods
    checkCameraPermission,
    requestCameraPermission,
    startCameraScanning,
    stopScanning,
    scanFromImage,
    clearResults,
    isSupported,

    // Refs
    videoRef,
    canvasRef,
  };
};

/**
 * Validate QR code content
 */
export const validateQRCode = (
  data: string
): {
  isValid: boolean;
  type?: string;
  errors?: string[];
} => {
  const errors: string[] = [];
  let type: string | undefined;

  // Check if it's a URL
  try {
    const _url = new URL(data);
    type = 'url';
  } catch {
    // Not a URL
  }

  // Check if it's email
  if (data.includes('@') && data.includes('.')) {
    type = type || 'email';
  }

  // Check if it's phone number
  if (data.match(/^[+]?[1-9][\d]{3,14}$/)) {
    type = type || 'phone';
  }

  // Check if it's WiFi config
  if (data.startsWith('WIFI:')) {
    type = type || 'wifi';
  }

  // Check if it's vCard
  if (data.startsWith('BEGIN:VCARD')) {
    type = type || 'vcard';
  }

  // Check if it's text content
  if (!type) {
    type = 'text';
  }

  // Basic validation
  if (data.length === 0) {
    errors.push('Empty QR code');
  }

  if (data.length > 4296) {
    errors.push('QR code too long');
  }

  return {
    isValid: errors.length === 0,
    type,
    errors,
  };
};
