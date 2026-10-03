import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, AlertTriangle } from 'lucide-react';
import AttentionStrip from '@/components/analytics/AttentionStrip';
import { count } from '@/components/analytics/format';

/**
 * One line at the very top of the home page: "all good", or "N things need
 * your attention" — tap to open the list. The owner learns in one glance
 * whether there is anything to do; the details are one tap away instead of
 * pushing the shops down the page.
 */
export default function StatusBanner({ items, loading }) {
    const [open, setOpen] = useState(false);

    if (loading) {
        return <div className="h-12 animate-pulse rounded-2xl border border-border bg-card" aria-hidden="true" />;
    }

    if (!items.length) {
        return (
            <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300" role="status">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                كل حاجة تمام، مفيش حاجة محتاجة انتباهك
            </div>
        );
    }

    const urgent = items.some((i) => i.tone === 'danger');
    return (
        <div className="flex flex-col gap-3">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className={`flex min-h-12 w-full items-center gap-2.5 rounded-2xl border px-4 text-start text-sm font-semibold transition-colors ${
                    urgent
                        ? 'border-rose-500/30 bg-rose-500/[0.07] text-rose-800 dark:text-rose-300'
                        : 'border-amber-500/30 bg-amber-500/[0.08] text-amber-900 dark:text-amber-300'
                }`}
            >
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{count(items.length)} {items.length > 2 ? 'حاجات' : items.length === 2 ? 'حاجتين' : 'حاجة'} محتاجة انتباهك</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {open ? <AttentionStrip items={items} bare /> : null}
        </div>
    );
}
