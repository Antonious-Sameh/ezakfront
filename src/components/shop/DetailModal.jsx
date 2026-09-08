import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Generic detail modal. Renders the section's `renderDetail(item)` body.
 * Closes on backdrop click, the X button, or Escape.
 */
export default function DetailModal({ open, onClose, title, loading, error, children }) {
	useEffect(() => {
		if (!open) return undefined;
		const onKey = (e) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('keydown', onKey);
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = '';
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
			role="dialog"
			aria-modal="true"
			onClick={onClose}
		>
			<div
				className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-border bg-card shadow-2xl sm:rounded-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
					<h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="إغلاق"
						className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground active:scale-[0.98]"
					>
						<X className="h-4 w-4" strokeWidth={2} />
					</button>
				</div>
				<div className="overflow-y-auto px-5 py-5">
					{loading ? (
						<div className="space-y-4">
							<div className="h-7 w-48 animate-pulse rounded bg-muted" />
							<div className="grid grid-cols-2 gap-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="space-y-2">
										<div className="h-3 w-20 animate-pulse rounded bg-muted" />
										<div className="h-4 w-32 animate-pulse rounded bg-muted" />
									</div>
								))}
							</div>
						</div>
					) : error ? (
						<p className="py-8 text-center text-sm font-semibold text-destructive">{error}</p>
					) : (
						children
					)}
				</div>
			</div>
		</div>
	);
}
