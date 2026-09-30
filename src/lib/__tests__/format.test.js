import { describe, it, expect } from 'vitest';
import { formatNumber, formatDate, truncate } from '@/lib/format';

describe('format helpers', () => {
  it('formatNumber treats missing values as 0', () => {
    expect(formatNumber(undefined, { locale: 'en-US' })).toBe('0');
    expect(formatNumber(1234.5, { locale: 'en-US' })).toBe('1,234.5');
  });

  it('formatDate returns an empty string for missing or invalid input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('not-a-date')).toBe('');
    expect(formatDate('2026-09-30T10:00:00Z', { locale: 'en-US' })).toContain('2026');
  });

  it('truncate shortens long text with an ellipsis only when needed', () => {
    expect(truncate('abc', 5)).toBe('abc');
    expect(truncate('abcdefgh', 3)).toBe('abc…');
  });
});
