import { Source, ChaptersResult, ChapterData } from '../../types/source';
import { logger } from '../../utils/logger';
import { Cache } from '../../utils/cache';
import { retry } from '../../utils/retry';
import { Agent, fetch as undiciFetch, setGlobalDispatcher } from 'undici';
import * as cheerio from 'cheerio';

const agent = new Agent({ keepAliveTimeout: 30000 });
setGlobalDispatcher(agent);

const BASE_URL = (process.env.MANGAKAKALOT_URL || 'https://mangakakalot.com').replace(/\/$/, '');

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
    const sanitized = sanitize(title);
    const cacheKey = `mangakakalot_search_${sanitized.toLowerCase()}`;
    const cached = await searchCache.get(cacheKey);
    if (cached) {
      logger.log('info', 'Cache hit for mangakakalot search', { query: sanitized });
      return cached;
    }
    try {
      const searchUrl = `${BASE_URL}/search/story/${encodeURIComponent(sanitized)}`;
      const res = await secureFetch(searchUrl);
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = $('.story_item').toArray();
      let best: { id: string; url: string; score: number } | null = null;
      for (const el of items) {
        const link = $(el).find('.story_name a').first();
        const href = link.attr('href') || '';
        const text = link.text().trim().toLowerCase();
        const match = href.match(/\/manga\/([^/?]+)/);
        if (!match) continue;
        const words1 = sanitized.toLowerCase().split(/\s+/);
        const words2 = text.split(/\s+/);
        const common = words1.filter(w => words2.includes(w));
        const score = common.length / Math.max(words1.length, words2.length);
        if (!best || score > best.score) {
          best = { id: match[1], url: href.startsWith('http') ? href : `${BASE_URL}${href}`, score };
        }
      }
      if (!best || best.score < 0.3) {
        const empty = { titleId: null, url: null } as const;
        await searchCache.set(cacheKey, empty);
        return empty;
      }
      const result = { titleId: best.id, url: best.url } as const;
      await searchCache.set(cacheKey, result);
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
