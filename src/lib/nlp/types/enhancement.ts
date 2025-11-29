/**
 * Enhancement Types - Types for text enhancement and generation operations
 */

import type { NLPResult } from './core';

// Grammar Checking Types
export interface GrammarIssue {
  type: GrammarIssueType;
  subtype?: string;
  message: string;
  explanation?: string;
  startIndex: number;
  endIndex: number;
  suggestions: GrammarSuggestion[];
  severity: 'error' | 'warning' | 'info';
  confidence: number;
  ruleId?: string;
  context: {
    before: string;
    text: string;
    after: string;
  };
}

export type GrammarIssueType =
  | 'spelling'
  | 'grammar'
  | 'punctuation'
  | 'style'
  | 'capitalization'
  | 'consistency'
  | 'clarity'
  | 'word_choice'
  | 'sentence_structure'
  | 'usage';

export interface GrammarSuggestion {
  text: string;
  type: 'replacement' | 'insertion' | 'deletion';
  explanation?: string;
  confidence: number;
  ruleBased: boolean;
  examples?: string[];
}

export interface GrammarCheckResult extends NLPResult<GrammarIssue[]> {
  statistics: {
    totalIssues: number;
    issuesByType: Record<GrammarIssueType, number>;
    issuesBySeverity: Record<'error' | 'warning' | 'info', number>;
    confidence: number;
  };
  correctedText?: string;
  autoCorrectableIssues: number;
}

// Style Analysis Types
export interface StyleAnalysis {
  overall: StyleScore;
  elements: StyleElement[];
  tone: ToneAnalysis;
  formality: FormalityAnalysis;
  consistency: ConsistencyAnalysis;
}

export interface StyleScore {
  overall: number; // 0-1
  clarity: number; // 0-1
  conciseness: number; // 0-1
  engagement: number; // 0-1
  professionalism: number; // 0-1
  readability: number; // 0-1
}

export interface StyleElement {
  type: StyleElementType;
  score: number; // 0-1
  description: string;
  examples: StyleExample[];
  suggestions: StyleSuggestion[];
}

export type StyleElementType =
  | 'word_choice'
  | 'sentence_structure'
  | 'voice'
  | 'tone'
  | 'transitions'
  | 'emphasis'
  | 'parallelism'
  | 'rhythm'
  | 'imagery'
  | 'metaphor';

export interface StyleExample {
  text: string;
  type: 'good' | 'poor' | 'suggestion';
  explanation?: string;
}

export interface StyleSuggestion {
  type: 'improve' | 'maintain' | 'avoid';
  description: string;
  examples: string[];
  reasoning: string;
}

export interface ToneAnalysis {
  primary: Tone;
  secondary?: Tone;
  confidence: number;
  mixedTones: boolean;
}

export interface Tone {
  type: ToneType;
  score: number; // 0-1
  characteristics: string[];
}

export type ToneType =
  | 'formal'
  | 'informal'
  | 'academic'
  | 'casual'
  | 'professional'
  | 'friendly'
  | 'authoritative'
  | 'conversational'
  | 'technical'
  | 'creative'
  | 'persuasive'
  | 'neutral'
  | 'positive'
  | 'negative';

export interface FormalityAnalysis {
  level: 'very_informal' | 'informal' | 'neutral' | 'formal' | 'very_formal';
  score: number; // 0-1
  indicators: FormalityIndicator[];
}

export interface FormalityIndicator {
  type: string;
  score: number;
  examples: string[];
}

export interface ConsistencyAnalysis {
  overall: number; // 0-1
  elements: ConsistencyElement[];
}

export interface ConsistencyElement {
  type: 'terminology' | 'capitalization' | 'punctuation' | 'formatting' | 'style';
  score: number; // 0-1
  issues: ConsistencyIssue[];
}

export interface ConsistencyIssue {
  description: string;
  examples: string[];
  suggestions: string[];
}

export interface StyleAnalysisResult extends NLPResult<StyleAnalysis> {
  recommendations: StyleRecommendation[];
  improvements: StyleImprovement[];
}

export interface StyleRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  examples: string[];
  reasoning: string;
}

export interface StyleImprovement {
  before: string;
  after: string;
  explanation: string;
  impact: 'minor' | 'moderate' | 'significant';
}

// Text Generation Types
export interface GenerationRequest {
  prompt: string;
  type: GenerationType;
  parameters: GenerationParameters;
  context?: string;
  constraints?: GenerationConstraints;
}

export type GenerationType =
  | 'completion'
  | 'expansion'
  | 'paraphrase'
  | 'summarization'
  | 'creative'
  | 'technical'
  | 'formal'
  | 'casual';

export interface GenerationParameters {
  length?: {
    min?: number;
    max?: number;
    target?: number;
  };
  tone?: ToneType;
  style?: string;
  audience?: string;
  purpose?: string;
  temperature?: number; // 0-1 for creativity
  maxTokens?: number;
  stopSequences?: string[];
  includeExamples?: boolean;
}

export interface GenerationConstraints {
  keywords?: string[];
  avoidWords?: string[];
  mustInclude?: string[];
  mustExclude?: string[];
  format?: 'paragraph' | 'bullet' | 'numbered' | 'list';
  language?: string;
  domain?: string;
}

export interface GenerationResult extends NLPResult<GeneratedText> {
  request: GenerationRequest;
  alternatives?: GeneratedText[];
  quality: GenerationQuality;
}

