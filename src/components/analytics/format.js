import { formatNumber, formatMoney } from '@/lib/format';
import { AR_LOCALE } from '@/lib/constants';

/** Money with Arabic digits: whole amounts plain, piastres always as two digits. */
export const money = (v) => formatMoney(v ?? 0, { locale: AR_LOCALE });
/** Whole numbers (counts). */
export const count = (v) => formatNumber(v ?? 0, { locale: AR_LOCALE, maximumFractionDigits: 0 });
/**
 * A percentage value already in % units, sign KEPT (e.g. -12.5 → "-12.5%"):
 * a negative margin must read as negative. Use pct(Math.abs(x)) where the
 * direction is shown some other way (arrows, words).
 */
export const pct = (v) => `${formatNumber(Number(v) || 0, { locale: AR_LOCALE, maximumFractionDigits: 1 })}%`;
// (Intl's ar-EG output puts an Arabic letter mark before the minus sign, so
// a negative value reads correctly inside right-to-left text — same as the
// negative money amounts elsewhere. A hand-written "-" got reordered.)

/**
 * Text size for a big figure in a narrow phone card: the longer the formatted
 * number ("12,345,678"), the smaller it starts, so it never overflows or wraps.
 * From `sm` up the normal size applies.
 */
export function figureSize(text, { base = 'text-2xl', mid = 'text-lg', small = 'text-base', sm = 'sm:text-[1.7rem]' } = {}) {
    const len = String(text ?? '').length;
    if (len > 11) return `${small} ${sm}`;
    if (len > 8) return `${mid} ${sm}`;
    return `${base} ${sm}`;
}

/** Quantities (pieces, kg, metres…): up to 3 decimals, so 2.5 kg never shows as "3". */
export const qty = (v) => formatNumber(v ?? 0, { locale: AR_LOCALE, maximumFractionDigits: 3 });

const SCALES = [
    { from: 1_000_000_000, div: 1_000_000_000, word: 'مليار' },
    { from: 1_000_000, div: 1_000_000, word: 'مليون' },
    { from: 10_000, div: 1000, word: 'ألف' },
];

/** Short money for tight spots: 12,300 → "12.3 ألف", 2,500,000 → "2.5 مليون". */
export function compactMoney(v) {
    const x = Number(v) || 0;
    const abs = Math.abs(x);
    let i = SCALES.findIndex((s) => abs >= s.from);
    if (i === -1) return money(x);
    // 999,960 would round to "1,000 ألف": step up to the next unit ("1 مليون") instead.
    if (i > 0 && Math.round((abs / SCALES[i].div) * 10) / 10 >= 1000) i -= 1;
    const { div, word } = SCALES[i];
    return `${formatNumber(x / div, { locale: AR_LOCALE, maximumFractionDigits: 1 })} ${word}`;
}

/**
 * A big amount as a headline plus its exact value:
 *   4,413,929.83 → { headline: "4.41 مليون", exact: "4,413,929.83" }
 * The headline tells at a glance whether it is thousands or millions; the
 * exact figure is always shown with it (never replaced). Below one million
 * there is nothing to shorten: returns null and the exact figure stands alone.
 */
const HEADLINE_UNITS = [
    { from: 1_000_000_000, div: 1_000_000_000, word: 'مليار' },
    { from: 1_000_000, div: 1_000_000, word: 'مليون' },
];
export function moneyParts(v) {
    const x = Number(v) || 0;
    const abs = Math.abs(x);
    let i = HEADLINE_UNITS.findIndex((u) => abs >= u.from);
    if (i === -1) return null;
    // 999,996,000 rounds to "1000 مليون": say "1 مليار" instead.
    if (i > 0 && Math.round((abs / HEADLINE_UNITS[i].div) * 100) / 100 >= 1000) i -= 1;
    const { div, word } = HEADLINE_UNITS[i];
    return { headline: `${formatNumber(x / div, { locale: AR_LOCALE, maximumFractionDigits: 2 })} ${word}`, exact: money(x) };
}

/** "2026-09-07" → "7 سبتمبر" */
export function dayLabel(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(AR_LOCALE, { day: 'numeric', month: 'long' });
}
