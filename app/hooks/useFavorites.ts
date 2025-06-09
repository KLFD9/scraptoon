
import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from 'react';
import { Manga, FavoriteManga, ReadingStatus } from '../types/manga';
const FAVORITES_KEY = 'mangaScraper_favorites';

function useFavoritesState() {
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
      
      const updated = [...prev, newFavorite];
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeFromFavorites = (mangaId: string) => {
    setFavorites(prev => {
      const updated = prev.filter(manga => manga.id !== mangaId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateFavorite = (mangaId: string, updates: Partial<FavoriteManga>) => {
    setFavorites(prev => {
      const updated = prev.map(manga =>
        manga.id === mangaId ? { ...manga, ...updates } : manga
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      }
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

type FavoritesContextValue = ReturnType<typeof useFavoritesState>;

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const value = useFavoritesState();
  return React.createElement(
    FavoritesContext.Provider,
    { value },
    children,
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}