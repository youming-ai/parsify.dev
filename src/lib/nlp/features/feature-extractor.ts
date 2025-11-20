/**
 * Feature Extractor - Extracts text embeddings and linguistic features
 * Provides various feature extraction methods for NLP operations
 */

import * as tf from "@tensorflow/tfjs";
import {
  FeatureExtractionConfig,
  LinguisticFeatures,
  TextEmbedding,
  NGramFeatures,
  SyntacticFeatures,
} from "../types";
import { modelManager } from "../infrastructure/model-manager";

export interface FeatureExtractionOptions {
  includeEmbeddings?: boolean;
  includeLinguistic?: boolean;
  includeNGrams?: boolean;
  includeSyntactic?: boolean;
  embeddingModel?: string;
  embeddingDimension?: number;
  ngramSizes?: number[];
  includePos?: boolean;
  includeDependencies?: boolean;
  normalizeFeatures?: boolean;
}

export interface ExtractedFeatures {
  text: string;
  embeddings?: TextEmbedding;
  linguistic?: LinguisticFeatures;
  ngrams?: NGramFeatures;
  syntactic?: SyntacticFeatures;
  metadata: {
    extractionTime: number;
    featureCount: number;
    dimension?: number;
  };
}

export class FeatureExtractor {
  private config: FeatureExtractionConfig;
  private embeddingModel: tf.Model | null = null;
  private embeddingCache: Map<string, tf.Tensor> = new Map();

  constructor(config: Partial<FeatureExtractionConfig> = {}) {
    this.config = {
      defaultEmbeddingModel: "universal-sentence-encoder",
      embeddingDimension: 512,
      maxSequenceLength: 512,
      batchSize: 32,
      enableCaching: true,
      cacheSize: 1000,
      normalizeVectors: true,
      includePartOfSpeech: true,
      includeDependencies: true,
      ngramRange: [1, 3],
      minTokenFrequency: 2,
      maxFeatures: 10000,
      ...config,
    };
  }

  /**
   * Initialize the feature extractor
   */
  async initialize(): Promise<void> {
    try {
      // Load default embedding model
      this.embeddingModel = await modelManager.load(this.config.defaultEmbeddingModel);

      console.log("Feature Extractor initialized");
    } catch (error) {
      console.warn("Failed to load embedding model, using fallback:", error);
      // Initialize with fallback approach
    }
  }

  /**
   * Extract features from text
   */
  async extractFeatures(
    text: string,
    options: FeatureExtractionOptions = {},
  ): Promise<ExtractedFeatures> {
    const startTime = performance.now();
    const mergedOptions = { ...this.config, ...options };
    let featureCount = 0;

    const features: ExtractedFeatures = {
      text,
      metadata: {
        extractionTime: 0,
        featureCount: 0,
      },
    };

    try {
      // Extract embeddings
      if (mergedOptions.includeEmbeddings) {
        features.embeddings = await this.extractEmbeddings(text, mergedOptions);
        featureCount += features.embeddings.dimension || 0;
      }

      // Extract linguistic features
      if (mergedOptions.includeLinguistic) {
        features.linguistic = this.extractLinguisticFeatures(text);
        featureCount += this.countLinguisticFeatures(features.linguistic);
      }

      // Extract n-gram features
      if (mergedOptions.includeNGrams) {
        features.ngrams = this.extractNGramFeatures(text, mergedOptions);
        featureCount += features.ngrams.totalNGrams;
      }

      // Extract syntactic features
      if (mergedOptions.includeSyntactic) {
        features.syntactic = this.extractSyntacticFeatures(text, mergedOptions);
        featureCount += this.countSyntacticFeatures(features.syntactic);
      }

      const extractionTime = performance.now() - startTime;

      features.metadata = {
        extractionTime,
        featureCount,
        dimension: features.embeddings?.dimension,
      };

      return features;
    } catch (error) {
      throw new Error(`Feature extraction failed: ${error}`);
    }
  }

