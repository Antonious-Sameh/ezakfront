import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Home, MoreHorizontal, Store } from 'lucide-react';
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
				className="inline-flex min-h-11 max-w-[60vw] items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-bold text-foreground transition hover:border-primary/40 active:scale-[0.98]"
			>
				<Store className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
				<span className="truncate">{current?.name || 'المحل'}</span>
				<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
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
						className="absolute start-0 z-50 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-xl"
					>
						{shops.map((shop) => (
							<li key={shop.id}>
								<NavLink
									to={`/shops/${shop.id}`}
									onClick={() => setOpen(false)}
									className="flex items-center justify-between gap-2 rounded-sm px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
								>
									<span className="flex items-center gap-2 truncate">
										<span className={`h-2 w-2 shrink-0 rounded-full ${shop.status === 'online' ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
										<span className="truncate">{shop.name}</span>
									</span>
									{shop.id === currentId ? <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} /> : null}
								</NavLink>
							</li>
						))}
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
		<div className="min-h-dvh bg-background text-foreground">
			{/* Sticky shop header */}
			<header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
					<div className="flex min-w-0 items-center gap-2">
						{shops?.length ? <ShopSwitcher shops={shops} currentId={shopId} /> : <span className="text-sm font-bold">جارٍ التحميل…</span>}
					</div>
					<NavLink
						to="/"
						className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 active:scale-[0.98] sm:px-4"
					>
						<ArrowRight className="h-4 w-4" strokeWidth={2} />
						<span className="hidden sm:inline">رجوع للرئيسية</span>
						<Home className="h-4 w-4 sm:hidden" strokeWidth={2} />
					</NavLink>
				</div>
			</header>

			<div className="mx-auto flex w-full max-w-6xl items-start gap-6 px-4 sm:px-6">
				{/* Desktop sidebar: all sections */}
				<aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-y-auto py-6 md:block">
					<nav className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2 shadow-[inset_0_2px_10px_hsl(var(--primary)/0.05)]">
						<p className="px-3 pb-2 pt-1 text-[11px] font-semibold text-muted-foreground">أقسام المحل</p>
						{SHOP_SECTIONS.map((item) => (
							<NavLink
								key={item.key || 'overview'}
								to={sectionPath(shopId, item.key)}
								end={item.key === ''}
								className={({ isActive }) =>
									`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
										isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
									}`
								}
							>
								<item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
								{item.label}
							</NavLink>
						))}
					</nav>
				</aside>

				<main className="min-w-0 flex-1 pb-24 pt-6 md:pb-10">
					<Outlet />
				</main>
			</div>

			{/* Mobile bottom tab bar: primary sections + "المزيد" */}
			<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
				<div className="mx-auto flex max-w-md items-stretch justify-center">
					{primary.map((item) => (
						<NavLink
							key={item.key || 'overview'}
							to={sectionPath(shopId, item.key)}
							end={item.key === ''}
							className={({ isActive }) =>
								`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition active:scale-[0.98] ${
									isActive ? 'text-primary' : 'text-muted-foreground'
								}`
							}
						>
							<item.icon className="h-5 w-5" strokeWidth={2} />
							{item.label}
						</NavLink>
					))}

					{/* More button + popover */}
					<div className="relative flex flex-1">
						<button
							type="button"
							onClick={() => setMoreOpen((v) => !v)}
							aria-haspopup="true"
							aria-expanded={moreOpen}
							className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground transition active:scale-[0.98]"
						>
							<MoreHorizontal className="h-5 w-5" strokeWidth={2} />
							المزيد
						</button>
						{moreOpen ? (
							<>
								<button
									type="button"
									aria-label="إغلاق"
									className="fixed inset-0 z-40 cursor-default"
									onClick={() => setMoreOpen(false)}
								/>
								<ul className="absolute bottom-16 inset-x-0 z-50 mx-auto flex w-[92%] flex-col gap-1 rounded-lg border border-border bg-popover p-2 shadow-2xl">
									{more.map((item) => (
										<li key={item.key}>
											<NavLink
												to={sectionPath(shopId, item.key)}
												end={item.key === ''}
												onClick={() => setMoreOpen(false)}
												className={({ isActive }) =>
													`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
														isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
													}`
												}
											>
												<item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
												{item.label}
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
