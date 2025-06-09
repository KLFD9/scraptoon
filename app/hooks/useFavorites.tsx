import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Manga, FavoriteManga, ReadingStatus } from '../types/manga';

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

function useFavoritesState(): FavoritesContextType {
  const [favorites, setFavorites] = useState<FavoriteManga[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  const addToFavorites = (manga: Manga) => {
    setFavorites(prev => {
      if (prev.some(fav => fav.id === manga.id)) return prev;
      
      const newFavorite: FavoriteManga = {
        ...manga,
        addedAt: new Date().toISOString(),
        readingStatus: 'to-read',
        chapterCount: manga.chapterCount || { french: 0, total: 0 }
      };
      
      console.log('Adding manga to favorites:', { manga: newFavorite });
      return [...prev, newFavorite];
    });
  };

  const removeFromFavorites = (mangaId: string) => {
    setFavorites(prev => {
      const filtered = prev.filter(manga => manga.id !== mangaId);
      console.log('Removing manga from favorites:', { mangaId, count: filtered.length });
      return filtered;
    });
  };

  const updateFavorite = (mangaId: string, updates: Partial<FavoriteManga>) => {
    setFavorites(prev => 
      prev.map(manga => 
        manga.id === mangaId 
          ? { ...manga, ...updates }
          : manga
      )
    );
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

  const getFavoritesByStatus = (status: ReadingStatus) => {
    return favorites.filter(manga => manga.readingStatus === status);
  };

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

// Provider pour le contexte
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favoritesState = useFavoritesState();
  return <FavoritesContext.Provider value={favoritesState}>{children}</FavoritesContext.Provider>;
}

// Hook pour consommer le contexte
export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
