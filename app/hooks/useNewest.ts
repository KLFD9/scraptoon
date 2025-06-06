import { useState, useEffect, useCallback } from 'react';
import { Manga } from '../types/manga';
import { getNewestManga } from '../services/scraping.service';

export function useNewest(limit: number = 8) {
  const [newest, setNewest] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cacheKey = `newest_manga_${limit}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheExpiry = localStorage.getItem(`${cacheKey}_expiry`);
      if (cached && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
        setNewest(JSON.parse(cached));
        setLoading(false);
        return;
      }
      const data = await getNewestManga(limit);
      setNewest(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_expiry`, (Date.now() + 60 * 60 * 1000).toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refetch = useCallback(() => {
    const cacheKey = `newest_manga_${limit}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_expiry`);
    fetchNewest();
  }, [fetchNewest, limit]);

  useEffect(() => {
    fetchNewest();
  }, [fetchNewest]);

  return { newest, loading, error, refetch };
}
