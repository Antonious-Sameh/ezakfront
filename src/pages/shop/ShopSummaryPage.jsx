import React, { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from '@/components/Head';
import { ArrowUpLeft, Boxes, HandCoins, PackageX, Truck, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { ErrorState } from '@/components/StateViews';
import KpiCard from '@/components/analytics/KpiCard';
import TrendChart from '@/components/analytics/TrendChart';
import ProfitSteps from '@/components/analytics/ProfitSteps';
import SplitBar from '@/components/analytics/SplitBar';
import RankedBars from '@/components/analytics/RankedBars';
import Disclosure from '@/components/analytics/Disclosure';
import { PERIODS, periodById, periodRange } from '@/components/analytics/periods';
import { money, pct, count, qty, moneyParts, figureSize } from '@/components/analytics/format';
import MoneyFigure from '@/components/analytics/MoneyFigure';

/**
 * One page per shop: "how is this shop doing?" — what used to be two pages
 * (نظرة عامة + التقارير) that answered the same question.
 *
 *   1. دلوقتي: cash, what customers owe, stock value, what we owe suppliers
 *   2. the period (اليوم / 7 أيام / 30 يوم): sales, profit, purchases, avg
 *      invoice — each against the previous period — and the day-by-day trend
 *   3. profit step by step, cash vs credit
 *   4. what is running out
 *   5. "تفاصيل أكتر" (folded): best sellers, stock, customers, suppliers
 * The "now" figures don't depend on the period, so switching period only
 * re-asks for the period's own figures.
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
            ? ['التطور بيظهر على أكتر من يوم', 'اختار "آخر 7 أيام" أو "آخر 30 يوم".']
            : ['مفيش حركة في الفترة دي', 'جرّب فترة أطول من فوق.'];
    return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">{text[0]}</p>
            <p className="text-xs text-muted-foreground">{text[1]}</p>
        </div>
    );
}

function Stat({ label, value, unit, tone = 'text-foreground', amount }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={`mt-0.5 font-display text-lg font-bold tabular-nums ${tone}`}>
                {amount !== undefined ? <MoneyFigure value={amount} unit={unit} /> : (
                    <>{value}{unit ? <span className="ms-1 text-xs font-medium text-muted-foreground">{unit}</span> : null}</>
                )}
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
                    className={`min-h-11 flex-1 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors sm:flex-none sm:text-sm ${
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


function NowTile({ icon: Icon, label, value, tone, to, hint }) {
    const tones = {
        green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        slate: 'bg-muted text-foreground',
        rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    };
    const body = (
        <>
            <div className="flex items-center gap-2">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <p className="text-xs font-medium leading-tight text-muted-foreground">{label}</p>
            </div>
            <p className={`mt-2 font-display font-extrabold tabular-nums ${figureSize(value === null || value === undefined ? '' : (moneyParts(value)?.headline ?? money(value)), { base: 'text-xl', sm: 'sm:text-2xl' })} ${value !== null && value < 0 ? 'text-rose-600' : 'text-foreground'}`}>
                {value === null || value === undefined ? '—' : <MoneyFigure value={value} />}
            </p>
            {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
        </>
    );
    const cls = 'min-w-0 rounded-2xl border border-border bg-card px-3.5 py-3 sm:p-4';
    return to ? (
        <Link to={to} className={`${cls} block transition-colors hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`}>{body}</Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

function LowStockPanel({ items, total, shopId }) {
    return (
        <Panel
            title={`أصناف ناقصة أو خلصت (${count(total)})`}
            subtitle="وصلت لحد التنبيه أو خلصت"
            className="border-amber-500/30"
        >
            <ul className="divide-y divide-border/60">
                {items.map((p) => {
                    const isOut = p.status === 'out' || (p.stock ?? 0) <= 0;
                    return (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                                {p.sku ? <p className="truncate font-mono text-[11px] text-muted-foreground" dir="ltr">{p.sku}</p> : null}
                            </div>
                            <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums ${
                                    isOut
                                        ? 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                        : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                }`}
                            >
                                {isOut ? 'خلص' : `فاضل ${qty(p.stock)}${p.unit ? ` ${p.unit}` : ''}`}
                            </span>
                        </li>
                    );
                })}
            </ul>
            <Link to={`/shops/${shopId}/products`} className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-primary hover:text-primary/80">
                شوف كل الأصناف <ArrowUpLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
        </Panel>
    );
}

export default function ShopSummaryPage() {
    const { token } = useAuth();
    const { shopId } = useParams();
    const [periodId, setPeriodId] = useState('month');
    const period = periodById(periodId);
    const range = useMemo(() => periodRange(periodId), [periodId]);

    // Not tied to the period → asked once per shop (and cached), not on every tab switch.
    const nowFetcher = useCallback((signal) => {
        const get = (type) => api.getShopReport(token, shopId, type, {}, { signal }).then((r) => r.data);
        return Promise.all([get('inventory'), get('customers'), get('suppliers')])
            .then(([inventory, customers, suppliers]) => ({ inventory, customers, suppliers }));
    }, [token, shopId]);
    const now = useApiQuery(nowFetcher, { key: `now:${shopId}`, staleTime: 60_000 });

    // Cash in the drawer + the items running out (the shop's overview figures).
    const overviewFetcher = useCallback((signal) => api.getShopOverview(token, shopId, { signal }).then((r) => r.data), [token, shopId]);
    const overview = useApiQuery(overviewFetcher, { key: `overview:${shopId}`, staleTime: 60_000 });

    const periodFetcher = useCallback((signal) => {
        const p = { from: range.from, to: range.to };
        const withPrev = { ...p, extras: { compare: 'previous' } };
        const get = (type, params) => api.getShopReport(token, shopId, type, params, { signal }).then((r) => r.data);
        return Promise.all([get('sales', withPrev), get('profit', withPrev), get('purchases', withPrev), get('daily', p)])
            .then(([sales, profit, purchases, daily]) => ({ sales, profit, purchases, daily }));
    }, [token, shopId, range.from, range.to]);
    const per = useApiQuery(periodFetcher, { key: `period:${shopId}:${range.from}:${range.to}`, keepPrevious: true });

    const trend = useMemo(() => trendSeries(per.data?.daily), [per.data]);
    const lowTotal = now.data ? now.data.inventory.lowCount + now.data.inventory.outCount : 0;
    const lowItems = overview.data?.lowStockItems || [];

    return (
        <div className="flex flex-col gap-6 dir-rtl">
            <Helmet>
                <title>ملخص المحل — لوحة تحكم المحلات</title>
                <meta name="description" content="الكاش واللي على العملاء والبضاعة، ومبيعات وأرباح المحل مقارنة بالفترة اللي قبلها، وحساب الأرباح، والنواقص." />
            </Helmet>

            <header>
                <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">ملخص المحل</h1>
            </header>

            {/* 1. Now — doesn't depend on the period */}
            <section aria-labelledby="now-title" className="flex flex-col gap-3">
                <h2 id="now-title" className="font-display text-base font-bold text-foreground">دلوقتي</h2>
                {now.loading && overview.loading ? (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" aria-hidden="true" />)}</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <NowTile icon={Wallet} tone="green" label="الكاش" value={overview.data ? overview.data.cashboxBalance : null} to={`/shops/${shopId}/cashbox`} />
                        <NowTile icon={HandCoins} tone="amber" label="لينا عند العملاء" value={now.data ? now.data.customers.totalOutstanding : null} to={`/shops/${shopId}/customers`}
                            hint={now.data && now.data.customers.withBalanceCount ? `${count(now.data.customers.withBalanceCount)} عميل` : undefined} />
                        <NowTile icon={Boxes} tone="slate" label="البضاعة (بالتكلفة)" value={now.data ? now.data.inventory.totalStockValue : null} to={`/shops/${shopId}/products`}
                            hint={now.data ? `بسعر البيع ${money(now.data.inventory.saleValue)}` : undefined} />
                        <NowTile icon={Truck} tone="rose" label="علينا للموردين" value={now.data ? now.data.suppliers.totalOutstanding : null} to={`/shops/${shopId}/suppliers`} />
                    </div>
                )}
                {now.error ? <ErrorState title="مقدرناش نجيب الديون والبضاعة" message={now.error.message} onRetry={now.refetch} /> : null}
            </section>

            {/* 2. The period */}
            <section aria-labelledby="period-title" className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 id="period-title" className="font-display text-base font-bold text-foreground">المبيعات والأرباح</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">{period.label}، ومقارنة بـ{period.previous}</p>
                    </div>
                    <PeriodTabs value={periodId} onChange={setPeriodId} />
                </div>

                {per.loading ? (
                    <ReportsSkeleton />
                ) : per.error ? (
                    <ErrorState title="مقدرناش نحمّل التقارير" message={per.error.message} onRetry={per.refetch} />
                ) : (
                    <div className={`flex flex-col gap-6 transition-opacity ${per.fetching ? 'opacity-70' : ''}`} aria-busy={per.fetching}>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <KpiCard kind="sales" label="صافي المبيعات" value={money(per.data.sales.totalSales)} amount={per.data.sales.totalSales} unit="ج.م"
                                change={per.data.sales.change?.totalSales} sub={`${count(per.data.sales.count)} فاتورة`} />
                            <KpiCard
                                kind={per.data.profit.totalProfit < 0 ? 'loss' : 'profit'}
                                label="صافي الربح"
                                value={money(per.data.profit.totalProfit)} amount={per.data.profit.totalProfit}
                                unit="ج.م"
                                valueClass={per.data.profit.totalProfit < 0 ? 'text-rose-600' : ''}
                                change={per.data.profit.change?.totalProfit}
                                sub={`هامش ${pct(per.data.profit.margin)}`}
                            />
                            <KpiCard kind="cost" label="المشتريات" value={money(per.data.purchases.totalPurchases)} amount={per.data.purchases.totalPurchases} unit="ج.م"
                                change={per.data.purchases.change?.totalPurchases} changeProps={{ neutral: true }} sub={`${count(per.data.purchases.count)} فاتورة شراء`} />
                            <KpiCard kind="neutral" label="متوسط الفاتورة" value={money(per.data.sales.avgInvoice)} amount={per.data.sales.avgInvoice} unit="ج.م"
                                change={per.data.sales.change?.avgInvoice} sub={per.data.sales.returns > 0 ? `مرتجعات ${money(per.data.sales.returns)}` : undefined} />
                        </div>

                        <Panel title="المبيعات والربح يوم بيوم" subtitle="المس أي يوم عشان تشوف أرقامه">
                            {trend.empty || trend.days.length < 2 ? (
                                <TrendEmpty reason={trend.empty === 'outdated' ? 'outdated' : 'no-activity'} periodId={periodId} />
                            ) : (
                                <TrendChart days={trend.days} />
                            )}
                        </Panel>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Panel title="حساب الأرباح" subtitle="من المبيعات لحد صافي الربح، خطوة بخطوة">
                                <ProfitSteps profit={per.data.profit} />
                            </Panel>
                            <Panel title="الفلوس دخلت إزاي" subtitle="مبيعات الفترة: نقدي مقابل آجل">
                                <SplitBar
                                    ariaLabel="نسبة المبيعات النقدي والآجل"
                                    parts={[
                                        { label: 'نقدي', value: per.data.sales.byPaymentType?.cash, className: 'bg-accent' },
                                        { label: 'آجل', value: per.data.sales.byPaymentType?.credit, className: 'bg-amber-400' },
                                    ]}
                                />
                                <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                                    <Stat label="اتحصّل من فواتير الفترة" value={money(per.data.sales.collected)} amount={per.data.sales.collected} unit="ج.م" tone="text-emerald-700 dark:text-emerald-400" />
                                    <Stat label="لسه متحصّلش منها" value={money(per.data.sales.creditOutstanding)} amount={per.data.sales.creditOutstanding} unit="ج.م"
                                        tone={per.data.sales.creditOutstanding > 0 ? 'text-rose-600' : 'text-foreground'} />
                                </dl>
                            </Panel>
                        </div>
                    </div>
                )}
            </section>

            {/* 3. What is running out */}
            {lowItems.length ? <LowStockPanel items={lowItems} total={lowTotal || lowItems.length} shopId={shopId} /> : lowTotal > 0 ? (
                <Link to={`/shops/${shopId}/products`} className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-sm font-semibold text-amber-900 dark:text-amber-300">
                    <PackageX className="h-4 w-4" aria-hidden="true" /> {count(lowTotal)} صنف ناقص أو خلص — شوفهم
                </Link>
            ) : null}

            {/* 4. More detail, folded */}
            {now.data && per.data ? (
                <Disclosure title="تفاصيل أكتر" subtitle="أكتر الأصناف مبيعاً، والمخزون، والعملاء والموردين">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Panel title="أكتر الأصناف مبيعاً" subtitle="حسب قيمة المبيعات في الفترة، والكمية بعد المرتجعات">
                            <RankedBars
                                rows={(per.data.sales.topProducts || []).slice(0, 8).map((p, i) => ({
                                    key: `${p.name}-${i}`,
                                    label: p.name,
                                    barValue: p.total || p.qty,
                                    end: <>{money(p.total)} <span className="text-xs text-muted-foreground">ج.م</span> <span className="text-xs text-muted-foreground">({qty(p.qty)} قطعة)</span></>,
                                }))}
                            />
                        </Panel>
                        <Panel title="المخزون" subtitle="الموجود حالياً (مش مرتبط بالفترة)">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                                <Stat label="قيمته بالتكلفة" value={money(now.data.inventory.totalStockValue)} amount={now.data.inventory.totalStockValue} unit="ج.م" />
                                <Stat label="قيمته بسعر البيع" value={money(now.data.inventory.saleValue)} amount={now.data.inventory.saleValue} unit="ج.م" />
                                <Stat label="ربح متوقع لو اتباع" value={money(now.data.inventory.expectedProfit)} amount={now.data.inventory.expectedProfit} unit="ج.م" tone="text-emerald-700 dark:text-emerald-400" />
                                <Stat label="عدد الأصناف" value={count(now.data.inventory.totalProducts)} />
                                <Stat label="ناقص" value={count(now.data.inventory.lowCount)} tone={now.data.inventory.lowCount ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'} />
                                <Stat label="خلص" value={count(now.data.inventory.outCount)} tone={now.data.inventory.outCount ? 'text-rose-600' : 'text-foreground'} />
                            </dl>
                        </Panel>
                        <Panel title="العملاء" subtitle="من بداية التشغيل (مش مرتبط بالفترة)">
                            <dl className="grid grid-cols-2 gap-3">
                                <Stat label="لسه على العملاء" value={money(now.data.customers.totalOutstanding)} amount={now.data.customers.totalOutstanding} unit="ج.م" tone={now.data.customers.totalOutstanding > 0 ? 'text-rose-600' : 'text-foreground'} />
                                <Stat label="عملاء عليهم فلوس" value={`${count(now.data.customers.withBalanceCount)} من ${count(now.data.customers.count)}`} />
                            </dl>
                            <RankedBars
                                emptyText="مفيش عملاء متسجلين"
                                rows={(now.data.customers.topCustomers || []).slice(0, 6).map((c) => ({
                                    key: c.id || c.name, label: c.name, barValue: c.totalSpent, end: <>{money(c.totalSpent)} <span className="text-xs text-muted-foreground">ج.م</span></>,
                                    note: c.remaining > 0 ? <span className="font-semibold text-rose-600">عليه {money(c.remaining)} ج.م</span> : null,
                                }))}
                            />
                        </Panel>
                        <Panel title="الموردين" subtitle="من بداية التشغيل (مش مرتبط بالفترة)">
                            <dl className="grid grid-cols-2 gap-3">
                                <Stat label="لسه للموردين" value={money(now.data.suppliers.totalOutstanding)} amount={now.data.suppliers.totalOutstanding} unit="ج.م" tone={now.data.suppliers.totalOutstanding > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'} />
                                <Stat label="موردين ليهم فلوس" value={`${count(now.data.suppliers.withBalanceCount)} من ${count(now.data.suppliers.count)}`} />
                            </dl>
                            <RankedBars
                                barClass="bg-amber-400"
                                emptyText="مفيش موردين متسجلين"
                                rows={(now.data.suppliers.topSuppliers || []).slice(0, 6).map((s) => ({
                                    key: s.id || s.name, label: s.name, barValue: s.totalAmount, end: <>{money(s.totalAmount)} <span className="text-xs text-muted-foreground">ج.م</span></>,
                                    note: s.remaining > 0 ? <span className="font-semibold text-amber-700 dark:text-amber-400">له {money(s.remaining)} ج.م</span> : null,
                                }))}
                            />
                        </Panel>
                    </div>
                </Disclosure>
            ) : null}
        </div>
    );
}
