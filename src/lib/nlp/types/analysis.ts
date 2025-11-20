/**
 * Analysis Types - Types for text analysis operations
 */

import { NLPResult } from "./core";

// Sentiment Analysis Types
export interface SentimentAnalysis {
  overall: "positive" | "negative" | "neutral";
  score: number; // -1 to 1
  confidence: number; // 0-1
  emotions: EmotionScores;
  aspects?: AspectSentiment[];
}

export interface EmotionScores {
  joy: number; // 0-1
  sadness: number; // 0-1
  anger: number; // 0-1
  fear: number; // 0-1
  surprise: number; // 0-1
  disgust: number; // 0-1
}

export interface AspectSentiment {
  aspect: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  confidence: number;
  mentionIndex: number[];
}

// Entity Recognition Types
export interface Entity {
  text: string;
  type: EntityType;
  startIndex: number;
  endIndex: number;
  confidence: number;
  metadata?: Record<string, any>;
  canonicalForm?: string;
  disambiguation?: EntityDisambiguation;
}

export type EntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "LOCATION"
  | "DATE"
  | "TIME"
  | "MONEY"
  | "PERCENT"
  | "FACILITY"
  | "GPE" // Geopolitical Entity
  | "EVENT"
  | "WORK_OF_ART"
  | "LAW"
  | "LANGUAGE"
  | "PRODUCT"
  | "QUANTITY"
  | "ORDINAL"
  | "CARDINAL"
  | "CUSTOM";

export interface EntityDisambiguation {
  id: string;
  description?: string;
  url?: string;
  categories: string[];
  confidence: number;
}

export interface EntityExtractionResult extends NLPResult<Entity[]> {
  statistics: {
    totalEntities: number;
    entitiesByType: Record<EntityType, number>;
    averageConfidence: number;
  };
}

// Keyword Extraction Types
export interface Keyword {
  term: string;
  relevance: number; // 0-1 relevance score
  frequency: number; // occurrence count
  positions: number[]; // indices in text
  type: "single" | "phrase" | "entity";
  algorithm: string; // algorithm that found this keyword
}

export interface KeywordExtractionResult extends NLPResult<Keyword[]> {
  algorithm: string;
  statistics: {
    totalKeywords: number;
    averageRelevance: number;
    uniqueTerms: number;
    phraseCount: number;
    entityCount: number;
  };
}

// Language Detection Types
export interface LanguageDetectionResult extends NLPResult<LanguageInfo[]> {
  detected: LanguageInfo;
  alternatives: LanguageInfo[];
  confidence: number;
}

export interface LanguageInfo {
  code: string; // ISO 639-1 code
  name: string; // Full language name
  confidence: number; // 0-1 confidence score
  script: string; // 'Latin', 'Cyrillic', 'Arabic', etc.
  family?: string; // Language family
  region?: string; // Geographic region
  nativeName?: string; // Name in native language
}

// Text Summarization Types
export interface TextSummary {
  original: string;
  summary: string;
  compressionRatio: number;
  type: "extractive" | "abstractive";
  keyPoints: string[];
  quality: number; // 0-1 quality score
  sentences: SummarySentence[];
}

export interface SummarySentence {
  text: string;
  importance: number; // 0-1 importance score
  position: number; // Position in original text
  originalIndex: number;
  included: boolean;
}

export interface SummarizationResult extends NLPResult<TextSummary> {
  compressionOptions: CompressionOptions;
  quality: QualityMetrics;
}

export interface CompressionOptions {
  targetRatio: number; // Target compression ratio (0-1)
  minSentences: number; // Minimum number of sentences
  maxSentences: number; // Maximum number of sentences
  algorithm: "extractive" | "abstractive" | "hybrid";
  preserveEntities: boolean;
}

export interface QualityMetrics {
  coherence: number; // 0-1
  relevance: number; // 0-1
  readability: number; // 0-1
  informativeness: number; // 0-1
  overall: number; // 0-1
}

