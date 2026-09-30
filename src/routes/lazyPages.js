import { lazy } from 'react';

/**
 * React.lazy + a `.preload()` handle. Each page becomes its own JS chunk,
 * downloaded only when that page is first opened — so the login screen and
 * the overview don't pay for the reports page's chart library, etc.
 *
 * `.preload()` starts the same download early (e.g. when a nav link is
 * hovered or touched) without rendering anything; the import() promise is
 * cached, so the actual navigation then renders instantly.
 */
export function lazyWithPreload(factory) {
    let promise = null;
    const load = () => {
        if (!promise) {
            promise = factory().catch((err) => {
                promise = null; // allow a retry after a network hiccup
                throw err;
            });
        }
        return promise;
    };
    const Component = lazy(load);
    Component.preload = load;
    return Component;
}

export const LoginPage = lazyWithPreload(() => import('@/pages/LoginPage'));
export const AppLayout = lazyWithPreload(() => import('@/components/layout/AppLayout'));
export const OverviewPage = lazyWithPreload(() => import('@/pages/OverviewPage'));
export const ShopLayout = lazyWithPreload(() => import('@/components/shop/ShopLayout'));
export const ShopOverviewPage = lazyWithPreload(() => import('@/pages/shop/ShopOverviewPage'));
export const ShopSectionPage = lazyWithPreload(() => import('@/pages/shop/ShopSectionPage'));
export const ShopReportsPage = lazyWithPreload(() => import('@/pages/shop/ShopReportsPage'));

/** Which page chunk a shop sub-path needs — used for prefetch-on-intent. */
export function preloadShopSection(sectionKey) {
    if (!sectionKey) return ShopOverviewPage.preload();
    if (sectionKey === 'reports') return ShopReportsPage.preload();
    return ShopSectionPage.preload();
}
