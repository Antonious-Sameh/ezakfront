import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildXlsx, columnLetter, safeSheetName, escapeXml } from '@/lib/exporters/xlsx';
import { buildCsv, csvCell } from '@/lib/exporters/csv';
import { safeFileName } from '@/lib/exporters/download';
import { buildExportFile } from '@/lib/exporters';

describe('csv', () => {
    it('starts with a UTF-8 BOM (Arabic opens correctly in Excel) and uses CRLF', () => {
        const csv = buildCsv([{ header: 'الاسم' }, { header: 'المبلغ' }], [['أحمد', 50]]);
        expect(csv.charCodeAt(0)).toBe(0xfeff);
        expect(csv).toBe('\uFEFFالاسم,المبلغ\r\nأحمد,50\r\n');
    });

    it('quotes commas, quotes and new lines', () => {
        expect(csvCell('a,b')).toBe('"a,b"');
        expect(csvCell('قال "تمام"')).toBe('"قال ""تمام"""');
        expect(csvCell('سطر\nتاني')).toBe('"سطر\nتاني"');
    });

    it('neutralises formula injection in text, but keeps real negative numbers as numbers', () => {
        expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
        expect(csvCell('+201001234567')).toBe("'+201001234567");
        expect(csvCell('@cmd')).toBe("'@cmd");
        expect(csvCell(-25)).toBe('-25');
    });

    it('writes empty cells for null / undefined / NaN', () => {
        expect(csvCell(null)).toBe('');
        expect(csvCell(undefined)).toBe('');
        expect(csvCell(Number.NaN)).toBe('');
    });
});

describe('xlsx', () => {
    const sheet = {
        name: 'المبيعات',
        columns: [{ header: 'رقم الفاتورة' }, { header: 'الإجمالي', type: 'money', width: 14 }, { header: 'الكمية', type: 'number' }],
        rows: [['INV-1', 150.5, 3], ['<b>&"', null, 0]],
    };
    const files = (bytes) => Object.fromEntries(Object.entries(unzipSync(bytes)).map(([k, v]) => [k, strFromU8(v)]));

    it('produces a valid OOXML package with all required parts', () => {
        const f = files(buildXlsx([sheet]));
        expect(Object.keys(f).sort()).toEqual([
            '[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml',
        ]);
        expect(f['xl/workbook.xml']).toContain('<sheet name="المبيعات" sheetId="1" r:id="rId1"/>');
    });

    it('is right-to-left, with a frozen bold header and an auto-filter', () => {
        const xml = files(buildXlsx([sheet]))['xl/worksheets/sheet1.xml'];
        expect(xml).toContain('rightToLeft="1"');
        expect(xml).toContain('state="frozen"');
        expect(xml).toContain('<autoFilter ref="A1:C3"/>');
        expect(xml).toContain('<c r="A1" t="inlineStr" s="1">');
    });

    it('writes numbers as real numeric cells (summable in Excel), text escaped, empties skipped', () => {
        const xml = files(buildXlsx([sheet]))['xl/worksheets/sheet1.xml'];
        expect(xml).toContain('<c r="B2" s="2"><v>150.5</v></c>');
        expect(xml).toContain('<c r="C3" s="3"><v>0</v></c>');
        expect(xml).toContain('&lt;b&gt;&amp;&quot;');
        expect(xml).not.toContain('r="B3"');
    });

    it('supports several sheets with unique, Excel-safe names', () => {
        const f = files(buildXlsx([sheet, { ...sheet, name: 'المبيعات' }, { ...sheet, name: 'a/b:c' }]));
        expect(f['xl/workbook.xml']).toContain('name="المبيعات (2)"');
        expect(f['xl/workbook.xml']).toContain('name="a b c"');
        expect(f['xl/worksheets/sheet3.xml']).toBeTruthy();
    });

    it('helpers', () => {
        expect(['A', 'Z', 'AA', 'AZ', 'BA'].map((_, i) => columnLetter([0, 25, 26, 51, 52][i]))).toEqual(['A', 'Z', 'AA', 'AZ', 'BA']);
        expect(safeSheetName('x'.repeat(40), new Set())).toHaveLength(31);
        expect(escapeXml('a\u0001b')).toBe('ab');
        expect(safeFileName('محل: النور / مبيعات')).toBe('محل- النور - مبيعات');
    });
});

describe('buildExportFile', () => {
    const spec = {
        columns: [{ header: 'رقم', value: (r) => r.no }, { header: 'الإجمالي', type: 'money', value: (r) => r.total }],
        lines: {
            name: 'أصناف الفواتير',
            columns: [{ header: 'رقم' }, { header: 'الصنف' }],
            rows: (r) => r.items.map((it) => [r.no, it]),
        },
    };
    const rows = [{ no: 'INV-1', total: 10, items: ['فلتر', 'زيت'] }];

    it('xlsx: main sheet + invoice-lines sheet', () => {
        const file = buildExportFile(spec, rows, { format: 'xlsx', sheetName: 'المبيعات', fileBase: 'محل - المبيعات' });
        expect(file.fileName).toBe('محل - المبيعات.xlsx');
        const parts = unzipSync(file.data);
        expect(strFromU8(parts['xl/workbook.xml'])).toContain('أصناف الفواتير');
        expect(strFromU8(parts['xl/worksheets/sheet2.xml'])).toContain('زيت');
    });

    it('csv: just the main table', () => {
        const file = buildExportFile(spec, rows, { format: 'csv', sheetName: 'x', fileBase: 'ملف' });
        expect(file.fileName).toBe('ملف.csv');
        expect(file.data).toBe('\uFEFFرقم,الإجمالي\r\nINV-1,10\r\n');
    });
});
