import { useState, useEffect, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import type { Manga } from '../types/manga';
import { logger } from '../utils/logger';
import { RecommendationsService } from '../services/recommendationsService';

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

      logger.log('info', '🔄 Chargement des recommandations', {
        favoritesCount: favorites.length,
        limit
      });

      // Préparer la requête avec les favoris réels
      const favoritesData = favorites.map((fav) => {
        // Mapping des types de langue vers types de contenu
        let contentType: 'manga' | 'manhwa' | 'manhua' = 'manga';
        
        // Utiliser le type existant du favori s'il est défini
        if (fav.type === 'manhwa' || fav.type === 'manhua' || fav.type === 'manga') {
          contentType = fav.type;
        } else {
          // Fallback basé sur d'autres critères
          const langType = fav.type as string;
          if (langType === 'ko') contentType = 'manhwa';
          else if (langType === 'zh' || langType === 'zh-hk') contentType = 'manhua';
          else contentType = 'manga';
        }
        
        return { 
          id: fav.id, 
          title: fav.title, // Ajouter le titre pour l'analyse
          author: fav.author,
          type: contentType
        };
      });

      logger.log('info', '📋 Données favoris préparées', {
        count: favoritesData.length
      });

      // Utiliser le nouveau service
      const response = await RecommendationsService.getRecommendations({
        limit,
        favorites: favoritesData
      });

      if (response.success && response.results) {
        setRecommendations(response.results);
        logger.log('info', '✅ Recommandations chargées avec succès', {
          count: response.results.length
        });
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des recommandations');
      }

    } catch (err) {
      logger.log('error', '❌ Erreur lors du chargement des recommandations', {
        error: String(err)
      });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // Fallback avec des recommendations basiques
      setRecommendations(RecommendationsService.getFallbackRecommendations(limit));
    } finally {
      setLoading(false);
    }
  }, [limit, favorites]);

  const refetch = useCallback(() => {
    logger.log('info', '🔄 Rechargement forcé des recommandations');
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, refetch };
}
