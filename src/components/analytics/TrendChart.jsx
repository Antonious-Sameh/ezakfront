import React, { useMemo, useRef, useState } from 'react';
import { compactMoney, dayLabel, money } from './format';

/**
 * Day-by-day sales (filled area) and net profit (line), drawn as plain SVG —
 * no chart library, so the home page doesn't download recharts (~108 KB).
 * Touch / hover shows the exact figures for a day.
 *
 * days: [{ date: 'YYYY-MM-DD', sales, profit }]
 */
const W = 600;
const H = 180;
const PAD_TOP = 12;
const PAD_BOTTOM = 8;

export function buildPaths(days) {
    const values = days.flatMap((d) => [d.sales, d.profit]);
    const max = Math.max(1, ...values);
    const min = Math.min(0, ...values);
    const span = max - min || 1;
    const x = (i) => (days.length === 1 ? W / 2 : (i / (days.length - 1)) * W);
    const y = (v) => PAD_TOP + (1 - (v - min) / span) * (H - PAD_TOP - PAD_BOTTOM);
    const line = (key) => days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
    const zeroY = y(0);
    const salesLine = line('sales');
    const salesArea = `${salesLine} L${x(days.length - 1).toFixed(1)},${zeroY.toFixed(1)} L${x(0).toFixed(1)},${zeroY.toFixed(1)} Z`;
    return { salesLine, salesArea, profitLine: line('profit'), zeroY, x, y, max, min };
}

export default function TrendChart({ days, onDark = false, height = 'h-40 sm:h-48' }) {
    const [active, setActive] = useState(null);
    const boxRef = useRef(null);
    const paths = useMemo(() => buildPaths(days), [days]);

    const best = useMemo(() => days.reduce((b, d, i) => (d.sales > (days[b]?.sales ?? -Infinity) ? i : b), 0), [days]);

    const pick = (clientX) => {
        const box = boxRef.current?.getBoundingClientRect();
        if (!box || !days.length) return;
        const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
        setActive(Math.round(ratio * (days.length - 1)));
    };

    const shown = active ?? null;
    const point = shown !== null ? days[shown] : null;
    const leftPct = shown !== null ? (paths.x(shown) / W) * 100 : 0;

    const ink = onDark ? 'text-white/60' : 'text-muted-foreground';
    const salesColor = onDark ? '#a5b4fc' : 'hsl(var(--accent))';
    const profitColor = onDark ? '#6ee7b7' : '#059669';

    return (
        <figure className="relative" dir="ltr">
            <div
                ref={boxRef}
                className={`relative w-full ${height} touch-pan-y select-none`}
                onPointerMove={(e) => pick(e.clientX)}
                onPointerDown={(e) => pick(e.clientX)}
                onPointerLeave={() => setActive(null)}
                role="img"
                aria-label={`المبيعات اليومية من ${dayLabel(days[0]?.date)} لـ ${dayLabel(days[days.length - 1]?.date)}، أعلى يوم ${dayLabel(days[best]?.date)} بمبيعات ${money(days[best]?.sales)} جنيه`}
            >
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
                    <defs>
                        <linearGradient id="trendSalesFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={salesColor} stopOpacity={onDark ? 0.45 : 0.28} />
                            <stop offset="100%" stopColor={salesColor} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <line x1="0" x2={W} y1={paths.zeroY} y2={paths.zeroY} stroke="currentColor" className={ink} strokeOpacity="0.25" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                    <path d={paths.salesArea} fill="url(#trendSalesFill)" />
                    <path d={paths.salesLine} fill="none" stroke={salesColor} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    <path d={paths.profitLine} fill="none" stroke={profitColor} strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    {point ? (
                        <line x1={paths.x(shown)} x2={paths.x(shown)} y1="0" y2={H} stroke="currentColor" className={ink} strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
                    ) : null}
                </svg>

                {point ? (
                    <div
                        className={`pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-lg px-3 py-2 text-xs shadow-lg ${onDark ? 'bg-white text-slate-900' : 'bg-foreground text-background'}`}
                        style={{ left: `${Math.min(88, Math.max(12, leftPct))}%` }}
                        dir="rtl"
                        data-testid="trend-tooltip"
                    >
                        <p className="font-bold">{dayLabel(point.date)}</p>
                        <p>المبيعات: <span className="font-semibold tabular-nums">{money(point.sales)}</span></p>
                        <p>الربح: <span className="font-semibold tabular-nums">{money(point.profit)}</span></p>
                    </div>
                ) : null}
            </div>

            <figcaption className={`mt-2 flex items-center justify-between text-[11px] ${ink}`}>
                <span>{dayLabel(days[0]?.date)}</span>
                <span className="flex items-center gap-3" dir="rtl">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ background: salesColor }} />المبيعات</span>
                    <span className="flex items-center gap-1.5"><span className="h-0 w-3 border-t-2 border-dashed" style={{ borderColor: profitColor }} />الربح</span>
                    <span className="hidden sm:inline">أعلى: {compactMoney(paths.max)}</span>
                </span>
                <span>{dayLabel(days[days.length - 1]?.date)}</span>
            </figcaption>
        </figure>
    );
}
