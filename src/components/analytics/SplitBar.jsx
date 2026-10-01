import React from 'react';
import { money, pct } from './format';

/**
 * Two parts of one whole on a single bar (e.g. cash vs credit sales).
 * parts: [{ label, value, className }] — exactly two.
 */
export default function SplitBar({ parts, ariaLabel }) {
    const total = parts.reduce((a, p) => a + Math.max(0, p.value || 0), 0);
    const share = (v) => (total > 0 ? (Math.max(0, v || 0) / total) * 100 : 0);
    return (
        <div className="flex flex-col gap-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={ariaLabel}>
                {parts.map((p) => (
                    <span key={p.label} className={`h-full ${p.className}`} style={{ width: `${share(p.value)}%` }} />
                ))}
            </div>
            <dl className="grid grid-cols-2 gap-3">
                {parts.map((p) => (
                    <div key={p.label} className="min-w-0">
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={`h-2.5 w-2.5 rounded-sm ${p.className}`} aria-hidden="true" />
                            {p.label}
                        </dt>
                        <dd className="mt-0.5 font-display text-base font-bold tabular-nums text-foreground">
                            {money(p.value)} <span className="text-xs font-medium text-muted-foreground">{pct(share(p.value))}</span>
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
