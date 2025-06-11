import type { Browser, Page } from 'puppeteer';
import { Source, ChaptersResult, ChapterData } from '@/app/types/source';
import { launchBrowser } from '@/app/utils/launchBrowser';
import { logger } from '@/app/utils/logger';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let browserPromise: Promise<Browser> | null = null;
async function getBrowser(): Promise<Browser> {
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

async function setupBrowser() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    delete Object.getPrototypeOf(navigator).webdriver;
    // @ts-expect-error -- navigator.chrome is not a standard property
    window.navigator.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', {
      get: () => [{
        0: { type: 'application/x-google-chrome-pdf' },
        description: 'Portable Document Format',
        filename: 'internal-pdf-viewer',
        length: 1,
        name: 'Chrome PDF Plugin'
      }]
    });
  });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document'
  });
  await page.setViewport({ width: 1920, height: 1080 });
  return { browser, page };
}

async function handleCloudflare(page: Page): Promise<boolean> {
  try {
    logger.log('info', 'Tentative de contournement de Cloudflare');
    await page.waitForFunction(() => {
      return document.querySelector('#challenge-form') !== null ||
             document.querySelector('#cf-challenge-running') !== null ||
             document.querySelector('#cf-spinner') !== null;
    }, { timeout: 5000 }).catch(() => null);
    await sleep(2000);
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * 1000);
      const y = Math.floor(Math.random() * 1000);
      await page.mouse.move(x, y);
      await sleep(500);
    }
    await Promise.race([
      page.waitForFunction(() => {
        return document.querySelector('#challenge-form') === null &&
               document.querySelector('#cf-challenge-running') === null &&
               document.querySelector('#cf-spinner') === null;
      }, { timeout: 30000 }),
      page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle0' })
    ]);
    const content = await page.content();
    if (content.includes('cf-browser-verification') ||
        content.includes('cf-challenge-running') ||
        content.includes('_cf_chl_opt')) {
      return false;
    }
    return true;
  } catch (error) {
    logger.log('error', 'Erreur lors du contournement de Cloudflare', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    return false;
  }
}

async function bypassBlocker(page: Page, url: string, maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      logger.log('info', 'Tentative de contournement du blocage', {
        attempt: i + 1,
        maxRetries,
        url
      });
      const delay = Math.floor(Math.random() * 5000) + 5000;
      await sleep(delay);
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 60000
      });
      const isCloudflare = await page.evaluate(() => {
        return document.body.textContent?.toLowerCase().includes('cloudflare') ||
               document.querySelector('#challenge-form, #cf-challenge-running, #cf-spinner') !== null;
      });
      if (isCloudflare) {
        logger.log('info', 'Détection de Cloudflare, tentative de contournement');
        const cloudflareBypass = await handleCloudflare(page);
        if (!cloudflareBypass) {
          logger.log('warning', 'Échec du contournement de Cloudflare');
          continue;
        }
      }
      const pageStatus = await page.evaluate(() => {
        const selectors = {
          validContent: '.manga-title, .chapter-list, .manga-info, .search-results, .chapters-list',
          errorIndicators: {
            error404: '.error-404, .not-found',
            blocked: '.blocked-message, .block-message',
            captcha: '#captcha, .captcha, .g-recaptcha',
            cloudflare: '#challenge-form, #cf-challenge-running'
          }
        } as const;
        const hasValidContent = !!document.querySelector(selectors.validContent);
        const errors = Object.entries(selectors.errorIndicators).reduce((acc, [key, selector]) => {
          acc[key as keyof typeof selectors.errorIndicators] = !!document.querySelector(selector);
          return acc;
        }, {} as Record<string, boolean>);
        return { hasValidContent, errors };
      });
      if (pageStatus.hasValidContent) {
        logger.log('info', 'Contournement réussi', {
          attempt: i + 1,
          url
        });
        return true;
      }
      logger.log('warning', 'Page invalide, nouvelle tentative', {
        attempt: i + 1,
        url,
        pageStatus
      });
    } catch (error) {
      logger.log('error', 'Erreur lors de la tentative de contournement', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        attempt: i + 1,
        url
      });
    }
  }
  return false;
}

