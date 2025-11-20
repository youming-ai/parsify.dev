"use client";

import { BarChart3, Copy, Download, FileText, PieChart, TrendingUp } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

export interface TextStatistics {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  lineCount: number;
  averageWordLength: number;
  averageSentenceLength: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
}

export interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  gunningFogIndex: number;
  colemanLiauIndex: number;
  automatedReadabilityIndex: number;
  daleChallScore: number;
  linsearWriteScore: number;
  smogIndex: number;
}

export interface SentimentAnalysis {
  score: number;
  magnitude: number;
  label: "positive" | "negative" | "neutral" | "mixed";
  confidence: number;
  positiveWords: string[];
  negativeWords: string[];
  neutralWords: string[];
}

export interface KeywordData {
  word: string;
  frequency: number;
  density: number;
  tfidf?: number;
}

export interface TextAnalysisResult {
  text: string;
  statistics: TextStatistics;
  readability: ReadabilityMetrics;
  sentiment: SentimentAnalysis;
  keywords: KeywordData[];
  topWords: Array<{ word: string; count: number; percentage: number }>;
  language: string;
  complexity: "simple" | "moderate" | "complex" | "very complex";
}

interface AdvancedTextAnalyzerProps {
  className?: string;
}

// Common English words for TF-IDF calculation
const commonWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "up",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "any",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "can",
  "will",
  "just",
  "should",
  "now",
]);

// Sentiment word lists (simplified)
const positiveWords = new Set([
  "good",
  "great",
  "excellent",
  "amazing",
  "wonderful",
  "fantastic",
  "awesome",
  "beautiful",
  "love",
  "like",
  "happy",
  "joy",
  "pleased",
  "delighted",
  "satisfied",
  "perfect",
  "best",
  "brilliant",
  "outstanding",
  "superb",
  "magnificent",
  "spectacular",
  "incredible",
  "remarkable",
  "exceptional",
  "terrific",
  "fabulous",
  "impressive",
  "positive",
  "favorable",
  "advantageous",
  "beneficial",
  "valuable",
  "useful",
  "helpful",
  "effective",
  "successful",
  "win",
  "victory",
  "triumph",
  "achievement",
]);

const negativeWords = new Set([
  "bad",
  "terrible",
  "awful",
  "horrible",
  "disgusting",
  "hate",
  "dislike",
  "angry",
  "sad",
  "depressed",
  "disappointed",
  "frustrated",
  "annoyed",
  "upset",
  "worst",
  "poor",
  "inadequate",
  "insufficient",
  "unacceptable",
  "unfavorable",
  "negative",
  "harmful",
  "destructive",
  "damaging",
  "failure",
  "defeat",
  "loss",
  "setback",
  "disaster",
  "catastrophe",
  "tragedy",
  "crisis",
  "emergency",
  "urgent",
  "critical",
  "serious",
  "severe",
  "extreme",
  "intense",
  "overwhelming",
]);

