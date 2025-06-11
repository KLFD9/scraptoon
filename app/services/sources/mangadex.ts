import { Source, ChaptersResult } from '@/app/types/source';
import { logger } from '@/app/utils/logger';
import { retry } from '@/app/utils/retry';
import type { MangaDexChapter, MangaDexChaptersResponse } from '@/app/types/mangadex';
import { Source, ChaptersResult, ChapterData } from '@/app/types/source';
import type { MangaDexChapter, MangaDexChaptersResponse } from '@/app/types/mangadex';
import { logger } from '@/app/utils/logger';
import { retry } from '@/app/utils/retry';

export const mangadexSource: Source = {
  name: 'mangadex',
  baseUrl: 'https://api.mangadex.org',
  search: async (title: string) => {
    try {
      logger.log('info', 'Recherche sur MangaDex API', { query: title });

      const searchUrl = `${mangadexSource.baseUrl}/manga?title=${encodeURIComponent(title)}&limit=5&order[relevance]=desc`;
      const response = await retry(() => fetch(searchUrl), 3, 1000);
      const data = await response.json();

  async search(title: string) {
    try {
      logger.log('info', 'Recherche sur MangaDex API', { query: title });
      const searchUrl = `${mangadexSource.baseUrl}/manga?title=${encodeURIComponent(title)}&limit=5&order[relevance]=desc`;
      const response = await retry(() => fetch(searchUrl), 3, 1000);
      const data = await response.json();
      if (!response.ok || !data.data?.length) {
        logger.log('info', 'Manga non trouvé sur MangaDex', { query: title });
        return { titleId: null, url: null };
      }

      const bestMatch = data.data[0];
      const titleId = bestMatch.id;
      const url = `https://mangadex.org/title/${titleId}`;
      const bestMatch = data.data[0];
      const titleId = bestMatch.id;
      const url = `https://mangadex.org/title/${titleId}`;
      logger.log('info', 'Manga trouvé sur MangaDex', {
        titleId,
        url,
        title: bestMatch.attributes.title
      });

      return { titleId, url };
    } catch (error) {
      logger.log('error', 'Erreur lors de la recherche sur MangaDex', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return { titleId: null, url: null };
    }
  },

  getChapters: async (titleId: string, url: string): Promise<ChaptersResult> => {
    try {
      logger.log('info', 'Récupération des chapitres depuis MangaDex', { titleId, url });

      const chaptersUrl = `${mangadexSource.baseUrl}/manga/${titleId}/feed?translatedLanguage[]=fr&translatedLanguage[]=en&order[chapter]=desc&limit=500`;
      const response = await retry(() => fetch(chaptersUrl), 3, 1000);
      const data: MangaDexChaptersResponse = await response.json();

      if (!response.ok || !data.data?.length) {
        throw new Error('Aucun chapitre trouvé');
      }

      const chapters = data.data.map((chapter: MangaDexChapter) => ({
  async getChapters(titleId: string, url: string): Promise<ChaptersResult> {
    try {
      logger.log('info', 'Récupération des chapitres depuis MangaDex', { titleId, url });
      const chaptersUrl = `${mangadexSource.baseUrl}/manga/${titleId}/feed?translatedLanguage[]=fr&translatedLanguage[]=en&order[chapter]=desc&limit=500`;
      const response = await retry(() => fetch(chaptersUrl), 3, 1000);
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
          name: 'mangadx',
          url: url,
          titleId: titleId
        }
      };
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
