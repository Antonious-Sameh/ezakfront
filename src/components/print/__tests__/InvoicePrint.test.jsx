import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import InvoicePrint from '@/components/print/InvoicePrint';

const settings = { shopName: 'محل النور', phone: '01001234567', address: 'ملوي - المنيا', invoiceFooter: 'شكراً لزيارتكم' };
const sale = {
    invoiceNo: 'INV-77', date: '2026-09-20T10:30:00Z', customerName: 'أحمد سالم', paymentType: 'credit',
    subtotal: 520, discount: 20, total: 500, paid: 300, remaining: 200, paymentStatus: 'partial', profit: 80,
    items: [
        { productName: 'فلتر زيت', code: 'F-1', qty: 2, price: 200, total: 400 },
        { productName: 'شمعة', qty: 3, price: 40, total: 120 },
    ],
};

describe('InvoicePrint', () => {
    it('prints a real receipt: shop header, title, meta, lines, bold total, paid/remaining, footer', () => {
        render(<InvoicePrint kind="sale" invoice={sale} settings={settings} />);

        expect(screen.getByRole('heading', { name: 'محل النور' })).toBeInTheDocument();
        expect(screen.getByText('ملوي - المنيا')).toBeInTheDocument();
        expect(screen.getByText('01001234567')).toBeInTheDocument();
        expect(screen.getByText('فاتورة بيع')).toBeInTheDocument();
        expect(screen.getByText('#INV-77')).toBeInTheDocument();
        expect(screen.getByText('أحمد سالم')).toBeInTheDocument();
        expect(screen.getByText('آجل')).toBeInTheDocument();

        const rows = within(screen.getByRole('table')).getAllByRole('row');
        expect(rows).toHaveLength(3); // header + 2 lines
        expect(within(rows[1]).getByText('فلتر زيت')).toBeInTheDocument();
        expect(within(rows[1]).getByText('F-1')).toBeInTheDocument();

        expect(screen.getByTestId('print-grand-total')).toHaveTextContent('٥٠٠');
        expect(screen.getByTestId('print-grand-total')).toHaveTextContent('ج.م');
        expect(screen.getByText('الخصم')).toBeInTheDocument();
        expect(screen.getByText('المدفوع')).toBeInTheDocument();
        expect(screen.getByText('المتبقي')).toBeInTheDocument();
        expect(screen.getByText('مدفوعة جزئياً')).toBeInTheDocument();
        expect(screen.getByText('شكراً لزيارتكم')).toBeInTheDocument();
    });

    it('counts lines and pieces', () => {
        render(<InvoicePrint kind="sale" invoice={sale} settings={settings} />);
        expect(screen.getByText('٢ / ٥')).toBeInTheDocument();
    });

    it('never prints the profit (internal to the owner)', () => {
        render(<InvoicePrint kind="sale" invoice={sale} settings={settings} />);
        expect(screen.queryByText(/ربح/)).not.toBeInTheDocument();
    });

    it('omits the discount rows when there is no discount', () => {
        render(<InvoicePrint kind="sale" invoice={{ ...sale, discount: 0, subtotal: 500 }} settings={settings} />);
        expect(screen.queryByText('الخصم')).not.toBeInTheDocument();
        expect(screen.queryByText('الإجمالي قبل الخصم')).not.toBeInTheDocument();
    });

    it('prints a purchase with the supplier and notes', () => {
        render(
            <InvoicePrint
                kind="purchase"
                invoice={{ ...sale, invoiceNo: 'PUR-3', customerName: undefined, supplierName: 'شركة الصفا', notes: 'دفعة أكتوبر' }}
                settings={settings}
            />,
        );
        expect(screen.getByText('فاتورة شراء')).toBeInTheDocument();
        expect(screen.getByText('المورد')).toBeInTheDocument();
        expect(screen.getByText('شركة الصفا')).toBeInTheDocument();
        expect(screen.getByText('ملاحظات: دفعة أكتوبر')).toBeInTheDocument();
    });

    it('still renders cleanly with no shop settings at all', () => {
        render(<InvoicePrint kind="sale" invoice={sale} settings={{}} />);
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        expect(screen.getByText('فاتورة بيع')).toBeInTheDocument();
        expect(screen.getByTestId('print-grand-total')).toBeInTheDocument();
    });
});
