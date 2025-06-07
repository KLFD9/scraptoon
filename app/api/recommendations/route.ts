import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { logger } from '@/app/utils/logger';
import { getTrendingManga, getBestSellerManga } from '@/app/services/scraping.service';
import type { Manga } from '@/app/types/manga';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const cache = new Cache<Manga[]>(CACHE_DURATION);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '6');
    const cookieStore = cookies();
    const historyCookie = cookieStore.get('reading_history');
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

    const cacheKey = `recommendations_${history.sort().join('_')}_${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, results: cached, cached: true });
    }

    let candidates: Manga[] = [];
    try {
      const trending = await getTrendingManga(limit * 2);
      const bestSellers = await getBestSellerManga(limit * 2);
      candidates = [...trending, ...bestSellers];
    } catch (err) {
      logger.log('error', 'Failed to fetch candidate mangas', { error: String(err) });
    }

    const filtered = candidates.filter((m) => !history.includes(m.id));
    const recommendations = filtered.slice(0, limit);
    await cache.set(cacheKey, recommendations);

    return NextResponse.json({ success: true, results: recommendations, cached: false });
  } catch (error) {
    logger.log('error', 'Erreur génération recommandations', { error: String(error) });
    return NextResponse.json({ success: false, error: 'Erreur lors des recommandations' }, { status: 500 });
  }
}
