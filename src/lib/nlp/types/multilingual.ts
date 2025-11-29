/**
 * Multilingual Types - Types for multilingual text processing operations
 */

import type { NLPResult } from './core';

// Translation Types
export interface Translation {
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  alternatives?: string[];
  quality: TranslationQuality;
  metadata: TranslationMetadata;
}

export interface TranslationQuality {
  fluency: number; // 0-1
  accuracy: number; // 0-1
  preservation: number; // 0-1 (meaning preservation)
  naturalness: number; // 0-1
  consistency: number; // 0-1
  overall: number; // 0-1
}

export interface TranslationMetadata {
  model: string;
  version: string;
  direction: string; // Source-Target language pair
  domains: string[];
  confidenceScore: number;
  beamSize?: number;
  temperature?: number;
  tokensProcessed: number;
  processingTime: number;
}

export interface TranslationResult extends NLPResult<Translation> {
  alternatives?: Translation[];
  languageSupport: LanguageSupportInfo;
  postprocessing?: PostProcessingResult;
}

export interface LanguageSupportInfo {
  sourceLanguageSupported: boolean;
  targetLanguageSupported: boolean;
  directionSupported: boolean;
  alternativeDirections: string[];
  qualityEstimate: number;
}

export interface PostProcessingResult {
  punctuationFixed: boolean;
  capitalizationFixed: boolean;
  formattingApplied: boolean;
  culturalAdaptations: CulturalAdaptation[];
}

export interface CulturalAdaptation {
  type: string;
  original: string;
  adapted: string;
  explanation: string;
}

// Transliteration Types
export interface Transliteration {
  sourceText: string;
  transliteratedText: string;
  sourceScript: Script;
  targetScript: Script;
  sourceLanguage: string;
  pronunciation: PronunciationInfo;
  confidence: number;
  alternatives?: TransliterationAlternative[];
}

export interface Script {
  code: string; // ISO 15924 script code
  name: string;
  direction: 'ltr' | 'rtl' | 'ttb';
  unicodeRange?: string;
  family: string;
}

export interface PronunciationInfo {
  phonetic: string;
  ipa: string; // International Phonetic Alphabet
  audioGuide?: string;
  syllables: string[];
  stress: StressPattern[];
}

export interface StressPattern {
  syllable: number;
  stress: 'primary' | 'secondary' | 'none';
}

export interface TransliterationAlternative {
  text: string;
  system: string; // Transliteration system used
  preference: string; // 'academic', 'popular', 'official', etc.
  confidence: number;
}

export interface TransliterationResult extends NLPResult<Transliteration> {
  systems: TransliterationSystem[];
  supportedScripts: Script[];
  pronunciationGuides: PronunciationGuide[];
}

export interface TransliterationSystem {
  id: string;
  name: string;
  description: string;
  standards: string[]; // ISO standards followed
  popularity: number; // 0-1
  accuracy: number; // 0-1
}

export interface PronunciationGuide {
  language: string;
  script: string;
  rules: PronunciationRule[];
}

export interface PronunciationRule {
  pattern: string;
  pronunciation: string;
  exceptions: string[];
  examples: string[];
}

// Cross-Lingual Analysis Types
export interface CrossLingualAnalysis {
  texts: CrossLingualText[];
  comparisons: CrossLingualComparison[];
  alignments: CrossLingualAlignment[];
  consistency: MultilingualConsistencyAnalysis;
  gaps: AnalysisGap[];
}

export interface CrossLingualText {
  text: string;
  language: string;
  script: string;
  analysis: TextAnalysis;
  translations?: string[];
}

export interface TextAnalysis {
  sentiment: MultilingualSentimentAnalysis;
  topics: string[];
  entities: EntityReference[];
  keywords: string[];
  readability: number;
  complexity: number;
}

export interface MultilingualSentimentAnalysis {
  score: number; // -1 to 1
  confidence: number; // 0-1
  emotions: Record<string, number>;
}

export interface EntityReference {
  text: string;
  type: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface CrossLingualComparison {
  type: ComparisonType;
  measure: number;
  source: string; // Language/text identifier
  target: string; // Language/text identifier
  details: ComparisonDetails;
}

export type ComparisonType =
  | 'sentiment_similarity'
  | 'topic_similarity'
  | 'entity_overlap'
  | 'keyword_similarity'
  | 'structural_similarity'
  | 'semantic_similarity';

export interface ComparisonDetails {
  commonElements: string[];
  uniqueElements: {
    source: string[];
    target: string[];
  };
  discrepancies: Discrepancy[];
  alignmentScore: number;
}

export interface Discrepancy {
  type: string;
  element: string;
  sourceValue: string;
  targetValue: string;
  severity: 'minor' | 'moderate' | 'major';
  explanation: string;
}

export interface CrossLingualAlignment {
  type: AlignmentType;
  sourceSegment: TextSegment;
  targetSegment: TextSegment;
  confidence: number;
  relationship: AlignmentRelationship;
}

export type AlignmentType = 'sentence' | 'phrase' | 'word' | 'entity' | 'topic' | 'semantic';

export interface TextSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  language: string;
}

export type AlignmentRelationship =
  | 'equivalent'
  | 'partial_equivalent'
  | 'broader'
  | 'narrower'
  | 'related'
  | 'contradictory'
  | 'missing';

