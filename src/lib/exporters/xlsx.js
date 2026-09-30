import { zipSync, strToU8 } from 'fflate';

/**
 * Minimal, dependency-light .xlsx writer (Office Open XML).
 *
 * Why not SheetJS: the npm "xlsx" package is frozen at an old version with
 * published advisories, and it is ~400 KB. Writing a sheet only needs a
 * handful of XML files zipped together — fflate (~8 KB) does the zip.
 *
 * Features used by System 5's exports: several sheets, right-to-left sheet
 * view (Arabic), bold frozen header row with an auto-filter, column widths,
 * and real numeric cells (so the owner can SUM / sort in Excel).
 *
 *   buildXlsx([{ name, columns: [{ header, type, width }], rows: [[...]] }]) → Uint8Array
 *   column.type: 'text' | 'number' | 'money'   (default 'text')
 */

// Style indexes into cellXfs below.
const STYLE = { text: 0, header: 1, money: 2, number: 3 };

const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g; // eslint-disable-line no-control-regex

export function escapeXml(value) {
    return String(value)
        .replace(INVALID_XML, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** 0 → A, 25 → Z, 26 → AA … */
export function columnLetter(index) {
    let n = index + 1;
    let s = '';
    while (n > 0) {
        const r = (n - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

/** Excel sheet names: ≤ 31 chars, none of []:*?/\ , not empty, unique. */
export function safeSheetName(name, used) {
    let base = String(name || 'Sheet').replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Sheet';
    let candidate = base;
    let i = 2;
    while (used.has(candidate)) {
        const suffix = ` (${i})`;
        candidate = base.slice(0, 31 - suffix.length) + suffix;
        i += 1;
    }
    used.add(candidate);
    return candidate;
}

function cellXml(ref, value, type, isHeader) {
    if (value === undefined || value === null || value === '') return '';
    const numeric = !isHeader && (type === 'money' || type === 'number') && typeof value === 'number' && Number.isFinite(value);
    if (numeric) {
        return `<c r="${ref}" s="${type === 'money' ? STYLE.money : STYLE.number}"><v>${value}</v></c>`;
    }
    const s = isHeader ? ` s="${STYLE.header}"` : '';
    return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function sheetXml({ columns, rows }) {
    const lastCol = columnLetter(Math.max(columns.length - 1, 0));
    const lastRow = rows.length + 1;
    const cols = columns
        .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 16}" customWidth="1"/>`)
        .join('');
    const header = `<row r="1">${columns.map((c, i) => cellXml(`${columnLetter(i)}1`, c.header, 'text', true)).join('')}</row>`;
    const body = rows
        .map((row, r) => {
            const n = r + 2;
            return `<row r="${n}">${columns.map((c, i) => cellXml(`${columnLetter(i)}${n}`, row[i], c.type, false)).join('')}</row>`;
        })
        .join('');
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        `<dimension ref="A1:${lastCol}${lastRow}"/>` +
        '<sheetViews><sheetView rightToLeft="1" workbookViewId="0">' +
        '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
        '</sheetView></sheetViews>' +
        '<sheetFormatPr defaultRowHeight="18"/>' +
        (cols ? `<cols>${cols}</cols>` : '') +
        `<sheetData>${header}${body}</sheetData>` +
        (columns.length ? `<autoFilter ref="A1:${lastCol}${lastRow}"/>` : '') +
        '</worksheet>'
    );
}

const STYLES_XML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>' +
    '<fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="4">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

export function buildXlsx(sheets) {
    const used = new Set();
    const named = sheets.map((sheet) => ({ ...sheet, name: safeSheetName(sheet.name, used) }));
    const files = {
        '[Content_Types].xml': strToU8(
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                '<Default Extension="xml" ContentType="application/xml"/>' +
                '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
                '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
                named
                    .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
                    .join('') +
                '</Types>',
        ),
        '_rels/.rels': strToU8(
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
                '</Relationships>',
        ),
        'xl/workbook.xml': strToU8(
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
                '<bookViews><workbookView/></bookViews><sheets>' +
                named.map((s, i) => `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
                '</sheets></workbook>',
        ),
        'xl/_rels/workbook.xml.rels': strToU8(
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                named
                    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
                    .join('') +
                `<Relationship Id="rId${named.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
                '</Relationships>',
        ),
        'xl/styles.xml': strToU8(STYLES_XML),
    };
    named.forEach((sheet, i) => {
        files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(sheet));
    });
    return zipSync(files, { level: 6 });
}
