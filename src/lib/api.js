/**
 * Central API wrapper for System 5.
 * Every request to the external REST API goes through this file.
 * Base URL comes from VITE_API_BASE_URL — never hardcoded.
 *
 * When VITE_API_BASE_URL is empty (frontend-only build), calls fall back
 * to the in-memory mock layer (lib/mockData.js) which returns the exact
 * same contract shapes, so the UI is fully demonstrable without a backend.
 */


const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const USE_MOCK = !BASE_URL;

/**
 * Demo mode only: the mock layer is loaded on demand, as its own chunk, so
 * a production build (VITE_API_BASE_URL set) never downloads it.
 */
let mockPromise = null;
function withMock(call) {
	if (!mockPromise) mockPromise = import('./mockData').then((m) => m.mock);
	return mockPromise.then(call);
}

export class ApiError extends Error {
	constructor(message, status) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

let onUnauthorized = null;

/** Called once by AuthProvider so a 401 anywhere logs the user out. */
export function setUnauthorizedHandler(handler) {
	onUnauthorized = handler;
}

async function request(path, { method = 'GET', body, token, signal } = {}) {
	let response;
	try {
		response = await fetch(`${BASE_URL}${path}`, {
			method,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: body ? JSON.stringify(body) : undefined,
			signal,
		});
	} catch (err) {
		// A request cancelled on purpose (the user moved on — see
		// useApiQuery) is not a network failure: pass it through untouched.
		if (err?.name === 'AbortError') throw err;
		throw new ApiError('تعذر الاتصال بالخادم، تأكد من الإنترنت وحاول تاني', 0);
	}

	if (response.status === 401) {
		onUnauthorized?.();
		throw new ApiError('انتهت الجلسة، سجل الدخول من جديد', 401);
	}

	let payload = null;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}

	if (!response.ok || payload?.success === false) {
		throw new ApiError(payload?.message || 'حصل خطأ أثناء تحميل البيانات', response.status);
	}

	return payload;
}

/** Build a query string from pagination/filter params shared by every list endpoint. */
function buildQuery(params = {}) {
	const { page = 1, limit = 20, search = '', from = '', to = '', extras = {} } = params;
	const parts = [`page=${page}`, `limit=${limit}`];
	if (search) parts.push(`search=${encodeURIComponent(search)}`);
	if (from) parts.push(`from=${encodeURIComponent(from)}`);
	if (to) parts.push(`to=${encodeURIComponent(to)}`);
	Object.entries(extras).forEach(([key, value]) => {
		if (value && value !== 'all') parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
	});
	return `?${parts.join('&')}`;
}

export const api = {
	/** POST /api/auth/login */
	login: (password) => {
		if (USE_MOCK) {
			// Frontend-only: any non-empty password logs in.
			return Promise.resolve({ success: true, token: 'mock-token' });
		}
		return request('/api/auth/login', { method: 'POST', body: { password } });
	},

	/** GET /api/shops */
	getShops: (token, opts = {}) => (USE_MOCK ? withMock((m) => m.getShops()) : request('/api/shops', { token, signal: opts.signal })),

	/** GET /api/reports/compare?from=YYYY-MM-DD&to=YYYY-MM-DD */
	getCompareReport: (token, from, to, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.getCompareReport(from, to))
			: request(`/api/reports/compare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { token, signal: opts.signal }),

	// --- Shop detail endpoints (Part 2) ---

	/** GET /api/shops/:shopId/overview */
	getShopOverview: (token, shopId, opts = {}) =>
		USE_MOCK ? withMock((m) => m.getShopOverview(shopId)) : request(`/api/shops/${shopId}/overview`, { token, signal: opts.signal }),

	/** Generic list: GET /api/shops/:shopId/:entity?page=&limit=&search=&from=&to=&... */
	getShopList: (token, shopId, entity, params, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.getShopList(shopId, entity, params))
			: request(`/api/shops/${shopId}/${entity}${buildQuery(params)}`, { token, signal: opts.signal }),

	/** Generic item: GET /api/shops/:shopId/:entity/:id */
	getShopItem: (token, shopId, entity, id, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.getShopItem(shopId, entity, id))
			: request(`/api/shops/${shopId}/${entity}/${id}`, { token, signal: opts.signal }),

	/** GET /api/shops/:shopId/cashbox/summary */
	getCashboxSummary: (token, shopId, params, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.getCashboxSummary(shopId, params))
			: request(`/api/shops/${shopId}/cashbox/summary${buildQuery(params)}`, { token, signal: opts.signal }),

	/** GET /api/shops/:shopId/expenses/summary */
	getExpensesSummary: (token, shopId, params, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.getExpensesSummary(shopId, params))
			: request(`/api/shops/${shopId}/expenses/summary${buildQuery(params)}`, { token, signal: opts.signal }),

	/** GET /api/shops/:shopId/reports/:type */
	getShopReport: (token, shopId, type, params, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.getShopReport(shopId, type, params))
			: request(`/api/shops/${shopId}/reports/${type}${buildQuery(params)}`, { token, signal: opts.signal }),

	/** GET /api/shops/:shopId/settings — shop name/phone/address/footer for invoices. */
	getShopSettings: (token, shopId, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.getShopSettings(shopId))
			: request(`/api/shops/${shopId}/settings`, { token, signal: opts.signal }),

	/**
	 * GET /api/shops/:shopId/:entity/export — every row matching the filters
	 * (capped server-side), as { data, total, truncated, maxRows }.
	 */
	exportShopList: (token, shopId, entity, params, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.exportShopList(shopId, entity, params))
			: // page/limit in the query are ignored by the export endpoint.
				request(`/api/shops/${shopId}/${entity}/export${buildQuery(params)}`, { token, signal: opts.signal }),

	/**
	 * GET /api/shops/:shopId/expenses/reasons — the expense reasons really
	 * recorded in that shop. `supported: false` = the shop hasn't been
	 * updated yet; the expense filter is then simply hidden.
	 */
	getExpenseReasons: (token, shopId, opts = {}) =>
		USE_MOCK
			? withMock((m) => m.getExpenseReasons(shopId))
			: request(`/api/shops/${shopId}/expenses/reasons`, { token, signal: opts.signal }),
};
