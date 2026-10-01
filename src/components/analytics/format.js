import { formatNumber } from '@/lib/format';
import { AR_LOCALE } from '@/lib/constants';

/** Money with Arabic digits, at most 2 decimals. */
export const money = (v) => formatNumber(v ?? 0, { locale: AR_LOCALE, maximumFractionDigits: 2 });
/** Whole numbers (counts). */
export const count = (v) => formatNumber(v ?? 0, { locale: AR_LOCALE, maximumFractionDigits: 0 });
/**
 * A percentage value already in % units, sign KEPT (e.g. -12.5 → "-١٢٫٥٪"):
 * a negative margin must read as negative. Use pct(Math.abs(x)) where the
 * direction is shown some other way (arrows, words).
 */
export const pct = (v) => `${formatNumber(Number(v) || 0, { locale: AR_LOCALE, maximumFractionDigits: 1 })}٪`;
// (Intl's ar-EG output puts an Arabic letter mark before the minus sign, so
// a negative value reads correctly inside right-to-left text — same as the
// negative money amounts elsewhere. A hand-written "-" got reordered.)

/** Short money for tight spots: 12,300 → "١٢٫٣ ألف". */
export function compactMoney(v) {
    const x = Number(v) || 0;
    const abs = Math.abs(x);
    if (abs >= 1_000_000) return `${formatNumber(x / 1_000_000, { locale: AR_LOCALE, maximumFractionDigits: 1 })} مليون`;
    if (abs >= 10_000) return `${formatNumber(x / 1000, { locale: AR_LOCALE, maximumFractionDigits: 1 })} ألف`;
    return money(x);
}

/** "2026-09-07" → "٧ سبتمبر" */
export function dayLabel(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(AR_LOCALE, { day: 'numeric', month: 'long' });
}
