import { useState, useEffect, useCallback } from 'react';
import { Manga } from '../types/manga';
import { getTrendingManga } from '../services/scraping.service';

export function useTrending(limit: number = 6) {
  const [trending, setTrending] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier le cache local d'abord
      const cacheKey = `trending_manga_${limit}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheExpiry = localStorage.getItem(`${cacheKey}_expiry`);
      
      if (cached && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
        setTrending(JSON.parse(cached));
        setLoading(false);
        return;
      }
      
      // Sinon, récupérer depuis l'API
      const data = await getTrendingManga(limit);
      setTrending(data);
      
      // Mettre en cache pour 1 heure
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_expiry`, (Date.now() + 60 * 60 * 1000).toString());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refetch = useCallback(() => {
    // Vider le cache et refetch
    const cacheKey = `trending_manga_${limit}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_expiry`);
    fetchTrending();
  }, [fetchTrending, limit]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return { trending, loading, error, refetch };
}
