import { PAYMENT_LABELS, ACTIVITY_LABELS_REAL } from '@/lib/constants';
import { toISODate } from '@/lib/dates';

/**
 * What goes into the exported file for each section — plain values only
 * (numbers stay numbers so Excel can sum them). Separate from the on-screen
 * columns on purpose: a file can hold more than a phone screen.
 *
 * Profit IS exported (this is the owner's own file); it's only kept off
 * the printed customer invoice.
 */

const PAYMENT_STATUS_LABELS = { paid: 'مدفوعة بالكامل', partial: 'مدفوعة جزئياً', unpaid: 'غير مدفوعة' };
const STOCK_LABELS = { ok: 'متوفر', low: 'ناقص', out: 'نفد' };
const CASH_TYPE_LABELS = { in: 'داخل', out: 'خارج' };
const CASHBOX_SOURCE_LABELS = {
    sale: 'فاتورة بيع', purchase: 'فاتورة شراء', expense: 'مصروف', manual: 'حركة يدوية',
    customer_payment: 'سداد عميل', supplier_payment: 'سداد لمورد', customer_credit_payout: 'صرف رصيد لعميل',
    supplier_credit_receipt: 'استلام رصيد من مورد', customer_loan: 'سلفة عميل',
};

const num = (v) => (v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const text = (v) => (v === undefined || v === null ? '' : String(v));

/** Local date (+ time when present) as sortable text: 2026-09-30 14:05 */
export function exportDate(v, { withTime = true } = {}) {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    const day = toISODate(d);
    if (!withTime) return day;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${hh}:${mm}`;
}

const invoiceLines = (partyHeader) => ({
    name: 'أصناف الفواتير',
    columns: [
        { header: 'رقم الفاتورة', width: 16 },
        { header: 'التاريخ', width: 18 },
        { header: partyHeader, width: 22 },
        { header: 'الصنف', width: 28 },
        { header: 'الكود', width: 14 },
        { header: 'الكمية', type: 'number', width: 10 },
        { header: 'السعر', type: 'money', width: 12 },
        { header: 'الإجمالي', type: 'money', width: 14 },
    ],
    rows: (inv) => (inv.items || []).map((it) => [
        text(inv.invoiceNo),
        exportDate(inv.date),
        text(inv.customerName ?? inv.supplierName),
        text(it.productName),
        text(it.code),
        num(it.qty),
        num(it.price ?? it.cost),
        num(it.total),
    ]),
});

const invoiceColumns = (partyHeader, partyKey, { withProfit }) => [
    { header: 'رقم الفاتورة', width: 16, value: (r) => text(r.invoiceNo) },
    { header: 'التاريخ', width: 18, value: (r) => exportDate(r.date) },
    { header: partyHeader, width: 22, value: (r) => text(r[partyKey]) },
    { header: 'نوع الدفع', width: 10, value: (r) => PAYMENT_LABELS[r.paymentType] || text(r.paymentType) },
    { header: 'عدد الأصناف', type: 'number', width: 11, value: (r) => (r.items ? r.items.length : null) },
    { header: 'الإجمالي قبل الخصم', type: 'money', width: 16, value: (r) => num(r.subtotal) },
    { header: 'الخصم', type: 'money', width: 11, value: (r) => num(r.discount) },
    { header: 'الإجمالي', type: 'money', width: 13, value: (r) => num(r.total) },
    { header: 'المدفوع', type: 'money', width: 13, value: (r) => num(r.paid) },
    { header: 'المتبقي', type: 'money', width: 13, value: (r) => num(r.remaining) },
    { header: 'حالة السداد', width: 15, value: (r) => PAYMENT_STATUS_LABELS[r.paymentStatus] || '' },
    ...(withProfit ? [{ header: 'الربح', type: 'money', width: 12, value: (r) => num(r.profit) }] : []),
    ...(!withProfit ? [{ header: 'ملاحظات', width: 24, value: (r) => text(r.notes) }] : []),
];

export const EXPORT_SPECS = {
    sales: {
        columns: invoiceColumns('العميل', 'customerName', { withProfit: true }),
        lines: invoiceLines('العميل'),
    },
    purchases: {
        columns: invoiceColumns('المورد', 'supplierName', { withProfit: false }),
        lines: invoiceLines('المورد'),
    },
    products: {
        columns: [
            { header: 'المنتج', width: 28, value: (r) => text(r.name) },
            { header: 'الكود', width: 14, value: (r) => text(r.sku) },
            { header: 'المخزون', type: 'number', width: 10, value: (r) => num(r.stock) },
            { header: 'حد التنبيه', type: 'number', width: 10, value: (r) => num(r.lowStockThreshold) },
            { header: 'الحالة', width: 9, value: (r) => STOCK_LABELS[r.status] || '' },
            { header: 'سعر البيع', type: 'money', width: 12, value: (r) => num(r.price) },
            { header: 'التكلفة', type: 'money', width: 12, value: (r) => num(r.cost) },
            { header: 'قيمة المخزون (بالتكلفة)', type: 'money', width: 18, value: (r) => (num(r.cost) ?? 0) * (num(r.stock) ?? 0) },
            { header: 'ملاحظات', width: 24, value: (r) => text(r.notes) },
        ],
    },
    customers: {
        columns: [
            { header: 'العميل', width: 24, value: (r) => text(r.name) },
            { header: 'الهاتف', width: 15, value: (r) => text(r.phone) },
            { header: 'العنوان', width: 22, value: (r) => text(r.address) },
            { header: 'عدد الفواتير', type: 'number', width: 11, value: (r) => num(r.totalOrders) },
            { header: 'إجمالي الشراء', type: 'money', width: 14, value: (r) => num(r.totalSpent) },
            { header: 'إجمالي المدفوع', type: 'money', width: 14, value: (r) => num(r.totalPaid) },
            { header: 'الرصيد المتبقي', type: 'money', width: 14, value: (r) => num(r.balance) },
            { header: 'آخر عملية', width: 16, value: (r) => exportDate(r.lastPurchase, { withTime: false }) },
        ],
    },
    suppliers: {
        columns: [
            { header: 'المورد', width: 24, value: (r) => text(r.name) },
            { header: 'الهاتف', width: 15, value: (r) => text(r.phone) },
            { header: 'العنوان', width: 22, value: (r) => text(r.address) },
            { header: 'عدد الفواتير', type: 'number', width: 11, value: (r) => num(r.totalPurchases) },
            { header: 'إجمالي التعامل', type: 'money', width: 14, value: (r) => num(r.totalAmount) },
            { header: 'إجمالي المدفوع', type: 'money', width: 14, value: (r) => num(r.totalPaid) },
            { header: 'الرصيد المتبقي', type: 'money', width: 14, value: (r) => num(r.balance) },
            { header: 'آخر عملية', width: 16, value: (r) => exportDate(r.lastPurchase, { withTime: false }) },
        ],
    },
    cashbox: {
        columns: [
            { header: 'التاريخ', width: 18, value: (r) => exportDate(r.date) },
            { header: 'النوع', width: 8, value: (r) => CASH_TYPE_LABELS[r.type] || text(r.type) },
            { header: 'المبلغ', type: 'money', width: 13, value: (r) => num(r.amount) },
            { header: 'البيان', width: 26, value: (r) => text(r.category) },
            { header: 'المصدر', width: 16, value: (r) => CASHBOX_SOURCE_LABELS[r.source] || text(r.source) },
            { header: 'ملاحظات', width: 24, value: (r) => text(r.notes) },
        ],
    },
    expenses: {
        columns: [
            { header: 'التاريخ', width: 18, value: (r) => exportDate(r.date) },
            { header: 'البند', width: 22, value: (r) => text(r.category) },
            { header: 'المبلغ', type: 'money', width: 13, value: (r) => num(r.amount) },
            { header: 'التفاصيل', width: 30, value: (r) => (r.description && r.description !== r.category ? text(r.description) : '') },
        ],
    },
    activity: {
        columns: [
            { header: 'التاريخ والوقت', width: 18, value: (r) => exportDate(r.date) },
            { header: 'النوع', width: 12, value: (r) => ACTIVITY_LABELS_REAL[r.type] || text(r.type) },
            { header: 'الوصف', width: 50, value: (r) => text(r.description) },
            { header: 'المبلغ', type: 'money', width: 13, value: (r) => num(r.amount) },
        ],
    },
};
