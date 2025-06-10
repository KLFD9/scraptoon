import { useState, useEffect, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import type { Manga } from '../types/manga';

const CACHE_KEY = 'user_recommendations';
const CACHE_EXPIRY = `${CACHE_KEY}_expiry`;

export function useRecommendations(limit: number = 6) {
  const { favorites } = useFavorites();
  const [recommendations, setRecommendations] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Créer une clé de cache unique basée sur les favoris
      const favoritesKey = favorites.map(f => f.id).sort().join('_');
      const CACHE_KEY_WITH_FAVORITES = `${CACHE_KEY}_${favoritesKey}`;
      const CACHE_EXPIRY_WITH_FAVORITES = `${CACHE_EXPIRY}_${favoritesKey}`;

      // Vérifier le cache seulement si il correspond aux favoris actuels
      const expiry = localStorage.getItem(CACHE_EXPIRY_WITH_FAVORITES);
      const cached = localStorage.getItem(CACHE_KEY_WITH_FAVORITES);
      
      if (expiry && cached && Date.now() < Number(expiry)) {
        const cachedData = JSON.parse(cached) as Manga[];
        setRecommendations(cachedData);
        setLoading(false);
        console.log('✅ Recommendations chargées depuis le cache personnalisé:', cachedData.length);
        return;
      }

      // Nettoyer les anciens caches
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith(CACHE_KEY) && key !== CACHE_KEY_WITH_FAVORITES) {
          localStorage.removeItem(key);
        }
        if (key.startsWith(CACHE_EXPIRY) && key !== CACHE_EXPIRY_WITH_FAVORITES) {
          localStorage.removeItem(key);
        }
      });

      console.log('🔄 Récupération des recommandations depuis l\'API...');

      // Essayer l'API principale en premier
      let resp = await fetch('/api/recommendations', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          limit,
          favorites: favorites.map((f) => {
            // Mapping des types de langue vers types de contenu
            let contentType: 'manga' | 'manhwa' | 'manhua' = 'manga';
            const langType = f.type as string;
            if (langType === 'ko') contentType = 'manhwa';
            else if (langType === 'zh' || langType === 'zh-hk') contentType = 'manhua';
            else contentType = 'manga'; // ja ou autres -> manga
            
            return { 
              id: f.id, 
              author: f.author,
              type: contentType
            };
          }),
        }),
      });

      // Si l'API principale échoue, utiliser l'API mock
      if (!resp.ok) {
        console.log('⚠️ API principale échouée, tentative avec l\'API mock...');
        resp = await fetch('/api/recommendations/mock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit }),
        });
      }

      if (!resp.ok) {
        throw new Error(`HTTP Error ${resp.status}`);
      }

      const data = await resp.json();
      console.log('📄 Réponse API:', data);      if (data.success && Array.isArray(data.results)) {
        setRecommendations(data.results);
        // Utiliser la clé de cache personnalisée
        const favoritesKey = favorites.map(f => f.id).sort().join('_');
        const CACHE_KEY_WITH_FAVORITES = `${CACHE_KEY}_${favoritesKey}`;
        const CACHE_EXPIRY_WITH_FAVORITES = `${CACHE_EXPIRY}_${favoritesKey}`;
        
        localStorage.setItem(CACHE_KEY_WITH_FAVORITES, JSON.stringify(data.results));
        localStorage.setItem(
          CACHE_EXPIRY_WITH_FAVORITES,
          (Date.now() + 60 * 60 * 1000).toString()
        );
        console.log('✅ Recommendations chargées:', data.results.length, 'items');
      } else {
        throw new Error(data.error || 'API error - invalid response format');
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des recommandations:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // En cas d'erreur totale, essayer de charger des données de base
      try {
        const basicRecommendations: Manga[] = [
          {
            id: 'basic-1',
            title: 'One Piece',
            description: 'Les aventures de Monkey D. Luffy',
            cover: '/vercel.svg',
            url: '/manga/one-piece',
            type: 'manga',
            status: 'ongoing',
            lastChapter: '1000+',
            chapterCount: { french: 1000, total: 1100 }
          },
          {
            id: 'basic-2',
            title: 'Attack on Titan',
            description: 'L\'humanité contre les titans',
            cover: '/vercel.svg',
            url: '/manga/attack-on-titan',
            type: 'manga',
            status: 'completed',
            lastChapter: '139',
            chapterCount: { french: 139, total: 139 }
          }
        ];
        setRecommendations(basicRecommendations.slice(0, limit));
        console.log('⚡ Données de base chargées en fallback');
      } catch (basicErr) {
        console.error('❌ Impossible de charger même les données de base:', basicErr);
      }
    } finally {
      setLoading(false);
    }
  }, [limit, favorites]);
  const refetch = useCallback(() => {
    // Nettoyer tous les caches de recommandations pour forcer un refresh
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith(CACHE_KEY) || key.startsWith(CACHE_EXPIRY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cache des recommandations vidé pour refresh');
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, refetch };
}
