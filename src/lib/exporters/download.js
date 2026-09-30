/** Hand a generated file to the browser as a download (desktop & mobile). */
export function downloadFile(fileName, data, mimeType) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Some mobile browsers read the blob after click() returns.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** File names safe on Windows / Android / iOS; keeps Arabic. */
export function safeFileName(name) {
    return String(name).replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120) || 'export'; // eslint-disable-line no-control-regex
}
