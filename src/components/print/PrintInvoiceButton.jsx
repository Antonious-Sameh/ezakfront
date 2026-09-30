import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePrintInvoice } from '@/hooks/usePrintInvoice';
import { getShopSettingsCached } from '@/lib/shopSettingsCache';
import InvoicePrint from './InvoicePrint';

/**
 * "طباعة" button for a sale or purchase invoice. Fetches the shop's header
 * info (name / address / phone / footer) on first use, then prints.
 * If that fetch fails, it still prints — just without the header details —
 * rather than blocking the owner from printing at all.
 */
export default function PrintInvoiceButton({ shopId, kind, invoice, className = '' }) {
    const { token } = useAuth();
    const { job, print, root } = usePrintInvoice();
    const [busy, setBusy] = useState(false);

    const onClick = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        let settings;
        try {
            settings = await getShopSettingsCached(token, shopId);
        } catch {
            settings = {};
            toast.warning('تعذر تحميل بيانات المحل، هتتطبع الفاتورة من غير الترويسة');
        }
        setBusy(false);
        print(<InvoicePrint kind={kind} invoice={invoice} settings={settings} printedAt={new Date()} />);
    }, [busy, shopId, token, kind, invoice, print]);

    return (
        <>
            <button
                type="button"
                onClick={onClick}
                disabled={busy}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted active:scale-95 disabled:opacity-60 sm:text-sm ${className}`}
            >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Printer className="h-4 w-4" strokeWidth={2} />}
                <span>طباعة</span>
            </button>
            {job && root ? createPortal(job, root) : null}
        </>
    );
}
