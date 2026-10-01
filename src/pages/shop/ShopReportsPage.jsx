import React, { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from '@/components/Head';
import { PackageX } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { ErrorState } from '@/components/StateViews';
import KpiCard from '@/components/analytics/KpiCard';
import TrendChart from '@/components/analytics/TrendChart';
import ProfitSteps from '@/components/analytics/ProfitSteps';
import SplitBar from '@/components/analytics/SplitBar';
import RankedBars from '@/components/analytics/RankedBars';
import { PERIODS, periodById, periodRange } from '@/components/analytics/periods';
import { money, pct, count } from '@/components/analytics/format';

/**
 * One shop's reports for a period — figures that explain themselves:
 * every headline number is compared with the previous period, profit is
 * shown step by step, and the lists say what to act on (best sellers,
 * who owes what, what's running out). No chart library on this page.
 */

/** Day series → TrendChart points (sales after returns, net profit). */
export function trendSeries(daily) {
    if (!daily || daily.available === false) return { empty: 'outdated', days: [] };
    const days = (daily.days || []).map((d) => ({ date: d.date, sales: d.netSales, profit: d.net }));
    const any = (daily.days || []).some((d) => d.netSales || d.cogs || d.net || d.expenses);
    return any ? { empty: null, days } : { empty: 'no-activity', days };
}

function Panel({ title, subtitle, children, className = '' }) {
    return (
        <section className={`flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 ${className}`}>
            <header>
                <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
            </header>
            {children}
        </section>
    );
}

function TrendEmpty({ reason, periodId }) {
    const text = reason === 'outdated'
        ? ['التطور اليومي مش متاح للمحل ده لسه', 'محتاج تحديث باك المحل (تحديث التقرير اليومي).']
        : periodId === 'today'
            ? ['التطور بيظهر على أكتر من يوم', 'اختار "آخر ٧ أيام" أو "آخر ٣٠ يوم".']
            : ['مفيش حركة في الفترة دي', 'جرّب فترة أطول من فوق.'];
    return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">{text[0]}</p>
            <p className="text-xs text-muted-foreground">{text[1]}</p>
        </div>
    );
}

function Stat({ label, value, unit, tone = 'text-foreground' }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={`mt-0.5 font-display text-lg font-bold tabular-nums ${tone}`}>
                {value}{unit ? <span className="ms-1 text-xs font-medium text-muted-foreground">{unit}</span> : null}
            </dd>
        </div>
    );
}

