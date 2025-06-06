import { useState, useEffect, useCallback } from 'react';
import { Manga } from '../types/manga';
import { getBestSellerManga } from '../services/scraping.service';

export function useBestSellers(limit: number = 8) {
  const [bestSellers, setBestSellers] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBestSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier le cache local d'abord
      const cacheKey = `best_sellers_manga_${limit}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheExpiry = localStorage.getItem(`${cacheKey}_expiry`);
      
      if (cached && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
        setBestSellers(JSON.parse(cached));
        setLoading(false);
        return;
      }
      
      // Sinon, récupérer depuis l'API
      const data = await getBestSellerManga(limit);
      setBestSellers(data);
      
      // Mettre en cache pour 2 heures
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_expiry`, (Date.now() + 2 * 60 * 60 * 1000).toString());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refetch = useCallback(() => {
    // Vider le cache et refetch
    const cacheKey = `best_sellers_manga_${limit}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_expiry`);
    fetchBestSellers();
  }, [fetchBestSellers, limit]);

  useEffect(() => {
    fetchBestSellers();
  }, [fetchBestSellers]);

  return { bestSellers, loading, error, refetch };
}
