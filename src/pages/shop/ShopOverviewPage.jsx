import React, { useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { 
    AlertTriangle, 
    Boxes, 
    CalendarDays, 
    Coins, 
    Package, 
    Receipt, 
    TrendingUp, 
    Users,
    ArrowUpLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { ErrorState } from '@/components/StateViews';
import { AR_LOCALE } from '@/lib/mockData';

const num = (v) => formatNumber(v ?? 0, { locale: AR_LOCALE });

function StatCard({ icon: Icon, label, value, hint, tone, className = "" }) {
    return (
        <div className={`flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-border/80 hover:shadow-md ${className}`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <span className={`grid h-9 w-9 place-items-center rounded-lg bg-muted/60 ${tone || 'text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
            </div>
            <div>
                <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                    {value}
                </p>
                {hint ? (
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground/80">{hint}</p>
                ) : null}
            </div>
        </div>
    );
}

function StatCardSkeleton() {
    return (
        <div className="h-32 animate-pulse rounded-xl border border-border/50 bg-card p-5">
            <div className="flex justify-between items-center mb-4">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-9 w-9 rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-28 rounded bg-muted" />
        </div>
    );
}

export default function ShopOverviewPage() {
    const { token } = useAuth();
    const { shopId } = useParams();

    const fetcher = useCallback(
        () => api.getShopOverview(token, shopId).then((res) => res.data), 
        [token, shopId]
    );

    const { data, loading, error, refetch } = useApiQuery(fetcher);

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
                <p className="text-xs text-muted-foreground">ملخص سريع وأداء المبيعات والمخزون الخاص بالمحل</p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 7 }).map((_, i) => (
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
                    {/* شبكة الإحصائيات الرئيسية */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard 
                            icon={Receipt} 
                            label="مبيعات اليوم" 
                            value={num(data.todaySales)} 
                            hint={`${num(data.todayOrders)} فاتورة اليوم`} 
                        />
                        <StatCard 
                            icon={CalendarDays} 
                            label="مبيعات الشهر" 
                            value={num(data.monthSales)} 
                        />
                        <StatCard 
                            icon={TrendingUp} 
                            label="ربح اليوم" 
                            value={num(data.todayProfit)} 
                            tone="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" 
                        />
                        <StatCard 
                            icon={Coins} 
                            label="رصيد الكاشير" 
                            value={num(data.cashboxBalance)} 
                            tone={data.cashboxBalance < 0 
                                ? 'text-destructive bg-destructive/10' 
                                : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                            } 
                        />
                        <StatCard 
                            icon={Boxes} 
                            label="عدد المنتجات" 
                            value={num(data.productCount)} 
                        />
                        <StatCard 
                            icon={AlertTriangle} 
                            label="منتجات ناقصة" 
                            value={num(data.lowStockCount)} 
                            tone="text-amber-600 dark:text-amber-400 bg-amber-500/10" 
                        />
                        <StatCard 
                            icon={Users} 
                            label="عدد العملاء" 
                            value={num(data.customerCount)} 
                        />
                    </div>

                    {/* قسم تنبيهات النقص في المخزون */}
                    {data.lowStockItems?.length ? (
                        <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Package className="h-4.5 w-4.5" strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <h2 className="font-display text-base font-bold text-foreground">
                                            تنبيهات المخزون
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            المنتجات التي وصلت للحد الأدنى أو نفدت بالكامل
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
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {[p.category, p.sku].filter(Boolean).join(' • ')}
                                                </p>
                                            </div>
                                            <span 
                                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                                                    isOut 
                                                        ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                                                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                                }`}
                                            >
                                                {isOut ? 'نفد بالكامل' : `${num(p.stock)} ${p.unit || ''}`.trim()}
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