/**
 * NLP Testing Setup
 * Common configuration and utilities for NLP component testing
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { modelCache } from '../../../src/lib/nlp/infrastructure/model-cache';
import { performanceMonitor } from '../../../src/lib/nlp/infrastructure/performance-monitor';

// Test configuration
export const NLP_TEST_CONFIG = {
  // Sample texts for testing
  SAMPLE_TEXTS: {
    POSITIVE_SENTIMENT:
      'I love this amazing product! It works perfectly and exceeded all my expectations.',
    NEGATIVE_SENTIMENT:
      'This is terrible. The product broke after just one day and customer service was unhelpful.',
    NEUTRAL_SENTIMENT:
      'The product is a standard office chair with basic features and average quality.',
    MULTILINGUAL: {
      ENGLISH: 'Hello, how are you today?',
      SPANISH: 'Hola, ¿cómo estás hoy?',
      FRENCH: "Bonjour, comment allez-vous aujourd'hui?",
      GERMAN: 'Hallo, wie geht es Ihnen heute?',
      CHINESE: '你好，你今天好吗？',
      JAPANESE: 'こんにちは、今日はお元気ですか？',
    },
    ENTITIES:
      'Apple Inc. announced their new iPhone 14 in Cupertino, California on September 7, 2022, priced at $999.',
    LONG_TEXT: `
      Artificial Intelligence (AI) has revolutionized numerous industries in recent years.
      From healthcare to finance, AI applications are transforming how businesses operate
      and serve their customers. Machine learning algorithms can now analyze vast amounts
      of data to identify patterns and make predictions with unprecedented accuracy.
      Natural Language Processing, a subfield of AI, enables computers to understand,
      interpret, and generate human language. This technology powers virtual assistants,
      language translation services, and sentiment analysis tools that help businesses
      understand customer feedback. As AI continues to evolve, we can expect even more
      sophisticated applications that will further enhance our daily lives and business operations.
    `.trim(),
  },

  // Expected results for validation
  EXPECTED_RESULTS: {
    SENTIMENT: {
      POSITIVE: { overall: 'positive', minScore: 0.5 },
      NEGATIVE: { overall: 'negative', maxScore: -0.5 },
      NEUTRAL: { overall: 'neutral', minScore: -0.3, maxScore: 0.3 },
    },
    ENTITIES: {
      COUNT: 5, // Apple Inc., iPhone 14, Cupertino, California, September 7, 2022, $999
      TYPES: ['ORGANIZATION', 'PRODUCT', 'LOCATION', 'DATE', 'MONEY'],
    },
    LANGUAGES: {
      ENGLISH: { code: 'en', minConfidence: 0.8 },
      SPANISH: { code: 'es', minConfidence: 0.8 },
      FRENCH: { code: 'fr', minConfidence: 0.8 },
    },
  },

  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    MAX_PROCESSING_TIME: 3000, // 3 seconds
    MAX_MEMORY_USAGE: 50, // 50MB
    MIN_ACCURACY: 0.8, // 80%
    MAX_BATCH_SIZE: 100,
    MIN_CACHE_HIT_RATE: 0.7, // 70%
  },

  // Model configuration
  MODEL_CONFIG: {
    LANGUAGE_DETECTION: {
      MODEL_ID: 'fasttext-language-id',
      VERSION: '1.0.0',
    },
    SENTIMENT_ANALYSIS: {
      MODEL_ID: 'bert-sentiment-en',
      VERSION: '1.0.0',
    },
    ENTITY_RECOGNITION: {
      MODEL_ID: 'bert-ner-multilingual',
      VERSION: '1.0.0',
    },
  },
};

// Mock data generators
type SentimentLabel = 'positive' | 'negative' | 'neutral';

interface SentimentResult {
  overall: SentimentLabel;
  score: number;
  confidence: number;
}

interface ExpectedSentimentResult {
  overall?: SentimentLabel;
  minScore?: number;
  maxScore?: number;
}

interface EntityResult {
  text: string;
  type: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

interface LanguageResult {
  code: string;
  confidence: number;
}

interface ExpectedLanguageResult {
  code?: string;
  minConfidence?: number;
}

interface MockModelResponse<T> {
  data: T;
  confidence: number;
  processingTime: number;
  modelVersion: string;
}

export const MockDataGenerator = {
  /**
   * Generate random text of specified length
   */
  generateText(length: number): string {
    const words = [
      'the',
      'quick',
      'brown',
      'fox',
      'jumps',
      'over',
      'lazy',
      'dog',
      'artificial',
      'intelligence',
      'machine',
      'learning',
      'data',
      'science',
      'technology',
      'innovation',
      'research',
      'development',
      'algorithm',
      'model',
      'training',
      'prediction',
      'accuracy',
      'performance',
    ];
    const result: string[] = [];

    for (let i = 0; i < length; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }

    return result.join(' ');
  },

  /**
   * Generate sentiment-labeled text
   */
  generateSentimentText(sentiment: SentimentLabel, length = 50): string {
    const templates = {
      positive: [
        'amazing',
        'excellent',
        'wonderful',
        'perfect',
        'outstanding',
        'brilliant',
        'fantastic',
        'great',
        'love',
        'enjoy',
      ],
      negative: [
        'terrible',
        'awful',
        'horrible',
        'disappointing',
        'bad',
        'poor',
        'worst',
        'hate',
        'dislike',
        'frustrated',
      ],
      neutral: [
        'average',
        'standard',
        'typical',
        'normal',
        'regular',
        'ordinary',
        'common',
        'usual',
        'general',
        'basic',
      ],
    };

    const words = templates[sentiment];
    const result: string[] = [];

    for (let i = 0; i < length; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }

    return result.join(' ');
  },

  /**
   * Generate text with entities
   */
  generateEntityText(): string {
    const companies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla'];
    const locations = ['New York', 'San Francisco', 'London', 'Tokyo', 'Paris', 'Berlin'];
    const people = ['John Smith', 'Jane Doe', 'Robert Johnson', 'Mary Williams', 'James Brown'];
    const dates = ['January 1, 2023', 'March 15, 2023', 'July 4, 2023', 'December 25, 2023'];
    const money = ['$100', '$500', '$1000', '$5000', '$10000'];

    return `${companies[Math.floor(Math.random() * companies.length)]} announced a new product in ${locations[Math.floor(Math.random() * locations.length)]}. CEO ${people[Math.floor(Math.random() * people.length)]} stated on ${dates[Math.floor(Math.random() * dates.length)]} that the company invested ${money[Math.floor(Math.random() * money.length)]} in research.`;
  },

  /**
   * Generate multilingual text
   */
  generateMultilingualText(language: string): string {
    const texts: Record<string, string[]> = {
      en: ['Hello world', 'How are you?', 'Nice to meet you', 'Thank you very much'],
      es: ['Hola mundo', '¿Cómo estás?', 'Mucho gusto', 'Muchas gracias'],
      fr: ['Bonjour le monde', 'Comment allez-vous?', 'Ravi de vous rencontrer', 'Merci beaucoup'],
      de: ['Hallo Welt', 'Wie geht es Ihnen?', 'Schön, Sie kennenzulernen', 'Vielen Dank'],
      it: ['Ciao mondo', 'Come stai?', 'Piacere di conoscerti', 'Grazie mille'],
      pt: ['Olá mundo', 'Como vai?', 'Prazer em conhecer', 'Muito obrigado'],
      ja: ['こんにちは世界', 'お元気ですか？', 'お会いできて嬉しい', 'どうもありがとうございます'],
      zh: ['你好世界', '你好吗？', '很高兴见到你', '非常感谢'],
      ru: ['Привет мир', 'Как дела?', 'Рад встрече', 'Большое спасибо'],
      ar: ['مرحبا بالعالم', 'كيف حالك؟', 'سعيد بلقائك', 'شكرا جزيلا'],
    };

    const languageTexts = texts[language] || texts.en;
    return languageTexts[Math.floor(Math.random() * languageTexts.length)];
  },
};

