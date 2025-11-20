/**
 * Text Preprocessor
 * Comprehensive text preprocessing pipeline for NLP operations
 */

import { PreprocessingInfo, LanguageInfo, NLPConfig } from "../types";

export interface PreprocessorConfig {
  normalizeText: boolean;
  removeStopwords: boolean;
  stemWords: boolean;
  lemmatize: boolean;
  lowercaseText: boolean;
  removePunctuation: boolean;
  removeNumbers: boolean;
  removeExtraWhitespace: boolean;
  expandContractions: boolean;
  correctSpelling: boolean;
  minWordLength: number;
  maxWordLength: number;
  customStopwords: string[];
  preserveEntities: boolean;
  preserveCase: boolean;
  unicodeNormalization: "NFC" | "NFD" | "NFKC" | "NFKD";
  tokenPattern: string;
}

export interface Token {
  text: string;
  startIndex: number;
  endIndex: number;
  type: TokenType;
  lemma?: string;
  stem?: string;
  pos?: PartOfSpeech;
  entity?: EntityInfo;
  metadata?: Record<string, any>;
}

export type TokenType =
  | "word"
  | "punctuation"
  | "number"
  | "whitespace"
  | "entity"
  | "url"
  | "email"
  | "hashtag"
  | "mention"
  | "emoji"
  | "symbol"
  | "unknown";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "determiner"
  | "auxiliary"
  | "particle"
  | "noun_phrase"
  | "verb_phrase"
  | "adjective_phrase"
  | "unknown";

export interface EntityInfo {
  type: string;
  text: string;
  confidence: number;
}

export interface PreprocessedText {
  original: string;
  processed: string;
  tokens: Token[];
  sentences: Sentence[];
  language?: LanguageInfo;
  statistics: TextStatistics;
  metadata: Record<string, any>;
}

export interface Sentence {
  text: string;
  startIndex: number;
  endIndex: number;
  tokens: Token[];
  sentiment?: number;
  complexity?: number;
}

export interface TextStatistics {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageCharactersPerWord: number;
  uniqueWords: number;
  stopWordCount: number;
  punctuationCount: number;
  numberCount: number;
  urlCount: number;
  emailCount: number;
  hashtagCount: number;
  mentionCount: number;
  emojiCount: number;
}

export interface LanguageDetectionResult {
  language: LanguageInfo;
  confidence: number;
  alternatives: LanguageInfo[];
}

export class TextPreprocessor {
  private config: PreprocessorConfig;
  private stopWords: Set<string> = new Set();
  private contractions: Map<string, string> = new Map();
  private punctuationRegex: RegExp;
  private urlRegex: RegExp;
  private emailRegex: RegExp;
  private hashtagRegex: RegExp;
  private mentionRegex: RegExp;
  private emojiRegex: RegExp;

  constructor(config: Partial<PreprocessorConfig> = {}) {
    this.config = {
      normalizeText: true,
      removeStopwords: false,
      stemWords: false,
      lemmatize: false,
      lowercaseText: true,
      removePunctuation: false,
      removeNumbers: false,
      removeExtraWhitespace: true,
      expandContractions: false,
      correctSpelling: false,
      minWordLength: 1,
      maxWordLength: 100,
      customStopwords: [],
      preserveEntities: false,
      preserveCase: false,
      unicodeNormalization: "NFC",
      tokenPattern: "\\w+|[^\\w\\s]",
      ...config,
    };

    this.initializePatterns();
    this.initializeStopWords();
    this.initializeContractions();
  }

  /**
   * Process text with full preprocessing pipeline
   */
  async process(
    text: string,
    options: Partial<PreprocessorConfig> = {},
  ): Promise<PreprocessedText> {
    const config = { ...this.config, ...options };

    let processedText = text;
    const originalText = text;

    // Step 1: Unicode normalization
    if (config.normalizeText) {
      processedText = processedText.normalize(config.unicodeNormalization);
    }

    // Step 2: Expand contractions
    if (config.expandContractions) {
      processedText = this.expandContractions(processedText);
    }

    // Step 3: Tokenization
    const tokens = this.tokenize(processedText, config);

    // Step 4: Apply token-level transformations
    const processedTokens = this.processTokens(tokens, config);

    // Step 5: Sentence segmentation
    const sentences = this.segmentSentences(processedTokens, originalText);

    // Step 6: Reconstruct processed text
    if (config.removePunctuation || config.removeNumbers || config.removeExtraWhitespace) {
      processedText = this.reconstructText(processedTokens, config);
    }

    // Step 7: Calculate statistics
    const statistics = this.calculateStatistics(processedTokens, sentences);

    return {
      original: originalText,
      processed: processedText,
      tokens: processedTokens,
      sentences,
      statistics,
      metadata: {
        config,
        processingTime: Date.now(),
        version: "1.0.0",
      },
    };
  }

