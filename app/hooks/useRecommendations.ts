import { useState, useEffect, useCallback } from 'react';
import type { Manga } from '../types/manga';

const CACHE_KEY = 'user_recommendations';
const CACHE_EXPIRY = `${CACHE_KEY}_expiry`;

export function useRecommendations(limit: number = 6) {
  const [recommendations, setRecommendations] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cached = localStorage.getItem(CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY);
      if (cached && expiry && Date.now() < parseInt(expiry)) {
        setRecommendations(JSON.parse(cached));
        setLoading(false);
        return;
      }
      const resp = await fetch(`/api/recommendations?limit=${limit}`, { credentials: 'include' });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }
      setRecommendations(data.results as Manga[]);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.results));
      localStorage.setItem(CACHE_EXPIRY, (Date.now() + 60 * 60 * 1000).toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [limit]);

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
