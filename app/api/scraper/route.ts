import { Manga } from '@/app/types/manga';
import { logger } from '@/app/utils/logger';
import { Cache } from '@/app/utils/cache';
import { RateLimiter } from '@/app/utils/rateLimiter';
import { retry } from '@/app/utils/retry';
import { searchMultiSource } from '@/app/services/multiSource';
import { RequestQueue } from '@/app/utils/requestQueue';
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
const rateLimiter = new RateLimiter(30, 60_000);
const queue = new RequestQueue({
  maxConcurrent: Number(process.env.MAX_QUEUE_CONCURRENT ?? 3),
  maxQueueSize: Number(process.env.MAX_QUEUE_SIZE ?? 50)
});
const RETRY_ATTEMPTS = Number(process.env.RETRY_ATTEMPTS ?? 3);
const RETRY_DELAY = Number(process.env.RETRY_BASE_DELAY ?? 1000);

const fetchHttps = (url: string, options?: RequestInit) => {
  if (!url.startsWith('https://')) {
    throw new Error('Les requ\u00eates externes doivent utiliser HTTPS');
  }
  return fetch(url, options);
};

async function handlePost(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'global';

    if (!rateLimiter.canMakeRequest(ip)) {
      return Response.json({
        success: false,
        error: 'Trop de requêtes, veuillez patienter.'
      }, { status: 429 });
    }

    const { searchQuery, refreshCache } = await request.json(); // Added refreshCache
    
    if (!searchQuery) {
      throw new Error('Requête de recherche invalide');
    }

    const sanitizedQuery = searchQuery.replace(/[^a-zA-Z0-9\\s'-]/g, '').trim();

    if (!sanitizedQuery) {
      throw new Error('Requête de recherche invalide');
    }

    const cacheKey = sanitizedQuery.toLowerCase();

    if (refreshCache === true) {
      await cache.delete(cacheKey);
      logger.log('info', `[API Route] Cache for '${cacheKey}' deleted (refresh requested).`, { query: sanitizedQuery, cacheKey });
    }

    if (refreshCache !== true) {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.log('info', '[API Route] Results from cache.', {
          query: sanitizedQuery,
          resultsCount: cachedData.length,
          cacheKey
        });
        return Response.json({
          success: true,
          results: cachedData,
          metadata: {
            totalResults: cachedData.length,
            source: 'cache', // Corrected source to 'cache'
            cached: true
          }
        });
      }
      logger.log('info', `[API Route] Cache miss for '${cacheKey}'.`, { query: sanitizedQuery, cacheKey });
    }
    
    const searchStartTime = Date.now();
    logger.log('info', `[API Route] Calling searchMultiSource for "${sanitizedQuery}" (refresh: ${!!refreshCache})`, { query: sanitizedQuery, refreshCache: !!refreshCache });
    const aggregated = await searchMultiSource(sanitizedQuery, refreshCache);
    const searchExecutionTime = Date.now() - searchStartTime;
    logger.log('info', `[API Route] searchMultiSource returned ${aggregated.length} results for "${sanitizedQuery}" in ${searchExecutionTime}ms`, { query: sanitizedQuery, resultsCount: aggregated.length, executionTime: searchExecutionTime });

    if (aggregated.length > 0) {
      await cache.set(cacheKey, aggregated);
      logger.log('info', '[API Route] Multi-source results fetched, cached, and returned.', { 
        query: sanitizedQuery, 
        resultsCount: aggregated.length,
        cacheKey,
        executionTime: searchExecutionTime
      });
      return Response.json({
        success: true,
        results: aggregated,
        metadata: {
          totalResults: aggregated.length,
          source: 'multi-source', // Changed to 'multi-source'
          cached: false,
          executionTimeMs: searchExecutionTime
        },
      });
    }

    // Fallback to MangaDex if multi-source returns nothing - This section might be hit if all sources fail or return empty
    logger.log('warning', `[API Route] Multi-source search returned 0 results for "${sanitizedQuery}". Falling back to MangaDex.`, { query: sanitizedQuery, executionTime: searchExecutionTime });
    
    const mangaDexFallbackStartTime = Date.now();
    const params = new URLSearchParams();
    
    params.append('title', sanitizedQuery);
    params.append('limit', '20');
    params.append('offset', '0');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('availableTranslatedLanguage[]', 'fr');
    params.append('order[relevance]', 'desc');
    params.append('hasAvailableChapters', 'true');
    params.append('originalLanguage[]', 'ja');
    params.append('originalLanguage[]', 'ko');
    params.append('originalLanguage[]', 'zh');

    const url = `https://api.mangadex.org/manga?${params.toString()}`;

    const response = await retry(
      () =>
        fetchHttps(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }),
      RETRY_ATTEMPTS,
      RETRY_DELAY,
    );

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

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Format de réponse invalide');
    }

    // Transformation des résultats
    const rawResults: Array<Manga | null> = await Promise.all(
      data.data.map(async (manga: MangaDexManga) => {
        try {
          // Récupération de la couverture
          const coverRel = manga.relationships?.find((rel: MangaDexRelationship) => rel.type === 'cover_art');
          const author = manga.relationships?.find((rel: MangaDexRelationship) => rel.type === 'author');
          const artist = manga.relationships?.find((rel: MangaDexRelationship) => rel.type === 'artist');
        
          const coverUrl = coverRel?.attributes?.fileName
            ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`
            : '';

          // Récupération du nombre total de chapitres depuis les attributs du manga
          const totalChapters = manga.attributes?.lastChapter 
            ? parseInt(manga.attributes.lastChapter)
            : 0;

          let title = 'Untitled';
          if (manga.attributes?.title) {
            title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Untitled';
          }

          let description = '';
          if (manga.attributes?.description) {
            description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || '';
          }

          return {
            id: manga.id,
            title: title,
            description: description,
            cover: coverUrl,
            url: `/manga/${manga.id}`, // Assurez-vous que l'URL est correcte
            source: 'MangaDex', // Ajout de la propriété source
            type: (manga.attributes?.originalLanguage === 'ja' ? 'manga' : 'manhwa') as 'manga' | 'manhwa' | 'manhua',
            status: (manga.attributes?.status || 'unknown') as 'ongoing' | 'completed',
            lastChapter: manga.attributes?.lastChapter || '?',
            chapterCount: { french: 0, total: totalChapters }, // Mettez à jour si vous avez le nombre de chapitres en français
            author: author?.attributes?.name || 'N/A',
            artist: artist?.attributes?.name || 'N/A',
            year: manga.attributes?.year ? String(manga.attributes.year) : undefined,
            originalLanguage: manga.attributes?.originalLanguage || undefined,
            // Assurez-vous que toutes les propriétés requises par Manga sont ici
          } as Manga;
        } catch (mapError) {
          logger.log('error', 'Erreur lors de la transformation du manga', {
            mangaId: manga.id,
            error: mapError instanceof Error ? mapError.message : 'Erreur inconnue',
          });
          return null;
        }
      })
    );

    const results: Manga[] = rawResults.filter((manga): manga is Manga => manga !== null);

    // Mise en cache des résultats
    await cache.set(cacheKey, results);

    logger.log('info', '[API Route] MangaDex fallback search successful.', {
      query: sanitizedQuery,
      resultsCount: results.length
    });

    const mangaDexFallbackExecutionTime = Date.now() - mangaDexFallbackStartTime;

    return Response.json({
      success: true,
      results, // Assuming 'results' is the variable holding MangaDex results
      metadata: {
        totalResults: results.length,
        source: 'mangadex-fallback', // Clearly indicate fallback
        cached: false, // Fallback results are fresh, then cached
        executionTimeMs: mangaDexFallbackExecutionTime
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

export async function POST(request: Request) {
  return queue.add(() => handlePost(request));
}
