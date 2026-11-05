export const formatCurrency = (amount, { currency = 'USD', locale, ...options } = {}) =>
	Number(amount || 0).toLocaleString(locale, { style: 'currency', currency, ...options });

/**
 * Safety net for Arabic locales: plain `ar-EG` groups thousands with U+066C
 * (٬), a tiny mark that all but disappears between digits. The app's locale
 * (AR_LOCALE, Latin digits) already uses a normal comma; anything else in
 * the Arabic family is forced to one too. Only the separator can change —
 * digits, decimals and the value itself are exactly Intl's.
 */
const ARABIC_GROUP_SEPARATOR = ',';
const isArabicLocale = (locale) => typeof locale === 'string' && /^ar(-|$)/i.test(locale);

export const formatNumber = (value, { locale, ...options } = {}) => {
	const number = Number(value || 0);

	if (!isArabicLocale(locale)) return number.toLocaleString(locale, options);

	return new Intl.NumberFormat(locale, options)
		.formatToParts(number)
		.map((part) => (part.type === 'group' ? ARABIC_GROUP_SEPARATOR : part.value))
		.join('');
};

/**
 * Money: never rounded beyond the piastre. Whole amounts show no decimals
 * (١٢٣٠٠), amounts with piastres always show both digits (١٢٫٥٠, not ١٢٫٥),
 * so a column of prices lines up and nothing looks cut off.
 */
export const formatMoney = (value, { locale } = {}) => {
	const number = Number(value || 0);
	const hasPiastres = Math.round(number * 100) % 100 !== 0;

	return formatNumber(number, { locale, minimumFractionDigits: hasPiastres ? 2 : 0, maximumFractionDigits: 2 });
};

export const formatDate = (date, { locale, ...options } = {}) => {
	if (!date) return '';

	const parsed = new Date(date);

	if (Number.isNaN(parsed.getTime())) return '';

	return parsed.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', ...options });
};

export const truncate = (text, max = 120) => {
	if (!text) return '';

	return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
};

export const slugify = (text) =>
	String(text || '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s_-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
