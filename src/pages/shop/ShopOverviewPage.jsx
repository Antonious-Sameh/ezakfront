import React, { useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Boxes, CalendarDays, Coins, Package, Receipt, TrendingUp, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { ErrorState } from '@/components/StateViews';
import { AR_LOCALE } from '@/lib/mockData';

const num = (v) => formatNumber(v, { locale: AR_LOCALE });

function StatCard({ icon: Icon, label, value, hint, tone }) {
	return (
		<div className="flex flex-col gap-2 bg-card p-4 sm:p-5">
			<span className={`grid h-8 w-8 place-items-center rounded-full ${tone || 'text-muted-foreground'}`}>
				<Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
			</span>
			<p className="text-xs font-semibold text-muted-foreground">{label}</p>
			<p className="font-display text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{value}</p>
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
				<h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">نظرة عامة</h1>
				<p className="text-xs text-muted-foreground">ملخص سريع لأداء المحل</p>
			</header>

			{loading ? (
				<div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-32 animate-pulse bg-card" />
					))}
				</div>
			) : error ? (
				<ErrorState title="مقدرناش نحمّل نظرة عامة" message={error.message} onRetry={refetch} />
			) : data ? (
				<>
					<div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-sm border border-border lg:grid-cols-4">
						
							<StatCard icon={Receipt} label="مبيعات اليوم" value={num(data.todaySales)} hint={`${num(data.todayOrders)} فاتورة`} />
						
						
							<StatCard icon={CalendarDays} label="مبيعات الشهر" value={num(data.monthSales)} />
						
						
							<StatCard icon={TrendingUp} label="ربح اليوم" value={num(data.todayProfit)} tone="text-emerald-700" />
						
						
							<StatCard icon={Coins} label="رصيد الكاشير" value={num(data.cashboxBalance)} tone={data.cashboxBalance < 0 ? 'text-destructive' : 'text-accent'} />
						
						
							<StatCard icon={Boxes} label="عدد المنتجات" value={num(data.productCount)} />
						
						
							<StatCard icon={AlertTriangle} label="منتجات ناقصة" value={num(data.lowStockCount)} tone="text-accent" />
						
						
							<StatCard icon={Users} label="عدد العملاء" value={num(data.customerCount)} />
						
					</div>

					{data.lowStockItems?.length ? (
						
							<section className="rounded-sm border border-border bg-card p-4 sm:p-5">
								<div className="mb-3 flex items-center justify-between gap-3">
									<div className="flex items-center gap-2">
										<Package className="h-5 w-5 text-accent" strokeWidth={1.5} />
										<h2 className="font-display text-base font-semibold text-foreground">تنبيهات المخزون</h2>
									</div>
									<Link
										to={`/shops/${shopId}/products`}
										className="text-xs font-semibold text-accent hover:underline"
									>
										عرض الكل
									</Link>
								</div>
								<ul className="divide-y divide-border">
									{data.lowStockItems.map((p) => (
										<li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
												<p className="text-[11px] text-muted-foreground">{[p.category, p.sku].filter(Boolean).join(' — ')}</p>
											</div>
											<span className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-semibold ${p.status === 'out' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
												{p.status === 'out' ? 'نفد' : `${num(p.stock)} ${p.unit}`.trim()}
											</span>
										</li>
									))}
								</ul>
							</section>
						
					) : null}
				</>
			) : null}
		</div>
	);
}
