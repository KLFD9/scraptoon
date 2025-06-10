import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { logger } from '@/app/utils/logger';
import { 
  getRandomStaticRecommendations, 
  getRecommendationsByAuthor, 
  getRecommendationsByType
} from '@/app/services/staticMangaDatabase';
import type { Manga } from '@/app/types/manga';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const cache = new Cache<Manga[]>(CACHE_DURATION);

interface FavoriteMeta {
  id: string;
  author?: string;
  type?: 'manga' | 'manhwa' | 'manhua';
}

async function generateRecommendations(
  history: string[],
  favorites: FavoriteMeta[],
  limit: number
): Promise<Manga[]> {
  const cacheKey = `recommendations_${history.sort().join('_')}_${favorites
    .map((f) => f.id)
    .sort()
    .join('_')}_${limit}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.log('info', 'Recommandations chargées depuis le cache');
    return cached;
  }

  let recommendations: Manga[] = [];
  const excludeIds = [...history, ...favorites.map(f => f.id)];
  
  // Si l'utilisateur a des favoris, générer des recommandations personnalisées
  if (favorites.length > 0) {
    logger.log('info', 'Génération de recommandations personnalisées', {
      favoritesCount: favorites.length
    });

    const favoriteAuthors = new Set(
      favorites.map((f) => f.author).filter((a): a is string => Boolean(a))
    );

    // 1. Recommandations par auteur (même auteur que les favoris)
    const authorRecommendations: Manga[] = [];
    for (const author of favoriteAuthors) {
      const byAuthor = getRecommendationsByAuthor(author, 2, excludeIds);
      authorRecommendations.push(...byAuthor);
      logger.log('info', 'Recommandations par auteur ajoutées', {
        author,
        count: byAuthor.length,
        titles: byAuthor.map(m => m.title)
      });
    }

    // 2. Recommandations par type dominant
    const favoriteTypes = favorites.map(f => f.type).filter(Boolean);
    if (favoriteTypes.length > 0) {
      const typeCount = favoriteTypes.reduce((acc, type) => {
        if (type) acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantType = (Object.keys(typeCount) as Array<'manga' | 'manhwa' | 'manhua'>).reduce((a, b) => 
        typeCount[a] > typeCount[b] ? a : b
      );

      const typeRecommendations = getRecommendationsByType(
        dominantType, 
        Math.max(2, limit - authorRecommendations.length), 
        [...excludeIds, ...authorRecommendations.map(m => m.id)]
      );
      
      logger.log('info', 'Recommandations par type ajoutées', {
        count: typeRecommendations.length,
        titles: typeRecommendations.map(m => m.title)
      });

      recommendations = [...authorRecommendations, ...typeRecommendations];
    } else {
      recommendations = authorRecommendations;
    }

    // 3. Compléter avec des recommandations aléatoires si besoin
    if (recommendations.length < limit) {
      const remainingCount = limit - recommendations.length;
      const randomRecommendations = getRandomStaticRecommendations(
        remainingCount,
        [...excludeIds, ...recommendations.map(m => m.id)]
      );
      
      recommendations.push(...randomRecommendations);
      
      logger.log('info', 'Recommandations aléatoires ajoutées', {
        count: randomRecommendations.length,
        titles: randomRecommendations.map(m => m.title)
      });
    }

    // Limiter au nombre demandé
    recommendations = recommendations.slice(0, limit);

    logger.log('info', 'Recommandations personnalisées générées avec succès', {
      total: recommendations.length,
      titles: recommendations.map(r => r.title)
    });

  } else {
    // Utilisateur sans favoris : recommandations générales variées
    logger.log('info', 'Génération de recommandations générales (pas de favoris)');
    
    // Mélange de différents types pour la découverte
    const mangaRecs = getRecommendationsByType('manga', Math.ceil(limit * 0.6), excludeIds);
    const manhwaRecs = getRecommendationsByType('manhwa', Math.ceil(limit * 0.3), [...excludeIds, ...mangaRecs.map(m => m.id)]);
    const manhuaRecs = getRecommendationsByType('manhua', Math.ceil(limit * 0.1), [...excludeIds, ...mangaRecs.map(m => m.id), ...manhwaRecs.map(m => m.id)]);
    
    recommendations = [...mangaRecs, ...manhwaRecs, ...manhuaRecs].slice(0, limit);
    
    logger.log('info', 'Recommandations générales générées', {
      total: recommendations.length,
      titles: recommendations.map(r => r.title)
    });
  }

  await cache.set(cacheKey, recommendations);
  return recommendations;
}

export async function POST(request: Request) {
  try {
    const { limit = 6, favorites = [] } = await request.json();
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
