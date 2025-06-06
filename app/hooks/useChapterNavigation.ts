import { useMemo } from 'react';

export interface Chapter {
  id: string;
  title?: string;
  language?: string;
  chapter?: string;
}

export function useChapterNavigation(
  chapters: Chapter[],
  currentChapterId: string,
  preferredLanguage?: string
) {
  return useMemo(() => {
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
    const currentChapter = chapters[currentIndex];

    if (currentIndex === -1) {
      return { prevChapterId: null, nextChapterId: null, currentChapterIndex: -1 };
    }

    // Déterminer la langue à privilégier : celle du chapitre actuel ou celle passée en paramètre
    const languageToUse = preferredLanguage || currentChapter?.language;

    // Fonction pour trouver le chapitre suivant/précédent en privilégiant la langue
    const findChapterByLanguage = (
      direction: 'next' | 'prev',
      startIndex: number
    ): string | null => {
      // Dans notre array trié par numéro décroissant :
      // - "next" (chapitre suivant) = index plus grand (numéro plus petit)  
      // - "prev" (chapitre précédent) = index plus petit (numéro plus grand)
      const increment = direction === 'next' ? 1 : -1;
      const limit = direction === 'next' ? chapters.length : -1;

      // Première passe : chercher dans la même langue
      if (languageToUse) {
        for (let i = startIndex + increment; 
             direction === 'next' ? i < limit : i > limit; 
             i += increment) {
          if (chapters[i]?.language === languageToUse) {
            return chapters[i].id;
          }
        }
      }

      // Deuxième passe : si aucun chapitre dans la même langue, prendre le premier disponible
      const fallbackIndex = startIndex + increment;
      if (fallbackIndex >= 0 && fallbackIndex < chapters.length) {
        return chapters[fallbackIndex].id;
      }

      return null;
    };

    const prevChapterId = findChapterByLanguage('prev', currentIndex);
    const nextChapterId = findChapterByLanguage('next', currentIndex);

    return { 
      prevChapterId, 
      nextChapterId, 
      currentChapterIndex: currentIndex,
      currentLanguage: currentChapter?.language
    };
  }, [chapters, currentChapterId, preferredLanguage]);
}
