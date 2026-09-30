import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Data-fetching hook shared by all read-only screens.
 *
 *   const q = useApiQuery(fetcher, { key, keepPrevious, staleTime });
 *   q.data / q.loading / q.fetching / q.error / q.refetch()
 *
 * Without a `key`, `fetcher(signal)` must be memoized (useCallback): the
 * request re-runs whenever it changes. With a `key`, the key alone decides
 * when to re-run (the latest fetcher is always used), so an un-memoized
 * fetcher can't cause a request loop. It receives an AbortSignal: when the inputs change again before
 * the answer arrives (typing, flipping pages fast), the old request is
 * cancelled instead of racing the new one.
 *
 * Options (all optional — without them it behaves like the original hook):
 *  - key: a string identifying this exact request. Answers are cached in
 *    memory under it, so going back to a page you just saw shows it
 *    INSTANTLY, then refreshes it quietly in the background if it's older
 *    than `staleTime`.
 *  - keepPrevious: while the next answer loads, keep showing the current
 *    data (with `fetching: true`) instead of blanking to a skeleton — no
 *    flicker when changing page or filter within the same list.
 *  - staleTime: ms a cached answer counts as fresh (default 15s — this is
 *    live shop data, so "fresh" is short on purpose).
 *
 * `loading` = nothing to show yet (render a skeleton).
 * `fetching` = a request is in flight (possibly behind visible data).
 */

const MAX_ENTRIES = 80;
const cache = new Map(); // key -> { data, at }

function cacheSet(key, data) {
    cache.delete(key);
    cache.set(key, { data, at: Date.now() });
    if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value); // drop the oldest
}

/** Forget everything (called on logout, so nothing outlives the session). */
export function clearQueryCache() {
    cache.clear();
}

/** Test hook. */
export function getQueryCacheSize() {
    return cache.size;
}

export function useApiQuery(fetcher, { key, keepPrevious = false, staleTime = 15_000 } = {}) {
    const cachedAtStart = key ? cache.get(key) : undefined;
    const [state, setState] = useState(() => ({
        data: cachedAtStart ? cachedAtStart.data : null,
        loading: !cachedAtStart,
        fetching: !cachedAtStart,
        error: null,
    }));
    const [reloadKey, setReloadKey] = useState(0);
    const forcedRef = useRef(false);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;
    const trigger = key !== undefined ? key : fetcher;

    const refetch = useCallback(() => {
        forcedRef.current = true;
        setReloadKey((k) => k + 1);
    }, []);

    useEffect(() => {
        const forced = forcedRef.current;
        forcedRef.current = false;

        const cached = key ? cache.get(key) : undefined;
        const fresh = cached && Date.now() - cached.at < staleTime;

        if (cached) {
            setState({ data: cached.data, loading: false, fetching: !fresh || forced, error: null });
            if (fresh && !forced) return undefined;
        } else {
            setState((prev) => {
                const keep = keepPrevious && prev.data !== null && prev.data !== undefined;
                return {
                    data: keep ? prev.data : null,
                    loading: !keep,
                    fetching: true,
                    error: null,
                };
            });
        }

        const controller = new AbortController();
        let active = true;

        Promise.resolve()
            .then(() => fetcherRef.current(controller.signal))
            .then((data) => {
                if (!active) return;
                if (key) cacheSet(key, data);
                setState({ data, loading: false, fetching: false, error: null });
            })
            .catch((error) => {
                if (!active || error?.name === 'AbortError') return;
                setState({ data: null, loading: false, fetching: false, error });
            });

        return () => {
            active = false;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keepPrevious/staleTime are read, not triggers
    }, [trigger, reloadKey]);

    return { ...state, refetch };
}
