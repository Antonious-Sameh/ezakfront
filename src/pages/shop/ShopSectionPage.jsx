import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import ResourceListPage from '@/components/shop/ResourceListPage';
import { SECTION_CONFIGS } from '@/components/shop/sectionConfigs';
import KpiCard from '@/components/analytics/KpiCard';
import { money as moneyText } from '@/components/analytics/format';
import { AlertCircle } from 'lucide-react';

/** Small summary band shown above the cashbox / expenses lists. */
function SummaryBand({ shopId, kind }) {
    const { token } = useAuth();
    const fetcher = useCallback((signal) => {
        const params = {};
        return kind === 'cashbox'
            ? api.getCashboxSummary(token, shopId, params, { signal }).then((res) => res.data)
            : api.getExpensesSummary(token, shopId, params, { signal }).then((res) => res.data);
    }, [token, shopId, kind]);
    const { data, loading } = useApiQuery(fetcher, { key: `summary:${kind}:${shopId}` });

    if (loading || !data) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div 
                        key={i} 
                        className="h-24 animate-pulse rounded-2xl border border-border/50 bg-card/60 p-4" 
                    />
                ))}
            </div>
        );
    }

    // Same colour language as the rest of the dashboard: money in = green,
    // money out / expenses = amber (a cost, not a loss), negative = red.
    if (kind === 'cashbox') {
        return (
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard
                    kind={data.balance < 0 ? 'loss' : 'neutral'}
                    label="الرصيد الحالي"
                    value={moneyText(data.balance)}
                    unit="ج.م"
                    valueClass={data.balance < 0 ? 'text-rose-600' : ''}
                />
                <KpiCard kind="profit" label="داخل النهارده" value={moneyText(data.todayIn)} unit="ج.م" valueClass="text-emerald-700 dark:text-emerald-400" />
                <KpiCard kind="cost" label="خارج النهارده" value={moneyText(data.todayOut)} unit="ج.م" valueClass="text-amber-700 dark:text-amber-400" />
                <KpiCard
                    kind={data.todayNet < 0 ? 'loss' : 'profit'}
                    label="صافي النهارده"
                    value={moneyText(data.todayNet)}
                    unit="ج.م"
                    valueClass={data.todayNet < 0 ? 'text-rose-600' : ''}
                />
            </div>
        );
    }

    return (
        <div className="mb-6 grid grid-cols-2 gap-3">
            <KpiCard kind="cost" label="مصروفات النهارده" value={moneyText(data.todayTotal)} unit="ج.م" />
            <KpiCard kind="cost" label="مصروفات الشهر" value={moneyText(data.monthTotal)} unit="ج.م" />
        </div>
    );
}


export default function ShopSectionPage() {
    const { shopId, section } = useParams();
    const config = SECTION_CONFIGS[section];

    const summaryNode = useMemo(() => {
        if (section === 'cashbox') return <SummaryBand shopId={shopId} kind="cashbox" />;
        if (section === 'expenses') return <SummaryBand shopId={shopId} kind="expenses" />;
        return null;
    }, [shopId, section]);

    if (!config) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">القسم غير موجود</h3>
                <p className="mt-1 text-sm text-muted-foreground">تأكد من الرابط أو اختار قسم صحيح من القائمة.</p>
            </div>
        );
    }

    return (
        <ResourceListPage
            key={`${shopId}:${section}`}
            shopId={shopId}
            config={config}
            summaryNode={summaryNode}
        />
    );
}