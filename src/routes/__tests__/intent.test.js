import { describe, it, expect, vi } from 'vitest';
import { preloadOnIntent } from '@/routes/intent';

describe('preloadOnIntent', () => {
    it('starts the download on the first hover / focus / touch only', async () => {
        const preload = vi.fn().mockResolvedValue();
        const handlers = preloadOnIntent(preload);

        handlers.onPointerEnter();
        handlers.onTouchStart();
        handlers.onFocus();
        await Promise.resolve();

        expect(preload).toHaveBeenCalledTimes(1);
    });

    it('tries again later if the download failed', async () => {
        const preload = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue();
        const handlers = preloadOnIntent(preload);

        handlers.onPointerEnter();
        await new Promise((r) => setTimeout(r, 0));
        handlers.onPointerEnter();
        await new Promise((r) => setTimeout(r, 0));

        expect(preload).toHaveBeenCalledTimes(2);
    });
});
