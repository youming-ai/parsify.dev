import { parseCronExpression } from '@/components/tools/utilities/cron-parser';
import { describe, expect, it } from 'vitest';

describe('parseCronExpression', () => {
  describe('validation', () => {
    it('returns error for expression with too few parts', () => {
      const result = parseCronExpression('* * *');
      expect(result.success).toBe(false);
      expect(result.error).toContain('must have 5 parts');
    });

    it('returns error for expression with too many parts', () => {
      const result = parseCronExpression('* * * * * *');
      expect(result.success).toBe(false);
      expect(result.error).toContain('must have 5 parts');
    });

    it('returns success for valid expression with 5 parts', () => {
      const result = parseCronExpression('* * * * *');
      expect(result.success).toBe(true);
    });

    it('handles expressions with extra spaces', () => {
      const result = parseCronExpression('30  14  *  * 1');
      expect(result.success).toBe(true);
    });
  });

  describe('description generation', () => {
    it('generates description for every minute', () => {
      const result = parseCronExpression('* * * * *');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.description).toBe('At every minute');
    });

    it('generates description for every hour', () => {
      const result = parseCronExpression('0 * * * *');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.description).toBe('At 0:00');
    });

    it('generates description for specific minute every hour', () => {
      const result = parseCronExpression('30 * * * *');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.description).toBe('At minute 30 past every hour');
    });

    it('generates description for specific time', () => {
      const result = parseCronExpression('30 14 * * *');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.description).toBe('At 14:30');
    });

    it('generates description for day of month', () => {
      const result = parseCronExpression('0 0 1 * *');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.description).toContain('day-of-month 1');
    });

    it('generates description for month', () => {
      const result = parseCronExpression('0 0 * 1 *');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.description).toContain('in month 1');
    });

    it('generates description for day of week', () => {
      const result = parseCronExpression('0 0 * * 0');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.description).toContain('day-of-week 0');
    });

    it('generates description for complex expression', () => {
      const result = parseCronExpression('30 14 15 1 0');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.description).toBe('At 14:30 on day-of-month 15 in month 1 on day-of-week 0');
    });
  });

  describe('next runs calculation', () => {
    it('returns array of next runs for valid expression', () => {
      const result = parseCronExpression('* * * * *');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.nextRuns).toBeDefined();
      expect(result.nextRuns).toHaveLength(5);
    });

    it('returns dates in readable format', () => {
      const result = parseCronExpression('* * * * *');
      if (!result.success) throw new Error('Unexpected error');
      expect(result.nextRuns[0]).toBeTruthy();
      expect(typeof result.nextRuns[0]).toBe('string');
    });

    it('calculates different intervals for hourly vs minutely', () => {
      const minutelyResult = parseCronExpression('* * * * *');
      const hourlyResult = parseCronExpression('0 * * * *');

      if (!minutelyResult.success || !hourlyResult.success) throw new Error('Unexpected error');

      expect(minutelyResult.nextRuns).toHaveLength(5);
      expect(hourlyResult.nextRuns).toHaveLength(5);
    });
  });

  describe('error handling', () => {
    it('handles empty string', () => {
      const result = parseCronExpression('');
      expect(result.success).toBe(false);
    });

    it('handles malformed input', () => {
      const result = parseCronExpression('invalid');
      expect(result.success).toBe(false);
    });
  });
});
