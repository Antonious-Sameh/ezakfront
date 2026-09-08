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
		<div className="flex flex-col gap-2 bg-card p-4 sm:p-5">
			<span className={`grid h-8 w-8 place-items-center rounded-full ${tone || 'text-muted-foreground'}`}>
				<Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
			</span>
			<p className="text-xs font-semibold text-muted-foreground">{label}</p>
			<p className="font-display text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{value}</p>
			{sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
		</div>
	);
}

function ChartCard({ title, subtitle, children }) {
	return (
		<section className="rounded-sm border border-border bg-card p-4 sm:p-5">
			<div className="mb-4">
				<h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
				{subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
			</div>
			{children}
		</section>
	);
}

const tooltipStyle = {
	direction: 'rtl', textAlign: 'right',
	backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
	borderRadius: 'var(--radius)', fontSize: 13,
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
		<div className="flex flex-col gap-6">
			<Helmet>
				<title>التقارير — لوحة تحكم المحلات</title>
				<meta name="description" content="تقارير المبيعات والمشتريات والأرباح والمخزون وأفضل العملاء والموردين مع رسوم بيانية." />
			</Helmet>

			<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">التقارير</h1>
					<p className="text-xs text-muted-foreground">تقارير شاملة لأداء المحل</p>
				</div>
				<div className="flex rounded-sm border border-border bg-muted p-1" role="group" aria-label="اختيار الفترة">
					{PERIODS.map((p) => (
						<button
							key={p.id}
							type="button"
							onClick={() => setPeriod(p.id)}
							aria-pressed={period === p.id}
							className={`min-h-11 flex-1 rounded-sm px-4 py-2 text-sm font-semibold transition active:scale-[0.98] sm:flex-none ${
								period === p.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
							}`}
						>
							{p.label}
						</button>
					))}
				</div>
			</header>

			{loading ? (
				<div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-32 animate-pulse bg-card" />
					))}
				</div>
			) : error ? (
				<ErrorState title="مقدرناش نحمّل التقارير" message={error.message} onRetry={refetch} />
			) : data ? (
				<>
					{/* KPI cards */}
					<div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-sm border border-border lg:grid-cols-4">
						<StatCard icon={Receipt} label="إجمالي المبيعات" value={num(data.sales.totalSales)} sub={`${num(data.sales.count)} فاتورة`} />
						<StatCard icon={TrendingUp} label="صافي الربح" value={num(data.profit.totalProfit)} sub={`هامش ${num(data.profit.margin)}%`} tone="text-emerald-700" />
						<StatCard icon={ShoppingCart} label="إجمالي المشتريات" value={num(data.purchases.totalPurchases)} sub={`${num(data.purchases.count)} فاتورة`} />
						<StatCard icon={Boxes} label="قيمة المخزون" value={num(data.inventory.totalStockValue)} sub={`${num(data.inventory.totalProducts)} منتج`} />
					</div>

					{/* Sales trend */}
					
						<ChartCard title="تطور المبيعات" subtitle="المبيعات اليومية خلال الفترة">
							<div dir="ltr" className="h-64 w-full sm:h-72">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={data.sales.byDay} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
										<defs>
											<linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
												<stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
										<XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
										<YAxis tickFormatter={compact} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
										<Tooltip formatter={(v) => num(v)} contentStyle={tooltipStyle} />
										<Area type="monotone" dataKey="value" name="المبيعات" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#salesGrad)" />
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</ChartCard>
					

					{/* Profit trend */}
					
						<ChartCard title="المبيعات والتكلفة والربح" subtitle="مقارنة يومية">
							<div dir="ltr" className="h-64 w-full sm:h-72">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data.profit.byDay} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={2}>
										<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
										<XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
										<YAxis tickFormatter={compact} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
										<Tooltip formatter={(v) => num(v)} contentStyle={tooltipStyle} />
										<Bar dataKey="sales" name="المبيعات" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} maxBarSize={28} />
										<Bar dataKey="cost" name="التكلفة" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} maxBarSize={28} />
										<Bar dataKey="profit" name="الربح" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={28} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</ChartCard>
					

					{/* Top products + payment split */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						
							<ChartCard title="أكثر المنتجات مبيعًا" subtitle="الكمية المباعة">
								<ul className="flex flex-col gap-3">
									{data.sales.topProducts.map((p, i) => (
										<li key={p.name} className="flex items-center gap-3">
											<span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-muted text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
											<span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{p.name}</span>
											<span className="shrink-0 text-sm font-semibold tabular-nums text-accent">{num(p.qty)}</span>
										</li>
									))}
								</ul>
							</ChartCard>
						
						
							<ChartCard title="المبيعات حسب طريقة الدفع" subtitle="توزيع الإجمالي">
								<ul className="flex flex-col gap-3">
									{Object.entries(data.sales.byPaymentType).map(([type, value]) => {
										const total = Object.values(data.sales.byPaymentType).reduce((a, b) => a + b, 0) || 1;
										const pct = Math.round((value / total) * 100);
										return (
											<li key={type}>
												<div className="mb-1 flex items-center justify-between text-sm">
													<span className="font-semibold text-foreground">{PAYMENT_LABELS[type] || type}</span>
													<span className="font-semibold tabular-nums text-foreground">{num(value)} <span className="text-muted-foreground">({pct}%)</span></span>
												</div>
												<div className="h-2 overflow-hidden rounded-full bg-muted">
													<div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
												</div>
											</li>
										);
									})}
								</ul>
							</ChartCard>
						
					</div>

					{/* Top customers + suppliers */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						
							<ChartCard title="أفضل العملاء" subtitle="الأعلى إنفاقًا">
								<ul className="flex flex-col gap-3">
									{data.customers.topCustomers.map((c, i) => (
										<li key={c.id} className="flex items-center gap-3">
											<span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-muted text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
											<span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{c.name}</span>
											<span className="shrink-0 text-sm font-semibold tabular-nums text-accent">{num(c.totalSpent)}</span>
										</li>
									))}
								</ul>
							</ChartCard>
						
						
							<ChartCard title="أفضل الموردين" subtitle="الأعلى تعاملًا">
								<ul className="flex flex-col gap-3">
									{data.suppliers.topSuppliers.map((s, i) => (
										<li key={s.id} className="flex items-center gap-3">
											<span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-muted text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
											<span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{s.name}</span>
											<span className="shrink-0 text-sm font-semibold tabular-nums text-accent">{num(s.totalAmount)}</span>
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
