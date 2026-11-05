import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChangeBadge from '@/components/analytics/ChangeBadge';
import TrendChart, { buildPaths } from '@/components/analytics/TrendChart';
import { buildAttention, DROP_ALERT_PCT } from '@/components/analytics/attention';
import KpiCard from '@/components/analytics/KpiCard';
import { compactMoney, moneyParts, qty, money } from '@/components/analytics/format';

describe('ChangeBadge', () => {
    it('up is good (green), down is bad (red)', () => {
        const { container, rerender } = render(<ChangeBadge value={12.5} />);
        expect(container.firstChild).toHaveAttribute('data-good', 'true');
        expect(container.firstChild).toHaveTextContent('12.5%');
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
        expect(screen.getByLabelText('المبيعات: نقص 20%')).toBeInTheDocument();
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
        expect(screen.getByRole('img').getAttribute('aria-label')).toContain('2 سبتمبر');
    });

    it('shows the exact figures for the day under the finger / mouse', () => {
        render(<TrendChart days={days} />);
        const box = screen.getByRole('img');
        box.getBoundingClientRect = () => ({ left: 0, width: 300, top: 0, height: 100, right: 300, bottom: 100 });

        fireEvent.pointerMove(box, { clientX: 299 });
        expect(screen.getByTestId('trend-tooltip')).toHaveTextContent('3 سبتمبر');
        expect(screen.getByTestId('trend-tooltip')).toHaveTextContent('200');

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
        byShop: [
            { shopId: 'a', shopName: 'محل أ', available: true, profit: 100, change: { sales: DROP_ALERT_PCT - 5 } },
            { shopId: 'b', shopName: 'محل ب', available: false, profit: 0, change: { sales: null } },
            { shopId: 'c', shopName: 'محل ج', available: true, profit: -50, change: { sales: 10 } },
        ],
    };
    const position = {
        totals: { customersOwe: 1500 },
        byShop: [{ shopId: 'a', customersOwe: 1000 }, { shopId: 'b', customersOwe: null }, { shopId: 'c', customersOwe: 500 }],
    };

    it('lists, most urgent first: offline, loss, sales drop, low stock, debts', () => {
        const items = buildAttention({ shops, compare, position });
        expect(items.map((i) => i.kind)).toEqual(['offline', 'drop', 'loss', 'stock', 'debts']);
        expect(items.filter((i) => i.tone === 'danger').map((i) => i.kind)).toEqual(['offline', 'loss']);
    });

    it('each item says what happened in plain words and links to where to act', () => {
        const items = buildAttention({ shops, compare, position });
        expect(items.find((i) => i.kind === 'offline')).toMatchObject({ to: '/shops/b', text: expect.stringContaining('محل ب مش بيرد') });
        expect(items.find((i) => i.kind === 'loss')).toMatchObject({ to: '/shops/c', text: expect.stringContaining('خسران 50') });
        // low stock ignores the offline shop, points at the worst online one
        expect(items.find((i) => i.kind === 'stock')).toMatchObject({ to: '/shops/c/products', text: expect.stringContaining('6 صنف') });
        expect(items.find((i) => i.kind === 'debts')).toMatchObject({ to: '/shops/a/customers' });
    });

    it('nothing to say when everything is fine', () => {
        const fine = buildAttention({
            shops: [{ id: 'a', name: 'أ', status: 'online', lowStockCount: 0 }],
            compare: { byShop: [{ shopId: 'a', shopName: 'أ', available: true, profit: 10, change: { sales: -5 } }] },
            position: { totals: { customersOwe: 0 }, byShop: [] },
        });
        expect(fine).toEqual([]);
    });
});

describe('compactMoney', () => {
    it('shortens large amounts', () => {
        expect(compactMoney(12300)).toBe('12.3 ألف');
        expect(compactMoney(2500000)).toBe('2.5 مليون');
        expect(compactMoney(950)).toBe('950');
    });

    it('says billions in billions, and never overflows its own unit', () => {
        expect(compactMoney(1500000000)).toBe('1.5 مليار');
        expect(compactMoney(999960)).toBe('1 مليون');
        expect(compactMoney(12345678)).toBe('12.3 مليون');
    });
});

describe('big-number readability', () => {
    it('money groups thousands with a comma; piastres are always two digits', () => {
        expect(money(1234567.5)).toBe('1,234,567.50');
        expect(money(12)).toBe('12');
        expect(money(0.1 + 0.2)).toBe('0.30');
    });

    it('moneyParts gives a headline AND the exact figure from one million up, nothing below', () => {
        expect(moneyParts(4413929.83)).toEqual({ headline: '4.41 مليون', exact: '4,413,929.83' });
        expect(moneyParts(15884329.5)).toEqual({ headline: '15.88 مليون', exact: '15,884,329.50' });
        expect(moneyParts(1500000000)).toEqual({ headline: '1.5 مليار', exact: '1,500,000,000' });
        expect(moneyParts(999999)).toBeNull();
        expect(moneyParts(undefined)).toBeNull();
    });

    it('qty keeps fractional quantities instead of rounding them', () => {
        expect(qty(2.5)).toBe('2.5');
        expect(qty(3)).toBe('3');
    });

    it('KpiCard shows "4.41 مليون" with the exact value right under it', () => {
        const { rerender } = render(<KpiCard label="مبيعات" value={money(4413929.83)} amount={4413929.83} unit="ج.م" />);
        expect(screen.getByText('مبيعات').nextSibling).toHaveTextContent('4.41 مليون');
        expect(screen.getByTestId('exact-value')).toHaveTextContent('4,413,929.83 ج.م');
        rerender(<KpiCard label="مبيعات" value={money(25000)} amount={25000} unit="ج.م" />);
        expect(screen.queryByTestId('exact-value')).toBeNull();
        expect(screen.getByText('مبيعات').nextSibling).toHaveTextContent('25,000');
    });
});

describe('pct keeps the sign (a negative margin must read negative)', async () => {
    const { pct } = await import('@/components/analytics/format');
    it('signed', () => {
        expect(pct(-60.7)).toMatch(/^[\u061c\u200e]?-60.7%$/);
        expect(pct(12.5)).toBe('12.5%');
        expect(pct(0)).toBe('0%');
    });
});

describe('ProfitSteps', async () => {
    const { default: ProfitSteps } = await import('@/components/analytics/ProfitSteps');
    it('a loss is shown with a minus and a negative margin', () => {
        render(<ProfitSteps profit={{ grossSales: 100, revenue: 100, cogs: 80, grossProfit: 20, expenses: 70, totalProfit: -50, margin: -50, returns: 0 }} />);
        expect(screen.getByText(/^[\u061c\u200e]?-50$/)).toBeInTheDocument();
        expect(screen.getByText(/هامش صافي الربح [\u061c\u200e]?-50%/)).toBeInTheDocument();
    });
});

describe('KpiCard colours', async () => {
    const { default: KpiCard } = await import('@/components/analytics/KpiCard');
    it('a coloured value does not also carry text-foreground (which would override it)', () => {
        render(<KpiCard label="ربح" value="10" valueClass="text-emerald-700" />);
        const value = screen.getByText('ربح').nextSibling;
        expect(value).toHaveClass('text-emerald-700');
        expect(value).not.toHaveClass('text-foreground');
    });
});