  /**
   * Simple tokenization
   */
  tokenize(text: string, config: Partial<PreprocessorConfig> = {}): Token[] {
    const mergedConfig = { ...this.config, ...config };
    const tokens: Token[] = [];

    // Use regex for basic tokenization
    const regex = new RegExp(mergedConfig.tokenPattern, "g");
    let match;

    while ((match = regex.exec(text)) !== null) {
      const tokenText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + tokenText.length;

      const token: Token = {
        text: tokenText,
        startIndex,
        endIndex,
        type: this.classifyToken(tokenText),
      };

      tokens.push(token);
    }

    return tokens;
  }

  /**
   * Apply token-level processing
   */
  processTokens(tokens: Token[], config: Partial<PreprocessorConfig> = {}): Token[] {
    const mergedConfig = { ...this.config, ...config };
    let processedTokens = [...tokens];

    // Convert to lowercase
    if (mergedConfig.lowercaseText) {
      processedTokens = processedTokens.map((token) => ({
        ...token,
        text: token.text.toLowerCase(),
      }));
    }

    // Remove stop words
    if (mergedConfig.removeStopwords) {
      const stopWords = new Set([...this.stopWords, ...mergedConfig.customStopwords]);
      processedTokens = processedTokens.filter(
        (token) => token.type !== "word" || !stopWords.has(token.text.toLowerCase()),
      );
    }

    // Filter by word length
    processedTokens = processedTokens.filter((token) => {
      if (token.type !== "word") return true;
      const length = token.text.length;
      return length >= mergedConfig.minWordLength && length <= mergedConfig.maxWordLength;
    });

    // Apply stemming
    if (mergedConfig.stemWords) {
      processedTokens = processedTokens.map((token) => ({
        ...token,
        stem: token.type === "word" ? this.stem(token.text) : undefined,
      }));
    }

    // Apply lemmatization
    if (mergedConfig.lemmatize) {
      processedTokens = processedTokens.map((token) => ({
        ...token,
        lemma: token.type === "word" ? this.lemmatize(token.text) : undefined,
      }));
    }

    return processedTokens;
  }

  /**
   * Segment text into sentences
   */
  segmentSentences(tokens: Token[], originalText: string): Sentence[] {
    const sentences: Sentence[] = [];
    let currentSentenceTokens: Token[] = [];
    let sentenceStart = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      currentSentenceTokens.push(token);

      // Check for sentence boundaries
      if (this.isSentenceBoundary(token, tokens, i)) {
        const sentenceText = originalText.substring(sentenceStart, token.endIndex);

        sentences.push({
          text: sentenceText,
          startIndex: sentenceStart,
          endIndex: token.endIndex,
          tokens: [...currentSentenceTokens],
        });

        currentSentenceTokens = [];
        sentenceStart = token.endIndex;
      }
    }

    // Add final sentence if there are remaining tokens
    if (currentSentenceTokens.length > 0) {
      const sentenceText = originalText.substring(sentenceStart);
      sentences.push({
        text: sentenceText,
        startIndex: sentenceStart,
        endIndex: originalText.length,
        tokens: currentSentenceTokens,
      });
    }

