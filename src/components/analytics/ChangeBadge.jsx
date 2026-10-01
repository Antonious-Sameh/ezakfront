import React from 'react';
import { ArrowDownLeft, ArrowUpLeft, Minus } from 'lucide-react';
import { pct } from './format';

/**
 * % change vs the previous period, colour-coded by what the change MEANS:
 * up is good (green) and down is bad (red) — unless `inverse` (costs,
 * expenses, debts), where going up is the bad direction.
 *
 * value: number (% units) | null (no base to compare with) | undefined (unknown)
 */
export default function ChangeBadge({ value, inverse = false, neutral = false, size = 'sm', onDark = false, label }) {
    if (value === undefined) return null;

    const base = size === 'lg' ? 'px-2.5 py-1 text-sm gap-1' : 'px-2 py-0.5 text-xs gap-0.5';

    if (value === null) {
        return (
            <span className={`inline-flex items-center rounded-full font-semibold ${base} ${onDark ? 'bg-white/10 text-white/80' : 'bg-muted text-muted-foreground'}`}>
                جديد
            </span>
        );
    }

    const up = value > 0;
    const flat = value === 0;
    // neutral: a change that is neither good nor bad by itself (e.g. purchases).
    const good = flat || neutral ? null : up !== inverse;
    const Icon = flat ? Minus : up ? ArrowUpLeft : ArrowDownLeft;

    const tone = flat || neutral
        ? onDark ? 'bg-white/10 text-white/80' : 'bg-muted text-muted-foreground'
        : good
            ? onDark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : onDark ? 'bg-rose-400/15 text-rose-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400';

    const words = flat ? 'زي الفترة اللي قبلها' : `${up ? 'زيادة' : 'نقص'} ${pct(Math.abs(value))}`;

    return (
        <span
            className={`inline-flex items-center rounded-full font-semibold tabular-nums ${base} ${tone}`}
            aria-label={label ? `${label}: ${words}` : words}
            data-good={good === null ? (neutral && !flat ? 'neutral' : 'flat') : String(good)}
        >
            <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={2.5} aria-hidden="true" />
            {flat ? '٠٪' : pct(Math.abs(value))}
        </span>
    );
}