export interface GeneratedText {
  text: string;
  confidence: number;
  relevance: number;
  coherence: number;
  creativity: number;
  length: number;
  wordCount: number;
  sentences: string[];
  metadata: {
    model: string;
    temperature: number;
    tokensUsed: number;
    generationTime: number;
  };
}

export interface GenerationQuality {
  overall: number;
  coherence: number;
  relevance: number;
  creativity: number;
  readability: number;
  factuality?: number;
  bias?: {
    detected: boolean;
    types: string[];
    severity: 'low' | 'medium' | 'high';
  };
}

// Paraphrasing Types
export interface ParaphraseRequest {
  text: string;
  style?: ParaphraseStyle;
  length?: LengthChange;
  complexity?: ComplexityChange;
  tone?: ToneType;
  purpose?: string;
  count?: number; // Number of paraphrases to generate
}

export type ParaphraseStyle =
  | 'formal'
  | 'informal'
  | 'simple'
  | 'academic'
  | 'business'
  | 'creative'
  | 'technical'
  | 'conversational';

export type LengthChange = 'much_shorter' | 'shorter' | 'same' | 'longer' | 'much_longer';

export type ComplexityChange =
  | 'much_simpler'
  | 'simpler'
  | 'same'
  | 'more_complex'
  | 'much_more_complex';

export interface ParaphraseResult extends NLPResult<Paraphrase[]> {
  original: string;
  requests: ParaphraseRequest;
}

export interface Paraphrase {
  text: string;
  confidence: number;
  similarity: number; // Similarity to original (0-1)
  preservation: number; // Meaning preservation (0-1)
  fluency: number; // Fluency score (0-1)
  style: ParaphraseStyle;
  lengthChange: LengthChange;
  complexityChange: ComplexityChange;
  changes: ChangeDetail[];
}

export interface ChangeDetail {
  type: 'word' | 'phrase' | 'structure' | 'order';
  original: string;
  changed: string;
  reason: string;
}

// Readability Enhancement Types
export interface ReadabilityEnhancement {
  original: ReadabilityScores;
  enhanced: ReadabilityScores;
  improvements: ReadabilityImprovement[];
  enhancedText: string;
  summary: string;
}

export interface ReadabilityScores {
  fleschKincaid: number;
  gunningFog: number;
  smogIndex: number;
  colemanLiau: number;
  ari: number;
  overall: number;
  gradeLevel: string;
}

export interface ReadabilityImprovement {
  type: ReadabilityImprovementType;
  before: string;
  after: string;
  explanation: string;
  impact: {
    readability: number;
    comprehension: number;
  };
}

export type ReadabilityImprovementType =
  | 'sentence_split'
  | 'sentence_merge'
  | 'word_replacement'
  | 'restructuring'
  | 'punctuation'
  | 'transition'
  | 'clarification';

export interface ReadabilityEnhancementResult extends NLPResult<ReadabilityEnhancement> {
  statistics: {
    readabilityImprovement: number;
    sentencesChanged: number;
    wordsChanged: number;
    structureChanges: number;
  };
}

// Writing Coach Types
export interface WritingCoach {
  overall: WritingScore;
  elements: WritingElement[];
  suggestions: WritingSuggestion[];
  strengths: string[];
  weaknesses: string[];
  actionItems: ActionItem[];
}

export interface WritingScore {
  overall: number;
  clarity: number;
  conciseness: number;
  engagement: number;
  professionalism: number;
  grammar: number;
  style: number;
  structure: number;
}

export interface WritingElement {
  category: string;
  score: number;
  description: string;
  examples: WritingExample[];
  suggestions: string[];
}

export interface WritingExample {
  text: string;
  type: 'good' | 'poor' | 'suggestion';
  explanation?: string;
  improvement?: string;
}

export interface WritingSuggestion {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  examples: string[];
  reasoning: string;
  impact: string;
}

export interface ActionItem {
  type: 'fix' | 'improve' | 'review';
  description: string;
  location: {
    startIndex: number;
    endIndex: number;
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

export interface WritingCoachResult extends NLPResult<WritingCoach> {
  revisionPlan: RevisionPlan;
  estimatedImprovement: {
    current: number;
    potential: number;
    effort: 'low' | 'medium' | 'high';
  };
}

export interface RevisionPlan {
  phases: RevisionPhase[];
  totalEstimatedTime: number; // minutes
  difficulty: 'easy' | 'moderate' | 'challenging';
}

export interface RevisionPhase {
  name: string;
  description: string;
  items: string[];
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
}

// Enhancement Configuration Types
export interface EnhancementConfig {
  grammar?: {
    includeSpelling: boolean;
    includeGrammar: boolean;
    includeStyle: boolean;
    severity: 'all' | 'errors_only' | 'suggestions_only';
    languageVariants: ('en-US' | 'en-GB' | 'en-CA' | 'en-AU')[];
  };
  style?: {
    targetTone: ToneType;
    targetAudience: string;
    domain: string;
    formality: FormalityLevel;
  };
  generation?: {
    defaultLength: number;
    maxTokens: number;
    temperature: number;
    creativityLevel: 'low' | 'medium' | 'high';
    includeExamples: boolean;
  };
  paraphrase?: {
    maxAlternatives: number;
    similarityThreshold: number;
    preserveMeaning: boolean;
    allowedChanges: (ParaphraseStyle | LengthChange | ComplexityChange)[];
  };
  readability?: {
    targetGradeLevel: string;
    minImprovement: number;
    preserveStyle: boolean;
    simplificationLevel: 'conservative' | 'moderate' | 'aggressive';
  };
}

export type FormalityLevel = 'very_informal' | 'informal' | 'neutral' | 'formal' | 'very_formal';
