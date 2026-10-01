import React, { useCallback } from 'react';
import { Helmet } from '@/components/Head';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpLeft, BarChart3, Boxes, Package, PackageX, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { ErrorState } from '@/components/StateViews';
import KpiCard from '@/components/analytics/KpiCard';
import { money, count } from '@/components/analytics/format';

/**
 * A shop's "right now": today's money first (sales, profit, cash in the
 * drawer, month so far) with the same colour language as the home page
 * (sales = violet, profit = green, loss / negative = red, needs attention =
 * amber), then the shop's size, then what is running out.
 */

function CountTile({ icon: Icon, label, value, to, warn = false }) {
    const body = (
        <>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${warn ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">{label}</span>
                <span className={`block font-display text-xl font-bold tabular-nums ${warn ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>{value}</span>
            </span>
        </>
    );
    const cls = `flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${warn ? 'border-amber-500/30 bg-amber-500/[0.05]' : 'border-border bg-card'}`;
    return to ? (
        <Link to={to} className={`${cls} transition-colors hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`}>{body}</Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

function StatCardSkeleton() {
    return <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" aria-hidden="true" />;
}

export default function ShopOverviewPage() {
    const { token } = useAuth();
    const { shopId } = useParams();

    const fetcher = useCallback(
        (signal) => api.getShopOverview(token, shopId, { signal }).then((res) => res.data),
        [token, shopId]
    );

    const { data, loading, error, refetch } = useApiQuery(fetcher, { key: `overview:${shopId}` });

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
            <Helmet>
                <title>نظرة عامة على المحل — لوحة تحكم المحلات</title>
                <meta name="description" content="ملخص سريع للمحل: مبيعات اليوم والشهر، عدد المنتجات، تنبيهات المخزون، ورصيد الكاشير." />
            </Helmet>

            <header className="flex flex-col gap-1 border-b border-border/60 pb-4">
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    نظرة عامة
                </h1>
                <p className="text-xs text-muted-foreground">المحل النهارده: المبيعات والربح والكاشير، واللي ناقص من المخزون</p>
            </header>

            {loading ? (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <StatCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <ErrorState 
                    title="مقدرناش نحمّل نظرة عامة" 
                    message={error.message} 
                    onRetry={refetch} 
                />
            ) : data ? (
                <>
                    {/* Today's money */}
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <KpiCard kind="sales" label="مبيعات النهارده" value={money(data.todaySales)} unit="ج.م" sub={`${count(data.todayOrders)} فاتورة`} />
                        <KpiCard
                            kind={data.todayProfit < 0 ? 'loss' : 'profit'}
                            label="ربح النهارده"
                            value={money(data.todayProfit)}
                            unit="ج.م"
                            valueClass={data.todayProfit < 0 ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}
                            sub="بعد التكلفة والمصروفات"
                        />
                        <KpiCard
                            kind={data.cashboxBalance < 0 ? 'loss' : 'neutral'}
                            label="رصيد الكاشير"
                            value={money(data.cashboxBalance)}
                            unit="ج.م"
                            valueClass={data.cashboxBalance < 0 ? 'text-rose-600' : ''}
                            sub="الفلوس اللي في الدرج دلوقتي"
                        />
                        <KpiCard kind="sales" label="مبيعات الشهر لحد النهارده" value={money(data.monthSales)} unit="ج.م" />
                    </div>

                    {/* The shop's size + what to act on */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <CountTile icon={Boxes} label="الأصناف" value={count(data.productCount)} to={`/shops/${shopId}/products`} />
                        <CountTile
                            icon={PackageX}
                            label="ناقص أو خلص"
                            value={count(data.lowStockCount)}
                            to={`/shops/${shopId}/products`}
                            warn={data.lowStockCount > 0}
                        />
                        <CountTile icon={Users} label="العملاء" value={count(data.customerCount)} to={`/shops/${shopId}/customers`} />
                    </div>

                    <Link
                        to={`/shops/${shopId}/reports`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-accent/25 bg-accent/[0.06] px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/[0.1]"
                    >
                        <span className="flex items-center gap-2.5">
                            <BarChart3 className="h-5 w-5 text-accent" aria-hidden="true" />
                            التقارير: المقارنة بالفترة اللي فاتت، وحساب الأرباح، والأكتر مبيعاً
                        </span>
                        <ArrowUpLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>

                    {/* قسم تنبيهات النقص في المخزون */}
                    {data.lowStockItems?.length ? (
                        <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Package className="h-4 w-4" strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <h2 className="font-display text-base font-bold text-foreground">
                                            أصناف محتاجة تتطلب
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            وصلت لحد التنبيه أو خلصت
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to={`/shops/${shopId}/products`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    <span>عرض الكل</span>
                                    <ArrowUpLeft className="h-3.5 w-3.5" />
                                </Link>
                            </div>

                            <ul className="divide-y divide-border/60">
                                {data.lowStockItems.map((p) => {
                                    const isOut = p.status === 'out' || (p.stock ?? 0) <= 0;
                                    return (
                                        <li 
                                            key={p.id} 
                                            className="flex items-center justify-between gap-3 py-3 px-2 rounded-lg transition-colors hover:bg-muted/40"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-foreground">
                                                    {p.name}
                                                </p>
                                                {p.sku ? (
                                                    <p className="truncate font-mono text-[11px] text-muted-foreground" dir="ltr">{p.sku}</p>
                                                ) : null}
                                            </div>
                                            <span 
                                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                                                    isOut 
                                                        ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                                                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                                }`}
                                            >
                                                {isOut ? 'خلص' : `فاضل ${count(p.stock)}${p.unit ? ` ${p.unit}` : ''}`}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}