function PeriodTabs({ value, onChange }) {
    return (
        <div className="flex rounded-xl border border-border bg-muted/50 p-1" role="group" aria-label="اختيار الفترة">
            {PERIODS.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => onChange(p.id)}
                    aria-pressed={value === p.id}
                    className={`min-h-9 flex-1 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors sm:flex-none sm:text-sm ${
                        value === p.id ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}

function ReportsSkeleton() {
    return (
        <div className="flex flex-col gap-6" aria-hidden="true">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />)}
            </div>
            <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
                <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
            </div>
        </div>
    );
}

export default function ShopReportsPage() {
    const { token } = useAuth();
    const { shopId } = useParams();
    const [periodId, setPeriodId] = useState('month');
    const period = periodById(periodId);
    const range = useMemo(() => periodRange(periodId), [periodId]);

    const fetcher = useCallback((signal) => {
        const p = { from: range.from, to: range.to };
        const withPrev = { ...p, extras: { compare: 'previous' } };
        const o = { signal };
        const get = (type, params) => api.getShopReport(token, shopId, type, params, o).then((r) => r.data);
        return Promise.all([
            get('sales', withPrev),
            get('profit', withPrev),
            get('purchases', withPrev),
            get('inventory', p),
            get('customers', p),
            get('suppliers', p),
            // Day-by-day series (needs shop patch 2; { available:false } before that).
            get('daily', p),
        ]).then(([sales, profit, purchases, inventory, customers, suppliers, daily]) => ({
            sales, profit, purchases, inventory, customers, suppliers, daily,
        }));
    }, [token, shopId, range.from, range.to]);

    const { data, loading, fetching, error, refetch } = useApiQuery(fetcher, {
        key: `reports:${shopId}:${range.from}:${range.to}`,
        keepPrevious: true,
    });

    const trend = useMemo(() => trendSeries(data?.daily), [data]);

    return (
        <div className="flex flex-col gap-6 dir-rtl">
            <Helmet>
                <title>التقارير — لوحة تحكم المحلات</title>
                <meta name="description" content="مبيعات وأرباح المحل مقارنة بالفترة اللي قبلها، حساب الأرباح خطوة بخطوة، الأصناف الأكتر مبيعاً، والديون والمخزون." />
            </Helmet>

            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">التقارير</h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {period.label}، ومقارنة بـ{period.previous}
                    </p>
                </div>
                <PeriodTabs value={periodId} onChange={setPeriodId} />
            </header>

            {loading ? (
                <ReportsSkeleton />
            ) : error ? (
                <ErrorState title="مقدرناش نحمّل التقارير" message={error.message} onRetry={refetch} />
            ) : (
                <div className={`flex flex-col gap-6 transition-opacity ${fetching ? 'opacity-70' : ''}`} aria-busy={fetching}>
                    {/* Headline figures */}
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <KpiCard
                            kind="sales"
                            label="صافي المبيعات"
                            value={money(data.sales.totalSales)}
                            unit="ج.م"
                            change={data.sales.change?.totalSales}
                            sub={`${count(data.sales.count)} فاتورة`}
                        />
                        <KpiCard
                            kind={data.profit.totalProfit < 0 ? 'loss' : 'profit'}
                            label="صافي الربح"
                            value={money(data.profit.totalProfit)}
                            unit="ج.م"
                            valueClass={data.profit.totalProfit < 0 ? 'text-rose-600' : ''}
                            change={data.profit.change?.totalProfit}
                            sub={`هامش ${pct(data.profit.margin)}`}
                        />
                        <KpiCard
                            kind="cost"
                            label="المشتريات"
                            value={money(data.purchases.totalPurchases)}
                            unit="ج.م"
                            change={data.purchases.change?.totalPurchases}
                            changeProps={{ neutral: true }}
                            sub={`${count(data.purchases.count)} فاتورة شراء`}
                        />
                        <KpiCard
                            kind="neutral"
                            label="متوسط الفاتورة"
                            value={money(data.sales.avgInvoice)}
                            unit="ج.م"
                            change={data.sales.change?.avgInvoice}
                            sub={data.sales.returns > 0 ? `مرتجعات ${money(data.sales.returns)}` : undefined}
                        />
                    </div>

                    {/* Day by day */}
                    <Panel title="المبيعات والربح يوم بيوم" subtitle="المس أي يوم عشان تشوف أرقامه">
                        {trend.empty || trend.days.length < 2 ? (
                            <TrendEmpty reason={trend.empty === 'outdated' ? 'outdated' : 'no-activity'} periodId={periodId} />
                        ) : (
                            <TrendChart days={trend.days} />
                        )}
                    </Panel>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Panel title="حساب الأرباح" subtitle="من المبيعات لحد صافي الربح، خطوة بخطوة">
                            <ProfitSteps profit={data.profit} />
                        </Panel>

                        <Panel title="الفلوس دخلت إزاي" subtitle="مبيعات الفترة: نقدي مقابل آجل">
                            <SplitBar
                                ariaLabel="نسبة المبيعات النقدي والآجل"
                                parts={[
                                    { label: 'نقدي', value: data.sales.byPaymentType?.cash, className: 'bg-accent' },
                                    { label: 'آجل', value: data.sales.byPaymentType?.credit, className: 'bg-amber-400' },
                                ]}
                            />
                            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                                <Stat label="اتحصّل من فواتير الفترة" value={money(data.sales.collected)} unit="ج.م" tone="text-emerald-700 dark:text-emerald-400" />
                                <Stat
                                    label="لسه متحصّلش منها"
                                    value={money(data.sales.creditOutstanding)}
                                    unit="ج.م"
                                    tone={data.sales.creditOutstanding > 0 ? 'text-rose-600' : 'text-foreground'}
                                />
                            </dl>
                        </Panel>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Panel title="أكتر الأصناف مبيعاً" subtitle="حسب قيمة المبيعات في الفترة، والكمية بعد المرتجعات">
                            <RankedBars
                                rows={(data.sales.topProducts || []).slice(0, 8).map((p, i) => ({
                                    key: `${p.name}-${i}`,
                                    label: p.name,
                                    barValue: p.total || p.qty,
                                    end: <>{money(p.total)} <span className="text-xs text-muted-foreground">({count(p.qty)} قطعة)</span></>,
                                }))}
                            />
                        </Panel>

                        <Panel title="المخزون دلوقتي" subtitle="مش مرتبط بالفترة — ده الموجود حالياً">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                                <Stat label="قيمته بالتكلفة" value={money(data.inventory.totalStockValue)} unit="ج.م" />
                                <Stat label="قيمته بسعر البيع" value={money(data.inventory.saleValue)} unit="ج.م" />
                                <Stat label="ربح متوقع لو اتباع" value={money(data.inventory.expectedProfit)} unit="ج.م" tone="text-emerald-700 dark:text-emerald-400" />
                                <Stat label="عدد الأصناف" value={count(data.inventory.totalProducts)} />
                                <Stat label="ناقص" value={count(data.inventory.lowCount)} tone={data.inventory.lowCount ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'} />
                                <Stat label="خلص" value={count(data.inventory.outCount)} tone={data.inventory.outCount ? 'text-rose-600' : 'text-foreground'} />
                            </dl>
                            {data.inventory.lowCount + data.inventory.outCount > 0 ? (
                                <Link
                                    to={`/shops/${shopId}/products`}
                                    className="inline-flex items-center gap-2 self-start rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-500/[0.12] dark:text-amber-300"
                                >
                                    <PackageX className="h-4 w-4" aria-hidden="true" />
                                    شوف الأصناف الناقصة
                                </Link>
                            ) : null}
                        </Panel>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Panel title="العملاء" subtitle="من بداية التشغيل (مش مرتبط بالفترة)">
                            <dl className="grid grid-cols-2 gap-3">
                                <Stat label="لسه على العملاء" value={money(data.customers.totalOutstanding)} unit="ج.م" tone={data.customers.totalOutstanding > 0 ? 'text-rose-600' : 'text-foreground'} />
                                <Stat label="عملاء عليهم فلوس" value={`${count(data.customers.withBalanceCount)} من ${count(data.customers.count)}`} />
                            </dl>
                            <RankedBars
                                emptyText="مفيش عملاء متسجلين"
                                rows={(data.customers.topCustomers || []).slice(0, 6).map((c) => ({
                                    key: c.id || c.name,
                                    label: c.name,
                                    barValue: c.totalSpent,
                                    end: money(c.totalSpent),
                                    note: c.remaining > 0 ? <span className="font-semibold text-rose-600">عليه {money(c.remaining)} ج.م</span> : null,
                                }))}
                            />
                        </Panel>

                        <Panel title="الموردين" subtitle="من بداية التشغيل (مش مرتبط بالفترة)">
                            <dl className="grid grid-cols-2 gap-3">
                                <Stat label="لسه للموردين" value={money(data.suppliers.totalOutstanding)} unit="ج.م" tone={data.suppliers.totalOutstanding > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'} />
                                <Stat label="موردين ليهم فلوس" value={`${count(data.suppliers.withBalanceCount)} من ${count(data.suppliers.count)}`} />
                            </dl>
                            <RankedBars
                                barClass="bg-amber-400"
                                emptyText="مفيش موردين متسجلين"
                                rows={(data.suppliers.topSuppliers || []).slice(0, 6).map((s) => ({
                                    key: s.id || s.name,
                                    label: s.name,
                                    barValue: s.totalAmount,
                                    end: money(s.totalAmount),
                                    note: s.remaining > 0 ? <span className="font-semibold text-amber-700 dark:text-amber-400">له {money(s.remaining)} ج.م</span> : null,
                                }))}
                            />
                        </Panel>
                    </div>
                </div>
            )}
        </div>
    );
}
