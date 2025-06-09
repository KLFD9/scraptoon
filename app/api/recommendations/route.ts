import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { logger } from '@/app/utils/logger';
import { getTrendingManga, getBestSellerManga } from '@/app/services/scraping.service';
import type { Manga } from '@/app/types/manga';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const cache = new Cache<Manga[]>(CACHE_DURATION);

interface FavoriteMeta {
  id: string;
  author?: string;
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
    return cached;
  }

  const favoriteAuthors = new Set(
    favorites.map((f) => f.author).filter((a): a is string => Boolean(a))
  );

  let candidates: Manga[] = [];
  try {
    const trending = await getTrendingManga(limit * 3);
    const bestSellers = await getBestSellerManga(limit * 3);
    candidates = [...trending, ...bestSellers];
  } catch (err) {
    logger.log('error', 'Failed to fetch candidate mangas', { error: String(err) });
  }

  const scored = candidates
    .filter((m) => !history.includes(m.id))
    .map((m) => ({
      manga: m,
      score: favoriteAuthors.has(m.author ?? '') ? 2 : 1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((e) => e.manga);

  await cache.set(cacheKey, scored);
  return scored;
}

export async function POST(request: Request) {
  try {
    const { favorites = [], limit = 6 } = await request.json().catch(() => ({}));
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
