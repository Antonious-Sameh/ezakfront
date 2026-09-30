/**
 * The two tiny date helpers the app needs. They replace date-fns
 * (format + subDays pulled ~20 KB into the bundle for these two calls).
 * Both work in the device's local time, exactly like date-fns did.
 */

/** A new Date `days` days before `date` (calendar days, DST-safe). */
export function subDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d;
}

/** Local calendar date as `YYYY-MM-DD` (what the API's from/to filters expect). */
export function toISODate(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
