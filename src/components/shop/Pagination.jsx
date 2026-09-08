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
		<nav aria-label="تصفح الصفحات" className="flex items-center justify-between gap-3 border-t border-border pt-4">
			{/* Mobile: simplified */}
			<div className="flex w-full items-center justify-between md:hidden">
				<button
					type="button"
					onClick={() => go(page - 1)}
					disabled={page <= 1}
					className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 active:scale-[0.98] disabled:opacity-40"
				>
					<ChevronRight className="h-4 w-4" strokeWidth={2} />
					السابق
				</button>
				<span className="text-sm font-semibold tabular-nums text-muted-foreground">
					صفحة {page} من {totalPages}
				</span>
				<button
					type="button"
					onClick={() => go(page + 1)}
					disabled={page >= totalPages}
					className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 active:scale-[0.98] disabled:opacity-40"
				>
					التالي
					<ChevronLeft className="h-4 w-4" strokeWidth={2} />
				</button>
			</div>

			{/* Desktop: numbered */}
			<div className="hidden items-center gap-1 md:flex">
				<button
					type="button"
					onClick={() => go(page - 1)}
					disabled={page <= 1}
					aria-label="الصفحة السابقة"
					className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary/40 active:scale-[0.98] disabled:opacity-40"
				>
					<ChevronRight className="h-4 w-4" strokeWidth={2} />
					السابق
				</button>
				{pages.map((p, i) =>
					p === '…' ? (
						<span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
					) : (
						<button
							key={p}
							type="button"
							onClick={() => go(p)}
							aria-current={p === page ? 'page' : undefined}
							className={`min-h-9 min-w-9 rounded-md px-3 py-1.5 text-sm font-semibold tabular-nums transition active:scale-[0.98] ${
								p === page
									? 'bg-primary text-primary-foreground'
									: 'border border-border bg-card text-foreground hover:border-primary/40'
							}`}
						>
							{p}
						</button>
					),
				)}
				<button
					type="button"
					onClick={() => go(page + 1)}
					disabled={page >= totalPages}
					aria-label="الصفحة التالية"
					className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary/40 active:scale-[0.98] disabled:opacity-40"
				>
					التالي
					<ChevronLeft className="h-4 w-4" strokeWidth={2} />
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
