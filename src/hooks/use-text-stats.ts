import { useMemo } from 'react';

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  avgWordLength: number;
  avgSentenceLength: number;
  readingTime: number;
  speakingTime: number;
  lexicalDensity: number;
  readabilityScore: number;
}

export function useTextStats(text: string, includeNumbers: boolean, includePunctuation: boolean) {
  return useMemo((): TextStats => {
    if (!text) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        lines: 0,
        paragraphs: 0,
        sentences: 0,
        avgWordLength: 0,
        avgSentenceLength: 0,
        readingTime: 0,
        speakingTime: 0,
        lexicalDensity: 0,
        readabilityScore: 0,
      };
    }

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;

    const wordPattern = includeNumbers
      ? /[a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?/g
      : /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
    const words = text.match(wordPattern) || [];
    const wordCount = words.length;

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;

    const avgWordLength =
      wordCount > 0 ? words.reduce((sum, word) => sum + word.length, 0) / wordCount : 0;

    const avgSentenceLength = sentences > 0 ? wordCount / sentences : 0;

    const readingTime = Math.ceil(wordCount / 200);
    const speakingTime = Math.ceil(wordCount / 150);

    const contentWords = words.filter(
      (word) =>
        ![
          'the',
          'a',
          'an',
          'and',
          'or',
          'but',
          'in',
          'on',
          'at',
          'to',
          'for',
          'of',
          'with',
          'by',
          'from',
        ].includes(word.toLowerCase())
    ).length;
    const lexicalDensity = wordCount > 0 ? (contentWords / wordCount) * 100 : 0;

    const avgWordsPerSentence = avgSentenceLength;
    const avgSyllablesPerWord = avgWordLength * 0.8;
    const readabilityScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    return {
      characters,
      charactersNoSpaces,
      words: wordCount,
      lines,
      paragraphs,
      sentences,
      avgWordLength,
      avgSentenceLength,
      readingTime,
      speakingTime,
      lexicalDensity,
      readabilityScore,
    };
  }, [text, includeNumbers, includePunctuation]);
}
