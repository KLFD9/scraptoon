import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRecommendations } from '../app/hooks/useRecommendations';
import type { Manga } from '../app/types/manga';

const SAMPLE: Manga[] = [{
  id: 'm1',
  title: 'm1',
  description: '',
  cover: '',
  url: '',
  type: 'manga',
  status: 'ongoing',
  lastChapter: '1',
  chapterCount: { french: 0, total: 0 }
}];

const CACHE_KEY = 'user_recommendations';
const EXPIRY_KEY = `${CACHE_KEY}_expiry`;

describe('useRecommendations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches recommendations and caches them', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, results: SAMPLE })
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useRecommendations());
    await waitFor(() => fetchMock.mock.calls.length > 0);
    await waitFor(() => result.current.recommendations.length > 0);

    expect(fetchMock).toHaveBeenCalledWith('/api/recommendations?limit=6', { credentials: 'include' });
    expect(result.current.recommendations).toEqual(SAMPLE);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual(SAMPLE);
    expect(localStorage.getItem(EXPIRY_KEY)).not.toBeNull();
  });

  it('uses cached recommendations when not expired', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(SAMPLE));
    localStorage.setItem(EXPIRY_KEY, (Date.now() + 10000).toString());
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useRecommendations());
    await waitFor(() => result.current.recommendations.length > 0);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.recommendations).toEqual(SAMPLE);
  });
});
