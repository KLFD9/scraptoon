import { Source, ChaptersResult, ChapterData } from '@/app/types/source';
import type { MangaDexChapter, MangaDexChaptersResponse } from '@/app/types/mangadex';
import { logger } from '@/app/utils/logger';
import { retry } from '@/app/utils/retry';
import { Cache } from '@/app/utils/cache';

const searchCache = new Cache<{ titleId: string | null; url: string | null }>(3600_000);

const fetchHttps = (url: string, options?: RequestInit) => {
  if (!url.startsWith('https://')) {
    throw new Error('Les requêtes externes doivent utiliser HTTPS');
  }
  return fetch(url, options);
};

export const mangadexSource: Source = {
  name: 'mangadex',
  baseUrl: 'https://api.mangadex.org',
  async search(title: string) {
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s'-]/g, '').trim();
    const cacheKey = `mangadex_search_${sanitizedTitle.toLowerCase()}`;
    const cached = await searchCache.get(cacheKey);
    if (cached) {
      logger.log('info', 'Résultat retourné depuis le cache', { query: sanitizedTitle });
      return cached;
    }

    try {
      logger.log('info', 'Recherche sur MangaDex API', { query: sanitizedTitle });
      const searchUrl = `${mangadexSource.baseUrl}/manga?title=${encodeURIComponent(sanitizedTitle)}&limit=5&order[relevance]=desc`;
      const response = await retry(() => fetchHttps(searchUrl), 3, 1000);
      const data = await response.json();

      if (!response.ok || !data.data?.length) {
        logger.log('info', 'Manga non trouvé sur MangaDex', { query: sanitizedTitle });
        const result = { titleId: null, url: null } as const;
        await searchCache.set(cacheKey, result);
        return result;
      }

      const bestMatch = data.data[0];
      const titleId = bestMatch.id;
      const url = `https://mangadex.org/title/${titleId}`;
      logger.log('info', 'Manga trouvé sur MangaDex', {
        titleId,
        url,
        title: bestMatch.attributes.title
      });

      const result = { titleId, url };
      await searchCache.set(cacheKey, result);
      return result;
    } catch (error) {
      logger.log('error', 'Erreur lors de la recherche sur MangaDex', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return { titleId: null, url: null };
    }
  },

  async getChapters(titleId: string, url: string): Promise<ChaptersResult> {
    try {
      logger.log('info', 'Récupération des chapitres depuis MangaDex', { titleId, url });
      const chaptersUrl = `${mangadexSource.baseUrl}/manga/${titleId}/feed?translatedLanguage[]=fr&translatedLanguage[]=en&order[chapter]=desc&limit=500`;
      const response = await retry(() => fetchHttps(chaptersUrl), 3, 1000);
      const data: MangaDexChaptersResponse = await response.json();
      if (!response.ok || !data.data?.length) {
        throw new Error('Aucun chapitre trouvé');
      }
      const chapters: ChapterData[] = data.data.map((chapter: MangaDexChapter) => ({
        id: chapter.id,
        chapter: `Chapitre ${chapter.attributes.chapter || 'inconnu'}`,
        title: chapter.attributes.title || null,
        publishedAt: chapter.attributes.publishAt || null,
        url: `https://mangadex.org/chapter/${chapter.id}`,
        source: 'mangadex',
        language: chapter.attributes.translatedLanguage
      }));

      logger.log('info', 'Chapitres récupérés avec succès', {
        chaptersCount: chapters.length,
        firstChapter: chapters[0],
        lastChapter: chapters[chapters.length - 1]
      });

      return {
        chapters,
        totalChapters: chapters.length,
        source: {
          name: 'mangadex',
          url,
          titleId
        }
      };
    } catch (error) {
      logger.log('error', 'Erreur lors de la récupération des chapitres sur MangaDex', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        titleId
      });
      throw error;
    }
  }
};

export default mangadexSource;
