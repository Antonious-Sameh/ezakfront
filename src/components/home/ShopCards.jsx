import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, PackageX, WifiOff } from 'lucide-react';
import { count } from '@/components/analytics/format';
import MoneyFigure from '@/components/analytics/MoneyFigure';
import { ShopLayout, ShopSummaryPage } from '@/routes/lazyPages';
import { preloadOnIntent } from '@/routes/intent';

const shopIntent = preloadOnIntent(() => Promise.all([ShopLayout.preload(), ShopSummaryPage.preload()]));

function Row({ label, amount, tone = '' }) {
    const unknown = amount === null || amount === undefined;
    return (
        // Label above the figure on a phone (two cards per row leave ~130px);
        // side by side from sm up. From a million up the figure is "2.81 مليون"
        // with the exact amount under it, so it fits and is still all there.
        <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2 sm:py-1">
            <dt className="text-xs leading-tight text-muted-foreground sm:pt-0.5">{label}</dt>
            <dd className={`font-display text-base font-bold tabular-nums sm:text-end sm:text-sm ${tone || 'text-foreground'}`}>
                {unknown ? '—' : <MoneyFigure value={amount} unitClass="text-[11px] font-medium text-muted-foreground" />}
            </dd>
        </div>
    );
}

/**
 * The four shops as big, obvious, tappable cards — the way into each shop.
 * Each shows what the owner wants at a glance: what customers owe, the
 * stock value, the drawer cash, and today's sales. A red dot = the shop
 * isn't answering; an amber chip = items running out.
 *
 * rows: one per shop, merged from /api/shops (status, today/month sales)
 * and /api/reports/position (debts, stock, cash).
 */
export default function ShopCards({ rows }) {
    return (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="المحلات">
            {rows.map((r) => {
                const offline = r.status === 'offline' || r.available === false;
                return (
                    <li key={r.id}>
                        <Link
                            to={`/shops/${r.id}`}
                            {...shopIntent}
                            className="group flex h-full flex-col rounded-2xl border border-border bg-card px-3.5 py-3 transition-colors hover:border-accent/40 hover:bg-muted/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="flex min-w-0 items-center gap-2 font-display text-base font-bold leading-tight text-foreground">
                                    <span
                                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${offline ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                        role="img"
                                        aria-label={offline ? 'مش بيرد' : 'شغال'}
                                    />
                                    {/* The full name matters (4 similar shops): wrap, never cut with "…". */}
                                    <span className="min-w-0 break-words">{r.name}</span>
                                </h3>
                                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                            </div>

                            {offline ? (
                                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                                    <WifiOff className="h-4 w-4" aria-hidden="true" />
                                    مش بيرد دلوقتي
                                </p>
                            ) : null}

                            <dl className="mt-1.5 divide-y divide-border/50">
                                <Row label="عند العملاء" amount={r.customersOwe} tone={r.customersOwe > 0 ? 'text-amber-700 dark:text-amber-400' : ''} />
                                <Row label="البضاعة" amount={r.stockCost} />
                                <Row label="الكاش" amount={r.cash} tone={r.cash < 0 ? 'text-rose-600' : ''} />
                                <Row label="مبيعات النهارده" amount={offline ? null : r.todaySales} tone={offline ? '' : 'text-accent'} />
                            </dl>

                            {Number(r.lowCount ?? r.lowStockCount) > 0 && !offline ? (
                                <p className="mt-2 inline-flex items-center gap-1 self-start rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                                    <PackageX className="h-3.5 w-3.5" aria-hidden="true" />
                                    {count(r.lowCount ?? r.lowStockCount)} ناقص
                                </p>
                            ) : null}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

