/**
 * Sentiment Analysis for Feedback System
 * Provides natural language processing capabilities for analyzing user feedback sentiment
 */

import { SentimentAnalysis, FeedbackSubmission } from '@/types/feedback';

export interface SentimentAnalyzerConfig {
  enabled: boolean;
  language: string;
  confidence: number;
  analyzeEmotions: boolean;
  extractEntities: boolean;
  extractKeyPhrases: boolean;
  customDictionary?: Record<string, number>;
  negationWords?: string[];
  intensifiers?: Record<string, number>;
}

export interface SentimentResult {
  overall: SentimentAnalysis;
  sentences: SentenceAnalysis[];
  keyPhrases: string[];
  entities: EntityAnalysis[];
  emotions: EmotionAnalysis;
  confidence: number;
  processingTime: number;
}

export interface SentenceAnalysis {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  magnitude: number;
  keywords: string[];
  position: number;
}

export interface EntityAnalysis {
  text: string;
  type: 'tool' | 'feature' | 'issue' | 'person' | 'organization' | 'location' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  salience: number;
  mentions: number;
}

export interface EmotionAnalysis {
  joy: number;
  anger: number;
  sadness: number;
  fear: number;
  surprise: number;
  disgust: number;
  dominant: string;
}

export class SentimentAnalyzer {
  private config: SentimentAnalyzerConfig;
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;
  private stopWords: Set<string>;
  private toolNames: Set<string>;

  constructor(config: Partial<SentimentAnalyzerConfig> = {}) {
    this.config = {
      enabled: true,
      language: 'en',
      confidence: 0.6,
      analyzeEmotions: true,
      extractEntities: true,
      extractKeyPhrases: true,
      negationWords: ['not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither', 'nowhere', 'hardly', 'scarcely', 'barely'],
      intensifiers: {
        'very': 1.5,
        'extremely': 2.0,
        'quite': 1.3,
        'somewhat': 0.8,
        'slightly': 0.7,
        'really': 1.4,
        'absolutely': 1.8,
        'totally': 1.7,
        'completely': 1.6,
        'highly': 1.5,
      },
      ...config,
    };

    this.initializeDictionaries();
  }

