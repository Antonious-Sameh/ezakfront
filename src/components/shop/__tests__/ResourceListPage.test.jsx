import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/api', () => ({
    api: { getShopList: vi.fn(), getShopItem: vi.fn(), getExpenseReasons: vi.fn(), getShopSettings: vi.fn() },
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));

const { api } = await import('@/lib/api');
const { default: ResourceListPage } = await import('@/components/shop/ResourceListPage');
const { SECTION_CONFIGS } = await import('@/components/shop/sectionConfigs');

const sale = {
    id: 's1',
    invoiceNo: 'INV-77',
    customerName: 'أحمد سالم',
    date: '2026-09-20T10:00:00Z',
    subtotal: 520,
    discount: 20,
    total: 500,
    paid: 300,
    remaining: 200,
    paymentStatus: 'partial',
    profit: 80,
    paymentType: 'credit',
    status: 'completed',
    items: [{ productName: 'فلتر زيت', code: 'F-1', qty: 2, price: 260, total: 520 }],
};

function listOf(rows) {
    return { success: true, data: rows, pagination: { page: 1, totalPages: 1, total: rows.length } };
}

function renderSection(key) {
    return render(<ResourceListPage shopId="shop1" config={SECTION_CONFIGS[key]} />);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('sales rows open their details instantly from the row itself', () => {
    it('opens the invoice without any extra request, showing discount / paid / remaining', async () => {
        api.getShopList.mockResolvedValue(listOf([sale]));
        renderSection('sales');

        const rows = await screen.findAllByRole('button', { name: /INV-77/ });
        await userEvent.click(rows[0]);

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('INV-77')).toBeInTheDocument();
        expect(within(dialog).getByText('فلتر زيت')).toBeInTheDocument();
        expect(within(dialog).getByText('الخصم')).toBeInTheDocument();
        expect(within(dialog).getByText('المدفوع')).toBeInTheDocument();
        expect(within(dialog).getByText('المتبقي')).toBeInTheDocument();
        expect(within(dialog).getByText('مدفوعة جزئياً')).toBeInTheDocument();
        expect(api.getShopItem).not.toHaveBeenCalled();
    });

    it('no longer shows the always-empty seller / tax fields (tax used to render a misleading 0)', async () => {
        api.getShopList.mockResolvedValue(listOf([sale]));
        renderSection('sales');

        await userEvent.click((await screen.findAllByRole('button', { name: /INV-77/ }))[0]);
        const dialog = screen.getByRole('dialog');

        expect(within(dialog).queryByText('الضريبة')).not.toBeInTheDocument();
        expect(within(dialog).queryByText('البائع')).not.toBeInTheDocument();
    });

    it('hides the subtotal/discount rows when there is no discount', async () => {
        api.getShopList.mockResolvedValue(listOf([{ ...sale, discount: 0, subtotal: 500 }]));
        renderSection('sales');

        await userEvent.click((await screen.findAllByRole('button', { name: /INV-77/ }))[0]);
        const dialog = screen.getByRole('dialog');

        expect(within(dialog).queryByText('الخصم')).not.toBeInTheDocument();
        expect(within(dialog).getByText('الإجمالي النهائي')).toBeInTheDocument();
    });

    it('opens from the keyboard (Enter on a focused row) and closes with Escape', async () => {
        api.getShopList.mockResolvedValue(listOf([sale]));
        renderSection('sales');

        const [row] = await screen.findAllByRole('button', { name: /INV-77/ });
        row.focus();
        fireEvent.keyDown(row, { key: 'Enter' });
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

describe.each(['cashbox', 'expenses', 'products', 'customers', 'suppliers', 'purchases'])('%s', (key) => {
    it('opens details from the row without calling the item endpoint', async () => {
        const row = {
            id: 'r1', name: 'صف تجريبي', invoiceNo: 'X-1', category: 'صف تجريبي', type: 'in', amount: 10, items: [], total: 10,
        };
        api.getShopList.mockResolvedValue(listOf([row]));
        renderSection(key);

        const buttons = await screen.findAllByRole('button', { name: /صف تجريبي|X-1|داخل/ });
        await userEvent.click(buttons[0]);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(api.getShopItem).not.toHaveBeenCalled();
    });
});

describe('activity log', () => {
    const saleActivity = {
        id: 'a1', type: 'sale', description: 'تم إنشاء فاتورة بيع رقم 77', amount: 500,
        ref: { entity: 'sales', id: 's1' }, date: '2026-09-20T10:00:00Z',
    };
    const productActivity = {
        id: 'a2', type: 'product', description: 'تمت إضافة منتج جديد: فلتر', ref: null, date: '2026-09-20T09:00:00Z',
    };

    it('rows are not clickable and never request an activity detail', async () => {
        api.getShopList.mockResolvedValue(listOf([productActivity]));
        renderSection('activity');

        const texts = await screen.findAllByText('تمت إضافة منتج جديد: فلتر');
        await userEvent.click(texts[0]);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /تمت إضافة منتج/ })).not.toBeInTheDocument();
        expect(api.getShopItem).not.toHaveBeenCalled();
    });

    it('shows everything in the row itself: type, description, amount, date with time', async () => {
        api.getShopList.mockResolvedValue(listOf([saleActivity]));
        renderSection('activity');

        expect((await screen.findAllByText('تم إنشاء فاتورة بيع رقم 77')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('بيع').length).toBeGreaterThan(0);
        expect(screen.getAllByText('٥٠٠').length).toBeGreaterThan(0);
        expect(screen.queryByText('المستخدم')).not.toBeInTheDocument(); // always-empty column removed
    });

    it('an invoice entry offers "عرض الفاتورة", which opens that invoice', async () => {
        api.getShopList.mockResolvedValue(listOf([saleActivity]));
        api.getShopItem.mockResolvedValue({ success: true, data: sale });
        renderSection('activity');

        const [open] = await screen.findAllByRole('button', { name: 'عرض الفاتورة' });
        await userEvent.click(open);

        expect(api.getShopItem).toHaveBeenCalledWith('tok', 'shop1', 'sales', 's1', { signal: expect.any(AbortSignal) });
        const dialog = await screen.findByRole('dialog');
        await waitFor(() => expect(within(dialog).getByText('INV-77')).toBeInTheDocument());
        expect(within(dialog).getByText('المبيعات')).toBeInTheDocument();
    });

    it('shows the error inside the modal if the invoice cannot be loaded', async () => {
        api.getShopList.mockResolvedValue(listOf([saleActivity]));
        api.getShopItem.mockRejectedValue(new Error('الفاتورة غير موجودة'));
        renderSection('activity');

        await userEvent.click((await screen.findAllByRole('button', { name: 'عرض الفاتورة' }))[0]);

        expect(await screen.findByText('الفاتورة غير موجودة')).toBeInTheDocument();
    });

    it('entries without an invoice have no action button', async () => {
        api.getShopList.mockResolvedValue(listOf([productActivity]));
        renderSection('activity');

        await screen.findAllByText('تمت إضافة منتج جديد: فلتر');
        expect(screen.queryByRole('button', { name: 'عرض الفاتورة' })).not.toBeInTheDocument();
    });
});

describe('filters match what each shop really supports', () => {
    const empty = listOf([]);

    it('activity: no search box (the shop ignores it), but date range + type', async () => {
        api.getShopList.mockResolvedValue(empty);
        renderSection('activity');
        await screen.findByText('مفيش بيانات لسه');

        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
        expect(screen.getByLabelText('من تاريخ')).toBeInTheDocument();
        expect(screen.getByLabelText('النوع')).toBeInTheDocument();
    });

    it('products: search, but no date range', async () => {
        api.getShopList.mockResolvedValue(empty);
        renderSection('products');
        await screen.findByText('مفيش بيانات لسه');

        expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'ابحث باسم المنتج أو الكود…');
        expect(screen.queryByLabelText('من تاريخ')).not.toBeInTheDocument();
    });

    it('purchases: now has the cash / credit filter', async () => {
        api.getShopList.mockResolvedValue(empty);
        renderSection('purchases');
        await screen.findByText('مفيش بيانات لسه');

        expect(screen.getByLabelText('نوع الدفع')).toBeInTheDocument();
    });

    it('expenses: reasons come from the shop\'s real data, and there is no search box', async () => {
        api.getShopList.mockResolvedValue(empty);
        api.getExpenseReasons.mockResolvedValue({ success: true, data: ['إيجار المحل', 'كهربا'], supported: true });
        renderSection('expenses');

        const select = await screen.findByLabelText('البند');
        const options = within(select).getAllByRole('option').map((o) => o.textContent);
        expect(options).toEqual(['الكل', 'إيجار المحل', 'كهربا']);
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('expenses: the reason filter is simply hidden if the shop is not updated yet', async () => {
        api.getShopList.mockResolvedValue(empty);
        api.getExpenseReasons.mockResolvedValue({ success: true, data: [], supported: false });
        renderSection('expenses');
        await screen.findByText('مفيش بيانات لسه');
        await waitFor(() => expect(api.getExpenseReasons).toHaveBeenCalled());

        expect(screen.queryByLabelText('البند')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});

describe('smooth list behaviour', () => {
    const searchCalls = () => api.getShopList.mock.calls.map((c) => c[3].search);

    it('search waits for typing to pause: one request for the whole word, none per letter', async () => {
        api.getShopList.mockResolvedValue(listOf([]));
        renderSection('sales');
        await screen.findByText('مفيش بيانات لسه');
        const box = screen.getByRole('searchbox');

        fireEvent.change(box, { target: { value: 'أ' } });
        fireEvent.change(box, { target: { value: 'أح' } });
        fireEvent.change(box, { target: { value: 'أحمد' } });
        expect(api.getShopList).toHaveBeenCalledTimes(1); // only the initial load so far

        await waitFor(() => expect(api.getShopList).toHaveBeenCalledTimes(2));
        expect(searchCalls()).toEqual(['', 'أحمد']);
    });

    it('Enter searches immediately', async () => {
        api.getShopList.mockResolvedValue(listOf([]));
        renderSection('sales');
        await screen.findByText('مفيش بيانات لسه');
        const box = screen.getByRole('searchbox');

        fireEvent.change(box, { target: { value: 'INV-5' } });
        fireEvent.keyDown(box, { key: 'Enter' });

        await waitFor(() => expect(searchCalls()).toContain('INV-5'));
    });

    it('changing a filter sends exactly ONE request (it used to send two)', async () => {
        api.getShopList.mockResolvedValue(listOf([sale]));
        renderSection('sales');
        await screen.findAllByRole('button', { name: /INV-77/ });

        fireEvent.change(screen.getByLabelText('نوع الدفع'), { target: { value: 'cash' } });

        await waitFor(() => expect(api.getShopList).toHaveBeenCalledTimes(2));
        await new Promise((r) => setTimeout(r, 50));
        expect(api.getShopList).toHaveBeenCalledTimes(2);
        expect(api.getShopList.mock.calls[1][3]).toMatchObject({ page: 1, extras: { paymentType: 'cash' } });
    });

    it('while the next page loads, the current rows stay on screen (no flash to a skeleton)', async () => {
        let resolvePage2;
        api.getShopList
            .mockResolvedValueOnce({ success: true, data: [sale], pagination: { page: 1, totalPages: 2 } })
            .mockImplementationOnce(() => new Promise((r) => { resolvePage2 = r; }));
        renderSection('sales');
        await screen.findAllByRole('button', { name: /INV-77/ });

        await userEvent.click(screen.getAllByRole('button', { name: /التالي|الصفحة التالية/ })[0]);

        expect(screen.getAllByRole('button', { name: /INV-77/ }).length).toBeGreaterThan(0);
        expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();

        resolvePage2({ success: true, data: [{ ...sale, id: 's2', invoiceNo: 'INV-78' }], pagination: { page: 2, totalPages: 2 } });
        expect((await screen.findAllByRole('button', { name: /INV-78/ })).length).toBeGreaterThan(0);
        expect(screen.queryByRole('button', { name: /INV-77/ })).not.toBeInTheDocument();
    });
});

describe('print button on invoices', () => {
    it('sales and purchases details have "طباعة"', async () => {
        api.getShopList.mockResolvedValue(listOf([sale]));
        renderSection('sales');
        await userEvent.click((await screen.findAllByRole('button', { name: /INV-77/ }))[0]);

        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'طباعة' })).toBeInTheDocument();
    });

    it('other sections (e.g. products) have no print button', async () => {
        api.getShopList.mockResolvedValue(listOf([{ id: 'p1', name: 'صنف تجريبي', stock: 1 }]));
        renderSection('products');
        await userEvent.click((await screen.findAllByRole('button', { name: /صنف تجريبي/ }))[0]);

        expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'طباعة' })).not.toBeInTheDocument();
    });

    it('an invoice opened from the activity log can be printed too', async () => {
        api.getShopList.mockResolvedValue(listOf([{
            id: 'a1', type: 'sale', description: 'فاتورة بيع', amount: 500, ref: { entity: 'sales', id: 's1' }, date: '2026-09-20',
        }]));
        api.getShopItem.mockResolvedValue({ success: true, data: sale });
        renderSection('activity');

        await userEvent.click((await screen.findAllByRole('button', { name: 'عرض الفاتورة' }))[0]);
        const dialog = await screen.findByRole('dialog');

        expect(await within(dialog).findByRole('button', { name: 'طباعة' })).toBeInTheDocument();
    });
});

