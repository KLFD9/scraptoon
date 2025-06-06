import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { retry } from '@/app/utils/retry';
import { logger } from '@/app/utils/logger';
import type {
  MangaDexChaptersResponse,
  MangaDexManga,
  MangaDexRelationship,
  MangaDexSearchResponse,
  MangaDexChapter
} from '@/app/types/mangadex';
import type { Manga } from '@/app/types/manga';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const cache = new Cache<Manga[]>(CACHE_DURATION);

const fetchHttps = (url: string, options?: RequestInit) => {
  if (!url.startsWith('https://')) {
    throw new Error('Les requêtes externes doivent utiliser HTTPS');
  }
  return fetch(url, options);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '8');
    const cacheKey = `newest_${limit}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, results: cached, cached: true });
    }

    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('order[latestUploadedChapter]', 'desc');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');

    const url = `https://api.mangadex.org/manga?${params.toString()}`;

    const response = await retry(
      () => fetchHttps(url, { headers: { Accept: 'application/json' } }),
      3,
      1000
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.log('error', 'Erreur API MangaDex newest', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Erreur MangaDex: ${response.status}`);
    }

    const data: MangaDexSearchResponse = await response.json();

    const results: Manga[] = await Promise.all(
      data.data.map(async (manga: MangaDexManga) => {
        try {
          const cover = manga.relationships?.find(
            (rel: MangaDexRelationship) => rel.type === 'cover_art'
          );
          const author = manga.relationships?.find(
            (rel: MangaDexRelationship) => rel.type === 'author'
          );
          const totalChapters = manga.attributes?.lastChapter
            ? parseInt(manga.attributes.lastChapter)
            : 0;
          const chaptersResponse = await retry(
            () =>
              fetchHttps(
                `https://api.mangadex.org/manga/${manga.id}/feed?limit=0&translatedLanguage[]=fr&order[chapter]=desc`
              ),
            3,
            1000
          );
          const chaptersData: MangaDexChaptersResponse = await chaptersResponse.json();
          const frenchChapters = new Set(
            chaptersData.data?.map((c: MangaDexChapter) => c.attributes.chapter)
          ).size;

          const coverFileName = cover?.attributes?.fileName;
          const coverUrl = coverFileName
            ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`
            : '';
          const title =
            manga.attributes.title.fr ||
            manga.attributes.title.en ||
            Object.values(manga.attributes.title)[0] ||
            'Sans titre';
          const availableLanguages =
            manga.attributes.availableTranslatedLanguages || [];
          const isAvailableInFrench = availableLanguages.includes('fr');
          const originalLanguage = manga.attributes.originalLanguage;

          return {
            id: manga.id,
            title,
            description:
              manga.attributes.description?.fr ||
              manga.attributes.description?.en ||
              '',
            cover: coverUrl,
            url: `https://mangadex.org/title/${manga.id}`,
            type:
              originalLanguage === 'ko'
                ? 'manhwa'
                : originalLanguage === 'zh'
                  ? 'manhua'
                  : 'manga',
            status:
              manga.attributes.status === 'ongoing' ? 'ongoing' : 'completed',
            lastChapter:
              totalChapters > 0
                ? frenchChapters > 0
                  ? `${frenchChapters}/${totalChapters}`
                  : `${totalChapters}`
                : '?',
            chapterCount: { french: frenchChapters, total: totalChapters },
            author: author?.attributes?.name || '',
            year: manga.attributes.year || '',
            rating: manga.attributes.contentRating || 'safe',
            availableLanguages,
            isAvailableInFrench,
            originalLanguage
          } as Manga;
        } catch (error) {
          logger.log('error', 'Erreur transformation newest', {
            error: String(error),
            mangaId: manga.id
          });
          return null;
        }
      })
    ).then((res) => res.filter((m): m is Manga => m !== null));

    await cache.set(cacheKey, results);

    return NextResponse.json({ success: true, results, cached: false });
  } catch (error) {
    logger.log('error', 'Erreur récupération nouveautés', { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des nouveautés' },
      { status: 500 }
    );
  }
}
