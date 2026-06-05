import { describe, expect, test } from 'bun:test';
import type { SeoAnalysisResponse, SeoMdDocument } from '~/schemas/seo';
import {
  calculateOverallScore,
  formatScore,
  getPriorityColorClass,
  getPriorityLabel,
  getScoreBgColorClass,
  getScoreColorClass,
  isValidSeoResponse,
} from '~/schemas/seo';

describe('SEO Schema', () => {
  const mockSeoMd: SeoMdDocument = {
    frontmatter: {
      domain: 'example.com',
      generatedAt: '2024-01-01T00:00:00Z',
      industry: 'Technology',
      targetAudience: 'Developers',
      seoScore: 85,
    },
    overview: {
      siteDescription: 'Example website',
      primaryKeywords: ['example', 'test'],
      competitors: ['competitor1.com'],
    },
    technicalSeo: {
      pageSpeed: 'Good',
      mobileFriendly: 'Yes',
      structuredData: 'Present',
      score: 80,
    },
    contentSeo: {
      titleStructure: 'Good',
      keywordDensity: 'Optimal',
      contentQuality: 'High',
      score: 85,
    },
    metaTags: {
      title: 'Good title',
      description: 'Good description',
      openGraph: 'Present',
      twitterCards: 'Present',
      score: 90,
    },
    linkStructure: {
      internalLinks: 'Good',
      externalLinks: 'Some',
      anchorText: 'Descriptive',
      score: 75,
    },
    recommendations: [
      {
        priority: 'high',
        category: 'Technical SEO',
        title: 'Improve page speed',
        description: 'Optimize images and minify CSS',
        implementation: 'Use image compression and CSS minification tools',
      },
    ],
    optimizedContent: {
      title: 'Optimized Title',
      description: 'Optimized description',
      markdown: '# Optimized Content\n\nThis is optimized content.',
    },
  };

  const mockSeoResponse: SeoAnalysisResponse = {
    seoMd: mockSeoMd,
    robotsTxt: 'User-agent: *\nAllow: /',
    llmTxt: '# LLM.txt\n\nThis is an llm.txt file.',
  };

  describe('isValidSeoResponse', () => {
    test('validates correct SEO response', () => {
      expect(isValidSeoResponse(mockSeoResponse)).toBe(true);
    });

    test('rejects null response', () => {
      expect(isValidSeoResponse(null)).toBe(false);
    });

    test('rejects response missing seoMd', () => {
      const invalid = { robotsTxt: 'test', llmTxt: 'test' };
      expect(isValidSeoResponse(invalid)).toBe(false);
    });

    test('rejects response missing robotsTxt', () => {
      const invalid = { seoMd: mockSeoMd, llmTxt: 'test' };
      expect(isValidSeoResponse(invalid)).toBe(false);
    });

    test('rejects response missing llmTxt', () => {
      const invalid = { seoMd: mockSeoMd, robotsTxt: 'test' };
      expect(isValidSeoResponse(invalid)).toBe(false);
    });

    test('rejects seoMd with invalid frontmatter', () => {
      const invalid = {
        seoMd: { ...mockSeoMd, frontmatter: { domain: 123 } },
        robotsTxt: 'test',
        llmTxt: 'test',
      };
      expect(isValidSeoResponse(invalid)).toBe(false);
    });
  });

  describe('calculateOverallScore', () => {
    test('calculates average score correctly', () => {
      const score = calculateOverallScore(mockSeoMd);
      expect(score).toBe(83); // (80 + 85 + 90 + 75) / 4 = 82.5, rounded to 83
    });

    test('handles missing scores', () => {
      const incompleteSeoMd = {
        ...mockSeoMd,
        technicalSeo: { ...mockSeoMd.technicalSeo, score: undefined as unknown as number },
      };
      const score = calculateOverallScore(incompleteSeoMd);
      expect(score).toBe(83); // (85 + 90 + 75) / 3 = 83.33, rounded to 83
    });
  });

  describe('getScoreColorClass', () => {
    test('returns excellent color for score >= 90', () => {
      expect(getScoreColorClass(95)).toBe('text-seo-excellent');
    });

    test('returns good color for score >= 70', () => {
      expect(getScoreColorClass(75)).toBe('text-seo-good');
    });

    test('returns fair color for score >= 50', () => {
      expect(getScoreColorClass(55)).toBe('text-seo-fair');
    });

    test('returns poor color for score < 50', () => {
      expect(getScoreColorClass(45)).toBe('text-seo-poor');
    });
  });

  describe('getScoreBgColorClass', () => {
    test('returns excellent background for score >= 90', () => {
      expect(getScoreBgColorClass(95)).toBe('bg-seo-excellent');
    });

    test('returns good background for score >= 70', () => {
      expect(getScoreBgColorClass(75)).toBe('bg-seo-good');
    });

    test('returns fair background for score >= 50', () => {
      expect(getScoreBgColorClass(55)).toBe('bg-seo-fair');
    });

    test('returns poor background for score < 50', () => {
      expect(getScoreBgColorClass(45)).toBe('bg-seo-poor');
    });
  });

  describe('formatScore', () => {
    test('formats score correctly', () => {
      expect(formatScore(85)).toBe('85/100');
    });

    test('formats zero score', () => {
      expect(formatScore(0)).toBe('0/100');
    });

    test('formats perfect score', () => {
      expect(formatScore(100)).toBe('100/100');
    });
  });

  describe('getPriorityLabel', () => {
    test('returns Chinese label for high priority', () => {
      expect(getPriorityLabel('high')).toBe('高优先级');
    });

    test('returns Chinese label for medium priority', () => {
      expect(getPriorityLabel('medium')).toBe('中优先级');
    });

    test('returns Chinese label for low priority', () => {
      expect(getPriorityLabel('low')).toBe('低优先级');
    });

    test('returns original string for unknown priority', () => {
      expect(getPriorityLabel('unknown')).toBe('unknown');
    });
  });

  describe('getPriorityColorClass', () => {
    test('returns red color for high priority', () => {
      expect(getPriorityColorClass('high')).toBe('bg-red-100 text-red-800');
    });

    test('returns yellow color for medium priority', () => {
      expect(getPriorityColorClass('medium')).toBe('bg-yellow-100 text-yellow-800');
    });

    test('returns green color for low priority', () => {
      expect(getPriorityColorClass('low')).toBe('bg-green-100 text-green-800');
    });

    test('returns gray color for unknown priority', () => {
      expect(getPriorityColorClass('unknown')).toBe('bg-gray-100 text-gray-800');
    });
  });
});
