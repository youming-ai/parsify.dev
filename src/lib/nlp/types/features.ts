/**
 * Feature Extraction Types
 * Type definitions for various linguistic and semantic features
 */

export interface FeatureConfig {
  enableEmbeddings: boolean;
  enableLinguistic: boolean;
  enableSemantic: boolean;
  enableStructural: boolean;
  embeddingModel: string;
  batchSize: number;
  maxSequenceLength: number;
  normalizeFeatures: boolean;
  cacheResults: boolean;
}

export interface FeatureExtractionConfig {
  defaultEmbeddingModel: string;
  embeddingDimension: number;
  maxSequenceLength: number;
  batchSize: number;
  enableCaching: boolean;
  cacheSize: number;
  normalizeVectors: boolean;
  includePartOfSpeech: boolean;
  includeDependencies: boolean;
  ngramRange: [number, number];
  minTokenFrequency: number;
  maxFeatures: number;
}

// Base feature interface
export interface BaseFeature {
  confidence: number;
  extractedAt: Date;
  processingTime: number;
  method: string;
}

// Linguistic Features
export interface LinguisticFeatures extends BaseFeature {
  // Token-level features
  tokenCount: number;
  averageTokenLength: number;
  vocabularySize: number;
  lexicalDiversity: number;
  typeTokenRatio: number;

  // Sentence-level features
  sentenceCount: number;
  averageSentenceLength: number;
  sentenceComplexity: number;
  sentenceVariation: number;

  // Character-level features
  characterCount: number;
  averageWordLength: number;
  characterTokenRatio: number;

  // Part-of-speech features
  posDistribution: Record<string, number>;
  nounRatio: number;
  verbRatio: number;
  adjectiveRatio: number;

  // Punctuation features
  punctuationRatio: number;
  punctuationVariety: number;

  // Numerical features
  numberRatio: number;
  digitRatio: number;

  // Capitalization features
  capitalizationRatio: number;
  titleCaseRatio: number;
  uppercaseRatio: number;

  // Vocabulary features
  hapaxLegomenaRatio: number;
  rareWordRatio: number;
  commonWordRatio: number;

  // Readability features
  readabilityScore: number;
  readabilityLevel: string;

  // Complexity features
  complexityScore: number;
  syntacticComplexity: number;

  // Language features
  languageFeatures: {
    characterNgrams: string[];
    wordNgrams: string[];
    skipGrams: string[];
    charSkipGrams: string[];
    vocabularyRichness: number;
    morphology: MorphologyFeatures;
  };
}

export interface MorphologyFeatures {
  prefixCount: number;
  suffixCount: number;
  inflectionalForms: number;
  derivationForms: number;
  morphologicalComplexity: number;
}

// Semantic Features
export interface SemanticFeatures extends BaseFeature {
  // Embedding features
  embeddings: number[][] | null;
  embeddingDimension: number;
  embeddingQuality: number;

  // Semantic diversity
  semanticDiversity: number;
  semanticRichness: number;
  conceptualDensity: number;

  // Topic features
  topicDistribution: Record<string, number>;
  topicCoherence: number;
  topicSalience: number;
  topicalityScore: number;

  // Semantic relations
  semanticCoherence: number;
  semanticSimilarity: number;
  conceptualCohesion: number;

  // Conceptual features
  conceptualDepth: number;
  abstractionLevel: number;
  concretenessScore: number;

  // Entity features
  entityDensity: number;
  entityTypes: Record<string, number>;
  entityRelations: EntityRelationFeatures;

  // Sentiment features
  sentimentDistribution: Record<string, number>;
  sentimentPolarity: number;
  sentimentIntensity: number;
  emotionalValence: number;

  // Domain-specific features
  domainScore: number;
  formalityScore: number;
  subjectivityScore: number;

  // Word embedding features
  wordEmbeddings: Record<string, number[]> | null;
  sentenceEmbeddings: number[][] | null;
  documentEmbedding: number[] | null;

  // Vector space features
  centroid: number[] | null;
  dispersion: number;
  clusterTendency: number;
  outliers: number;
}

export interface EntityRelationFeatures {
  entityCount: number;
  relationTypes: Record<string, number>;
  relationDensity: number;
  relationComplexity: number;
}

// Structural Features
export interface StructuralFeatures extends BaseFeature {
  // Document structure
  paragraphCount: number;
  averageParagraphLength: number;
  paragraphVariation: number;
  structureComplexity: number;

  // Sequential features
  sequenceLength: number;
  sequenceVariety: number;
  sequencePredictability: number;
  patternRegularity: number;

  // Syntactic features
  syntacticComplexity: number;
  dependencyDepth: number;
  constituentStructure: ConstituentFeatures;

  // Formatting features
  formattingConsistency: number;
  whitespacePattern: string;
  indentationPattern: string;

  // Layout features
  lineLengthVariation: number;
  blockStructure: BlockStructureFeatures;

