/**
 * Classification Types - Types for text classification and organization operations
 */

import { NLPResult } from "./core";

// Document Classification Types
export interface DocumentClassification {
  category: string;
  subcategory?: string;
  confidence: number;
  subcategories?: ClassificationResult[];
  features: ClassificationFeatures;
  taxonomy?: string;
  level: number; // Hierarchical level in taxonomy
}

export interface ClassificationResult {
  category: string;
  confidence: number;
  subcategories?: ClassificationResult[];
  features?: Record<string, number>;
  reasoning?: string;
  examples?: string[];
}

export interface ClassificationFeatures {
  keywords: string[];
  topics: string[];
  entities: string[];
  patterns: string[];
  statistics: {
    wordCount: number;
    sentenceCount: number;
    complexity: number;
    formality: number;
  };
  embeddings?: number[];
}

export interface DocumentClassificationResult extends NLPResult<DocumentClassification[]> {
  algorithm: string;
  taxonomy: string;
  version: string;
  confidence: number;
  topCategories: DocumentClassification[];
}

export interface ClassificationConfig {
  taxonomy: string;
  algorithm: "naive_bayes" | "svm" | "neural" | "ensemble";
  maxCategories: number;
  minConfidence: number;
  hierarchy: boolean;
  multiLabel: boolean;
  customCategories?: CustomCategory[];
}

export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  examples: string[];
  parent?: string;
  level: number;
}

// Intent Detection Types
export interface Intent {
  type: IntentType;
  subtype?: string;
  confidence: number;
  entities: IntentEntity[];
  actionability: ActionabilityLevel;
  urgency: UrgencyLevel;
  sentiment?: string;
}

export type IntentType =
  | "question"
  | "command"
  | "request"
  | "complaint"
  | "compliment"
  | "suggestion"
  | "feedback"
  | "information"
  | "transaction"
  | "greeting"
  | "farewell"
  | "confirmation"
  | "cancellation"
  | "inquiry"
  | "booking"
  | "support"
  | "sales"
  | "custom";

export interface IntentEntity {
  text: string;
  type: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  normalizedValue?: any;
}

export type ActionabilityLevel =
  | "highly_actionable"
  | "actionable"
  | "moderately_actionable"
  | "low_actionable"
  | "not_actionable";

export type UrgencyLevel = "urgent" | "high" | "medium" | "low" | "routine";

export interface IntentDetectionResult extends NLPResult<Intent> {
  algorithm: string;
  confidence: number;
  alternativeIntents: Intent[];
  suggestedActions: SuggestedAction[];
  responseTemplate?: string;
}

export interface SuggestedAction {
  type: string;
  description: string;
  parameters?: Record<string, any>;
  confidence: number;
  priority: "high" | "medium" | "low";
}

// Spam Detection Types
export interface SpamAnalysis {
  isSpam: boolean;
  spamProbability: number;
  spamType: SpamType;
  confidence: number;
  indicators: SpamIndicator[];
  risk: RiskLevel;
  reasons: string[];
}

export type SpamType =
  | "marketing"
  | "phishing"
  | "scam"
  | "adult"
  | "gambling"
  | "promotional"
  | "political"
  | "misinformation"
  | "automated"
  | "duplicate"
  | "off_topic"
  | "other";

export interface SpamIndicator {
  type: SpamIndicatorType;
  value: string | number;
  weight: number;
  description: string;
  severity: "low" | "medium" | "high";
}

export type SpamIndicatorType =
  | "suspicious_links"
  | "excessive_capitalization"
  | "repetitive_content"
  | "suspicious_sender"
  | "urgency_language"
  | "grammar_errors"
  | "emotional_language"
  | "request_personal_info"
  | "unusual_formatting"
  | "blacklisted_words"
  | "whitelisted_words"
  | "domain_reputation"
  | "content_similarity";

export type RiskLevel = "very_low" | "low" | "medium" | "high" | "very_high";

export interface SpamDetectionResult extends NLPResult<SpamAnalysis> {
  algorithm: string;
  modelVersion: string;
  thresholds: SpamThresholds;
  recommended: RecommendedAction;
}

export interface SpamThresholds {
  spamThreshold: number;
  highRiskThreshold: number;
  mediumRiskThreshold: number;
  lowRiskThreshold: number;
}

export interface RecommendedAction {
  action: "allow" | "block" | "quarantine" | "flag" | "review";
  reason: string;
  confidence: number;
  priority: "high" | "medium" | "low";
}

// Auto-Tagging Types
export interface Tag {
  id: string;
  name: string;
  type: TagType;
  confidence: number;
  relevance: number;
  source: TagSource;
  metadata?: Record<string, any>;
}

export type TagType =
  | "topic"
  | "entity"
  | "keyword"
  | "category"
  | "sentiment"
  | "language"
  | "style"
  | "domain"
  | "technical"
  | "custom";

export type TagSource =
  | "extracted"
  | "generated"
  | "predefined"
  | "user_defined"
  | "ml_model"
  | "rule_based"
  | "hybrid";

export interface AutoTaggingResult extends NLPResult<Tag[]> {
  algorithm: string;
  tagTypes: TagType[];
  maxTags: number;
  minConfidence: number;
  statistics: {
    totalTags: number;
    tagsByType: Record<TagType, number>;
    averageConfidence: number;
    uniqueEntities: number;
    topics: number;
  };
}

