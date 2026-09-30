import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { unzipSync, strFromU8 } from 'fflate';

vi.mock('@/lib/api', () => ({ api: { exportShopList: vi.fn(), getShopSettings: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() } }));
const downloaded = [];
vi.mock('@/lib/exporters/download', () => ({
    downloadFile: (fileName, data, mime) => downloaded.push({ fileName, data, mime }),
    safeFileName: (n) => n,
}));

const { api } = await import('@/lib/api');
const { toast } = await import('sonner');
const { shopSettingsCache } = await import('@/lib/shopSettingsCache');
const { default: ExportButton, exportFileBase } = await import('@/components/shop/ExportButton');

const sale = {
    id: 's1', invoiceNo: 'INV-1', date: '2026-09-20T10:00:00', customerName: 'أحمد', paymentType: 'cash',
    subtotal: 110, discount: 10, total: 100, paid: 100, remaining: 0, paymentStatus: 'paid', profit: 30,
    items: [{ productName: 'فلتر', code: 'F1', qty: 2, price: 55, total: 110 }],
};
const filters = { search: '', from: '2026-09-01', to: '2026-09-30', extras: { paymentType: 'cash' } };

beforeEach(() => {
    vi.clearAllMocks();
    downloaded.length = 0;
    shopSettingsCache.clear();
    api.getShopSettings.mockResolvedValue({ success: true, data: { shopName: 'محل النور' } });
});

async function choose(format) {
    await userEvent.click(screen.getByRole('button', { name: 'تصدير' }));
    await userEvent.click(screen.getByRole('menuitem', { name: new RegExp(format) }));
}

describe('ExportButton', () => {
    it('exports ALL rows matching the current filters to Excel, with an invoice-lines sheet', async () => {
        api.exportShopList.mockResolvedValue({ success: true, data: [sale], total: 1, truncated: false });
        render(<ExportButton shopId="shop1" entity="sales" title="المبيعات" filters={filters} />);

        await choose('Excel');

        await waitFor(() => expect(downloaded).toHaveLength(1));
        expect(api.exportShopList).toHaveBeenCalledWith('tok', 'shop1', 'sales', filters);
        expect(downloaded[0].fileName).toBe('محل النور - المبيعات - 2026-09-01 إلى 2026-09-30.xlsx');
        const parts = unzipSync(downloaded[0].data);
        const main = strFromU8(parts['xl/worksheets/sheet1.xml']);
        expect(main).toContain('INV-1');
        expect(main).toContain('أحمد');
        expect(main).toContain('<v>30</v>'); // profit is in the owner's file
        expect(strFromU8(parts['xl/worksheets/sheet2.xml'])).toContain('فلتر');
        expect(toast.success).toHaveBeenCalled();
    });

    it('exports CSV', async () => {
        api.exportShopList.mockResolvedValue({ success: true, data: [sale], total: 1, truncated: false });
        render(<ExportButton shopId="shop1" entity="sales" title="المبيعات" filters={filters} />);

        await choose('CSV');

        await waitFor(() => expect(downloaded).toHaveLength(1));
        expect(downloaded[0].fileName.endsWith('.csv')).toBe(true);
        expect(downloaded[0].data.startsWith('\uFEFFرقم الفاتورة,')).toBe(true);
        expect(downloaded[0].data).toContain('INV-1,2026-09-20 10:00,أحمد,نقدي');
    });

    it('warns when the server capped the export', async () => {
        api.exportShopList.mockResolvedValue({ success: true, data: [sale], total: 9000, truncated: true });
        render(<ExportButton shopId="shop1" entity="sales" title="المبيعات" filters={filters} />);

        await choose('Excel');

        await waitFor(() => expect(toast.warning).toHaveBeenCalled());
        expect(toast.warning.mock.calls[0][0]).toContain('ضيّق الفترة');
    });

    it('says so (no empty file) when nothing matches', async () => {
        api.exportShopList.mockResolvedValue({ success: true, data: [], total: 0, truncated: false });
        render(<ExportButton shopId="shop1" entity="sales" title="المبيعات" filters={filters} />);

        await choose('Excel');

        await waitFor(() => expect(toast.info).toHaveBeenCalled());
        expect(downloaded).toHaveLength(0);
    });

    it('shows the server error message and re-enables the button', async () => {
        api.exportShopList.mockRejectedValue(new Error('المحل الأول: طلبات كتير'));
        render(<ExportButton shopId="shop1" entity="sales" title="المبيعات" filters={filters} />);

        await choose('Excel');

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('المحل الأول: طلبات كتير'));
        expect(screen.getByRole('button', { name: 'تصدير' })).toBeEnabled();
    });

    it('still exports if the shop name cannot be loaded', async () => {
        api.getShopSettings.mockRejectedValue(new Error('x'));
        api.exportShopList.mockResolvedValue({ success: true, data: [sale], total: 1, truncated: false });
        render(<ExportButton shopId="shop1" entity="sales" title="المبيعات" filters={{ ...filters, from: '', to: '' }} />);

        await choose('Excel');

        await waitFor(() => expect(downloaded).toHaveLength(1));
        expect(downloaded[0].fileName).toMatch(/^المبيعات - \d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('closes the menu with Escape', async () => {
        render(<ExportButton shopId="shop1" entity="sales" title="المبيعات" filters={filters} />);
        await userEvent.click(screen.getByRole('button', { name: 'تصدير' }));
        expect(screen.getByRole('menu')).toBeInTheDocument();
        await userEvent.keyboard('{Escape}');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('file name helper', () => {
        expect(exportFileBase({ shopName: 'م', title: 'ت', from: '2026-01-01', to: '' })).toBe('م - ت - 2026-01-01 إلى …');
    });
});
