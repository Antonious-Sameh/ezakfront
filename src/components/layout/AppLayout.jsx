import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, LogOut, Store, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [{ to: '/', label: 'الرئيسية', icon: Home, end: true }];

function AppMark({ className = 'h-10 w-10' }) {
    return (
        <span className={`grid place-items-center rounded-xl bg-indigo-600/10 text-indigo-600 border border-indigo-500/20 shadow-sm ${className}`}>
            <Store className="h-5 w-5" strokeWidth={2} />
        </span>
    );
}

export default function AppLayout() {
    const { logout } = useAuth();

    return (
        <div className="min-h-dvh bg-slate-50/80 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
            {/* Clean Sticky Header */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <AppMark />
                        <div className="leading-tight">
                            <p className="font-display text-base font-bold text-slate-900 sm:text-lg">
                                لوحة تحكم المحلات
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                                إشراف ومتابعة أداء المحلات الأربعة
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-[0.98]"
                    >
                        <LogOut className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">تسجيل الخروج</span>
                    </button>
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-7xl items-start gap-8 px-4 sm:px-6 lg:px-8">
                {/* Desktop Sidebar */}
                <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] w-64 shrink-0 py-6 md:block">
                    <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                        <div>
                            <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                القائمة الرئيسية
                            </p>
                            <nav className="flex flex-col gap-1.5">
                                {NAV_ITEMS.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        className={({ isActive }) =>
                                            `flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                                                isActive
                                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 font-bold'
                                                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                            }`
                                        }
                                    >
                                        <item.icon className="h-4 w-4" strokeWidth={2} />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>

                        <div className="mt-auto rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-center">
                            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <p className="text-xs font-semibold text-slate-800">نظام موحد</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                                عرض مباشر وشامل لكافة البيانات والعمليات.
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Main Page Content */}
                <main className="min-w-0 flex-1 pb-24 pt-6 md:pb-12">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
                <div className="mx-auto flex max-w-md items-center justify-around px-2">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                                    isActive ? 'text-indigo-600 scale-105' : 'text-slate-500 hover:text-slate-800'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" strokeWidth={2} />
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}