import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Package, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '@/lib/format';

const AR_LOCALE = 'ar-EG';

/**
 * One shop's row in the overview ledger. Deliberately a full-width row in a
 * bordered list, not a standalone rounded card with its own shadow.
 */
export default function ShopCard({ shop, index }) {
    const isOnline = shop.status === 'online';
    const hasLowStock = Number(shop.lowStockCount) > 0;

    return (
        <Link
            to={`/shops/${shop.id}`}
            className={`group relative flex flex-col gap-4 border-s-4 bg-card px-5 py-4 transition-all duration-200 hover:bg-accent/[0.04] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 ${
                isOnline 
                    ? 'border-s-emerald-600 dark:border-s-emerald-500' 
                    : 'border-s-muted-foreground/30'
            }`}
        >
            {/* Left/Start Side: Index + Name + Status */}
            <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
                <span className="hidden w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground/60 sm:block">
                    {formatNumber(index + 1, { locale: AR_LOCALE })}
                </span>
                
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                            {shop.name}
                        </h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2 shrink-0">
                            {isOnline && (
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-muted-foreground/40'}`} />
                        </span>
                        <span className={`text-xs font-medium ${isOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            {isOnline ? 'متصل الآن' : 'غير متصل'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right/End Side: Stock Alert + Sales + Action */}
            <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-3 sm:justify-end sm:border-0 sm:pt-0">
                {/* Stock Status Badge */}
                {hasLowStock ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive dark:bg-destructive/20">
                        <Package className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        <span>{formatNumber(shop.lowStockCount, { locale: AR_LOCALE })} نواقص</span>
                    </span>
                ) : (
                    <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80 sm:inline-flex">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>المخزون مستقر</span>
                    </span>
                )}

                {/* Sales Figure */}
                <div className="text-end">
                    <span className="block text-[11px] font-medium text-muted-foreground">مبيعات اليوم</span>
                    <span className="font-display text-lg font-bold tabular-nums text-foreground sm:text-xl">
                        {formatNumber(shop.todaySales, { locale: AR_LOCALE })} <span className="text-xs font-normal text-muted-foreground">ج.م</span>
                    </span>
                </div>

                {/* Arrow Navigation Indicator */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-all group-hover:bg-primary/10 group-hover:text-primary">
                    <ChevronLeft
                        className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5"
                        strokeWidth={2}
                    />
                </div>
            </div>
        </Link>
    );
}

export function ShopCardSkeleton() {
    return (
        <div className="flex flex-col gap-4 border-s-4 border-s-muted bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
            <div className="flex items-center gap-4">
                <div className="hidden h-4 w-6 animate-pulse rounded bg-muted sm:block" />
                <div className="space-y-2">
                    <div className="h-5 w-36 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
            </div>
            <div className="flex items-center justify-between gap-6 border-t border-border/40 pt-3 sm:border-0 sm:pt-0">
                <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                <div className="space-y-1 text-end">
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            </div>
        </div>
    );
}