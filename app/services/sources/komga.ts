import { Source, ChaptersResult, SourceSearchResultItem } from '@/app/types/source'; // Added SourceSearchResultItem
import { logger } from '@/app/utils/logger';
import { retry } from '@/app/utils/retry';


export const komgaSource: Source = {
  name: 'komga',
  baseUrl: process.env.KOMGA_URL || '',
  search: async (title: string): Promise<SourceSearchResultItem[]> => { // Updated return type
    try {
      if (!process.env.KOMGA_URL) {
        logger.log('warning', 'Komga search skipped: KOMGA_URL not configured'); // Changed 'warn' to 'warning'
        return [];
      }
      const komgaApiUrl = process.env.KOMGA_URL.replace(/\/$/, '');
      // Komga API returns a list of series. We should fetch a reasonable number.
      // The search in multiSource.ts already limits Komga to 50.
      // Here, we adapt to return all items found by this specific source search.
      const searchUrl = `${komgaApiUrl}/api/v1/series?search=${encodeURIComponent(title)}&size=50`; // Fetch up to 50 like in multiSource
      
      const komgaUser = process.env.KOMGA_USERNAME;
      const komgaPassword = process.env.KOMGA_PASSWORD;
      const headers: HeadersInit = {};
      if (komgaUser && komgaPassword) {
        headers['Authorization'] = 'Basic ' + Buffer.from(komgaUser + ":" + komgaPassword).toString('base64');
      }

      const res = await retry(() => fetch(searchUrl, { headers }), 3, 1000);
      if (!res.ok) {
        logger.log('error', 'Komga API search request failed', { status: res.status, query: title, response: await res.text() });
        return [];
      }
      const data = await res.json();
      
      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        logger.log('info', 'Komga search: No content found or empty array.', { query: title });
        return [];
      }

      const results: SourceSearchResultItem[] = data.content.map((series: any) => ({
        id: series.id,
        title: series.metadata?.title || series.name || 'Untitled',
        url: `${komgaApiUrl}/series/${series.id}`,
        // Komga series search doesn't directly provide a cover URL in the list.
        // The cover is typically fetched separately or constructed, e.g., /api/v1/series/{id}/thumbnail
        // For simplicity in search, we can construct it or leave it undefined if not readily available.
        cover: `${komgaApiUrl}/api/v1/series/${series.id}/thumbnail`,
        sourceName: 'Komga',
      }));
      
      logger.log('info', `Komga search successful. Found ${results.length} items.`, { query: title, count: results.length });
      return results;
    } catch (error) {
      logger.log('error', 'Erreur lors de la recherche sur Komga', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        query: title,
      });
      return [];
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
