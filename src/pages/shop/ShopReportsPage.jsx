import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Boxes, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { ErrorState } from '@/components/StateViews';
import { AR_LOCALE, PAYMENT_LABELS } from '@/lib/mockData';

const num = (v) => formatNumber(v, { locale: AR_LOCALE });
const compact = (v) => formatNumber(v, { locale: AR_LOCALE, notation: 'compact', maximumFractionDigits: 1 });

const PERIODS = [
    { id: 'today', label: 'اليوم' },
    { id: 'week', label: 'الأسبوع' },
    { id: 'month', label: 'الشهر' },
];
function periodRange(id) {
    const to = new Date();
    const from = id === 'today' ? to : subDays(to, id === 'week' ? 6 : 29);
    return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}

function StatCard({ icon: Icon, label, value, sub, tone }) {
    return (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-border">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 ${tone || 'text-primary'}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
            </div>
            <div>
                <p className="font-display text-2xl font-bold tabular-nums text-foreground sm:text-3xl">{value}</p>
                {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <section className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
            <div className="mb-5">
                <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
            {children}
        </section>
    );
}

const tooltipStyle = {
    direction: 'rtl',
    textAlign: 'right',
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'calc(var(--radius) + 2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    fontSize: 13,
    padding: '8px 12px',
};

export default function ShopReportsPage() {
    const { token } = useAuth();
    const { shopId } = useParams();
    const [period, setPeriod] = useState('month');
    const range = useMemo(() => periodRange(period), [period]);

    const fetcher = useCallback(() => {
        const p = { from: range.from, to: range.to };
        return Promise.all([
            api.getShopReport(token, shopId, 'sales', p),
            api.getShopReport(token, shopId, 'purchases', p),
            api.getShopReport(token, shopId, 'profit', p),
            api.getShopReport(token, shopId, 'inventory', p),
            api.getShopReport(token, shopId, 'customers', p),
            api.getShopReport(token, shopId, 'suppliers', p),
        ]).then(([sales, purchases, profit, inventory, customers, suppliers]) => ({
            sales: sales.data, purchases: purchases.data, profit: profit.data,
            inventory: inventory.data, customers: customers.data, suppliers: suppliers.data,
        }));
    }, [token, shopId, range]);
    const { data, loading, error, refetch } = useApiQuery(fetcher);

    return (
        <div className="flex flex-col gap-6 dir-rtl">
            <Helmet>
                <title>التقارير — لوحة تحكم المحلات</title>
                <meta name="description" content="تقارير المبيعات والمشتريات والأرباح والمخزون وأفضل العملاء والموردين مع رسوم بيانية." />
            </Helmet>

            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">التقارير المالية والأداء</h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">تقارير شاملة وتحليلات دقيقة لأداء المحل</p>
                </div>
                <div className="flex rounded-xl border border-border/80 bg-muted/50 p-1 shadow-xs" role="group" aria-label="اختيار الفترة">
                    {PERIODS.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setPeriod(p.id)}
                            aria-pressed={period === p.id}
                            className={`min-h-10 flex-1 rounded-lg px-4 py-1.5 text-xs font-bold transition-all active:scale-[0.98] sm:flex-none ${
                                period === p.id
                                    ? 'bg-card text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-32 animate-pulse rounded-xl border border-border/80 bg-card p-5" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="h-72 animate-pulse rounded-xl border border-border/80 bg-card" />
                        <div className="h-72 animate-pulse rounded-xl border border-border/80 bg-card" />
                    </div>
                </div>
            ) : error ? (
                <ErrorState title="مقدرناش نحمّل التقارير" message={error.message} onRetry={refetch} />
            ) : data ? (
                <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard icon={Receipt} label="إجمالي المبيعات" value={num(data.sales.totalSales)} sub={`${num(data.sales.count)} فاتورة`} />
                        <StatCard icon={TrendingUp} label="صافي الربح" value={num(data.profit.totalProfit)} sub={`هامش ${num(data.profit.margin)}%`} tone="text-emerald-600 bg-emerald-500/10" />
                        <StatCard icon={ShoppingCart} label="إجمالي المشتريات" value={num(data.purchases.totalPurchases)} sub={`${num(data.purchases.count)} فاتورة`} />
                        <StatCard icon={Boxes} label="قيمة المخزون" value={num(data.inventory.totalStockValue)} sub={`${num(data.inventory.totalProducts)} منتج`} />
                    </div>

                    {/* Sales & Profit charts */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Sales trend */}
                        <ChartCard title="تطور المبيعات" subtitle="المبيعات اليومية خلال الفترة المختارة">
                            <div dir="ltr" className="h-64 w-full sm:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.sales.byDay} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                                        <YAxis tickFormatter={compact} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                                        <Tooltip formatter={(v) => num(v)} contentStyle={tooltipStyle} />
                                        <Area type="monotone" dataKey="value" name="المبيعات" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#salesGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        {/* Profit trend */}
                        <ChartCard title="المبيعات والتكلفة والربح" subtitle="مقارنة بين الإيراد والتكلفة والأرباح">
                            <div dir="ltr" className="h-64 w-full sm:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.profit.byDay} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} barGap={3}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                                        <YAxis tickFormatter={compact} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                                        <Tooltip formatter={(v) => num(v)} contentStyle={tooltipStyle} />
                                        <Bar dataKey="sales" name="المبيعات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                        <Bar dataKey="cost" name="التكلفة" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[4, 4, 0, 0]} maxBarSize={20} />
                                        <Bar dataKey="profit" name="الربح" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </div>

                    {/* Top products + payment split */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <ChartCard title="أكثر المنتجات مبيعًا" subtitle="حسب الكمية المباعة">
                            <ul className="flex flex-col divide-y divide-border/50">
                                {data.sales.topProducts.map((p, i) => (
                                    <li key={p.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                                                {i + 1}
                                            </span>
                                            <span className="truncate text-sm font-semibold text-foreground">{p.name}</span>
                                        </div>
                                        <span className="shrink-0 font-display text-sm font-bold tabular-nums text-primary">{num(p.qty)}</span>
                                    </li>
                                ))}
                            </ul>
                        </ChartCard>

                        <ChartCard title="المبيعات حسب طريقة الدفع" subtitle="توزيع إجمالي المبيعات">
                            <ul className="flex flex-col gap-4">
                                {Object.entries(data.sales.byPaymentType).map(([type, value]) => {
                                    const total = Object.values(data.sales.byPaymentType).reduce((a, b) => a + b, 0) || 1;
                                    const pct = Math.round((value / total) * 100);
                                    return (
                                        <li key={type} className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                                <span className="font-semibold text-foreground">{PAYMENT_LABELS[type] || type}</span>
                                                <span className="font-bold tabular-nums text-foreground">
                                                    {num(value)} <span className="font-normal text-muted-foreground">({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </ChartCard>
                    </div>

                    {/* Top customers + suppliers */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <ChartCard title="أفضل العملاء" subtitle="الأعلى إنفاقًا خلال الفترة">
                            <ul className="flex flex-col divide-y divide-border/50">
                                {data.customers.topCustomers.map((c, i) => (
                                    <li key={c.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                                                {i + 1}
                                            </span>
                                            <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
                                        </div>
                                        <span className="shrink-0 font-display text-sm font-bold tabular-nums text-emerald-600">{num(c.totalSpent)}</span>
                                    </li>
                                ))}
                            </ul>
                        </ChartCard>

                        <ChartCard title="أفضل الموردين" subtitle="الأعلى تعاملًا وحجم مشتريات">
                            <ul className="flex flex-col divide-y divide-border/50">
                                {data.suppliers.topSuppliers.map((s, i) => (
                                    <li key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                                                {i + 1}
                                            </span>
                                            <span className="truncate text-sm font-semibold text-foreground">{s.name}</span>
                                        </div>
                                        <span className="shrink-0 font-display text-sm font-bold tabular-nums text-primary">{num(s.totalAmount)}</span>
                                    </li>
                                ))}
                            </ul>
                        </ChartCard>
                    </div>
                </>
            ) : null}
        </div>
    );
}