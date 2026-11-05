import { describe, it, expect } from 'vitest';
import { formatNumber, formatMoney, formatDate, truncate } from '@/lib/format';
import { AR_LOCALE } from '@/lib/constants';

describe('format helpers', () => {
  it('formatNumber treats missing values as 0', () => {
    expect(formatNumber(undefined, { locale: 'en-US' })).toBe('0');
    expect(formatNumber(1234.5, { locale: 'en-US' })).toBe('1,234.5');
  });

  it('the app locale uses Latin digits with a visible comma and a dot', () => {
    expect(AR_LOCALE).toBe('ar-EG-u-nu-latn');
    expect(formatNumber(1234567.5, { locale: AR_LOCALE, maximumFractionDigits: 2 })).toBe('1,234,567.5');
    expect(formatNumber(999, { locale: AR_LOCALE })).toBe('999');
    expect(formatNumber(undefined, { locale: AR_LOCALE })).toBe('0');
    expect(formatNumber(-1234, { locale: AR_LOCALE })).toMatch(/^[\u061c\u200e]?-1,234$/);
  });

  it('plain ar-EG (Arabic-Indic digits) still gets a comma, never the tiny U+066C mark', () => {
    expect(formatNumber(1234567, { locale: 'ar-EG' })).toBe('١,٢٣٤,٥٦٧');
  });

  it('formatMoney: whole amounts plain, piastres always two digits, never rounded further', () => {
    expect(formatMoney(12300, { locale: AR_LOCALE })).toBe('12,300');
    expect(formatMoney(12.5, { locale: AR_LOCALE })).toBe('12.50');
    expect(formatMoney(4413929.83, { locale: AR_LOCALE })).toBe('4,413,929.83');
    expect(formatMoney(0.1 + 0.2, { locale: AR_LOCALE })).toBe('0.30');
    expect(formatMoney(undefined, { locale: AR_LOCALE })).toBe('0');
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
