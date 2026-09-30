/**
 * CSV that opens correctly in Excel with Arabic text:
 *  - UTF-8 with a BOM (without it Excel shows Arabic as garbage),
 *  - CRLF line endings, RFC 4180 quoting,
 *  - protection against spreadsheet formula injection: a TEXT value that
 *    starts with = + - @ (or tab / CR) is prefixed with ' so Excel shows
 *    it as text instead of executing it. (Customer names, notes, etc. come
 *    from the shops' users — they must never run as formulas.) Real
 *    numbers, including negatives, stay numbers.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
    let s = String(value);
    if (FORMULA_START.test(s)) s = `'${s}`;
    if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function buildCsv(columns, rows) {
    const lines = [columns.map((c) => csvCell(c.header)).join(',')];
    for (const row of rows) lines.push(row.map(csvCell).join(','));
    return `\uFEFF${lines.join('\r\n')}\r\n`;
}
