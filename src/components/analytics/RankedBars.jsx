import React from 'react';

/**
 * A ranked list where each row has a bar proportional to `barValue`
 * (relative to the largest in the list) and free-form figures on the end.
 * rows: [{ key, label, barValue, end: ReactNode, note?: ReactNode }]
 */
export default function RankedBars({ rows, barClass = 'bg-accent', emptyText = 'مفيش بيانات في الفترة دي' }) {
    if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
    const max = Math.max(1, ...rows.map((r) => r.barValue || 0));
    return (
        <ol className="flex flex-col gap-3">
            {rows.map((r, i) => (
                <li key={r.key} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                            <span className="me-2 inline-block w-4 text-xs tabular-nums text-muted-foreground">{(i + 1).toLocaleString('ar-EG')}</span>
                            {r.label}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-foreground">{r.end}</span>
                    </div>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <span className={`block h-full rounded-full ${barClass}`} style={{ width: `${Math.max(2, ((r.barValue || 0) / max) * 100)}%` }} />
                    </span>
                    {r.note ? <span className="text-xs text-muted-foreground">{r.note}</span> : null}
                </li>
            ))}
        </ol>
    );
}
