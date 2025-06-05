import { useMemo } from 'react';

export interface Chapter {
  id: string;
  title?: string;
}

export function useChapterNavigation(
  chapters: Chapter[],
  currentChapterId: string
) {
  return useMemo(() => {
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);

    const prevChapterId =
      currentIndex !== -1 && currentIndex + 1 < chapters.length
        ? chapters[currentIndex + 1].id
        : null;

    const nextChapterId =
      currentIndex !== -1 && currentIndex - 1 >= 0
        ? chapters[currentIndex - 1].id
        : null;

    return { prevChapterId, nextChapterId, currentChapterIndex: currentIndex };
  }, [chapters, currentChapterId]);
}