  /**
   * Extract text embeddings
   */
  async extractEmbeddings(
    text: string,
    options: FeatureExtractionOptions = {},
  ): Promise<TextEmbedding> {
    const startTime = performance.now();
    const mergedOptions = { ...this.config, ...options };

    // Check cache first
    if (mergedOptions.enableCaching && this.embeddingCache.has(text)) {
      const cached = this.embeddingCache.get(text)!;
      return {
        vector: await cached.array(),
        dimension: cached.shape[1],
        model: mergedOptions.embeddingModel || this.config.defaultEmbeddingModel,
        normalized: mergedOptions.normalizeVectors,
        cacheHit: true,
        extractionTime: performance.now() - startTime,
      };
    }

    try {
      let embeddings: tf.Tensor;

      if (this.embeddingModel) {
        // Use loaded TensorFlow model
        embeddings = await this.extractWithModel(text);
      } else {
        // Use fallback embedding extraction
        embeddings = await this.extractFallbackEmbeddings(text);
      }

      // Normalize if requested
      if (mergedOptions.normalizeVectors) {
        embeddings = tf.linalg.normalize(embeddings, 2);
      }

      const vector = await embeddings.array();
      const dimension = embeddings.shape[1];

      // Cache the result
      if (mergedOptions.enableCaching) {
        this.embeddingCache.set(text, embeddings.clone());
        this.manageCacheSize();
      }

      embeddings.dispose();

      return {
        vector: Array.isArray(vector) ? vector[0] : vector,
        dimension,
        model: mergedOptions.embeddingModel || this.config.defaultEmbeddingModel,
        normalized: mergedOptions.normalizeVectors,
        cacheHit: false,
        extractionTime: performance.now() - startTime,
      };
    } catch (error) {
      throw new Error(`Embedding extraction failed: ${error}`);
    }
  }

