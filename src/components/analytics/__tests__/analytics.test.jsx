import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChangeBadge from '@/components/analytics/ChangeBadge';
import TrendChart, { buildPaths } from '@/components/analytics/TrendChart';
import { buildAttention, DROP_ALERT_PCT } from '@/components/analytics/attention';
import { compactMoney } from '@/components/analytics/format';

describe('ChangeBadge', () => {
    it('up is good (green), down is bad (red)', () => {
        const { container, rerender } = render(<ChangeBadge value={12.5} />);
        expect(container.firstChild).toHaveAttribute('data-good', 'true');
        expect(container.firstChild).toHaveTextContent('١٢٫٥٪');
        rerender(<ChangeBadge value={-8} />);
        expect(container.firstChild).toHaveAttribute('data-good', 'false');
    });

    it('for costs / debts (inverse) going up is the bad direction', () => {
        const { container } = render(<ChangeBadge value={10} inverse />);
        expect(container.firstChild).toHaveAttribute('data-good', 'false');
    });

    it('says "جديد" when there is nothing to compare with, and nothing when unknown', () => {
        const { container, rerender } = render(<ChangeBadge value={null} />);
        expect(container).toHaveTextContent('جديد');
        rerender(<ChangeBadge value={undefined} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('is described in words for screen readers', () => {
        render(<ChangeBadge value={-20} label="المبيعات" />);
        expect(screen.getByLabelText('المبيعات: نقص ٢٠٪')).toBeInTheDocument();
    });
});

describe('TrendChart', () => {
    const days = [
        { date: '2026-09-01', sales: 100, profit: 20 },
        { date: '2026-09-02', sales: 300, profit: -10 },
        { date: '2026-09-03', sales: 200, profit: 50 },
    ];

    it('scales to the data, including a below-zero profit', () => {
        const p = buildPaths(days);
        expect(p.max).toBe(300);
        expect(p.min).toBe(-10);
        expect(p.salesLine.startsWith('M0.0,')).toBe(true);
        expect(p.salesArea.endsWith('Z')).toBe(true);
    });

    it('describes the series (best day) for screen readers', () => {
        render(<TrendChart days={days} />);
        expect(screen.getByRole('img').getAttribute('aria-label')).toContain('٢ سبتمبر');
    });

    it('shows the exact figures for the day under the finger / mouse', () => {
        render(<TrendChart days={days} />);
        const box = screen.getByRole('img');
        box.getBoundingClientRect = () => ({ left: 0, width: 300, top: 0, height: 100, right: 300, bottom: 100 });

        fireEvent.pointerMove(box, { clientX: 299 });
        expect(screen.getByTestId('trend-tooltip')).toHaveTextContent('٣ سبتمبر');
        expect(screen.getByTestId('trend-tooltip')).toHaveTextContent('٢٠٠');

        fireEvent.pointerLeave(box);
        expect(screen.queryByTestId('trend-tooltip')).not.toBeInTheDocument();
    });
});

describe('buildAttention', () => {
    const shops = [
        { id: 'a', name: 'محل أ', status: 'online', lowStockCount: 2 },
        { id: 'b', name: 'محل ب', status: 'offline', lowStockCount: 5 },
        { id: 'c', name: 'محل ج', status: 'online', lowStockCount: 4 },
    ];
    const compare = {
        totalOutstanding: 1500,
        byShop: [
            { shopId: 'a', shopName: 'محل أ', available: true, profit: 100, change: { sales: DROP_ALERT_PCT - 5 }, outstanding: 1000 },
            { shopId: 'b', shopName: 'محل ب', available: false, profit: 0, change: { sales: null }, outstanding: 0 },
            { shopId: 'c', shopName: 'محل ج', available: true, profit: -50, change: { sales: 10 }, outstanding: 500 },
        ],
    };

    it('lists, most urgent first: offline, loss, sales drop, low stock, debts', () => {
        const items = buildAttention({ shops, compare });
        expect(items.map((i) => i.kind)).toEqual(['offline', 'drop', 'loss', 'stock', 'debts']);
        expect(items.filter((i) => i.tone === 'danger').map((i) => i.kind)).toEqual(['offline', 'loss']);
    });

    it('each item says what happened in plain words and links to where to act', () => {
        const items = buildAttention({ shops, compare });
        expect(items.find((i) => i.kind === 'offline')).toMatchObject({ to: '/shops/b', text: expect.stringContaining('محل ب مش بيرد') });
        expect(items.find((i) => i.kind === 'loss')).toMatchObject({ to: '/shops/c/reports', text: expect.stringContaining('خسران ٥٠') });
        // low stock ignores the offline shop, points at the worst online one
        expect(items.find((i) => i.kind === 'stock')).toMatchObject({ to: '/shops/c/products', text: expect.stringContaining('٦ صنف') });
        expect(items.find((i) => i.kind === 'debts')).toMatchObject({ to: '/shops/a/customers' });
    });

    it('nothing to say when everything is fine', () => {
        const fine = buildAttention({
            shops: [{ id: 'a', name: 'أ', status: 'online', lowStockCount: 0 }],
            compare: { totalOutstanding: 0, byShop: [{ shopId: 'a', shopName: 'أ', available: true, profit: 10, change: { sales: -5 } }] },
        });
        expect(fine).toEqual([]);
    });
});

describe('compactMoney', () => {
    it('shortens large amounts', () => {
        expect(compactMoney(12300)).toBe('١٢٫٣ ألف');
        expect(compactMoney(2500000)).toBe('٢٫٥ مليون');
        expect(compactMoney(950)).toBe('٩٥٠');
    });
});

describe('pct keeps the sign (a negative margin must read negative)', async () => {
    const { pct } = await import('@/components/analytics/format');
    it('signed', () => {
        expect(pct(-60.7)).toMatch(/^\u061c?-٦٠٫٧٪$/);
        expect(pct(12.5)).toBe('١٢٫٥٪');
        expect(pct(0)).toBe('٠٪');
    });
});

describe('ProfitSteps', async () => {
    const { default: ProfitSteps } = await import('@/components/analytics/ProfitSteps');
    it('a loss is shown with a minus and a negative margin', () => {
        render(<ProfitSteps profit={{ grossSales: 100, revenue: 100, cogs: 80, grossProfit: 20, expenses: 70, totalProfit: -50, margin: -50, returns: 0 }} />);
        expect(screen.getByText(/^\u061c?-٥٠$/)).toBeInTheDocument();
        expect(screen.getByText(/هامش صافي الربح \u061c?-٥٠٪/)).toBeInTheDocument();
    });
});

describe('KpiCard colours', async () => {
    const { default: KpiCard } = await import('@/components/analytics/KpiCard');
    it('a coloured value does not also carry text-foreground (which would override it)', () => {
        render(<KpiCard label="ربح" value="١٠" valueClass="text-emerald-700" />);
        const value = screen.getByText('ربح').nextSibling;
        expect(value).toHaveClass('text-emerald-700');
        expect(value).not.toHaveClass('text-foreground');
    });
});
