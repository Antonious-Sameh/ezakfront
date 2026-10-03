import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api', () => ({ api: { getShops: vi.fn(), getCompareReport: vi.fn(), getPosition: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));

const { api } = await import('@/lib/api');
const { default: OverviewPage, headline, mergeShopRows, mergeShopCards, PERIODS } = await import('@/pages/OverviewPage');

const compare = {
    totalSales: 4000, totalProfit: 900, totalInvoices: 30, margin: 22.5,
    previous: { sales: 3200, profit: 1000 }, change: { sales: 25, profit: -10 }, shopsAvailable: 2,
    byShop: [
        { shopId: 'shop2', shopName: 'محل ب', sales: 1000, profit: 300, invoices: 10, margin: 30, share: 25, rank: 2, available: true, change: { sales: 5, profit: 0 } },
        { shopId: 'shop1', shopName: 'محل أ', sales: 3000, profit: 600, invoices: 20, margin: 20, share: 75, rank: 1, available: true, change: { sales: 40, profit: 10 } },
    ],
    daily: { available: true, partial: false, shopsIncluded: 2, days: [{ date: '2026-09-01', sales: 1, profit: 0 }, { date: '2026-09-02', sales: 2, profit: 1 }] },
};
const shops = [
    { id: 'shop1', name: 'محل أ', status: 'online', todaySales: 750, monthSales: 12000, lowStockCount: 3 },
    { id: 'shop2', name: 'محل ب', status: 'online', todaySales: 250, monthSales: 4000, lowStockCount: 0 },
];
const position = {
    generatedAt: '2026-10-01T09:00:00.000Z',
    totals: { customersOwe: 15000, suppliersOwed: 8000, cash: 4000, stockCost: 65000, stockSale: 85000, net: 76000, complete: true },
    byShop: [
        { shopId: 'shop1', shopName: 'محل أ', available: true, customersOwe: 12000, suppliersOwed: 7000, cash: 3500, stockCost: 45000, stockSale: 60000, lowCount: 3 },
        { shopId: 'shop2', shopName: 'محل ب', available: true, customersOwe: 3000, suppliersOwed: 1000, cash: 500, stockCost: 20000, stockSale: 25000, lowCount: 0 },
    ],
};

function renderPage() {
    return render(<MemoryRouter><OverviewPage /></MemoryRouter>);
}

beforeEach(() => {
    vi.clearAllMocks();
    api.getShops.mockResolvedValue({ success: true, data: shops });
    api.getPosition.mockResolvedValue({ success: true, data: position });
    api.getCompareReport.mockResolvedValue({ success: true, data: compare });
});

describe('OverviewPage — the owner\'s first questions', () => {
    it('the four shops are the first thing, each a link in, with debts, stock, cash and today\'s sales', async () => {
        renderPage();
        const list = await screen.findByRole('list', { name: 'المحلات' });
        const [first, second] = within(list).getAllByRole('listitem');

        expect(within(first).getByRole('link')).toHaveAttribute('href', '/shops/shop1');
        expect(first).toHaveTextContent('محل أ');
        await waitFor(() => expect(first).toHaveTextContent('١٢ ألف')); // owed by customers
        expect(first).toHaveTextContent('٤٥ ألف'); // stock at cost
        expect(first).toHaveTextContent('٣٬٥٠٠'); // cash
        expect(first).toHaveTextContent('٧٥٠'); // today's sales
        expect(second).toHaveTextContent('محل ب');
    });

    it('"معانا كام": what customers owe us, stock, cash, what we owe — and the estimated total', async () => {
        renderPage();
        const section = (await screen.findByRole('heading', { name: 'معانا كام' })).closest('section');
        await waitFor(() => expect(within(section).getByText('لينا عند العملاء').parentElement.parentElement).toHaveTextContent('١٥٬٠٠٠'));
        expect(within(section).getByText('البضاعة (بالتكلفة)').parentElement.parentElement).toHaveTextContent('٦٥٬٠٠٠');
        expect(within(section).getByText('الكاش').parentElement.parentElement).toHaveTextContent('٤٬٠٠٠');
        expect(within(section).getByText('علينا للموردين').parentElement.parentElement).toHaveTextContent('٨٬٠٠٠');
        expect(within(section).getByTestId('position-net')).toHaveTextContent('٧٦٬٠٠٠');
    });

    it('says when the total is partial (a shop did not answer) instead of pretending it is complete', async () => {
        api.getPosition.mockResolvedValue({
            success: true,
            data: { ...position, totals: { ...position.totals, complete: false }, byShop: [{ ...position.byShop[0], stockCost: null }, position.byShop[1]] },
        });
        renderPage();
        expect(await screen.findByText(/ناقص محل مردّش/)).toBeInTheDocument();
    });

    it('sales today / this month are summed from the shops', async () => {
        renderPage();
        const today = (await screen.findByText('مبيعات النهارده', { selector: 'p' })).parentElement;
        expect(today).toHaveTextContent('١٬٠٠٠');
        expect(screen.getByText('مبيعات الشهر ده').parentElement).toHaveTextContent('١٦٬٠٠٠');
    });

    it('one status line on top: says what needs attention (tap opens the list), or that all is fine', async () => {
        renderPage();
        const banner = await screen.findByRole('button', { name: /محتاجة انتباهك/ });
        expect(banner).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(banner);
        expect(banner).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText(/صنف ناقص أو خلص في محل أ/)).toBeInTheDocument();
        expect(screen.getByText(/لسه على العملاء ومتحصّلتش/)).toBeInTheDocument();
    });

    it('a failed position load says so and offers a retry, without hiding the shops', async () => {
        api.getPosition.mockRejectedValue(new Error('الباك مش بيرد'));
        renderPage();
        expect(await screen.findByText(/الباك مش بيرد/)).toBeInTheDocument();
        expect(screen.getByRole('list', { name: 'المحلات' })).toBeInTheDocument();
    });
});

describe('OverviewPage — sales analysis', () => {
    it('total sales, change vs previous period, profit / margin / invoices', async () => {
        renderPage();
        expect(await screen.findByTestId('hero-total')).toHaveTextContent('٤٬٠٠٠');
        expect(screen.getByLabelText('المبيعات: زيادة ٢٥٪')).toBeInTheDocument();
        expect(screen.getByLabelText('الربح: نقص ١٠٪')).toBeInTheDocument();
        expect(screen.getByText('هامش الربح').nextSibling).toHaveTextContent('٢٢٫٥٪');
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

    it('ranks the shops by sales for the period (first place first)', async () => {
        renderPage();
        const list = await screen.findByRole('list', { name: 'ترتيب المحلات حسب المبيعات' });
        const items = within(list).getAllByRole('listitem');
        expect(items[0]).toHaveTextContent('محل أ');
        expect(items[1]).toHaveTextContent('محل ب');
    });

    it('a failed analysis says so, and the shops above are still there', async () => {
        api.getCompareReport.mockRejectedValue(new Error('التحليل وقع'));
        renderPage();
        expect(await screen.findByText(/التحليل وقع/)).toBeInTheDocument();
        expect(screen.getByRole('list', { name: 'المحلات' })).toBeInTheDocument();
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

    it('mergeShopCards joins /api/shops with the position, and tolerates the position not being loaded yet', () => {
        const [a] = mergeShopCards(shops, position);
        expect(a).toMatchObject({ id: 'shop1', todaySales: 750, customersOwe: 12000, stockCost: 45000, cash: 3500, lowCount: 3 });
        const [early] = mergeShopCards(shops, undefined);
        expect(early).toMatchObject({ id: 'shop1', todaySales: 750, customersOwe: undefined });
    });
});
