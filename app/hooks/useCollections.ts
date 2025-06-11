'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Manga } from '@/app/types/manga';

interface CollectionStats {
  id: string;
  name: string;
  count: number;
  trending: boolean;
  newCount: number;
  genres: string[];
  avgRating?: number;
  topManga?: {
    title: string;
    cover: string;
  };
}

interface CollectionDetails {
  id: string;
  manga: Manga[];
  count: number;
  trending: boolean;
  weeklyGrowth: number;
  newManga: string[];
  topManga: {
    title: string;
    cover: string;
  } | null;
}

interface UseCollectionsResult {
  collections: CollectionStats[];
  loading: boolean;
  error: string | null;
  trendingCollections: string[];
  refreshCollections: () => Promise<void>;
  getCollectionDetails: (id: string) => Promise<CollectionDetails | null>;
}

export function useCollections(): UseCollectionsResult {
  const [collections, setCollections] = useState<CollectionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendingCollections, setTrendingCollections] = useState<string[]>([]);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/collections', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des collections');
      }

      setCollections(data.data);
      setTrendingCollections(data.trending || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Erreur lors de la récupération des collections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCollectionDetails = useCallback(async (id: string): Promise<CollectionDetails | null> => {
    try {
      const response = await fetch(`/api/collections?id=${id}&detailed=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des détails');
      }

      return data.data;
    } catch (err) {
      console.error('Erreur lors de la récupération des détails de collection:', err);
      return null;
    }
  }, []);

  const refreshCollections = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    trendingCollections,
    refreshCollections,
    getCollectionDetails,
  };
}
