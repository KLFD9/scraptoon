import { Source, ChaptersResult, ChapterData } from '../../types/source';
import { logger } from '../../utils/logger';
import { Cache } from '../../utils/cache';
import { retry } from '../../utils/retry';
import { Agent, fetch as undiciFetch, setGlobalDispatcher } from 'undici';
import * as cheerio from 'cheerio';

const agent = new Agent({ keepAliveTimeout: 30000 });
setGlobalDispatcher(agent);

const BASE_URL = (process.env.MANGAKAKALOT_URL || 'https://mangakakalot.gg').replace(/\/$/, '');

const searchCache = new Cache<{ titleId: string | null; url: string | null }>(3600_000);

const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9\s'-]/g, '').trim();

function secureFetch(url: string) {
  if (!url.startsWith('https://')) throw new Error('Only HTTPS requests are allowed');
  return retry(() => undiciFetch(url, { dispatcher: agent }), 3, 1000);
}

export const mangakakalotSource: Source = {
  name: 'mangakakalot',
  baseUrl: BASE_URL,
  async search(title: string) {
    const sanitizedUserQuery = sanitize(title).toLowerCase();
    const cacheKey = `mangakakalot_search_${sanitizedUserQuery}`;
    const cached = await searchCache.get(cacheKey);
    if (cached) {
      logger.log('info', `Cache hit for mangakakalot search. Sanitized: ${sanitizedUserQuery}`, { query: title });
      return cached;
    }
    try {
      const searchUrl = `${BASE_URL}/search/story/${encodeURIComponent(sanitize(title))}`; // Use original sanitize for URL
      logger.log('debug', `Mangakakalot search URL: ${searchUrl}`, { query: title });
      const res = await secureFetch(searchUrl);
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = $('.story_item').toArray();
      let best: { id: string; url: string; score: number; siteTitle: string } | null = null;
      
      const queryWords = sanitizedUserQuery.split(/\s+/).filter(w => w.length > 0);
      if (queryWords.length === 0) {
        logger.log('info', `Mangakakalot search: sanitized query resulted in no words. Sanitized: ${sanitizedUserQuery}`, { query: title });
        return { titleId: null, url: null };
      }

      for (const el of items) {
        const link = $(el).find('.story_name a').first();
        const href = link.attr('href') || '';
        const siteTitleRaw = link.text().trim();
        const siteTitleSanitized = sanitize(siteTitleRaw).toLowerCase();
        
        const mangaIdMatch = href.match(/\/manga\/([^/?]+)/); // Corrected Regex
        if (!mangaIdMatch) continue;

        const siteTitleWords = siteTitleSanitized.split(/\s+/).filter(w => w.length > 0);
        if (siteTitleWords.length === 0) continue;

        const commonWords = queryWords.filter(w => siteTitleWords.includes(w));
        const score = commonWords.length / Math.max(queryWords.length, siteTitleWords.length, 1);

        logger.log('debug', `Mangakakalot search item scoring. Site: ${siteTitleRaw} (Sanitized: ${siteTitleSanitized}), Score: ${score}, ID: ${mangaIdMatch[1]}`, { query: title });

        if (!best || score > best.score) {
          best = { id: mangaIdMatch[1], url: href.startsWith('http') ? href : `${BASE_URL}${href}`, score, siteTitle: siteTitleRaw };
        }
      }

      if (best) {
        logger.log('debug', `Mangakakalot best match candidate. Found: ${best.siteTitle} (ID: ${best.id}), Score: ${best.score}, Threshold: 0.3`, { query: title });
      } else {
        logger.log('debug', 'Mangakakalot no match candidates found after loop', { query: title });
      }

      if (!best || best.score < 0.3) {
        logger.log('info', `Mangakakalot: Best match score below threshold or no match. Best score: ${best?.score}, Threshold: 0.3, Found: ${best?.siteTitle}`, { query: title });
        const empty = { titleId: null, url: null } as const;
        await searchCache.set(cacheKey, empty);
        return empty;
      }
      
      const result = { titleId: best.id, url: best.url } as const;
      await searchCache.set(cacheKey, result);
      logger.log('info', `Mangakakalot search successful. Result ID: ${result.titleId}, Score: ${best.score}`, { query: title });
      return result;
    } catch (err) {
      logger.log('error', 'Mangakakalot search error', { error: err instanceof Error ? err.message : String(err) });
      return { titleId: null, url: null };
    }
  },
  async getChapters(titleId: string, url: string): Promise<ChaptersResult> {
    try {
      const pageUrl = url.startsWith('http') ? url : `${BASE_URL}/manga/${titleId}`;
      const res = await secureFetch(pageUrl);
      const html = await res.text();
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
      logger.log('error', 'Mangakakalot chapters error', { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }
};

export default mangakakalotSource;
