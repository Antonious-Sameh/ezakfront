import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * Generic detail modal. Renders the section's `renderDetail(item)` body.
 * Closes on backdrop click, the X button, or Escape.
 */
export default function DetailModal({ open, onClose, title, loading, error, children }) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-md animate-in fade-in-0 duration-200 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl transition-all animate-in slide-in-from-bottom-6 zoom-in-95 duration-200 sm:rounded-2xl sm:border sm:shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile drag handle indicator */}
                <div className="flex items-center justify-center pt-2.5 pb-1 sm:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Modal Header */}
                <div className="flex items-center justify-between gap-3 border-b border-border/80 px-6 py-4">
                    <h2 className="font-display text-base font-bold text-foreground sm:text-lg dir-rtl">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="إغلاق"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                    >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto px-6 py-6 dir-rtl">
                    {loading ? (
                        <div className="space-y-6">
                            <div className="h-6 w-1/3 animate-pulse rounded-md bg-muted" />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="space-y-2 rounded-lg border border-border/50 p-3 bg-muted/20">
                                        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                                        <div className="h-4 w-32 animate-pulse rounded bg-muted/80" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : error ? (
                        <div className="my-6 flex flex-col items-center justify-center text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <AlertCircle className="h-6 w-6" strokeWidth={2} />
                            </div>
                            <p className="text-sm font-medium text-destructive">{error}</p>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </div>
        </div>
    );
}