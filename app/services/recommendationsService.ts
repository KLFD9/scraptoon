import { Manga } from '../types/manga';
import { logger } from '../utils/logger';

export interface RecommendationsRequest {
  limit?: number;
  favorites?: Array<{
    id: string;
    title?: string;
    author?: string;
    type?: 'manga' | 'manhwa' | 'manhua';
  }>;
}

export interface RecommendationsResponse {
  success: boolean;
  results: Manga[];
  cached?: boolean;
  error?: string;
}

/**
 * Service centralisé pour obtenir des recommandations dynamiques
 * Remplace l'ancienne dépendance au staticMangaDatabase
 */
export class RecommendationsService {
  private static readonly API_ENDPOINT = '/api/recommendations';

  /**
   * Obtenir des recommandations personnalisées
   */
  static async getRecommendations(request: RecommendationsRequest): Promise<RecommendationsResponse> {
    try {
      logger.log('info', '📡 Requête de recommandations', {
        limit: request.limit,
        favoritesCount: request.favorites?.length || 0
      });

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include', // Pour les cookies de lecture
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RecommendationsResponse = await response.json();
      
      logger.log('info', '✅ Recommandations reçues', {
        count: data.results?.length || 0
      });

      return data;
    } catch (error) {
      logger.log('error', '❌ Erreur service recommandations', {
        error: String(error)
      });

      // Fallback avec des recommandations de base
      return {
        success: false,
        results: this.getFallbackRecommendations(request.limit || 6),
        error: String(error)
      };
    }
  }

  /**
   * Obtenir des recommandations générales (sans favoris)
   */
  static async getGeneralRecommendations(limit: number = 6): Promise<RecommendationsResponse> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}?limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RecommendationsResponse = await response.json();
      return data;
    } catch (error) {
      logger.log('error', '❌ Erreur recommandations générales', {
        error: String(error)
      });

      return {
        success: false,
        results: this.getFallbackRecommendations(limit),
        error: String(error)
      };
    }
  }

  /**
   * Recommendations de fallback en cas d'échec des APIs
   */
  static getFallbackRecommendations(limit: number): Manga[] {
    const fallbacks: Manga[] = [
      {
        id: 'fb-1',
        title: 'One Piece',
        description: 'Les aventures de Monkey D. Luffy à la recherche du One Piece.',
        cover: '/images/manga-placeholder.svg',
        url: '/manga/one-piece',
        type: 'manga',
        status: 'ongoing',
        lastChapter: '1100+',
        chapterCount: { french: 1000, total: 1100 },
        author: 'Eiichiro Oda',
        year: '1997'
      },
      {
        id: 'fb-2',
        title: 'Attack on Titan',
        description: 'L\'humanité face aux titans.',
        cover: '/images/manga-placeholder.svg',
        url: '/manga/attack-on-titan',
        type: 'manga',
        status: 'completed',
        lastChapter: '139',
        chapterCount: { french: 139, total: 139 },
        author: 'Hajime Isayama',
        year: '2009'
      },
      {
        id: 'fb-3',
        title: 'Solo Leveling',
        description: 'Sung Jin-Woo devient le chasseur le plus puissant.',
        cover: '/images/manga-placeholder.svg',
        url: '/manga/solo-leveling',
        type: 'manhwa',
        status: 'completed',
        lastChapter: '179',
        chapterCount: { french: 179, total: 179 },
        author: 'Chugong',
        year: '2018'
      },
      {
        id: 'fb-4',
        title: 'Demon Slayer',
        description: 'Tanjiro combat les démons pour sauver sa sœur.',
        cover: '/images/manga-placeholder.svg',
        url: '/manga/demon-slayer',
        type: 'manga',
        status: 'completed',
        lastChapter: '205',
        chapterCount: { french: 205, total: 205 },
        author: 'Koyoharu Gotouge',
        year: '2016'
      },
      {
        id: 'fb-5',
        title: 'Tower of God',
        description: 'Bam gravit la tour mystérieuse pour retrouver Rachel.',
        cover: '/images/manga-placeholder.svg',
        url: '/manga/tower-of-god',
        type: 'manhwa',
        status: 'ongoing',
        lastChapter: '600+',
        chapterCount: { french: 500, total: 600 },
        author: 'SIU',
        year: '2010'
      },
      {
        id: 'fb-6',
        title: 'My Hero Academia',
        description: 'Izuku Midoriya rêve de devenir un héros.',
        cover: '/images/manga-placeholder.svg',
        url: '/manga/my-hero-academia',
        type: 'manga',
        status: 'ongoing',
        lastChapter: '400+',
        chapterCount: { french: 380, total: 400 },
        author: 'Kohei Horikoshi',
        year: '2014'
      }
    ];

    return fallbacks.slice(0, limit);
  }

  /**
   * Invalider le cache des recommandations
   */
  static async clearCache(): Promise<void> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/clear-cache`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        logger.log('info', '🗑️ Cache des recommandations effacé');
      }
    } catch (error) {
      logger.log('warning', 'Impossible d\'effacer le cache', {
        error: String(error)
      });
    }
  }
}
