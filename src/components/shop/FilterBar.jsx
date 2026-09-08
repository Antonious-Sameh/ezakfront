import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Filter bar shared by every list section: search + date range (from/to)
 * + any section-specific selects passed via `extraFilters`.
 */
export default function FilterBar({
	search, onSearchChange,
	from, to, onDateChange,
	extraFilters = [], extras = {}, onExtraChange,
	onReset, showReset,
}) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" strokeWidth={2} />
					<input
						type="search"
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="ابحث…"
						aria-label="بحث"
						className="min-h-11 w-full rounded-md border border-input bg-background ps-9 pe-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
					/>
				</div>

				<div className="flex items-center gap-2">
					<label className="flex flex-col gap-1">
						<span className="text-[11px] font-semibold text-muted-foreground">من</span>
						<input
							type="date"
							value={from}
							onChange={(e) => onDateChange('from', e.target.value)}
							aria-label="من تاريخ"
							className="min-h-11 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
						/>
					</label>
					<label className="flex flex-col gap-1">
						<span className="text-[11px] font-semibold text-muted-foreground">إلى</span>
						<input
							type="date"
							value={to}
							onChange={(e) => onDateChange('to', e.target.value)}
							aria-label="إلى تاريخ"
							className="min-h-11 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
						/>
					</label>
				</div>
			</div>

			{extraFilters.length > 0 ? (
				<div className="flex flex-wrap items-center gap-2">
					{extraFilters.map((f) => (
						<label key={f.key} className="flex items-center gap-2">
							<span className="text-xs font-semibold text-muted-foreground">{f.label}</span>
							<select
								value={extras[f.key] || 'all'}
								onChange={(e) => onExtraChange(f.key, e.target.value)}
								aria-label={f.label}
								className="min-h-9 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
							>
								{f.options.map((o) => (
									<option key={o.value} value={o.value}>{o.label}</option>
								))}
							</select>
						</label>
					))}
				</div>
			) : null}

			{showReset ? (
				<button
					type="button"
					onClick={onReset}
					className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground active:scale-[0.98]"
				>
					<X className="h-3.5 w-3.5" strokeWidth={2} />
					مسح الفلاتر
				</button>
			) : null}
		</div>
	);
}
