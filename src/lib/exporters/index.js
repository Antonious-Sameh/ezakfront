/**
 * Export entry point, loaded on demand (dynamic import) the first time the
 * owner clicks "تصدير" — the writers and fflate never weigh on page load.
 */
import { buildXlsx } from './xlsx';
import { buildCsv } from './csv';
import { downloadFile, safeFileName } from './download';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const CSV_MIME = 'text/csv;charset=utf-8';

/**
 * spec: { columns: [{ header, type, width, value(row) }], lines?: { name, columns, rows(row) → [...] } }
 * format: 'xlsx' | 'csv'
 */
export function buildExportFile(spec, rows, { format, sheetName, fileBase }) {
    const table = rows.map((row) => spec.columns.map((c) => c.value(row)));
    const name = safeFileName(fileBase);

    if (format === 'csv') {
        return { fileName: `${name}.csv`, data: buildCsv(spec.columns, table), mime: CSV_MIME };
    }

    const sheets = [{ name: sheetName, columns: spec.columns, rows: table }];
    if (spec.lines) {
        const lineRows = rows.flatMap((row) => spec.lines.rows(row));
        if (lineRows.length) sheets.push({ name: spec.lines.name, columns: spec.lines.columns, rows: lineRows });
    }
    return { fileName: `${name}.xlsx`, data: buildXlsx(sheets), mime: XLSX_MIME };
}

export { downloadFile, buildXlsx, buildCsv };
