import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/api', () => ({ api: { getShopSettings: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));
vi.mock('sonner', () => ({ toast: { warning: vi.fn() } }));

const { api } = await import('@/lib/api');
const { toast } = await import('sonner');
const { shopSettingsCache } = await import('@/lib/shopSettingsCache');
const { default: PrintInvoiceButton } = await import('@/components/print/PrintInvoiceButton');

const invoice = { invoiceNo: 'INV-9', total: 100, items: [{ productName: 'صنف', qty: 1, price: 100, total: 100 }] };

beforeEach(() => {
    vi.clearAllMocks();
    shopSettingsCache.clear();
    window.print = vi.fn();
    document.getElementById('print-root')?.remove();
});

describe('PrintInvoiceButton', () => {
    it('loads the shop header, renders the invoice into #print-root, then opens the print dialog', async () => {
        api.getShopSettings.mockResolvedValue({ success: true, data: { shopName: 'محل النور', phone: '0100' } });
        render(<PrintInvoiceButton shopId="shop1" kind="sale" invoice={invoice} />);

        await userEvent.click(screen.getByRole('button', { name: 'طباعة' }));

        await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1));
        const root = document.getElementById('print-root');
        expect(root).not.toBeNull();
        expect(root.parentElement).toBe(document.body);
        expect(root).toHaveTextContent('محل النور');
        expect(root).toHaveTextContent('#INV-9');
        expect(api.getShopSettings).toHaveBeenCalledWith('tok', 'shop1');
    });

    it('fetches the shop header once per shop, then reuses it', async () => {
        api.getShopSettings.mockResolvedValue({ success: true, data: { shopName: 'محل النور' } });
        render(<PrintInvoiceButton shopId="shop1" kind="sale" invoice={invoice} />);
        const button = screen.getByRole('button', { name: 'طباعة' });

        await userEvent.click(button);
        await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1));
        window.dispatchEvent(new Event('afterprint'));
        await userEvent.click(button);
        await waitFor(() => expect(window.print).toHaveBeenCalledTimes(2));

        expect(api.getShopSettings).toHaveBeenCalledTimes(1);
    });

    it('still prints (without the header) and warns, if the shop header cannot be loaded', async () => {
        api.getShopSettings.mockRejectedValue(new Error('down'));
        render(<PrintInvoiceButton shopId="shop1" kind="sale" invoice={invoice} />);

        await userEvent.click(screen.getByRole('button', { name: 'طباعة' }));

        await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1));
        expect(toast.warning).toHaveBeenCalled();
        expect(document.getElementById('print-root')).toHaveTextContent('#INV-9');
    });

    it('removes the printed invoice after printing', async () => {
        api.getShopSettings.mockResolvedValue({ success: true, data: {} });
        render(<PrintInvoiceButton shopId="shop1" kind="sale" invoice={invoice} />);

        await userEvent.click(screen.getByRole('button', { name: 'طباعة' }));
        await waitFor(() => expect(window.print).toHaveBeenCalled());
        window.dispatchEvent(new Event('afterprint'));

        await waitFor(() => expect(document.getElementById('print-root')).toBeEmptyDOMElement());
    });
});