// Topic Modeling Types
export interface Topic {
  id: string;
  name: string;
  keywords: string[];
  weight: number;
  coherence: number;
  documents: string[];
}

export interface DocumentTopics {
  documentId: string;
  topics: TopicAssignment[];
  dominantTopic: TopicAssignment;
}

export interface TopicAssignment {
  topicId: string;
  probability: number;
  confidence: number;
}

export interface TopicModelingResult extends NLPResult<Topic[]> {
  algorithm: string;
  numTopics: number;
  coherence: number;
  perplexity?: number;
}

// Text Similarity Types
export interface SimilarityResult extends NLPResult<TextSimilarity> {}

export interface TextSimilarity {
  text1: string;
  text2: string;
  overallSimilarity: number; // 0-1
  cosineSimilarity: number; // 0-1
  jaccardSimilarity: number; // 0-1
  editDistance: number;
  ngramSimilarity: number; // 0-1
  semanticSimilarity: number; // 0-1
  alignment: TextAlignment[];
}

export interface TextAlignment {
  text1Segment: string;
  text2Segment: string;
  similarity: number;
  position1: { start: number; end: number };
  position2: { start: number; end: number };
}

// Text Statistics Types
export interface TextStatistics {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageCharactersPerWord: number;
  averageSentencesPerParagraph: number;
  readingTime: number; // estimated reading time in minutes
  speakingTime: number; // estimated speaking time in minutes

  // Vocabulary metrics
  uniqueWords: number;
  lexicalDiversity: number; // unique words / total words

  // Complexity metrics
  complexWords: number; // words with 3+ syllables
  syllableCount: number;

  // Language specific
  stopWords: number;
  punctuationCount: number;

  // Content analysis
  numbers: number;
  urls: number;
  emails: number;
  phoneNumbers: number;
}

export interface TextStatisticsResult extends NLPResult<TextStatistics> {}

// Readability Analysis Types
export interface ReadabilityScore {
  fleschKincaid: {
    score: number;
    gradeLevel: string;
    difficulty:
      | "Very Easy"
      | "Easy"
      | "Fairly Easy"
      | "Standard"
      | "Fairly Difficult"
      | "Difficult"
      | "Very Difficult";
  };
  gunningFog: {
    score: number;
    gradeLevel: string;
    difficulty: string;
  };
  smogIndex: {
    score: number;
    gradeLevel: string;
  };
  colemanLiau: {
    score: number;
    gradeLevel: string;
  };
  ari: {
    // Automated Readability Index
    score: number;
    age: number;
    gradeLevel: string;
  };
  overall: {
    score: number;
    gradeLevel: string;
    audience:
      | "Elementary"
      | "Middle School"
      | "High School"
      | "College"
      | "Graduate"
      | "Professional";
  };
}

export interface ReadabilityResult extends NLPResult<ReadabilityScore> {
  recommendations: ReadabilityRecommendation[];
  statistics: {
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    complexWordPercentage: number;
  };
}

export interface ReadabilityRecommendation {
  type: "sentence" | "word" | "structure";
  suggestion: string;
  examples: string[];
  impact: "minor" | "moderate" | "significant";
}

// Analysis Configuration Types
export interface AnalysisConfig {
  sentiment?: {
    includeAspects: boolean;
    includeEmotions: boolean;
    granularity: "document" | "sentence" | "aspect";
  };
  entities?: {
    types: EntityType[];
    includeDisambiguation: boolean;
    customEntities?: Record<string, EntityType>;
  };
  keywords?: {
    algorithms: ("tfidf" | "textrank" | "yake" | "rake")[];
    maxKeywords: number;
    includePhrases: boolean;
    minFrequency: number;
  };
  summarization?: {
    algorithm: "extractive" | "abstractive" | "hybrid";
    compressionRatio: number;
    minSentences?: number;
    maxSentences?: number;
    preserveEntities: boolean;
  };
  language?: {
    detectLanguage: boolean;
    fallbackLanguage: string;
    supportedLanguages: string[];
  };
}
