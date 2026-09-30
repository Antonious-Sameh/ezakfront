import { api } from '@/lib/api';

/**
 * In-memory cache of each shop's header info (name / address / phone /
 * invoice footer), used for printing and export file names. Changes
 * rarely, so it's fetched once per shop per session; cleared on logout
 * together with every other cached answer.
 */
const cache = new Map();

export const shopSettingsCache = {
    get: (shopId) => cache.get(shopId),
    set: (shopId, value) => { cache.set(shopId, value); },
    clear: () => cache.clear(),
};

/** Cached settings for a shop; rejects if the shop can't be reached. */
export async function getShopSettingsCached(token, shopId) {
    const hit = cache.get(shopId);
    if (hit) return hit;
    const res = await api.getShopSettings(token, shopId);
    const data = res?.data || {};
    cache.set(shopId, data);
    return data;
}
