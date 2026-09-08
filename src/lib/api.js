/**
 * Central API wrapper for System 5.
 * Every request to the external REST API goes through this file.
 * Base URL comes from VITE_API_BASE_URL — never hardcoded.
 *
 * When VITE_API_BASE_URL is empty (frontend-only build), calls fall back
 * to the in-memory mock layer (lib/mockData.js) which returns the exact
 * same contract shapes, so the UI is fully demonstrable without a backend.
 */

import { mock } from './mockData';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const USE_MOCK = !BASE_URL;

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

async function request(path, { method = 'GET', body, token } = {}) {
	let response;
	try {
		response = await fetch(`${BASE_URL}${path}`, {
			method,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch {
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
	getShops: (token) => (USE_MOCK ? Promise.resolve(mock.getShops()) : request('/api/shops', { token })),

	/** GET /api/reports/compare?from=YYYY-MM-DD&to=YYYY-MM-DD */
	getCompareReport: (token, from, to) =>
		USE_MOCK
			? Promise.resolve(mock.getCompareReport(from, to))
			: request(`/api/reports/compare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { token }),

	// --- Shop detail endpoints (Part 2) ---

	/** GET /api/shops/:shopId/overview */
	getShopOverview: (token, shopId) =>
		USE_MOCK ? Promise.resolve(mock.getShopOverview(shopId)) : request(`/api/shops/${shopId}/overview`, { token }),

	/** Generic list: GET /api/shops/:shopId/:entity?page=&limit=&search=&from=&to=&... */
	getShopList: (token, shopId, entity, params) =>
		USE_MOCK
			? Promise.resolve(mock.getShopList(shopId, entity, params))
			: request(`/api/shops/${shopId}/${entity}${buildQuery(params)}`, { token }),

	/** Generic item: GET /api/shops/:shopId/:entity/:id */
	getShopItem: (token, shopId, entity, id) =>
		USE_MOCK
			? Promise.resolve(mock.getShopItem(shopId, entity, id))
			: request(`/api/shops/${shopId}/${entity}/${id}`, { token }),

	/** GET /api/shops/:shopId/cashbox/summary */
	getCashboxSummary: (token, shopId, params) =>
		USE_MOCK
			? Promise.resolve(mock.getCashboxSummary(shopId, params))
			: request(`/api/shops/${shopId}/cashbox/summary${buildQuery(params)}`, { token }),

	/** GET /api/shops/:shopId/expenses/summary */
	getExpensesSummary: (token, shopId, params) =>
		USE_MOCK
			? Promise.resolve(mock.getExpensesSummary(shopId, params))
			: request(`/api/shops/${shopId}/expenses/summary${buildQuery(params)}`, { token }),

	/** GET /api/shops/:shopId/reports/:type */
	getShopReport: (token, shopId, type, params) =>
		USE_MOCK
			? Promise.resolve(mock.getShopReport(shopId, type, params))
			: request(`/api/shops/${shopId}/reports/${type}${buildQuery(params)}`, { token }),
};