export interface MultilingualConsistencyAnalysis {
  overall: number; // 0-1 consistency score
  dimensions: ConsistencyDimension[];
  inconsistencies: Inconsistency[];
}

export interface ConsistencyDimension {
  name: string;
  score: number;
  description: string;
  examples: string[];
}

export interface Inconsistency {
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  location: {
    source: string;
    target: string;
  };
  suggestion: string;
}

export interface AnalysisGap {
  type: string;
  description: string;
  impact: string;
  recommendation: string;
}

export interface CrossLingualAnalysisResult extends NLPResult<CrossLingualAnalysis> {
  languages: string[];
  analysisTypes: ComparisonType[];
  qualityMetrics: AnalysisQuality;
}

export interface AnalysisQuality {
  completeness: number;
  accuracy: number;
  consistency: number;
  coverage: number;
  overall: number;
}

// Language Segmentation Types
export interface LanguageSegment {
  text: string;
  language: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
  script: string;
  alternatives?: LanguageAlternative[];
}

export interface LanguageAlternative {
  language: string;
  confidence: number;
  reason: string;
}

export interface LanguageSegmentationResult extends NLPResult<LanguageSegment[]> {
  detectedLanguages: string[];
  dominantLanguage: string;
  mixedLanguage: boolean;
  statistics: SegmentationStatistics;
}

export interface SegmentationStatistics {
  totalSegments: number;
  languagesDetected: number;
  averageSegmentLength: number;
  confidenceAverage: number;
  languageDistribution: Record<string, number>;
}

// Multilingual Entity Recognition Types
export interface MultilingualEntity {
  text: string;
  type: string;
  language: string;
  script: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  translations: EntityTranslation[];
  canonicalForm?: string;
  disambiguation?: MultilingualEntityDisambiguation;
}

export interface EntityTranslation {
  language: string;
  text: string;
  confidence: number;
  source: string;
}

export interface MultilingualEntityDisambiguation {
  id: string;
  descriptions: Record<string, string>;
  urls: Record<string, string>;
  categories: Record<string, string[]>;
  confidence: number;
}

export interface MultilingualEntityResult extends NLPResult<MultilingualEntity[]> {
  languages: string[];
  entityTypes: string[];
  statistics: MultilingualEntityStatistics;
}

export interface MultilingualEntityStatistics {
  totalEntities: number;
  entitiesByLanguage: Record<string, number>;
  entitiesByType: Record<string, number>;
  crossLanguageEntities: number;
  translationCoverage: Record<string, number>;
}

// Cultural Context Analysis Types
export interface CulturalContext {
  culture: string;
  region: string;
  language: string;
  adaptations: CulturalAdaptation[];
  sensitivities: CulturalSensitivity[];
  norms: CulturalNorm[];
  references: CulturalReference[];
}

export interface CulturalSensitivity {
  type: SensitivityType;
  content: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  alternatives: string[];
}

export type SensitivityType =
  | 'religious'
  | 'political'
  | 'cultural'
  | 'historical'
  | 'social'
  | 'gender'
  | 'age'
  | 'ethnicity'
  | 'disability'
  | 'economic';

export interface CulturalNorm {
  domain: string; // 'communication', 'business', 'social', etc.
  norm: string;
  explanation: string;
  examples: string[];
  importance: 'low' | 'medium' | 'high';
}

export interface CulturalReference {
  type: string;
  reference: string;
  explanation: string;
  culturalSignificance: string;
  targetCulture?: string;
  adaptation?: string;
}

export interface CulturalContextResult extends NLPResult<CulturalContext> {
  sourceCulture: string;
  targetCulture?: string;
  adaptationLevel: AdaptationLevel;
  recommendations: CulturalRecommendation[];
}

export interface AdaptationLevel {
  overall: number; // 0-1
  dimensions: {
    linguistic: number;
    cultural: number;
    visual: number;
    behavioral: number;
  };
}

export interface CulturalRecommendation {
  type: 'adapt' | 'explain' | 'avoid' | 'research';
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: string;
}

// Multilingual Configuration Types
export interface MultilingualConfig {
  translation?: {
    models: TranslationModel[];
    defaultEngine: string;
    qualityThreshold: number;
    enableAlternatives: boolean;
    postProcessing: boolean;
  };
  transliteration?: {
    systems: TransliterationSystem[];
    defaultSystem: string;
    includePronunciation: boolean;
    includeAlternatives: boolean;
  };
  crossLingual?: {
    comparisonTypes: ComparisonType[];
    alignmentTypes: AlignmentType[];
    qualityThreshold: number;
    enableVisualization: boolean;
  };
  languageSegmentation?: {
    minSegmentLength: number;
    confidenceThreshold: number;
    maxLanguages: number;
    enableMixedLanguage: boolean;
  };
  entityRecognition?: {
    languages: string[];
    entityTypes: string[];
    enableCrossLanguage: boolean;
    translationRequired: boolean;
  };
  culturalAnalysis?: {
    targetCulture: string;
    sensitivityLevel: 'conservative' | 'moderate' | 'liberal';
    adaptationRequired: boolean;
    includeRecommendations: boolean;
  };
}

export interface TranslationModel {
  id: string;
  name: string;
  languages: string[];
  version: string;
  quality: number;
  capabilities: string[];
  limits: ModelLimits;
}

export interface ModelLimits {
  maxCharacters: number;
  maxTokens: number;
  supportedFormats: string[];
  rateLimit: number;
}
