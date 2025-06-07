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
        chapterCount: manga.chapterCount || {
          french: 0,
          total: 0
        }
      };
      
      return [...prev, newFavorite];
    });
  };

  const removeFromFavorites = (mangaId: string) => {
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

  const isFavorite = (mangaId: string) => {
    return favorites.some(manga => manga.id === mangaId);
  };

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
  const favoritesState = useFavorites();
  return React.createElement(FavoritesContext.Provider, { value: favoritesState }, children);
}

// Hook pour consommer le contexte (optionnel, peut utiliser useFavorites directement)  
export function useFavoritesContext(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}