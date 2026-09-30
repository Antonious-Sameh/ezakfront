import { useCallback, useEffect, useState } from 'react';

/**
 * Prints a React node without leaving the page:
 *   1. the node is rendered into a dedicated <div id="print-root"> at the
 *      end of <body> (hidden on screen by index.css),
 *   2. once it's painted and the web fonts are ready, window.print() opens
 *      the browser's print dialog (preview / printer / "Save as PDF"),
 *   3. @media print in index.css hides everything EXCEPT #print-root.
 *
 * Returns { job, print, root }: render `job` into `root` with a portal.
 */
export function getPrintRoot() {
    let root = document.getElementById('print-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'print-root';
        document.body.appendChild(root);
    }
    return root;
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

export function usePrintInvoice() {
    const [job, setJob] = useState(null);

    const print = useCallback((node) => setJob({ node, id: Date.now() }), []);

    useEffect(() => {
        if (!job) return undefined;
        let cancelled = false;
        const done = () => setJob((current) => (current && current.id === job.id ? null : current));

        (async () => {
            await nextFrame();
            await nextFrame();
            try { await document.fonts?.ready; } catch { /* fonts API missing — print anyway */ }
            if (cancelled) return;
            window.addEventListener('afterprint', done, { once: true });
            window.print();
        })();

        return () => {
            cancelled = true;
            window.removeEventListener('afterprint', done);
        };
    }, [job]);

    return { job: job?.node ?? null, print, root: typeof document !== 'undefined' ? getPrintRoot() : null };
}

export default usePrintInvoice;
