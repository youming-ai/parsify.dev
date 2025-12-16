'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart3,
  BookOpen,
  Clock,
  FileText,
  Hash,
  Info,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface TextMetrics {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  lineCount: number;
  readingTime: number;
  speakingTime: number;
}

interface ReadabilityScore {
  fleschKincaid: number;
  fleschReading: number;
  colemanLiau: number;
  automatedReadability: number;
  gunningFog: number;
  smog: number;
  daleChall: number;
}

interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

interface SentimentAnalysis {
  polarity: number;
  subjectivity: number;
  label: string;
  confidence: number;
}

interface TextStatistics {
  averageWordLength: number;
  averageSentenceLength: number;
  lexicalDiversity: number;
  uniqueWords: number;
  longestWord: string;
  shortestWord: string;
  complexWords: number;
  simpleWords: number;
}

const TextAnalyzer: React.FC = () => {
  const [text, setText] = useState('');
  const [analysisType, setAnalysisType] = useState<string>('comprehensive');
  const [language, setLanguage] = useState<string>('en');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<TextMetrics | null>(null);
  const [readability, setReadability] = useState<ReadabilityScore | null>(null);
  const [wordFrequency, setWordFrequency] = useState<WordFrequency[]>([]);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [statistics, setStatistics] = useState<TextStatistics | null>(null);

  const sampleTexts = {
    essay:
      'The advancement of technology has fundamentally transformed the way we communicate, work, and live. From the invention of the internet to the proliferation of smartphones, digital innovations have reshaped nearly every aspect of modern society. These changes have brought unprecedented convenience and efficiency, but they have also introduced new challenges and concerns that we must address thoughtfully.',

    technical:
      'Machine learning algorithms leverage statistical techniques to identify patterns in large datasets. These models iteratively improve their performance through exposure to training examples. Deep learning architectures, particularly neural networks with multiple layers, excel at feature extraction and representation learning. Recent advances in transformer models have revolutionized natural language processing tasks.',

    narrative:
      'Sarah walked through the old library, her footsteps echoing on the wooden floors. Sunlight streamed through tall arched windows, illuminating dust motes dancing in the air. She ran her fingers along the spines of ancient books, each one containing worlds waiting to be discovered. In the quiet sanctuary of knowledge, she felt at home.',

    business: `Our company's third-quarter performance exceeded expectations with revenue growth of 15% year-over-year. Strategic initiatives in digital transformation have yielded significant operational efficiencies. Customer satisfaction scores improved to an all-time high of 92%. We anticipate continued expansion into emerging markets throughout the next fiscal year.`,
  };

  useEffect(() => {
    if (text) {
      analyzeText();
    }
  }, [text, analysisType, language]);

  const analyzeText = async () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Simulate analysis with progress
      await simulateProgress(30);
      const textMetrics = calculateMetrics(text);
      setMetrics(textMetrics);

      await simulateProgress(60);
      const textStatistics = calculateStatistics(text);
      setStatistics(textStatistics);

      await simulateProgress(80);
      const wordFreq = calculateWordFrequency(text);
      setWordFrequency(wordFreq);

      if (analysisType === 'comprehensive' || analysisType === 'readability') {
        const readabilityScores = calculateReadability(text, language);
        setReadability(readabilityScores);
      }

      if (analysisType === 'comprehensive' || analysisType === 'sentiment') {
        const sentimentAnalysis = analyzeSentiment(text);
        setSentiment(sentimentAnalysis);
      }

      await simulateProgress(100);
    } catch (error) {
      console.error('Text analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateProgress = async (target: number) => {
    const start = progress;
    const increment = (target - start) / 10;

    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setProgress((prev) => Math.min(prev + increment, target));
    }
  };

  const calculateMetrics = (inputText: string): TextMetrics => {
    const characters = inputText.length;
    const _charactersNoSpaces = inputText.replace(/\s/g, '').length;
    const words = inputText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const sentences = inputText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = inputText.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const lines = inputText.split('\n').filter((l) => l.trim().length > 0);

    const readingTime = Math.ceil(words.length / 200); // 200 words per minute
    const speakingTime = Math.ceil(words.length / 130); // 130 words per minute

    return {
      characterCount: characters,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      lineCount: lines.length,
      readingTime,
      speakingTime,
    };
  };

  const calculateStatistics = (inputText: string): TextStatistics => {
    const words = inputText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const sentences = inputText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const uniqueWordsSet = new Set(words.map((w) => w.toLowerCase()));

    const wordLengths = words.map((w) => w.length);
    const averageWordLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length || 0;

    const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
    const averageSentenceLength =
      sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 0;

    const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b), '');
    const shortestWord = words.reduce((a, b) => (a.length < b.length ? a : b), '');

    const complexWords = words.filter((w) => w.length > 6).length;
    const simpleWords = words.filter((w) => w.length <= 6).length;

    const lexicalDiversity = uniqueWordsSet.size / words.length || 0;

    return {
      averageWordLength,
      averageSentenceLength,
      lexicalDiversity,
      uniqueWords: uniqueWordsSet.size,
      longestWord,
      shortestWord,
      complexWords,
      simpleWords,
    };
  };

  const calculateWordFrequency = (inputText: string): WordFrequency[] => {
    const words = inputText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2); // Filter out very short words

    const wordMap = new Map<string, number>();

    words.forEach((word) => {
      const cleanedWord = word.replace(/[.,!?;:]/g, '');
      if (cleanedWord.length > 0) {
        wordMap.set(cleanedWord, (wordMap.get(cleanedWord) || 0) + 1);
      }
    });

    const total = words.length;
    return Array.from(wordMap.entries())
      .map(([word, count]) => ({
        word,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 words
  };

  const calculateReadability = (inputText: string, _lang: string): ReadabilityScore => {
    // Simplified readability scores (real implementation would be more complex)
    const words = inputText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const sentences = inputText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const syllables = words.reduce((total, word) => {
      return total + countSyllables(word);
    }, 0);

    const avgWordsPerSentence = words.length / sentences.length || 1;
    const avgSyllablesPerWord = syllables / words.length || 1;

    const fleschReading = Math.max(
      0,
      Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord)
    );

    const fleschKincaid = Math.max(
      0,
      0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
    );

    return {
      fleschKincaid: Math.round(fleschKincaid * 10) / 10,
      fleschReading: Math.round(fleschReading * 10) / 10,
      colemanLiau: Math.round(fleschKincaid * 1.2 * 10) / 10, // Simplified
      automatedReadability: Math.round(fleschKincaid * 1.1 * 10) / 10, // Simplified
      gunningFog:
        Math.round((avgWordsPerSentence + (complexWords(words) / words.length) * 100) * 0.4 * 10) /
        10,
      smog: Math.round(Math.sqrt(complexWords(words)) * 3 + 0.5), // Simplified
      daleChall: Math.round(fleschReading * 0.8 * 10) / 10, // Simplified
    };
  };

  const countSyllables = (word: string): number => {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = 'aeiouy'.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent e
    if (word.endsWith('e') && syllableCount > 1) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  };

  const complexWords = (words: string[]): number => {
    return words.filter((word) => countSyllables(word) >= 3).length;
  };

  const analyzeSentiment = (inputText: string): SentimentAnalysis => {
    // Simplified sentiment analysis
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'fantastic',
      'love',
      'beautiful',
      'awesome',
      'perfect',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'horrible',
      'hate',
      'ugly',
      'worst',
      'disaster',
      'fail',
      'poor',
    ];

    const words = inputText.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (positiveWords.includes(cleanWord)) positiveCount++;
      if (negativeWords.includes(cleanWord)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    const polarity =
      totalSentimentWords > 0 ? (positiveCount - negativeCount) / totalSentimentWords : 0;
    const subjectivity = totalSentimentWords / words.length || 0;

    let label = 'Neutral';
    if (polarity > 0.1) label = 'Positive';
    else if (polarity < -0.1) label = 'Negative';

    const confidence = Math.min(1, totalSentimentWords / 10);

    return {
      polarity: Math.round(polarity * 100) / 100,
      subjectivity: Math.round(subjectivity * 100) / 100,
      label,
      confidence: Math.round(confidence * 100) / 100,
    };
  };

  const getReadabilityLevel = (score: number): { level: string; color: string } => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-600' };
    if (score >= 80) return { level: 'Easy', color: 'text-green-500' };
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-500' };
    if (score >= 60) return { level: 'Standard', color: 'text-yellow-600' };
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-500' };
    if (score >= 30) return { level: 'Difficult', color: 'text-orange-600' };
    return { level: 'Very Difficult', color: 'text-red-600' };
  };

  const loadSampleText = (type: keyof typeof sampleTexts) => {
    setText(sampleTexts[type]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Text Input
            </CardTitle>
            <CardDescription>Enter or paste your text for comprehensive analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue placeholder="Analysis Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  <SelectItem value="readability">Readability</SelectItem>
                  <SelectItem value="sentiment">Sentiment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text here for analysis..."
              className="min-h-[200px] font-mono text-sm"
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => loadSampleText('essay')} variant="outline" size="sm">
                Essay Sample
              </Button>
              <Button onClick={() => loadSampleText('technical')} variant="outline" size="sm">
                Technical Sample
              </Button>
              <Button onClick={() => loadSampleText('narrative')} variant="outline" size="sm">
                Narrative Sample
              </Button>
              <Button onClick={() => loadSampleText('business')} variant="outline" size="sm">
                Business Sample
              </Button>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing text...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Text Metrics
              </CardTitle>
              <CardDescription>Basic text measurements and counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Characters</span>
                    <Badge variant="secondary">{metrics.characterCount.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Words</span>
                    <Badge variant="secondary">{metrics.wordCount.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Sentences</span>
                    <Badge variant="secondary">{metrics.sentenceCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Paragraphs</span>
                    <Badge variant="secondary">{metrics.paragraphCount}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Lines</span>
                    <Badge variant="secondary">{metrics.lineCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium text-sm">
                      <Clock className="h-3 w-3" />
                      Reading Time
                    </span>
                    <Badge variant="outline">{metrics.readingTime} min</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium text-sm">
                      <Users className="h-3 w-3" />
                      Speaking Time
                    </span>
                    <Badge variant="outline">{metrics.speakingTime} min</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Text Statistics
            </CardTitle>
            <CardDescription>Advanced linguistic analysis and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="font-bold text-2xl text-blue-600">
                  {statistics.averageWordLength.toFixed(1)}
                </div>
                <div className="text-muted-foreground text-sm">Avg Word Length</div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="font-bold text-2xl text-green-600">
                  {statistics.averageSentenceLength.toFixed(1)}
                </div>
                <div className="text-muted-foreground text-sm">Avg Sentence Length</div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="font-bold text-2xl text-purple-600">
                  {(statistics.lexicalDiversity * 100).toFixed(1)}%
                </div>
                <div className="text-muted-foreground text-sm">Lexical Diversity</div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="font-bold text-2xl text-orange-600">{statistics.uniqueWords}</div>
                <div className="text-muted-foreground text-sm">Unique Words</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium text-sm">Word Length Distribution</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Simple Words (&lt;=6 chars)</span>
                  <Badge variant="secondary">{statistics.simpleWords}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Complex Words (&gt;6 chars)</span>
                  <Badge variant="secondary">{statistics.complexWords}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium text-sm">Extreme Words</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Longest Word</span>
                  <Badge variant="outline" className="max-w-[120px] truncate">
                    {statistics.longestWord}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shortest Word</span>
                  <Badge variant="outline">{statistics.shortestWord}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="readability" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="readability">Readability</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="frequency">Word Frequency</TabsTrigger>
        </TabsList>

        {readability && (
          <TabsContent value="readability">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Readability Analysis
                </CardTitle>
                <CardDescription>Various readability scores and difficulty levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      score: readability.fleschReading,
                      name: 'Flesch Reading Ease',
                      desc: '0-30: Very Difficult, 90-100: Very Easy',
                    },
                    {
                      score: readability.fleschKincaid,
                      name: 'Flesch-Kincaid Grade',
                      desc: 'U.S. school grade level',
                    },
                    {
                      score: readability.colemanLiau,
                      name: 'Coleman-Liau Index',
                      desc: 'Grade level based on characters',
                    },
                    {
                      score: readability.automatedReadability,
                      name: 'Automated Readability',
                      desc: 'Formula based on characters',
                    },
                    {
                      score: readability.gunningFog,
                      name: 'Gunning Fog Index',
                      desc: 'Years of education needed',
                    },
                    {
                      score: readability.daleChall,
                      name: 'Dale-Chall Score',
                      desc: 'Based on familiar words',
                    },
                  ].map((metric, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="font-medium text-sm">{metric.name}</h4>
                        <span
                          className={`font-bold text-lg ${
                            metric.score < 30
                              ? 'text-red-600'
                              : metric.score < 50
                                ? 'text-orange-600'
                                : metric.score < 70
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                          }`}
                        >
                          {metric.score.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">{metric.desc}</p>
                    </div>
                  ))}
                </div>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Reading Level:</strong>{' '}
                    {getReadabilityLevel(readability.fleschReading).level}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {sentiment && (
          <TabsContent value="sentiment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Sentiment Analysis
                </CardTitle>
                <CardDescription>Emotional tone and subjectivity of the text</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="rounded-lg bg-muted p-6 text-center">
                    <div
                      className={`mb-2 font-bold text-3xl ${
                        sentiment.polarity > 0.1
                          ? 'text-green-600'
                          : sentiment.polarity < -0.1
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {sentiment.label}
                    </div>
                    <div className="text-muted-foreground text-sm">Overall Sentiment</div>
                  </div>

                  <div className="rounded-lg bg-muted p-6 text-center">
                    <div className="mb-2 font-bold text-3xl text-blue-600">
                      {sentiment.polarity > 0 ? '+' : ''}
                      {sentiment.polarity}
                    </div>
                    <div className="text-muted-foreground text-sm">Polarity (-1 to +1)</div>
                  </div>

                  <div className="rounded-lg bg-muted p-6 text-center">
                    <div className="mb-2 font-bold text-3xl text-purple-600">
                      {(sentiment.subjectivity * 100).toFixed(0)}%
                    </div>
                    <div className="text-muted-foreground text-sm">Subjectivity</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-sm">Confidence</span>
                    <span className="text-sm">{(sentiment.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={sentiment.confidence * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {wordFrequency.length > 0 && (
          <TabsContent value="frequency">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Word Frequency Analysis
                </CardTitle>
                <CardDescription>Most frequently used words in your text</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {wordFrequency.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg p-3 hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 font-medium text-muted-foreground text-sm">
                            {index + 1}
                          </span>
                          <span className="font-medium capitalize">{item.word}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">{item.count} times</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-muted-foreground text-xs">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TextAnalyzer;