export const mangaScantradSource: Source = {
  name: 'mangascantrad',
  baseUrl: 'https://manga-scantrad.io',
  async search(title: string) {
    const { page } = await setupBrowser();
    try {
      const formattedTitle = title.toLowerCase()
        .replace(/boku no/i, 'my')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const directUrl = `${mangaScantradSource.baseUrl}/manga/${formattedTitle}`;
      logger.log('info', "Tentative d'accès direct", { title, url: directUrl });
      if (await bypassBlocker(page, directUrl)) {
        const pageContent = await page.evaluate(() => {
          const titleEl = document.querySelector('.manga-title, .series-title');
          const chapters = document.querySelector('.chapter-list, .chapters-list');
          return { title: titleEl?.textContent?.trim(), hasChapters: !!chapters };
        });
        if (pageContent.hasChapters) {
          logger.log('info', 'Page manga trouvée directement', {
            url: directUrl,
            title: pageContent.title
          });
          return { titleId: formattedTitle, url: directUrl };
        }
      }
      const searchUrl = `${mangaScantradSource.baseUrl}/search?query=${encodeURIComponent(title)}`;
      logger.log('info', 'Tentative de recherche', { url: searchUrl });
      if (await bypassBlocker(page, searchUrl)) {
        await sleep(3000);
        const searchResult = await page.evaluate((searchTitle) => {
          const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
          const searchNormalized = normalizeString(searchTitle);
          const results = Array.from(document.querySelectorAll('.manga-card, .search-result'));
          for (const result of results) {
            const link = result.querySelector('a');
            const titleEl = result.querySelector('.manga-title, .title') as HTMLElement | null;
            const title = titleEl?.textContent?.trim();
            if (link?.href && title) {
              const titleNormalized = normalizeString(title);
              if (titleNormalized.includes(searchNormalized) || searchNormalized.includes(titleNormalized)) {
                return { url: link.href, title };
              }
            }
          }
          return null;
        }, title);
        if (searchResult) {
          logger.log('info', 'Manga trouvé via recherche', searchResult);
          const titleId = searchResult.url.split('/manga/')[1]?.replace(/\/$/, '');
          return { titleId, url: searchResult.url };
        }
      }
      logger.log('info', 'Manga non trouvé sur MangaScantrad', { query: title });
      return { titleId: null, url: null };
    } catch (error) {
      logger.log('error', 'Erreur lors de la recherche sur MangaScantrad', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
      return { titleId: null, url: null };
    } finally {
      await page.close();
    }
  },
  async getChapters(titleId: string, url: string): Promise<ChaptersResult> {
    const { page } = await setupBrowser();
    try {
      logger.log('debug', "Tentative d'accès à la page des chapitres", { url });
      if (!await bypassBlocker(page, url)) {
        throw new Error("Impossible d'accéder à la page des chapitres");
      }
      await sleep(3000);
      const hasChapters = await page.evaluate(() => {
        const selectors = ['.chapter-list', '.chapters-list', '.manga-chapters', '[class*="chapter"]'];
        return selectors.some(selector => document.querySelector(selector));
      });
      if (!hasChapters) {
        logger.log('error', 'Aucune liste de chapitres trouvée', { url });
        throw new Error('Liste des chapitres non trouvée');
      }
      const chapters = await page.evaluate(() => {
        const extractChapterNumber = (text: string) => {
          const match = text.match(/(?:chapitre|chapter|ch[.]?)\s*(\d+(?:\.\d+)?)/i);
          return match ? match[1] : null;
        };
        const chapterElements = Array.from(document.querySelectorAll('.chapter-item, .chapter-element, .chapter, [class*="chapter"]'));
        return chapterElements.map(item => {
          const link = item.querySelector('a');
          const href = link?.getAttribute('href') || '';
          let chapterNumber: string | null = null;
          const urlMatch = href.match(/(?:chapitre|chapter|ch)-(\d+(?:\.\d+)?)/i);
          if (urlMatch) chapterNumber = urlMatch[1];
          if (!chapterNumber && link) {
            chapterNumber = extractChapterNumber(link.textContent || '');
          }
          if (!chapterNumber) {
            chapterNumber = extractChapterNumber(item.textContent || '');
          }
          const titleElement = item.querySelector('.chapter-title, .title') ||
                               link?.querySelector('.title') ||
                               item.querySelector('span:not(.number)');
          const title = titleElement?.textContent?.trim() || null;
          const dateElement = item.querySelector('.chapter-date, .date, time');
          const publishedAt = dateElement?.textContent?.trim() || null;
          return {
            id: chapterNumber || href.split('/').pop() || '',
            chapter: chapterNumber ? `Chapitre ${chapterNumber}` : 'Chapitre inconnu',
            title,
            publishedAt,
            url: href.startsWith('http') ? href : `https://manga-scantrad.io${href}`,
            source: 'mangascantrad'
          } as ChapterData;
        }).filter(ch => ch.id && ch.url);
      });
      if (chapters.length === 0) {
        logger.log('warning', 'Aucun chapitre extrait', { url });
        throw new Error('Aucun chapitre trouvé');
      }
      logger.log('info', 'Chapitres extraits avec succès', {
        url,
        chaptersCount: chapters.length,
        firstChapter: chapters[0],
        lastChapter: chapters[chapters.length - 1]
      });
      return {
        chapters: chapters.reverse(),
        totalChapters: chapters.length,
        source: {
          name: 'mangascantrad',
          url,
          titleId
        }
      };
    } catch (error) {
      logger.log('error', 'Erreur lors de la récupération des chapitres', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined,
        url
      });
      throw error;
    } finally {
      await page.close();
    }
  }
};

export default mangaScantradSource;