// Test utilities
export const NLPTestUtils = {
  /**
   * Measure execution time of a function
   */
  async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    return { result, time };
  },

  /**
   * Assert performance thresholds
   */
  assertPerformance(time: number, threshold: number): void {
    expect(time).toBeLessThan(threshold);
  },

  /**
   * Assert accuracy thresholds
   */
  assertAccuracy(accuracy: number, threshold: number): void {
    expect(accuracy).toBeGreaterThanOrEqual(threshold);
  },

  /**
   * Create mock model response
   */
  createMockModelResponse<T>(data: T, confidence = 0.9): MockModelResponse<T> {
    return {
      data,
      confidence,
      processingTime: 100,
      modelVersion: 'test-1.0.0',
    };
  },

  /**
   * Wait for async operation with timeout
   */
  async waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
    const start = Date.now();

    while (!condition() && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!condition()) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
  },

  /**
   * Generate test batch
   */
  generateTestBatch(size: number, textGenerator: () => string): string[] {
    return Array.from({ length: size }, textGenerator);
  },
};

// Performance testing utilities
export const PerformanceTester = {
  /**
   * Run performance test with multiple iterations
   */
  async runPerformanceTest<T>(
    testName: string,
    fn: () => Promise<T>,
    iterations = 10,
    maxTime: number = NLP_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_PROCESSING_TIME
  ): Promise<void> {
    describe(`Performance: ${testName}`, () => {
      it(`should complete within ${maxTime}ms`, async () => {
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const { time } = await NLPTestUtils.measureTime(fn);
          times.push(time);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTimeObserved = Math.max(...times);

        expect(avgTime).toBeLessThan(maxTime);
        expect(maxTimeObserved).toBeLessThan(maxTime * 1.5); // Allow 50% variance

        console.log(`Performance - ${testName}:`);
        console.log(`  Average: ${avgTime.toFixed(2)}ms`);
        console.log(`  Max: ${maxTimeObserved.toFixed(2)}ms`);
        console.log(`  Min: ${Math.min(...times).toFixed(2)}ms`);
      });
    });
  },

  /**
   * Test memory usage
   */
  async testMemoryUsage<T>(
    testName: string,
    fn: () => Promise<T>,
    maxMemory: number = NLP_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE
  ): Promise<void> {
    describe(`Memory: ${testName}`, () => {
      it(`should use less than ${maxMemory}MB`, async () => {
        const memoryBefore = performanceMonitor.getCurrentMetrics().memoryUsage.used;

        await fn();

        const memoryAfter = performanceMonitor.getCurrentMetrics().memoryUsage.used;
        const memoryUsed = memoryAfter - memoryBefore;

        expect(memoryUsed).toBeLessThan(maxMemory);

        console.log(`Memory - ${testName}: ${memoryUsed.toFixed(2)}MB`);
      });
    });
  },
};

