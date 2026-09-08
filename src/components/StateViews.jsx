import React from 'react';
import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react';

/** Friendly error block with a retry action — used whenever an API call fails. */
export function ErrorState({ title = 'حصل خطأ', message, onRetry, className = '' }) {
	return (
		<div
			role="alert"
			className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center ${className}`}
		>
			<span className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
				<AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
			</span>
			<p className="font-display font-bold text-foreground">{title}</p>
			{message ? <p className="max-w-sm text-sm text-muted-foreground">{message}</p> : null}
			{onRetry ? (
				<button
					type="button"
					onClick={onRetry}
					className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
				>
					<RotateCcw className="h-4 w-4" strokeWidth={2} />
					إعادة المحاولة
				</button>
			) : null}
		</div>
	);
}

/** Friendly empty block — used when the API returns no data. */
export function EmptyState({ icon: Icon = Inbox, title, message, className = '' }) {
	return (
		<div
			className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center ${className}`}
		>
			<span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
				<Icon className="h-6 w-6" strokeWidth={1.75} />
			</span>
			<p className="font-display font-bold text-foreground">{title}</p>
			{message ? <p className="max-w-sm text-sm text-muted-foreground">{message}</p> : null}
		</div>
	);
}