  /**
   * Extract linguistic features
   */
  extractLinguisticFeatures(text: string): LinguisticFeatures {
    const words = this.tokenize(text);
    const sentences = this.segmentSentences(text);

    return {
      wordCount: words.length,
      characterCount: text.length,
      sentenceCount: sentences.length,
      averageWordLength: this.calculateAverageWordLength(words),
      averageSentenceLength: words.length / Math.max(sentences.length, 1),
      vocabularySize: new Set(words.map((w) => w.toLowerCase())).size,
      typeTokenRatio: this.calculateTypeTokenRatio(words),
      readabilityScore: this.calculateReadabilityScore(text),
      complexity: this.calculateComplexity(text),
      formalScore: this.calculateFormalityScore(text),
      emotionalTone: this.analyzeEmotionalTone(text),
      punctuationCount: (text.match(/[.,!?;:'"]/g) || []).length,
      numberCount: (text.match(/\b\d+\.?\d*\b/g) || []).length,
      urlCount: (text.match(/https?:\/\/[^\s]+/g) || []).length,
      emailCount: (text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []).length,
    };
  }

  /**
   * Extract n-gram features
   */
  extractNGramFeatures(text: string, options: FeatureExtractionOptions = {}): NGramFeatures {
    const mergedOptions = { ...this.config, ...options };
    const words = this.tokenize(text).map((w) => w.toLowerCase());
    const ngramSizes = mergedOptions.ngramSizes || [1, 2, 3];

    const ngrams: Record<number, { gram: string; count: number }[]> = {};
    let totalNGrams = 0;

    for (const n of ngramSizes) {
      const grams = this.extractNGrams(words, n, mergedOptions.minTokenFrequency);
      ngrams[n] = grams;
      totalNGrams += grams.length;
    }

    return {
      ngramSizes,
      ngrams,
      totalNGrams,
      vocabularySize: new Set(words).size,
      uniqueNGrams: totalNGrams,
      tfidfScores: this.calculateTFIDF(words, ngrams),
    };
  }

  /**
   * Extract syntactic features
   */
  extractSyntacticFeatures(
    text: string,
    options: FeatureExtractionOptions = {},
  ): SyntacticFeatures {
    const words = this.tokenize(text);
    const sentences = this.segmentSentences(text);

    return {
      sentenceCount: sentences.length,
      clauseCount: this.countClauses(sentences),
      phraseCount: this.countPhrases(words),
      partOfSpeechDistribution: options.includePos ? this.analyzePartOfSpeech(words) : {},
      dependencyRelations: options.includeDependencies ? this.analyzeDependencies(words) : {},
      sentenceStructures: this.analyzeSentenceStructures(sentences),
      complexityMetrics: {
        averageSentenceLength: words.length / Math.max(sentences.length, 1),
        averageClauseLength: words.length / Math.max(this.countClauses(sentences), 1),
        subordinationRatio: this.calculateSubordinationRatio(sentences),
        coordinationRatio: this.calculateCoordinationRatio(sentences),
      },
    };
  }

  /**
   * Batch extract features from multiple texts
   */
  async extractFeaturesBatch(
    texts: string[],
    options: FeatureExtractionOptions = {},
  ): Promise<ExtractedFeatures[]> {
    const mergedOptions = { ...this.config, ...options };

    if (mergedOptions.includeEmbeddings && this.embeddingModel) {
      // Process embeddings in batches for better performance
      const embeddingBatchSize = mergedOptions.batchSize || 32;
      const results: ExtractedFeatures[] = [];

      for (let i = 0; i < texts.length; i += embeddingBatchSize) {
        const batch = texts.slice(i, i + embeddingBatchSize);
        const batchFeatures = await Promise.all(
          batch.map((text) => this.extractFeatures(text, options)),
        );
        results.push(...batchFeatures);
      }

      return results;
    } else {
      // Process individually for other features
      return Promise.all(texts.map((text) => this.extractFeatures(text, options)));
    }
  }

  /**
   * Calculate similarity between two feature sets
   */
  calculateSimilarity(
    features1: ExtractedFeatures,
    features2: ExtractedFeatures,
  ): {
    cosineSimilarity: number;
    euclideanDistance: number;
    manhattanDistance: number;
    jaccardSimilarity: number;
  } {
    let cosineSimilarity = 0;
    let euclideanDistance = 0;
    let manhattanDistance = 0;
    let jaccardSimilarity = 0;

    // Embedding similarity
    if (features1.embeddings && features2.embeddings) {
      const vec1 = features1.embeddings.vector;
      const vec2 = features2.embeddings.vector;

      if (vec1.length === vec2.length) {
        cosineSimilarity = this.cosineSimilarity(vec1, vec2);
        euclideanDistance = this.euclideanDistance(vec1, vec2);
        manhattanDistance = this.manhattanDistance(vec1, vec2);
      }
    }

    // Jaccard similarity for n-grams
    if (features1.ngrams && features2.ngrams) {
      const set1 = new Set(
        Object.values(features1.ngrams).flatMap((ngrams) => ngrams.map((g) => g.gram)),
      );
      const set2 = new Set(
        Object.values(features2.ngrams).flatMap((ngrams) => ngrams.map((g) => g.gram)),
      );

      const intersection = new Set([...set1].filter((x) => set2.has(x)));
      const union = new Set([...set1, ...set2]);

      jaccardSimilarity = intersection.size / union.size;
    }

    return {
      cosineSimilarity,
      euclideanDistance,
      manhattanDistance,
      jaccardSimilarity,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FeatureExtractionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get configuration
   */
  getConfig(): FeatureExtractionConfig {
    return { ...this.config };
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.forEach((tensor) => tensor.dispose());
    this.embeddingCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.embeddingCache.size,
      maxSize: this.config.cacheSize,
    };
  }

  /**
   * Private helper methods
   */
  private async extractWithModel(text: string): Promise<tf.Tensor> {
    if (!this.embeddingModel) {
      throw new Error("No embedding model loaded");
    }

    // Preprocess text for the model
    const preprocessed = this.preprocessForModel(text);

    // Create input tensor
    const input = tf.tensor([preprocessed]);

    try {
      const embeddings = this.embeddingModel.predict(input) as tf.Tensor;
      return embeddings;
    } finally {
      input.dispose();
    }
  }

  private async extractFallbackEmbeddings(text: string): Promise<tf.Tensor> {
    // Simple fallback embedding based on character n-grams
    const chars = text.toLowerCase().split("");
    const vocab = new Set(chars);
    const vocabArray = Array.from(vocab);

    // Create simple character-level embedding
    const charToIndex = new Map(vocabArray.map((char, index) => [char, index]));
    const indices = chars.map((char) => charToIndex.get(char) || 0);

    // Create one-hot encoded tensor (simplified approach)
    const embedding = tf.oneHot(tf.tensor1d(indices, "int32"), vocabArray.length);

    // Reduce to a fixed-size vector using averaging
    const meanEmbedding = tf.mean(embedding, 0);

    embedding.dispose();

    return meanEmbedding.expandDims(0);
  }

  private preprocessForModel(text: string): string {
    // Basic preprocessing for embedding models
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, this.config.maxSequenceLength);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  private segmentSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  }

  private calculateAverageWordLength(words: string[]): number {
    if (words.length === 0) return 0;
    return words.reduce((sum, word) => sum + word.length, 0) / words.length;
  }

  private calculateTypeTokenRatio(words: string[]): number {
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  private calculateReadabilityScore(text: string): number {
    const words = this.tokenize(text);
    const sentences = this.segmentSentences(text);

    if (words.length === 0 || sentences.length === 0) return 0;

    // Simplified Flesch Reading Ease formula
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = this.calculateAverageSyllables(words);

    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    return Math.max(0, Math.min(100, score));
  }

  private calculateAverageSyllables(words: string[]): number {
    return words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
  }

  private countSyllables(word: string): number {
    const vowels = "aeiouy";
    let count = 0;
    let prevWasVowel = false;

    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevWasVowel) {
        count++;
      }
      prevWasVowel = isVowel;
    }

    return Math.max(1, count);
  }

  private calculateComplexity(text: string): number {
    const words = this.tokenize(text);
    const sentences = this.segmentSentences(text);

    // Complexity based on average sentence length and vocabulary diversity
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    const vocabDiversity = new Set(words).size / words.length;

    return (avgSentenceLength / 20) * 0.7 + vocabDiversity * 30 * 0.3;
  }

  private calculateFormalityScore(text: string): number {
    const formalWords = [
      "therefore",
      "however",
      "nevertheless",
      "furthermore",
      "consequently",
      "moreover",
    ];
    const informalWords = ["gonna", "wanna", "gotta", "kinda", "sorta", "yeah", "nah", "cool"];

    const words = this.tokenize(text);
    const formalCount = words.filter((word) => formalWords.includes(word)).length;
    const informalCount = words.filter((word) => informalWords.includes(word)).length;

    return Math.max(0, Math.min(1, (formalCount - informalCount) / Math.max(formalCount, 1)));
  }

  private analyzeEmotionalTone(text: string): {
    positive: number;
    negative: number;
    neutral: number;
  } {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "wonderful",
      "amazing",
      "fantastic",
      "love",
      "happy",
      "joy",
      "success",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "horrible",
      "hate",
      "sad",
      "angry",
      "fail",
      "wrong",
      "poor",
    ];

    const words = this.tokenize(text);
    const positiveCount = words.filter((word) => positiveWords.includes(word)).length;
    const negativeCount = words.filter((word) => negativeWords.includes(word)).length;
    const neutralCount = words.length - positiveCount - negativeCount;

    return {
      positive: positiveCount / words.length,
      negative: negativeCount / words.length,
      neutral: neutralCount / words.length,
    };
  }

  private extractNGrams(
    words: string[],
    n: number,
    minFrequency: number,
  ): { gram: string; count: number }[] {
    const ngrams: Map<string, number> = new Map();

    for (let i = 0; i <= words.length - n; i++) {
      const gram = words.slice(i, i + n).join(" ");
      ngrams.set(gram, (ngrams.get(gram) || 0) + 1);
    }

    return Array.from(ngrams.entries())
      .filter(([_, count]) => count >= minFrequency)
      .map(([gram, count]) => ({ gram, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateTFIDF(
    words: string[],
    ngrams: Record<number, { gram: string; count: number }[]>,
  ): Record<string, number> {
    const tfidf: Record<string, number> = {};
    const totalDocuments = 1; // Simplified
    const docFrequency = new Map<string, number>();

    // Calculate term frequency
    for (const n in ngrams) {
      ngrams[n].forEach(({ gram, count }) => {
        docFrequency.set(gram, 1);
        tfidf[gram] = count;
      });
    }

    // Calculate TF-IDF
    for (const [gram, count] of docFrequency) {
      const tf = tfidf[gram] / words.length;
      const idf = Math.log(totalDocuments / count);
      tfidf[gram] = tf * idf;
    }

    return tfidf;
  }

  private countClauses(sentences: string[]): number {
    // Simplified clause counting based on conjunctions
    const clauseMarkers = [
      "and",
      "but",
      "or",
      "nor",
      "for",
      "so",
      "yet",
      "because",
      "since",
      "although",
      "while",
      "if",
    ];

    return sentences.reduce((count, sentence) => {
      const markers = sentence
        .split(/\s+/)
        .filter((word) => clauseMarkers.includes(word.toLowerCase())).length;
      return count + Math.max(1, markers + 1);
    }, 0);
  }

  private countPhrases(words: string[]): number {
    // Simplified phrase counting (2-word combinations)
    let phraseCount = 0;
    for (let i = 0; i < words.length - 1; i++) {
      if (this.isNoun(words[i]) && this.isNoun(words[i + 1])) {
        phraseCount++;
      }
    }
    return phraseCount;
  }

  private isNoun(word: string): boolean {
    // Simplified noun detection
    return (
      word.length > 3 &&
      !["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"].includes(word)
    );
  }

  private analyzePartOfSpeech(words: string[]): Record<string, number> {
    // Simplified POS tagging
    const posDistribution: Record<string, number> = {
      noun: 0,
      verb: 0,
      adjective: 0,
      adverb: 0,
      preposition: 0,
      conjunction: 0,
      pronoun: 0,
      determiner: 0,
      other: 0,
    };

    words.forEach((word) => {
      if (this.isNoun(word)) {
        posDistribution.noun++;
      } else if (this.isVerb(word)) {
        posDistribution.verb++;
      } else if (this.isAdjective(word)) {
        posDistribution.adjective++;
      } else if (this.isAdverb(word)) {
        posDistribution.adverb++;
      } else {
        posDistribution.other++;
      }
    });

    return posDistribution;
  }

  private isVerb(word: string): boolean {
    const verbEndings = ["ed", "ing", "s", "es"];
    return verbEndings.some((ending) => word.endsWith(ending)) && word.length > 3;
  }

  private isAdjective(word: string): boolean {
    const adjectiveEndings = ["ful", "less", "ous", "able", "ive", "al"];
    return adjectiveEndings.some((ending) => word.endsWith(ending)) && word.length > 4;
  }

  private isAdverb(word: string): boolean {
    const adverbEndings = ["ly"];
    return adverbEndings.some((ending) => word.endsWith(ending)) && word.length > 4;
  }

  private analyzeDependencies(words: string[]): Record<string, number> {
    // Simplified dependency analysis
    return {
      subject: 1,
      object: 1,
      predicate: 1,
      modifier: words.length - 3,
    };
  }

  private analyzeSentenceStructures(sentences: string[]): {
    simple: number;
    compound: number;
    complex: number;
    compoundComplex: number;
  } {
    return {
      simple: Math.floor(sentences.length * 0.6),
      compound: Math.floor(sentences.length * 0.2),
      complex: Math.floor(sentences.length * 0.15),
      compoundComplex: Math.ceil(sentences.length * 0.05),
    };
  }

  private calculateSubordinationRatio(sentences: string[]): number {
    const complexSentences = sentences.filter(
      (s) =>
        s.includes("because") || s.includes("although") || s.includes("while") || s.includes("if"),
    ).length;

    return complexSentences / Math.max(sentences.length, 1);
  }

  private calculateCoordinationRatio(sentences: string[]): number {
    const compoundSentences = sentences.filter(
      (s) =>
        s.includes(" and ") || s.includes(" or ") || s.includes(" but ") || s.includes(" nor "),
    ).length;

    return compoundSentences / Math.max(sentences.length, 1);
  }

  private countLinguisticFeatures(features: LinguisticFeatures): number {
    return 15; // Fixed number of linguistic features
  }

  private countSyntacticFeatures(features: SyntacticFeatures): number {
    return features.partOfSpeechDistribution
      ? Object.keys(features.partOfSpeechDistribution).length
      : 0;
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
    const norm2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));

    return dotProduct / (norm1 * norm2);
  }

  private euclideanDistance(vec1: number[], vec2: number[]): number {
    return Math.sqrt(vec1.reduce((sum, a, i) => sum + Math.pow(a - vec2[i], 2), 0));
  }

  private manhattanDistance(vec1: number[], vec2: number[]): number {
    return vec1.reduce((sum, a, i) => sum + Math.abs(a - vec2[i]), 0);
  }

  private manageCacheSize(): void {
    if (this.embeddingCache.size > this.config.cacheSize) {
      const entries = Array.from(this.embeddingCache.entries());
      const toRemove = entries.slice(0, entries.length - this.config.cacheSize);

      toRemove.forEach(([_, tensor]) => tensor.dispose());
      toRemove.forEach(([key, _]) => this.embeddingCache.delete(key));
    }
  }
}

// Export singleton instance
export const featureExtractor = new FeatureExtractor();
