import { describe, it, expect } from 'vitest';
import { formatNumber, formatDate, truncate } from '@/lib/format';

describe('format helpers', () => {
  it('formatNumber treats missing values as 0', () => {
    expect(formatNumber(undefined, { locale: 'en-US' })).toBe('0');
    expect(formatNumber(1234.5, { locale: 'en-US' })).toBe('1,234.5');
  });

  it('formatNumber keeps Arabic digits but groups thousands with a visible comma', () => {
    // Intl's own ar-EG group mark (٬) is nearly invisible between Arabic digits.
    expect(formatNumber(1234567.5, { locale: 'ar-EG', maximumFractionDigits: 2 })).toBe('١,٢٣٤,٥٦٧٫٥');
    expect(formatNumber(999, { locale: 'ar-EG' })).toBe('٩٩٩');
    expect(formatNumber(undefined, { locale: 'ar-EG' })).toBe('٠');
    expect(formatNumber(-1234, { locale: 'ar-EG' })).toMatch(/^\u061c?-١,٢٣٤$/);
  });

  it('formatNumber changes only the separator, never the digits or the value', () => {
    for (const v of [0, 7, 1000, 12345.678, 9876543210.5, -4321.25]) {
      const plain = Number(v).toLocaleString('ar-EG', { maximumFractionDigits: 2 });
      expect(formatNumber(v, { locale: 'ar-EG', maximumFractionDigits: 2 })).toBe(plain.replaceAll('٬', ','));
    }
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
