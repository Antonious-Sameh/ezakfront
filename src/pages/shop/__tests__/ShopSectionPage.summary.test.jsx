import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/lib/api', () => ({
    api: {
        getShopList: vi.fn(),
        getCashboxSummary: vi.fn(),
        getExpensesSummary: vi.fn(),
        getExpenseReasons: vi.fn(),
    },
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));

const { api } = await import('@/lib/api');
const { default: ShopSectionPage } = await import('@/pages/shop/ShopSectionPage');

function renderAt(path) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/shops/:shopId/:section" element={<ShopSectionPage />} />
            </Routes>
        </MemoryRouter>,
    );
}

const card = (label) => screen.getByText(label).parentElement;

beforeEach(() => {
    vi.clearAllMocks();
    api.getShopList.mockResolvedValue({ success: true, data: [], pagination: { page: 1, totalPages: 1 } });
    api.getExpenseReasons.mockResolvedValue({ success: true, data: [], supported: true });
});

describe('cashbox / expenses summary cards show the real figures (they used to read fields that never existed)', () => {
    it('cashbox: balance, today in / out / net', async () => {
        api.getCashboxSummary.mockResolvedValue({ success: true, data: { balance: 3500, todayIn: 1200, todayOut: 300, todayNet: 900 } });
        renderAt('/shops/shop1/cashbox');

        await screen.findByText('الرصيد الحالي');
        expect(card('الرصيد الحالي')).toHaveTextContent('٣٬٥٠٠');
        expect(card('داخل النهارده')).toHaveTextContent('١٬٢٠٠');
        expect(card('خارج النهارده')).toHaveTextContent('٣٠٠');
        expect(card('صافي النهارده')).toHaveTextContent('٩٠٠');
        expect(screen.queryByText('إجمالي داخل')).not.toBeInTheDocument();
    });

    it('expenses: today and this month', async () => {
        api.getExpensesSummary.mockResolvedValue({ success: true, data: { todayTotal: 150, monthTotal: 2400 } });
        renderAt('/shops/shop1/expenses');

        await screen.findByText('مصروفات النهارده');
        expect(card('مصروفات النهارده')).toHaveTextContent('١٥٠');
        expect(card('مصروفات الشهر')).toHaveTextContent('٢٬٤٠٠');
        expect(within(document.body).queryByText('عدد التصنيفات')).not.toBeInTheDocument();
    });
});
