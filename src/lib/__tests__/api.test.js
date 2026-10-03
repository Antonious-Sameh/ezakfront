import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

async function loadApi() {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE_URL', 'https://s5.example.com/');
  return import('@/lib/api');
}

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('api client (real backend mode)', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sends the bearer token and builds list query strings without "all" filters', async () => {
    const { api } = await loadApi();
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [], pagination: {} }));

    await api.getShopList('tok', 'shop1', 'sales', {
      page: 2, limit: 20, search: 'أحمد', from: '2026-09-01', to: '', extras: { paymentType: 'all', x: 'cash' },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://s5.example.com/api/shops/shop1/sales?page=2&limit=20&search=${encodeURIComponent('أحمد')}&from=2026-09-01&x=cash`,
    );
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('surfaces the backend message on failure', async () => {
    const { api, ApiError } = await loadApi();
    fetchMock.mockResolvedValue(jsonResponse({ success: false, message: 'المحل مش متاح' }, 502));

    const err = await api.getShops('tok').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('المحل مش متاح');
    expect(err.status).toBe(502);
  });

  it('calls the unauthorized handler on 401', async () => {
    const { api, setUnauthorizedHandler } = await loadApi();
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValue(jsonResponse({ success: false }, 401));

    await expect(api.getShops('tok')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('reports a network failure with a friendly message', async () => {
    const { api } = await loadApi();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.getShops('tok')).rejects.toMatchObject({ status: 0 });
  });
});

describe('api client (demo mode, no backend URL)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('serves the mock layer on demand without touching the network', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { api } = await import('@/lib/api');

    const res = await api.getShopList('tok', 'shop1', 'sales', { page: 1, limit: 5 });

    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(5);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('api client — cancellation & new endpoints', () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('passes the AbortSignal to fetch, and lets an AbortError through (not "network down")', async () => {
    const { api, ApiError } = await loadApi();
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    fetchMock.mockRejectedValue(abortError);
    const controller = new AbortController();

    const err = await api.getShopList('tok', 'shop1', 'sales', {}, { signal: controller.signal }).catch((e) => e);

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    expect(err.name).toBe('AbortError');
    expect(err).not.toBeInstanceOf(ApiError);
  });

  it('calls the settings and expense-reasons endpoints', async () => {
    const { api } = await loadApi();
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [] }));

    await api.getShopSettings('tok', 'shop2');
    await api.getExpenseReasons('tok', 'shop2');

    expect(fetchMock.mock.calls[0][0]).toBe('https://s5.example.com/api/shops/shop2/settings');
    expect(fetchMock.mock.calls[1][0]).toBe('https://s5.example.com/api/shops/shop2/expenses/reasons');
  });
});

describe('api client — position ("معانا كام")', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('calls /api/reports/position with the token', async () => {
    const { api } = await loadApi();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { totals: {}, byShop: [] } }));
    vi.stubGlobal('fetch', fetchMock);

    await api.getPosition('tok');

    expect(fetchMock.mock.calls[0][0]).toBe('https://s5.example.com/api/reports/position');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('demo mode returns the same shape, with an offline shop shown as unknown (null), not 0', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', '');
    const { api } = await import('@/lib/api');

    const res = await api.getPosition('tok');

    expect(res.data.byShop).toHaveLength(4);
    const offline = res.data.byShop.find((s) => !s.available);
    expect(offline).toMatchObject({ customersOwe: null, stockCost: null, cash: null });
    expect(res.data.totals.complete).toBe(false);
    expect(res.data.totals.net).toBe(
      Math.round((res.data.totals.cash + res.data.totals.stockCost + res.data.totals.customersOwe - res.data.totals.suppliersOwed) * 100) / 100,
    );
  });
});
