import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChapterNavigation, Chapter } from './useChapterNavigation';

describe('useChapterNavigation', () => {
  const chapters: Chapter[] = [
    { id: 'c3' },
    { id: 'c2' },
    { id: 'c1' },
  ];

    it('returns previous and next chapter ids for a middle chapter', () => {
      const { result } = renderHook(() => useChapterNavigation(chapters, 'c2'));
      expect(result.current.prevChapterId).toBe('c3');
      expect(result.current.nextChapterId).toBe('c1');
    });

    it('handles first chapter boundary', () => {
      const { result } = renderHook(() => useChapterNavigation(chapters, 'c3'));
      expect(result.current.prevChapterId).toBeNull();
      expect(result.current.nextChapterId).toBe('c2');
    });

    it('handles last chapter boundary', () => {
      const { result } = renderHook(() => useChapterNavigation(chapters, 'c1'));
      expect(result.current.prevChapterId).toBe('c2');
      expect(result.current.nextChapterId).toBeNull();
    });

  it('returns null ids when chapter is unknown', () => {
    const { result } = renderHook(() => useChapterNavigation(chapters, 'x'));
    expect(result.current.prevChapterId).toBeNull();
    expect(result.current.nextChapterId).toBeNull();
  });
});
