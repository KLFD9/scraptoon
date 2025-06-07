import React, { useState, createContext, useContext } from 'react';
import type { Manga, FavoriteManga, ReadingStatus } from '../types/manga';

const FAVORITES_KEY = 'mangaScraper_favorites';

function loadFavorites(): FavoriteManga[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function useFavoritesState() {
  const [favorites, setFavorites] = useState<FavoriteManga[]>(loadFavorites);

  const persist = (items: FavoriteManga[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
    }
  };

  const addToFavorites = (manga: Manga) => {
    setFavorites(prev => {
      if (prev.some(fav => fav.id === manga.id)) return prev;
      const newFavorite: FavoriteManga = {
        ...manga,
        addedAt: new Date().toISOString(),
        readingStatus: 'to-read',
        chapterCount: manga.chapterCount || { french: 0, total: 0 }
      };
      const updated = [...prev, newFavorite];
      persist(updated);
      return updated;
    });
  };

  const removeFromFavorites = (mangaId: string) => {
    setFavorites(prev => {
      const updated = prev.filter(manga => manga.id !== mangaId);
      persist(updated);
      return updated;
    });
  };

  const updateFavorite = (mangaId: string, updates: Partial<FavoriteManga>) => {
    setFavorites(prev => {
      const updated = prev.map(manga =>
        manga.id === mangaId ? { ...manga, ...updates } : manga
      );
      persist(updated);
      return updated;
    });
  };

  const updateReadingStatus = (mangaId: string, status: ReadingStatus) => {
    updateFavorite(mangaId, {
      readingStatus: status,
      lastRead: status === 'completed' ? new Date().toISOString() : undefined
    });
  };

  const addNote = (mangaId: string, note: string) => {
    updateFavorite(mangaId, { notes: note });
  };

  const isFavorite = (mangaId: string) => favorites.some(manga => manga.id === mangaId);

  const getFavoritesByStatus = (status: ReadingStatus) =>
    favorites.filter(manga => manga.readingStatus === status);

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    updateFavorite,
    updateReadingStatus,
    addNote,
    isFavorite,
    getFavoritesByStatus
  };
}

type FavoritesContextValue = ReturnType<typeof useFavoritesState>;

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const value = useFavoritesState();
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
