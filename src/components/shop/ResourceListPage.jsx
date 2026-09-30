import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Helmet } from '@/components/Head';
import { FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { ErrorState, EmptyState } from '@/components/StateViews';
import FilterBar from './FilterBar';
import Pagination from './Pagination';
import DetailModal from './DetailModal';
import { SECTION_CONFIGS } from './sectionConfigs';
import PrintInvoiceButton from '@/components/print/PrintInvoiceButton';
import ExportButton from './ExportButton';

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
    const {
        entity, title, subtitle, icon: Icon, searchPlaceholder, extraFilters, columns, renderDetail,
        rowDetail = true, rowAction, filters = { search: true, dates: true }, printKind,
    } = config;
    const rowsClickable = rowDetail && typeof renderDetail === 'function';

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [extras, setExtras] = useState(() =>
        Object.fromEntries(extraFilters.map((f) => [f.key, 'all'])),
    );

    // Any filter change goes back to page 1 IN THE SAME UPDATE. (It used to
    // be a separate effect, so every filter change fired two requests: one
    // for the old page number with the new filter, then one for page 1.)
    const changeFilter = (setter) => (value) => { setter(value); setPage(1); };

    // Filter options that come from the shop's own data (expense reasons).
    const needsReasons = extraFilters.some((f) => f.optionsSource === 'expenseReasons');
    const reasonsFetcher = useCallback(
        (signal) => (needsReasons ? api.getExpenseReasons(token, shopId, { signal }) : Promise.resolve(null)),
        [needsReasons, token, shopId],
    );
    const reasons = useApiQuery(reasonsFetcher, { key: needsReasons ? `reasons:${shopId}` : undefined, staleTime: 5 * 60_000 });
    const resolvedExtraFilters = useMemo(() => extraFilters
        .map((f) => {
            if (f.optionsSource !== 'expenseReasons') return f;
            const list = reasons.data?.supported === false ? [] : (reasons.data?.data || []);
            return list.length ? { ...f, options: [f.options[0], ...list.map((r) => ({ value: r, label: r }))] } : null;
        })
        .filter(Boolean), [extraFilters, reasons.data]);

    const params = useMemo(
        () => ({ page, limit: 20, search, from, to, extras }),
        [page, search, from, to, extras],
    );

    const listFetcher = useCallback(
        (signal) => api.getShopList(token, shopId, entity, params, { signal }),
        [token, shopId, entity, params],
    );
    // Cached per exact query (instant when you come back to it) and keeps
    // the current rows on screen while the next page / filter loads.
    const list = useApiQuery(listFetcher, {
        key: `list:${shopId}:${entity}:${JSON.stringify(params)}`,
        keepPrevious: true,
    });

    // Flipping pages from the pagination bar at the bottom: bring the top
    // of the list back into view, so the new rows are actually seen.
    const listTopRef = useRef(null);
    const goToPage = (next) => {
        setPage(next);
        listTopRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    };

    // Detail modal: opened straight from the row that was clicked. Every
    // list row already carries the full record (invoice lines included), so
    // there is nothing to wait for — no second request to System 5 or the
    // shop. (Before, every click re-fetched the item; for activity, cashbox
    // and expenses the shop has no such endpoint, so the click failed.)
    const [selectedRow, setSelectedRow] = useState(null);

    // A row can instead link to ANOTHER record (an activity entry → its
    // invoice). That one isn't on this page, so it is fetched on demand.
    const [linkedRef, setLinkedRef] = useState(null);
    const linkedFetcher = useCallback((signal) => {
        if (!linkedRef) return Promise.resolve(null);
        return api.getShopItem(token, shopId, linkedRef.entity, linkedRef.id, { signal }).then((res) => res.data);
    }, [token, shopId, linkedRef]);
    const linked = useApiQuery(linkedFetcher, {
        key: linkedRef ? `item:${shopId}:${linkedRef.entity}:${linkedRef.id}` : undefined,
        staleTime: 60_000,
    });
    const linkedConfig = linkedRef ? SECTION_CONFIGS[linkedRef.entity] : null;

    const pagination = list.data?.pagination;
    const rows = list.data?.data || [];
    const hasFilters = Boolean(search || from || to || Object.values(extras).some((v) => v && v !== 'all'));

    const resetFilters = () => {
        setSearch(''); setFrom(''); setTo('');
        setExtras(Object.fromEntries(extraFilters.map((f) => [f.key, 'all'])));
        setPage(1);
    };

    const openDetail = (row) => { if (rowsClickable) setSelectedRow(row); };
    const closeDetail = useCallback(() => setSelectedRow(null), []);
    const closeLinked = useCallback(() => setLinkedRef(null), []);
    const onRowKeyDown = (e, row) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDetail(row);
        }
    };
    const renderRowAction = (row) => {
        const action = rowAction?.(row);
        if (!action) return null;
        return (
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLinkedRef(action.ref); }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
            >
                <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                {action.label}
            </button>
        );
    };

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
                <div className="min-w-0 flex-1">
                    <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
                    <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
                </div>
                {/* Exports exactly what the filters below select — every page of it. */}
                <ExportButton shopId={shopId} entity={entity} title={title} filters={{ search, from, to, extras }} />
            </header>

            {summaryNode}

            <FilterBar
                search={search}
                onSearchChange={changeFilter(setSearch)}
                from={from}
                to={to}
                onDateChange={(key, val) => changeFilter(key === 'from' ? setFrom : setTo)(val)}
                extraFilters={resolvedExtraFilters}
                extras={extras}
                onExtraChange={(key, val) => changeFilter(setExtras)((prev) => ({ ...prev, [key]: val }))}
                onReset={resetFilters}
                showReset={hasFilters}
                showSearch={filters.search}
                showDates={filters.dates}
                searchPlaceholder={searchPlaceholder}
            />

            {/* Zero-height anchor: -mt-6 cancels the flex gap it would otherwise add. */}
            <div ref={listTopRef} className="relative -mt-6 h-0 scroll-mt-24" aria-hidden="true">
                {list.fetching && !list.loading ? (
                    <div data-testid="list-refreshing" className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-full">
                        <div className="h-full w-1/3 animate-[page-progress_1s_ease-in-out_infinite] rounded-full bg-accent" />
                    </div>
                ) : null}
            </div>

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
                <div
                    aria-busy={list.fetching}
                    className={`flex flex-col gap-6 transition-opacity duration-150 ${list.fetching ? 'opacity-60' : 'opacity-100'}`}
                >
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
                                    {rowAction ? <th className="px-4 py-3.5"><span className="sr-only">إجراء</span></th> : null}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        {...(rowsClickable ? {
                                            onClick: () => openDetail(row),
                                            onKeyDown: (e) => onRowKeyDown(e, row),
                                            tabIndex: 0,
                                            role: 'button',
                                            'aria-label': `عرض تفاصيل ${String(primaryText(row, columns))}`,
                                        } : {})}
                                        className={rowsClickable
                                            ? 'cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none active:bg-muted/70'
                                            : ''}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`${col.wrap ? 'min-w-[16rem]' : 'whitespace-nowrap'} px-4 py-3.5 ${col.align === 'end' ? 'text-end' : 'text-start'} ${col.numeric ? 'tabular-nums' : ''} ${col.primary ? 'font-semibold text-foreground' : 'text-foreground/80'}`}
                                            >
                                                {col.ltr ? <span dir="ltr">{col.render ? col.render(row[col.key], row) : row[col.key]}</span> : col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                                            </td>
                                        ))}
                                        {rowAction ? <td className="whitespace-nowrap px-4 py-2.5 text-end">{renderRowAction(row)}</td> : null}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="flex flex-col gap-3 md:hidden">
                        {rows.map((row) => {
                            const cardBody = (
                                <>
                                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                                        <span className="font-display text-sm font-bold text-foreground">
                                            {primaryValue(row, columns)}
                                        </span>
                                        {trailingValue(row, columns)}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                                        {mobileCols
                                            .filter((c) => c.key !== primaryKey(columns) && c.key !== trailingKey(columns))
                                            .map((col) => (
                                                <span key={col.key} className="inline-flex items-center gap-1">
                                                    {col.ltr ? <span dir="ltr">{renderCol(col, row)}</span> : renderCol(col, row)}
                                                </span>
                                            ))}
                                    </div>
                                </>
                            );
                            if (rowsClickable) {
                                return (
                                    <button
                                        key={row.id}
                                        type="button"
                                        onClick={() => openDetail(row)}
                                        className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card p-4 text-start shadow-xs transition-all hover:border-primary/40 active:scale-[0.98]"
                                    >
                                        {cardBody}
                                    </button>
                                );
                            }
                            const action = renderRowAction(row);
                            return (
                                <div
                                    key={row.id}
                                    data-testid="static-row-card"
                                    className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card p-4 text-start shadow-xs"
                                >
                                    {cardBody}
                                    {action ? <div className="flex justify-end pt-0.5">{action}</div> : null}
                                </div>
                            );
                        })}
                    </div>

                    <Pagination
                        page={pagination?.page || 1}
                        totalPages={pagination?.totalPages || 1}
                        onPageChange={goToPage}
                    />
                </div>
            )}

            {rowsClickable ? (
                <DetailModal
                    open={Boolean(selectedRow)}
                    onClose={closeDetail}
                    title={title}
                    actions={printKind && selectedRow ? (
                        <PrintInvoiceButton shopId={shopId} kind={printKind} invoice={selectedRow} />
                    ) : null}
                >
                    {selectedRow ? renderDetail(selectedRow) : null}
                </DetailModal>
            ) : null}

            {rowAction ? (
                <DetailModal
                    open={Boolean(linkedRef)}
                    onClose={closeLinked}
                    title={linkedConfig?.title || 'التفاصيل'}
                    loading={linked.loading}
                    error={linked.error?.message}
                    actions={linkedConfig?.printKind && linked.data ? (
                        <PrintInvoiceButton shopId={shopId} kind={linkedConfig.printKind} invoice={linked.data} />
                    ) : null}
                >
                    {linked.data && linkedConfig?.renderDetail ? linkedConfig.renderDetail(linked.data) : null}
                </DetailModal>
            ) : null}
        </div>
    );
}

function renderCol(col, row) {
    return col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—');
}
function primaryText(row, columns) {
    const col = columns.find((c) => c.primary) || columns[0];
    return row[col.key] ?? '';
}
function primaryKey(columns) {
    return (columns.find((c) => c.primary) || columns[0]).key;
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
    const raw = row[key];
    if (col.hideEmptyOnMobile && (raw === undefined || raw === null || raw === '' || Number(raw) === 0)) return null;
    const val = renderCol(col, row);
    return (
        <span className="font-display text-sm font-bold tabular-nums text-foreground">
            {col.mobileLabel ? <span className="me-1 text-[11px] font-medium text-muted-foreground">{col.mobileLabel}</span> : null}
            {val}
        </span>
    );
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