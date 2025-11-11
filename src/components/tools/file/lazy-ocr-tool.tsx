/**
 * Enhanced Lazy OCR Tool - T152 Implementation
 * Improved lazy loading for OCR components with monitoring, preloading, and better UX
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LazyErrorBoundary } from '@/components/tools/lazy-loading/lazy-error-boundary';
import { OCRToolSkeleton } from '@/components/tools/lazy-loading/loading-skeletons';
import { useLazyLoading } from '@/components/tools/lazy-loading/lazy-loading-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Scan,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  FileText,
  Languages,
  RefreshCw,
  Settings,
  AlertTriangle,
  Camera,
  FileImage
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

// Types for OCR functionality
interface OCRResult {
  extractedText: string;
  confidence: number;
  language: string;
  confidenceScores: {
    [key: string]: number;
  };
  processingTime: number;
  imageSize: number;
  fileName: string;
  supportedLanguages: string[];
}

interface OCRSettings {
  language: 'auto' | 'eng' | 'chi_sim' | 'chi_tra' | 'jpn' | 'kor' | 'ara';
  outputFormat: 'text' | 'json' | 'hocr';
  confidenceThreshold: number;
}

interface LazyOCRToolProps {
  className?: string;
  preload?: boolean;
  priority?: 'high' | 'normal' | 'low';
  onLoadingStart?: () => void;
  onLoadingComplete?: (loadTime: number) => void;
  onError?: (error: Error) => void;
  analytics?: {
    trackLoadTime?: boolean;
    trackInteractions?: boolean;
    trackErrors?: boolean;
  };
}

// Lazy load Tesseract.js
const TesseractLoader = React.lazy(() =>
  import('tesseract.js')
    .then((mod) => ({ default: mod.default }))
    .catch((error) => {
      console.error('Failed to load Tesseract.js:', error);
      // Return a mock implementation
      return {
        default: {
          recognize: async () => ({
            data: {
              text: 'OCR engine not available. This is a demo fallback.',
              confidence: 50,
              words: []
            }
          })
        }
      };
    })
);

// Main Lazy OCR Tool Component
export function LazyOCRTool({
  className,
  preload = false,
  priority = 'normal',
  onLoadingStart,
  onLoadingComplete,
  onError,
  analytics = {
    trackLoadTime: true,
    trackInteractions: true,
    trackErrors: true,
  },
}: LazyOCRToolProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [tesseractReady, setTesseractReady] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [loadStartTime, setLoadStartTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const [settings, setSettings] = useState<OCRSettings>({
    language: 'auto',
    outputFormat: 'text',
    confidenceThreshold: 60
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { preloadComponent, markComponentLoaded, markComponentFailed } = useLazyLoading();

  // Initialize Tesseract.js with enhanced error handling
  const initializeTesseract = useCallback(async () => {
    setIsInitializing(true);
    const startTime = performance.now();
    setLoadStartTime(startTime);

    try {
      if (onLoadingStart) {
        onLoadingStart();
      }

      // Preload Tesseract if requested
      if (preload) {
        preloadComponent('tesseract-ocr', () => import('tesseract.js'));
      }

      // Actually load Tesseract
      const Tesseract = await import('tesseract.js');
      setTesseractReady(true);

      const loadTime = performance.now() - startTime;

      // Track loading metrics
      if (analytics.trackLoadTime && onLoadingComplete) {
        onLoadingComplete(loadTime);
      }

      // Mark component as loaded
      markComponentLoaded('ocr-tool', loadTime, 1500000); // ~1.5MB for Tesseract

      toast.success('OCR engine initialized successfully');

      if (analytics.trackInteractions) {
        console.debug(`OCR engine initialized in ${loadTime.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Failed to initialize OCR engine:', error);
      setTesseractReady(false);

      const componentError = error instanceof Error ? error : new Error('Unknown OCR initialization error');
      markComponentFailed('ocr-tool', componentError);

      if (onError) {
        onError(componentError);
      }

      if (analytics.trackErrors) {
        console.error('OCR engine initialization failed:', componentError);
      }

      toast.error('Failed to initialize OCR engine');
    } finally {
      setIsInitializing(false);
    }
  }, [preload, preloadComponent, markComponentLoaded, markComponentFailed, onLoadingStart, onLoadingComplete, onError, analytics]);

  // Initialize Tesseract on mount or when preload changes
  useEffect(() => {
    initializeTesseract();
  }, [initializeTesseract]);

  // Initialize session
  useEffect(() => {
    const session = createSession('ocr-tool', {
      settings,
      initialFile: null
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, [settings]);

  // Handle file selection with enhanced tracking
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setOcrResult(null);

      if (analytics.trackInteractions) {
        console.debug(`OCR: File selected - ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
      }

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { fileName: file.name, fileSize: file.size, fileType: file.type },
          lastActivity: new Date()
        });
      }
    } else {
      toast.error('Please select a valid image file');
    }
  }, [analytics.trackInteractions, sessionId]);

  // Handle file input change
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop with enhanced tracking
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      if (analytics.trackInteractions) {
        console.debug('OCR: File dropped via drag and drop');
      }
      handleFileSelect(file);
    }
  }, [handleFileSelect, analytics.trackInteractions]);

  // Extract text from image using OCR with enhanced error handling
  const extractText = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      let extractedText = '';
      let confidence = 0;
      let confidenceScores: { [key: string]: number } = {};
      let processingTime = 0;

      if (tesseractReady) {
        // Use Tesseract.js for OCR
        const Tesseract = await import('tesseract.js');

        const result = await Tesseract.recognize(
          selectedFile,
          settings.language,
          {
            logger: (m) => {
              if (analytics.trackInteractions && m.status === 'recognizing text') {
                console.debug(`OCR progress: ${m.progress * 100}%`);
              }
            },
          }
        );

        extractedText = result.data.text;
        confidence = result.data.confidence;

        // Get confidence scores for each word/character
        if (result.data.words) {
          result.data.words.forEach((word: any) => {
            if (word.confidence && word.text) {
              confidenceScores[word.text] = word.confidence;
            }
          });
        }

        processingTime = Date.now() - startTime;
      } else {
        // Fallback to browser API or mock functionality
        extractedText = 'OCR engine not available. This is a demo fallback.';
        confidence = 50;
        processingTime = Date.now() - startTime;

        // Create some mock confidence scores
        const words = 'Sample extracted text from image'.split(' ');
        words.forEach((word, index) => {
          confidenceScores[word] = 70 + Math.random() * 30;
        });
      }

      const result: OCRResult = {
        extractedText: extractedText.trim(),
        confidence,
        language: settings.language === 'auto' ? 'unknown' : settings.language,
        confidenceScores,
        processingTime,
        imageSize: selectedFile.size,
        fileName: selectedFile.name,
        supportedLanguages: ['eng', 'chi_sim', 'chi_tra', 'jpn', 'kor', 'ara']
      };

      setOcrResult(result);

      toast.success(`Text extracted with ${confidence.toFixed(1)}% confidence`);

      if (analytics.trackInteractions) {
        console.debug('OCR extraction completed:', {
          textLength: extractedText.length,
          confidence: confidence.toFixed(1),
          processingTime: `${processingTime}ms`
        });
      }

      if (sessionId) {
        updateSession(sessionId, {
          results: {
            extractedText,
            confidence,
            language: result.language,
            confidenceScores: result.confidenceScores,
            processingTime: result.processingTime
          },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'extract', true);
      }

    } catch (error) {
      console.error('OCR failed:', error);
      const componentError = error instanceof Error ? error : new Error('OCR processing failed');
      markComponentFailed('ocr-processing', componentError);

      if (analytics.trackErrors) {
        console.error('OCR processing error:', componentError);
      }

      toast.error('Failed to extract text from image');
      if (sessionId) addToHistory(sessionId, 'extract', false);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, tesseractReady, settings, sessionId, analytics, markComponentFailed]);

  // Download extracted text
  const downloadText = useCallback(() => {
    if (!ocrResult) return;

    let content = ocrResult.extractedText;

    // Format based on output format
    if (settings.outputFormat === 'json') {
      content = JSON.stringify({
        text: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        language: ocrResult.language,
        confidenceScores: ocrResult.confidenceScores,
        fileName: ocrResult.fileName,
        processingTime: ocrResult.processingTime,
        imageSize: ocrResult.imageSize
      }, null, 2);
    } else if (settings.outputFormat === 'hocr') {
      content = `Document ${ocrResult.fileName}
Confidence: ${ocrResult.confidence}%
Language: ${ocrResult.language}
Processing Time: ${ocrResult.processingTime}ms
Image Size: ${ocrResult.imageSize} bytes

${ocrResult.extractedText}`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text.${settings.outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Extracted text downloaded');

    if (analytics.trackInteractions) {
      console.debug('OCR: Downloaded extracted text');
    }

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [ocrResult, settings.outputFormat, sessionId, analytics.trackInteractions]);

  // Copy text to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!ocrResult) return;

    try {
      await navigator.clipboard.writeText(ocrResult.extractedText);
      toast.success('Extracted text copied to clipboard');

      if (analytics.trackInteractions) {
        console.debug('OCR: Copied text to clipboard');
      }
    } catch (error) {
      toast.error('Failed to copy text to clipboard');
    }
  }, [ocrResult, analytics.trackInteractions]);

  // Reset everything
  const reset = useCallback(() => {
    setSelectedFile(null);
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (analytics.trackInteractions) {
      console.debug('OCR: Reset tool');
    }
  }, [analytics.trackInteractions]);

  // Load sample image
  const loadSample = useCallback(() => {
    // Create a sample image with text
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 600, 400);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 400);

      // Add text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OCR Sample Text', 300, 180);

      ctx.font = '20px Arial';
      ctx.fillText('This is a sample image for OCR testing', 300, 220);

      ctx.font = '16px Arial';
      ctx.fillText('Try extracting this text!', 300, 250);

      // Convert to blob and create file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'sample-ocr-image.jpg', { type: 'image/jpeg' });
          handleFileSelect(file);
        }
      }, 'image/jpeg', 90);
    }
  }, [handleFileSelect]);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get supported languages
  const getSupportedLanguages = (): Array<{ code: string; name: string; nativeName: string }> => {
    return [
      { code: 'auto', name: 'Auto-detect', nativeName: 'Auto-detect' },
      { code: 'eng', name: 'English', nativeName: 'English' },
      { code: 'chi_sim', name: 'Chinese Simplified', nativeName: '简体中文' },
      { code: 'chi_tra', name: 'Chinese Traditional', nativeName: '繁體中文' },
      { code: 'jpn', name: 'Japanese', nativeName: '日本語' },
      { code: 'kor', name: 'Korean', nativeName: '한국어' },
      { code: 'ara', name: 'Arabic', nativeName: 'العربية' },
      { code: 'fra', name: 'French', nativeName: 'Français' },
      { code: 'ger', name: 'German', nativeName: 'Deutsch' },
      { code: 'spa', name: 'Spanish', nativeName: 'Español' },
      { code: 'rus', name: 'Russian', nativeName: 'Русский' },
      { code: 'ita', name: 'Italian', nativeName: 'Italiano' },
      { code: 'por', name: 'Portuguese', nativeName: 'Português' },
      { code: 'nld', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'pol', name: 'Polish', nativeName: 'Polski' },
      { code: 'tur', name: 'Turkish', nativeName: 'Türkçe' },
      { code: 'hin', name: 'Hindi', nativeName: 'हिन्दी' }
    ];
  };

  // Show loading skeleton while initializing
  if (isInitializing) {
    return <OCRToolSkeleton className={className} />;
  }

  return (
    <LazyErrorBoundary
      componentId="ocr-tool"
      onError={(error) => {
        if (onError) onError(error);
      }}
      maxRetries={3}
      showStackTrace={process.env.NODE_ENV === 'development'}
      customMessages={{
        title: 'OCR Tool Failed to Load',
        description: 'The OCR engine failed to initialize. This might be due to network issues or browser compatibility.',
        retryText: 'Retry OCR Initialization',
        reportText: 'Report OCR Issue',
      }}
    >
      <div
        className={`space-y-6 ${className}`}
        data-component="lazy-ocr-tool"
        data-engine-ready={tesseractReady}
        data-priority={priority}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scan className="h-6 w-6" />
            <h1 className="text-2xl font-bold">OCR Tool</h1>
            {tesseractReady && (
              <Badge variant="default" className="text-xs">Ready</Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSample}
              disabled={isProcessing}
            >
              Load Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={isProcessing}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* OCR Engine Status */}
        {!tesseractReady && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>OCR Engine:</strong> The Tesseract.js library is not available.
              The tool will use fallback functionality for demonstration purposes.
              For production use, please ensure Tesseract.js is properly installed.
            </AlertDescription>
          </Alert>
        )}

        {/* File Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Select Image for OCR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                    <div>
                      <div className="font-medium">{selectedFile.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatBytes(selectedFile.size)} • {selectedFile.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Click or drag to replace this image
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <div className="font-medium">Drop image here or click to browse</div>
                    <div className="text-sm text-muted-foreground">
                      Supports JPG, PNG, WebP, GIF, BMP, TIFF, and more
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* OCR Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              OCR Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">Recognition Language:</label>
                  <Select
                    value={settings.language}
                    onValueChange={(value: OCRSettings['language']) =>
                      setSettings(prev => ({ ...prev, language: value }))
                    }
                    disabled={!tesseractReady || isProcessing}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getSupportedLanguages().map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name} ({lang.nativeName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!tesseractReady && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Language selection disabled - using fallback
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="output-format" className="text-sm font-medium">Output Format:</label>
                  <Select
                    value={settings.outputFormat}
                    onValueChange={(value: 'text' | 'json' | 'hocr') =>
                      setSettings(prev => ({ ...prev, outputFormat: value }))
                    }
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="hocr">HOCR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={extractText}
                  disabled={isProcessing || !selectedFile || isInitializing}
                  className="flex items-center space-x-2"
                >
                  <Scan className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
                  <span>{isProcessing ? 'Extracting...' : 'Extract Text'}</span>
                </Button>

                {ocrResult && (
                  <>
                    <Button
                      variant="outline"
                      onClick={copyToClipboard}
                      disabled={isProcessing}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>

                    <Button
                      variant="outline"
                      onClick={downloadText}
                      disabled={isProcessing}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {ocrResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileImage className="h-5 w-5 mr-2" />
                    Original Image
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {formatBytes(ocrResult.imageSize)}
                    </Badge>
                    <Badge variant="outline">
                      {ocrResult.fileName}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <div>File: {ocrResult.fileName}</div>
                    <div>Type: {selectedFile?.type}</div>
                    <div>Size: {formatBytes(ocrResult.imageSize)}</div>
                  </div>
                  {selectedFile && (
                    <div className="relative bg-muted/20 rounded-lg overflow-hidden max-h-64">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Original image"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Extracted Text */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Extracted Text
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={ocrResult.confidence >= 80 ? "default" :
                               ocrResult.confidence >= 60 ? "secondary" : "destructive"}
                    >
                      {ocrResult.confidence.toFixed(1)}% confidence
                    </Badge>
                    <Badge variant="outline">
                      {ocrResult.language.toUpperCase()}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="max-h-64 overflow-auto bg-muted/20 rounded-lg p-4">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {ocrResult.extractedText}
                    </pre>
                  </div>

                  {/* Processing Info */}
                  <div className="text-xs text-muted-foreground">
                    <div>Processing time: {ocrResult.processingTime}ms</div>
                    <div>Characters extracted: {ocrResult.extractedText.length}</div>
                    <div>Engine: {tesseractReady ? 'Tesseract.js' : 'Fallback'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hidden image for preview */}
        {selectedFile && (
          <img
            ref={imageRef}
            src={URL.createObjectURL(selectedFile)}
            alt="Preview image"
            className="hidden"
          />
        )}
      </div>
    </LazyErrorBoundary>
  );
}

// Preload hook for OCR components
export function useOCRPreload() {
  const { preloadComponent } = useLazyLoading();

  const preload = React.useCallback(async () => {
    try {
      await Promise.all([
        preloadComponent('tesseract-ocr', () => import('tesseract.js')),
      ]);
      console.debug('OCR components preloaded');
    } catch (error) {
      console.error('Failed to preload OCR components:', error);
    }
  }, [preloadComponent]);

  return { preload };
}

// HOC for wrapping components with lazy OCR functionality
export function withLazyOCR<P extends object>(
  Component: React.ComponentType<P>,
  ocrProps?: Partial<LazyOCRToolProps>
) {
  const WrappedComponent = (props: P) => (
    <LazyOCRTool {...ocrProps}>
      <Component {...props} />
    </LazyOCRTool>
  );

  WrappedComponent.displayName = `withLazyOCR(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default LazyOCRTool;
