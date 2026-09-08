import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, LogOut, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [{ to: '/', label: 'الرئيسية', icon: Home, end: true }];

function AppMark({ className = 'h-9 w-9' }) {
	return (
		<span className={`grid place-items-center rounded-md bg-primary text-primary-foreground ${className}`}>
			<Store className="h-5 w-5" strokeWidth={1.75} />
		</span>
	);
}

export default function AppLayout() {
	const { logout } = useAuth();

	return (
		<div className="min-h-dvh bg-background text-foreground">
			{/* Fixed top header */}
			<header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
					<div className="flex items-center gap-3">
						<AppMark />
						<div className="leading-tight">
							<p className="font-display text-sm font-bold sm:text-base">لوحة تحكم المحلات</p>
							<p className="text-[11px] text-muted-foreground">System 5 — عرض فقط</p>
						</div>
					</div>
					<button
						type="button"
						onClick={logout}
						className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-destructive/40 hover:text-destructive active:scale-[0.98]"
					>
						<LogOut className="h-4 w-4" strokeWidth={2} />
						تسجيل الخروج
					</button>
				</div>
			</header>

			<div className="mx-auto flex w-full max-w-6xl items-start gap-6 px-4 sm:px-6">
				{/* Desktop sidebar (right side in RTL) */}
				<aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 py-6 md:block">
					<nav className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2 shadow-[inset_0_2px_10px_hsl(var(--primary)/0.05)]">
						<p className="px-3 pb-2 pt-1 text-[11px] font-semibold text-muted-foreground">التنقل</p>
						{NAV_ITEMS.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.end}
								className={({ isActive }) =>
									`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
										isActive
											? 'bg-primary text-primary-foreground'
											: 'text-foreground hover:bg-muted'
									}`
								}
							>
								<item.icon className="h-4 w-4" strokeWidth={2} />
								{item.label}
							</NavLink>
						))}
					</nav>
					<p className="mt-4 px-1 text-[11px] leading-relaxed text-muted-foreground">
						النظام للعرض فقط — كل بيانات محلاتك الأربعة في مكان واحد.
					</p>
				</aside>

				{/* Page content */}
				<main className="min-w-0 flex-1 pb-24 pt-6 md:pb-10">
					<Outlet />
				</main>
			</div>

			{/* Mobile bottom tab bar */}
			<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
				<div className="mx-auto flex max-w-md items-stretch justify-center">
					{NAV_ITEMS.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end}
							className={({ isActive }) =>
								`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition active:scale-[0.98] ${
									isActive ? 'text-primary' : 'text-muted-foreground'
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
