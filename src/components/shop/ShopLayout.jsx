import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Home, MoreHorizontal, Landmark, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { SHOP_SECTIONS, MOBILE_PRIMARY_SECTIONS } from './sectionConfigs';

/** Dropdown to switch shops without going back to the overview. */
function ShopSwitcher({ shops, currentId }) {
    const [open, setOpen] = useState(false);
    const current = shops.find((s) => s.id === currentId);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="inline-flex min-h-10 max-w-[60vw] items-center gap-2.5 rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/15 active:scale-[0.98] sm:max-w-xs"
            >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/20 text-accent">
                    <Store className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                <span className="truncate">{current?.name || 'اختر المحل'}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-primary-foreground/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>

            {open ? (
                <>
                    <button
                        type="button"
                        aria-label="إغلاق القائمة"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setOpen(false)}
                    />
                    <ul
                        role="listbox"
                        className="absolute start-0 z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 dir-rtl"
                    >
                        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                            المحلات المتاحة
                        </div>
                        {shops.map((shop) => {
                            const isOnline = shop.status === 'online';
                            const isCurrent = shop.id === currentId;
                            return (
                                <li key={shop.id}>
                                    <NavLink
                                        to={`/shops/${shop.id}`}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            isCurrent
                                                ? 'bg-primary/10 text-primary font-semibold'
                                                : 'text-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2.5 truncate">
                                            <span className="relative flex h-2 w-2 shrink-0">
                                                {isOnline && (
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                )}
                                                <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                                            </span>
                                            <span className="truncate">{shop.name}</span>
                                        </span>
                                        {isCurrent && <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </>
            ) : null}
        </div>
    );
}

function sectionPath(shopId, key) {
    return key === '' ? `/shops/${shopId}` : `/shops/${shopId}/${key}`;
}

export default function ShopLayout() {
    const { token } = useAuth();
    const { shopId } = useParams();
    const shopsFetcher = useMemo(() => () => api.getShops(token).then((res) => res.data), [token]);
    const { data: shops } = useApiQuery(shopsFetcher);

    const [moreOpen, setMoreOpen] = useState(false);
    const primary = SHOP_SECTIONS.filter((s) => MOBILE_PRIMARY_SECTIONS.includes(s.key));
    const more = SHOP_SECTIONS.filter((s) => !MOBILE_PRIMARY_SECTIONS.includes(s.key));

    return (
        <div className="min-h-dvh bg-background text-foreground antialiased">
            {/* Sticky shop header — refined ink chrome */}
            <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-primary/95 text-primary-foreground shadow-sm backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        {shops?.length ? (
                            <ShopSwitcher shops={shops} currentId={shopId} />
                        ) : (
                            <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/5 px-3 py-2 text-xs font-medium text-primary-foreground/70">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                                <span>جارٍ تحميل المحلات…</span>
                            </div>
                        )}
                    </div>
                    
                    <NavLink
                        to="/"
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/20 active:scale-[0.98] sm:text-sm"
                    >
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">الرئيسية</span>
                        <Home className="h-4 w-4 sm:hidden" strokeWidth={2} />
                    </NavLink>
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-7xl items-start gap-8 px-4 sm:px-6">
                {/* Desktop sidebar: all sections */}
                <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto py-6 md:block">
                    <nav className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2.5 shadow-sm">
                        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                            أقسام المحل
                        </div>
                        {SHOP_SECTIONS.map((item) => (
                            <NavLink
                                key={item.key || 'overview'}
                                to={sectionPath(shopId, item.key)}
                                end={item.key === ''}
                                className={({ isActive }) =>
                                    `flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                                            : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                                    }`
                                }
                            >
                                <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="min-w-0 flex-1 pb-24 pt-6 md:pb-12">
                    <Outlet />
                </main>
            </div>

            {/* Mobile bottom tab bar */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
                <div className="mx-auto flex max-w-md items-stretch justify-around">
                    {primary.map((item) => (
                        <NavLink
                            key={item.key || 'overview'}
                            to={sectionPath(shopId, item.key)}
                            end={item.key === ''}
                            className={({ isActive }) =>
                                `flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-[0.96] ${
                                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" strokeWidth={2} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    {/* More button + popover */}
                    <div className="relative flex flex-1">
                        <button
                            type="button"
                            onClick={() => setMoreOpen((v) => !v)}
                            aria-haspopup="true"
                            aria-expanded={moreOpen}
                            className={`flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-[0.96] ${
                                moreOpen ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
                            <span>المزيد</span>
                        </button>

                        {moreOpen ? (
                            <>
                                <button
                                    type="button"
                                    aria-label="إغلاق"
                                    className="fixed inset-0 z-40 cursor-default bg-background/20 backdrop-blur-xs"
                                    onClick={() => setMoreOpen(false)}
                                />
                                <ul className="absolute bottom-16 inset-x-0 z-50 mx-auto flex w-[92%] flex-col gap-1 rounded-xl border border-border bg-popover/98 p-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3">
                                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase dir-rtl">
                                        أقسام إضافية
                                    </div>
                                    {more.map((item) => (
                                        <li key={item.key}>
                                            <NavLink
                                                to={sectionPath(shopId, item.key)}
                                                end={item.key === ''}
                                                onClick={() => setMoreOpen(false)}
                                                className={({ isActive }) =>
                                                    `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                                                        isActive
                                                            ? 'bg-primary text-primary-foreground font-semibold'
                                                            : 'text-foreground hover:bg-muted'
                                                    }`
                                                }
                                            >
                                                <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                                                <span>{item.label}</span>
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : null}
                    </div>
                </div>
            </nav>
        </div>
    );
}