// Accuracy testing utilities
export const AccuracyTester = {
  /**
   * Test sentiment analysis accuracy
   */
  testSentimentAccuracy(actual: SentimentResult, expected: ExpectedSentimentResult): void {
    expect(actual).toHaveProperty('overall');
    expect(actual).toHaveProperty('score');
    expect(actual).toHaveProperty('confidence');

    if (expected.overall) {
      expect(actual.overall).toBe(expected.overall);
    }

    if (expected.minScore !== undefined) {
      expect(actual.score).toBeGreaterThanOrEqual(expected.minScore);
    }

    if (expected.maxScore !== undefined) {
      expect(actual.score).toBeLessThanOrEqual(expected.maxScore);
    }
  },

  /**
   * Test entity extraction accuracy
   */
  testEntityAccuracy(
    entities: EntityResult[],
    expectedCount: number,
    expectedTypes: string[]
  ): void {
    expect(entities).toBeInstanceOf(Array);
    expect(entities.length).toBeGreaterThanOrEqual(expectedCount);

    const foundTypes = entities.map((e) => e.type);
    for (const type of expectedTypes) {
      expect(foundTypes).toContain(type);
    }

    // Test entity structure
    for (const entity of entities) {
      expect(entity).toHaveProperty('text');
      expect(entity).toHaveProperty('type');
      expect(entity).toHaveProperty('startIndex');
      expect(entity).toHaveProperty('endIndex');
      expect(entity).toHaveProperty('confidence');
    }
  },

  /**
   * Test language detection accuracy
   */
  testLanguageAccuracy(detected: LanguageResult, expected: ExpectedLanguageResult): void {
    expect(detected).toHaveProperty('code');
    expect(detected).toHaveProperty('confidence');

    if (expected.code) {
      expect(detected.code).toBe(expected.code);
    }

    if (expected.minConfidence) {
      expect(detected.confidence).toBeGreaterThanOrEqual(expected.minConfidence);
    }
  },
};

// Global test setup and teardown
beforeEach(async () => {
  // Start performance monitoring for tests
  performanceMonitor.startMonitoring();

  // Clear any existing cache
  await modelCache.clear();

  // Reset performance metrics
  performanceMonitor.snapshots = [];
  performanceMonitor.alerts = [];
});

afterEach(async () => {
  // Stop performance monitoring
  performanceMonitor.stopMonitoring();

  // Clean up any remaining test data
  await modelCache.clear();
});

// Export utilities for use in test files
export { describe, it, expect, beforeEach, afterEach };

console.log('NLP Test Setup initialized');
