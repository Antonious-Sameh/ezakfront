/**
 * Declarative config for every shop list section.
 * ResourceListPage reads one of these and renders filters, table, mobile
 * cards, pagination and the detail modal — no per-section JSX duplication.
 */
import React from 'react';
import {
    ArrowDownCircle, ArrowUpCircle, Boxes, ClipboardList, Receipt, ShoppingCart,
    Users, Truck, Wallet, Activity as ActivityIcon,
} from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/format';
import { PAYMENT_LABELS, ACTIVITY_LABELS_REAL, AR_LOCALE } from '@/lib/constants';

const num = (v) => formatNumber(v, { locale: AR_LOCALE });
/** Plain money text: Arabic digits, at most 2 decimals. */
export const moneyText = (v) => formatNumber(v, { locale: AR_LOCALE, maximumFractionDigits: 2 });

/**
 * A money amount as shown everywhere in the dashboard: the number, then a
 * small muted "ج.م" — same treatment as the shop cards on the overview.
 */
export function Money({ value, className = '' }) {
    return (
        <span className={`whitespace-nowrap tabular-nums ${className}`}>
            {moneyText(value)}
            <span className="ms-1 text-[0.7em] font-normal text-muted-foreground">ج.م</span>
        </span>
    );
}
const money = (v) => <Money value={v} />;
/** Money that may be absent / zero-meaningless: "—" instead of a misleading 0. */
const optionalMoney = (v) => (v === undefined || v === null || v === '' || Number(v) === 0 ? '—' : money(v));
/** What is still owed: highlighted when > 0, "—" when settled. */
const owed = (v) => (Number(v) > 0 ? <Money value={v} className="font-semibold text-rose-600 dark:text-rose-400" /> : '—');
const shortDate = (v) => {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(AR_LOCALE, { year: 'numeric', month: 'short', day: 'numeric' });
};
const fullDate = (v) => formatDate(v, { locale: AR_LOCALE });
/** Date + time, for the activity log where the time of day matters. */
export const dateTime = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(AR_LOCALE, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
/** A number that may legitimately be absent: shows "—" instead of a misleading 0. */
const optionalNum = (v) => (v === undefined || v === null || v === '' ? '—' : num(v));
const cleanDescription = (v, row) => (v && v !== row.category ? v : '—');

/** What created a cashbox movement — the shops' CASHBOX_REF_TYPES. */
export const CASHBOX_SOURCE_LABELS = {
    sale: 'فاتورة بيع',
    purchase: 'فاتورة شراء',
    expense: 'مصروف',
    manual: 'حركة يدوية',
    customer_payment: 'سداد عميل',
    supplier_payment: 'سداد لمورد',
    customer_credit_payout: 'صرف رصيد لعميل',
    supplier_credit_receipt: 'استلام رصيد من مورد',
    customer_loan: 'سلفة عميل',
};

const PAYMENT_STATUS = {
    paid: { label: 'مدفوعة بالكامل', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dotCls: 'bg-emerald-500' },
    partial: { label: 'مدفوعة جزئياً', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dotCls: 'bg-amber-500' },
    unpaid: { label: 'غير مدفوعة', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', dotCls: 'bg-rose-500' },
};

const STATUS_BADGE = {
    ok: { label: 'متوفر', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dotCls: 'bg-emerald-500' },
    low: { label: 'ناقص', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dotCls: 'bg-amber-500' },
    out: { label: 'نفد', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', dotCls: 'bg-rose-500' },
    completed: { label: 'مكتملة', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dotCls: 'bg-emerald-500' },
    returned: { label: 'مرتجعة', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', dotCls: 'bg-rose-500' },
    received: { label: 'مستلمة', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dotCls: 'bg-emerald-500' },
    pending: { label: 'معلقة', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dotCls: 'bg-amber-500' },
};

function Badge({ status }) {
    const b = STATUS_BADGE[status];
    if (!b) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors shadow-xs ${b.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${b.dotCls}`} />
            {b.label}
        </span>
    );
}

export function PaymentStatusBadge({ status }) {
    const b = PAYMENT_STATUS[status];
    if (!b) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight shadow-xs ${b.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${b.dotCls}`} />
            {b.label}
        </span>
    );
}

/**
 * Invoice money breakdown: subtotal → discount → total (highlighted) →
 * paid / remaining. Rows the shop didn't send (older data) are skipped,
 * and a zero discount isn't shown at all.
 */
export function InvoiceTotals({ item, totalLabel = 'الإجمالي النهائي' }) {
    const hasDiscount = Number(item.discount) > 0;
    const rows = [];
    if (hasDiscount) {
        rows.push({ key: 'subtotal', label: 'الإجمالي قبل الخصم', value: money(item.subtotal) });
        rows.push({ key: 'discount', label: 'الخصم', value: <>− {money(item.discount)}</>, cls: 'text-rose-600 dark:text-rose-400' });
    }
    return (
        <div className="flex flex-col gap-2.5" data-testid="invoice-totals">
            {rows.length ? (
                <dl className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                    {rows.map((r) => (
                        <div key={r.key} className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground">{r.label}</dt>
                            <dd className={`font-semibold tabular-nums text-foreground ${r.cls || ''}`}>{r.value}</dd>
                        </div>
                    ))}
                </dl>
            ) : null}
            <div className="flex items-center justify-between rounded-xl bg-primary px-5 py-3.5 text-primary-foreground shadow-md">
                <span className="text-sm font-medium opacity-90">{totalLabel}</span>
                <span className="font-display text-xl font-extrabold tracking-tight tabular-nums">{moneyText(item.total)} <span className="text-sm font-semibold opacity-80">ج.م</span></span>
            </div>
            {item.paid !== undefined && item.paid !== null ? (
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
                        <p className="text-xs font-medium text-muted-foreground">المدفوع</p>
                        <p className="font-display text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{money(item.paid)}</p>
                    </div>
                    <div className={`rounded-lg border px-4 py-2.5 ${Number(item.remaining) > 0 ? 'border-rose-500/20 bg-rose-500/5' : 'border-border/60 bg-muted/20'}`}>
                        <p className="text-xs font-medium text-muted-foreground">المتبقي</p>
                        <p className={`font-display text-base font-bold tabular-nums ${Number(item.remaining) > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-foreground'}`}>{money(item.remaining)}</p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

/** Label/value rows used inside the detail modal. Fields with no value are skipped. */
function DetailGrid({ fields }) {
    const visible = fields.filter((f) => f.value !== undefined && f.value !== null && f.value !== '');
    if (!visible.length) return null;
    return (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((f) => (
                <div key={f.label} className="flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                    <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                    <dd className="text-sm font-semibold text-foreground tracking-tight">{f.value ?? '—'}</dd>
                </div>
            ))}
        </dl>
    );
}

/** Items table for invoices (sales / purchases). */
function ItemsTable({ items, moneyKey }) {
    return (
        <div className="overflow-hidden rounded-lg border border-border shadow-xs">
            <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/70 text-xs text-muted-foreground border-b border-border">
                    <tr>
                        <th className="px-3.5 py-2.5 text-start font-semibold">المنتج</th>
                        <th className="px-3.5 py-2.5 text-center font-semibold">الكمية</th>
                        <th className="px-3.5 py-2.5 text-end font-semibold">السعر</th>
                        <th className="px-3.5 py-2.5 text-end font-semibold">الإجمالي</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-card-foreground">
                    {(items || []).map((it, i) => (
                        <tr key={i} className="transition-colors hover:bg-muted/40">
                            <td className="px-3.5 py-2.5 text-start font-medium text-foreground">
                                {it.productName}
                                {it.code ? <span className="ms-2 font-mono text-[11px] text-muted-foreground" dir="ltr">{it.code}</span> : null}
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-mono text-xs tabular-nums text-muted-foreground">{num(it.qty)}</td>
                            <td className="px-3.5 py-2.5 text-end font-mono text-xs tabular-nums text-muted-foreground">{moneyText(it[moneyKey === 'cost' ? 'cost' : 'price'])}</td>
                            <td className="px-3.5 py-2.5 text-end font-mono text-xs font-semibold tabular-nums text-foreground">{moneyText(it.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const allOption = { value: 'all', label: 'الكل' };
const paymentTypeFilter = {
    key: 'paymentType', label: 'نوع الدفع',
    options: [allOption, { value: 'cash', label: 'نقدي' }, { value: 'credit', label: 'آجل' }],
};

/*
 * `filters` = what each shop's /api/admin list endpoint REALLY accepts
 * (checked against Shops 1-4's admin.route.js zod schemas). Anything else
 * would be silently dropped by the shop, so it isn't shown:
 *   products            search + stock status (no dates)
 *   customers/suppliers search only
 *   sales/purchases     search + dates + payment type
 *   cashbox             search (in the statement) + dates + in/out
 *   expenses            dates + reason (no free-text search)
 *   activity            dates + type (no free-text search)
 */

export const SECTION_CONFIGS = {
    sales: {
        key: 'sales', entity: 'sales', title: 'المبيعات', subtitle: 'كل فواتير البيع للمحل',
        printKind: 'sale', // details get a "طباعة" button (see PrintInvoiceButton)
        icon: Receipt, searchPlaceholder: 'ابحث برقم الفاتورة أو اسم العميل…',
        filters: { search: true, dates: true },
        extraFilters: [paymentTypeFilter],
        columns: [
            { key: 'invoiceNo', label: 'الفاتورة', primary: true, mobile: true },
            { key: 'customerName', label: 'العميل', mobile: true },
            { key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
            { key: 'paymentType', label: 'الدفع', render: (v) => PAYMENT_LABELS[v] || v || '—' },
            { key: 'paymentStatus', label: 'السداد', render: (v) => <PaymentStatusBadge status={v} />, mobile: true },
            { key: 'remaining', label: 'المتبقي', render: owed, align: 'end', numeric: true },
            { key: 'total', label: 'الإجمالي', render: (v) => <Money value={v} className="font-semibold text-foreground" />, align: 'end', numeric: true, mobile: true },
        ],
        renderDetail: (item) => (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="space-y-0.5">
                        <p className="font-display text-xl font-bold tracking-tight text-foreground">{item.invoiceNo}</p>
                        <p className="text-xs font-medium text-muted-foreground">{fullDate(item.date)}</p>
                    </div>
                    <PaymentStatusBadge status={item.paymentStatus} />
                </div>
                <DetailGrid fields={[
                    { label: 'العميل', value: item.customerName },
                    { label: 'نوع الدفع', value: PAYMENT_LABELS[item.paymentType] || item.paymentType },
                    { label: 'ربح الفاتورة', value: item.profit === undefined || item.profit === null ? undefined : money(item.profit) },
                ]} />
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">عناصر الفاتورة</p>
                    <ItemsTable items={item.items} moneyKey="price" />
                </div>
                <InvoiceTotals item={item} />
            </div>
        ),
    },

    purchases: {
        key: 'purchases', entity: 'purchases', title: 'المشتريات', subtitle: 'فواتير المشتريات من الموردين',
        printKind: 'purchase',
        icon: ShoppingCart, searchPlaceholder: 'ابحث برقم الفاتورة أو اسم المورد…',
        filters: { search: true, dates: true },
        extraFilters: [paymentTypeFilter],
        columns: [
            { key: 'invoiceNo', label: 'الفاتورة', primary: true, mobile: true },
            { key: 'supplierName', label: 'المورد', mobile: true },
            { key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
            { key: 'paymentType', label: 'الدفع', render: (v) => PAYMENT_LABELS[v] || v || '—' },
            { key: 'paymentStatus', label: 'السداد', render: (v) => <PaymentStatusBadge status={v} />, mobile: true },
            { key: 'remaining', label: 'المتبقي', render: owed, align: 'end', numeric: true },
            { key: 'total', label: 'الإجمالي', render: (v) => <Money value={v} className="font-semibold text-foreground" />, align: 'end', numeric: true, mobile: true },
        ],
        renderDetail: (item) => (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="space-y-0.5">
                        <p className="font-display text-xl font-bold tracking-tight text-foreground">{item.invoiceNo}</p>
                        <p className="text-xs font-medium text-muted-foreground">{fullDate(item.date)}</p>
                    </div>
                    <PaymentStatusBadge status={item.paymentStatus} />
                </div>
                <DetailGrid fields={[
                    { label: 'المورد', value: item.supplierName },
                    { label: 'نوع الدفع', value: PAYMENT_LABELS[item.paymentType] || item.paymentType },
                    { label: 'ملاحظات', value: item.notes },
                ]} />
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">عناصر الفاتورة</p>
                    <ItemsTable items={item.items} moneyKey="cost" />
                </div>
                <InvoiceTotals item={item} totalLabel="الإجمالي" />
            </div>
        ),
    },

    products: {
        key: 'products', entity: 'products', title: 'المخزون', subtitle: 'المنتجات والكميات المتاحة',
        icon: Boxes, searchPlaceholder: 'ابحث باسم المنتج أو الكود…',
        filters: { search: true, dates: false },
        extraFilters: [
            { key: 'status', label: 'الحالة', options: [allOption, { value: 'ok', label: 'متوفر' }, { value: 'low', label: 'ناقص' }, { value: 'out', label: 'نفد' }] },
        ],
        columns: [
            { key: 'name', label: 'المنتج', primary: true, mobile: true },
            { key: 'sku', label: 'الكود', render: (v) => (v ? <span dir="ltr" className="font-mono text-xs">{v}</span> : '—'), mobile: true },
            { key: 'status', label: 'الحالة', render: (v) => <Badge status={v} />, mobile: true },
            { key: 'cost', label: 'التكلفة', render: money, align: 'end', numeric: true },
            { key: 'price', label: 'سعر البيع', render: money, align: 'end', numeric: true },
            { key: 'stock', label: 'المخزون', render: (v, row) => `${num(v)}${row.unit ? ` ${row.unit}` : ''}`, align: 'end', numeric: true, mobile: true },
        ],
        renderDetail: (item) => (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="flex min-w-0 items-center gap-3">
                        {item.image ? (
                            <img src={item.image} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover" />
                        ) : null}
                        <p className="font-display text-xl font-bold tracking-tight text-foreground">{item.name}</p>
                    </div>
                    <Badge status={item.status} />
                </div>
                <DetailGrid fields={[
                    { label: 'الكود', value: item.sku ? <span dir="ltr" className="font-mono">{item.sku}</span> : undefined },
                    { label: 'التصنيف', value: item.category },
                    { label: 'سعر البيع', value: money(item.price) },
                    { label: 'التكلفة', value: money(item.cost) },
                    { label: 'المخزون', value: `${num(item.stock)}${item.unit ? ` ${item.unit}` : ''}` },
                    { label: 'حد التنبيه', value: optionalNum(item.lowStockThreshold) },
                    { label: 'المورد', value: item.supplierName },
                    { label: 'قيمة المخزون (بالتكلفة)', value: money((item.cost || 0) * (item.stock || 0)) },
                    { label: 'ملاحظات', value: item.notes },
                ]} />
            </div>
        ),
    },

    customers: {
        key: 'customers', entity: 'customers', title: 'العملاء', subtitle: 'قائمة عملاء المحل',
        icon: Users, searchPlaceholder: 'ابحث بالاسم أو رقم الهاتف…',
        filters: { search: true, dates: false },
        extraFilters: [],
        columns: [
            { key: 'name', label: 'الاسم', primary: true, mobile: true },
            { key: 'phone', label: 'الهاتف', mobile: true, ltr: true },
            { key: 'address', label: 'العنوان' },
            { key: 'totalOrders', label: 'الفواتير', render: num, align: 'end', numeric: true },
            { key: 'totalSpent', label: 'إجمالي الشراء', render: money, align: 'end', numeric: true },
            { key: 'balance', label: 'عليه', render: owed, align: 'end', numeric: true, mobile: true, mobileLabel: 'عليه', hideEmptyOnMobile: true },
        ],
        renderDetail: (item) => (
            <div className="flex flex-col gap-6">
                <div className="border-b border-border/60 pb-4">
                    <p className="font-display text-xl font-bold tracking-tight text-foreground">{item.name}</p>
                </div>
                <DetailGrid fields={[
                    { label: 'الهاتف', value: item.phone ? <span dir="ltr" className="inline-block">{item.phone}</span> : undefined },
                    { label: 'البريد الإلكتروني', value: item.email },
                    { label: 'العنوان', value: item.address },
                    { label: 'إجمالي الفواتير', value: num(item.totalOrders) },
                    { label: 'إجمالي الشراء', value: money(item.totalSpent) },
                    { label: 'إجمالي المدفوع', value: item.totalPaid === undefined ? undefined : money(item.totalPaid) },
                    { label: 'المتبقي عليه', value: Number(item.balance) > 0 ? owed(item.balance) : 'لا يوجد' },
                    { label: 'تاريخ التسجيل', value: fullDate(item.createdAt) },
                ]} />
            </div>
        ),
    },

    suppliers: {
        key: 'suppliers', entity: 'suppliers', title: 'الموردين', subtitle: 'قائمة موردي المحل',
        icon: Truck, searchPlaceholder: 'ابحث باسم المورد أو رقم الهاتف…',
        filters: { search: true, dates: false },
        extraFilters: [],
        columns: [
            { key: 'name', label: 'المورد', primary: true, mobile: true },
            { key: 'phone', label: 'الهاتف', mobile: true, ltr: true },
            { key: 'totalPurchases', label: 'الفواتير', render: num, align: 'end', numeric: true },
            { key: 'totalAmount', label: 'إجمالي التعامل', render: money, align: 'end', numeric: true },
            { key: 'balance', label: 'له', render: owed, align: 'end', numeric: true, mobile: true, mobileLabel: 'له', hideEmptyOnMobile: true },
        ],
        renderDetail: (item) => (
            <div className="flex flex-col gap-6">
                <div className="border-b border-border/60 pb-4">
                    <p className="font-display text-xl font-bold tracking-tight text-foreground">{item.name}</p>
                </div>
                <DetailGrid fields={[
                    { label: 'المسؤول', value: item.contactPerson },
                    { label: 'الهاتف', value: item.phone ? <span dir="ltr" className="inline-block">{item.phone}</span> : undefined },
                    { label: 'العنوان', value: item.address },
                    { label: 'البريد الإلكتروني', value: item.email },
                    { label: 'عدد الفواتير', value: num(item.totalPurchases) },
                    { label: 'إجمالي التعامل', value: money(item.totalAmount) },
                    { label: 'إجمالي المدفوع', value: item.totalPaid === undefined ? undefined : money(item.totalPaid) },
                    { label: 'المتبقي له', value: Number(item.balance) > 0 ? owed(item.balance) : 'لا يوجد' },
                    { label: 'تاريخ التعامل', value: fullDate(item.createdAt) },
                ]} />
            </div>
        ),
    },

    expenses: {
        key: 'expenses', entity: 'expenses', title: 'المصروفات', subtitle: 'مصروفات المحل',
        icon: Wallet, searchPlaceholder: '',
        filters: { search: false, dates: true },
        // Options come from the shop's real recorded reasons (the shop
        // matches them exactly) — loaded by ResourceListPage.
        extraFilters: [
            { key: 'category', label: 'البند', optionsSource: 'expenseReasons', options: [allOption] },
        ],
        columns: [
            { key: 'category', label: 'البند', primary: true, mobile: true },
            { key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
            { key: 'description', label: 'التفاصيل', render: cleanDescription, wrap: true },
            { key: 'amount', label: 'المبلغ', render: money, align: 'end', numeric: true, mobile: true },
        ],
        renderDetail: (item) => (
            <div className="flex flex-col gap-6">
                <div className="border-b border-border/60 pb-4">
                    <p className="font-display text-xl font-bold tracking-tight text-foreground">{item.category}</p>
                </div>
                <DetailGrid fields={[
                    { label: 'المبلغ', value: money(item.amount) },
                    { label: 'التاريخ', value: fullDate(item.date) },
                    { label: 'طريقة الدفع', value: ({ cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل' }[item.method]) },
                    { label: 'المستفيد', value: item.beneficiary },
                    { label: 'التفاصيل', value: item.description !== item.category ? item.description : undefined },
                ]} />
            </div>
        ),
    },

    cashbox: {
        key: 'cashbox', entity: 'cashbox', title: 'الكاشير', subtitle: 'حركة النقدية داخل وخارج',
        icon: ClipboardList, searchPlaceholder: 'ابحث في بيان الحركة…',
        filters: { search: true, dates: true },
        extraFilters: [
            { key: 'type', label: 'النوع', options: [allOption, { value: 'in', label: 'داخل' }, { value: 'out', label: 'خارج' }] },
        ],
        columns: [
            { key: 'type', label: 'النوع', render: (v) => (v === 'in' ? <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400"><ArrowDownCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />داخل</span> : <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400"><ArrowUpCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />خارج</span>), mobile: true },
            { key: 'amount', label: 'المبلغ', render: (v, row) => <Money value={v} className={`font-semibold ${row.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />, align: 'end', numeric: true, mobile: true },
            { key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
            { key: 'category', label: 'البيان', mobile: true, wrap: true, primary: true },
            { key: 'source', label: 'المصدر', render: (v) => CASHBOX_SOURCE_LABELS[v] || v || '—' },
        ],
        renderDetail: (item) => (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <p className="font-display text-xl font-bold tracking-tight text-foreground">{item.type === 'in' ? 'حركة داخلية' : 'حركة خارجية'}</p>
                    <span className={`font-display text-2xl font-extrabold tabular-nums ${item.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{item.type === 'in' ? '+' : '−'}{moneyText(item.amount)} <span className="text-sm font-semibold">ج.م</span></span>
                </div>
                <DetailGrid fields={[
                    { label: 'البيان', value: item.category },
                    { label: 'المصدر', value: CASHBOX_SOURCE_LABELS[item.source] || item.source },
                    { label: 'التاريخ', value: fullDate(item.date) },
                    { label: 'الطريقة', value: ({ cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل' }[item.method]) },
                    { label: 'ملاحظات', value: item.description !== item.category ? item.description : undefined },
                ]} />
            </div>
        ),
    },

    activity: {
        key: 'activity', entity: 'activity', title: 'سجل النشاط', subtitle: 'آخر العمليات على المحل',
        icon: ActivityIcon, searchPlaceholder: '',
        filters: { search: false, dates: true },
        // The shops have no single-activity endpoint and each row already
        // shows everything there is: rows are NOT clickable. An entry written
        // for an invoice links to that invoice instead (see rowAction).
        rowDetail: false,
        rowAction: (row) => (row.ref ? { label: 'عرض الفاتورة', ref: row.ref } : null),
        extraFilters: [
            { key: 'type', label: 'النوع', options: [allOption, ...Object.entries(ACTIVITY_LABELS_REAL).map(([value, label]) => ({ value, label }))] },
        ],
        columns: [
            { key: 'type', label: 'النوع', render: (v) => <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs">{ACTIVITY_LABELS_REAL[v] || v}</span>, mobile: true },
            { key: 'description', label: 'الوصف', primary: true, mobile: true, wrap: true },
            { key: 'date', label: 'التاريخ والوقت', render: dateTime, mobile: true },
            // No amount (e.g. "product added") → "—" in the table, and nothing
            // at all in the phone card (see ResourceListPage trailingValue).
            { key: 'amount', label: 'المبلغ', render: optionalMoney, align: 'end', numeric: true, mobile: true, hideEmptyOnMobile: true },
        ],
        renderDetail: null,
    },
};

/** Ordered list for navigation (sidebar / mobile tabs). */
export const SHOP_SECTIONS = [
    { key: '', label: 'نظرة عامة', icon: ClipboardList },
    { key: 'sales', label: 'المبيعات', icon: Receipt },
    { key: 'purchases', label: 'المشتريات', icon: ShoppingCart },
    { key: 'products', label: 'المخزون', icon: Boxes },
    { key: 'customers', label: 'العملاء', icon: Users },
    { key: 'suppliers', label: 'الموردين', icon: Truck },
    { key: 'expenses', label: 'المصروفات', icon: Wallet },
    { key: 'cashbox', label: 'الكاشير', icon: ClipboardList },
    { key: 'activity', label: 'سجل النشاط', icon: ActivityIcon },
    { key: 'reports', label: 'التقارير', icon: ClipboardList },
];

/** Sections shown directly in the mobile bottom tab bar; the rest go under "المزيد". */
export const MOBILE_PRIMARY_SECTIONS = ['', 'sales', 'products', 'cashbox'];
export const REPORTS_SECTION = { key: 'reports', label: 'التقارير', icon: ClipboardList };