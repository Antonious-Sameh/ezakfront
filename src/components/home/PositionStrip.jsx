import React from 'react';
import { HandCoins, Boxes, Wallet, Truck } from 'lucide-react';
import { money } from '@/components/analytics/format';

/**
 * "معانا كام" — the four figures the owner looks for first, summed across
 * the four shops: what customers owe us, what the stock is worth (at cost),
 * the cash in the drawers, and what we owe suppliers. Under them, one
 * estimate of the total. Unknown figures (a shop didn't answer) show "—"
 * and a note — never a silent 0.
 */

function Tile({ icon: Icon, label, value, sub, tone }) {
    const tones = {
        amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        slate: 'bg-muted text-foreground',
        green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    };
    return (
        <div className="min-w-0 rounded-2xl border border-border bg-card px-3.5 py-3 sm:p-4">
            <div className="flex items-center gap-2">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
            </div>
            <p className="mt-2 font-display text-xl font-extrabold tabular-nums text-foreground sm:text-2xl">
                {value === null ? '—' : money(value)}
                {value !== null ? <span className="ms-1 text-xs font-medium text-muted-foreground">ج.م</span> : null}
            </p>
            {sub ? <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">{sub}</p> : null}
        </div>
    );
}

export default function PositionStrip({ position }) {
    const t = position.totals;
    const partial = !t.complete;
    return (
        <section aria-labelledby="position-title" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
                <h2 id="position-title" className="font-display text-lg font-bold text-foreground">معانا كام</h2>
                <p className="text-xs text-muted-foreground">دلوقتي، في المحلات الأربعة</p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile icon={HandCoins} tone="amber" label="لينا عند العملاء" value={t.customersOwe} />
                <Tile icon={Boxes} tone="slate" label="البضاعة (بالتكلفة)" value={t.stockCost} sub={t.stockSale ? `بسعر البيع ${money(t.stockSale)}` : undefined} />
                <Tile icon={Wallet} tone="green" label="الكاش" value={t.cash} />
                <Tile icon={Truck} tone="rose" label="علينا للموردين" value={t.suppliersOwed} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
                <div>
                    <p className="text-xs text-white/70">الإجمالي التقديري{partial ? ' (ناقص محل مردّش)' : ''}</p>
                    <p className="font-display text-2xl font-extrabold tabular-nums" data-testid="position-net">
                        {money(t.net)} <span className="text-sm font-semibold text-white/60">ج.م</span>
                    </p>
                </div>
                <p className="max-w-xs text-[11px] leading-relaxed text-white/60">
                    كاش + بضاعة بالتكلفة + لينا عند العملاء − علينا للموردين
                </p>
            </div>
        </section>
    );
}
