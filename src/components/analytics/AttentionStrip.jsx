import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, WifiOff, TrendingDown, PackageX, HandCoins, ChevronLeft } from 'lucide-react';

const ICONS = { offline: WifiOff, loss: TrendingDown, drop: TrendingDown, stock: PackageX, debts: HandCoins };
const TONES = {
    danger: 'border-rose-500/25 bg-rose-500/[0.06] text-rose-800 dark:text-rose-300 [&_svg.lead]:text-rose-600',
    warning: 'border-amber-500/30 bg-amber-500/[0.07] text-amber-900 dark:text-amber-300 [&_svg.lead]:text-amber-600',
    info: 'border-border bg-card text-foreground [&_svg.lead]:text-accent',
};

/** The "needs your attention" list. Renders nothing when all is well. */
export default function AttentionStrip({ items }) {
    if (!items?.length) return null;
    return (
        <section aria-labelledby="attention-title" className="flex flex-col gap-2.5">
            <h2 id="attention-title" className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={2.5} aria-hidden="true" />
                محتاج انتباهك
            </h2>
            <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {items.map((item) => {
                    const Icon = ICONS[item.kind] || AlertTriangle;
                    const body = (
                        <>
                            <Icon className="lead h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                            <span className="flex-1 text-sm font-medium leading-snug">{item.text}</span>
                            {item.to ? <ChevronLeft className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" /> : null}
                        </>
                    );
                    const cls = `flex min-h-12 items-center gap-3 rounded-xl border px-3.5 py-2.5 ${TONES[item.tone]}`;
                    return (
                        <li key={item.key}>
                            {item.to ? (
                                <Link to={item.to} className={`${cls} transition-colors hover:brightness-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`}>{body}</Link>
                            ) : (
                                <div className={cls}>{body}</div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
