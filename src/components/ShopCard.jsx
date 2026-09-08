import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Package } from 'lucide-react';
import { formatNumber } from '@/lib/format';

const AR_LOCALE = 'ar-EG';

/**
 * One shop's row in the overview ledger. Deliberately a full-width row in a
 * bordered list (see OverviewPage.jsx), not a standalone rounded card with
 * its own shadow — reads as entries in one account statement rather than a
 * shelf of identical tiles.
 */
export default function ShopCard({ shop, index }) {
	const isOnline = shop.status === 'online';
	const hasLowStock = Number(shop.lowStockCount) > 0;

	return (
		<Link
			to={`/shops/${shop.id}`}
			className={`group flex flex-col gap-3 border-s-4 bg-card px-5 py-5 transition hover:bg-accent/[0.05] sm:flex-row sm:items-center sm:gap-6 sm:px-7 ${
				isOnline ? 'border-s-emerald-800/70' : 'border-s-muted-foreground/30'
			}`}
		>
			<div className="flex min-w-0 flex-1 items-center gap-4">
				<span className="hidden w-6 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground/60 sm:block">
					{formatNumber(index + 1, { locale: AR_LOCALE })}
				</span>
				<div className="min-w-0 leading-tight">
					<h3 className="truncate font-display text-lg font-semibold text-foreground">{shop.name}</h3>
					<p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
						<span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOnline ? 'bg-emerald-700' : 'bg-zinc-400'}`} aria-hidden="true" />
						{isOnline ? 'متصل' : 'غير متصل'}
					</p>
				</div>
			</div>

			<div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-10">
				{hasLowStock ? (
					<span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive">
						<Package className="h-3.5 w-3.5" strokeWidth={2} />
						{formatNumber(shop.lowStockCount, { locale: AR_LOCALE })} ناقص
					</span>
				) : (
					<span className="hidden shrink-0 text-xs font-semibold text-muted-foreground/50 sm:inline">المخزون كويس</span>
				)}

				<div className="text-end leading-tight">
					<p className="text-[11px] text-muted-foreground">مبيعات اليوم</p>
					<p className="mt-0.5 font-display text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
						{formatNumber(shop.todaySales, { locale: AR_LOCALE })}
					</p>
				</div>

				<ChevronLeft
					className="hidden h-5 w-5 shrink-0 text-muted-foreground/40 transition group-hover:-translate-x-0.5 group-hover:text-accent sm:block"
					strokeWidth={2}
				/>
			</div>
		</Link>
	);
}

export function ShopCardSkeleton() {
	return (
		<div className="flex flex-col gap-3 border-s-4 border-s-muted bg-card px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-7">
			<div className="flex flex-1 items-center gap-4">
				<div className="h-4 w-4 animate-pulse rounded bg-muted" />
				<div className="space-y-2">
					<div className="h-4 w-32 animate-pulse rounded bg-muted" />
					<div className="h-3 w-16 animate-pulse rounded bg-muted" />
				</div>
			</div>
			<div className="flex items-center gap-8">
				<div className="space-y-2 text-end">
					<div className="h-3 w-16 animate-pulse rounded bg-muted" />
					<div className="h-6 w-24 animate-pulse rounded bg-muted" />
				</div>
			</div>
		</div>
	);
}
