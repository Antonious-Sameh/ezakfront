import React, { Suspense } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { lazyWithPreload } from '@/routes/lazyPages';

describe('lazyWithPreload', () => {
    it('does not download the page until it is needed', () => {
        const factory = vi.fn(() => Promise.resolve({ default: () => <p>صفحة</p> }));
        lazyWithPreload(factory);
        expect(factory).not.toHaveBeenCalled();
    });

    it('preload() starts the download once, and rendering reuses it', async () => {
        const factory = vi.fn(() => Promise.resolve({ default: () => <p>صفحة التقارير</p> }));
        const Page = lazyWithPreload(factory);

        await Page.preload();
        await Page.preload();
        render(<Suspense fallback={<p>تحميل</p>}><Page /></Suspense>);

        expect(await screen.findByText('صفحة التقارير')).toBeInTheDocument();
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('allows a retry after a failed download (e.g. the network dropped)', async () => {
        const factory = vi
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce({ default: () => <p>تمام</p> });
        const Page = lazyWithPreload(factory);

        await expect(Page.preload()).rejects.toThrow('offline');
        await expect(Page.preload()).resolves.toBeTruthy();
        expect(factory).toHaveBeenCalledTimes(2);
    });
});
