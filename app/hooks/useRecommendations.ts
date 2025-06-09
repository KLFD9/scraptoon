import { useState, useEffect, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import type { Manga } from '../types/manga';

const CACHE_KEY = 'user_recommendations';
const CACHE_EXPIRY = `${CACHE_KEY}_expiry`;

export function useRecommendations(limit: number = 6) {
  const { favorites } = useFavorites();
  const [recommendations, setRecommendations] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const expiry = localStorage.getItem(CACHE_EXPIRY);
      const cached = localStorage.getItem(CACHE_KEY);
      if (expiry && cached && Date.now() < Number(expiry)) {
        setRecommendations(JSON.parse(cached) as Manga[]);
        setLoading(false);
        return;
      }

      const resp = await fetch('/api/recommendations', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit,
          favorites: favorites.map((f) => ({ id: f.id, author: f.author })),
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP Error ${resp.status}`);
      }

      const data = await resp.json();

      if (data.success) {
        setRecommendations(data.results);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.results));
        localStorage.setItem(
          CACHE_EXPIRY,
          (Date.now() + 60 * 60 * 1000).toString()
        );
      } else {
        throw new Error(data.error || 'API error');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [limit, favorites]);

  const refetch = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY);
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, refetch };
}
