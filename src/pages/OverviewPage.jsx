import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { format, subDays } from 'date-fns';
import { Store } from 'lucide-react';
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

function getPeriodRange(periodId) {
	const to = new Date();
	const from = periodId === 'today' ? to : subDays(to, periodId === 'week' ? 6 : 29);
	return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}

function PeriodFilter({ value, onChange }) {
	return (
		<div className="flex rounded-md border border-border bg-muted p-1" role="group" aria-label="اختيار الفترة">
			{PERIODS.map((period) => (
				<button
					key={period.id}
					type="button"
					onClick={() => onChange(period.id)}
					aria-pressed={value === period.id}
					className={`min-h-11 flex-1 rounded-sm px-4 py-2 text-sm font-semibold transition active:scale-[0.98] sm:flex-none ${
						value === period.id
							? 'bg-primary text-primary-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					{period.label}
				</button>
			))}
		</div>
	);
}

export default function OverviewPage() {
	const { token } = useAuth();
	const [period, setPeriod] = useState('today');
	const range = useMemo(() => getPeriodRange(period), [period]);
	const periodLabel = PERIODS.find((p) => p.id === period)?.label;

	const shopsFetcher = useCallback(() => api.getShops(token).then((res) => res.data), [token]);
	const compareFetcher = useCallback(
		() => api.getCompareReport(token, range.from, range.to).then((res) => res.data),
		[token, range],
	);

	const shops = useApiQuery(shopsFetcher);
	const compare = useApiQuery(compareFetcher);

	return (
		<div className="flex flex-col gap-8">
			<Helmet>
				<title>الرئيسية — لوحة تحكم المحلات</title>
				<meta name="description" content="نظرة عامة على مبيعات وأرباح محلاتك الأربعة: مبيعات اليوم، حالة كل محل، وتنبيهات المخزون الناقص." />
			</Helmet>

			{/* Hero: total sales across the four shops, ledger-header style */}
			
				<section className="relative overflow-hidden rounded-sm border border-primary/20 bg-primary px-5 py-8 text-primary-foreground sm:px-8 sm:py-10">
					<span
						aria-hidden="true"
						className="pointer-events-none absolute -top-6 -start-4 select-none font-display text-[24vw] font-semibold leading-none text-primary-foreground/[0.06] sm:text-[9rem]"
					>
						المحلات
					</span>
					<div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="text-xs font-semibold text-primary-foreground/60">نظرة عامة — {periodLabel}</p>
							{compare.loading ? (
								<div className="mt-3 space-y-3">
									<div className="h-12 w-56 max-w-full animate-pulse rounded-sm bg-primary-foreground/10" />
								</div>
							) : compare.error ? (
								<p className="mt-3 text-sm text-primary-foreground/70">تعذر تحميل الإجمالي — جرّب إعادة المحاولة تحت.</p>
							) : (
								<>
									<p className="mt-2 text-sm text-primary-foreground/60">إجمالي مبيعات الأربعة محلات</p>
									<p className="mt-1 font-display text-4xl font-semibold tabular-nums text-accent sm:text-5xl">
										{formatNumber(compare.data?.totalSales, { locale: AR_LOCALE })}
									</p>
								</>
							)}
						</div>

						{!compare.loading && !compare.error ? (
							<div className="border-t border-primary-foreground/10 pt-4 sm:border-t-0 sm:border-s sm:pe-8 sm:pt-0 sm:ps-8">
								<p className="text-xs font-semibold text-primary-foreground/60">صافي الربح</p>
								<p className="mt-1 font-display text-2xl font-semibold tabular-nums text-primary-foreground sm:text-3xl">
									{formatNumber(compare.data?.totalProfit, { locale: AR_LOCALE })}
								</p>
							</div>
						) : null}
					</div>
				</section>
			

			{/* Shop ledger */}
			<section aria-label="المحلات">
				
					<div className="mb-4 flex items-end justify-between gap-3">
						<div>
							<h2 className="font-display text-lg font-semibold text-foreground">المحلات</h2>
							<p className="text-xs text-muted-foreground">اضغط على أي محل لعرض تفاصيله</p>
						</div>
						{shops.data ? (
							<span className="text-xs font-semibold tabular-nums text-muted-foreground">
								{formatNumber(shops.data.length, { locale: AR_LOCALE })} محلات
							</span>
						) : null}
					</div>
				

				{shops.loading ? (
					<div className="divide-y divide-border overflow-hidden rounded-sm border border-border">
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
					
						<div className="divide-y divide-border overflow-hidden rounded-sm border border-border">
							{shops.data.map((shop, index) => (
								<ShopCard key={shop.id} shop={shop} index={index} />
							))}
						</div>
					
				)}
			</section>

			{/* Comparison chart */}
			
				<section
					aria-label="مقارنة المبيعات"
					className="rounded-sm border border-border bg-card p-5 sm:p-6"
				>
					<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="font-display text-lg font-semibold text-foreground">مقارنة المحلات</h2>
							<p className="text-xs text-muted-foreground">المبيعات والربح لكل محل في الفترة المختارة</p>
						</div>
						<PeriodFilter value={period} onChange={setPeriod} />
					</div>

					{compare.loading ? (
						<div className="flex h-72 items-end justify-around gap-4 px-4 sm:h-80">
							{[55, 80, 40, 65].map((h, i) => (
								<div
									key={i}
									className="w-full max-w-16 animate-pulse rounded-t-md bg-muted"
									style={{ height: `${h}%` }}
								/>
							))}
						</div>
					) : compare.error ? (
						<ErrorState
							title="مقدرناش نحمّل المقارنة"
							message={compare.error.message}
							onRetry={compare.refetch}
						/>
					) : !compare.data?.byShop?.length ? (
						<EmptyState title="مفيش مبيعات في الفترة دي" message="جرّب فترة تانية من الفلتر فوق." />
					) : (
						<SalesCompareChart data={compare.data.byShop} />
					)}
				</section>
			
		</div>
	);
}
