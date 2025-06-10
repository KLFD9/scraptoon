import { Source, ChaptersResult, ChapterData } from '@/app/types/source';
import { launchBrowser } from '@/app/utils/launchBrowser';
import { logger } from '@/app/utils/logger';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let browserPromise: Promise<any> | null = null;
async function getBrowser(): Promise<any> {
  if (!browserPromise) {
    browserPromise = launchBrowser({
      headless: false,
      args: [
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled'
      ],
      defaultViewport: null
    });
  }
  return browserPromise;
}

export const webtoonsSource: Source = {
  name: 'webtoons',
  baseUrl: 'https://www.webtoons.com',
  async search(title: string) {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      const searchUrl = `${webtoonsSource.baseUrl}/fr/search?keyword=${encodeURIComponent(title)}`;
      logger.log('info', 'Recherche sur Webtoons', { query: title });

      await page.goto(searchUrl, { waitUntil: 'networkidle0' });
      await sleep(5000);

      await page.waitForFunction(() => {
        return document.querySelector('.card_item') !== null ||
               document.querySelector('.search_result') !== null;
      }, { timeout: 10000 });

      const result = await page.evaluate((query: string) => {
        const cards = document.querySelectorAll('.card_item');
        let bestMatch: { titleId: string; url: string; score: number } | null = null;
        let bestScore = 0;

        for (const card of Array.from(cards)) {
          const titleEl = card.querySelector('.subj');
          const link = card.querySelector('a');
          if (titleEl && link) {
            const title = titleEl.textContent?.toLowerCase() || '';
            const href = link.getAttribute('href') || '';
            const match = href.match(/title_no=(\d+)/);

            if (match) {
              const words1 = query.toLowerCase().split(' ');
              const words2 = title.split(' ');
              const commonWords = words1.filter(w => words2.includes(w));
              const score = commonWords.length / Math.max(words1.length, words2.length);

              if (score > bestScore) {
                bestScore = score;
                bestMatch = { titleId: match[1], url: href, score };
              }
            }
          }
        }

        return bestMatch;
      }, title);

      await page.close();

      if (result && result.score > 0.3) {
        logger.log('info', 'Manga trouvé sur Webtoons', { query: title });
        return { titleId: result.titleId, url: result.url };
      }

      logger.log('info', 'Manga non trouvé sur Webtoons', { query: title });
      return { titleId: null, url: null };

    } catch (error) {
      logger.log('error', 'Erreur lors de la recherche sur Webtoons', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return { titleId: null, url: null };
    }
  },
  async getChapters(titleId: string, url: string): Promise<ChaptersResult> {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      const baseUrl = new URL(url);
      const listUrl = `${baseUrl.origin}${baseUrl.pathname.split('/episode-')[0]}/list?title_no=${titleId}`;
      logger.log('info', 'Chargement de la liste des chapitres', { url: listUrl });

      await page.goto(listUrl, { waitUntil: 'networkidle0' });
      await sleep(2000);

      await page.waitForSelector('#_listUl li', { timeout: 10000 });

      const totalPages = await page.evaluate(() => {
        const pageElements = document.querySelectorAll('.paginate a');
        const pages = Array.from(pageElements)
          .map(el => parseInt(el.textContent || '0'))
          .filter(num => !isNaN(num));
        return pages.length > 0 ? Math.max(...pages) : 1;
      });

      logger.log('info', 'Pages trouvées', { totalPages });

      const allChapters: ChapterData[] = [];

      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        const pageUrl = `${listUrl}&page=${currentPage}`;
        logger.log('info', 'Chargement de la page', { page: currentPage, totalPages });

        await page.goto(pageUrl, { waitUntil: 'networkidle0' });
        await sleep(2000);

        await page.waitForSelector('#_listUl li', { timeout: 10000 });

        const chaptersOnPage = await page.evaluate(() => {
          const items = document.querySelectorAll('#_listUl li');
          return Array.from(items).map(item => {
            const link = item.querySelector('a');
            const titleElement = item.querySelector('.subj');
            const dateElement = item.querySelector('.date');
            const href = link?.getAttribute('href') || '';
            const episodeMatch = href.match(/episode-(\d+)/);
            const episodeNumber = episodeMatch ? episodeMatch[1] : '';
            const idMatch = href.match(/episode_no=(\d+)/);
            const id = idMatch ? idMatch[1] : episodeNumber;
            const fullTitle = titleElement?.textContent?.trim() || '';
            const titleMatch = fullTitle.match(/Episode\s+\d+(?:\s*-\s*(.+))?/);
            const title = titleMatch?.[1]?.trim() || '';

            return {
              id,
              chapter: `Episode ${episodeNumber}`,
              title: title || null,
              publishedAt: dateElement?.textContent?.trim() || null,
              url: href,
              source: 'webtoons'
            } as ChapterData;
          });
        });

        allChapters.push(...chaptersOnPage);
        logger.log('info', 'Chapitres trouvés sur la page', {
          page: currentPage,
          count: chaptersOnPage.length
        });
      }

      await page.close();
      logger.log('info', 'Total des chapitres trouvés', { count: allChapters.length });

      return {
        chapters: allChapters.reverse(),
        totalChapters: allChapters.length,
        source: {
          name: 'webtoons',
          url: listUrl,
          titleId
        }
      };

    } catch (error) {
      logger.log('error', 'Erreur lors du scraping des chapitres sur Webtoons', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }
};

export default webtoonsSource;
