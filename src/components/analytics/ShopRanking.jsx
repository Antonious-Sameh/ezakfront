import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, PackageX, WifiOff } from 'lucide-react';
import ChangeBadge from './ChangeBadge';
import { money, pct, count } from './format';
import { ShopLayout, ShopOverviewPage } from '@/routes/lazyPages';
import { preloadOnIntent } from '@/routes/intent';

const shopIntent = preloadOnIntent(() => Promise.all([ShopLayout.preload(), ShopOverviewPage.preload()]));

/**
 * The four shops ranked by sales for the chosen period: one row per shop,
 * with its share of total sales as a bar, profit & margin, and the change
 * vs the previous period. Replaces the old shop cards + bar chart (which
 * showed the same shops twice, and the chart needed a 108 KB library).
 *
 * rows: compare.byShop merged with /api/shops (status, lowStockCount).
 */
export default function ShopRanking({ rows }) {
    const maxSales = Math.max(1, ...rows.map((r) => r.sales || 0));

    return (
        <ol className="flex flex-col divide-y divide-border/70 overflow-hidden rounded-2xl border border-border bg-card" aria-label="ترتيب المحلات حسب المبيعات">
            {rows.map((r) => {
                const offline = r.available === false || r.status === 'offline';
                const barWidth = offline ? 0 : Math.max(2, (r.sales / maxSales) * 100);
                return (
                    <li key={r.shopId}>
                        <Link
                            to={`/shops/${r.shopId}`}
                            {...shopIntent}
                            className="group grid grid-cols-[2rem_1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-4 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:grid-cols-[2.25rem_minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:px-5"
                        >
                            <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold tabular-nums ${
                                    r.rank === 1 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                                }`}
                                aria-label={r.rank ? `المركز ${r.rank}` : 'غير مرتب'}
                            >
                                {r.rank ? count(r.rank) : '–'}
                            </span>

                            <div className="min-w-0">
                                <p className="truncate font-display text-base font-bold text-foreground">{r.shopName}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                                    {offline ? (
                                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600"><WifiOff className="h-3.5 w-3.5" />مش بيرد</span>
                                    ) : (
                                        <span>{count(r.invoices)} فاتورة</span>
                                    )}
                                    {Number(r.lowStockCount) > 0 ? (
                                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                                            <PackageX className="h-3.5 w-3.5" />{count(r.lowStockCount)} ناقص
                                        </span>
                                    ) : null}
                                </p>
                            </div>

                            {/* Sales: amount, change, and share of the four shops as a bar */}
                            <div className="col-span-3 col-start-1 row-start-2 min-w-0 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-display text-lg font-extrabold tabular-nums text-foreground">
                                        {offline ? '—' : money(r.sales)}
                                        {!offline ? <span className="ms-1 text-xs font-medium text-muted-foreground">ج.م</span> : null}
                                    </span>
                                    {!offline ? <ChangeBadge value={r.change?.sales} label="المبيعات" /> : null}
                                </div>
                                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                    <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${barWidth}%` }} />
                                </div>
                                <p className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{offline ? 'مفيش بيانات' : `${pct(r.share)} من مبيعات المحلات`}</span>
                                    {!offline ? (
                                        <span className="flex items-center gap-2">
                                            <span className={r.profit < 0 ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-700 dark:text-emerald-400'}>
                                                ربح {money(r.profit)}
                                            </span>
                                            <span>هامش {pct(r.margin)}</span>
                                        </span>
                                    ) : null}
                                </p>
                            </div>

                            <ChevronLeft className="col-start-3 row-start-1 h-5 w-5 justify-self-end text-muted-foreground/60 transition-transform group-hover:-translate-x-0.5 sm:col-start-4" aria-hidden="true" />
                        </Link>
                    </li>
                );
            })}
        </ol>
    );
}
