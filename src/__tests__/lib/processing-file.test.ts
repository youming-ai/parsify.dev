import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { Processor, compressImage, generateQRCode, processOCR } from '@/lib/processing';

// Mock DOM APIs for testing
Object.defineProperty(global, 'Image', {
  value: class MockImage {
    width = 100;
    height = 100;
    src = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor() {
      // Simulate image loading after a short delay
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 10);
    }
  },
  writable: true,
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    constructor(public parts: any[], public type: string) {}
  },
  writable: true,
});

// Mock FileReader
Object.defineProperty(global, 'FileReader', {
  value: class MockFileReader {
    result: string | ArrayBuffer | null = null;
    onloadend: (() => void) | null = null;

    readAsDataURL(blob: Blob) {
      setTimeout(() => {
        this.result = 'data:image/jpeg;base64,mock-base64-data';
        if (this.onloadend) {
          this.onloadend();
        }
      }, 10);
    }
  },
  writable: true,
});

// Mock Canvas API
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tagName) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            drawImage: vi.fn(),
            toBlob: vi.fn((callback) => {
              callback(new Blob(['mock-image-data'], { type: 'image/jpeg' }));
            }),
          })),
        };
      }
      return {};
    }),
  },
  writable: true,
});

describe('File Processing Utilities', () => {
  const mockImageData = new ArrayBuffer(1000);
  const testText = 'Hello, World! This is a test for QR code generation.';

  beforeAll(() => {
    // Mock qrcode library
    vi.doMock('qrcode', () => ({
      toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code-data'),
    }));

    // Mock tesseract library
    vi.doMock('tesseract.js', () => ({
      createWorker: vi.fn().mockResolvedValue({
        loadLanguage: vi.fn().mockResolvedValue(undefined),
        initialize: vi.fn().mockResolvedValue(undefined),
        recognize: vi.fn().mockResolvedValue({
          data: {
            text: 'Mock OCR text result',
            confidence: 0.95,
            words: [
              { text: 'Mock', confidence: 0.98, bbox: { x0: 0, y0: 0, x1: 50, y1: 20 } },
              { text: 'OCR', confidence: 0.92, bbox: { x0: 55, y0: 0, x1: 100, y1: 20 } },
              { text: 'text', confidence: 0.97, bbox: { x0: 105, y0: 0, x1: 140, y1: 20 } },
              { text: 'result', confidence: 0.94, bbox: { x0: 145, y0: 0, x1: 200, y1: 20 } },
            ],
            lines: [
              {
                text: 'Mock OCR text result',
                confidence: 0.95,
                bbox: { x0: 0, y0: 0, x1: 200, y1: 20 },
                words: ['Mock', 'OCR', 'text', 'result'],
              },
            ],
          },
        }),
        terminate: vi.fn().mockResolvedValue(undefined),
      }),
    }));
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compressImage', () => {
    it('should compress image with default options', async () => {
      const result = await Processor.compressImage(mockImageData);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.width).toBe(100);
      expect(result.metadata.height).toBe(100);
      expect(result.metadata.format).toBe('jpeg');
      expect(result.metadata.quality).toBe(0.8);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBe(1000);
      expect(result.metrics.outputSize).toBeGreaterThan(0);
    });

    it('should compress image with custom quality', async () => {
      const result = await Processor.compressImage(mockImageData, {
        quality: 0.6,
      });

      expect(result.success).toBe(true);
      expect(result.metadata.quality).toBe(0.6);
    });

    it('should resize image when maxWidth is specified', async () => {
      const result = await Processor.compressImage(mockImageData, {
        maxWidth: 50,
      });

      expect(result.success).toBe(true);
      expect(result.metadata.width).toBeLessThanOrEqual(50);
    });

    it('should resize image when maxHeight is specified', async () => {
      const result = await Processor.compressImage(mockImageData, {
        maxHeight: 80,
      });

      expect(result.success).toBe(true);
      expect(result.metadata.height).toBeLessThanOrEqual(80);
    });

    it('should maintain aspect ratio when resizing', async () => {
      const result = await Processor.compressImage(mockImageData, {
        maxWidth: 50,
      });

      expect(result.success).toBe(true);
      const aspectRatio = result.metadata.width / result.metadata.height;
      expect(aspectRatio).toBeCloseTo(1, 1); // Original was 100x100 (1:1 ratio)
    });

    it('should handle different output formats', async () => {
      const result = await Processor.compressImage(mockImageData, {
        format: 'png',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('png');
    });

    it('should handle compression errors gracefully', async () => {
      // Mock a canvas context error
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      };
      vi.mocked(document.createElement).mockReturnValue(mockCanvas as any);

      const result = await Processor.compressImage(mockImageData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IMAGE_COMPRESSION_ERROR');
      expect(result.error?.message).toContain('Could not get canvas context');
    });

    it('should calculate compression ratio correctly', async () => {
      const result = await Processor.compressImage(mockImageData, {
        quality: 0.5,
      });

      expect(result.success).toBe(true);
      expect(result.metrics.compressionRatio).toBeDefined();
      expect(result.metrics.compressionRatio).toBeGreaterThan(0);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code with default options', async () => {
      const result = await Processor.generateQRCode(testText);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.size).toBe(200);
      expect(result.metadata.margin).toBe(4);
      expect(result.metadata.colorDark).toBe('#000000');
      expect(result.metadata.colorLight).toBe('#ffffff');
      expect(result.metadata.errorCorrectionLevel).toBe('M');
      expect(result.metadata.dataLength).toBe(testText.length);
    });

    it('should generate QR code with custom size', async () => {
      const result = await Processor.generateQRCode(testText, {
        size: 300,
      });

      expect(result.success).toBe(true);
      expect(result.metadata.size).toBe(300);
    });

    it('should generate QR code with custom colors', async () => {
      const result = await Processor.generateQRCode(testText, {
        colorDark: '#FF0000',
        colorLight: '#00FF00',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.colorDark).toBe('#FF0000');
      expect(result.metadata.colorLight).toBe('#00FF00');
    });

    it('should generate QR code with custom margin', async () => {
      const result = await Processor.generateQRCode(testText, {
        margin: 8,
      });

      expect(result.success).toBe(true);
      expect(result.metadata.margin).toBe(8);
    });

    it('should generate QR code with different error correction levels', async () => {
      const levels = ['L', 'M', 'Q', 'H'];

      for (const level of levels) {
        const result = await Processor.generateQRCode(testText, {
          errorCorrectionLevel: level,
        });

        expect(result.success).toBe(true);
        expect(result.metadata.errorCorrectionLevel).toBe(level);
      }
    });

    it('should handle empty text', async () => {
      const result = await Processor.generateQRCode('');

      expect(result.success).toBe(true);
      expect(result.metadata.dataLength).toBe(0);
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(1000);
      const result = await Processor.generateQRCode(longText);

      expect(result.success).toBe(true);
      expect(result.metadata.dataLength).toBe(1000);
    });

    it('should handle QR generation errors gracefully', async () => {
      // Mock QR library to throw an error
      const { default: QRCode } = await import('qrcode');
      vi.mocked(QRCode.toDataURL).mockRejectedValue(new Error('QR generation failed'));

      const result = await Processor.generateQRCode(testText);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QR_GENERATION_ERROR');
      expect(result.error?.message).toContain('QR generation failed');
    });

    it('should provide processing metrics', async () => {
      const result = await Processor.generateQRCode(testText);

      expect(result.success).toBe(true);
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBe(testText.length);
      expect(result.metrics.outputSize).toBeGreaterThan(0);
    });
  });

  describe('processOCR', () => {
    it('should process OCR with default options', async () => {
      const result = await Processor.processOCR(mockImageData);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.text).toBe('Mock OCR text result');
      expect(result.result.confidence).toBe(0.95);

      expect(result.result.words).toHaveLength(4);
      expect(result.result.words[0].text).toBe('Mock');
      expect(result.result.words[0].confidence).toBe(0.98);

      expect(result.result.lines).toHaveLength(1);
      expect(result.result.lines[0].text).toBe('Mock OCR text result');
      expect(result.result.lines[0].words).toEqual(['Mock', 'OCR', 'text', 'result']);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.language).toBe('eng');
      expect(result.metadata.wordCount).toBe(4);
      expect(result.metadata.lineCount).toBe(1);
      expect(result.metadata.averageConfidence).toBe(0.95);
    });

    it('should process OCR with custom language', async () => {
      const result = await Processor.processOCR(mockImageData, {
        language: 'fra',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.language).toBe('fra');
    });

    it('should process OCR with custom worker paths', async () => {
      const result = await Processor.processOCR(mockImageData, {
        workerPath: '/custom/worker.js',
        corePath: '/custom/core.wasm',
      });

      expect(result.success).toBe(true);

      // Verify the worker was created with custom paths
      const { createWorker } = await import('tesseract.js');
      expect(createWorker).toHaveBeenCalledWith({
        workerPath: '/custom/worker.js',
        corePath: '/custom/core.wasm',
        logger: expect.any(Function),
      });
    });

    it('should handle OCR errors gracefully', async () => {
      // Mock Tesseract to throw an error
      const { default: Tesseract } = await import('tesseract.js');
      vi.mocked(Tesseract.createWorker).mockRejectedValue(new Error('OCR initialization failed'));

      const result = await Processor.processOCR(mockImageData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OCR_PROCESSING_ERROR');
      expect(result.error?.message).toContain('OCR initialization failed');
    });

    it('should handle empty image data', async () => {
      const emptyData = new ArrayBuffer(0);
      const result = await Processor.processOCR(emptyData);

      expect(result.success).toBe(true);
      expect(result.metrics.inputSize).toBe(0);
    });

    it('should provide detailed OCR metadata', async () => {
      const result = await Processor.processOCR(mockImageData);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();

      // Check word-level data
      const firstWord = result.result.words[0];
      expect(firstWord).toHaveProperty('text');
      expect(firstWord).toHaveProperty('confidence');
      expect(firstWord).toHaveProperty('bbox');
      expect(firstWord.bbox).toHaveProperty('x0');
      expect(firstWord.bbox).toHaveProperty('y0');
      expect(firstWord.bbox).toHaveProperty('x1');
      expect(firstWord.bbox).toHaveProperty('y1');

      // Check line-level data
      const firstLine = result.result.lines[0];
      expect(firstLine).toHaveProperty('text');
      expect(firstLine).toHaveProperty('confidence');
      expect(firstLine).toHaveProperty('bbox');
      expect(firstLine).toHaveProperty('words');
      expect(Array.isArray(firstLine.words)).toBe(true);
    });

    it('should calculate processing metrics correctly', async () => {
      const result = await Processor.processOCR(mockImageData);

      expect(result.success).toBe(true);
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBe(mockImageData.byteLength);
      expect(result.metrics.outputSize).toBe(result.result.text.length);
    });

    it('should cleanup resources after processing', async () => {
      const result = await Processor.processOCR(mockImageData);

      expect(result.success).toBe(true);

      // Verify worker.terminate was called
      const { createWorker } = await import('tesseract.js');
      const mockWorker = vi.mocked(createWorker).mock.results[0].value;
      expect(mockWorker.terminate).toHaveBeenCalled();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle null inputs gracefully', async () => {
      const result = await Processor.compressImage(null as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle undefined inputs gracefully', async () => {
      const result = await Processor.generateQRCode(undefined as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide helpful error messages', async () => {
      const result = await Processor.processOCR(new ArrayBuffer(0), {
        language: 'invalid-lang',
      });

      // Should handle gracefully even if language is invalid
      expect(result).toBeDefined();
    });

    it('should handle large image data efficiently', async () => {
      const largeImageData = new ArrayBuffer(1000000); // 1MB

      const result = await Processor.compressImage(largeImageData);

      expect(result.success).toBe(true);
      expect(result.metrics.inputSize).toBe(1000000);
    });

    it('should handle concurrent processing', async () => {
      const promises = [
        Processor.compressImage(mockImageData),
        Processor.generateQRCode(testText),
        Processor.processOCR(mockImageData),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Convenience functions', () => {
    it('should work as convenience functions', async () => {
      const compressResult = await compressImage(mockImageData);
      const qrResult = await generateQRCode(testText);
      const ocrResult = await processOCR(mockImageData);

      expect(compressResult.success).toBe(true);
      expect(qrResult.success).toBe(true);
      expect(ocrResult.success).toBe(true);
    });
  });
});