  private initializeDictionaries(): void {
    // Initialize positive sentiment words
    this.positiveWords = new Set([
      'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful', 'perfect',
      'love', 'like', 'enjoy', 'satisfied', 'happy', 'pleased', 'delighted', 'thrilled',
      'helpful', 'useful', 'effective', 'efficient', 'fast', 'quick', 'easy', 'simple',
      'intuitive', 'user-friendly', 'clean', 'well-designed', 'beautiful', 'impressive',
      'outstanding', 'superb', 'brilliant', 'magnificent', 'spectacular', 'remarkable',
      'valuable', 'beneficial', 'advantageous', 'convenient', 'practical', 'reliable',
      'stable', 'robust', 'powerful', 'flexible', 'versatile', 'comprehensive',
      'accurate', 'precise', 'correct', 'right', 'proper', 'appropriate', 'suitable',
      'recommend', 'suggest', 'prefer', 'choose', 'select', 'approve', 'endorse',
      'thank', 'thanks', 'appreciate', 'grateful', 'credit', 'praise', 'compliment',
      'success', 'successful', 'achieve', 'accomplish', 'complete', 'finish', 'solve',
      'improve', 'enhance', 'optimize', 'better', 'best', 'superior', 'exceeds',
      'smooth', 'seamless', 'flawless', 'perfectly', 'works', 'functional', 'operational',
    ]);

    // Initialize negative sentiment words
    this.negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike', 'poor',
      'worst', 'useless', 'worthless', 'garbage', 'trash', 'junk', 'crap', 'sucks',
      'difficult', 'hard', 'complicated', 'complex', 'confusing', 'unclear', 'ambiguous',
      'slow', 'sluggish', 'laggy', 'unresponsive', 'crash', 'broken', 'defective', 'faulty',
      'bug', 'buggy', 'error', 'mistake', 'wrong', 'incorrect', 'inaccurate', 'flaw',
      'frustrating', 'annoying', 'irritating', 'aggravating', 'disappointing', 'unsatisfied',
      'unhappy', 'sad', 'angry', 'mad', 'upset', 'concerned', 'worried', 'confused',
      'failed', 'failure', 'problem', 'issue', 'trouble', 'difficulties', 'challenges',
      'limitation', 'restriction', 'constraint', 'drawback', 'disadvantage', 'weakness',
      'missing', 'lacking', 'incomplete', 'partial', 'insufficient', 'inadequate',
      'expensive', 'costly', 'overpriced', 'waste', 'unnecessary', 'redundant',
      ' ugly', 'messy', 'disorganized', 'chaotic', 'cluttered', 'unprofessional',
      'reject', 'refuse', 'deny', 'oppose', 'against', 'disagree', 'object', 'protest',
      'complain', 'criticize', 'negative', 'unfavorable', 'unacceptable', 'unbearable',
    ]);

    // Initialize stop words
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
      'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with',
      'i', 'you', 'your', 'we', 'us', 'our', 'they', 'them', 'their', 'this', 'that',
      'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'if', 'then', 'else',
      'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
    ]);

    // Initialize tool names for entity recognition
    this.toolNames = new Set([
      'json', 'formatter', 'validator', 'minifier', 'parser', 'converter',
      'code', 'formatter', 'beautifier', 'linter', 'minifier', 'compressor',
      'base64', 'encoder', 'decoder', 'url', 'encode', 'decode', 'hash',
      'password', 'generator', 'qr', 'code', 'shortener', 'link', 'url',
      'csv', 'xml', 'yaml', 'toml', 'excel', 'pdf', 'image', 'converter',
      'regex', 'regular', 'expression', 'tester', 'validator', 'matcher',
      'diff', 'compare', 'merge', 'patch', 'text', 'compare', 'difference',
      'color', 'palette', 'picker', 'converter', 'hex', 'rgb', 'hsl',
      'timestamp', 'converter', 'epoch', 'unix', 'time', 'date',
      'markdown', 'html', 'converter', 'preview', 'editor', 'render',
      'jwt', 'token', 'decoder', 'encoder', 'validator', 'parser',
      'css', 'minifier', 'beautifier', 'formatter', 'compressor', 'optimizer',
      'javascript', 'minifier', 'beautifier', 'formatter', 'obfuscator',
      'sql', 'formatter', 'beautifier', 'validator', 'parser',
    ]);
  }

  public async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!this.config.enabled) {
      return this.getDefaultSentimentResult();
    }

    const startTime = Date.now();

    try {
      // Preprocess text
      const cleanedText = this.preprocessText(text);
      const sentences = this.extractSentences(cleanedText);

      // Analyze each sentence
      const sentenceAnalyses: SentenceAnalysis[] = sentences.map((sentence, index) =>
        this.analyzeSentence(sentence, index)
      );

      // Calculate overall sentiment
      const overall = this.calculateOverallSentiment(sentenceAnalyses);

      // Extract key phrases
      const keyPhrases = this.config.extractKeyPhrases
        ? this.extractKeyPhrases(cleanedText)
        : [];

      // Extract entities
      const entities = this.config.extractEntities
        ? this.extractEntities(cleanedText, sentenceAnalyses)
        : [];

      // Analyze emotions
      const emotions = this.config.analyzeEmotions
        ? this.analyzeEmotions(cleanedText)
        : this.getDefaultEmotions();

      const processingTime = Date.now() - startTime;

      return {
        overall,
        sentences: sentenceAnalyses,
        keyPhrases,
        entities,
        emotions,
        confidence: this.calculateConfidence(sentenceAnalyses),
        processingTime,
      };
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return this.getDefaultSentimentResult();
    }
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private extractSentences(text: string): string[] {
    // Simple sentence splitting - could be enhanced with NLP libraries
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return sentences.length > 0 ? sentences : [text];
  }

  private analyzeSentence(sentence: string, position: number): SentenceAnalysis {
    const words = this.tokenize(sentence);
    const keywords = this.extractKeywords(words);

    let score = 0;
    let magnitude = 0;
    let negation = false;
    let intensifier = 1.0;

    words.forEach((word, index) => {
      // Check for negation
      if (this.config.negationWords?.includes(word)) {
        negation = true;
        return;
      }

      // Check for intensifiers
      if (word in (this.config.intensifiers || {})) {
        intensifier = (this.config.intensifiers as Record<string, number>)[word];
        return;
      }

      // Calculate sentiment score
      if (this.positiveWords.has(word)) {
        const wordScore = 1 * intensifier;
        score += negation ? -wordScore : wordScore;
        magnitude += Math.abs(wordScore);
      } else if (this.negativeWords.has(word)) {
        const wordScore = -1 * intensifier;
        score += negation ? -wordScore : wordScore;
        magnitude += Math.abs(wordScore);
      }

      // Reset negation and intensifier after processing
      if (word !== 'not' && word !== 'no') {
        negation = false;
        intensifier = 1.0;
      }
    });

    // Normalize score
    score = Math.max(-1, Math.min(1, score / Math.max(1, words.length / 5)));
    magnitude = Math.max(0, Math.min(1, magnitude / Math.max(1, words.length / 5)));

    return {
      text: sentence,
      sentiment: this.getSentimentLabel(score),
      score,
      magnitude,
      keywords,
      position,
    };
  }

  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(word => word.length > 0)
      .filter(word => !this.stopWords.has(word));
  }

  private extractKeywords(words: string[]): string[] {
    const keywords = words.filter(word =>
      this.positiveWords.has(word) ||
      this.negativeWords.has(word) ||
      this.toolNames.has(word) ||
      word.length > 4 // Include longer words as potential keywords
    );

    // Remove duplicates and limit to top keywords
    return [...new Set(keywords)].slice(0, 10);
  }

  private calculateOverallSentiment(sentenceAnalyses: SentenceAnalysis[]): SentimentAnalysis {
    if (sentenceAnalyses.length === 0) {
      return this.getDefaultSentimentAnalysis();
    }

    const totalScore = sentenceAnalyses.reduce((sum, analysis) => sum + analysis.score, 0);
    const totalMagnitude = sentenceAnalyses.reduce((sum, analysis) => sum + analysis.magnitude, 0);

    const score = totalScore / sentenceAnalyses.length;
    const magnitude = totalMagnitude / sentenceAnalyses.length;

    const emotions = this.calculateEmotionsFromSentences(sentenceAnalyses);
    const keyPhrases = this.extractKeyPhrasesFromSentences(sentenceAnalyses);
    const entities = this.extractEntitiesFromSentences(sentenceAnalyses);

    return {
      score: Math.max(-1, Math.min(1, score)),
      magnitude: Math.max(0, Math.min(1, magnitude)),
      label: this.getSentimentLabel(score),
      confidence: this.calculateConfidence(sentenceAnalyses),
      emotions,
      keyPhrases,
      entities,
      language: this.config.language,
      processedAt: new Date(),
      model: 'custom-sentiment-analyzer',
    };
  }

  private getSentimentLabel(score: number): 'positive' | 'neutral' | 'negative' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(sentenceAnalyses: SentenceAnalysis[]): number {
    if (sentenceAnalyses.length === 0) return 0;

    const avgMagnitude = sentenceAnalyses.reduce((sum, analysis) => sum + analysis.magnitude, 0) / sentenceAnalyses.length;
    const keywordDensity = sentenceAnalyses.reduce((sum, analysis) => sum + analysis.keywords.length, 0) / sentenceAnalyses.length;

    // Higher confidence with more keywords and stronger sentiment
    return Math.min(1, (avgMagnitude * 0.7) + (Math.min(keywordDensity / 5, 1) * 0.3));
  }

  private extractKeyPhrases(text: string): string[] {
    const words = this.tokenize(text);
    const phrases: string[] = [];

    // Extract n-grams (1-3 words)
    for (let n = 1; n <= 3; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(' ');
        if (this.isKeyPhrase(phrase)) {
          phrases.push(phrase);
        }
      }
    }

    // Remove duplicates and limit to top phrases
    return [...new Set(phrases)].slice(0, 10);
  }

  private isKeyPhrase(phrase: string): boolean {
    const words = phrase.split(' ');

    // Include phrases with sentiment words or tool names
    const hasSentimentWord = words.some(word =>
      this.positiveWords.has(word) || this.negativeWords.has(word)
    );

    const hasToolWord = words.some(word => this.toolNames.has(word));

    // Include longer phrases
    const isLongPhrase = phrase.length > 10;

    return hasSentimentWord || hasToolWord || isLongPhrase;
  }

  private extractEntities(text: string, sentenceAnalyses: SentenceAnalysis[]): EntityAnalysis[] {
    const entities: Map<string, EntityAnalysis> = new Map();

    // Extract tool names
    this.toolNames.forEach(toolName => {
      const regex = new RegExp(`\\b${toolName}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches && matches.length > 0) {
        const key = toolName.toLowerCase();
        const existing = entities.get(key) || {
          text: toolName,
          type: 'tool' as const,
          sentiment: 'neutral' as const,
          salience: 0,
          mentions: 0,
        };

        entities.set(key, {
          ...existing,
          mentions: existing.mentions + matches.length,
          salience: existing.salence + (matches.length * 0.1),
        });
      }
    });

    // Calculate sentiment for each entity based on context
    entities.forEach((entity, key) => {
      const relatedSentences = sentenceAnalyses.filter(sentence =>
        sentence.text.toLowerCase().includes(key)
      );

      if (relatedSentences.length > 0) {
        const avgScore = relatedSentences.reduce((sum, sentence) => sum + sentence.score, 0) / relatedSentences.length;
        entity.sentiment = this.getSentimentLabel(avgScore);
      }
    });

    // Sort by salience and limit to top entities
    return Array.from(entities.values())
      .sort((a, b) => b.salience - a.salience)
      .slice(0, 10);
  }

  private analyzeEmotions(text: string): EmotionAnalysis {
    const words = this.tokenize(text);

    // Simple emotion word mapping
    const emotionWords = {
      joy: ['happy', 'joy', 'delighted', 'pleased', 'excited', 'thrilled', 'love', 'enjoy'],
      anger: ['angry', 'mad', 'furious', 'enraged', 'irritated', 'annoyed', 'frustrated'],
      sadness: ['sad', 'disappointed', 'unhappy', 'depressed', 'down', 'gloomy', 'miserable'],
      fear: ['afraid', 'scared', 'fearful', 'anxious', 'worried', 'concerned', 'nervous'],
      surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned', 'unexpected'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sick', 'awful', 'horrible'],
    };

    const emotions: EmotionAnalysis = {
      joy: 0,
      anger: 0,
      sadness: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      dominant: 'neutral',
    };

    Object.entries(emotionWords).forEach(([emotion, wordList]) => {
      const matches = wordList.filter(word => words.includes(word)).length;
      (emotions as any)[emotion] = Math.min(1, matches / Math.max(1, words.length / 10));
    });

    // Find dominant emotion
    const maxEmotion = Object.entries(emotions)
      .filter(([key]) => key !== 'dominant')
      .reduce((max, [emotion, value]) => value > max.value ? { emotion, value } : max,
        { emotion: 'neutral', value: 0 });

    emotions.dominant = maxEmotion.emotion;

    return emotions;
  }

  private extractKeyPhrasesFromSentences(sentenceAnalyses: SentenceAnalysis[]): string[] {
    return sentenceAnalyses
      .flatMap(analysis => analysis.keywords)
      .filter((keyword, index, arr) => arr.indexOf(keyword) === index)
      .slice(0, 20);
  }

  private extractEntitiesFromSentences(sentenceAnalyses: SentenceAnalysis[]): any[] {
    // This would integrate with the entity extraction logic
    return [];
  }

  private calculateEmotionsFromSentences(sentenceAnalyses: SentenceAnalysis[]): any[] {
    // This would aggregate emotions from sentence analyses
    return [];
  }

  private getDefaultSentimentResult(): SentimentResult {
    return {
      overall: this.getDefaultSentimentAnalysis(),
      sentences: [],
      keyPhrases: [],
      entities: [],
      emotions: this.getDefaultEmotions(),
      confidence: 0,
      processingTime: 0,
    };
  }

  private getDefaultSentimentAnalysis(): SentimentAnalysis {
    return {
      score: 0,
      magnitude: 0,
      label: 'neutral',
      confidence: 0,
      emotions: [],
      keyPhrases: [],
      entities: [],
      language: this.config.language,
      processedAt: new Date(),
      model: 'custom-sentiment-analyzer',
    };
  }

  private getDefaultEmotions(): EmotionAnalysis {
    return {
      joy: 0,
      anger: 0,
      sadness: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      dominant: 'neutral',
    };
  }

  // Public methods for configuration
  public updateConfig(config: Partial<SentimentAnalyzerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public addPositiveWords(words: string[]): void {
    words.forEach(word => this.positiveWords.add(word.toLowerCase()));
  }

  public addNegativeWords(words: string[]): void {
    words.forEach(word => this.negativeWords.add(word.toLowerCase()));
  }

  public addToolNames(names: string[]): void {
    names.forEach(name => this.toolNames.add(name.toLowerCase()));
  }

  public getSentimentFromScore(score: number): 'positive' | 'neutral' | 'negative' {
    return this.getSentimentLabel(score);
  }

  public batchAnalyze(texts: string[]): Promise<SentimentResult[]> {
    return Promise.all(texts.map(text => this.analyzeSentiment(text)));
  }
}

// Export singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer();

// Export convenience functions
export const analyzeSentiment = (text: string): Promise<SentimentResult> =>
  sentimentAnalyzer.analyzeSentiment(text);

export const batchAnalyzeSentiment = (texts: string[]): Promise<SentimentResult[]> =>
  sentimentAnalyzer.batchAnalyze(texts);

export default sentimentAnalyzer;