describe('display polish: only columns the shops actually fill', () => {
    const headers = () => screen.getAllByRole('columnheader').map((h) => h.textContent.trim()).filter(Boolean);

    it('sales: payment status and amount still owed instead of the always-empty seller / always-"completed" status', async () => {
        api.getShopList.mockResolvedValue(listOf([sale]));
        renderSection('sales');
        await screen.findAllByRole('button', { name: /INV-77/ });

        expect(headers()).toEqual(['الفاتورة', 'العميل', 'التاريخ', 'الدفع', 'السداد', 'المتبقي', 'الإجمالي']);
        expect(screen.getAllByText('مدفوعة جزئياً').length).toBeGreaterThan(0);
    });

    it('amounts carry the currency', async () => {
        api.getShopList.mockResolvedValue(listOf([sale]));
        renderSection('sales');
        await screen.findAllByRole('button', { name: /INV-77/ });

        expect(screen.getAllByText('ج.م').length).toBeGreaterThan(0);
    });

    it.each([
        ['expenses', ['البند', 'التاريخ', 'التفاصيل', 'المبلغ']],
        ['cashbox', ['النوع', 'المبلغ', 'التاريخ', 'البيان', 'المصدر']],
        ['suppliers', ['المورد', 'الهاتف', 'الفواتير', 'إجمالي التعامل', 'له']],
        ['customers', ['الاسم', 'الهاتف', 'العنوان', 'الفواتير', 'إجمالي الشراء', 'عليه']],
        ['products', ['المنتج', 'الكود', 'الحالة', 'التكلفة', 'سعر البيع', 'المخزون']],
    ])('%s table has no always-empty columns', async (key, expected) => {
        api.getShopList.mockResolvedValue(listOf([{ id: 'r1', name: 'س', category: 'س', type: 'in', amount: 5 }]));
        renderSection(key);
        await screen.findAllByRole('columnheader');

        expect(headers()).toEqual(expected);
    });

    it('activity: an entry with no amount shows nothing (not "—") on the phone card', async () => {
        api.getShopList.mockResolvedValue(listOf([{ id: 'a1', type: 'product', description: 'تمت إضافة منتج', ref: null, date: '2026-09-20' }]));
        renderSection('activity');

        const card = await screen.findByTestId('static-row-card');
        expect(card).not.toHaveTextContent('—');
    });

    it('customers: the phone card labels what the number means ("عليه"), and hides it when nothing is owed', async () => {
        api.getShopList.mockResolvedValue(listOf([
            { id: 'c1', name: 'مدين', phone: '010', balance: 401 },
            { id: 'c2', name: 'خالص', phone: '011', balance: 0 },
        ]));
        renderSection('customers');

        const [owing] = await screen.findAllByRole('button', { name: /مدين/ }).then((b) => b.filter((el) => el.tagName === 'BUTTON'));
        const [settled] = screen.getAllByRole('button', { name: /خالص/ }).filter((el) => el.tagName === 'BUTTON');
        expect(owing).toHaveTextContent('عليه');
        expect(settled).not.toHaveTextContent('عليه');
        expect(settled).not.toHaveTextContent('—');
    });
});
