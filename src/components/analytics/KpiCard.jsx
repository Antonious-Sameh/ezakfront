import React from 'react';
import ChangeBadge from './ChangeBadge';
import { moneyParts, figureSize } from './format';

/**
 * A headline figure. The coloured top edge says WHAT kind of figure it is
 * (sales / profit / cost / debt), the badge says how it moved.
 */
const EDGE = {
    sales: 'before:bg-accent',
    profit: 'before:bg-emerald-500',
    loss: 'before:bg-rose-500',
    cost: 'before:bg-amber-500',
    neutral: 'before:bg-slate-300 dark:before:bg-slate-600',
};

/**
 * `amount` (optional): the raw money figure behind `value`. From one million
 * up, the big number becomes "4.41 مليون" and the exact figure
 * (4,413,929.83 ج.م) sits right under it — shortened for reading, never
 * replaced.
 */
export default function KpiCard({ label, value, unit, kind = 'neutral', change, changeProps, sub, valueClass = '', amount }) {
    const parts = moneyParts(amount);
    const shown = parts ? parts.headline : value;
    return (
        <div
            className={`relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-border bg-card p-4 pt-5 before:absolute before:inset-x-0 before:top-0 before:h-1 sm:p-5 sm:pt-6 ${EDGE[kind]}`}
        >
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {/* valueClass carries its own text colour when given — never combined with
                text-foreground, whose place in the CSS would win over it. */}
            <p className={`flex flex-wrap items-baseline gap-x-1.5 font-display font-extrabold tabular-nums ${figureSize(typeof shown === 'string' ? shown : '')} ${valueClass || 'text-foreground'}`}>
                <span className="whitespace-nowrap">{shown}</span>
                {unit ? <span className={`text-xs font-medium text-muted-foreground ${parts ? 'hidden sm:inline' : ''}`}>{unit}</span> : null}
            </p>
            {parts ? <p className="text-[11px] font-medium tabular-nums text-muted-foreground sm:text-xs" data-testid="exact-value"><span className="whitespace-nowrap">{parts.exact}</span>{unit ? ` ${unit}` : ''}</p> : null}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {change !== undefined ? <ChangeBadge value={change} label={label} {...changeProps} /> : null}
                {sub ? <span>{sub}</span> : null}
            </div>
        </div>
    );
}
