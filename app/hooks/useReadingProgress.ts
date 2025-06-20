import { useState, useEffect, useCallback } from 'react';
import { Manga } from '@/app/types/manga';

interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  chapterNumber: string;
  mangaTitle: string;
  mangaCover?: string;
  lastReadAt: string;
  language?: string; // Code langue ISO (fr, en, ja, etc.)
}

export function useReadingProgress() {
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readingProgress');
      if (saved) {
        try {
          const progress = JSON.parse(saved);
          // Garder seulement les 5 derniers éléments et trier par date
          const sortedProgress = progress
            .sort((a: ReadingProgress, b: ReadingProgress) => 
              new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
            )
            .slice(0, 5);
          setReadingProgress(sortedProgress);
        } catch (error) {
          // Ignorer silencieusement les erreurs de chargement
          setReadingProgress([]);
        }
      }
    }
  }, []);

  const updateReadingProgress = useCallback((
    mangaId: string,
    chapterId: string,
    chapterNumber: string,
    mangaTitle: string,
    mangaCover?: string,
    language?: string
  ) => {
    const newProgress: ReadingProgress = {
      mangaId,
      chapterId,
      chapterNumber,
      mangaTitle,
      mangaCover,
      language,
      lastReadAt: new Date().toISOString()
    };

    setReadingProgress(prev => {
      // Supprimer l'entrée existante pour ce manga s'il y en a une
      const filtered = prev.filter(item => item.mangaId !== mangaId);
      // Ajouter la nouvelle entrée au début
      const updated = [newProgress, ...filtered].slice(0, 5);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('readingProgress', JSON.stringify(updated));
      }
      
      return updated;
    });
  }, []); // Empty dependency array for useCallback, as it doesn't depend on props or state from this hook's scope directly

  const removeFromReadingProgress = useCallback((mangaId: string) => {
    setReadingProgress(prev => {
      const updated = prev.filter(item => item.mangaId !== mangaId);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('readingProgress', JSON.stringify(updated));
      }
      
      return updated;
    });
  }, []); // Empty dependency array

  const clearReadingProgress = useCallback(() => {
    setReadingProgress([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('readingProgress');
    }
  }, []); // Empty dependency array

  return {
    readingProgress,
    updateReadingProgress,
    removeFromReadingProgress,
    clearReadingProgress
  };
}
