/**
 * Text Processing Worker
 * Handles heavy text processing tasks in a separate thread
 */

/**
 * Advanced text search and replace
 */
function searchAndReplace(data) {
  const { text, patterns, options = {} } = data;

  try {
    const startTime = performance.now();
    let result = text;
    const matches = [];
    let processedPatterns = 0;

    for (const pattern of patterns) {
      processedPatterns++;

      // Create regex from pattern
      let searchRegex;
      if (pattern.type === 'regex') {
        searchRegex = new RegExp(pattern.search, pattern.flags || 'g');
      } else {
        // Escape special regex characters for literal search
        const escapedSearch = pattern.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchRegex = new RegExp(escapedSearch, 'g');
      }

      // Find all matches before replacement
      if (options.collectMatches) {
        let match;
        while ((match = searchRegex.exec(result)) !== null) {
          matches.push({
            pattern: pattern.search,
            match: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
        // Reset regex for replacement
        searchRegex.lastIndex = 0;
      }

      // Perform replacement
      if (pattern.type === 'function' && typeof pattern.replace === 'string') {
        // Use function replacement
        result = result.replace(searchRegex, new Function('match', ...Array.from({length: 10}, (_, i) => `group${i}`), pattern.replace));
      } else {
        result = result.replace(searchRegex, pattern.replace);
      }

      // Report progress
      if (options.reportProgress) {
        self.postMessage({
          id: 'progress',
          type: 'task-progress',
          payload: {
            progress: processedPatterns / patterns.length * 100,
            message: `Processed ${processedPatterns} of ${patterns.length} patterns`
          },
          timestamp: new Date()
        });
      }
    }

    const endTime = performance.now();

    return {
      success: true,
      data: {
        text: result,
        matches,
        patternsProcessed: processedPatterns
      },
      metadata: {
        processingTime: endTime - startTime,
        originalLength: text.length,
        resultLength: result.length,
        changes: result.length !== text.length,
        matchesFound: matches.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'SEARCH_REPLACE_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Text analysis and statistics
 */
function analyzeText(data) {
  const { text, options = {} } = data;

  try {
    const startTime = performance.now();

    const analysis = {
      basic: getBasicStats(text),
      readability: getReadabilityStats(text),
      sentiment: getSentimentAnalysis(text),
      keywords: extractKeywords(text, options.keywordOptions),
      structure: getTextStructure(text),
      language: detectTextLanguage(text)
    };

    if (options.detailedAnalysis) {
      analysis.advanced = getAdvancedStats(text);
      analysis.patterns = findPatterns(text);
    }

    const endTime = performance.now();

    return {
      success: true,
      data: analysis,
      metadata: {
        processingTime: endTime - startTime,
        analysisLevel: options.detailedAnalysis ? 'detailed' : 'basic',
        textLength: text.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'TEXT_ANALYSIS_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Advanced text transformation
 */
function transformText(data) {
  const { text, transformations, options = {} } = data;

  try {
    const startTime = performance.now();
    let result = text;
    const appliedTransformations = [];

    for (const transformation of transformations) {
      const transformResult = applyTransformation(result, transformation, options);
      result = transformResult.text;
      appliedTransformations.push({
        type: transformation.type,
        success: transformResult.success,
        changes: transformResult.changes
      });
    }

    const endTime = performance.now();

    return {
      success: true,
      data: {
        text: result,
        transformations: appliedTransformations
      },
      metadata: {
        processingTime: endTime - startTime,
        originalLength: text.length,
        resultLength: result.length,
        transformationsApplied: transformations.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'TEXT_TRANSFORMATION_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Text comparison and diff
 */
function compareTexts(data) {
  const { left, right, options = {} } = data;

  try {
    const startTime = performance.now();

    const comparison = {
      similarity: calculateSimilarity(left, right, options.algorithm),
      differences: findTextDifferences(left, right, options),
      statistics: getComparisonStats(left, right),
      unifiedDiff: generateUnifiedDiff(left, right, options)
    };

    const endTime = performance.now();

    return {
      success: true,
      data: comparison,
      metadata: {
        processingTime: endTime - startTime,
        leftLength: left.length,
        rightLength: right.length,
        comparisonAlgorithm: options.algorithm || 'levenshtein'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'TEXT_COMPARISON_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Text encoding and decoding
 */
function processEncoding(data) {
  const { text, operation, encoding, options = {} } = data;

  try {
    const startTime = performance.now();
    let result;

    switch (operation) {
      case 'encode':
        result = encodeText(text, encoding, options);
        break;
      case 'decode':
        result = decodeText(text, encoding, options);
        break;
      case 'detect':
        result = detectEncoding(text, options);
        break;
      default:
        throw new Error(`Unknown encoding operation: ${operation}`);
    }

    const endTime = performance.now();

    return {
      success: true,
      data: result,
      metadata: {
        processingTime: endTime - startTime,
        operation,
        encoding,
        originalLength: text.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ENCODING_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Text extraction and parsing
 */
function extractFromText(data) {
  const { text, extractors, options = {} } = data;

  try {
    const startTime = performance.now();
    const results = {};

    for (const extractor of extractors) {
      const extractorResult = applyExtractor(text, extractor, options);
      results[extractor.name] = extractorResult;
    }

    const endTime = performance.now();

    return {
      success: true,
      data: results,
      metadata: {
        processingTime: endTime - startTime,
        extractorsApplied: extractors.length,
        textLength: text.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'TEXT_EXTRACTION_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

// Helper functions

function getBasicStats(text) {
  const words = text.match(/\b\w+\b/g) || [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;

  return {
    characters,
    charactersNoSpaces,
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
    averageCharactersPerWord: words.length > 0 ? charactersNoSpaces / words.length : 0
  };
}

function getReadabilityStats(text) {
  const words = text.match(/\b\w+\b/g) || [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

  // Flesch Reading Ease Score
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

  // Flesch-Kincaid Grade Level
  const fleschKincaidGrade = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;

  return {
    fleschReadingEase: Math.max(0, Math.min(100, fleschScore)),
    fleschKincaidGrade: Math.max(0, fleschKincaidGrade),
    readingLevel: getReadingLevel(fleschScore),
    avgSentenceLength,
    avgSyllablesPerWord
  };
}

function getSentimentAnalysis(text) {
  // Simple sentiment analysis using word lists
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'enjoy', 'happy', 'pleased'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'sad', 'disappointed', 'poor', 'worst'];

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  const totalSentimentWords = positiveCount + negativeCount;

  let sentiment = 'neutral';
  let score = 0;

  if (totalSentimentWords > 0) {
    score = (positiveCount - negativeCount) / totalSentimentWords;
    if (score > 0.1) sentiment = 'positive';
    else if (score < -0.1) sentiment = 'negative';
  }

  return {
    sentiment,
    score: Math.round(score * 100) / 100,
    positiveWords: positiveCount,
    negativeWords: negativeCount,
    neutralWords: words.length - positiveCount - negativeCount
  };
}

function extractKeywords(text, options = {}) {
  const minFrequency = options.minFrequency || 2;
  const maxKeywords = options.maxKeywords || 20;

  // Remove stop words and count word frequencies
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);

  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const wordFreq = {};

  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Sort by frequency and return top keywords
  const keywords = Object.entries(wordFreq)
    .filter(([_, freq]) => freq >= minFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word, freq]) => ({ word, frequency: freq }));

  return keywords;
}

function getTextStructure(text) {
  const lines = text.split('\n');
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  return {
    lines: lines.length,
    paragraphs: paragraphs.length,
    hasHeadings: /^#+\s/m.test(text),
    hasLists: /^[*-]\s/m.test(text),
    hasLinks: /https?:\/\/[^\s]+/m.test(text),
    hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/m.test(text),
    hasNumbers: /\d/.test(text),
    hasUppercase: /[A-Z]/.test(text)
  };
}

function detectTextLanguage(text) {
  // Simple language detection using word patterns
  const patterns = {
    en: /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i,
    es: /\b(el|la|y|o|pero|en|de|para|con|por)\b/i,
    fr: /\b(le|la|et|ou|mais|dans|de|pour|avec|par)\b/i,
    de: /\b(der|die|das|und|oder|aber|in|an|zu|für|mit|von)\b/i,
    it: /\b(il|la|e|o|ma|in|di|per|con|da)\b/i
  };

  let maxScore = 0;
  let detectedLang = 'unknown';

  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    const score = matches ? matches.length : 0;

    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

function getAdvancedStats(text) {
  const words = text.match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  return {
    uniqueWords: uniqueWords.size,
    lexicalDiversity: words.length > 0 ? uniqueWords.size / words.length : 0,
    longestWord: words.reduce((longest, word) => word.length > longest.length ? word : longest, ''),
    averageWordLength: words.length > 0 ? words.reduce((sum, word) => sum + word.length, 0) / words.length : 0
  };
}

function findPatterns(text) {
  const patterns = {
    urls: text.match(/https?:\/\/[^\s]+/g) || [],
    emails: text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
    phoneNumbers: text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [],
    dates: text.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g) || [],
    numbers: text.match(/\b\d+\.?\d*\b/g) || []
  };

  return patterns;
}

function applyTransformation(text, transformation, options) {
  const { type, params = {} } = transformation;
  let result = text;
  let changes = 0;
  let success = true;

  try {
    switch (type) {
      case 'case':
        ({ result, changes } = applyCaseTransformation(result, params));
        break;
      case 'whitespace':
        ({ result, changes } = applyWhitespaceTransformation(result, params));
        break;
      case 'format':
        ({ result, changes } = applyFormatTransformation(result, params));
        break;
      case 'normalize':
        ({ result, changes } = applyNormalizationTransformation(result, params));
        break;
      case 'custom':
        ({ result, changes } = applyCustomTransformation(result, params));
        break;
      default:
        throw new Error(`Unknown transformation type: ${type}`);
    }
  } catch (error) {
    success = false;
    result = text;
  }

  return { text: result, changes, success };
}

function applyCaseTransformation(text, params) {
  const { case: caseType } = params;
  let result = text;
  let changes = 0;

  switch (caseType) {
    case 'upper':
      result = text.toUpperCase();
      changes = result !== text ? 1 : 0;
      break;
    case 'lower':
      result = text.toLowerCase();
      changes = result !== text ? 1 : 0;
      break;
    case 'title':
      result = text.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      changes = result !== text ? 1 : 0;
      break;
    case 'sentence':
      result = text.replace(/(^\w|\.\s+\w)/g, txt => txt.toUpperCase());
      changes = result !== text ? 1 : 0;
      break;
    case 'camel':
      result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      }).replace(/\s+/g, '');
      changes = result !== text ? 1 : 0;
      break;
    case 'pascal':
      result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/\s+/g, '');
      changes = result !== text ? 1 : 0;
      break;
    case 'snake':
      result = text.toLowerCase().replace(/\s+/g, '_');
      changes = result !== text ? 1 : 0;
      break;
    case 'kebab':
      result = text.toLowerCase().replace(/\s+/g, '-');
      changes = result !== text ? 1 : 0;
      break;
  }

  return { result, changes };
}

function applyWhitespaceTransformation(text, params) {
  const { action } = params;
  let result = text;
  let changes = 0;

  switch (action) {
    case 'trim':
      result = text.trim();
      changes = result.length !== text.length ? 1 : 0;
      break;
    case 'normalize':
      result = text.replace(/\s+/g, ' ').trim();
      changes = result.length !== text.length ? 1 : 0;
      break;
    case 'remove-line-breaks':
      result = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
      changes = result !== text ? 1 : 0;
      break;
    case 'add-line-breaks':
      result = text.replace(/([.!?])\s*/g, '$1\n');
      changes = result !== text ? 1 : 0;
      break;
  }

  return { result, changes };
}

function applyFormatTransformation(text, params) {
  const { format } = params;
  let result = text;
  let changes = 0;

  switch (format) {
    case 'html-escape':
      result = text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#39;');
      changes = result !== text ? 1 : 0;
      break;
    case 'url-encode':
      result = encodeURIComponent(text);
      changes = result !== text ? 1 : 0;
      break;
    case 'url-decode':
      result = decodeURIComponent(text);
      changes = result !== text ? 1 : 0;
      break;
    case 'base64-encode':
      result = btoa(text);
      changes = result !== text ? 1 : 0;
      break;
    case 'base64-decode':
      result = atob(text);
      changes = result !== text ? 1 : 0;
      break;
  }

  return { result, changes };
}

function applyNormalizationTransformation(text, params) {
  const { type } = params;
  let result = text;
  let changes = 0;

  switch (type) {
    case 'unicode':
      result = text.normalize('NFC');
      changes = result !== text ? 1 : 0;
      break;
    case 'punctuation':
      result = text.replace(/\s*([.,;:!?])\s*/g, '$1 ');
      changes = result !== text ? 1 : 0;
      break;
    case 'quotes':
      result = text.replace(/['"]/g, '"');
      changes = result !== text ? 1 : 0;
      break;
  }

  return { result, changes };
}

function applyCustomTransformation(text, params) {
  const { function: func } = params;

  if (!func) {
    return { result: text, changes: 0 };
  }

  try {
    const result = new Function('text', func)(text);
    return { result, changes: result !== text ? 1 : 0 };
  } catch (error) {
    throw new Error(`Custom transformation error: ${error.message}`);
  }
}

function calculateSimilarity(left, right, algorithm = 'levenshtein') {
  switch (algorithm) {
    case 'levenshtein':
      return calculateLevenshteinSimilarity(left, right);
    case 'cosine':
      return calculateCosineSimilarity(left, right);
    case 'jaccard':
      return calculateJaccardSimilarity(left, right);
    default:
      return calculateLevenshteinSimilarity(left, right);
  }
}

function calculateLevenshteinSimilarity(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

function calculateCosineSimilarity(str1, str2) {
  const getWords = (text) => text.toLowerCase().match(/\b\w+\b/g) || [];
  const words1 = getWords(str1);
  const words2 = getWords(str2);

  const allWords = new Set([...words1, ...words2]);
  const vector1 = Array.from(allWords).map(word => words1.filter(w => w === word).length);
  const vector2 = Array.from(allWords).map(word => words2.filter(w => w === word).length);

  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  return magnitude1 === 0 || magnitude2 === 0 ? 0 : dotProduct / (magnitude1 * magnitude2);
}

function calculateJaccardSimilarity(str1, str2) {
  const getWords = (text) => new Set(text.toLowerCase().match(/\b\w+\b/g) || []);
  const set1 = getWords(str1);
  const set2 = getWords(str2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 1 : intersection.size / union.size;
}

function findTextDifferences(left, right, options = {}) {
  const context = options.context || 3;
  const differences = [];

  const lines1 = left.split('\n');
  const lines2 = right.split('\n');

  let i = 0, j = 0;

  while (i < lines1.length && j < lines2.length) {
    if (lines1[i] === lines2[j]) {
      i++;
      j++;
    } else {
      // Find the next matching line
      let foundMatch = false;

      for (let k = 1; k <= context; k++) {
        if (i + k < lines1.length && lines1[i + k] === lines2[j]) {
          differences.push({
            type: 'removed',
            line: i + 1,
            content: lines1.slice(i, i + k)
          });
          i += k;
          foundMatch = true;
          break;
        } else if (j + k < lines2.length && lines1[i] === lines2[j + k]) {
          differences.push({
            type: 'added',
            line: i + 1,
            content: lines2.slice(j, j + k)
          });
          j += k;
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        differences.push({
          type: 'modified',
          line: i + 1,
          left: lines1[i],
          right: lines2[j]
        });
        i++;
        j++;
      }
    }
  }

  // Handle remaining lines
  while (i < lines1.length) {
    differences.push({
      type: 'removed',
      line: i + 1,
      content: [lines1[i]]
    });
    i++;
  }

  while (j < lines2.length) {
    differences.push({
      type: 'added',
      line: lines1.length + 1,
      content: [lines2[j]]
    });
    j++;
  }

  return differences;
}

function getComparisonStats(left, right) {
  return {
    leftLength: left.length,
    rightLength: right.length,
    leftLines: left.split('\n').length,
    rightLines: right.split('\n').length,
    leftWords: (left.match(/\b\w+\b/g) || []).length,
    rightWords: (right.match(/\b\w+\b/g) || []).length
  };
}

function generateUnifiedDiff(left, right, options = {}) {
  const { context = 3 } = options;

  const differences = findTextDifferences(left, right, { context });
  const lines1 = left.split('\n');
  const lines2 = right.split('\n');

  let diffLines = [];

  differences.forEach(diff => {
    switch (diff.type) {
      case 'added':
        diffLines.push(`@@ -${diff.line},${diff.line} +${diff.line},${diff.line + diff.content.length - 1} @@`);
        diff.content.forEach(line => {
          diffLines.push(`+${line}`);
        });
        break;
      case 'removed':
        diffLines.push(`@@ -${diff.line},${diff.line + diff.content.length - 1} +${diff.line},${diff.line} @@`);
        diff.content.forEach(line => {
          diffLines.push(`-${line}`);
        });
        break;
      case 'modified':
        diffLines.push(`@@ -${diff.line},${diff.line} +${diff.line},${diff.line} @@`);
        diffLines.push(`-${diff.left}`);
        diffLines.push(`+${diff.right}`);
        break;
    }
  });

  return diffLines.join('\n');
}

function encodeText(text, encoding, options = {}) {
  switch (encoding) {
    case 'base64':
      return btoa(text);
    case 'uri':
      return encodeURIComponent(text);
    case 'uri-component':
      return encodeURIComponent(text);
    case 'html':
      return text.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#39;');
    case 'hex':
      return Array.from(new TextEncoder().encode(text))
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('');
    default:
      throw new Error(`Unsupported encoding: ${encoding}`);
  }
}

function decodeText(text, encoding, options = {}) {
  try {
    switch (encoding) {
      case 'base64':
        return atob(text);
      case 'uri':
        return decodeURIComponent(text);
      case 'uri-component':
        return decodeURIComponent(text);
      case 'html':
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
      case 'hex':
        const hexString = text.replace(/[^0-9A-Fa-f]/g, '');
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }
        return new TextDecoder().decode(bytes);
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }
  } catch (error) {
    throw new Error(`Failed to decode ${encoding}: ${error.message}`);
  }
}

function detectEncoding(text, options = {}) {
  // Simple encoding detection
  if (text.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
    return { encoding: 'base64', confidence: 0.9 };
  }

  if (text.includes('%') && text.match(/%[0-9A-Fa-f]{2}/)) {
    return { encoding: 'uri', confidence: 0.8 };
  }

  if (text.includes('&') && text.match(/&[a-zA-Z]+;/)) {
    return { encoding: 'html', confidence: 0.7 };
  }

  if (text.match(/^[0-9A-Fa-f]+$/)) {
    return { encoding: 'hex', confidence: 0.6 };
  }

  return { encoding: 'plain', confidence: 0.5 };
}

function applyExtractor(text, extractor, options = {}) {
  const { type, pattern, flags = '' } = extractor;
  let results = [];

  try {
    switch (type) {
      case 'regex':
        const regex = new RegExp(pattern, flags);
        let match;
        while ((match = regex.exec(text)) !== null) {
          results.push({
            match: match[0],
            groups: match.slice(1),
            index: match.index
          });
        }
        break;

      case 'xpath':
        // XPath extraction would require more complex implementation
        break;

      case 'css':
        // CSS selector extraction would require DOM parsing
        break;

      case 'custom':
        if (extractor.function) {
          results = new Function('text', extractor.function)(text);
          if (!Array.isArray(results)) {
            results = [results];
          }
        }
        break;
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: []
    };
  }

  return {
    success: true,
    results,
    count: results.length
  };
}

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function getReadingLevel(fleschScore) {
  if (fleschScore >= 90) return 'very easy';
  if (fleschScore >= 80) return 'easy';
  if (fleschScore >= 70) return 'fairly easy';
  if (fleschScore >= 60) return 'standard';
  if (fleschScore >= 50) return 'fairly difficult';
  if (fleschScore >= 30) return 'difficult';
  return 'very difficult';
}

// Message handling
self.onmessage = function(event) {
  const { id, type, payload } = event.data;

  try {
    let result;

    switch (type) {
      case 'task-execute':
        const { taskId, type: taskType, data } = payload;

        switch (taskType) {
          case 'search-replace':
            result = searchAndReplace(data);
            break;
          case 'analyze-text':
            result = analyzeText(data);
            break;
          case 'transform-text':
            result = transformText(data);
            break;
          case 'compare-texts':
            result = compareTexts(data);
            break;
          case 'process-encoding':
            result = processEncoding(data);
            break;
          case 'extract-from-text':
            result = extractFromText(data);
            break;
          default:
            throw new Error(`Unknown task type: ${taskType}`);
        }

        self.postMessage({
          id,
          type: 'task-complete',
          taskId,
          payload: result,
          timestamp: new Date()
        });
        break;

      case 'task-cancel':
        self.postMessage({
          id,
          type: 'task-complete',
          taskId: payload.taskId,
          payload: {
            success: false,
            error: {
              code: 'TASK_CANCELLED',
              message: 'Task was cancelled',
              recoverable: false
            }
          },
          timestamp: new Date()
        });
        break;

      case 'ping':
        self.postMessage({
          id,
          type: 'pong',
          payload: { timestamp: new Date() },
          timestamp: new Date()
        });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'task-error',
      taskId: payload?.taskId,
      payload: {
        code: 'WORKER_ERROR',
        message: error.message,
        stack: error.stack,
        recoverable: true
      },
      timestamp: new Date()
    });
  }
};

// Send ready message
self.postMessage({
  id: 'init',
  type: 'worker-ready',
  payload: { capabilities: ['search-replace', 'analyze-text', 'transform-text', 'compare-texts', 'process-encoding', 'extract-from-text'] },
  timestamp: new Date()
});
