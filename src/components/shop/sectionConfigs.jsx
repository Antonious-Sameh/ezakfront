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
import { PAYMENT_LABELS, ACTIVITY_LABELS_REAL, AR_LOCALE } from '@/lib/mockData';

const num = (v) => formatNumber(v, { locale: AR_LOCALE });
const money = (v) => formatNumber(v, { locale: AR_LOCALE });
const shortDate = (v) => {
	if (!v) return '';
	const d = new Date(v);
	return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(AR_LOCALE, { year: 'numeric', month: 'short', day: 'numeric' });
};
const fullDate = (v) => formatDate(v, { locale: AR_LOCALE });

const STATUS_BADGE = {
	ok: { label: 'متوفر', cls: 'bg-emerald-600/10 text-emerald-700' },
	low: { label: 'ناقص', cls: 'bg-accent/10 text-accent' },
	out: { label: 'نفد', cls: 'bg-destructive/10 text-destructive' },
	completed: { label: 'مكتملة', cls: 'bg-emerald-600/10 text-emerald-700' },
	returned: { label: 'مرتجعة', cls: 'bg-destructive/10 text-destructive' },
	received: { label: 'مستلمة', cls: 'bg-emerald-600/10 text-emerald-700' },
	pending: { label: 'معلقة', cls: 'bg-amber-500/15 text-amber-700' },
};

