import { Source, ChaptersResult } from '@/app/types/source';
import { logger } from '@/app/utils/logger';
import { retry } from '@/app/utils/retry';


export const komgaSource: Source = {
  name: 'komga',
  baseUrl: process.env.KOMGA_URL || '',
  search: async (title: string) => {
    try {
      if (!process.env.KOMGA_URL) {
        return { titleId: null, url: null };
      }
      const searchUrl = `${process.env.KOMGA_URL.replace(/\/$/, '')}/api/v1/series?search=${encodeURIComponent(title)}`;
      const res = await retry(() => fetch(searchUrl), 3, 1000);
      if (!res.ok) return { titleId: null, url: null };
      const data = await res.json();
      const first = (data.content || [])[0];
      if (!first) return { titleId: null, url: null };
      return {
        titleId: first.id,
        url: `${process.env.KOMGA_URL.replace(/\/$/, '')}/series/${first.id}`
      };
    } catch (error) {
      logger.log('error', 'Erreur lors de la recherche sur Komga', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return { titleId: null, url: null };
    }
  },
  getChapters: async (titleId: string, url: string): Promise<ChaptersResult> => {
    const komgaBaseUrl = process.env.KOMGA_URL;
    if (!komgaBaseUrl) {
      throw new Error('KOMGA_URL not configured');
    }
    try {
      const chaptersUrl = `${komgaBaseUrl.replace(/\/$/, '')}/api/v1/series/${titleId}/books?size=1000`;
      const res = await retry(() => fetch(chaptersUrl), 3, 1000);
      if (!res.ok) throw new Error('Aucun chapitre trouvé');
      const data = await res.json();
      const chapters = (data.content || []).map((book: any) => ({
        id: book.id,
        chapter: book.metadata?.number ? `Chapitre ${book.metadata.number}` : book.name,
        title: book.metadata?.title || null,
        publishedAt: book.metadata?.releaseDate || null,
        url: `${komgaBaseUrl.replace(/\/$/, '')}/book/${book.id}/read`,
        source: 'komga'
      }));
      return {
        chapters,
        totalChapters: chapters.length,
        source: { name: 'komga', url, titleId }
      };
    } catch (error) {
      logger.log('error', 'Erreur lors de la récupération des chapitres sur Komga', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        titleId
      });
      throw error;
    }
  }
};

export default komgaSource;
