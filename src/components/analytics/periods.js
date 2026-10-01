import { subDays, toISODate } from '@/lib/dates';

/** Rolling periods shared by the home page and the shop reports page. */
export const PERIODS = [
    { id: 'today', label: 'اليوم', days: 1, previous: 'امبارح' },
    { id: 'week', label: 'آخر ٧ أيام', days: 7, previous: 'الـ٧ أيام اللي قبلها' },
    { id: 'month', label: 'آخر ٣٠ يوم', days: 30, previous: 'الـ٣٠ يوم اللي قبلهم' },
];

export function periodById(id) {
    return PERIODS.find((p) => p.id === id) || PERIODS[2];
}

/** { from, to } (YYYY-MM-DD, device local time) for a rolling period ending today. */
export function periodRange(id, now = new Date()) {
    const p = periodById(id);
    return { from: toISODate(subDays(now, p.days - 1)), to: toISODate(now) };
}
