import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, PackageX, WifiOff } from 'lucide-react';
import { compactMoney, count } from '@/components/analytics/format';
import { ShopLayout, ShopOverviewPage } from '@/routes/lazyPages';
import { preloadOnIntent } from '@/routes/intent';

const shopIntent = preloadOnIntent(() => Promise.all([ShopLayout.preload(), ShopOverviewPage.preload()]));

/** Compact figure for a tight card: 55,296 → "٥٥٫٣ ألف". Unknown → "—". */
const short = (v) => (v === null || v === undefined ? '—' : compactMoney(v));

function Row({ label, value, tone = '' }) {
    return (
        <div className="flex items-baseline justify-between gap-2 py-[3px]">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={`font-display text-sm font-bold tabular-nums ${tone || 'text-foreground'}`}>{value}</dd>
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
                                <Row label="عند العملاء" value={short(r.customersOwe)} tone={r.customersOwe > 0 ? 'text-amber-700 dark:text-amber-400' : ''} />
                                <Row label="البضاعة" value={short(r.stockCost)} />
                                <Row label="الكاش" value={short(r.cash)} tone={r.cash < 0 ? 'text-rose-600' : ''} />
                                <Row label="مبيعات النهارده" value={offline ? '—' : short(r.todaySales)} tone={offline ? '' : 'text-accent'} />
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

