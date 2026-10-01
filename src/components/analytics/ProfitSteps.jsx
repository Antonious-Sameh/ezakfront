import React from 'react';
import { money, pct } from './format';

/**
 * The profit & loss of the period as the shop computes it, one step per
 * line, each with a bar proportional to the gross sales:
 *   sales − returns = net sales; − cost of goods = gross profit;
 *   − expenses = net profit.
 * Subtractions are amber/rose, results are bold — reads top to bottom
 * like the paper the owner would do it on.
 */
export function profitSteps(p) {
    const base = Math.max(1, p.grossSales || 0, p.revenue || 0);
    return [
        { key: 'gross', label: 'إجمالي المبيعات', value: p.grossSales, kind: 'start' },
        { key: 'returns', label: 'المرتجعات', value: -(p.returns || 0), kind: 'minus', hideIfZero: true },
        { key: 'revenue', label: 'صافي المبيعات', value: p.revenue, kind: 'result' },
        { key: 'cogs', label: 'تكلفة البضاعة المباعة', value: -(p.cogs || 0), kind: 'minus' },
        { key: 'grossProfit', label: 'مجمل الربح', value: p.grossProfit, kind: 'result' },
        { key: 'expenses', label: 'المصروفات', value: -(p.expenses || 0), kind: 'minus', hideIfZero: true },
        { key: 'net', label: 'صافي الربح', value: p.totalProfit, kind: 'final' },
    ]
        .filter((s) => !(s.hideIfZero && !s.value))
        .map((s) => ({ ...s, width: Math.min(100, (Math.abs(s.value || 0) / base) * 100) }));
}

const BAR = {
    start: 'bg-accent',
    minus: 'bg-amber-400',
    result: 'bg-accent/60',
};

export default function ProfitSteps({ profit }) {
    const steps = profitSteps(profit);
    return (
        <div className="flex flex-col gap-3">
            <ol className="flex flex-col gap-2.5">
                {steps.map((s) => {
                    const isFinal = s.kind === 'final';
                    const negative = (s.value || 0) < 0;
                    const barClass = isFinal ? (negative ? 'bg-rose-500' : 'bg-emerald-500') : BAR[s.kind];
                    return (
                        <li
                            key={s.key}
                            className={`grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 ${isFinal ? 'mt-1 border-t border-border pt-3' : ''}`}
                        >
                            <span className={`text-sm ${s.kind === 'minus' ? 'ps-3 text-muted-foreground' : 'font-semibold text-foreground'}`}>
                                {s.kind === 'minus' ? '− ' : ''}{s.label}
                            </span>
                            <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                <span className={`block h-full rounded-full ${barClass}`} style={{ width: `${s.width}%` }} />
                            </span>
                            <span
                                className={`text-end font-display tabular-nums ${
                                    isFinal
                                        ? `text-lg font-extrabold ${negative ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`
                                        : s.kind === 'minus' ? 'text-sm text-amber-700 dark:text-amber-400' : 'text-sm font-bold text-foreground'
                                }`}
                            >
                                {isFinal ? money(s.value || 0) : money(Math.abs(s.value || 0))}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <p className="text-xs text-muted-foreground">
                هامش صافي الربح {pct(profit.margin)} من صافي المبيعات
                {profit.discount > 0 ? `، والخصومات اللي اتعملت على الفواتير ${money(profit.discount)} ج.م (مخصومة من المبيعات أصلاً)` : ''}.
            </p>
        </div>
    );
}
