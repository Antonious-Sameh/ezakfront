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

/** Bar chart comparing sales & profit across the four shops. */
export default function SalesCompareChart({ data }) {
	return (
		<div dir="ltr" className="h-72 w-full sm:h-80">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={6}>
					<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
					<XAxis
						dataKey="shopName"
						tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
						tickLine={false}
						axisLine={{ stroke: 'hsl(var(--border))' }}
						interval={0}
					/>
					<YAxis
						tickFormatter={compactTick}
						tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
						tickLine={false}
						axisLine={false}
						width={48}
					/>
					<Tooltip
						formatter={(value, name) => [fullValue(value), name]}
						cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
						contentStyle={{
							direction: 'rtl',
							textAlign: 'right',
							backgroundColor: 'hsl(var(--card))',
							border: '1px solid hsl(var(--border))',
							borderRadius: 'var(--radius)',
							fontSize: 13,
						}}
					/>
					<Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
					<Bar dataKey="sales" name="المبيعات" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} maxBarSize={40} />
					<Bar dataKey="profit" name="الربح" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
