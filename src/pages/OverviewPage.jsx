import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from '@/components/Head';
import { Store } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { EmptyState, ErrorState } from '@/components/StateViews';
import ChangeBadge from '@/components/analytics/ChangeBadge';
import KpiCard from '@/components/analytics/KpiCard';
import TrendChart from '@/components/analytics/TrendChart';
import ShopRanking from '@/components/analytics/ShopRanking';
import StatusBanner from '@/components/home/StatusBanner';
import PositionStrip from '@/components/home/PositionStrip';
import ShopCards from '@/components/home/ShopCards';
import { buildAttention } from '@/components/analytics/attention';
import { money, pct, count } from '@/components/analytics/format';
import { PERIODS, periodById, periodRange } from '@/components/analytics/periods';

/**
 * Home, in the order the owner asks his questions:
 *   1. one line: is anything wrong?                       (StatusBanner)
 *   2. the four shops — the way in, each with its own figures (ShopCards)
 *   3. "معانا كام": what customers owe, stock, cash, debts, in total (PositionStrip)
 *   4. sales today / this month
 *   5. sales analysis for a chosen period: vs the previous period, profit,
 *      the day-by-day trend, and the shops ranked.
 * 1-4 load from cheap calls, so the first screen fills quickly; the heavy
 * analysis (5) loads after and never blocks the rest.
 */

export { PERIODS };

