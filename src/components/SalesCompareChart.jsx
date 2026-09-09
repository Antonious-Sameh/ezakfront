import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatNumber } from '@/lib/format';

const AR_LOCALE = 'ar-EG';

const compactTick = (value) =>
    formatNumber(value, { locale: AR_LOCALE, notation: 'compact', maximumFractionDigits: 1 });

const fullValue = (value) => formatNumber(value, { locale: AR_LOCALE });

/** Custom RTL Tooltip for clear financial display */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-md backdrop-blur-sm dir-rtl text-right">
                <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
                <div className="space-y-1.5 text-xs">
                    {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground">{entry.name}:</span>
                            </div>
                            <span className="font-semibold tabular-nums text-foreground">
                                {fullValue(entry.value)} ج.م
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

/** Bar chart comparing sales & profit across shops. */
export default function SalesCompareChart({ data }) {
    return (
        <div dir="ltr" className="h-72 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} barGap={8}>
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="hsl(var(--border))" 
                        vertical={false} 
                        opacity={0.6}
                    />
                    <XAxis
                        dataKey="shopName"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        interval={0}
                        dy={8}
                    />
                    <YAxis
                        tickFormatter={compactTick}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                        formatter={(value) => (
                            <span className="text-xs font-medium text-foreground">{value}</span>
                        )}
                    />
                    <Bar
                        dataKey="sales"
                        name="المبيعات"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                    />
                    <Bar
                        dataKey="profit"
                        name="الربح"
                        fill="hsl(var(--accent))"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}