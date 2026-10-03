import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SHOP_SECTIONS, MOBILE_PRIMARY_SECTIONS, groupSections } from '@/components/shop/sectionConfigs';

vi.mock('@/lib/api', () => ({ api: { getShops: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));

const { api } = await import('@/lib/api');
const { default: ShopLayout } = await import('@/components/shop/ShopLayout');

beforeEach(() => {
    vi.clearAllMocks();
    api.getShops.mockResolvedValue({ success: true, data: [{ id: 'shop1', name: 'محل أ', status: 'online' }] });
});

function renderLayout() {
    return render(
        <MemoryRouter initialEntries={['/shops/shop1/sales']}>
            <Routes><Route path="/shops/:shopId" element={<ShopLayout />}><Route path=":section" element={<p>صفحة</p>} /></Route></Routes>
        </MemoryRouter>,
    );
}

describe('shop navigation structure', () => {
    it('the summary comes first, and "التقارير" is no longer a separate section', () => {
        expect(SHOP_SECTIONS[0]).toMatchObject({ key: '', label: 'ملخص' });
        expect(SHOP_SECTIONS.map((s) => s.key)).not.toContain('reports');
        expect(SHOP_SECTIONS).toHaveLength(9);
    });

    it('sections are grouped: summary alone, then money, then stock & people, then the log', () => {
        const groups = groupSections(SHOP_SECTIONS);
        expect(groups.map((g) => g.title)).toEqual([null, 'فلوس', 'المخزون والناس', 'السجل']);
        expect(groups[1].items.map((s) => s.label)).toEqual(['المبيعات', 'المشتريات', 'المصروفات', 'الكاشير']);
        expect(groups[2].items.map((s) => s.label)).toEqual(['المخزون', 'العملاء', 'الموردين']);
    });

    it('the phone tab bar has the four everyday sections (+ المزيد), in the same order as the sidebar', () => {
        expect(MOBILE_PRIMARY_SECTIONS).toEqual(['', 'sales', 'cashbox', 'products']);
    });
});

describe('ShopLayout', () => {
    it('the sidebar shows group headings instead of one flat list of ten', async () => {
        renderLayout();
        const side = (await screen.findAllByRole('navigation'))[0];
        for (const title of ['فلوس', 'المخزون والناس', 'السجل']) expect(within(side).getByText(title)).toBeInTheDocument();
        expect(within(side).getByRole('link', { name: 'ملخص' })).toHaveAttribute('href', '/shops/shop1');
        expect(within(side).queryByRole('link', { name: 'التقارير' })).not.toBeInTheDocument();
    });

    it('"المزيد" opens a sheet with the remaining sections, under their group headings', async () => {
        renderLayout();
        fireEvent.click(await screen.findByRole('button', { name: 'المزيد' }));
        const sheet = screen.getByText('باقي الأقسام').closest('div').parentElement.parentElement;
        for (const label of ['المشتريات', 'المصروفات', 'العملاء', 'الموردين', 'سجل النشاط']) {
            expect(within(sheet).getByRole('link', { name: label })).toBeInTheDocument();
        }
        // the four primary sections stay in the tab bar, not in the sheet
        expect(within(sheet).queryByRole('link', { name: 'المبيعات' })).not.toBeInTheDocument();
        expect(within(sheet).getByText('فلوس')).toBeInTheDocument();
    });
});
