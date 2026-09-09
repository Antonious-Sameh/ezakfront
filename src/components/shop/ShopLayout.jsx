import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, useLocation } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Home, MoreHorizontal, Store, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { SHOP_SECTIONS, MOBILE_PRIMARY_SECTIONS } from './sectionConfigs';

/** Dropdown switch shops */
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
                className="inline-flex min-h-10 max-w-[60vw] items-center gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/15 active:scale-95 sm:max-w-xs"
            >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
                    <Store className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                <span className="truncate">{current?.name || 'اختر المحل'}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-primary-foreground/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        aria-label="إغلاق القائمة"
                        className="fixed inset-0 z-40 cursor-default bg-black/40 backdrop-blur-xs animate-in fade-in-0 duration-200"
                        onClick={() => setOpen(false)}
                    />
                    <ul
                        role="listbox"
                        className="absolute start-0 z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl border border-border bg-popover/95 p-2 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 dir-rtl"
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
                                        className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                            isCurrent
                                                ? 'bg-primary/10 text-primary font-semibold'
                                                : 'text-foreground hover:bg-muted/80 active:bg-muted'
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
            )}
        </div>
    );
}

function sectionPath(shopId, key) {
    return key === '' ? `/shops/${shopId}` : `/shops/${shopId}/${key}`;
}

export default function ShopLayout() {
    const { token } = useAuth();
    const { shopId } = useParams();
    const location = useLocation();

    const shopsFetcher = useMemo(() => () => api.getShops(token).then((res) => res.data), [token]);
    const { data: shops } = useApiQuery(shopsFetcher);

    const [moreOpen, setMoreOpen] = useState(false);
    const primary = SHOP_SECTIONS.filter((s) => MOBILE_PRIMARY_SECTIONS.includes(s.key));
    const more = SHOP_SECTIONS.filter((s) => !MOBILE_PRIMARY_SECTIONS.includes(s.key));

    // إغلاق Bottom Sheet عند الانتقال لأي صفحة
    useEffect(() => {
        setMoreOpen(false);
    }, [location.pathname]);

    // تحقق إذا كان أي قسم من أقسام "المزيد" نشطًا لتنقيط/تميين زر المزيد
    const isMoreActive = useMemo(() => {
        return more.some((item) => {
            const targetPath = sectionPath(shopId, item.key);
            return item.key === '' 
                ? location.pathname === targetPath 
                : location.pathname.startsWith(targetPath);
        });
    }, [more, location.pathname, shopId]);

    return (
        <div className="min-h-dvh bg-background text-foreground antialiased">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-primary/95 text-primary-foreground shadow-sm backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        {shops?.length ? (
                            <ShopSwitcher shops={shops} currentId={shopId} />
                        ) : (
                            <div className="flex items-center gap-2 rounded-xl bg-primary-foreground/10 px-3 py-2 text-xs font-medium text-primary-foreground/80 backdrop-blur-xs">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                                <span>جارٍ التحميل…</span>
                            </div>
                        )}
                    </div>
                    
                    <NavLink
                        to="/"
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/20 active:scale-95 sm:text-sm"
                    >
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">الرئيسية</span>
                        <Home className="h-4 w-4 sm:hidden" strokeWidth={2} />
                    </NavLink>
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-7xl items-start gap-8 px-4 sm:px-6">
                {/* Sidebar Desktop */}
                <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto py-6 md:block">
                    <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 shadow-sm">
                        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase dir-rtl">
                            أقسام المحل
                        </div>
                        {SHOP_SECTIONS.map((item) => (
                            <NavLink
                                key={item.key || 'overview'}
                                to={sectionPath(shopId, item.key)}
                                end={item.key === ''}
                                className={({ isActive }) =>
                                    `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-98 ${
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

            {/* Mobile Bottom Tab Bar */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
                <div className="mx-auto flex max-w-md items-center justify-around px-1">
                    {primary.map((item) => (
                        <NavLink
                            key={item.key || 'overview'}
                            to={sectionPath(shopId, item.key)}
                            end={item.key === ''}
                            className={({ isActive }) =>
                                `flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all active:scale-95 ${
                                    isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" strokeWidth={2} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    {/* زر المزيد */}
                    <button
                        type="button"
                        onClick={() => setMoreOpen(true)}
                        aria-haspopup="dialog"
                        aria-expanded={moreOpen}
                        className={`relative flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all active:scale-95 ${
                            moreOpen || isMoreActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {isMoreActive && (
                            <span className="absolute top-2.5 right-1/2 translate-x-3 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                        <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
                        <span>المزيد</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Bottom Sheet (أقسام إضافية) */}
            {moreOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
                        onClick={() => setMoreOpen(false)}
                    />

                    {/* Sheet Content */}
                    <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[28px] border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-300 dir-rtl">
                        {/* Drag Handle Bar */}
                        <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />

                        {/* Sheet Header */}
                        <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-3 px-1">
                            <div>
                                <h3 className="text-base font-bold text-foreground">الأقسام الإضافية</h3>
                                <p className="text-xs text-muted-foreground">اختر القسم الذي تريد الانتقال إليه</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMoreOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-muted-foreground active:scale-95"
                            >
                                <X className="h-4 w-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Sections List */}
                        <div className="flex-1 overflow-y-auto space-y-1 py-1">
                            {more.map((item) => (
                                <NavLink
                                    key={item.key}
                                    to={sectionPath(shopId, item.key)}
                                    end={item.key === ''}
                                    onClick={() => setMoreOpen(false)}
                                    className={({ isActive }) =>
                                        `flex min-h-12 items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all active:scale-[0.98] ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                                : 'text-foreground hover:bg-muted/80 active:bg-muted'
                                        }`
                                    }
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                                            <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                                        </div>
                                        <span>{item.label}</span>
                                    </div>
                                    <ChevronDown className="-rotate-90 h-4 w-4 opacity-40" strokeWidth={2} />
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}