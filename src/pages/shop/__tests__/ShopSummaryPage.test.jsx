import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/lib/api', () => ({ api: { getShopReport: vi.fn(), getShopOverview: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));

const { api } = await import('@/lib/api');
const { clearQueryCache } = await import('@/hooks/useApiQuery');
const { default: ShopSummaryPage, trendSeries } = await import('@/pages/shop/ShopSummaryPage');
const { profitSteps } = await import('@/components/analytics/ProfitSteps');

const reports = {
    sales: {
        totalSales: 5000, grossSales: 5200, returns: 200, count: 40, avgInvoice: 130, collected: 4100, creditOutstanding: 900,
        topProducts: [{ name: 'فلتر زيت', qty: 23, total: 2500 }],
        byPaymentType: { cash: 3200, credit: 2000 },
        change: { totalSales: 25, avgInvoice: -5 },
    },
    profit: { totalProfit: 1500, margin: 30, grossSales: 5200, discount: 150, returns: 200, revenue: 5000, cogs: 3000, grossProfit: 2000, expenses: 500, change: { totalProfit: -25 } },
    purchases: { totalPurchases: 8000, count: 12, paid: 6000, creditOutstanding: 2000, change: { totalPurchases: 40 } },
    inventory: { totalStockValue: 45000, saleValue: 60000, expectedProfit: 15000, totalProducts: 120, totalQuantity: 2400, lowCount: 6, outCount: 2 },
    customers: { count: 80, totalOutstanding: 12000, withBalanceCount: 15, topCustomers: [{ id: 'c1', name: 'أحمد', totalSpent: 9000, remaining: 2000 }] },
    suppliers: { count: 10, totalOutstanding: 7000, withBalanceCount: 3, topSuppliers: [{ id: 's1', name: 'شركة الصفا', totalAmount: 30000, remaining: 5000 }] },
};
const dailyOk = {
    available: true,
    days: [
        { date: '2026-09-01', netSales: 900, cogs: 540, net: 310, expenses: 50 },
        { date: '2026-09-02', netSales: 400, cogs: 200, net: 150, expenses: 0 },
    ],
};
const overview = {
    cashboxBalance: 3500,
    lowStockItems: [{ id: 'p1', name: 'فلتر زيت', sku: 'F-1', stock: 2, unit: 'قطعة', status: 'low' }, { id: 'p2', name: 'شمعة', stock: 0, status: 'out' }],
};

function mockAll(daily = dailyOk) {
    api.getShopReport.mockImplementation((t, s, type) =>
        Promise.resolve({ success: true, data: type === 'daily' ? daily : reports[type] }));
    api.getShopOverview.mockResolvedValue({ success: true, data: overview });
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/shops/shop1']}>
            <Routes><Route path="/shops/:shopId" element={<ShopSummaryPage />} /></Routes>
        </MemoryRouter>,
    );
}

const tile = (label) => screen.getByText(label).closest('a');
const callsOf = (type) => api.getShopReport.mock.calls.filter((c) => c[2] === type);

beforeEach(() => vi.clearAllMocks());

describe('trendSeries / profitSteps', () => {
    it('maps the day series to sales after returns and net profit', () => {
        expect(trendSeries(dailyOk).days).toEqual([
            { date: '2026-09-01', sales: 900, profit: 310 },
            { date: '2026-09-02', sales: 400, profit: 150 },
        ]);
    });

    it('says the shop needs updating / had no activity', () => {
        expect(trendSeries({ available: false, days: [] }).empty).toBe('outdated');
        expect(trendSeries({ available: true, days: [{ date: '2026-09-01', netSales: 0, cogs: 0, net: 0, expenses: 0 }] }).empty).toBe('no-activity');
    });

    it('profit goes from gross sales to net profit, in order', () => {
        expect(profitSteps(reports.profit).map((s) => s.label)).toEqual([
            'إجمالي المبيعات', 'المرتجعات', 'صافي المبيعات', 'تكلفة البضاعة المباعة', 'مجمل الربح', 'المصروفات', 'صافي الربح',
        ]);
    });
});