function PeriodTabs({ value, onChange }) {
    return (
        <div className="flex rounded-xl bg-white/10 p-1" role="group" aria-label="اختيار الفترة">
            {PERIODS.map((p) => {
                const active = value === p.id;
                return (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => onChange(p.id)}
                        aria-pressed={active}
                        className={`min-h-9 flex-1 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors sm:flex-none sm:text-sm ${
                            active ? 'bg-white text-slate-900 shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {p.label}
                    </button>
                );
            })}
        </div>
    );
}

function HeroStat({ label, value, unit, tone = 'text-white', badge }) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-medium text-white/60">{label}</p>
            <p className={`mt-1 flex flex-wrap items-baseline gap-x-1.5 font-display text-xl font-bold tabular-nums sm:text-2xl ${tone}`}>
                {value}
                {unit ? <span className="text-xs font-medium text-white/50">{unit}</span> : null}
            </p>
            {badge ? <div className="mt-1">{badge}</div> : null}
        </div>
    );
}

function HeroSkeleton() {
    return (
        <div className="space-y-5" aria-hidden="true">
            <div className="h-12 w-64 animate-pulse rounded bg-white/15" />
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-white/10" />)}
            </div>
            <div className="h-40 animate-pulse rounded-xl bg-white/5" />
        </div>
    );
}

const Skeleton = ({ className }) => <div className={`animate-pulse rounded-2xl border border-border bg-card ${className}`} aria-hidden="true" />;

/** Shop cards: /api/shops (status, sales today) + /api/reports/position (debts, stock, cash). */
export function mergeShopCards(shops, position) {
    const pos = new Map((position?.byShop || []).map((p) => [p.shopId, p]));
    return (shops || []).map((s) => {
        const p = pos.get(s.id);
        return {
            id: s.id,
            name: s.name,
            status: s.status,
            todaySales: s.todaySales,
            lowStockCount: s.lowStockCount,
            available: p ? p.available : undefined,
            customersOwe: p ? p.customersOwe : undefined,
            stockCost: p ? p.stockCost : undefined,
            cash: p ? p.cash : undefined,
            lowCount: p?.lowCount ?? undefined,
        };
    });
}

/** The ranking rows: compare.byShop + /api/shops status / low stock, best seller first. */
export function mergeShopRows(compare, shops) {
    const info = new Map((shops || []).map((s) => [s.id, s]));
    return [...(compare?.byShop || [])]
        .map((r) => ({ ...r, status: info.get(r.shopId)?.status, lowStockCount: info.get(r.shopId)?.lowStockCount ?? 0 }))
        .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
}

/** One plain sentence about the period — the first thing worth knowing. */
export function headline(compare, period) {
    if (!compare) return '';
    const leader = (compare.byShop || []).find((s) => s.rank === 1);
    const parts = [];
    if (leader && compare.shopsAvailable > 1) parts.push(`${leader.shopName} في المقدمة بـ ${pct(leader.share)} من المبيعات`);
    if (typeof compare.change?.sales === 'number' && compare.change.sales !== 0) {
        parts.push(`المبيعات ${compare.change.sales > 0 ? 'زادت' : 'قلت'} ${pct(Math.abs(compare.change.sales))} عن ${period.previous}`);
    }
    return parts.join('، و');
}

export default function OverviewPage() {
    const { token } = useAuth();
    const [periodId, setPeriodId] = useState('month');
    const period = periodById(periodId);
    const range = useMemo(() => periodRange(periodId), [periodId]);

    const shopsFetcher = useCallback((signal) => api.getShops(token, { signal }).then((res) => res.data), [token]);
    const positionFetcher = useCallback((signal) => api.getPosition(token, { signal }).then((res) => res.data), [token]);
    const compareFetcher = useCallback(
        (signal) => api.getCompareReport(token, range.from, range.to, { signal }).then((res) => res.data),
        [token, range.from, range.to],
    );
    const shops = useApiQuery(shopsFetcher, { key: 'shops' });
    const position = useApiQuery(positionFetcher, { key: 'position', staleTime: 60_000 });
    const compare = useApiQuery(compareFetcher, { key: `compare:${range.from}:${range.to}`, keepPrevious: true });

    const c = compare.data;
    const cards = useMemo(() => mergeShopCards(shops.data, position.data), [shops.data, position.data]);
    const rows = useMemo(() => mergeShopRows(c, shops.data), [c, shops.data]);
    const attention = useMemo(
        () => buildAttention({ shops: shops.data || [], compare: c, position: position.data }),
        [shops.data, c, position.data],
    );
    const trendDays = c?.daily?.available ? c.daily.days : [];

    // Sales today / this month: sums of what each shop reports in /api/shops.
    const todayTotal = (shops.data || []).reduce((a, s) => a + (s.todaySales || 0), 0);
    const monthTotal = (shops.data || []).reduce((a, s) => a + (s.monthSales || 0), 0);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6 lg:px-8 dir-rtl">
            <Helmet>
                <title>الرئيسية — لوحة تحكم المحلات</title>
                <meta name="description" content="المحلات الأربعة: لينا كام عند العملاء، والبضاعة بكام، والكاش، ومبيعات النهارده، وتحليل المبيعات." />
            </Helmet>
            <h1 className="sr-only">الرئيسية</h1>

            {/* 1. Is anything wrong? */}
            <StatusBanner items={attention} loading={shops.loading && position.loading} />

            {/* 2. The shops — the way in */}
            <section aria-labelledby="shops-title" className="flex flex-col gap-3">
                <h2 id="shops-title" className="font-display text-lg font-bold text-foreground">المحلات</h2>
                {shops.loading ? (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44" />)}</div>
                ) : shops.error ? (
                    <ErrorState title="مقدرناش نحمّل المحلات" message={shops.error.message} onRetry={shops.refetch} />
                ) : !cards.length ? (
                    <EmptyState icon={Store} title="مفيش محلات متسجلة" message="راجع إعدادات المحلات في الباك." />
                ) : (
                    <ShopCards rows={cards} />
                )}
            </section>

            {/* 3. معانا كام */}
            {position.loading ? (
                <Skeleton className="h-64" />
            ) : position.error ? (
                <ErrorState title="مقدرناش نجيب الفلوس والبضاعة" message={position.error.message} onRetry={position.refetch} />
            ) : (
                <PositionStrip position={position.data} />
            )}

            {/* 4. Sales today / this month */}
            {!shops.loading && !shops.error ? (
                <div className="grid grid-cols-2 gap-3">
                    <KpiCard kind="sales" label="مبيعات النهارده" value={money(todayTotal)} unit="ج.م" sub="كل المحلات" />
                    <KpiCard kind="sales" label="مبيعات الشهر ده" value={money(monthTotal)} unit="ج.م" sub="من أول الشهر" />
                </div>
            ) : null}

            {/* 5. Analysis for a chosen period */}
            <section
                aria-labelledby="hero-title"
                className={`rounded-3xl bg-primary px-5 py-6 text-white shadow-lg transition-opacity sm:px-8 sm:py-8 ${compare.fetching && c ? 'opacity-80' : ''}`}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 id="hero-title" className="font-display text-lg font-bold sm:text-xl">تحليل المبيعات</h2>
                    <PeriodTabs value={periodId} onChange={setPeriodId} />
                </div>

                {compare.loading ? (
                    <div className="mt-6"><HeroSkeleton /></div>
                ) : compare.error ? (
                    <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm">
                        مقدرناش نجيب التحليل: {compare.error.message}
                        <button type="button" onClick={compare.refetch} className="ms-3 font-semibold underline">حاول تاني</button>
                    </div>
                ) : (
                    <>
                        <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
                            <p className="font-display text-4xl font-extrabold leading-none tabular-nums text-white sm:text-5xl" data-testid="hero-total">
                                {money(c.totalSales)}
                                <span className="ms-2 text-lg font-semibold text-white/60">ج.م</span>
                            </p>
                            <div className="flex items-center gap-2 pb-1">
                                <ChangeBadge value={c.change?.sales} size="lg" onDark label="المبيعات" />
                                {c.previous ? (
                                    <span className="text-xs text-white/60">مقابل {money(c.previous.sales)} {period.previous}</span>
                                ) : null}
                            </div>
                        </div>
                        {headline(c, period) ? <p className="mt-3 text-sm text-white/80">{headline(c, period)}</p> : null}

                        <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-5 border-t border-white/10 pt-5">
                            <HeroStat
                                label="صافي الربح"
                                value={money(c.totalProfit)}
                                unit="ج.م"
                                tone={c.totalProfit < 0 ? 'text-rose-300' : 'text-emerald-300'}
                                badge={<ChangeBadge value={c.change?.profit} onDark label="الربح" />}
                            />
                            <HeroStat label="هامش الربح" value={pct(c.margin)} />
                            <HeroStat label="عدد الفواتير" value={count(c.totalInvoices)} />
                        </div>

                        {trendDays.length > 1 ? (
                            <div className="mt-6">
                                <TrendChart days={trendDays} onDark />
                                {c.daily.partial ? (
                                    <p className="mt-2 text-[11px] text-white/50">
                                        الرسم فيه {count(c.daily.shopsIncluded)} محلات بس — الباقي محتاج تحديث التقرير اليومي.
                                    </p>
                                ) : null}
                            </div>
                        ) : periodId === 'today' ? (
                            <p className="mt-6 text-xs text-white/50">اختار "آخر ٧ أيام" أو "آخر ٣٠ يوم" عشان تشوف التطور يوم بيوم.</p>
                        ) : c?.daily && !c.daily.available ? (
                            <p className="mt-6 text-xs text-white/50">التطور اليومي هيظهر لما المحلات تتحدث بالتقرير اليومي.</p>
                        ) : null}
                    </>
                )}
            </section>

            {/* Shops ranked by sales for that period */}
            {!compare.loading && !compare.error && rows.length ? (
                <section aria-labelledby="ranking-title" className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                        <h2 id="ranking-title" className="font-display text-lg font-bold text-foreground">ترتيب المحلات</h2>
                        <p className="text-xs text-muted-foreground">حسب المبيعات — {period.label}</p>
                    </div>
                    <ShopRanking rows={rows} />
                </section>
            ) : null}
        </div>
    );
}
