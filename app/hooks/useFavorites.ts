import { useState, useEffect, useRef } from 'react';
import { Manga, FavoriteManga, ReadingStatus } from '../types/manga';

const FAVORITES_KEY = 'mangaScraper_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteManga[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites]);

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
    getFavoritesByStatus
  };
} 