export function AdvancedTextAnalyzer({ className }: AdvancedTextAnalyzerProps) {
  const [inputText, setInputText] = React.useState("");
  const [analysisResult, setAnalysisResult] = React.useState<TextAnalysisResult | null>(null);
  const [keywordCount, setKeywordCount] = React.useState(20);
  const [minWordLength, setMinWordLength] = React.useState(2);
  const [includeStopWords, setIncludeStopWords] = React.useState(false);
  const [analysisType, setAnalysisType] = React.useState<"basic" | "advanced" | "comprehensive">(
    "advanced",
  );

  const calculateStatistics = React.useCallback((text: string): TextStatistics => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const lines = text.split("\n");

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;
    const lineCount = lines.length;

    const totalWordLength = words.reduce(
      (sum, word) => sum + word.replace(/[^a-zA-Z0-9]/g, "").length,
      0,
    );
    const averageWordLength = wordCount > 0 ? totalWordLength / wordCount : 0;

    const totalSentenceLength = sentences.reduce(
      (sum, sentence) =>
        sum +
        sentence
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0).length,
      0,
    );
    const averageWordsPerSentence = sentenceCount > 0 ? totalSentenceLength / sentenceCount : 0;

    const totalParagraphSentences = paragraphs.reduce(
      (sum, paragraph) => sum + paragraph.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
      0,
    );
    const averageSentencesPerParagraph =
      paragraphCount > 0 ? totalParagraphSentences / paragraphCount : 0;

    return {
      characterCount: characters,
      wordCount,
      sentenceCount,
      paragraphCount,
      lineCount,
      averageWordLength,
      averageSentenceLength: sentenceCount > 0 ? characters / sentenceCount : 0,
      averageWordsPerSentence,
      averageSentencesPerParagraph,
    };
  }, []);

  const calculateReadability = React.useCallback(
    (text: string, stats: TextStatistics): ReadabilityMetrics => {
      const words = text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

      const avgWordsPerSentence = stats.averageWordsPerSentence;
      const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;
      const avgCharactersPerWord = stats.averageWordLength;

      // Flesch Reading Ease
      const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

      // Flesch-Kincaid Grade Level
      const fleschKincaidGrade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

      // Gunning Fog Index
      const complexWords = words.filter((word) => countSyllables(word) >= 3).length;
      const complexWordsPercentage = words.length > 0 ? (complexWords / words.length) * 100 : 0;
      const gunningFogIndex = 0.4 * (avgWordsPerSentence + complexWordsPercentage);

      // Coleman-Liau Index
      const L = words.length > 0 ? (stats.characterCount / words.length) * 100 : 0;
      const S = sentences.length > 0 ? (sentences.length / words.length) * 100 : 0;
      const colemanLiauIndex = 0.0588 * L - 0.296 * S - 15.8;

      // Automated Readability Index
      const automatedReadabilityIndex =
        4.71 * avgCharactersPerWord + 0.5 * avgWordsPerSentence - 21.43;

      // Dale-Chall Score (simplified)
      const difficultWords = words.filter((word) => !commonWords.has(word.toLowerCase())).length;
      const difficultWordsPercentage = words.length > 0 ? (difficultWords / words.length) * 100 : 0;
      const daleChallScore = 0.1579 * difficultWordsPercentage + 0.0496 * avgWordsPerSentence;

      // Linsear Write Formula (simplified)
      const easyWords = words.filter((word) => countSyllables(word) <= 2).length;
      const difficultWordsLW = words.filter((word) => countSyllables(word) > 2).length;
      const linsearWriteScore = (easyWords + difficultWordsLW * 3) / sentences.length;

      // SMOG Index
      const polysyllabicWords = words.filter((word) => countSyllables(word) >= 3).length;
      const smogIndex = 1.043 * Math.sqrt(polysyllabicWords * (30 / sentences.length)) + 3.1291;

      return {
        fleschKincaidGrade,
        fleschReadingEase,
        gunningFogIndex,
        colemanLiauIndex,
        automatedReadabilityIndex,
        daleChallScore,
        linsearWriteScore,
        smogIndex,
      };
    },
    [],
  );

  const countSyllables = React.useCallback((word: string): number => {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3) return 1;

    const vowels = "aeiouy";
    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith("e")) {
      syllableCount--;
    }

    // Ensure at least 1 syllable
    return Math.max(1, syllableCount);
  }, []);

  const analyzeSentiment = React.useCallback((text: string): SentimentAnalysis => {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const positiveWordsFound = words.filter((word) => positiveWords.has(word));
    const negativeWordsFound = words.filter((word) => negativeWords.has(word));
    const neutralWordsFound = words.filter(
      (word) => !positiveWords.has(word) && !negativeWords.has(word),
    );

    const positiveCount = positiveWordsFound.length;
    const negativeCount = negativeWordsFound.length;
    const totalCount = words.length;

    // Calculate sentiment score
    const score = (positiveCount - negativeCount) / Math.max(totalCount, 1);

    // Calculate magnitude (emotional intensity)
    const magnitude = (positiveCount + negativeCount) / Math.max(totalCount, 1);

    // Determine label
    let label: "positive" | "negative" | "neutral" | "mixed";
    if (Math.abs(score) < 0.1) {
      label = magnitude > 0.1 ? "mixed" : "neutral";
    } else if (score > 0) {
      label = "positive";
    } else {
      label = "negative";
    }

    // Calculate confidence
    const confidence = Math.abs(score) * magnitude;

    return {
      score,
      magnitude,
      label,
      confidence,
      positiveWords: [...new Set(positiveWordsFound)],
      negativeWords: [...new Set(negativeWordsFound)],
      neutralWords: [...new Set(neutralWordsFound)].slice(0, 20), // Limit for display
    };
  }, []);

  const extractKeywords = React.useCallback(
    (text: string, count: number): KeywordData[] => {
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((word) => word.length >= minWordLength);

      // Filter stop words if requested
      const filteredWords = includeStopWords
        ? words
        : words.filter((word) => !commonWords.has(word));

      // Calculate frequency
      const wordFrequency: Record<string, number> = {};
      filteredWords.forEach((word) => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });

      // Calculate total words for density
      const totalWords = filteredWords.length;

      // Convert to keyword data and sort by frequency
      const keywords = Object.entries(wordFrequency)
        .map(([word, frequency]) => ({
          word,
          frequency,
          density: (frequency / totalWords) * 100,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, count);

      return keywords;
    },
    [minWordLength, includeStopWords],
  );

  const getTopWords = React.useCallback((text: string, count: number = 10) => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length >= 1);

    const wordCount: Record<string, number> = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    const totalWords = words.length;
    return Object.entries(wordCount)
      .map(([word, wordCount]) => ({
        word,
        count: wordCount,
        percentage: (wordCount / totalWords) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
  }, []);

  const detectLanguage = React.useCallback((text: string): string => {
    // Simple language detection based on character patterns
    const sample = text.toLowerCase().substring(0, 1000);
    const englishWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"];
    const englishCount = englishWords.filter((word) => sample.includes(word)).length;

    if (englishCount >= 5) {
      return "English";
    }

    // Add more language detection logic as needed
    return "Unknown";
  }, []);

  const determineComplexity = React.useCallback(
    (readability: ReadabilityMetrics): "simple" | "moderate" | "complex" | "very complex" => {
      const avgGrade = readability.fleschKincaidGrade;

      if (avgGrade <= 6) return "simple";
      if (avgGrade <= 10) return "moderate";
      if (avgGrade <= 14) return "complex";
      return "very complex";
    },
    [],
  );

  const analyzeText = React.useCallback(() => {
    if (!inputText.trim()) return;

    const statistics = calculateStatistics(inputText);
    const readability = calculateReadability(inputText, statistics);
    const sentiment = analyzeSentiment(inputText);
    const keywords = extractKeywords(inputText, keywordCount);
    const topWords = getTopWords(inputText);
    const language = detectLanguage(inputText);
    const complexity = determineComplexity(readability);

    const result: TextAnalysisResult = {
      text: inputText,
      statistics,
      readability,
      sentiment,
      keywords,
      topWords,
      language,
      complexity,
    };

    setAnalysisResult(result);
  }, [
    inputText,
    calculateStatistics,
    calculateReadability,
    analyzeSentiment,
    extractKeywords,
    getTopWords,
    detectLanguage,
    determineComplexity,
    keywordCount,
  ]);

  const getReadabilityLevel = React.useCallback((score: number): string => {
    if (score >= 90) return "Very Easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Fairly Easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Fairly Difficult";
    if (score >= 30) return "Difficult";
    return "Very Difficult";
  }, []);

  const getComplexityColor = React.useCallback((complexity: string) => {
    switch (complexity) {
      case "simple":
        return "text-green-600";
      case "moderate":
        return "text-yellow-600";
      case "complex":
        return "text-orange-600";
      case "very complex":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  }, []);

  const getSentimentColor = React.useCallback((label: string) => {
    switch (label) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      case "neutral":
        return "text-gray-600";
      case "mixed":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  }, []);

  const downloadAnalysis = React.useCallback(() => {
    if (!analysisResult) return;

    let reportText = `Text Analysis Report\n`;
    reportText += `Generated: ${new Date().toISOString()}\n\n`;

    reportText += `=== TEXT STATISTICS ===\n`;
    reportText += `Characters: ${analysisResult.statistics.characterCount}\n`;
    reportText += `Words: ${analysisResult.statistics.wordCount}\n`;
    reportText += `Sentences: ${analysisResult.statistics.sentenceCount}\n`;
    reportText += `Paragraphs: ${analysisResult.statistics.paragraphCount}\n`;
    reportText += `Lines: ${analysisResult.statistics.lineCount}\n`;
    reportText += `Average Word Length: ${analysisResult.statistics.averageWordLength.toFixed(2)}\n`;
    reportText += `Average Words per Sentence: ${analysisResult.statistics.averageWordsPerSentence.toFixed(2)}\n\n`;

    reportText += `=== READABILITY METRICS ===\n`;
    reportText += `Flesch-Kincaid Grade: ${analysisResult.readability.fleschKincaidGrade.toFixed(1)}\n`;
    reportText += `Flesch Reading Ease: ${analysisResult.readability.fleschReadingEase.toFixed(1)} (${getReadabilityLevel(analysisResult.readability.fleschReadingEase)})\n`;
    reportText += `Gunning Fog Index: ${analysisResult.readability.gunningFogIndex.toFixed(1)}\n`;
    reportText += `Coleman-Liau Index: ${analysisResult.readability.colemanLiauIndex.toFixed(1)}\n`;
    reportText += `Text Complexity: ${analysisResult.complexity}\n\n`;

    reportText += `=== SENTIMENT ANALYSIS ===\n`;
    reportText += `Sentiment: ${analysisResult.sentiment.label} (${analysisResult.sentiment.score.toFixed(3)})\n`;
    reportText += `Magnitude: ${analysisResult.sentiment.magnitude.toFixed(3)}\n`;
    reportText += `Confidence: ${(analysisResult.sentiment.confidence * 100).toFixed(1)}%\n\n`;

    reportText += `=== TOP KEYWORDS ===\n`;
    analysisResult.keywords.slice(0, 20).forEach((keyword, index) => {
      reportText += `${index + 1}. ${keyword.word} (${keyword.frequency} times, ${keyword.density.toFixed(2)}%)\n`;
    });

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `text-analysis-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [analysisResult, getReadabilityLevel]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Advanced Text Analyzer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-text">Text to Analyze</Label>
              <Textarea
                id="input-text"
                placeholder="Enter or paste text to analyze..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Keyword Count: {keywordCount}</Label>
                <Slider
                  value={[keywordCount]}
                  onValueChange={([value]) => setKeywordCount(value)}
                  max={50}
                  min={5}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Min Word Length: {minWordLength}</Label>
                <Slider
                  value={[minWordLength]}
                  onValueChange={([value]) => setMinWordLength(value)}
                  max={10}
                  min={1}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Analysis Type</Label>
                <Select
                  value={analysisType}
                  onValueChange={(value) => setAnalysisType(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="include-stopwords"
                  checked={includeStopWords}
                  onChange={(e) => setIncludeStopWords(e.target.checked)}
                />
                <Label htmlFor="include-stopwords">Include Stop Words</Label>
              </div>
            </div>

            <Button onClick={analyzeText} disabled={!inputText.trim()}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyze Text
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {analysisResult && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="readability">Readability</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Language</p>
                        <p className="text-2xl font-bold">{analysisResult.language}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Complexity</p>
                        <p
                          className={`text-2xl font-bold capitalize ${getComplexityColor(analysisResult.complexity)}`}
                        >
                          {analysisResult.complexity}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Sentiment</p>
                        <p
                          className={`text-2xl font-bold capitalize ${getSentimentColor(analysisResult.sentiment.label)}`}
                        >
                          {analysisResult.sentiment.label}
                        </p>
                      </div>
                      <PieChart className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Reading Level</p>
                        <p className="text-lg font-bold">
                          Grade {Math.round(analysisResult.readability.fleschKincaidGrade)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    This text contains {analysisResult.statistics.wordCount} words and{" "}
                    {analysisResult.statistics.sentenceCount} sentences, making it{" "}
                    {analysisResult.complexity} to read. The overall sentiment is{" "}
                    {analysisResult.sentiment.label}
                    with {analysisResult.sentiment.magnitude.toFixed(3)} emotional intensity. The
                    Flesch Reading Ease score of{" "}
                    {analysisResult.readability.fleschReadingEase.toFixed(1)} indicates
                    {getReadabilityLevel(
                      analysisResult.readability.fleschReadingEase,
                    ).toLowerCase()}{" "}
                    reading material.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Text Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="font-medium">Character Count:</span>{" "}
                        {analysisResult.statistics.characterCount}
                      </div>
                      <div>
                        <span className="font-medium">Word Count:</span>{" "}
                        {analysisResult.statistics.wordCount}
                      </div>
                      <div>
                        <span className="font-medium">Sentence Count:</span>{" "}
                        {analysisResult.statistics.sentenceCount}
                      </div>
                      <div>
                        <span className="font-medium">Paragraph Count:</span>{" "}
                        {analysisResult.statistics.paragraphCount}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="font-medium">Line Count:</span>{" "}
                        {analysisResult.statistics.lineCount}
                      </div>
                      <div>
                        <span className="font-medium">Average Word Length:</span>{" "}
                        {analysisResult.statistics.averageWordLength.toFixed(2)} characters
                      </div>
                      <div>
                        <span className="font-medium">Average Words per Sentence:</span>{" "}
                        {analysisResult.statistics.averageWordsPerSentence.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">Average Sentences per Paragraph:</span>{" "}
                        {analysisResult.statistics.averageSentencesPerParagraph.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="readability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Readability Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Flesch-Kincaid Grade:</span>{" "}
                        <span className="font-bold">
                          {analysisResult.readability.fleschKincaidGrade.toFixed(1)}
                        </span>
                        <div className="text-sm text-gray-600">US Grade Level</div>
                      </div>
                      <div>
                        <span className="font-medium">Flesch Reading Ease:</span>{" "}
                        <span className="font-bold">
                          {analysisResult.readability.fleschReadingEase.toFixed(1)}
                        </span>
                        <div className="text-sm text-gray-600">
                          {getReadabilityLevel(analysisResult.readability.fleschReadingEase)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Gunning Fog Index:</span>{" "}
                        <span className="font-bold">
                          {analysisResult.readability.gunningFogIndex.toFixed(1)}
                        </span>
                        <div className="text-sm text-gray-600">Years of Education</div>
                      </div>
                      <div>
                        <span className="font-medium">Coleman-Liau Index:</span>{" "}
                        <span className="font-bold">
                          {analysisResult.readability.colemanLiauIndex.toFixed(1)}
                        </span>
                        <div className="text-sm text-gray-600">US Grade Level</div>
                      </div>
                      <div>
                        <span className="font-medium">Automated Readability Index:</span>{" "}
                        <span className="font-bold">
                          {analysisResult.readability.automatedReadabilityIndex.toFixed(1)}
                        </span>
                        <div className="text-sm text-gray-600">US Grade Level</div>
                      </div>
                      <div>
                        <span className="font-medium">Dale-Chall Score:</span>{" "}
                        <span className="font-bold">
                          {analysisResult.readability.daleChallScore.toFixed(1)}
                        </span>
                        <div className="text-sm text-gray-600">US Grade Level</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="font-medium">Sentiment Label:</span>{" "}
                        <span
                          className={`font-bold capitalize ${getSentimentColor(analysisResult.sentiment.label)}`}
                        >
                          {analysisResult.sentiment.label}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Sentiment Score:</span>{" "}
                        <span className="font-bold">
                          {analysisResult.sentiment.score.toFixed(3)}
                        </span>
                        <div className="text-sm text-gray-600">
                          Range: -1 (negative) to 1 (positive)
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Magnitude:</span>{" "}
                        <span className="font-bold">
                          {analysisResult.sentiment.magnitude.toFixed(3)}
                        </span>
                        <div className="text-sm text-gray-600">Emotional intensity</div>
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span>{" "}
                        <span className="font-bold">
                          {(analysisResult.sentiment.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="font-medium">Positive Words:</span>{" "}
                        {analysisResult.sentiment.positiveWords.length}
                        <div className="text-sm text-gray-600 max-h-20 overflow-auto">
                          {analysisResult.sentiment.positiveWords.slice(0, 10).join(", ")}
                          {analysisResult.sentiment.positiveWords.length > 10 && "..."}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Negative Words:</span>{" "}
                        {analysisResult.sentiment.negativeWords.length}
                        <div className="text-sm text-gray-600 max-h-20 overflow-auto">
                          {analysisResult.sentiment.negativeWords.slice(0, 10).join(", ")}
                          {analysisResult.sentiment.negativeWords.length > 10 && "..."}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Top Keywords & Phrases</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            analysisResult.keywords
                              .map((k) => `${k.word} (${k.frequency})`)
                              .join("\n"),
                          )
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Keywords
                      </Button>
                      <Button size="sm" variant="outline" onClick={downloadAnalysis}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Top Keywords (Frequency)</h4>
                      <div className="space-y-2">
                        {analysisResult.keywords.slice(0, 15).map((keyword, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span className="font-medium">{keyword.word}</span>
                            <div className="text-sm text-gray-600">
                              <span className="mr-3">{keyword.frequency}×</span>
                              <span>{keyword.density.toFixed(2)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Word Distribution</h4>
                      <div className="space-y-2">
                        {analysisResult.topWords.slice(0, 15).map((word, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-24 truncate">{word.word}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                              <div
                                className="bg-blue-500 h-4 rounded-full absolute top-0 left-0"
                                style={{ width: `${Math.min(word.percentage * 10, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-12 text-right">
                              {word.percentage.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