function Badge({ status }) {
	const b = STATUS_BADGE[status];
	if (!b) return null;
	return <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold ${b.cls}`}>{b.label}</span>;
}

/** Label/value rows used inside the detail modal. */
function DetailGrid({ fields }) {
	return (
		<dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
			{fields.map((f) => (
				<div key={f.label} className="flex flex-col gap-1">
					<dt className="text-xs font-semibold text-muted-foreground">{f.label}</dt>
					<dd className="text-sm font-semibold text-foreground">{f.value ?? '—'}</dd>
				</div>
			))}
		</dl>
	);
}

/** Items table for invoices (sales / purchases). */
function ItemsTable({ items, moneyKey }) {
	return (
		<div className="overflow-hidden rounded-md border border-border">
			<table className="w-full text-sm">
				<thead className="bg-muted text-xs text-muted-foreground">
					<tr>
						<th className="px-3 py-2 text-start font-semibold">المنتج</th>
						<th className="px-3 py-2 text-center font-semibold">الكمية</th>
						<th className="px-3 py-2 text-end font-semibold">السعر</th>
						<th className="px-3 py-2 text-end font-semibold">الإجمالي</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{items.map((it, i) => (
						<tr key={i}>
							<td className="px-3 py-2 text-start font-medium text-foreground">{it.productName}</td>
							<td className="px-3 py-2 text-center tabular-nums">{num(it.qty)}</td>
							<td className="px-3 py-2 text-end tabular-nums">{num(it[moneyKey === 'cost' ? 'cost' : 'price'])}</td>
							<td className="px-3 py-2 text-end font-semibold tabular-nums">{num(it.total)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

const allOption = { value: 'all', label: 'الكل' };

export const SECTION_CONFIGS = {
	sales: {
		key: 'sales', entity: 'sales', title: 'المبيعات', subtitle: 'كل فواتير البيع للمحل',
		icon: Receipt, searchPlaceholder: 'ابحث برقم الفاتورة أو اسم العميل…',
		extraFilters: [
			{ key: 'paymentType', label: 'نوع الدفع', options: [allOption, { value: 'cash', label: 'نقدي' }, { value: 'credit', label: 'آجل' }] },
		],
		columns: [
			{ key: 'invoiceNo', label: 'الفاتورة', primary: true, mobile: true },
			{ key: 'customerName', label: 'العميل', mobile: true },
			{ key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
			{ key: 'total', label: 'الإجمالي', render: money, align: 'end', numeric: true, mobile: true },
			{ key: 'paymentType', label: 'الدفع', render: (v) => PAYMENT_LABELS[v] || v },
			{ key: 'status', label: 'الحالة', render: (v) => <Badge status={v} /> },
			{ key: 'cashier', label: 'البائع' },
		],
		renderDetail: (item) => (
			<div className="flex flex-col gap-5">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="font-display text-lg font-semibold text-foreground">{item.invoiceNo}</p>
						<p className="text-xs text-muted-foreground">{fullDate(item.date)}</p>
					</div>
					<Badge status={item.status} />
				</div>
				<DetailGrid fields={[
					{ label: 'العميل', value: item.customerName },
					{ label: 'البائع', value: item.cashier },
					{ label: 'نوع الدفع', value: PAYMENT_LABELS[item.paymentType] },
					{ label: 'الإجمالي الفرعي', value: num(item.subtotal) },
					{ label: 'الخصم', value: item.discount ? num(item.discount) : 'لا يوجد' },
					{ label: 'الضريبة', value: num(item.tax) },
				]} />
				<div>
					<p className="mb-2 text-xs font-semibold text-muted-foreground">عناصر الفاتورة</p>
					<ItemsTable items={item.items} moneyKey="price" />
				</div>
				<div className="flex items-center justify-between rounded-md bg-primary px-4 py-3 text-primary-foreground">
					<span className="text-sm font-semibold">الإجمالي النهائي</span>
					<span className="font-display text-lg font-bold tabular-nums">{num(item.total)}</span>
				</div>
			</div>
		),
	},

	purchases: {
		key: 'purchases', entity: 'purchases', title: 'المشتريات', subtitle: 'فواتير المشتريات من الموردين',
		icon: ShoppingCart, searchPlaceholder: 'ابحث برقم الفاتورة أو اسم المورد…',
		// No status filter — Purchase has no such field in the real system
		// (every purchase is fully recorded when created, no pending state).
		extraFilters: [],
		columns: [
			{ key: 'invoiceNo', label: 'الفاتورة', primary: true, mobile: true },
			{ key: 'supplierName', label: 'المورد', mobile: true },
			{ key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
			{ key: 'total', label: 'الإجمالي', render: money, align: 'end', numeric: true, mobile: true },
			{ key: 'status', label: 'الحالة', render: (v) => <Badge status={v} /> },
		],
		renderDetail: (item) => (
			<div className="flex flex-col gap-5">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="font-display text-lg font-semibold text-foreground">{item.invoiceNo}</p>
						<p className="text-xs text-muted-foreground">{fullDate(item.date)}</p>
					</div>
					<Badge status={item.status} />
				</div>
				<DetailGrid fields={[
					{ label: 'المورد', value: item.supplierName },
					{ label: 'الإجمالي الفرعي', value: num(item.subtotal) },
				]} />
				<div>
					<p className="mb-2 text-xs font-semibold text-muted-foreground">عناصر الفاتورة</p>
					<ItemsTable items={item.items} moneyKey="cost" />
				</div>
				<div className="flex items-center justify-between rounded-md bg-primary px-4 py-3 text-primary-foreground">
					<span className="text-sm font-semibold">الإجمالي</span>
					<span className="font-display text-lg font-bold tabular-nums">{num(item.total)}</span>
				</div>
			</div>
		),
	},

	products: {
		key: 'products', entity: 'products', title: 'المخزون', subtitle: 'المنتجات والكميات المتاحة',
		icon: Boxes, searchPlaceholder: 'ابحث باسم المنتج أو الكود أو التصنيف…',
		extraFilters: [
			{ key: 'status', label: 'الحالة', options: [allOption, { value: 'ok', label: 'متوفر' }, { value: 'low', label: 'ناقص' }, { value: 'out', label: 'نفد' }] },
		],
		columns: [
			{ key: 'name', label: 'المنتج', primary: true, mobile: true },
			{ key: 'category', label: 'التصنيف', mobile: true },
			{ key: 'price', label: 'السعر', render: money, align: 'end', numeric: true, mobile: true },
			{ key: 'stock', label: 'المخزون', render: (v, row) => `${num(v)} ${row.unit}`, align: 'end', numeric: true, mobile: true },
			{ key: 'status', label: 'الحالة', render: (v) => <Badge status={v} /> },
			{ key: 'sku', label: 'الكود' },
			{ key: 'cost', label: 'التكلفة', render: money, align: 'end', numeric: true },
			{ key: 'supplierName', label: 'المورد' },
		],
		renderDetail: (item) => (
			<div className="flex flex-col gap-5">
				<div className="flex items-center justify-between gap-3">
					<p className="font-display text-lg font-semibold text-foreground">{item.name}</p>
					<Badge status={item.status} />
				</div>
				<DetailGrid fields={[
					{ label: 'الكود', value: item.sku },
					{ label: 'التصنيف', value: item.category },
					{ label: 'السعر', value: num(item.price) },
					{ label: 'التكلفة', value: num(item.cost) },
					{ label: 'المخزون', value: `${num(item.stock)} ${item.unit}` },
					{ label: 'حد التنبيه', value: num(item.lowStockThreshold) },
					{ label: 'المورد', value: item.supplierName },
					{ label: 'قيمة المخزون', value: num(item.cost * item.stock) },
				]} />
			</div>
		),
	},

	customers: {
		key: 'customers', entity: 'customers', title: 'العملاء', subtitle: 'قائمة عملاء المحل',
		icon: Users, searchPlaceholder: 'ابحث بالاسم أو رقم الهاتف…',
		extraFilters: [],
		columns: [
			{ key: 'name', label: 'الاسم', primary: true, mobile: true },
			{ key: 'phone', label: 'الهاتف', mobile: true, ltr: true },
			{ key: 'totalOrders', label: 'الطلبات', render: num, align: 'end', numeric: true, mobile: true },
			{ key: 'totalSpent', label: 'إجمالي الشراء', render: money, align: 'end', numeric: true, mobile: true },
			{ key: 'balance', label: 'الرصيد', render: (v) => (v ? num(v) : '—'), align: 'end', numeric: true },
			{ key: 'address', label: 'المنطقة' },
		],
		renderDetail: (item) => (
			<div className="flex flex-col gap-5">
				<p className="font-display text-lg font-semibold text-foreground">{item.name}</p>
				<DetailGrid fields={[
					{ label: 'الهاتف', value: item.phone },
					{ label: 'البريد الإلكتروني', value: item.email },
					{ label: 'المنطقة', value: item.address },
					{ label: 'إجمالي الطلبات', value: num(item.totalOrders) },
					{ label: 'إجمالي الشراء', value: num(item.totalSpent) },
					{ label: 'الرصيد المستحق', value: item.balance ? num(item.balance) : 'لا يوجد' },
					{ label: 'تاريخ التسجيل', value: fullDate(item.createdAt) },
				]} />
			</div>
		),
	},

	suppliers: {
		key: 'suppliers', entity: 'suppliers', title: 'الموردين', subtitle: 'قائمة موردي المحل',
		icon: Truck, searchPlaceholder: 'ابحث باسم المورد أو المسؤول…',
		extraFilters: [],
		columns: [
			{ key: 'name', label: 'المورد', primary: true, mobile: true },
			{ key: 'contactPerson', label: 'المسؤول', mobile: true },
			{ key: 'phone', label: 'الهاتف', mobile: true, ltr: true },
			{ key: 'totalAmount', label: 'إجمالي التعامل', render: money, align: 'end', numeric: true, mobile: true },
			{ key: 'totalPurchases', label: 'عدد الطلبات', render: num, align: 'end', numeric: true },
			{ key: 'balance', label: 'الرصيد', render: (v) => (v ? num(v) : '—'), align: 'end', numeric: true },
		],
		renderDetail: (item) => (
			<div className="flex flex-col gap-5">
				<p className="font-display text-lg font-semibold text-foreground">{item.name}</p>
				<DetailGrid fields={[
					{ label: 'المسؤول', value: item.contactPerson },
					{ label: 'الهاتف', value: item.phone },
					{ label: 'البريد الإلكتروني', value: item.email },
					{ label: 'عدد الطلبات', value: num(item.totalPurchases) },
					{ label: 'إجمالي التعامل', value: num(item.totalAmount) },
					{ label: 'الرصيد المستحق', value: item.balance ? num(item.balance) : 'لا يوجد' },
					{ label: 'تاريخ التعامل', value: fullDate(item.createdAt) },
				]} />
			</div>
		),
	},

	expenses: {
		key: 'expenses', entity: 'expenses', title: 'المصروفات', subtitle: 'مصروفات المحل',
		icon: Wallet, searchPlaceholder: 'ابحث بالتصنيف أو الوصف…',
		extraFilters: [
			{ key: 'category', label: 'التصنيف', options: [allOption, ...['إيجار', 'كهرباء', 'رواتب', 'صيانة', 'نقل', 'أخرى'].map((c) => ({ value: c, label: c }))] },
		],
		columns: [
			{ key: 'category', label: 'التصنيف', primary: true, mobile: true },
			{ key: 'amount', label: 'المبلغ', render: money, align: 'end', numeric: true, mobile: true },
			{ key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
			{ key: 'method', label: 'طريقة الدفع', render: (v) => ({ cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل' }[v] || v), mobile: true },
			{ key: 'beneficiary', label: 'المستفيد' },
			{ key: 'description', label: 'الوصف' },
		],
		renderDetail: (item) => (
			<div className="flex flex-col gap-5">
				<p className="font-display text-lg font-semibold text-foreground">{item.category}</p>
				<DetailGrid fields={[
					{ label: 'المبلغ', value: num(item.amount) },
					{ label: 'التاريخ', value: fullDate(item.date) },
					{ label: 'طريقة الدفع', value: ({ cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل' }[item.method]) },
					{ label: 'المستفيد', value: item.beneficiary },
					{ label: 'الوصف', value: item.description },
				]} />
			</div>
		),
	},

	cashbox: {
		key: 'cashbox', entity: 'cashbox', title: 'الكاشير', subtitle: 'حركة النقدية داخل وخارج',
		icon: ClipboardList, searchPlaceholder: 'ابحث بالوصف أو التصنيف…',
		extraFilters: [
			{ key: 'type', label: 'النوع', options: [allOption, { value: 'in', label: 'داخل' }, { value: 'out', label: 'خارج' }] },
		],
		columns: [
			{ key: 'type', label: 'النوع', render: (v) => (v === 'in' ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><ArrowDownCircle className="h-4 w-4" strokeWidth={2} />داخل</span> : <span className="inline-flex items-center gap-1 font-semibold text-destructive"><ArrowUpCircle className="h-4 w-4" strokeWidth={2} />خارج</span>), mobile: true },
			{ key: 'amount', label: 'المبلغ', render: (v, row) => <span className={row.type === 'in' ? 'text-emerald-700' : 'text-destructive'}>{row.type === 'in' ? '+' : '−'}{num(v)}</span>, align: 'end', numeric: true, mobile: true },
			{ key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
			{ key: 'category', label: 'التصنيف', mobile: true },
			{ key: 'method', label: 'الطريقة', render: (v) => ({ cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل' }[v] || v) },
			{ key: 'description', label: 'الوصف' },
		],
		renderDetail: (item) => (
			<div className="flex flex-col gap-5">
				<div className="flex items-center justify-between gap-3">
					<p className="font-display text-lg font-semibold text-foreground">{item.type === 'in' ? 'حركة داخلية' : 'حركة خارجية'}</p>
					<span className={`font-display text-xl font-bold tabular-nums ${item.type === 'in' ? 'text-emerald-700' : 'text-destructive'}`}>{item.type === 'in' ? '+' : '−'}{num(item.amount)}</span>
				</div>
				<DetailGrid fields={[
					{ label: 'التصنيف', value: item.category },
					{ label: 'التاريخ', value: fullDate(item.date) },
					{ label: 'الطريقة', value: ({ cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل' }[item.method]) },
					{ label: 'الوصف', value: item.description },
				]} />
			</div>
		),
	},

	activity: {
		key: 'activity', entity: 'activity', title: 'سجل النشاط', subtitle: 'آخر العمليات على المحل',
		icon: ActivityIcon, searchPlaceholder: 'ابحث في السجل…',
		extraFilters: [
			{ key: 'type', label: 'النوع', options: [allOption, ...Object.entries(ACTIVITY_LABELS_REAL).map(([value, label]) => ({ value, label }))] },
		],
		columns: [
			{ key: 'type', label: 'النوع', render: (v) => <span className="inline-flex items-center rounded-sm bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">{ACTIVITY_LABELS_REAL[v] || v}</span>, mobile: true },
			{ key: 'description', label: 'الوصف', primary: true, mobile: true },
			{ key: 'date', label: 'التاريخ', render: shortDate, mobile: true },
			{ key: 'user', label: 'المستخدم' },
		],
		renderDetail: (item) => (
			<div className="flex flex-col gap-5">
				<p className="font-display text-lg font-semibold text-foreground">{ACTIVITY_LABELS_REAL[item.type] || item.type}</p>
				<DetailGrid fields={[
					{ label: 'الوصف', value: item.description },
					{ label: 'التاريخ', value: fullDate(item.date) },
					{ label: 'المستخدم', value: item.user },
				]} />
			</div>
		),
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
