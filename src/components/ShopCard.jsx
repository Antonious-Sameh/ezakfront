import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Store } from 'lucide-react';
import { formatNumber } from '@/lib/format';

const AR_LOCALE = 'ar-EG';

/** One shop summary card on the overview page. Whole card links to the shop page. */
export default function ShopCard({ shop, index }) {
	const isOnline = shop.status === 'online';
	const hasLowStock = Number(shop.lowStockCount) > 0;

	return (
		<Link
			to={`/shops/${shop.id}`}
			className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-[inset_0_2px_10px_hsl(var(--primary)/0.05)] transition hover:border-primary/50 hover:shadow-[inset_0_2px_10px_hsl(var(--primary)/0.08)] active:scale-[0.98]"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					{shop.logoUrl ? (
						<img
							src={shop.logoUrl}
							alt={`لوجو ${shop.name}`}
							className="h-12 w-12 rounded-md border border-border object-cover"
							loading="lazy"
						/>
					) : (
						<span className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
							<Store className="h-6 w-6" strokeWidth={1.75} />
						</span>
					)}
					<div className="leading-tight">
						<p className="text-[11px] font-semibold text-muted-foreground">
							محل {formatNumber(index + 1, { locale: AR_LOCALE })}
						</p>
						<h3 className="font-display text-base font-bold text-foreground">{shop.name}</h3>
					</div>
				</div>
				<span className="flex shrink-0 items-center gap-1.5 pt-1 text-[11px] font-semibold text-muted-foreground">
					<span
						className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-zinc-400'}`}
						aria-hidden="true"
					/>
					{isOnline ? 'متصل' : 'غير متصل'}
				</span>
			</div>

			<div className="mt-5 flex-1">
				<p className="text-xs text-muted-foreground">مبيعات اليوم</p>
				<p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
					{formatNumber(shop.todaySales, { locale: AR_LOCALE })}
				</p>
			</div>

			{hasLowStock ? (
				<span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-sm bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent">
					<Package className="h-4 w-4" strokeWidth={2} />
					{formatNumber(shop.lowStockCount, { locale: AR_LOCALE })} منتجات ناقصة
				</span>
			) : (
				<span className="mt-4 inline-flex w-fit items-center rounded-sm bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
					المخزون كويس
				</span>
			)}
		</Link>
	);
}

export function ShopCardSkeleton() {
	return (
		<div className="flex h-full flex-col rounded-lg border border-border bg-card p-5">
			<div className="flex items-center gap-3">
				<div className="h-12 w-12 animate-pulse rounded-md bg-muted" />
				<div className="flex-1 space-y-2">
					<div className="h-3 w-16 animate-pulse rounded bg-muted" />
					<div className="h-4 w-28 animate-pulse rounded bg-muted" />
				</div>
			</div>
			<div className="mt-5 space-y-2">
				<div className="h-3 w-20 animate-pulse rounded bg-muted" />
				<div className="h-7 w-32 animate-pulse rounded bg-muted" />
			</div>
			<div className="mt-4 h-7 w-28 animate-pulse rounded-sm bg-muted" />
		</div>
	);
}
