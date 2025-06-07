import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useFavorites } from '../app/hooks/useFavorites';
import type { Manga } from '../app/types/manga';

const SAMPLE_MANGA: Manga = {
  id: 'm1',
  title: 'Test',
  description: 'desc',
  cover: '/img.jpg',
  url: 'https://example.com',
  type: 'manga',
  status: 'ongoing',
  lastChapter: '1',
  chapterCount: { french: 0, total: 0 }
};

const STORAGE_KEY = 'mangaScraper_favorites';

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads favorites from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([SAMPLE_MANGA]));
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe('m1');
  });

  it('writes favorites to localStorage when updated', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addToFavorites(SAMPLE_MANGA);
    });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('m1');
  });
});
