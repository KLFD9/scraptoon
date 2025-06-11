import { Source, ChaptersResult, ChapterData, SourceSearchResultItem, SourceSearchParams } from '../../types/source';
import { logger } from '../../utils/logger';
import { Cache } from '../../utils/cache';
import { retry } from '../../utils/retry';
import { Agent, fetch as undiciFetch, setGlobalDispatcher } from 'undici';
import * as cheerio from 'cheerio';

const agent = new Agent({ keepAliveTimeout: 30000 });
setGlobalDispatcher(agent);

const BASE_URL = (process.env.MANGAKAKALOT_URL || 'https://mangakakalot.gg').replace(/\/$/, '');

export interface MangakakalotSearchResultItem {
  id: string;
  title: string;
  url: string;
  cover: string;
  sourceName: 'Mangakakalot';
}

// Cache for the list of results
const searchCache = new Cache<MangakakalotSearchResultItem[]>(3600_000);

const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9\s'-]/g, '').trim();

function secureFetch(url: string) {
  if (!url.startsWith('https://')) throw new Error('Only HTTPS requests are allowed');
  return retry(() => undiciFetch(url, { dispatcher: agent }), 3, 1000);
}

export const mangakakalotSource: Source = {
  name: 'mangakakalot',
  baseUrl: BASE_URL,
  async search(title: string, params?: SourceSearchParams): Promise<SourceSearchResultItem[]> { 
    const sanitizedUserQuery = sanitize(title).toLowerCase();
    const cacheKey = `mangakakalot_search_list_${sanitizedUserQuery}`;

    // Handle refreshCache first
    if (params?.refreshCache) {
      logger.log('info', `Mangakakalot cache explicitly bypassed for key: ${cacheKey} due to refreshCache=true`, { query: title });
      await searchCache.delete(cacheKey);
    } else {
      // If not refreshing, try to get from cache
      const cached = await searchCache.get(cacheKey);
      if (cached) {
        logger.log('info', `Cache hit for mangakakalot search list. Sanitized: ${sanitizedUserQuery}`, { query: title });
        return cached;
      }
    }
    // If cache was bypassed or if it was a cache miss, proceed to fetch
    logger.log('info', `Mangakakalot: Fetching fresh data for key: ${cacheKey} (refresh: ${!!params?.refreshCache})`, { query: title });

    try {
      const searchUrl = `${BASE_URL}/search/story/${encodeURIComponent(sanitize(title))}`;
      const res = await secureFetch(searchUrl);
      const html = await res.text();

      // Check for Cloudflare interstitial page
      if (html.includes("Just a moment...") || html.includes("Verifying you are human") || html.includes("challenge-platform")) {
        logger.log('warning', `Mangakakalot: Detected Cloudflare interstitial page for query: "${title}". Returning empty results.`, { query: title, htmlExcerpt: html.substring(0, 200) }); // Shortened excerpt
        return [];
      }

      const $ = cheerio.load(html);
      const items = $('.story_item').toArray();

      const results: MangakakalotSearchResultItem[] = [];

      for (const el of items) {
        const linkElement = $(el).find('.story_name a').first();
        const href = linkElement.attr('href') || '';
        const siteTitleRaw = linkElement.text().trim();

        const mangaIdMatch = href.match(/\/manga\/([^/?]+)/);
        if (!mangaIdMatch || !mangaIdMatch[1]) {
          continue;
        }

        const coverElement = $(el).find('img').first();
        const cover = coverElement.attr('src') || '';
        
        if (!siteTitleRaw || !href) {
            continue;
        }

        results.push({
          id: mangaIdMatch[1],
          title: siteTitleRaw,
          url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          cover: cover,
          sourceName: 'Mangakakalot',
        });
      }

      if (results.length > 0) {
        logger.log('info', `Mangakakalot search successful. Found ${results.length} items for query: "${title}"`, { query: title, count: results.length });
      } else {
        // Avoid logging "No items found" if Cloudflare was detected, as that's expected.
        if (!(html.includes("Just a moment...") || html.includes("Verifying you are human") || html.includes("challenge-platform"))) {
           logger.log('info', `Mangakakalot: No items found for query: "${title}" after attempting to parse content.`, { query: title });
        }
      }
      
      await searchCache.set(cacheKey, results);
      return results;
    } catch (err) {
      logger.log('error', 'Mangakakalot search error', { error: err instanceof Error ? err.message : String(err), query: title });
      return [];
    }
  },
  async getChapters(titleId: string, url: string): Promise<ChaptersResult> {
    try {
      const pageUrl = url.startsWith('http') ? url : `${BASE_URL}/manga/${titleId}`;
      const res = await secureFetch(pageUrl);
      const html = await res.text();
      // Consider adding Cloudflare check here too if chapter pages can be blocked
      const $ = cheerio.load(html);
      const chapters: ChapterData[] = [];
      const list = $('#chapterlist a, .chapter-list a').toArray();
      for (const a of list) {
        const href = $(a).attr('href') || '';
        const text = $(a).text().trim();
        const time = $(a).parent().find('.chapter-time').text().trim() || null;
        const id = href.split('/').pop() || '';
        const numMatch = href.match(/chapter[_-](\d+(?:\.\d+)?)/i) || text.match(/chapter\s*(\d+(?:\.\d+)?)/i);
        const chapterNumber = numMatch ? numMatch[1] : '';
        chapters.push({
          id: id || chapterNumber,
          chapter: chapterNumber ? `Chapter ${chapterNumber}` : text,
          title: text.replace(/chapter\s*\d+(\s*:\s*)?/i, '').trim() || null,
          publishedAt: time,
          url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          source: 'mangakakalot'
        });
      }
      return {
        chapters: chapters.reverse(),
        totalChapters: chapters.length,
        source: { name: 'mangakakalot', url: pageUrl, titleId }
      };
    } catch (err) {
      logger.log('error', 'Mangakakalot chapters error', { error: err instanceof Error ? err.message : String(err), titleId }); // Added titleId for context
      throw err;
    }
  }
};

export default mangakakalotSource;
