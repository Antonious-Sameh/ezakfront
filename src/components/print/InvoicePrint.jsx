import React from 'react';
import { formatNumber } from '@/lib/format';
import { AR_LOCALE, PAYMENT_LABELS } from '@/lib/constants';

/**
 * The printed invoice — a real receipt, not a data grid.
 *
 * Laid out like the shops' own receipt (InvoiceView in Shops 1-4) so the
 * owner sees the same familiar paper: shop header, invoice meta, a clear
 * lines table, a bold total, paid / remaining, and the shop's own footer.
 * Width is capped at 80mm, so it prints correctly on an 80mm thermal
 * printer and as a centred receipt on A4 (or "Save as PDF").
 *
 * Deliberately NOT printed: the invoice profit (internal to the owner).
 *
 * Props:
 *  - kind: 'sale' | 'purchase'
 *  - invoice: a sales/purchases row as returned by System 5's API
 *  - settings: { shopName, phone, address, invoiceFooter } (any may be empty)
 *  - printedAt: Date (defaults to now) — shown small at the bottom
 */

const money = (v) => formatNumber(v, { locale: AR_LOCALE, maximumFractionDigits: 2 });
const qty = (v) => formatNumber(v, { locale: AR_LOCALE });

function formatDateTime(v) {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(AR_LOCALE, {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit',
    });
}

const STATUS_TEXT = { paid: 'مدفوعة بالكامل', partial: 'مدفوعة جزئياً', unpaid: 'غير مدفوعة (آجل)' };

function MetaRow({ label, value, ltr }) {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="inv-meta-row">
            <span className="inv-muted">{label}</span>
            <span className="inv-strong" dir={ltr ? 'ltr' : undefined}>{value}</span>
        </div>
    );
}

export default function InvoicePrint({ kind, invoice, settings, printedAt = new Date() }) {
    if (!invoice) return null;
    const isSale = kind === 'sale';
    const items = invoice.items || [];
    const pieces = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
    const hasDiscount = Number(invoice.discount) > 0;
    const hasPayment = invoice.paid !== undefined && invoice.paid !== null;
    const shopName = settings?.shopName?.trim() || '';
    const contact = [settings?.address, settings?.phone].filter((v) => v && v.trim());

    return (
        <article className="inv" dir="rtl" lang="ar" aria-label={isSale ? 'فاتورة بيع' : 'فاتورة شراء'}>
            <header className="inv-header">
                {shopName ? <h1 className="inv-shop">{shopName}</h1> : null}
                {contact.length ? (
                    <p className="inv-contact">
                        {settings?.address ? <span>{settings.address}</span> : null}
                        {settings?.address && settings?.phone ? <span> — </span> : null}
                        {settings?.phone ? <span dir="ltr">{settings.phone}</span> : null}
                    </p>
                ) : null}
                <p className="inv-title">{isSale ? 'فاتورة بيع' : 'فاتورة شراء'}</p>
            </header>

            <section className="inv-meta">
                <MetaRow label="رقم الفاتورة" value={invoice.invoiceNo ? `#${invoice.invoiceNo}` : undefined} ltr />
                <MetaRow label="التاريخ" value={formatDateTime(invoice.date)} />
                <MetaRow label={isSale ? 'العميل' : 'المورد'} value={isSale ? invoice.customerName : invoice.supplierName} />
                <MetaRow label="طريقة الدفع" value={PAYMENT_LABELS[invoice.paymentType] || invoice.paymentType} />
            </section>

            <table className="inv-table">
                <thead>
                    <tr>
                        <th className="inv-col-name">الصنف</th>
                        <th className="inv-col-num">الكمية</th>
                        <th className="inv-col-num">السعر</th>
                        <th className="inv-col-num">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((it, i) => (
                        <tr key={i}>
                            <td className="inv-col-name">
                                <span className="inv-item-name">{it.productName}</span>
                                {it.code ? <span className="inv-item-code" dir="ltr">{it.code}</span> : null}
                            </td>
                            <td className="inv-col-num">{qty(it.qty)}</td>
                            <td className="inv-col-num">{money(isSale ? it.price : (it.price ?? it.cost))}</td>
                            <td className="inv-col-num inv-strong">{money(it.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <section className="inv-totals">
                <div className="inv-meta-row">
                    <span className="inv-muted">عدد الأصناف / القطع</span>
                    <span>{qty(items.length)} / {qty(pieces)}</span>
                </div>
                {hasDiscount ? (
                    <>
                        <div className="inv-meta-row">
                            <span className="inv-muted">الإجمالي قبل الخصم</span>
                            <span>{money(invoice.subtotal)}</span>
                        </div>
                        <div className="inv-meta-row">
                            <span className="inv-muted">الخصم</span>
                            <span>− {money(invoice.discount)}</span>
                        </div>
                    </>
                ) : null}
                <div className="inv-grand" data-testid="print-grand-total">
                    <span>الإجمالي</span>
                    <span>{money(invoice.total)} ج.م</span>
                </div>
                {hasPayment ? (
                    <>
                        <div className="inv-meta-row">
                            <span className="inv-muted">المدفوع</span>
                            <span className="inv-strong">{money(invoice.paid)}</span>
                        </div>
                        <div className="inv-meta-row">
                            <span className="inv-muted">المتبقي</span>
                            <span className="inv-strong">{money(invoice.remaining)}</span>
                        </div>
                    </>
                ) : null}
                {STATUS_TEXT[invoice.paymentStatus] ? (
                    <p className="inv-status">{STATUS_TEXT[invoice.paymentStatus]}</p>
                ) : null}
            </section>

            {invoice.notes ? <p className="inv-notes">ملاحظات: {invoice.notes}</p> : null}

            <footer className="inv-footer">
                {settings?.invoiceFooter ? <p className="inv-thanks">{settings.invoiceFooter}</p> : null}
                <p className="inv-printed">طُبعت في {formatDateTime(printedAt)}</p>
            </footer>
        </article>
    );
}
