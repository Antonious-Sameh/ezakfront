import React from 'react';
import { money, moneyParts } from './format';

/**
 * One money amount, the way the whole dashboard shows it.
 *
 *   under a million:   15,884.50 ج.م
 *   a million or more: 4.41 مليون ج.م          ← what size it is, at a glance
 *                      4,413,929.83 ج.م         ← the exact figure, always shown
 *
 * The big line inherits the parent's font size / colour; the exact line is a
 * small muted line under it. The exact figure is never replaced by the short
 * one. `exactClass` recolours that line on dark backgrounds.
 */
export default function MoneyFigure({ value, unit = 'ج.م', unitClass = 'text-xs font-medium text-muted-foreground', exactClass = 'text-muted-foreground' }) {
    const parts = moneyParts(value);
    const main = parts ? parts.headline : money(value);
    return (
        <>
            <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                <span className="whitespace-nowrap">{main}</span>
                {unit ? <span className={`${unitClass} ${parts ? 'hidden sm:inline' : ''}`}>{unit}</span> : null}
            </span>
            {parts ? (
                <span className={`block text-[11px] font-medium leading-snug tabular-nums sm:text-xs ${exactClass}`} data-testid="exact-value">
                    <span className="whitespace-nowrap">{parts.exact}</span>{unit ? ` ${unit}` : ''}
                </span>
            ) : null}
        </>
    );
}
