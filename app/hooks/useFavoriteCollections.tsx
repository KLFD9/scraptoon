'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface FavoriteCollection {
  id: string;
  name: string;
  addedAt: string;
}

interface FavoriteCollectionsContextValue {
  favoriteCollections: FavoriteCollection[];
  addToFavorites: (collection: Omit<FavoriteCollection, 'addedAt'>) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
}

const FavoriteCollectionsContext = createContext<FavoriteCollectionsContextValue | undefined>(undefined);

export function useFavoriteCollections() {
  const context = useContext(FavoriteCollectionsContext);
  if (!context) {
    throw new Error('useFavoriteCollections must be used within a FavoriteCollectionsProvider');
  }
  return context;
}

export function FavoriteCollectionsProvider({ children }: { children: ReactNode }) {
  const [favoriteCollections, setFavoriteCollections] = useState<FavoriteCollection[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favoriteCollections');
      if (saved) {
        try {
          setFavoriteCollections(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading favorite collections:', error);
          localStorage.removeItem('favoriteCollections');
        }
      }
    }
  }, []);

  // Save to localStorage when favorites change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favoriteCollections', JSON.stringify(favoriteCollections));
    }
  }, [favoriteCollections]);

  const addToFavorites = (collection: Omit<FavoriteCollection, 'addedAt'>) => {
    const newFavorite: FavoriteCollection = {
      ...collection,
      addedAt: new Date().toISOString(),
    };
    
    setFavoriteCollections(prev => {
      // Check if already exists
      if (prev.some(fav => fav.id === collection.id)) {
        return prev;
      }
      return [...prev, newFavorite];
    });
  };

  const removeFromFavorites = (id: string) => {
    setFavoriteCollections(prev => prev.filter(fav => fav.id !== id));
  };

  const isFavorite = (id: string) => {
    return favoriteCollections.some(fav => fav.id === id);
  };

  const clearFavorites = () => {
    setFavoriteCollections([]);
  };

  return (
    <FavoriteCollectionsContext.Provider value={{
      favoriteCollections,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      clearFavorites,
    }}>
      {children}
    </FavoriteCollectionsContext.Provider>
  );
}
