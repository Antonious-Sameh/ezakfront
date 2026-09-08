import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Inbox } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { ErrorState, EmptyState } from '@/components/StateViews';
import FilterBar from './FilterBar';
import Pagination from './Pagination';
import DetailModal from './DetailModal';

/**
 * One reusable component for every shop list section (sales, purchases,
 * products, customers, suppliers, expenses, cashbox, activity). Driven by
 * a SECTION_CONFIGS entry — no per-section duplication.
 *
 * Props:
 *  - shopId
 *  - config: a SECTION_CONFIGS entry
 *  - summaryNode: optional React node rendered above the list (cashbox/expenses summaries)
 */
export default function ResourceListPage({ shopId, config, summaryNode }) {
	const { token } = useAuth();
	const { entity, title, subtitle, icon: Icon, searchPlaceholder, extraFilters, columns, renderDetail } = config;

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [extras, setExtras] = useState(() =>
		Object.fromEntries(extraFilters.map((f) => [f.key, 'all'])),
	);

	// Reset to first page whenever any filter changes.
	useEffect(() => { setPage(1); }, [search, from, to, extras]);

	const params = useMemo(
		() => ({ page, limit: 20, search, from, to, extras }),
		[page, search, from, to, extras],
	);

	const listFetcher = useCallback(
		() => api.getShopList(token, shopId, entity, params).then((res) => res),
		[token, shopId, entity, params],
	);
	const list = useApiQuery(listFetcher);

	// Detail modal state + fetcher.
	const [selectedId, setSelectedId] = useState(null);
	// Stable fetcher identity even while selectedId is null — the previous
	// version passed a brand-new inline `() => Promise.resolve(null)` on
	// every render whenever no row was selected, which useApiQuery's effect
	// treats as "the fetcher changed" and re-runs on every single render:
	// a continuous render loop that got worse the longer a shop section
	// stayed mounted (this is the "page hangs" bug — everything else
	// competing with a runaway effect on every render).
	const detailFetcher = useCallback(() => {
		if (!selectedId) return Promise.resolve(null);
		return api.getShopItem(token, shopId, entity, selectedId).then((res) => res.data);
	}, [token, shopId, entity, selectedId]);
	const detail = useApiQuery(detailFetcher);

	const pagination = list.data?.pagination;
	const rows = list.data?.data || [];
	const hasFilters = Boolean(search || from || to || Object.values(extras).some((v) => v && v !== 'all'));

	const resetFilters = () => {
		setSearch(''); setFrom(''); setTo('');
		setExtras(Object.fromEntries(extraFilters.map((f) => [f.key, 'all'])));
	};

	const openDetail = (id) => setSelectedId(id);
	const closeDetail = () => setSelectedId(null);

	const mobileCols = columns.filter((c) => c.mobile);

	return (
		<div className="flex flex-col gap-5">
			<Helmet>
				<title>{`${title} — لوحة تحكم المحلات`}</title>
				<meta name="description" content={`${subtitle} — تابع ${title} للمحل مع بحث وفلترة وتقارير تفصيلية.`} />
			</Helmet>

			<header className="flex items-center gap-3">
				<span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
					<Icon className="h-5 w-5" strokeWidth={1.75} />
				</span>
				<div>
					<h1 className="font-display text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
					<p className="text-xs text-muted-foreground">{subtitle}</p>
				</div>
			</header>

			{summaryNode}

			<FilterBar
				search={search}
				onSearchChange={setSearch}
				from={from}
				to={to}
				onDateChange={(key, val) => (key === 'from' ? setFrom(val) : setTo(val))}
				extraFilters={extraFilters}
				extras={extras}
				onExtraChange={(key, val) => setExtras((prev) => ({ ...prev, [key]: val }))}
				onReset={resetFilters}
				showReset={hasFilters}
			/>
			{searchPlaceholder ? <span className="sr-only">{searchPlaceholder}</span> : null}

			{list.loading ? (
				<ListSkeleton columns={columns} />
			) : list.error ? (
				<ErrorState title={`مقدرناش نحمّل ${title}`} message={list.error.message} onRetry={list.refetch} />
			) : !rows.length ? (
				<EmptyState
					icon={Icon}
					title={hasFilters ? 'مفيش نتائج مطابقة' : 'مفيش بيانات لسه'}
					message={hasFilters ? 'جرّب تغيّر الفلاتر أو امسحها وابحث من جديد.' : `لما تتضاف ${title} هتظهر هنا.`}
				/>
			) : (
				<>
					{/* Desktop table */}
					<div className="hidden overflow-hidden rounded-sm border border-border bg-card md:block">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border">
									{columns.map((col) => (
										<th
											key={col.key}
											className={`whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground ${col.align === 'end' ? 'text-end' : 'text-start'}`}
										>
											{col.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{rows.map((row) => (
									<tr
										key={row.id}
										onClick={() => openDetail(row.id)}
										className="cursor-pointer transition hover:bg-muted/60 active:scale-[0.995]"
									>
										{columns.map((col) => (
											<td
												key={col.key}
												className={`whitespace-nowrap px-4 py-3 ${col.align === 'end' ? 'text-end' : 'text-start'} ${col.numeric ? 'tabular-nums' : ''} ${col.primary ? 'font-semibold text-foreground' : 'text-foreground/90'}`}
											>
												{col.ltr ? <span dir="ltr">{col.render ? col.render(row[col.key], row) : row[col.key]}</span> : col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Mobile cards */}
					<div className="flex flex-col gap-3 md:hidden">
						{rows.map((row) => (
							<button
								key={row.id}
								type="button"
								onClick={() => openDetail(row.id)}
								className="flex flex-col gap-2 rounded-sm border border-border bg-card p-4 text-start transition hover:border-accent/50 active:scale-[0.99]"
							>
								<div className="flex items-center justify-between gap-2">
									<span className="font-display text-sm font-bold text-foreground">
										{primaryValue(row, columns)}
									</span>
									{trailingValue(row, columns)}
								</div>
								<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
									{mobileCols
										.filter((c) => !c.primary && c.key !== trailingKey(columns))
										.map((col) => (
											<span key={col.key} className="inline-flex items-center gap-1">
												{col.ltr ? <span dir="ltr">{renderCol(col, row)}</span> : renderCol(col, row)}
											</span>
										))}
								</div>
							</button>
						))}
					</div>

					<Pagination
						page={pagination?.page || 1}
						totalPages={pagination?.totalPages || 1}
						onPageChange={setPage}
					/>
				</>
			)}

			<DetailModal
				open={Boolean(selectedId)}
				onClose={closeDetail}
				title={title}
				loading={detail.loading}
				error={detail.error?.message}
			>
				{detail.data ? renderDetail(detail.data) : null}
			</DetailModal>
		</div>
	);
}

function renderCol(col, row) {
	return col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—');
}
function primaryValue(row, columns) {
	const col = columns.find((c) => c.primary) || columns[0];
	return renderCol(col, row);
}
function trailingKey(columns) {
	// pick the last numeric/end-aligned mobile column as the trailing value
	const mobile = columns.filter((c) => c.mobile);
	for (let i = mobile.length - 1; i >= 0; i -= 1) {
		if (mobile[i].align === 'end' || mobile[i].numeric) return mobile[i].key;
	}
	return null;
}
function trailingValue(row, columns) {
	const key = trailingKey(columns);
	if (!key) return null;
	const col = columns.find((c) => c.key === key);
	const val = renderCol(col, row);
	return <span className="font-display text-sm font-bold tabular-nums text-foreground">{val}</span>;
}

function ListSkeleton({ columns }) {
	return (
		<div className="hidden overflow-hidden rounded-sm border border-border bg-card md:block">
			<table className="w-full text-sm">
				<tbody className="divide-y divide-border">
					{Array.from({ length: 6 }).map((_, r) => (
						<tr key={r}>
							{columns.map((col) => (
								<td key={col.key} className="px-4 py-3.5">
									<div className="h-4 w-full max-w-32 animate-pulse rounded bg-muted" />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			{/* mobile skeleton */}
			<div className="flex flex-col gap-3 p-3 md:hidden">
				{Array.from({ length: 4 }).map((_, r) => (
					<div key={r} className="space-y-2 rounded-lg border border-border p-4">
						<div className="h-4 w-40 animate-pulse rounded bg-muted" />
						<div className="h-3 w-28 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		</div>
	);
}
