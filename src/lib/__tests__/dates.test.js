import { describe, it, expect } from 'vitest';
import { subDays, toISODate } from '@/lib/dates';

describe('date helpers', () => {
    it('toISODate formats the LOCAL calendar date, zero-padded', () => {
        expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
        expect(toISODate(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
    });

    it('subDays crosses month and year boundaries', () => {
        expect(toISODate(subDays(new Date(2026, 2, 1), 1))).toBe('2026-02-28');
        expect(toISODate(subDays(new Date(2026, 0, 3), 6))).toBe('2025-12-28');
        expect(toISODate(subDays(new Date(2026, 8, 30), 29))).toBe('2026-09-01');
    });

    it('does not mutate its input', () => {
        const d = new Date(2026, 5, 10);
        subDays(d, 3);
        expect(toISODate(d)).toBe('2026-06-10');
    });
});
