import React, { useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Boxes, CalendarDays, Coins, Package, Receipt, TrendingUp, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import Reveal from '@/components/Reveal';
import { ErrorState } from '@/components/StateViews';
import { AR_LOCALE } from '@/lib/mockData';

const num = (v) => formatNumber(v, { locale: AR_LOCALE });

function StatCard({ icon: Icon, label, value, hint, accent }) {
	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-[inset_0_2px_10px_hsl(var(--primary)/0.05)] sm:p-5">
			<span className={`grid h-9 w-9 place-items-center rounded-md ${accent || 'bg-primary/10 text-primary'}`}>
				<Icon className="h-5 w-5" strokeWidth={1.75} />
			</span>
			<p className="text-xs font-semibold text-muted-foreground">{label}</p>
			<p className="font-display text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl">{value}</p>
			{hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
		</div>
	);
}

export default function ShopOverviewPage() {
	const { token } = useAuth();
	const { shopId } = useParams();
	const fetcher = useCallback(() => api.getShopOverview(token, shopId).then((res) => res.data), [token, shopId]);
	const { data, loading, error, refetch } = useApiQuery(fetcher);

	return (
		<div className="flex flex-col gap-6">
			<Helmet>
				<title>نظرة عامة على المحل — لوحة تحكم المحلات</title>
				<meta name="description" content="ملخص سريع للمحل: مبيعات اليوم والشهر، عدد المنتجات، تنبيهات المخزون، ورصيد الكاشير." />
			</Helmet>

			<header className="flex flex-col gap-1">
				<h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">نظرة عامة</h1>
				<p className="text-xs text-muted-foreground">ملخص سريع لأداء المحل</p>
			</header>

			{loading ? (
				<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-card" />
					))}
				</div>
			) : error ? (
				<ErrorState title="مقدرناش نحمّل نظرة عامة" message={error.message} onRetry={refetch} />
			) : data ? (
				<>
					<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
						<Reveal delay={0.02}>
							<StatCard icon={Receipt} label="مبيعات اليوم" value={num(data.todaySales)} hint={`${num(data.todayOrders)} فاتورة`} />
						</Reveal>
						<Reveal delay={0.06}>
							<StatCard icon={CalendarDays} label="مبيعات الشهر" value={num(data.monthSales)} />
						</Reveal>
						<Reveal delay={0.1}>
							<StatCard icon={TrendingUp} label="ربح اليوم" value={num(data.todayProfit)} accent="bg-emerald-600/10 text-emerald-700" />
						</Reveal>
						<Reveal delay={0.14}>
							<StatCard icon={Coins} label="رصيد الكاشير" value={num(data.cashboxBalance)} accent={data.cashboxBalance < 0 ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'} />
						</Reveal>
						<Reveal delay={0.18}>
							<StatCard icon={Boxes} label="عدد المنتجات" value={num(data.productCount)} />
						</Reveal>
						<Reveal delay={0.22}>
							<StatCard icon={AlertTriangle} label="منتجات ناقصة" value={num(data.lowStockCount)} accent="bg-accent/10 text-accent" />
						</Reveal>
						<Reveal delay={0.26}>
							<StatCard icon={Users} label="عدد العملاء" value={num(data.customerCount)} />
						</Reveal>
					</div>

					{data.lowStockItems?.length ? (
						<Reveal delay={0.1}>
							<section className="rounded-lg border border-border bg-card p-4 shadow-[inset_0_2px_10px_hsl(var(--primary)/0.05)] sm:p-5">
								<div className="mb-3 flex items-center justify-between gap-3">
									<div className="flex items-center gap-2">
										<Package className="h-5 w-5 text-accent" strokeWidth={1.75} />
										<h2 className="font-display text-base font-bold text-foreground">تنبيهات المخزون</h2>
									</div>
									<Link
										to={`/shops/${shopId}/products`}
										className="text-xs font-semibold text-primary hover:underline"
									>
										عرض الكل
									</Link>
								</div>
								<ul className="divide-y divide-border">
									{data.lowStockItems.map((p) => (
										<li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
												<p className="text-[11px] text-muted-foreground">{p.category} • {p.sku}</p>
											</div>
											<span className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-semibold ${p.status === 'out' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
												{p.status === 'out' ? 'نفد' : `${num(p.stock)} ${p.unit}`}
											</span>
										</li>
									))}
								</ul>
							</section>
						</Reveal>
					) : null}
				</>
			) : null}
		</div>
	);
}
