import { money, pct, count } from './format';

/**
 * "محتاج انتباهك" — the few things on the home page the owner should act on,
 * most urgent first. Pure function of the two API answers (easy to test).
 *
 * shops:   GET /api/shops (status, lowStockCount per shop)
 * compare: GET /api/reports/compare (per-shop sales / profit / change / debts)
 */
export const DROP_ALERT_PCT = -20;

export function buildAttention({ shops = [], compare } = {}) {
    const items = [];
    const byShop = compare?.byShop || [];
    const nameOf = (id) => shops.find((s) => s.id === id)?.name || byShop.find((s) => s.shopId === id)?.shopName || '';

    const offline = new Set([
        ...shops.filter((s) => s.status === 'offline').map((s) => s.id),
        ...byShop.filter((s) => s.available === false).map((s) => s.shopId),
    ]);
    for (const id of offline) {
        items.push({
            key: `offline-${id}`, tone: 'danger', kind: 'offline', to: `/shops/${id}`,
            text: `${nameOf(id)} مش بيرد دلوقتي، وأرقامه مش داخلة في الإجمالي`,
        });
    }

    for (const s of byShop) {
        if (s.available === false) continue;
        if (s.profit < 0) {
            items.push({
                key: `loss-${s.shopId}`, tone: 'danger', kind: 'loss', to: `/shops/${s.shopId}/reports`,
                text: `${s.shopName} خسران ${money(-s.profit)} ج.م في الفترة دي (بعد المصروفات)`,
            });
        } else if (typeof s.change?.sales === 'number' && s.change.sales <= DROP_ALERT_PCT) {
            items.push({
                key: `drop-${s.shopId}`, tone: 'warning', kind: 'drop', to: `/shops/${s.shopId}/reports`,
                text: `مبيعات ${s.shopName} قلت ${pct(Math.abs(s.change.sales))} عن الفترة اللي قبلها`,
            });
        }
    }

    const lowShops = shops.filter((s) => s.status !== 'offline' && Number(s.lowStockCount) > 0);
    if (lowShops.length) {
        const total = lowShops.reduce((a, s) => a + Number(s.lowStockCount), 0);
        const worst = [...lowShops].sort((a, b) => b.lowStockCount - a.lowStockCount)[0];
        items.push({
            key: 'low-stock', tone: 'warning', kind: 'stock', to: `/shops/${worst.id}/products`,
            text: lowShops.length === 1
                ? `${count(total)} صنف ناقص أو خلص في ${worst.name}`
                : `${count(total)} صنف ناقص أو خلص في ${count(lowShops.length)} محلات — أكترهم ${worst.name}`,
        });
    }

    if (Number(compare?.totalOutstanding) > 0) {
        const worst = [...byShop].sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0))[0];
        items.push({
            key: 'debts', tone: 'info', kind: 'debts', to: worst ? `/shops/${worst.shopId}/customers` : undefined,
            text: `${money(compare.totalOutstanding)} ج.م لسه على العملاء ومتحصّلتش`,
        });
    }

    return items;
}
