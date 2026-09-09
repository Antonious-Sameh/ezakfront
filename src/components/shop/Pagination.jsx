import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination: numbered pages + prev/next on desktop, simplified
 * "السابق / صفحة X من Y / التالي" on mobile.
 */
export default function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const go = (p) => onPageChange(Math.min(Math.max(1, p), totalPages));
    const pages = pageRange(page, totalPages);

    return (
        <nav aria-label="تصفح الصفحات" className="flex items-center justify-between gap-3 border-t border-border/60 pt-4 dir-rtl">
            {/* Mobile: simplified */}
            <div className="flex w-full items-center justify-between md:hidden">
                <button
                    type="button"
                    onClick={() => go(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-bold text-foreground shadow-2xs transition-all hover:border-primary/50 hover:bg-muted/50 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
                >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                    السابق
                </button>

                <div className="flex items-center gap-1 rounded-xl bg-muted/40 px-3 py-1.5 border border-border/40">
                    <span className="text-xs font-bold tabular-nums text-foreground">
                        صفحة {page} من {totalPages}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => go(page + 1)}
                    disabled={page >= totalPages}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-bold text-foreground shadow-2xs transition-all hover:border-primary/50 hover:bg-muted/50 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
                >
                    التالي
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
            </div>

            {/* Desktop: numbered */}
            <div className="hidden items-center justify-center w-full gap-1.5 md:flex">
                <button
                    type="button"
                    onClick={() => go(page - 1)}
                    disabled={page <= 1}
                    aria-label="الصفحة السابقة"
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-xs font-bold text-foreground shadow-2xs transition-all hover:border-primary/50 hover:bg-muted/50 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
                >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                    السابق
                </button>

                <div className="flex items-center gap-1 px-1">
                    {pages.map((p, i) =>
                        p === '…' ? (
                            <span key={`gap-${i}`} className="px-2 text-sm font-medium text-muted-foreground/60 select-none">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => go(p)}
                                aria-current={p === page ? 'page' : undefined}
                                className={`min-h-[38px] min-w-[38px] rounded-xl px-3 py-1.5 text-xs font-extrabold tabular-nums transition-all active:scale-[0.95] ${
                                    p === page
                                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-2 ring-primary/20 scale-105'
                                        : 'border border-border/80 bg-card text-foreground hover:border-primary/40 hover:bg-muted/40 shadow-2xs'
                                }`}
                            >
                                {p}
                            </button>
                        ),
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => go(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="الصفحة التالية"
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-xs font-bold text-foreground shadow-2xs transition-all hover:border-primary/50 hover:bg-muted/50 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
                >
                    التالي
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
            </div>
        </nav>
    );
}

function pageRange(current, total) {
    const delta = 1;
    const range = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);
    range.push(1);
    if (left > 2) range.push('…');
    for (let i = left; i <= right; i += 1) range.push(i);
    if (right < total - 1) range.push('…');
    if (total > 1) range.push(total);
    return range;
}