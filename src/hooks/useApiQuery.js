import { useCallback, useEffect, useState } from 'react';

/**
 * Small data-fetching hook shared by all read-only screens.
 * Pass a memoized fetcher (useCallback) — it re-runs whenever the fetcher changes.
 */
export function useApiQuery(fetcher) {
	const [state, setState] = useState({ data: null, loading: true, error: null });
	const [reloadKey, setReloadKey] = useState(0);

	const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

	useEffect(() => {
		let cancelled = false;
		setState((prev) => ({ ...prev, loading: true, error: null }));

		fetcher()
			.then((data) => {
				if (!cancelled) setState({ data, loading: false, error: null });
			})
			.catch((error) => {
				if (!cancelled) setState({ data: null, loading: false, error });
			});

		return () => {
			cancelled = true;
		};
	}, [fetcher, reloadKey]);

	return { ...state, refetch };
}
