import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * "اعرف أكتر": the secondary detail of a page, folded behind one tap so the
 * important figures above it stay in view. Closed by default.
 */
export default function Disclosure({ title, subtitle, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <section className="flex flex-col gap-4">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3 text-start transition-colors hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
                <span>
                    <span className="block font-display text-base font-bold text-foreground">{title}</span>
                    {subtitle ? <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span> : null}
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {open ? children : null}
        </section>
    );
}
