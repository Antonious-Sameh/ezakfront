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
        <div className="flex flex-col gap-6 dir-rtl">
            <Helmet>
                <title>{`${title} — لوحة تحكم المحلات`}</title>
                <meta name="description" content={`${subtitle} — تابع ${title} للمحل مع بحث وفلترة وتقارير تفصيلية.`} />
            </Helmet>

            <header className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                    <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
                    <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
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
                    <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs md:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/80 bg-muted/40">
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`whitespace-nowrap px-4 py-3.5 text-xs font-bold text-muted-foreground ${col.align === 'end' ? 'text-end' : 'text-start'}`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => openDetail(row.id)}
                                        className="cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/70"
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`whitespace-nowrap px-4 py-3.5 ${col.align === 'end' ? 'text-end' : 'text-start'} ${col.numeric ? 'tabular-nums' : ''} ${col.primary ? 'font-semibold text-foreground' : 'text-foreground/80'}`}
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
                                className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card p-4 text-start shadow-xs transition-all hover:border-primary/40 active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                                    <span className="font-display text-sm font-bold text-foreground">
                                        {primaryValue(row, columns)}
                                    </span>
                                    {trailingValue(row, columns)}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
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
        <div className="space-y-3">
            {/* Desktop skeleton */}
            <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/80 bg-muted/40">
                            {columns.map((col) => (
                                <th key={col.key} className="px-4 py-3.5">
                                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {Array.from({ length: 6 }).map((_, r) => (
                            <tr key={r}>
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3.5">
                                        <div className="h-4 w-full max-w-28 animate-pulse rounded bg-muted/80" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile skeleton */}
            <div className="flex flex-col gap-3 md:hidden">
                {Array.from({ length: 4 }).map((_, r) => (
                    <div key={r} className="space-y-3 rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                        <div className="flex justify-between">
                            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                        </div>
                        <div className="h-3 w-28 animate-pulse rounded bg-muted/80" />
                    </div>
                ))}
            </div>
        </div>
    );
}