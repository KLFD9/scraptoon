import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { logger, LogLevel } from '@/app/utils/logger'; // Import LogLevel
import type { Manga } from '@/app/types/manga';
import { searchMultiSource } from '@/app/services/multiSource';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const cache = new Cache<Manga[]>(CACHE_DURATION);

interface FavoriteMeta {
  id: string; // This ID might be from any source, treat it as a search query if needed.
  title?: string; // Add title to FavoriteMeta for searching
  author?: string;
  type?: 'manga' | 'manhwa' | 'manhua';
  genres?: string[]; // Add genres to FavoriteMeta
}

// Helper to get diverse manga if no specific criteria
async function getDiversePopularManga(limit: number, excludeIds: string[]): Promise<Manga[]> {
  logger.log('info', 'Fetching diverse popular manga');
  const popularGenres = ['action', 'adventure', 'fantasy', 'comedy', 'romance']; // Example genres
  let results: Manga[] = [];
  const resultsPerGenre = Math.ceil(limit / popularGenres.length);

  for (const genre of popularGenres) {
    if (results.length >= limit) break;
    try {
      // Using genre as a search query. searchMultiSource will search by title/keyword.
      // We can refine this if searchMultiSource supports direct genre searches later.
      const genreResults = await searchMultiSource(genre);
      results.push(...genreResults.filter(m => !excludeIds.includes(m.id) && !results.some(r => r.id === m.id) && m.cover && !m.cover.includes('placeholder')));
    } catch (error) {
      logger.log('warning' as LogLevel, `Failed to fetch popular manga for genre: ${genre}`, { error: String(error) });
    }
  }
  return results.slice(0, limit);
}

async function generateRecommendations(
  history: string[],
  favorites: FavoriteMeta[],
  limit: number
): Promise<Manga[]> {
  logger.log('info', '🔍 Dynamic Recommendation Generation - Parameters', {
    params: { // Use params for generic data
        historyCount: history.length,
        favoritesCount: favorites.length,
        limit,
        favoritesDetails: favorites.map(f => ({ id: f.id, title: f.title, author: f.author, type: f.type, genres: f.genres }))
    }
  });

  const cacheKey = `dynamic_recommendations_${history.sort().join('_')}_${favorites
    .map((f) => f.id || f.title)
    .sort()
    .join('_')}_${limit}`;
  
  logger.log('info', '🔑 Dynamic Cache Key Generated', { cacheKey });
    
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.log('info', '💾 Dynamic Recommendations Loaded from Cache', {
      count: cached.length,
      titles: cached.map(c => c.title)
    });
    return cached;
  }

  let recommendations: Manga[] = [];
  const excludeIds = [...history, ...favorites.map(f => f.id).filter(Boolean) as string[]];
  
  logger.log('info', '🚫 IDs to Exclude (Dynamic)', { params: { excludeIds } }); // Use params
  
  if (favorites.length > 0) {
    logger.log('info', '🎯 Generating Personalized Dynamic Recommendations', { params: { favoritesCount: favorites.length } }); // Use params

    const favoriteBasedQueries: string[] = [];
    for (const fav of favorites) {
      if (fav.title) favoriteBasedQueries.push(fav.title); // Prioritize title
      if (fav.author) favoriteBasedQueries.push(fav.author); // Then author
      if (fav.genres && fav.genres.length > 0) favoriteBasedQueries.push(...fav.genres); // Then genres
    }
    
    // Deduplicate queries
    const uniqueQueries = Array.from(new Set(favoriteBasedQueries));
    logger.log('info', '💡 Unique queries from favorites', { params: { uniqueQueries } }); // Use params

    for (const query of uniqueQueries) {
      if (recommendations.length >= limit) break;
      try {
        const searchResults = await searchMultiSource(query);
        const newRecs = searchResults.filter(
          m => 
            !excludeIds.includes(m.id) && 
            !recommendations.some(r => r.id === m.id) &&
            m.cover && !m.cover.includes('placeholder') // Ensure valid cover
        );
        recommendations.push(...newRecs);
        excludeIds.push(...newRecs.map(m => m.id)); // Add new recs to exclude list for subsequent queries
      } catch (error) {
        logger.log('warning' as LogLevel, `Failed to fetch recommendations for query: ${query}`, { error: String(error) });
      }
    }

    // If not enough recommendations from specific queries, fill with diverse popular manga
    if (recommendations.length < limit) {
      logger.log('info', 'Filling remaining recommendations with diverse popular manga (favorites based)');
      const remainingLimit = limit - recommendations.length;
      const diverseRecs = await getDiversePopularManga(remainingLimit, excludeIds);
      recommendations.push(...diverseRecs.filter(m => !recommendations.some(r => r.id === m.id)));
    }

  } else {
    logger.log('info', 'Generating dynamic general recommendations (no favorites)');
    recommendations = await getDiversePopularManga(limit, excludeIds);
  }

  // Final filtering and slicing
  recommendations = recommendations
    .filter(m => m.cover && !m.cover.includes('placeholder') && m.title)
    .slice(0, limit);

  logger.log('info', `📚 Dynamic final recommendations. First 3 covers: ${recommendations.slice(0,3).map(r => r.cover?.substring(0,30) + (r.cover?.startsWith('http') ? '[d]' : '[s]')).join(', ')}`, {
    count: recommendations.length,
    titles: recommendations.map(r => r.title)
  });

  if (recommendations.length > 0) {
    await cache.set(cacheKey, recommendations);
  }
  return recommendations;
}

export async function POST(request: Request) {
  try {
    // Ensure FavoriteMeta includes title and genres if available from client
    const { limit = 6, favorites = [] }: { limit?: number; favorites?: FavoriteMeta[] } = await request.json();
    const cookieStore = cookies();
    const historyCookie = (await cookieStore).get('reading_history');
    let history: string[] = [];
    if (historyCookie) {
      try {
        const parsed = JSON.parse(historyCookie.value);
        if (Array.isArray(parsed)) {
          history = Array.from(new Set(parsed))
            .slice(0, 20)
            .map((id) => String(id));
        }
      } catch (err) {
        logger.log('warning', 'Invalid reading_history cookie', {
          error: String(err),
        });
      }
    }

    const recommendations = await generateRecommendations(history, favorites, Number(limit));

    return NextResponse.json({ success: true, results: recommendations, cached: false });
  } catch (error) {
    logger.log('error', 'Erreur génération recommandations', { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Erreur lors des recommandations' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '6');
    const cookieStore = cookies();
    const historyCookie = (await cookieStore).get('reading_history');
    let history: string[] = [];
    if (historyCookie) {
      try {
        const parsed = JSON.parse(historyCookie.value);
        if (Array.isArray(parsed)) {
          history = Array.from(new Set(parsed))
            .slice(0, 20)
            .map((id) => String(id));
        }
      } catch (err) {
        logger.log('warning', 'Invalid reading_history cookie', {
          error: String(err),
        });
      }
    }

    const recommendations = await generateRecommendations(history, [], limit);

    return NextResponse.json({ success: true, results: recommendations, cached: false });
  } catch (error) {
    logger.log('error', 'Erreur génération recommandations', { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Erreur lors des recommandations' },
      { status: 500 }
    );
  }
}
