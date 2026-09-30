import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiQuery, clearQueryCache, getQueryCacheSize } from '@/hooks/useApiQuery';

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

describe('useApiQuery — cache', () => {
    it('shows a cached answer instantly (no skeleton, no request) when coming back within staleTime', async () => {
        const fetcher = vi.fn().mockResolvedValue({ rows: [1] });
        const first = renderHook(() => useApiQuery(fetcher, { key: 'k1' }));
        await waitFor(() => expect(first.result.current.data).toEqual({ rows: [1] }));
        first.unmount();

        const second = renderHook(() => useApiQuery(fetcher, { key: 'k1' }));
        expect(second.result.current.loading).toBe(false);
        expect(second.result.current.data).toEqual({ rows: [1] });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('shows a stale cached answer instantly AND refreshes it in the background', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new');
        const first = renderHook(() => useApiQuery(fetcher, { key: 'k2', staleTime: 0 }));
        await waitFor(() => expect(first.result.current.data).toBe('old'));
        first.unmount();

        const second = renderHook(() => useApiQuery(fetcher, { key: 'k2', staleTime: 0 }));
        expect(second.result.current.data).toBe('old');
        expect(second.result.current.loading).toBe(false);
        await waitFor(() => expect(second.result.current.data).toBe('new'));
        expect(second.result.current.fetching).toBe(false);
    });

    it('refetch() always goes to the network, even when the cache is fresh', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');
        const { result } = renderHook(() => useApiQuery(fetcher, { key: 'k3' }));
        await waitFor(() => expect(result.current.data).toBe('a'));

        act(() => result.current.refetch());
        await waitFor(() => expect(result.current.data).toBe('b'));
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('clearQueryCache() forgets everything (used on logout)', async () => {
        const fetcher = vi.fn().mockResolvedValue(1);
        const { result } = renderHook(() => useApiQuery(fetcher, { key: 'k4' }));
        await waitFor(() => expect(result.current.data).toBe(1));
        expect(getQueryCacheSize()).toBeGreaterThan(0);

        clearQueryCache();
        expect(getQueryCacheSize()).toBe(0);
    });

    it('never caches errors', async () => {
        const fetcher = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce('ok');
        const first = renderHook(() => useApiQuery(fetcher, { key: 'k5' }));
        await waitFor(() => expect(first.result.current.error?.message).toBe('down'));
        first.unmount();

        const second = renderHook(() => useApiQuery(fetcher, { key: 'k5' }));
        expect(second.result.current.loading).toBe(true);
        await waitFor(() => expect(second.result.current.data).toBe('ok'));
    });
});

describe('useApiQuery — keepPrevious & cancellation', () => {
    it('keeps the current data visible (fetching=true) while the next key loads', async () => {
        const next = deferred();
        const fetcherFor = (key) => (key === 'p1' ? () => Promise.resolve('page 1') : () => next.promise);
        const { result, rerender } = renderHook(
            ({ k }) => useApiQuery(fetcherFor(k), { key: k, keepPrevious: true }),
            { initialProps: { k: 'p1' } },
        );
        await waitFor(() => expect(result.current.data).toBe('page 1'));

        rerender({ k: 'p2' });
        expect(result.current.data).toBe('page 1');
        expect(result.current.loading).toBe(false);
        expect(result.current.fetching).toBe(true);

        await act(async () => { next.resolve('page 2'); });
        expect(result.current.data).toBe('page 2');
        expect(result.current.fetching).toBe(false);
    });

    it('without keepPrevious, a new key blanks to loading (no stale data from another shop)', async () => {
        const next = deferred();
        const fetcherFor = (key) => (key === 'shopA' ? () => Promise.resolve('A') : () => next.promise);
        const { result, rerender } = renderHook(({ k }) => useApiQuery(fetcherFor(k), { key: k }), {
            initialProps: { k: 'shopA' },
        });
        await waitFor(() => expect(result.current.data).toBe('A'));

        rerender({ k: 'shopB' });
        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(true);
        await act(async () => { next.resolve('B'); });
    });

    it('aborts the previous request when inputs change, and ignores its late answer', async () => {
        const slow = deferred();
        const signals = [];
        const fetcherFor = (k) => (signal) => {
            signals.push(signal);
            return k === 'a' ? slow.promise : Promise.resolve('fast');
        };
        const { result, rerender } = renderHook(({ k }) => useApiQuery(fetcherFor(k), { key: k }), {
            initialProps: { k: 'a' },
        });

        rerender({ k: 'b' });
        await waitFor(() => expect(result.current.data).toBe('fast'));
        expect(signals[0].aborted).toBe(true);

        await act(async () => { slow.resolve('late and wrong'); });
        expect(result.current.data).toBe('fast');
    });

    it('does not report an AbortError as a failure', async () => {
        const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
        const fetcher = vi.fn().mockRejectedValue(abortError);
        const { result } = renderHook(() => useApiQuery(fetcher));
        await act(async () => {});
        expect(result.current.error).toBeNull();
    });
});