  // Organization features
  organizationScore: number;
  logicalFlow: number;
  narrativeProgression: number;

  // Temporal features
  temporalFlow: number;
  temporalMarkers: string[];
  temporalCoherence: number;

  // Spatial features
  spatialOrganization: number;
  spatialReferences: number;
  spatialRelationships: SpatialFeatures;
}

export interface ConstituentFeatures {
  phraseStructure: string[];
  clauseStructure: string[];
  sentenceStructure: string[];
  complexityMetrics: {
    averagePhraseLength: number;
    averageClauseLength: number;
    embeddingDepth: number;
  };
}

export interface BlockStructureFeatures {
  blockTypes: Record<string, number>;
  blockLengths: number[];
  blockHierarchy: number;
  nestingDepth: number;
}

export interface SpatialFeatures {
  positionalReferences: number;
  spatialRelations: Record<string, number>;
  spatialDistribution: number;
  spatialCoherence: number;
}

// Combined Feature Set
export interface TextFeatures {
  linguistic: LinguisticFeatures;
  semantic: SemanticFeatures;
  structural: StructuralFeatures;
  overall: OverallFeatures;
  metadata: TextFeaturesMetadata;
}

export interface OverallFeatures {
  complexity: number;
  richness: number;
  diversity: number;
  coherence: number;
  quality: number;
  novelty: number;
  uniqueness: number;
}

export interface TextFeaturesMetadata {
  textLength: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  processingTime: number;
  extractionMethods: string[];
  featureCount: number;
  confidence: number;
  timestamp: Date;
}

// Feature Extraction Pipeline
export interface FeaturePipeline {
  id: string;
  name: string;
  description: string;
  steps: FeatureExtractionStep[];
  config: FeatureConfig;
  dependencies: string[];
}

export interface FeatureExtractionStep {
  id: string;
  type: 'linguistic' | 'semantic' | 'structural';
  method: string;
  parameters: Record<string, any>;
  enabled: boolean;
  dependencies: string[];
}

// Feature Comparison and Analysis
export interface FeatureComparison {
  similarity: number;
  distance: number;
  features: string[];
  confidence: number;
  method: string;
}

export interface FeatureAnalysis {
  importance: Record<string, number>;
  uniqueness: number;
  redundancy: Record<string, number>;
  correlations: Record<string, Record<string, number>>;
  dimension: number;
  sparsity: number;
}

// Feature Aggregation
export interface FeatureAggregation {
  method: 'average' | 'weighted' | 'max' | 'min' | 'concat';
  weights?: Record<string, number>;
  result: TextFeatures;
  confidence: number;
}

// Feature Selection
export interface FeatureSelection {
  method: 'variance' | 'chi2' | 'mutual_information' | 'recursive';
  k: number;
  score: Record<string, number>;
  selected: string[];
  features: TextFeatures;
}

// Feature Transformation
export interface FeatureTransformation {
  type: 'scaling' | 'normalization' | 'reduction' | 'encoding';
  method: string;
  parameters: Record<string, any>;
  originalFeatures: TextFeatures;
  transformedFeatures: any;
  inverseTransform?: any;
}

// Feature Vector
export interface FeatureVector {
  features: number[];
  dimension: number;
  normalization: string;
  metadata: FeatureVectorMetadata;
}

export interface FeatureVectorMetadata {
  featureNames: string[];
  featureTypes: Record<string, string[]>;
  extractionMethods: Record<string, string>;
  confidence: number;
  timestamp: Date;
  textSource: string;
}

// Feature Export/Import
export interface FeatureExport {
  format: 'json' | 'csv' | 'binary' | 'protobuf';
  features: TextFeatures | TextFeatures[];
  metadata: FeatureExportMetadata;
}

export interface FeatureExportMetadata {
  version: string;
  format: string;
  extractedAt: Date;
  featureCount: number;
  compressionUsed: boolean;
}

// Feature Visualization
export interface FeatureVisualization {
  type: 'scatter' | 'heatmap' | 'network' | 'distribution' | 'timeline';
  data: any;
  config: Record<string, any>;
  metadata: Record<string, any>;
}

// Feature Statistics
export interface FeatureStatistics {
  descriptive: DescriptiveStatistics;
  distribution: DistributionStatistics;
  correlation: CorrelationMatrix;
  importance: FeatureImportance;
}

export interface DescriptiveStatistics {
  count: number;
  mean: number;
  median: number;
  mode: number;
  std: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export interface DistributionStatistics {
  histogram: Record<string, number>;
  normality: number;
  outliers: number;
  multimodality: boolean;
}

export interface CorrelationMatrix {
  matrix: Record<string, Record<string, number>>;
  eigenvalues: number[];
  principalComponents: string[];
  varianceExplained: number[];
}

export interface FeatureImportance {
  features: Record<string, number>;
  ranking: string[];
  scores: number[];
  method: string;
}
