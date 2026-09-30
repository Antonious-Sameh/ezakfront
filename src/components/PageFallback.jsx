import React from 'react';

/**
 * Shown for the split second a page's code chunk is downloading. Kept
 * deliberately quiet (no spinner flash): a thin progress bar at the top and
 * a skeleton shaped like a typical page, so the layout doesn't jump.
 */
export default function PageFallback({ fullScreen = false }) {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="جاري التحميل"
            className={`flex flex-col gap-5 ${fullScreen ? 'min-h-dvh bg-background p-4 sm:p-8' : 'py-2'}`}
        >
            <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent">
                <div className="h-full w-1/3 animate-[page-progress_1s_ease-in-out_infinite] rounded-full bg-accent" />
            </div>
            <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
                <div className="space-y-2">
                    <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted/80" />
                </div>
            </div>
            <div className="h-24 animate-pulse rounded-2xl border border-border/60 bg-card" />
            <div className="h-64 animate-pulse rounded-2xl border border-border/60 bg-card" />
            <span className="sr-only">جاري التحميل…</span>
        </div>
    );
}
