import { describe, expect, it } from 'bun:test';
import { normalizeForDet, normalizeForRec, resizeImage } from '~/lib/ocr/preprocessor';

describe('resizeImage', () => {
  it('returns dimensions unchanged if within maxDimension', () => {
    const result = resizeImage(800, 600, 960);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.scale).toBe(1);
  });

  it('scales down wide images to maxDimension', () => {
    const result = resizeImage(1920, 1080, 960);
    expect(result.width).toBe(960);
    expect(result.height).toBe(544); // 1080 * 0.5 = 540, rounded to 544 (multiple of 32)
    expect(result.scale).toBeCloseTo(0.5);
  });

  it('scales down tall images to maxDimension', () => {
    const result = resizeImage(1080, 1920, 960);
    expect(result.width).toBe(544); // 1080 * 0.5 = 540, rounded to 544 (multiple of 32)
    expect(result.height).toBe(960);
    expect(result.scale).toBeCloseTo(0.5);
  });

  it('rounds dimensions to multiples of 32', () => {
    const result = resizeImage(1000, 750, 960);
    expect(result.width % 32).toBe(0);
    expect(result.height % 32).toBe(0);
  });
});

describe('normalizeForDet', () => {
  it('normalizes pixel values to [0, 1] range', () => {
    const input = new Float32Array([0, 128, 255, 0, 128, 255, 0, 128, 255]);
    const result = normalizeForDet(input);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(128 / 255);
    expect(result[2]).toBeCloseTo(1);
  });

  it('applies mean and std normalization', () => {
    const input = new Float32Array([127.5, 127.5, 127.5]);
    const result = normalizeForDet(input, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);
    // After /255: [0.5, 0.5, 0.5]
    // After (x - mean) / std: [(0.5-0.485)/0.229, (0.5-0.456)/0.224, (0.5-0.406)/0.225]
    expect(result[0]).toBeCloseTo((0.5 - 0.485) / 0.229, 3);
    expect(result[1]).toBeCloseTo((0.5 - 0.456) / 0.224, 3);
    expect(result[2]).toBeCloseTo((0.5 - 0.406) / 0.225, 3);
  });
});

describe('normalizeForRec', () => {
  it('resizes to fixed height 48 and normalizes', () => {
    const input = new Float32Array(100 * 32 * 3); // 100x32 image, 3 channels
    const result = normalizeForRec(input, 100, 32, 48);
    // Output height should be 48
    expect(result.height).toBe(48);
  });
});
