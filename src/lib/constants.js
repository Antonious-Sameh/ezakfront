/**
 * App-wide constants used by real screens.
 *
 * These used to live in lib/mockData.js, which meant every production build
 * shipped the whole mock-data generator (500+ lines of fake shops) just
 * because a screen needed AR_LOCALE or a label map. mockData.js now imports
 * these from here and is only loaded — as its own chunk — in demo mode.
 */

export const AR_LOCALE = 'ar-EG';

/** Payment method labels (the shops only use cash / credit; card kept for demo data). */
export const PAYMENT_LABELS = { cash: 'نقدي', card: 'بطاقة', credit: 'آجل' };

/**
 * The real backend's activity `type` values (Shops 1-4's
 * src/models/constants.js ACTIVITY_TYPES) — used for the activity filter
 * dropdown and label rendering against live API data.
 */
export const ACTIVITY_LABELS_REAL = {
    product: 'منتج', customer: 'عميل', supplier: 'مورد', sale: 'بيع',
    purchase: 'شراء', expense: 'مصروف', cash: 'حركة نقدية', settings: 'إعدادات',
};
