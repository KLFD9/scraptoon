import { Manga } from '@/app/types/manga';
import { logger } from '@/app/utils/logger';
import { Cache } from '@/app/utils/cache';
import type {
  MangaDexChaptersResponse,
  MangaDexManga,
  MangaDexRelationship,
  MangaDexSearchResponse,
  MangaDexChapter
} from '@/app/types/mangadex';

// Cache multi-niveaux (mémoire + Redis) pour les résultats (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Cache<Manga[]>(CACHE_DURATION);

export async function POST(request: Request) {
  try {
    const { searchQuery } = await request.json();
    
    if (!searchQuery) {
      throw new Error('Requête de recherche invalide');
    }

    // Vérification du cache
    const cacheKey = searchQuery.toLowerCase();
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      logger.log('info', 'Résultats retournés depuis le cache', {
        query: searchQuery,
        resultsCount: cachedData.length
      });
      return Response.json({
        success: true,
        results: cachedData,
        metadata: {
          totalResults: cachedData.length,
          source: 'mangadex',
          cached: true
        }
      });
    }

    logger.log('debug', 'Début de la recherche', {
      query: searchQuery,
      timestamp: new Date().toISOString()
    });

    // Construction des paramètres de recherche
    const params = new URLSearchParams();
    
    // Paramètres de base
    params.append('title', searchQuery);
    params.append('limit', '20');
    params.append('offset', '0');
    
    // Inclure les relations nécessaires
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    
    // Filtres de contenu
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    
    // Langue
    params.append('availableTranslatedLanguage[]', 'fr');
    
    // Ordre des résultats
    params.append('order[relevance]', 'desc');
    
    // Paramètres de recherche avancés
    params.append('hasAvailableChapters', 'true');
    
    // Recherche dans le titre original et les titres alternatifs
    params.append('originalLanguage[]', 'ja');
    params.append('originalLanguage[]', 'ko');
    params.append('originalLanguage[]', 'zh');

    // Requête à l'API MangaDex
    const url = `https://api.mangadex.org/manga?${params.toString()}`;
    logger.log('debug', 'URL de recherche', { url });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.log('error', 'Erreur API MangaDex', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Erreur MangaDex: ${response.status} - ${errorText}`);
    }

    const data: MangaDexSearchResponse = await response.json();
    logger.log('debug', 'Réponse API reçue', {
      total: data.total,
      count: data.data?.length || 0
    });

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Format de réponse invalide');
    }

    // Transformation des résultats
    const results: Manga[] = await Promise.all(data.data.map(async (manga: MangaDexManga) => {
      try {
        // Récupération de la couverture
        const cover = manga.relationships?.find((rel: MangaDexRelationship) => rel.type === 'cover_art');
        const author = manga.relationships?.find((rel: MangaDexRelationship) => rel.type === 'author');
        const artist = manga.relationships?.find((rel: MangaDexRelationship) => rel.type === 'artist');
        
        // Récupération du nombre total de chapitres depuis les attributs du manga
        const totalChapters = manga.attributes?.lastChapter 
          ? parseInt(manga.attributes.lastChapter)
          : 0;

        // Récupération des chapitres traduits
        const chaptersResponse = await fetch(
          `https://api.mangadex.org/manga/${manga.id}/feed?limit=0&translatedLanguage[]=fr&includes[]=scanlation_group&order[chapter]=desc`
        );
        const chaptersData: MangaDexChaptersResponse = await chaptersResponse.json();
        
        // Calcul des chapitres traduits en français
        const frenchChapters = new Set(
          chaptersData.data
            ?.filter(
              (chapter: MangaDexChapter) =>
                chapter.attributes.translatedLanguage === 'fr'
            )
            ?.map((chapter: MangaDexChapter) => chapter.attributes.chapter)
        ).size;

        const chapterInfo = {
          french: frenchChapters,
          total: totalChapters,
          formattedText: totalChapters > 0
            ? frenchChapters > 0
              ? `${frenchChapters}/${totalChapters}`
              : `${totalChapters}`
            : '?'
        };

        const coverFileName = cover?.attributes?.fileName;
        const coverUrl = coverFileName 
          ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`
          : '';

        // Extraction du titre avec fallback
        const title = 
          manga.attributes?.title?.fr || 
          manga.attributes?.title?.en || 
          Object.values(manga.attributes?.title || {})[0] || 
          'Sans titre';

        // Extraction des informations de langue
        const availableLanguages = manga.attributes?.availableTranslatedLanguages || [];
        const isAvailableInFrench = availableLanguages.includes('fr');
        const originalLanguage = manga.attributes?.originalLanguage;

        return {
          id: manga.id,
          title,
          description: manga.attributes?.description?.fr || 
                      manga.attributes?.description?.en || 
                      '',
          cover: coverUrl,
          url: `https://mangadex.org/title/${manga.id}`,
          type: originalLanguage === 'ko' ? 'manhwa' : 
                originalLanguage === 'zh' ? 'manhua' : 'manga',
          status: manga.attributes?.status === 'ongoing' ? 'ongoing' : 'completed',
          lastChapter: chapterInfo.formattedText,
          chapterCount: {
            french: chapterInfo.french,
            total: chapterInfo.total
          },
          author: author?.attributes?.name || '',
          artist: artist?.attributes?.name || '',
          year: manga.attributes?.year || '',
          rating: manga.attributes?.contentRating || 'safe',
          availableLanguages,
          isAvailableInFrench,
          originalLanguage
        };
  } catch (error) {
        logger.log('error', 'Erreur lors de la transformation du manga', {
          mangaId: manga.id,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
        return null;
      }
    })).then(results => results.filter((manga: Manga | null): manga is Manga => manga !== null));

    // Mise en cache des résultats
    await cache.set(cacheKey, results);

    logger.log('info', 'Recherche réussie', {
      query: searchQuery,
      resultsCount: results.length,
      titles: results.map(r => r.title)
    });

    return Response.json({
      success: true,
      results,
      metadata: {
        totalResults: results.length,
        source: 'mangadex',
        cached: false
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.log('error', 'Erreur de recherche', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return Response.json({
      success: false,
      error: errorMessage,
      results: []
    }, { status: 500 });
  }
} 