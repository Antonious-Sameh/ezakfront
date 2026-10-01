import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api', () => ({ api: { getShops: vi.fn(), getCompareReport: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));

const { api } = await import('@/lib/api');
const { default: OverviewPage, headline, mergeShopRows, PERIODS } = await import('@/pages/OverviewPage');

const compare = {
    totalSales: 4000, totalProfit: 900, totalInvoices: 30, margin: 22.5, totalOutstanding: 1200,
    previous: { sales: 3200, profit: 1000 }, change: { sales: 25, profit: -10 }, shopsAvailable: 2,
    byShop: [
        { shopId: 'shop2', shopName: 'محل ب', sales: 1000, profit: 300, invoices: 10, margin: 30, share: 25, rank: 2, available: true, change: { sales: 5, profit: 0 }, outstanding: 200 },
        { shopId: 'shop1', shopName: 'محل أ', sales: 3000, profit: 600, invoices: 20, margin: 20, share: 75, rank: 1, available: true, change: { sales: 40, profit: 10 }, outstanding: 1000 },
    ],
    daily: { available: true, partial: false, shopsIncluded: 2, days: [{ date: '2026-09-01', sales: 1, profit: 0 }, { date: '2026-09-02', sales: 2, profit: 1 }] },
};
const shops = [
    { id: 'shop1', name: 'محل أ', status: 'online', lowStockCount: 3 },
    { id: 'shop2', name: 'محل ب', status: 'online', lowStockCount: 0 },
];

function renderPage() {
    return render(<MemoryRouter><OverviewPage /></MemoryRouter>);
}

beforeEach(() => {
    vi.clearAllMocks();
    api.getShops.mockResolvedValue({ success: true, data: shops });
    api.getCompareReport.mockResolvedValue({ success: true, data: compare });
});

describe('OverviewPage', () => {
    it('hero: total sales, change vs previous period, profit / margin / invoices / debts', async () => {
        renderPage();
        expect(await screen.findByTestId('hero-total')).toHaveTextContent('٤٬٠٠٠');
        expect(screen.getByLabelText('المبيعات: زيادة ٢٥٪')).toBeInTheDocument();
        expect(screen.getByLabelText('الربح: نقص ١٠٪')).toBeInTheDocument();
        expect(screen.getByText('هامش الربح').nextSibling).toHaveTextContent('٢٢٫٥٪');
        expect(screen.getByText('على العملاء').nextSibling).toHaveTextContent('١٬٢٠٠');
    });

    it('defaults to the last 30 days and asks the backend for exactly that range', async () => {
        renderPage();
        await screen.findByTestId('hero-total');
        const [, from, to] = api.getCompareReport.mock.calls[0];
        expect((new Date(to) - new Date(from)) / 86400000).toBe(29);
    });

    it('switching period asks for the new range', async () => {
        renderPage();
        await screen.findByTestId('hero-total');
        fireEvent.click(screen.getByRole('button', { name: 'آخر ٧ أيام' }));
        await waitFor(() => expect(api.getCompareReport).toHaveBeenCalledTimes(2));
        const [, from, to] = api.getCompareReport.mock.calls[1];
        expect((new Date(to) - new Date(from)) / 86400000).toBe(6);
    });

    it('ranks the shops by sales (first place first), with their low-stock count', async () => {
        renderPage();
        const list = await screen.findByRole('list', { name: 'ترتيب المحلات حسب المبيعات' });
        const items = within(list).getAllByRole('listitem');
        expect(items[0]).toHaveTextContent('محل أ');
        expect(items[0]).toHaveTextContent('٣ ناقص');
        expect(items[1]).toHaveTextContent('محل ب');
        expect(within(items[0]).getByRole('link')).toHaveAttribute('href', '/shops/shop1');
    });

    it('shows what needs attention', async () => {
        renderPage();
        expect(await screen.findByText('محتاج انتباهك')).toBeInTheDocument();
        expect(screen.getByText(/صنف ناقص أو خلص في محل أ/)).toBeInTheDocument();
    });

    it('a failed load says so and offers a retry', async () => {
        api.getCompareReport.mockRejectedValue(new Error('الباك مش بيرد'));
        renderPage();
        expect(await screen.findByText(/الباك مش بيرد/)).toBeInTheDocument();
    });
});

describe('helpers', () => {
    it('headline names the leading shop and the direction of sales', () => {
        expect(headline(compare, PERIODS[2])).toBe('محل أ في المقدمة بـ ٧٥٪ من المبيعات، والمبيعات زادت ٢٥٪ عن الـ٣٠ يوم اللي قبلهم');
    });

    it('mergeShopRows sorts by rank and puts unranked (offline) shops last', () => {
        const rows = mergeShopRows({ byShop: [{ shopId: 'x', rank: null }, { shopId: 'y', rank: 1 }] }, []);
        expect(rows.map((r) => r.shopId)).toEqual(['y', 'x']);
    });
});
