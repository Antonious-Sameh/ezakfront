import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiQuery } from '@/hooks/useApiQuery';

describe('useApiQuery', () => {
  it('loads data, then exposes it', async () => {
    const fetcher = vi.fn().mockResolvedValue({ n: 1 });
    const { result } = renderHook(() => useApiQuery(fetcher));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ n: 1 });
    expect(result.current.error).toBeNull();
  });

  it('exposes errors and can refetch', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useApiQuery(fetcher));

    await waitFor(() => expect(result.current.error?.message).toBe('boom'));
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
