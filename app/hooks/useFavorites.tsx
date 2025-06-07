<<<<<<<< HEAD:app/hooks/useFavorites.ts
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Manga, FavoriteManga, ReadingStatus } from '../types/manga';
import { logger } from '../utils/logger';

const FAVORITES_KEY = 'mangaScraper_favorites';

// Type pour le contexte
interface FavoritesContextType {
  favorites: FavoriteManga[];
  addToFavorites: (manga: Manga) => void;
  removeFromFavorites: (mangaId: string) => void;
  updateFavorite: (mangaId: string, updates: Partial<FavoriteManga>) => void;
  updateReadingStatus: (mangaId: string, status: ReadingStatus) => void;
  addNote: (mangaId: string, note: string) => void;
  isFavorite: (mangaId: string) => boolean;
  getFavoritesByStatus: (status: ReadingStatus) => FavoriteManga[];
  isLoaded: boolean;
}

// Création du contexte
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteManga[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
========
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
>>>>>>>> 1b13e7afa7246fc922585c067ccd7b4d23f25b30:app/hooks/useFavorites.tsx

  const persist = (items: FavoriteManga[]) => {
    if (typeof window !== 'undefined') {
<<<<<<<< HEAD:app/hooks/useFavorites.ts
      try {
        const saved = localStorage.getItem(FAVORITES_KEY);
        const parsedFavorites = saved ? JSON.parse(saved) : [];
        console.log('Loading favorites from localStorage:', { saved, count: parsedFavorites.length });
        setFavorites(parsedFavorites);
      } catch (error) {
        console.error('Failed to load favorites from localStorage:', error);
        setFavorites([]);
      } finally {
        setIsLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      try {
        console.log('Saving favorites to localStorage:', { count: favorites.length });
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Failed to save favorites to localStorage:', error);
      }
    }
  }, [favorites, isLoaded]);
========
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
    }
  };
>>>>>>>> 1b13e7afa7246fc922585c067ccd7b4d23f25b30:app/hooks/useFavorites.tsx

  const addToFavorites = (manga: Manga) => {
    setFavorites(prev => {
      if (prev.some(fav => fav.id === manga.id)) return prev;
      const newFavorite: FavoriteManga = {
        ...manga,
        addedAt: new Date().toISOString(),
        readingStatus: 'to-read',
        chapterCount: manga.chapterCount || { french: 0, total: 0 }
      };
<<<<<<<< HEAD:app/hooks/useFavorites.ts
      
      return [...prev, newFavorite];
========
      const updated = [...prev, newFavorite];
      persist(updated);
      return updated;
>>>>>>>> 1b13e7afa7246fc922585c067ccd7b4d23f25b30:app/hooks/useFavorites.tsx
    });
  };

  const removeFromFavorites = (mangaId: string) => {
<<<<<<<< HEAD:app/hooks/useFavorites.ts
    setFavorites(prev => prev.filter(manga => manga.id !== mangaId));
  };

  const updateFavorite = (mangaId: string, updates: Partial<FavoriteManga>) => {
    setFavorites(prev => 
      prev.map(manga => 
        manga.id === mangaId 
          ? { ...manga, ...updates }
          : manga
      )
    );
========
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
>>>>>>>> 1b13e7afa7246fc922585c067ccd7b4d23f25b30:app/hooks/useFavorites.tsx
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

<<<<<<<< HEAD:app/hooks/useFavorites.ts
  const getFavoritesByStatus = (status: ReadingStatus) => {
    return favorites.filter(manga => manga.readingStatus === status);
  };
========
  const getFavoritesByStatus = (status: ReadingStatus) =>
    favorites.filter(manga => manga.readingStatus === status);

>>>>>>>> 1b13e7afa7246fc922585c067ccd7b4d23f25b30:app/hooks/useFavorites.tsx
  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    updateFavorite,
    updateReadingStatus,
    addNote,
    isFavorite,
    getFavoritesByStatus,
    isLoaded
  };
}

<<<<<<<< HEAD:app/hooks/useFavorites.ts
// Provider pour le contexte
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favoritesState = useFavorites();
  return React.createElement(FavoritesContext.Provider, { value: favoritesState }, children);
========
type FavoritesContextValue = ReturnType<typeof useFavoritesState>;

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const value = useFavoritesState();
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
>>>>>>>> 1b13e7afa7246fc922585c067ccd7b4d23f25b30:app/hooks/useFavorites.tsx
}

// Hook pour consommer le contexte (optionnel, peut utiliser useFavorites directement)  
export function useFavoritesContext(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
<<<<<<<< HEAD:app/hooks/useFavorites.ts
}
========
}
>>>>>>>> 1b13e7afa7246fc922585c067ccd7b4d23f25b30:app/hooks/useFavorites.tsx
