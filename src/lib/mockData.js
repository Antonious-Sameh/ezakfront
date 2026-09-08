/**
 * Frontend-only mock data layer for System 5 (Part 2).
 * Returns the exact same response shapes defined in the API contract:
 *   list  → { success, data, pagination }
 *   item  → { success, data }
 * Used automatically by api.js when VITE_API_BASE_URL is not configured,
 * so the whole UI is demonstrable without a backend. Swap in a real API
 * by setting VITE_API_BASE_URL and every call below is bypassed.
 */

const AR_LOCALE = 'ar-EG';

// --- seeded RNG so each shop gets stable, distinct data ---
function hashSeed(str) {
	let h = 2166136261;
	for (let i = 0; i < str.length; i += 1) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}
function mulberry32(seed) {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;

const SHOP_NAMES = ['محل السلام', 'بقالة النور', 'سوبر ماركت المدينة', 'متجر الأمانة'];
const SHOP_AREAS = ['وسط البلد', 'المعادي', 'مدينة نصر', 'الزمالك'];

const PRODUCT_NAMES = [
	'أرز مصري 5 كجم', 'سكر أبيض 1 كجم', 'زيت دوار الشمس 1 لتر', 'شاي العروسة 250 جم',
	'مكرونة 400 جم', 'دقيق فاخر 1 كجم', 'لبن بودرة 900 جم', 'جبنة بيضاء 500 جم',
	'تونة علبة 160 جم', 'صلصة طماطم 700 جم', 'مياه معدنية 1.5 لتر', 'بسكويت 200 جم',
	'شوكولاتة 100 جم', 'قهوة 200 جم', 'عصير 1 لتر', 'مربى 400 جم',
	'صابون غسيل', 'منظف أرضيات 1 لتر', 'معجون أسنان', 'شامبو 400 مل',
];
const CATEGORIES = ['مواد غذائية', 'ألبان', 'مشروبات', 'حلويات', 'منظفات', 'عناية'];
const UNITS = ['قطعة', 'كجم', 'لتر', 'علبة', 'كرتونة'];
const CUSTOMER_NAMES = [
	'أحمد محمود', 'سارة عبد الله', 'محمد علي', 'فاطمة حسن', 'خالد إبراهيم',
	'منى السيد', 'عمرو خليل', 'نورهان أحمد', 'كريم فؤاد', 'هبة مصطفى',
	'ياسر عبد الرحمن', 'دعاء سامي', 'طارق نبيل', 'ريم عماد', 'شريف جمال',
];
const SUPPLIER_NAMES = ['شركة الدلتا للتوزيع', 'مؤسسة النيل للتجارة', 'شركة الأهرام', 'مورد الوادي', 'شركة الصفا'];
const CASHIER_NAMES = ['مدير المحل', 'أمين الصندوق', 'البائع الأول', 'البائع الثاني'];
const PAYMENT_TYPES = ['cash', 'card', 'credit'];
const PAYMENT_LABELS = { cash: 'نقدي', card: 'بطاقة', credit: 'آجل' };
const EXPENSE_CATEGORIES = ['إيجار', 'كهرباء', 'رواتب', 'صيانة', 'نقل', 'أخرى'];
const CASHBOX_CATEGORIES = ['مبيعات', 'مشتريات', 'إيداع', 'سحب', 'مصروف', 'أخرى'];
// Used only by the mock-data generator below (demo/preview mode with no
// real backend) — kept separate from ACTIVITY_LABELS_REAL because the mock
// feed's made-up variety doesn't need to match the real backend's actual
// enum (see ActivityLog's ACTIVITY_TYPES in Shops 1-4's models/constants.js).
const ACTIVITY_TYPES = ['sale', 'purchase', 'stock', 'login', 'customer', 'expense'];
const ACTIVITY_LABELS = {
	sale: 'بيع', purchase: 'شراء', stock: 'مخزون', login: 'تسجيل دخول',
	customer: 'عميل', expense: 'مصروف',
};
// The real backend's activity `type` values (see Shops 1-4's
// src/models/constants.js ACTIVITY_TYPES) — used by sectionConfigs.jsx for
// the actual filter dropdown and label rendering against live API data.
const ACTIVITY_LABELS_REAL = {
	product: 'منتج', customer: 'عميل', supplier: 'مورد', sale: 'بيع',
	purchase: 'شراء', expense: 'مصروف', cash: 'حركة نقدية', settings: 'إعدادات',
};

function daysAgo(rng, maxDays = 60) {
	const d = new Date();
	d.setDate(d.getDate() - randInt(rng, 0, maxDays));
	d.setHours(randInt(rng, 8, 21), randInt(rng, 0, 59), 0, 0);
	return d.toISOString();
}

// --- per-shop dataset builder (memoized) ---
const shopCache = new Map();
function buildShop(shopId, index) {
	const key = `${shopId}:${index}`;
	if (shopCache.has(key)) return shopCache.get(key);

	const rng = mulberry32(hashSeed(shopId || 'shop') + index * 7919);
	const products = Array.from({ length: 24 }, (_, i) => {
		const cost = randInt(rng, 5, 120);
		const price = Math.round(cost * (1.1 + rng() * 0.6));
		const stock = randInt(rng, 0, 80);
		const threshold = 10;
		return {
			id: `p-${shopId}-${i + 1}`,
			name: pick(rng, PRODUCT_NAMES),
			sku: `SKU-${1000 + i}`,
			category: pick(rng, CATEGORIES),
			price,
			cost,
			stock,
			unit: pick(rng, UNITS),
			lowStockThreshold: threshold,
			supplierName: pick(rng, SUPPLIER_NAMES),
			status: stock === 0 ? 'out' : stock <= threshold ? 'low' : 'ok',
		};
	});

	const customers = Array.from({ length: 18 }, (_, i) => {
		const orders = randInt(rng, 1, 40);
		const spent = orders * randInt(rng, 50, 600);
		return {
			id: `c-${shopId}-${i + 1}`,
			name: pick(rng, CUSTOMER_NAMES),
			phone: `010${randInt(rng, 10000000, 99999999)}`,
			email: `customer${i + 1}@mail.com`,
			totalOrders: orders,
			totalSpent: spent,
			balance: rng() > 0.7 ? randInt(rng, 50, 800) : 0,
			createdAt: daysAgo(rng, 300),
			address: pick(rng, SHOP_AREAS),
		};
	});

	const suppliers = Array.from({ length: 6 }, (_, i) => {
		const purchases = randInt(rng, 2, 30);
		return {
			id: `s-${shopId}-${i + 1}`,
			name: SUPPLIER_NAMES[i % SUPPLIER_NAMES.length],
			phone: `011${randInt(rng, 10000000, 99999999)}`,
			email: `supplier${i + 1}@co.com`,
			contactPerson: pick(rng, CUSTOMER_NAMES),
			totalPurchases: purchases,
			totalAmount: purchases * randInt(rng, 500, 4000),
			balance: rng() > 0.5 ? randInt(rng, 100, 2000) : 0,
			createdAt: daysAgo(rng, 400),
		};
	});

	const sales = Array.from({ length: 42 }, (_, i) => {
		const itemCount = randInt(rng, 1, 6);
		const items = Array.from({ length: itemCount }, () => {
			const p = pick(rng, products);
			const qty = randInt(rng, 1, 5);
			return { productName: p.name, qty, price: p.price, total: p.price * qty };
		});
		const subtotal = items.reduce((s, it) => s + it.total, 0);
		const discount = rng() > 0.8 ? randInt(rng, 5, 50) : 0;
		const tax = Math.round(subtotal * 0.14);
		const total = subtotal - discount + tax;
		return {
			id: `sale-${shopId}-${i + 1}`,
			invoiceNo: `INV-${1000 + i}`,
			customerId: rng() > 0.3 ? pick(rng, customers).id : null,
			customerName: rng() > 0.3 ? pick(rng, customers).name : 'عميل نقدي',
			date: daysAgo(rng, 60),
			subtotal,
			discount,
			tax,
			total,
			paymentType: pick(rng, PAYMENT_TYPES),
			cashier: pick(rng, CASHIER_NAMES),
			items,
			status: rng() > 0.95 ? 'returned' : 'completed',
		};
	}).sort((a, b) => new Date(b.date) - new Date(a.date));

	const purchases = Array.from({ length: 26 }, (_, i) => {
		const itemCount = randInt(rng, 1, 5);
		const items = Array.from({ length: itemCount }, () => {
			const p = pick(rng, products);
			const qty = randInt(rng, 5, 40);
			return { productName: p.name, qty, cost: p.cost, total: p.cost * qty };
		});
		const total = items.reduce((s, it) => s + it.total, 0);
		return {
			id: `pur-${shopId}-${i + 1}`,
			invoiceNo: `PO-${2000 + i}`,
			supplierId: pick(rng, suppliers).id,
			supplierName: pick(rng, suppliers).name,
			date: daysAgo(rng, 90),
			subtotal: total,
			total,
			items,
			status: pick(rng, ['received', 'pending', 'received', 'received']),
		};
	}).sort((a, b) => new Date(b.date) - new Date(a.date));

	const cashbox = Array.from({ length: 30 }, (_, i) => ({
		id: `cb-${shopId}-${i + 1}`,
		type: rng() > 0.45 ? 'in' : 'out',
		amount: randInt(rng, 50, 1500),
		date: daysAgo(rng, 30),
		description: pick(rng, CASHBOX_CATEGORIES),
		category: pick(rng, CASHBOX_CATEGORIES),
		method: pick(rng, ['cash', 'card', 'transfer']),
	})).sort((a, b) => new Date(b.date) - new Date(a.date));

	const expenses = Array.from({ length: 22 }, (_, i) => ({
		id: `exp-${shopId}-${i + 1}`,
		category: pick(rng, EXPENSE_CATEGORIES),
		amount: randInt(rng, 100, 3000),
		date: daysAgo(rng, 60),
		description: `مصروف ${pick(rng, EXPENSE_CATEGORIES)}`,
		method: pick(rng, ['cash', 'card', 'transfer']),
		beneficiary: pick(rng, SUPPLIER_NAMES.concat(CASHIER_NAMES)),
	})).sort((a, b) => new Date(b.date) - new Date(a.date));

	const activity = Array.from({ length: 40 }, (_, i) => ({
		id: `act-${shopId}-${i + 1}`,
		type: pick(rng, ACTIVITY_TYPES),
		date: daysAgo(rng, 14),
		description: '',
		user: pick(rng, CASHIER_NAMES),
	})).sort((a, b) => new Date(b.date) - new Date(a.date));
	activity.forEach((a) => {
		const map = {
			sale: 'تم تسجيل فاتورة بيع جديدة',
			purchase: 'تم تسجيل فاتورة مشتريات',
			stock: 'تم تعديل مخزون منتج',
			login: 'تم تسجيل الدخول للنظام',
			customer: 'تم إضافة عميل جديد',
			expense: 'تم تسجيل مصروف',
		};
		a.description = map[a.type] || 'نشاط';
	});

	const ds = { products, customers, suppliers, sales, purchases, cashbox, expenses, activity };
	shopCache.set(key, ds);
	return ds;
}

// --- shops list (shared with Part 1) ---
let shopsCache = null;
function getShops() {
	if (shopsCache) return shopsCache;
	shopsCache = SHOP_NAMES.map((name, i) => {
		const id = `shop-${i + 1}`;
		const ds = buildShop(id, i);
		const today = new Date().toISOString().slice(0, 10);
		const todaySales = ds.sales
			.filter((s) => s.date.slice(0, 10) === today)
			.reduce((sum, s) => sum + s.total, 0);
		const lowStockCount = ds.products.filter((p) => p.status !== 'ok').length;
		return {
			id,
			name,
			area: SHOP_AREAS[i],
			status: i === 1 ? 'offline' : 'online',
			todaySales,
			lowStockCount,
			logoUrl: null,
		};
	});
	return shopsCache;
}

// --- query param helpers ---
function parseParams(params = {}) {
	return {
		page: Math.max(1, Number(params.page) || 1),
		limit: Math.max(1, Number(params.limit) || 20),
		search: (params.search || '').trim().toLowerCase(),
		from: params.from || '',
		to: params.to || '',
		extras: params.extras || {},
	};
}
function inDateRange(iso, from, to) {
	if (!from && !to) return true;
	const d = iso.slice(0, 10);
	if (from && d < from) return false;
	if (to && d > to) return false;
	return true;
}
function paginate(list, { page, limit }) {
	const total = list.length;
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * limit;
	return {
		success: true,
		data: list.slice(start, start + limit),
		pagination: { page: safePage, limit, total, totalPages },
	};
}

// --- list filters per entity ---
function filterList(ds, entity, p) {
	let list = ds[entity];
	const searchFields = {
		products: ['name', 'sku', 'category'],
		customers: ['name', 'phone', 'email'],
		suppliers: ['name', 'phone', 'contactPerson'],
		sales: ['invoiceNo', 'customerName'],
		purchases: ['invoiceNo', 'supplierName'],
		cashbox: ['description', 'category', 'method'],
		expenses: ['category', 'description', 'beneficiary'],
		activity: ['type', 'description', 'user'],
	}[entity];
	const dateField = {
		sales: 'date', purchases: 'date', cashbox: 'date', expenses: 'date', activity: 'date',
	}[entity];

	if (p.search && searchFields) {
		list = list.filter((row) => searchFields.some((f) => String(row[f] || '').toLowerCase().includes(p.search)));
	}
	if (dateField && (p.from || p.to)) {
		list = list.filter((row) => inDateRange(row[dateField], p.from, p.to));
	}
	if (entity === 'sales' && p.extras.paymentType && p.extras.paymentType !== 'all') {
		list = list.filter((row) => row.paymentType === p.extras.paymentType);
	}
	if (entity === 'sales' && p.extras.status && p.extras.status !== 'all') {
		list = list.filter((row) => row.status === p.extras.status);
	}
	if (entity === 'purchases' && p.extras.status && p.extras.status !== 'all') {
		list = list.filter((row) => row.status === p.extras.status);
	}
	if (entity === 'products' && p.extras.status && p.extras.status !== 'all') {
		list = list.filter((row) => row.status === p.extras.status);
	}
	if (entity === 'cashbox' && p.extras.type && p.extras.type !== 'all') {
		list = list.filter((row) => row.type === p.extras.type);
	}
	if (entity === 'expenses' && p.extras.category && p.extras.category !== 'all') {
		list = list.filter((row) => row.category === p.extras.category);
	}
	if (entity === 'activity' && p.extras.type && p.extras.type !== 'all') {
		list = list.filter((row) => row.type === p.extras.type);
	}
	return list;
}

function findItem(ds, entity, id) {
	return ds[entity].find((row) => row.id === id) || null;
}

// --- summaries & reports ---
function overview(shopId, index) {
	const ds = buildShop(shopId, index);
	const today = new Date().toISOString().slice(0, 10);
	const month = today.slice(0, 7);
	const todaySales = ds.sales.filter((s) => s.date.slice(0, 10) === today).reduce((a, s) => a + s.total, 0);
	const monthSales = ds.sales.filter((s) => s.date.slice(0, 7) === month).reduce((a, s) => a + s.total, 0);
	const todayProfit = ds.sales
		.filter((s) => s.date.slice(0, 10) === today)
		.reduce((a, s) => a + s.items.reduce((x, it) => x + (it.price - it.price * 0.7) * it.qty, 0), 0);
	const cashboxBalance = ds.cashbox.reduce((a, c) => a + (c.type === 'in' ? c.amount : -c.amount), 0);
	const lowStockItems = ds.products.filter((p) => p.status !== 'ok');
	return {
		success: true,
		data: {
			todaySales,
			monthSales,
			todayProfit,
			todayOrders: ds.sales.filter((s) => s.date.slice(0, 10) === today).length,
			productCount: ds.products.length,
			lowStockCount: lowStockItems.length,
			cashboxBalance,
			customerCount: ds.customers.length,
			lowStockItems: lowStockItems.slice(0, 5),
		},
	};
}

function cashboxSummary(shopId, index, p) {
	const ds = buildShop(shopId, index);
	let list = ds.cashbox;
	if (p.from || p.to) list = list.filter((c) => inDateRange(c.date, p.from, p.to));
	const totalIn = list.filter((c) => c.type === 'in').reduce((a, c) => a + c.amount, 0);
	const totalOut = list.filter((c) => c.type === 'out').reduce((a, c) => a + c.amount, 0);
	const today = new Date().toISOString().slice(0, 10);
	return {
		success: true,
		data: {
			totalIn,
			totalOut,
			balance: totalIn - totalOut,
			todayIn: ds.cashbox.filter((c) => c.type === 'in' && c.date.slice(0, 10) === today).reduce((a, c) => a + c.amount, 0),
			todayOut: ds.cashbox.filter((c) => c.type === 'out' && c.date.slice(0, 10) === today).reduce((a, c) => a + c.amount, 0),
		},
	};
}

function expensesSummary(shopId, index, p) {
	const ds = buildShop(shopId, index);
	let list = ds.expenses;
	if (p.from || p.to) list = list.filter((e) => inDateRange(e.date, p.from, p.to));
	const byCategory = {};
	list.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
	const month = new Date().toISOString().slice(0, 7);
	return {
		success: true,
		data: {
			total: list.reduce((a, e) => a + e.amount, 0),
			thisMonth: ds.expenses.filter((e) => e.date.slice(0, 7) === month).reduce((a, e) => a + e.amount, 0),
			byCategory,
		},
	};
}

function bucketByDay(list, valueKey) {
	const map = {};
	list.forEach((row) => {
		const d = row.date.slice(0, 10);
		if (!map[d]) map[d] = { date: d, value: 0, count: 0 };
		map[d].value += row[valueKey];
		map[d].count += 1;
	});
	return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

function buildReport(shopId, index, type, p) {
	const ds = buildShop(shopId, index);
	let sales = ds.sales;
	let purchases = ds.purchases;
	if (p.from || p.to) {
		sales = sales.filter((s) => inDateRange(s.date, p.from, p.to));
		purchases = purchases.filter((s) => inDateRange(s.date, p.from, p.to));
	}

	if (type === 'sales') {
		const totalSales = sales.reduce((a, s) => a + s.total, 0);
		const totalProfit = sales.reduce((a, s) => a + s.items.reduce((x, it) => x + (it.price - it.price * 0.7) * it.qty, 0), 0);
		const byDay = bucketByDay(sales, 'total');
		const byPaymentType = {};
		sales.forEach((s) => { byPaymentType[s.paymentType] = (byPaymentType[s.paymentType] || 0) + s.total; });
		const productMap = {};
		sales.forEach((s) => s.items.forEach((it) => { productMap[it.productName] = (productMap[it.productName] || 0) + it.qty; }));
		const topProducts = Object.entries(productMap).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 6);
		return { success: true, data: { totalSales, totalProfit, count: sales.length, byDay, byPaymentType, topProducts } };
	}
	if (type === 'purchases') {
		const totalPurchases = purchases.reduce((a, s) => a + s.total, 0);
		const byDay = bucketByDay(purchases, 'total');
		const supMap = {};
		purchases.forEach((s) => { supMap[s.supplierName] = (supMap[s.supplierName] || 0) + s.total; });
		const topSuppliers = Object.entries(supMap).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6);
		return { success: true, data: { totalPurchases, count: purchases.length, byDay, topSuppliers } };
	}
	if (type === 'profit') {
		const totalSales = sales.reduce((a, s) => a + s.total, 0);
		const totalCost = sales.reduce((a, s) => a + s.items.reduce((x, it) => x + it.price * 0.7 * it.qty, 0), 0);
		const totalProfit = totalSales - totalCost;
		const merged = {};
		sales.forEach((s) => {
			const d = s.date.slice(0, 10);
			if (!merged[d]) merged[d] = { date: d, sales: 0, cost: 0 };
			merged[d].sales += s.total;
			merged[d].cost += s.items.reduce((x, it) => x + it.price * 0.7 * it.qty, 0);
		});
		const byDay = Object.values(merged).map((d) => ({ ...d, profit: d.sales - d.cost })).sort((a, b) => a.date.localeCompare(b.date));
		return { success: true, data: { totalSales, totalCost, totalProfit, margin: totalSales ? Math.round((totalProfit / totalSales) * 100) : 0, byDay } };
	}
	if (type === 'inventory') {
		const totalStockValue = ds.products.reduce((a, p) => a + p.cost * p.stock, 0);
		const byCategory = {};
		ds.products.forEach((p) => { byCategory[p.category] = (byCategory[p.category] || 0) + 1; });
		const topValueProducts = [...ds.products].sort((a, b) => b.cost * b.stock - a.cost * a.stock).slice(0, 6).map((p) => ({ name: p.name, value: p.cost * p.stock, stock: p.stock }));
		return { success: true, data: { totalProducts: ds.products.length, totalStockValue, lowStockCount: ds.products.filter((p) => p.status !== 'ok').length, byCategory, topValueProducts } };
	}
	if (type === 'customers') {
		const top = [...ds.customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 8);
		return { success: true, data: { totalCustomers: ds.customers.length, topCustomers: top } };
	}
	if (type === 'suppliers') {
		const top = [...ds.suppliers].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 8);
		return { success: true, data: { totalSuppliers: ds.suppliers.length, topSuppliers: top } };
	}
	return { success: true, data: {} };
}

