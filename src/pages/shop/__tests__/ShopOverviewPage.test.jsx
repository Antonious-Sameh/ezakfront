import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/lib/api', () => ({ api: { getShopOverview: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));

const { api } = await import('@/lib/api');
const { default: ShopOverviewPage } = await import('@/pages/shop/ShopOverviewPage');

const overview = {
    todaySales: 750, todayOrders: 9, monthSales: 12000, todayProfit: 210, cashboxBalance: 3500,
    productCount: 120, lowStockCount: 8, customerCount: 80,
    lowStockItems: [{ id: 'p1', name: 'فلتر زيت', sku: 'F-1', stock: 2, unit: 'قطعة', status: 'low' }, { id: 'p2', name: 'شمعة', stock: 0, status: 'out' }],
};

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/shops/shop1']}>
            <Routes><Route path="/shops/:shopId" element={<ShopOverviewPage />} /></Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => vi.clearAllMocks());

describe('ShopOverviewPage', () => {
    it("today's money first, with the shared colour language", async () => {
        api.getShopOverview.mockResolvedValue({ success: true, data: overview });
        renderPage();
        expect((await screen.findByText('مبيعات النهارده')).parentElement).toHaveTextContent('٧٥٠');
        expect(screen.getByText('ربح النهارده').nextSibling).toHaveClass('text-emerald-700');
        expect(screen.getByText('رصيد الكاشير').parentElement).toHaveTextContent('٣٬٥٠٠');
    });

    it('a loss today shows in red', async () => {
        api.getShopOverview.mockResolvedValue({ success: true, data: { ...overview, todayProfit: -40 } });
        renderPage();
        expect((await screen.findByText('ربح النهارده')).nextSibling).toHaveClass('text-rose-600');
    });

    it('low stock is highlighted and links to the products, items say how many are left', async () => {
        api.getShopOverview.mockResolvedValue({ success: true, data: overview });
        renderPage();
        const tile = (await screen.findByText('ناقص أو خلص')).closest('a');
        expect(tile).toHaveAttribute('href', '/shops/shop1/products');
        expect(tile.className).toContain('amber');
        expect(screen.getByText('فاضل ٢ قطعة')).toBeInTheDocument();
        expect(screen.getByText('خلص')).toBeInTheDocument();
    });

    it('links to the reports', async () => {
        api.getShopOverview.mockResolvedValue({ success: true, data: overview });
        renderPage();
        expect((await screen.findByText(/التقارير: المقارنة/)).closest('a')).toHaveAttribute('href', '/shops/shop1/reports');
    });
});
