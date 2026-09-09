import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import ResourceListPage from '@/components/shop/ResourceListPage';
import { SECTION_CONFIGS } from '@/components/shop/sectionConfigs';
import { AR_LOCALE } from '@/lib/mockData';
import { 
    ArrowDownLeft, 
    ArrowUpRight, 
    Wallet, 
    Calendar, 
    TrendingDown, 
    PieChart, 
    AlertCircle 
} from 'lucide-react';

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

    if (kind === 'cashbox') {
        return (
            <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                <SummaryItem 
                    label="إجمالي داخل" 
                    value={num(data.totalIn)} 
                    tone="emerald" 
                    icon={ArrowDownLeft}
                />
                <SummaryItem 
                    label="إجمالي خارج" 
                    value={num(data.totalOut)} 
                    tone="destructive" 
                    icon={ArrowUpRight}
                />
                <SummaryItem 
                    label="الرصيد الحالي" 
                    value={num(data.balance)} 
                    tone={data.balance < 0 ? 'destructive' : 'primary'} 
                    icon={Wallet}
                />
                <SummaryItem 
                    label="داخل اليوم" 
                    value={num(data.todayIn)} 
                    tone="emerald" 
                    icon={Calendar}
                />
            </div>
        );
    }

    return (
        <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            <SummaryItem 
                label="إجمالي المصروفات" 
                value={num(data.total)} 
                tone="destructive" 
                icon={TrendingDown}
            />
            <SummaryItem 
                label="مصروفات الشهر" 
                value={num(data.thisMonth)} 
                tone="accent" 
                icon={Calendar}
            />
            <SummaryItem 
                label="عدد التصنيفات" 
                value={num(Object.keys(data.byCategory || {}).length)} 
                tone="primary" 
                icon={PieChart}
            />
        </div>
    );
}

function SummaryItem({ label, value, tone, icon: Icon }) {
    const toneStyles = {
        emerald: {
            text: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            border: 'hover:border-emerald-500/30'
        },
        destructive: {
            text: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            border: 'hover:border-rose-500/30'
        },
        accent: {
            text: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            border: 'hover:border-amber-500/30'
        },
        primary: {
            text: 'text-primary',
            bg: 'bg-primary/10 text-primary',
            border: 'hover:border-primary/30'
        },
    };

    const currentTone = toneStyles[tone] || {
        text: 'text-foreground',
        bg: 'bg-muted text-muted-foreground',
        border: 'hover:border-border'
    };

    return (
        <div className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all duration-200 hover:shadow-sm ${currentTone.border}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    {label}
                </span>
                {Icon && (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${currentTone.bg}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            
            <div className="mt-3 flex items-baseline justify-between">
                <p className={`font-display text-xl font-bold tracking-tight tabular-nums sm:text-2xl ${currentTone.text}`}>
                    {value}
                </p>
            </div>
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