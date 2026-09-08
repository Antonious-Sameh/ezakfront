import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { format, subDays } from 'date-fns';
import { Store } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import Reveal from '@/components/Reveal';
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

			{/* Hero: total sales across the four shops */}
			<Reveal>
				<section className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary px-5 py-8 text-primary-foreground sm:px-8 sm:py-10">
					<span
						aria-hidden="true"
						className="pointer-events-none absolute -top-8 -start-4 select-none font-display text-[26vw] font-extrabold leading-none text-primary-foreground/10 sm:text-[10rem]"
					>
						المحلات
					</span>
					<div className="relative">
						<p className="text-xs font-semibold text-primary-foreground/70">نظرة عامة — {periodLabel}</p>
						{compare.loading ? (
							<div className="mt-3 space-y-3">
								<div className="h-12 w-56 max-w-full animate-pulse rounded-md bg-primary-foreground/15" />
								<div className="h-4 w-40 animate-pulse rounded bg-primary-foreground/15" />
							</div>
						) : compare.error ? (
							<p className="mt-3 text-sm text-primary-foreground/80">تعذر تحميل الإجمالي — جرّب إعادة المحاولة تحت.</p>
						) : (
							<>
								<p className="mt-2 font-display text-4xl font-extrabold tabular-nums sm:text-5xl">
									{formatNumber(compare.data?.totalSales, { locale: AR_LOCALE })}
								</p>
								<p className="mt-2 text-sm text-primary-foreground/80">
									إجمالي مبيعات الأربعة محلات
									<span className="mx-2 text-primary-foreground/40">•</span>
									الربح: <span className="font-bold tabular-nums">{formatNumber(compare.data?.totalProfit, { locale: AR_LOCALE })}</span>
								</p>
							</>
						)}
					</div>
				</section>
			</Reveal>

			{/* Shop cards */}
			<section aria-label="المحلات">
				<Reveal delay={0.05}>
					<div className="mb-4 flex items-end justify-between gap-3">
						<div>
							<h2 className="font-display text-lg font-bold text-foreground">المحلات</h2>
							<p className="text-xs text-muted-foreground">اضغط على أي محل لعرض تفاصيله</p>
						</div>
						{shops.data ? (
							<span className="text-xs font-semibold tabular-nums text-muted-foreground">
								{formatNumber(shops.data.length, { locale: AR_LOCALE })} محلات
							</span>
						) : null}
					</div>
				</Reveal>

				{shops.loading ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{shops.data.map((shop, index) => (
							<Reveal key={shop.id} delay={0.05 + index * 0.07} className={index % 2 === 1 ? 'xl:mt-8' : ''}>
								<ShopCard shop={shop} index={index} />
							</Reveal>
						))}
					</div>
				)}
			</section>

			{/* Comparison chart */}
			<Reveal delay={0.1}>
				<section
					aria-label="مقارنة المبيعات"
					className="rounded-lg border border-border bg-card p-5 shadow-[inset_0_2px_10px_hsl(var(--primary)/0.05)] sm:p-6"
				>
					<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="font-display text-lg font-bold text-foreground">مقارنة المحلات</h2>
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
			</Reveal>
		</div>
	);
}
