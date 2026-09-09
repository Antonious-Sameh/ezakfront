import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { format, subDays } from 'date-fns';
import { Store, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import ShopCard, { ShopCardSkeleton } from '@/components/ShopCard';
import SalesCompareChart from '@/components/SalesCompareChart';
import { EmptyState, ErrorState } from '@/components/StateViews';

const AR_LOCALE = 'ar-EG';

const PERIODS = [
    { id: 'today', label: 'اليوم' },
    { id: 'week', label: 'الأسبوع' },
    { id: 'month', label: 'الشهر' },
];

function PeriodFilter({ value, onChange, disabled }) {
    return (
        <div 
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/60 p-1 sm:w-auto overflow-x-auto" 
            role="group" 
            aria-label="اختيار الفترة"
        >
            {PERIODS.map((period) => {
                const isActive = value === period.id;
                return (
                    <button
                        key={period.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(period.id)}
                        aria-pressed={isActive}
                        className={`min-h-[40px] flex-1 min-w-[70px] rounded-md px-3 py-1.5 text-xs font-semibold sm:text-sm transition-all active:scale-[0.98] sm:flex-none ${
                            isActive
                                ? 'bg-background text-foreground shadow-sm font-bold border border-border/50'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {period.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function OverviewPage() {
    const { token } = useAuth();
    const [period, setPeriod] = useState('today');

    // حساب نطاق التواريخ بشكل مميز يتغير حسب الفلتر
    const range = useMemo(() => {
        const to = new Date();
        const from = period === 'today' ? to : subDays(to, period === 'week' ? 6 : 29);
        return { 
            from: format(from, 'yyyy-MM-dd'), 
            to: format(to, 'yyyy-MM-dd') 
        };
    }, [period]);

    const periodLabel = useMemo(() => {
        return PERIODS.find((p) => p.id === period)?.label || '';
    }, [period]);

    // Fetchers مع تحسين الأداء عبر useCallback
    const shopsFetcher = useCallback(
        () => api.getShops(token).then((res) => res.data), 
        [token]
    );
    
    const compareFetcher = useCallback(
        () => api.getCompareReport(token, range.from, range.to).then((res) => res.data),
        [token, range.from, range.to],
    );

    const shops = useApiQuery(shopsFetcher);
    const compare = useApiQuery(compareFetcher);

    return (
        <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
            <Helmet>
                <title>الرئيسية — لوحة تحكم المحلات</title>
                <meta name="description" content="نظرة عامة على مبيعات وأرباح محلاتك الأربعة: مبيعات اليوم، حالة كل محل، وتنبيهات المخزون الناقص." />
            </Helmet>

            {/* Hero Section: إجمالي المبيعات والأرباح */}
            <section className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/90 px-6 py-8 text-primary-foreground shadow-lg sm:px-8 sm:py-10">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-8 -start-4 select-none font-display text-[20vw] font-bold leading-none text-primary-foreground/[0.05] sm:text-[8rem] md:text-[10rem]"
                >
                    المحلات
                </span>

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-xs font-medium text-primary-foreground/80">
                                نظرة عامة — {periodLabel}
                            </p>
                        </div>

                        {compare.loading ? (
                            <div className="mt-4 space-y-2">
                                <div className="h-4 w-36 animate-pulse rounded bg-primary-foreground/20" />
                                <div className="h-10 w-52 animate-pulse rounded bg-primary-foreground/20" />
                            </div>
                        ) : compare.error ? (
                            <p className="mt-3 text-sm text-primary-foreground/80 bg-red-500/10 p-2 rounded border border-red-500/20 max-w-fit">
                                تعذر تحميل إجمالي المبيعات — يُرجى إعادة المحاولة.
                            </p>
                        ) : (
                            <>
                                <p className="mt-2 text-xs sm:text-sm text-primary-foreground/70">
                                    إجمالي مبيعات الأربعة محلات
                                </p>
                                <p className="mt-1 font-display text-3xl font-extrabold tracking-tight tabular-nums text-accent sm:text-4xl md:text-5xl">
                                    {formatNumber(compare.data?.totalSales ?? 0, { locale: AR_LOCALE })}
                                </p>
                            </>
                        )}
                    </div>

                    {!compare.loading && !compare.error && (
                        <div className="border-t border-primary-foreground/15 pt-4 sm:border-t-0 sm:border-s sm:ps-8 sm:pt-0">
                            <p className="text-xs font-medium text-primary-foreground/70">صافي الربح</p>
                            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-primary-foreground sm:text-3xl">
                                {formatNumber(compare.data?.totalProfit ?? 0, { locale: AR_LOCALE })}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Shop Ledger Section */}
            <section aria-label="قائمة المحلات" className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
                            المحلات
                        </h2>
                        <p className="text-xs text-muted-foreground">اضغط على أي محل لعرض التفاصيل المتقدمة</p>
                    </div>

                    {shops.data ? (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums text-muted-foreground border border-border">
                            {formatNumber(shops.data.length, { locale: AR_LOCALE })} محلات
                        </span>
                    ) : null}
                </div>

                {shops.loading ? (
                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <ShopCardSkeleton key={i} />
                        ))}
                    </div>
                ) : shops.error ? (
                    <ErrorState
                        title="مقدرناش نحمّل المحلات"
                        message={shops.error.message}
                        onRetry={shops.refetch}
                    />
                ) : !shops.data?.length ? (
                    <EmptyState
                        icon={Store}
                        title="مفيش محلات لسه"
                        message="لما المحلات تتضاف على النظام هتظهر هنا تلقائيًا."
                    />
                ) : (
                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all">
                        {shops.data.map((shop, index) => (
                            <ShopCard key={shop.id || index} shop={shop} index={index} />
                        ))}
                    </div>
                )}
            </section>

            {/* Comparison Chart Section */}
            <section
                aria-label="مقارنة المبيعات والرسوم البيانية"
                className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-6"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
                    <div>
                        <h2 className="font-display text-lg font-bold text-foreground">مقارنة أداء المحلات</h2>
                        <p className="text-xs text-muted-foreground">تحليل المبيعات والأرباح لكل محل في الفترة المحددة</p>
                    </div>
                    <PeriodFilter value={period} onChange={setPeriod} disabled={compare.loading} />
                </div>

                {compare.loading ? (
                    <div className="flex h-72 items-end justify-around gap-2 sm:gap-4 px-2 sm:px-4 py-6">
                        {[55, 80, 40, 65].map((h, i) => (
                            <div
                                key={i}
                                className="w-full max-w-16 animate-pulse rounded-t-lg bg-muted/80"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                ) : compare.error ? (
                    <ErrorState
                        title="مقدرناش نحمّل بيانات المقارنة"
                        message={compare.error.message}
                        onRetry={compare.refetch}
                    />
                ) : !compare.data?.byShop?.length ? (
                    <EmptyState 
                        title="مفيش مبيعات في الفترة دي" 
                        message="جرّب اختيار فترة زمنية تانية من الفلتر أعلاه." 
                    />
                ) : (
                    <div className="w-full overflow-x-auto pt-2">
                        <SalesCompareChart data={compare.data.byShop} />
                    </div>
                )}
            </section>
        </div>
    );
}