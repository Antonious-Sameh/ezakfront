import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getShopSettingsCached } from '@/lib/shopSettingsCache';
import { toISODate } from '@/lib/dates';
import { EXPORT_SPECS } from './exportSpecs';

/**
 * "تصدير" menu for a list section: Excel (.xlsx) or CSV, containing EVERY
 * row that matches the filters currently applied (not only the visible
 * page). The writers are loaded on first use (dynamic import).
 *
 * Props: shopId, entity, title (section name), filters ({search, from, to, extras})
 */
export function exportFileBase({ shopName, title, from, to, today = new Date() }) {
    const range = from || to ? `${from || '…'} إلى ${to || '…'}` : toISODate(today);
    return [shopName, title, range].filter(Boolean).join(' - ');
}

export default function ExportButton({ shopId, entity, title, filters }) {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(null); // 'xlsx' | 'csv' | null
    const wrapRef = useRef(null);
    const spec = EXPORT_SPECS[entity];

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!spec) return null;

    const run = async (format) => {
        setOpen(false);
        setBusy(format);
        try {
            const [res, exporters, shopName] = await Promise.all([
                api.exportShopList(token, shopId, entity, filters),
                import('@/lib/exporters'),
                getShopSettingsCached(token, shopId).then((s) => s.shopName).catch(() => ''),
            ]);
            const rows = res?.data || [];
            if (!rows.length) {
                toast.info('مفيش بيانات تتصدّر بالفلاتر الحالية');
                return;
            }
            const file = exporters.buildExportFile(spec, rows, {
                format,
                sheetName: title,
                fileBase: exportFileBase({ shopName, title, from: filters.from, to: filters.to }),
            });
            exporters.downloadFile(file.fileName, file.data, file.mime);
            if (res.truncated) {
                toast.warning(`اتصدّر أول ${rows.length.toLocaleString('ar-EG')} صف بس من ${Number(res.total).toLocaleString('ar-EG')} — ضيّق الفترة بالتاريخ عشان تصدّر الباقي`);
            } else {
                toast.success(`تم تصدير ${rows.length.toLocaleString('ar-EG')} صف`);
            }
        } catch (err) {
            toast.error(err?.message || 'حصلت مشكلة أثناء التصدير');
        } finally {
            setBusy(null);
        }
    };

    return (
        <div ref={wrapRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={Boolean(busy)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted active:scale-[0.97] disabled:opacity-60 sm:text-sm"
            >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Download className="h-4 w-4" strokeWidth={2} />}
                <span>{busy ? 'جاري التصدير…' : 'تصدير'}</span>
            </button>
            {open ? (
                <div
                    role="menu"
                    aria-label="صيغة الملف"
                    className="absolute end-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-lg"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => run('xlsx')}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-medium text-foreground hover:bg-muted"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                        <span className="flex flex-col">
                            <span>Excel</span>
                            <span className="text-[11px] text-muted-foreground">ملف .xlsx جاهز للجمع والفرز</span>
                        </span>
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => run('csv')}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-medium text-foreground hover:bg-muted"
                    >
                        <FileText className="h-4 w-4 text-sky-600" strokeWidth={2} />
                        <span className="flex flex-col">
                            <span>CSV</span>
                            <span className="text-[11px] text-muted-foreground">ملف نصي يفتح في أي برنامج</span>
                        </span>
                    </button>
                </div>
            ) : null}
        </div>
    );
}