export interface TaggingConfig {
  maxTags: number;
  minConfidence: number;
  allowedTypes: TagType[];
  excludeTags: string[];
  requiredTags: string[];
  tagHierarchy: Record<string, string[]>;
  customTagRules: TagRule[];
}

export interface TagRule {
  condition: string;
  tags: string[];
  confidence: number;
  type: TagType;
}

// Document Clustering Types
export interface DocumentCluster {
  id: string;
  name: string;
  documents: ClusteredDocument[];
  centroid: number[];
  cohesion: number;
  separation: number;
  topics: string[];
  keywords: string[];
  representative: string;
  size: number;
}

export interface ClusteredDocument {
  id: string;
  content: string;
  similarity: number;
  distance: number;
  position: { x: number; y: number };
  metadata: Record<string, any>;
}

export interface ClusteringResult extends NLPResult<DocumentCluster[]> {
  algorithm: string;
  parameters: ClusteringParameters;
  statistics: ClusteringStatistics;
  optimization: ClusteringOptimization;
}

export interface ClusteringParameters {
  algorithm: "kmeans" | "hierarchical" | "dbscan" | "spectral";
  nClusters?: number;
  distance: "euclidean" | "cosine" | "manhattan" | "jaccard";
  maxIterations: number;
  convergenceThreshold: number;
  seed?: number;
}

export interface ClusteringStatistics {
  totalClusters: number;
  totalDocuments: number;
  averageClusterSize: number;
  largestClusterSize: number;
  smallestClusterSize: number;
  averageCohesion: number;
  overallSilhouette: number;
}

export interface ClusteringOptimization {
  bestK: number;
  silhouetteScores: number[];
  elbowPoint?: number;
  daviesBouldinIndex: number;
  calinskiHarabaszIndex: number;
}

// Content Quality Types
export interface QualityAnalysis {
  overall: QualityScore;
  dimensions: QualityDimension[];
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  grade: QualityGrade;
}

export interface QualityScore {
  overall: number;
  accuracy: number;
  clarity: number;
  completeness: number;
  consistency: number;
  relevance: number;
  objectivity: number;
  timeliness: number;
  depth: number;
}

export interface QualityDimension {
  name: string;
  score: number;
  description: string;
  factors: QualityFactor[];
  weight: number;
}

export interface QualityFactor {
  name: string;
  value: number;
  description: string;
  impact: "positive" | "negative" | "neutral";
}

export interface QualityIssue {
  type: QualityIssueType;
  severity: QualitySeverity;
  description: string;
  location: { start: number; end: number };
  suggestions: string[];
  examples: string[];
}

export type QualityIssueType =
  | "inaccuracy"
  | "ambiguity"
  | "incompleteness"
  | "inconsistency"
  | "irrelevance"
  | "bias"
  | "outdated"
  | "superficial"
  | "poor_structure"
  | "grammar"
  | "style"
  | "readability"
  | "citation";

export type QualitySeverity = "critical" | "high" | "medium" | "low" | "info";

export interface QualityRecommendation {
  type: QualityRecommendationType;
  description: string;
  priority: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  impact: QualityImpact;
}

export type QualityRecommendationType =
  | "add_examples"
  | "clarify_ambiguity"
  | "update_information"
  | "improve_structure"
  | "enhance_readability"
  | "add_sources"
  | "remove_bias"
  | "expand_content"
  | "simplify_language"
  | "improve_flow";

export interface QualityImpact {
  accuracy: number;
  clarity: number;
  completeness: number;
  userSatisfaction: number;
}

export type QualityGrade =
  | "A" // Excellent (90-100)
  | "B" // Good (80-89)
  | "C" // Average (70-79)
  | "D" // Poor (60-69)
  | "F"; // Fail (0-59)

export interface ContentQualityResult extends NLPResult<QualityAnalysis> {
  algorithm: string;
  scoring: ScoringMethodology;
  benchmarks: QualityBenchmarks;
}

export interface ScoringMethodology {
  weighting: Record<string, number>;
  thresholds: Record<string, number>;
  normalization: string;
  aggregation: string;
}

export interface QualityBenchmarks {
  category: string;
  average: number;
  percentile: number;
  comparison: "above" | "at" | "below";
}

// Classification Configuration Types
export interface ClassificationConfig {
  documentClassification?: {
    taxonomy: string;
    algorithm: string;
    multiLabel: boolean;
    minConfidence: number;
    customCategories?: CustomCategory[];
  };
  intentDetection?: {
    intentTypes: IntentType[];
    language: string;
    includeEntities: boolean;
    customIntents?: CustomIntent[];
  };
  spamDetection?: {
    sensitivity: "low" | "medium" | "high";
    customRules: SpamRule[];
    whitelist: string[];
    blacklist: string[];
  };
  autoTagging?: {
    maxTags: number;
    tagTypes: TagType[];
    minConfidence: number;
    customVocabulary: string[];
  };
  clustering?: {
    algorithm: string;
    distance: string;
    autoK: boolean;
    maxClusters: number;
  };
  qualityAnalysis?: {
    dimensions: string[];
    severity: QualitySeverity;
    recommendations: boolean;
    customCriteria: QualityCriterion[];
  };
}

export interface CustomIntent {
  name: string;
  description: string;
  examples: string[];
  keywords: string[];
  entities: string[];
  actions: string[];
}

export interface SpamRule {
  name: string;
  condition: string;
  weight: number;
  type: SpamIndicatorType;
  severity: QualitySeverity;
}

export interface QualityCriterion {
  name: string;
  description: string;
  factors: QualityFactor[];
  weight: number;
  threshold: number;
}
