/**
 * Image Processing Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertImage, toPNG, toJPEG, getImageDimensions } from '../image-convert';
import { resizeImage, resizeByWidth, cropToSquare } from '../image-resize';
import { extractTextFromImage, validateOCROptions } from '../image-ocr';

// Mock DOM APIs
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    toBlob: vi.fn((callback) => {
      callback(new Blob(['mock image data'], { type: 'image/png' }));
    }),
  })),
  toBlob: vi.fn((callback) => {
    callback(new Blob(['mock image data'], { type: 'image/png' }));
  }),
};

const mockImage = {
  width: 800,
  height: 600,
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
};

// Mock global functions
global.Image = vi.fn(() => mockImage) as any;
global.document = {
  createElement: vi.fn(() => mockCanvas),
} as any;
global.URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn(),
} as any;
global.FileReader = vi.fn(() => ({
  readAsDataURL: vi.fn(),
  onload: null,
})) as any;
global.Blob = vi.fn((data, options) => ({ data, ...options })) as any;

describe('Image Convert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert image to PNG', async () => {
    const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

    const result = await convertImage({
      file: mockFile,
      format: 'png',
      width: 400,
      height: 300,
    });

    expect(global.Image).toHaveBeenCalled();
    expect(global.document.createElement).toHaveBeenCalledWith('canvas');
    expect(result.success).toBe(true);
  });

  it('should convert image to JPEG with quality', async () => {
    const mockFile = new File(['image data'], 'test.png', { type: 'image/png' });

    const result = await toJPEG(mockFile, 0.8, 400, 300);

    expect(mockCanvas.getContext().toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.8
    );
    expect(result.success).toBe(true);
  });

  it('should get image dimensions', async () => {
    const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

    const dimensions = await getImageDimensions(mockFile);

    expect(dimensions).toEqual({ width: 800, height: 600 });
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });
});

describe('Image Resize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resize image maintaining aspect ratio', async () => {
    const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

    const result = await resizeImage({
      file: mockFile,
      width: 400,
      maintainAspectRatio: true,
    });

    expect(result.success).toBe(true);
    expect(result.newSize?.width).toBe(400);
    expect(result.newSize?.height).toBe(300); // 600 * (400/800)
  });

  it('should resize image by width', async () => {
    const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

    const result = await resizeByWidth(mockFile, 400);

    expect(result.success).toBe(true);
    expect(result.newSize?.width).toBe(400);
    expect(result.newSize?.height).toBe(300);
  });

  it('should crop image to square', async () => {
    const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

    const result = await cropToSquare(mockFile);

    expect(result.success).toBe(true);
    expect(result.newSize?.width).toBe(600); // Min(800, 600)
    expect(result.newSize?.height).toBe(600);
  });
});

describe('Image OCR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate OCR options', () => {
    const validOptions = {
      file: new File(['image data'], 'test.jpg', { type: 'image/jpeg' }),
      confidence: 85,
    };

    const errors = validateOCROptions(validOptions);
    expect(errors).toHaveLength(0);
  });

  it('should detect invalid OCR options', () => {
    const invalidOptions = {
      file: new File(['text data'], 'test.txt', { type: 'text/plain' }),
      confidence: 150, // Invalid: > 100
    };

    const errors = validateOCROptions(invalidOptions);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('image'))).toBe(true);
    expect(errors.some(e => e.includes('confidence'))).toBe(true);
  });

  it('should extract text from image (placeholder)', async () => {
    const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

    const result = await extractTextFromImage({
      file: mockFile,
      languages: ['eng'],
      confidence: 80,
    });

    expect(result.success).toBe(true);
    expect(result.text).toContain('placeholder');
    expect(result.confidence).toBe(85.5);
    expect(typeof result.processingTime).toBe('number');
  });
});
