import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/lib/api', () => ({ api: { getShopReport: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));

const { api } = await import('@/lib/api');
const { default: ShopReportsPage, trendSeries } = await import('@/pages/shop/ShopReportsPage');
const { profitSteps } = await import('@/components/analytics/ProfitSteps');

const reports = {
    sales: {
        totalSales: 5000, grossSales: 5200, returns: 200, count: 40, avgInvoice: 130, collected: 4100, creditOutstanding: 900,
        topProducts: [{ name: 'فلتر زيت', qty: 23, total: 2500 }, { name: 'شمعة', qty: 18, total: 720 }],
        byPaymentType: { cash: 3200, credit: 2000 },
        previous: { totalSales: 4000 }, change: { totalSales: 25, avgInvoice: -5 },
    },
    profit: {
        totalProfit: 1500, margin: 30, grossSales: 5200, discount: 150, returns: 200, revenue: 5000, cogs: 3000, grossProfit: 2000, expenses: 500,
        previous: { totalProfit: 2000 }, change: { totalProfit: -25 },
    },
    purchases: { totalPurchases: 8000, count: 12, paid: 6000, creditOutstanding: 2000, change: { totalPurchases: 40 } },
    inventory: { totalStockValue: 45000, saleValue: 60000, expectedProfit: 15000, totalProducts: 120, totalQuantity: 2400, lowCount: 6, outCount: 2 },
    customers: { count: 80, totalOutstanding: 12000, withBalanceCount: 15, topCustomers: [{ id: 'c1', name: 'أحمد', totalSpent: 9000, remaining: 2000 }] },
    suppliers: { count: 10, totalOutstanding: 7000, withBalanceCount: 3, topSuppliers: [{ id: 's1', name: 'شركة الصفا', totalAmount: 30000, remaining: 5000 }] },
};

function mockReports(daily) {
    api.getShopReport.mockImplementation((t, s, type) =>
        Promise.resolve({ success: true, data: type === 'daily' ? daily : reports[type] }));
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/shops/shop1/reports']}>
            <Routes><Route path="/shops/:shopId/reports" element={<ShopReportsPage />} /></Routes>
        </MemoryRouter>,
    );
}

const dailyOk = {
    available: true,
    days: [
        { date: '2026-09-01', netSales: 900, cogs: 540, net: 310, expenses: 50 },
        { date: '2026-09-02', netSales: 400, cogs: 200, net: 150, expenses: 0 },
    ],
};

beforeEach(() => vi.clearAllMocks());

describe('trendSeries', () => {
    it('maps the day series to sales after returns and net profit', () => {
        const t = trendSeries(dailyOk);
        expect(t.empty).toBeNull();
        expect(t.days).toEqual([
            { date: '2026-09-01', sales: 900, profit: 310 },
            { date: '2026-09-02', sales: 400, profit: 150 },
        ]);
    });

    it('says the shop needs updating when it has no daily report', () => {
        expect(trendSeries({ available: false, days: [] }).empty).toBe('outdated');
        expect(trendSeries(undefined).empty).toBe('outdated');
    });

    it('says there was no activity when every day is zero', () => {
        expect(trendSeries({ available: true, days: [{ date: '2026-09-01', netSales: 0, cogs: 0, net: 0, expenses: 0 }] }).empty).toBe('no-activity');
    });
});

describe('profitSteps', () => {
    it('walks from gross sales to net profit, in order, skipping zero returns/expenses', () => {
        expect(profitSteps(reports.profit).map((s) => [s.label, s.value])).toEqual([
            ['إجمالي المبيعات', 5200],
            ['المرتجعات', -200],
            ['صافي المبيعات', 5000],
            ['تكلفة البضاعة المباعة', -3000],
            ['مجمل الربح', 2000],
            ['المصروفات', -500],
            ['صافي الربح', 1500],
        ]);
        expect(profitSteps({ ...reports.profit, returns: 0, expenses: 0 }).map((s) => s.key)).not.toContain('returns');
    });
});

describe('ShopReportsPage', () => {
    it('asks for sales / profit / purchases WITH the previous-period comparison, and the daily series', async () => {
        mockReports(dailyOk);
        renderPage();
        await screen.findByText('حساب الأرباح');
        const calls = api.getShopReport.mock.calls;
        for (const type of ['sales', 'profit', 'purchases']) {
            expect(calls.find((c) => c[2] === type)[3].extras).toEqual({ compare: 'previous' });
        }
        expect(calls.find((c) => c[2] === 'inventory')[3].extras).toBeUndefined();
        expect(calls.some((c) => c[2] === 'daily')).toBe(true);
    });

    it('headline figures with their change vs the previous period', async () => {
        mockReports(dailyOk);
        renderPage();
        expect(await screen.findByLabelText('صافي المبيعات: زيادة ٢٥٪')).toBeInTheDocument();
        expect(screen.getByLabelText('صافي الربح: نقص ٢٥٪')).toBeInTheDocument();
        // purchases going up is neither good nor bad
        expect(screen.getByLabelText('المشتريات: زيادة ٤٠٪')).toHaveAttribute('data-good', 'neutral');
    });

    it('shows the profit steps, payment split, best sellers, stock and debts', async () => {
        mockReports(dailyOk);
        renderPage();
        expect(await screen.findByText('حساب الأرباح')).toBeInTheDocument();
        expect(screen.getByText('تكلفة البضاعة المباعة', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('فلتر زيت')).toBeInTheDocument();
        expect(screen.getByText('ربح متوقع لو اتباع')).toBeInTheDocument();
        expect(screen.getByText(/عليه ٢٬٠٠٠/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'شوف الأصناف الناقصة' })).toHaveAttribute('href', '/shops/shop1/products');
    });

    it('draws the day-by-day trend when the shop has the daily report', async () => {
        mockReports(dailyOk);
        renderPage();
        const panel = (await screen.findByText('المبيعات والربح يوم بيوم')).closest('section');
        expect(within(panel).getByRole('img')).toBeInTheDocument();
    });

    it('explains (instead of an empty frame) when the shop is not updated yet', async () => {
        mockReports({ available: false, days: [] });
        renderPage();
        expect(await screen.findByText('التطور اليومي مش متاح للمحل ده لسه')).toBeInTheDocument();
    });
});