describe('ShopSummaryPage — one page instead of two', () => {
    it('"دلوقتي" comes first: cash, what customers owe, stock at cost, what we owe — each a link to its section', async () => {
        mockAll();
        renderPage();
        await screen.findByText('البضاعة (بالتكلفة)');
        await waitFor(() => expect(tile('الكاش')).toHaveTextContent('٣,٥٠٠'));
        expect(tile('الكاش')).toHaveAttribute('href', '/shops/shop1/cashbox');
        expect(tile('لينا عند العملاء')).toHaveTextContent('١٢,٠٠٠');
        expect(tile('لينا عند العملاء')).toHaveAttribute('href', '/shops/shop1/customers');
        expect(tile('البضاعة (بالتكلفة)')).toHaveTextContent('٤٥,٠٠٠');
        expect(tile('البضاعة (بالتكلفة)')).toHaveTextContent('بسعر البيع ٦٠,٠٠٠');
        expect(tile('علينا للموردين')).toHaveTextContent('٧,٠٠٠');
        expect(tile('علينا للموردين')).toHaveAttribute('href', '/shops/shop1/suppliers');
    });

    it('the period figures come with their change vs the previous period', async () => {
        mockAll();
        renderPage();
        expect(await screen.findByLabelText('صافي المبيعات: زيادة ٢٥٪')).toBeInTheDocument();
        expect(screen.getByLabelText('صافي الربح: نقص ٢٥٪')).toBeInTheDocument();
        expect(screen.getByLabelText('المشتريات: زيادة ٤٠٪')).toHaveAttribute('data-good', 'neutral');
        for (const type of ['sales', 'profit', 'purchases']) expect(callsOf(type)[0][3].extras).toEqual({ compare: 'previous' });
    });

    it('switching the period re-asks ONLY for the period figures, not stock / debts / cash', async () => {
        mockAll();
        renderPage();
        await screen.findByLabelText('صافي المبيعات: زيادة ٢٥٪');
        const before = { inv: callsOf('inventory').length, cust: callsOf('customers').length, ov: api.getShopOverview.mock.calls.length, sales: callsOf('sales').length };

        fireEvent.click(screen.getByRole('button', { name: 'آخر ٧ أيام' }));
        await waitFor(() => expect(callsOf('sales').length).toBe(before.sales + 1));

        expect(callsOf('inventory').length).toBe(before.inv);
        expect(callsOf('customers').length).toBe(before.cust);
        expect(api.getShopOverview.mock.calls.length).toBe(before.ov);
    });

    it('lists what is running out, saying how many are left', async () => {
        mockAll();
        renderPage();
        const panel = (await screen.findByText(/أصناف ناقصة أو خلصت \(٨\)/)).closest('section');
        expect(within(panel).getByText('فاضل ٢ قطعة')).toBeInTheDocument();
        expect(within(panel).getByText('خلص')).toBeInTheDocument();
        expect(within(panel).getByRole('link', { name: /شوف كل الأصناف/ })).toHaveAttribute('href', '/shops/shop1/products');
    });

    it('the secondary detail is folded: closed at first, one tap opens best sellers, stock, customers, suppliers', async () => {
        mockAll();
        renderPage();
        const toggle = await screen.findByRole('button', { name: /تفاصيل أكتر/ });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('أكتر الأصناف مبيعاً')).not.toBeInTheDocument();

        fireEvent.click(toggle);

        expect(screen.getByText('أكتر الأصناف مبيعاً')).toBeInTheDocument();
        expect(screen.getByText('شركة الصفا')).toBeInTheDocument();
        expect(screen.getByText(/عليه ٢,٠٠٠/)).toBeInTheDocument();
    });

    it('draws the trend, or explains when the shop has no daily report yet', async () => {
        mockAll();
        const first = renderPage();
        const panel = (await screen.findByText('المبيعات والربح يوم بيوم')).closest('section');
        expect(within(panel).getByRole('img')).toBeInTheDocument();
        first.unmount();

        vi.clearAllMocks();
        clearQueryCache(); // the first render's answers are cached per shop + period
        mockAll({ available: false, days: [] });
        renderPage();
        expect(await screen.findByText('التطور اليومي مش متاح للمحل ده لسه')).toBeInTheDocument();
    });

    it('a failure in one part does not take the others down', async () => {
        mockAll();
        api.getShopOverview.mockRejectedValue(new Error('x'));
        renderPage();
        expect(await screen.findByLabelText('صافي المبيعات: زيادة ٢٥٪')).toBeInTheDocument();
        await waitFor(() => expect(tile('لينا عند العملاء')).toHaveTextContent('١٢,٠٠٠'));
        expect(tile('الكاش')).toHaveTextContent('—'); // unknown, never a fake 0
    });
});