// --- public API mirroring api.js shop methods ---
function shopIndex(shopId) {
	const shops = getShops();
	const idx = shops.findIndex((s) => s.id === shopId);
	return idx >= 0 ? idx : 0;
}

export const mock = {
	getShops: () => ({ success: true, data: getShops() }),
	getCompareReport: (from, to) => {
		const shops = getShops();
		const byShop = shops.map((s) => {
			const ds = buildShop(s.id, shopIndex(s.id));
			let sales = ds.sales;
			if (from || to) sales = sales.filter((row) => inDateRange(row.date, from, to));
			const totalSales = sales.reduce((a, x) => a + x.total, 0);
			const totalProfit = sales.reduce((a, x) => a + x.items.reduce((y, it) => y + (it.price - it.price * 0.7) * it.qty, 0), 0);
			return { shopId: s.id, shopName: s.name, sales: totalSales, profit: totalProfit };
		});
		return {
			success: true,
			data: {
				totalSales: byShop.reduce((a, x) => a + x.sales, 0),
				totalProfit: byShop.reduce((a, x) => a + x.profit, 0),
				byShop,
			},
		};
	},

	getShopOverview: (shopId) => overview(shopId, shopIndex(shopId)),

	getShopList: (shopId, entity, params) => {
		const ds = buildShop(shopId, shopIndex(shopId));
		const filtered = filterList(ds, entity, parseParams(params));
		return paginate(filtered, parseParams(params));
	},
	getShopItem: (shopId, entity, id) => {
		const ds = buildShop(shopId, shopIndex(shopId));
		return { success: true, data: findItem(ds, entity, id) };
	},

	getCashboxSummary: (shopId, params) => cashboxSummary(shopId, shopIndex(shopId), parseParams(params)),
	getExpensesSummary: (shopId, params) => expensesSummary(shopId, shopIndex(shopId), parseParams(params)),

	getShopReport: (shopId, type, params) => buildReport(shopId, shopIndex(shopId), type, parseParams(params)),
};

export { PAYMENT_LABELS, ACTIVITY_LABELS, ACTIVITY_LABELS_REAL, AR_LOCALE };
