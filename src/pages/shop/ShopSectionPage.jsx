import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import ResourceListPage from '@/components/shop/ResourceListPage';
import { SECTION_CONFIGS } from '@/components/shop/sectionConfigs';
import { AR_LOCALE } from '@/lib/mockData';

const num = (v) => formatNumber(v, { locale: AR_LOCALE });

/** Small summary band shown above the cashbox / expenses lists. */
function SummaryBand({ shopId, kind }) {
	const { token } = useAuth();
	const fetcher = useCallback(() => {
		const params = {};
		return kind === 'cashbox'
			? api.getCashboxSummary(token, shopId, params).then((res) => res.data)
			: api.getExpensesSummary(token, shopId, params).then((res) => res.data);
	}, [token, shopId, kind]);
	const { data, loading } = useApiQuery(fetcher);

	if (loading || !data) {
		return <div className="h-20 animate-pulse rounded-lg border border-border bg-card" />;
	}

	if (kind === 'cashbox') {
		return (
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<SummaryItem label="إجمالي داخل" value={num(data.totalIn)} tone="emerald" />
				<SummaryItem label="إجمالي خارج" value={num(data.totalOut)} tone="destructive" />
				<SummaryItem label="الرصيد الحالي" value={num(data.balance)} tone={data.balance < 0 ? 'destructive' : 'primary'} />
				<SummaryItem label="داخل اليوم" value={num(data.todayIn)} tone="emerald" />
			</div>
		);
	}
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<SummaryItem label="إجمالي المصروفات" value={num(data.total)} tone="destructive" />
			<SummaryItem label="مصروفات الشهر" value={num(data.thisMonth)} tone="accent" />
			<SummaryItem label="عدد التصنيفات" value={num(Object.keys(data.byCategory || {}).length)} tone="primary" />
		</div>
	);
}

function SummaryItem({ label, value, tone }) {
	const tones = {
		emerald: 'text-emerald-700',
		destructive: 'text-destructive',
		accent: 'text-accent',
		primary: 'text-primary',
	};
	return (
		<div className="rounded-lg border border-border bg-card p-3 sm:p-4">
			<p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
			<p className={`mt-1 font-display text-xl font-extrabold tabular-nums ${tones[tone] || 'text-foreground'}`}>{value}</p>
		</div>
	);
}

/**
 * Renders any of the 8 list sections from a single :section route param,
 * using ResourceListPage + SECTION_CONFIGS. No per-section page files.
 */
export default function ShopSectionPage() {
	const { shopId, section } = useParams();
	const config = SECTION_CONFIGS[section];

	const summaryNode = useMemo(() => {
		if (section === 'cashbox') return <SummaryBand shopId={shopId} kind="cashbox" />;
		if (section === 'expenses') return <SummaryBand shopId={shopId} kind="expenses" />;
		return null;
	}, [shopId, section]);

	if (!config) {
		return <p className="py-10 text-center text-sm text-muted-foreground">القسم غير موجود</p>;
	}

	return (
		<ResourceListPage
			// Force a full remount on shop or section change. Without this,
			// React Router keeps this same component instance alive when only
			// the URL params change (it's the same component type at the same
			// position in the tree) — so page/search/filters/selectedId from
			// the PREVIOUS section stayed applied to the NEW entity's request,
			// which is exactly the "switch page and the data looks wrong"
			// symptom, and a still-open detail modal could end up fetching an
			// id that belongs to a different entity entirely.
			key={`${shopId}:${section}`}
			shopId={shopId}
			config={config}
			summaryNode={summaryNode}
		/>
	);
}