    return sentences;
  }

  /**
   * Reconstruct text from processed tokens
   */
  reconstructText(tokens: Token[], config: Partial<PreprocessorConfig> = {}): string {
    const mergedConfig = { ...this.config, ...config };

    return tokens
      .filter((token) => {
        if (mergedConfig.removePunctuation && token.type === "punctuation") return false;
        if (mergedConfig.removeNumbers && token.type === "number") return false;
        return true;
      })
      .map((token) => token.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Calculate text statistics
   */
  calculateStatistics(tokens: Token[], sentences: Sentence[]): TextStatistics {
    const wordTokens = tokens.filter((token) => token.type === "word");
    const uniqueWords = new Set(wordTokens.map((token) => token.text.toLowerCase()));
    const stopWords = wordTokens.filter((token) => this.stopWords.has(token.text.toLowerCase()));

    return {
      characterCount: tokens.reduce((sum, token) => sum + token.text.length, 0),
      wordCount: wordTokens.length,
      sentenceCount: sentences.length,
      paragraphCount: this.countParagraphs(sentences),
      averageWordsPerSentence: sentences.length > 0 ? wordTokens.length / sentences.length : 0,
      averageCharactersPerWord:
        wordTokens.length > 0
          ? wordTokens.reduce((sum, token) => sum + token.text.length, 0) / wordTokens.length
          : 0,
      uniqueWords: uniqueWords.size,
      stopWordCount: stopWords.length,
      punctuationCount: tokens.filter((token) => token.type === "punctuation").length,
      numberCount: tokens.filter((token) => token.type === "number").length,
      urlCount: tokens.filter((token) => token.type === "url").length,
      emailCount: tokens.filter((token) => token.type === "email").length,
      hashtagCount: tokens.filter((token) => token.type === "hashtag").length,
      mentionCount: tokens.filter((token) => token.type === "mention").length,
      emojiCount: tokens.filter((token) => token.type === "emoji").length,
    };
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    // Basic language detection based on character patterns
    const patterns = {
      en: /^[a-zA-Z\s.,!?;:'"-]+$/,
      es: /^[a-zA-ZñáéíóúüÁÉÍÓÚÜÑ\s.,!?;:'"-]+$/,
      fr: /^[a-zA-ZàâäçéèêëïîôöùûüÿæœÀÂÄÇÉÈÊËÏÎÔÖÙÛÜŸÆŒ\s.,!?;:'"-]+$/,
      de: /^[a-zA-ZäöüßÄÖÜ\s.,!?;:'"-]+$/,
      zh: /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ar: /[\u0600-\u06ff]/,
      ru: /[\u0400-\u04ff]/,
    };

    let detectedLanguage = "en";
    let maxMatches = 0;

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = (text.match(pattern) || []).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLanguage = lang;
      }
    }

    const languageInfo: LanguageInfo = {
      code: detectedLanguage,
      name: this.getLanguageName(detectedLanguage),
      confidence: maxMatches / text.length,
      script: this.getScript(detectedLanguage),
    };

    return {
      language: languageInfo,
      confidence: languageInfo.confidence,
      alternatives: [],
    };
  }

  /**
   * Validate preprocessing configuration
   */
  validateConfig(config: Partial<PreprocessorConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.minWordLength && config.minWordLength < 1) {
      errors.push("minWordLength must be at least 1");
    }

    if (config.maxWordLength && config.maxWordLength < config.minWordLength) {
      errors.push("maxWordLength must be greater than minWordLength");
    }

    if (config.tokenPattern && !this.isValidRegex(config.tokenPattern)) {
      errors.push("tokenPattern is not a valid regular expression");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): PreprocessorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PreprocessorConfig>): void {
    const validation = this.validateConfig(newConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    this.config = { ...this.config, ...newConfig };

    if (newConfig.customStopwords) {
      // Reinitialize stop words with custom additions
      this.initializeStopWords();
    }
  }

  /**
   * Private helper methods
   */
  private initializePatterns(): void {
    this.punctuationRegex = /[.,!?;:'"\(\)\[\]{}]/g;
    this.urlRegex = /https?:\/\/[^\s]+/g;
    this.emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    this.hashtagRegex = /#\w+/g;
    this.mentionRegex = /@\w+/g;
    this.emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  }

  private initializeStopWords(): void {
    // Basic English stop words
    const englishStopWords = [
      "a",
      "an",
      "and",
      "are",
      "as",
      "at",
      "be",
      "but",
      "by",
      "for",
      "if",
      "in",
      "into",
      "is",
      "it",
      "no",
      "not",
      "of",
      "on",
      "or",
      "such",
      "that",
      "the",
      "their",
      "then",
      "there",
      "these",
      "they",
      "this",
      "to",
      "was",
      "will",
      "with",
      "the",
      "i",
      "me",
      "my",
      "myself",
      "we",
      "our",
      "ours",
      "ourselves",
      "you",
      "your",
      "yours",
      "yourself",
      "yourselves",
      "he",
      "him",
      "his",
      "himself",
      "she",
      "her",
      "hers",
      "herself",
      "it",
      "its",
      "itself",
      "they",
      "them",
      "their",
      "theirs",
      "themselves",
    ];

    this.stopWords = new Set(englishStopWords);
  }

  private initializeContractions(): void {
    const commonContractions: [string, string][] = [
      ["won't", "will not"],
      ["can't", "cannot"],
      ["n't", " not"],
      ["'re", " are"],
      ["'ve", " have"],
      ["'ll", " will"],
      ["'d", " would"],
      ["'m", " am"],
      ["let's", "let us"],
      ["don't", "do not"],
      ["doesn't", "does not"],
      ["didn't", "did not"],
      ["isn't", "is not"],
      ["aren't", "are not"],
      ["wasn't", "was not"],
      ["weren't", "were not"],
      ["haven't", "have not"],
      ["hasn't", "has not"],
      ["hadn't", "had not"],
      ["shouldn't", "should not"],
      ["couldn't", "could not"],
      ["wouldn't", "would not"],
      ["mightn't", "might not"],
      ["mustn't", "must not"],
    ];

    this.contractions = new Map(commonContractions);
  }

  private classifyToken(text: string): TokenType {
    if (this.urlRegex.test(text)) return "url";
    if (this.emailRegex.test(text)) return "email";
    if (this.hashtagRegex.test(text)) return "hashtag";
    if (this.mentionRegex.test(text)) return "mention";
    if (this.emojiRegex.test(text)) return "emoji";
    if (this.punctuationRegex.test(text)) return "punctuation";
    if (/^\d+$/.test(text)) return "number";
    if (/^\s+$/.test(text)) return "whitespace";
    if (/^[a-zA-Z]+$/.test(text)) return "word";
    return "unknown";
  }

  private isSentenceBoundary(token: Token, tokens: Token[], index: number): boolean {
    if (token.type === "punctuation" && /[.!?]/.test(token.text)) {
      return true;
    }

    // Check for common sentence patterns
    if (token.type === "punctuation" && token.text === ".") {
      // Check if it's not an abbreviation
      if (index > 0) {
        const prevToken = tokens[index - 1];
        const abbreviations = ["mr", "mrs", "dr", "prof", "sr", "jr", "st", "ave", "blvd", "rd"];
        if (!abbreviations.includes(prevToken.text.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  private expandContractions(text: string): string {
    let expanded = text;

    for (const [contraction, expansion] of this.contractions) {
      expanded = expanded.replace(
        new RegExp(contraction.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        expansion,
      );
    }

    return expanded;
  }

  private stem(word: string): string {
    // Simple stemming rule
    if (word.endsWith("ing")) {
      return word.slice(0, -3);
    }
    if (word.endsWith("ed")) {
      return word.slice(0, -2);
    }
    if (word.endsWith("ly")) {
      return word.slice(0, -2);
    }
    if (word.endsWith("s")) {
      return word.slice(0, -1);
    }
    return word;
  }

  private lemmatize(word: string): string {
    // Basic lemmatization rules
    const irregulars: Record<string, string> = {
      am: "be",
      is: "be",
      are: "be",
      was: "be",
      were: "be",
      be: "be",
      being: "be",
      been: "be",
      have: "have",
      has: "have",
      had: "have",
      do: "do",
      does: "do",
      did: "do",
      go: "go",
      goes: "go",
      went: "go",
      gone: "go",
      get: "get",
      gets: "get",
      got: "get",
      gotten: "get",
      make: "make",
      makes: "make",
      made: "make",
      come: "come",
      comes: "come",
      came: "come",
      see: "see",
      sees: "see",
      saw: "see",
      seen: "see",
      take: "take",
      takes: "take",
      took: "take",
      taken: "take",
    };

    return irregulars[word.toLowerCase()] || word;
  }

  private countParagraphs(sentences: Sentence[]): number {
    if (sentences.length === 0) return 0;

    let paragraphCount = 1;
    for (let i = 1; i < sentences.length; i++) {
      // Check if there's a significant gap between sentences (indicating paragraph break)
      const prevEnd = sentences[i - 1].endIndex;
      const currStart = sentences[i].startIndex;
      if (currStart - prevEnd > 2) {
        // More than just punctuation and space
        paragraphCount++;
      }
    }

    return paragraphCount;
  }

  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      zh: "Chinese",
      ja: "Japanese",
      ar: "Arabic",
      ru: "Russian",
    };
    return names[code] || "Unknown";
  }

  private getScript(code: string): string {
    const scripts: Record<string, string> = {
      en: "Latin",
      es: "Latin",
      fr: "Latin",
      de: "Latin",
      zh: "Han",
      ja: "Japanese",
      ar: "Arabic",
      ru: "Cyrillic",
    };
    return scripts[code] || "Unknown";
  }

  private isValidRegex(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const textPreprocessor = new TextPreprocessor();
