import { NextResponse } from 'next/server';
import { launchBrowser } from '@/app/utils/launchBrowser';
import type { Page, Browser } from 'puppeteer';
import { Cache } from '@/app/utils/cache';
import { logger } from '@/app/utils/logger';
import { retry } from '@/app/utils/retry';
import type {
  MangaDexChapter,
  MangaDexChaptersResponse
} from '@/app/types/mangadex';

// Types pour le cache des chapitres
interface ChaptersCacheData extends ChaptersResult {
  source: SourceInfo;
}

// Types pour les résultats de recherche
// Cache pour les chapitres (2 heures)
const chaptersCache = new Cache<ChaptersCacheData>(7200000);


interface ChapterData {
  id: string;
  chapter: string;
  title: string | null;
  publishedAt: string | null;
  url: string;
  source: string;
}


interface ChaptersResult {
  chapters: ChapterData[];
  totalChapters: number;
  source: {
    name: string;
    url: string;
    titleId: string;
  };
}

interface SourceSearchResult {
  source: string;
  titleId: string;
  url: string;
  sourceObj: Source;
}

interface SourceInfo {
  name: string;
  url: string;
  titleId: string;
}

// Interface pour les sources
interface Source {
  name: string;
  baseUrl: string;
  search: (title: string) => Promise<{ titleId: string | null; url: string | null }>;
  getChapters: (titleId: string, url: string) => Promise<ChaptersResult>;
}

// Navigateur réutilisé entre les appels
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

const closeBrowser = async () => {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
};

process.on('exit', () => {
  void closeBrowser();
});
process.on('SIGINT', () => {
  void closeBrowser().then(() => process.exit(0));
});

// Configuration du navigateur de base
async function setupBrowser() {
  const browser = await getBrowser();

  const page = await browser.newPage();
  
  // Configuration anti-détection
  await page.evaluateOnNewDocument(() => {
    delete Object.getPrototypeOf(navigator).webdriver;
    // @ts-expect-error -- navigator.chrome is not a standard property
    window.navigator.chrome = {
      runtime: {},
    };
    Object.defineProperty(navigator, 'languages', {
      get: () => ['fr-FR', 'fr', 'en-US', 'en'],
    });
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: {type: "application/x-google-chrome-pdf"},
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin"
        }
      ],
    });
  });

  // Configuration des en-têtes
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



// Fonction pour contourner Cloudflare
async function handleCloudflare(page: Page): Promise<boolean> {
  try {
    logger.log('info', 'Tentative de contournement de Cloudflare');
    
    // Attendre que le challenge Cloudflare soit visible
    await page.waitForFunction(() => {
      return document.querySelector('#challenge-form') !== null ||
             document.querySelector('#cf-challenge-running') !== null ||
             document.querySelector('#cf-spinner') !== null;
    }, { timeout: 5000 }).catch(() => null);

    // Attendre un peu pour laisser Cloudflare initialiser son challenge
    await sleep(2000);

    // Simuler des mouvements de souris aléatoires
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * 1000);
      const y = Math.floor(Math.random() * 1000);
      await page.mouse.move(x, y);
      await sleep(500);
    }

    // Attendre que le challenge soit complété
    await Promise.race([
      page.waitForFunction(() => {
        return document.querySelector('#challenge-form') === null &&
               document.querySelector('#cf-challenge-running') === null &&
               document.querySelector('#cf-spinner') === null;
      }, { timeout: 30000 }),
      page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle0' })
    ]);

    // Vérifier si nous avons passé Cloudflare
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

// Fonction pour contourner les blocages avec gestion de Cloudflare
async function bypassBlocker(page: Page, url: string, maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      logger.log('info', 'Tentative de contournement du blocage', {
        attempt: i + 1,
        maxRetries,
        url
      });

      // Délai aléatoire entre les tentatives
      const delay = Math.floor(Math.random() * 5000) + 5000;
      await sleep(delay);

      // Navigation vers la page
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      // Vérifier si nous sommes face à Cloudflare
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

      // Vérifier le contenu de la page
      const pageStatus = await page.evaluate(() => {
        const selectors = {
          validContent: '.manga-title, .chapter-list, .manga-info, .search-results, .chapters-list',
          errorIndicators: {
            error404: '.error-404, .not-found',
            blocked: '.blocked-message, .block-message',
            captcha: '#captcha, .captcha, .g-recaptcha',
            cloudflare: '#challenge-form, #cf-challenge-running'
          }
        };

        const hasValidContent = !!document.querySelector(selectors.validContent);
        const errors = Object.entries(selectors.errorIndicators).reduce((acc, [key, selector]) => {
          acc[key] = !!document.querySelector(selector);
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


// Source Webtoon
const webtoonSource: Source = {
  name: 'webtoons',
  baseUrl: 'https://www.webtoons.com',
  search: async (title: string) => {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      const searchUrl = `${webtoonSource.baseUrl}/fr/search?keyword=${encodeURIComponent(title)}`;
      logger.log('info', 'Recherche sur Webtoons', { query: title });
      
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });
      await sleep(5000);

      await page.waitForFunction(() => {
        return document.querySelector('.card_item') !== null || 
               document.querySelector('.search_result') !== null;
      }, { timeout: 10000 });

      const result = await page.evaluate((query: string) => {
        const cards = document.querySelectorAll('.card_item');
        let bestMatch = null;
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
  getChapters: async (titleId: string, url: string): Promise<ChaptersResult> => {
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
            };
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
          titleId: titleId
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


// Source MangaScantrad
const mangaScantradSource: Source = {
  name: 'mangascantrad',
  baseUrl: 'https://manga-scantrad.io',
  search: async (title: string) => {
    const { page } = await setupBrowser();
    
    try {
      // Formater le titre pour l'URL directe
      const formattedTitle = title.toLowerCase()
        .replace(/boku no/i, 'my')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Essayer l'accès direct
      const directUrl = `${mangaScantradSource.baseUrl}/manga/${formattedTitle}`;
      logger.log('info', 'Tentative d\'accès direct', { 
        title,
        url: directUrl 
      });

      if (await bypassBlocker(page, directUrl)) {
        // Vérifier si la page contient le contenu attendu
        const pageContent = await page.evaluate(() => {
          const title = document.querySelector('.manga-title, .series-title')?.textContent?.trim();
          const chapters = document.querySelector('.chapter-list, .chapters-list');
          return { title, hasChapters: !!chapters };
        });

        if (pageContent.hasChapters) {
          logger.log('info', 'Page manga trouvée directement', { 
            url: directUrl,
            title: pageContent.title 
          });
          return { titleId: formattedTitle, url: directUrl };
        }
      }

      // Si l'accès direct échoue, essayer la recherche
      const searchUrl = `${mangaScantradSource.baseUrl}/search?query=${encodeURIComponent(title)}`;
      logger.log('info', 'Tentative de recherche', { url: searchUrl });

      if (await bypassBlocker(page, searchUrl)) {
        // Attendre que les résultats se chargent
        await sleep(3000);

        const searchResult = await page.evaluate((searchTitle) => {
          const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
          const searchNormalized = normalizeString(searchTitle);
          
          const results = Array.from(document.querySelectorAll('.manga-card, .search-result'));
          for (const result of results) {
            const link = result.querySelector('a');
            const title = result.querySelector('.manga-title, .title')?.textContent?.trim();
            
            if (link?.href && title) {
              const titleNormalized = normalizeString(title);
              // Vérifier si les titres correspondent approximativement
              if (titleNormalized.includes(searchNormalized) || 
                  searchNormalized.includes(titleNormalized)) {
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
  getChapters: async (titleId: string, url: string): Promise<ChaptersResult> => {
    const { page } = await setupBrowser();
    
    try {
      logger.log('debug', 'Tentative d\'accès à la page des chapitres', { url });

      if (!await bypassBlocker(page, url)) {
        throw new Error('Impossible d\'accéder à la page des chapitres');
      }

      // Attendre que le contenu se charge
      await sleep(3000);

      // Vérifier la présence des chapitres avec différents sélecteurs
      const hasChapters = await page.evaluate(() => {
        const selectors = [
          '.chapter-list', 
          '.chapters-list',
          '.manga-chapters',
          '[class*="chapter"]'
        ];
        return selectors.some(selector => document.querySelector(selector));
      });

      if (!hasChapters) {
        logger.log('error', 'Aucune liste de chapitres trouvée', { url });
        throw new Error('Liste des chapitres non trouvée');
      }

      const chapters = await page.evaluate(() => {
        // Fonction pour extraire le numéro de chapitre
        const extractChapterNumber = (text: string) => {
          const match = text.match(/(?:chapitre|chapter|ch[.]?)\s*(\d+(?:\.\d+)?)/i);
          return match ? match[1] : null;
        };

        // Trouver tous les éléments qui pourraient être des chapitres
        const chapterElements = Array.from(document.querySelectorAll(
          '.chapter-item, .chapter-element, .chapter, [class*="chapter"]'
        ));

        return chapterElements.map(item => {
          const link = item.querySelector('a');
          const href = link?.getAttribute('href') || '';
          
          // Essayer d'extraire le numéro de chapitre de différentes manières
          let chapterNumber = null;
          
          // 1. Depuis l'URL
          const urlMatch = href.match(/(?:chapitre|chapter|ch)-(\d+(?:\.\d+)?)/i);
          if (urlMatch) chapterNumber = urlMatch[1];
          
          // 2. Depuis le texte du lien
          if (!chapterNumber && link) {
            chapterNumber = extractChapterNumber(link.textContent || '');
          }
          
          // 3. Depuis le texte de l'élément
          if (!chapterNumber) {
            chapterNumber = extractChapterNumber(item.textContent || '');
          }

          // Extraire le titre si disponible
          const titleElement = item.querySelector('.chapter-title, .title') || 
                             link?.querySelector('.title') ||
                             item.querySelector('span:not(.number)');
          
          const title = titleElement?.textContent?.trim() || null;

          // Extraire la date
          const dateElement = item.querySelector('.chapter-date, .date, time');
          const publishedAt = dateElement?.textContent?.trim() || null;

          return {
            id: chapterNumber || href.split('/').pop() || '',
            chapter: chapterNumber ? `Chapitre ${chapterNumber}` : 'Chapitre inconnu',
            title,
            publishedAt,
            url: href.startsWith('http') ? href : `https://manga-scantrad.io${href}`,
            source: 'mangascantrad'
          };
        }).filter(chapter => chapter.id && chapter.url);
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
        chapters: chapters.reverse(), // Du plus récent au plus ancien
        totalChapters: chapters.length,
        source: {
          name: 'mangascantrad',
          url: url,
          titleId: titleId
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

// Source MangaDex
const mangadexSource: Source = {
  name: 'mangadex',
  baseUrl: 'https://api.mangadex.org',
  search: async (title: string) => {
    try {
      logger.log('info', 'Recherche sur MangaDex API', { query: title });
      
      const searchUrl = `${mangadexSource.baseUrl}/manga?title=${encodeURIComponent(title)}&limit=5&order[relevance]=desc`;
      const response = await retry(() => fetch(searchUrl), 3, 1000);
      const data = await response.json();

      if (!response.ok || !data.data?.length) {
        logger.log('info', 'Manga non trouvé sur MangaDex', { query: title });
        return { titleId: null, url: null };
      }

      // Trouver le meilleur résultat
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

      // Récupérer les chapitres avec pagination
      const chaptersUrl = `${mangadexSource.baseUrl}/manga/${titleId}/feed?translatedLanguage[]=fr&translatedLanguage[]=en&order[chapter]=desc&limit=500`;
      const response = await retry(() => fetch(chaptersUrl), 3, 1000);
      const data: MangaDexChaptersResponse = await response.json();

      if (!response.ok || !data.data?.length) {
        throw new Error('Aucun chapitre trouvé');
      }

      const chapters = data.data.map((chapter: MangaDexChapter) => ({
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

    } catch (error) {
      logger.log('error', 'Erreur lors de la récupération des chapitres sur MangaDex', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        titleId
      });
      throw error;
    }
  }
};

// Liste des sources disponibles
const sources: Source[] = [
  mangadexSource,
  webtoonSource
  // Retrait temporaire de mangaScantrad à cause de Cloudflare
  // mangaScantradSource
];

// Modifier la fonction searchAllSources pour utiliser les types corrects
async function searchAllSources(mangaTitle: string): Promise<SourceSearchResult[]> {
  const searchPromises = sources.map(async (source) => {
    try {
      logger.log('info', `Recherche sur ${source.name}`, { query: mangaTitle });
      const result = await source.search(mangaTitle);
      if (result.titleId && result.url) {
        return {
          source: source.name,
          titleId: result.titleId,
          url: result.url,
          sourceObj: source
        };
      }
      return null;
    } catch (error) {
      logger.log('error', `Erreur lors de la recherche sur ${source.name}`, {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return null;
    }
  });

  const results = await Promise.all(searchPromises);
  return results.filter((result): result is SourceSearchResult => result !== null);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  // Extraire l'ID du manga de manière sûre
  const { id: mangaId } = await Promise.resolve(params);
  if (!mangaId) {
    logger.log('warning', 'Requête invalide - ID manga manquant');
    return NextResponse.json(
      { error: 'ID du manga manquant' },
      { status: 400 }
    );
  }

  try {
    logger.log('info', 'Début de la requête GET chapters', {
      mangaId,
      timestamp: new Date().toISOString()
    });

    // Récupérer les paramètres de pagination depuis l'URL
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));

    logger.log('debug', 'Paramètres de pagination', {
      page,
      limit,
      mangaId
    });

    // Vérifier le cache
    const cacheKey = `chapters_${mangaId}`;
    const cachedData = await chaptersCache.get(cacheKey);
    
    if (cachedData) {
      logger.log('info', 'Données trouvées en cache', {
        mangaId,
        chaptersCount: cachedData.chapters.length
      });
      return formatResponse(cachedData, page, limit);
    }

    logger.log('debug', 'Récupération des informations depuis MangaDex', {
      mangaId
    });

    // Récupérer les infos du manga depuis MangaDex
    const mangaResponse = await retry(
      () =>
        fetch(
          `https://api.mangadex.org/manga/${mangaId}?includes[]=title`
        ),
      3,
      1000,
    );
    const mangaData = await mangaResponse.json();
    
    if (!mangaResponse.ok) {
      logger.log('error', 'Erreur MangaDex API', {
        status: mangaResponse.status,
        statusText: mangaResponse.statusText,
        mangaId,
        response: mangaData
      });
      return NextResponse.json(
        { error: 'Manga non trouvé' },
        { status: 404 }
      );
    }

    const mangaTitle = mangaData.data.attributes.title.en || 
                      mangaData.data.attributes.title.fr ||
                      mangaData.data.attributes.title.ja || 
                      Object.values(mangaData.data.attributes.title)[0];

    logger.log('info', 'Titre du manga récupéré', {
      mangaId,
      title: mangaTitle,
      availableLanguages: Object.keys(mangaData.data.attributes.title)
    });

    // Rechercher sur toutes les sources
    const sourceResults = await searchAllSources(mangaTitle);
    
    logger.log('debug', 'Résultats de la recherche sur les sources', {
      mangaId,
      title: mangaTitle,
      sourceResults: sourceResults.map(r => ({
        source: r.source,
        titleId: r.titleId,
        url: r.url
      }))
    });

    if (sourceResults.length === 0) {
      logger.log('warning', 'Aucune source trouvée', {
        mangaId,
        title: mangaTitle
      });
      return NextResponse.json(
        { error: 'Manga non trouvé sur aucune source disponible' },
        { status: 404 }
      );
    }

    // Récupérer les chapitres de la première source disponible
    const firstSource = sourceResults[0];
    logger.log('info', 'Tentative de récupération des chapitres', {
      source: firstSource.source,
      titleId: firstSource.titleId,
      url: firstSource.url
    });

    const { chapters: allChapters, totalChapters } = await firstSource.sourceObj.getChapters(
      firstSource.titleId,
      firstSource.url
    );

    logger.log('info', 'Chapitres récupérés avec succès', {
      source: firstSource.source,
      chaptersCount: allChapters.length,
      totalChapters,
      firstChapter: allChapters[0],
      lastChapter: allChapters[allChapters.length - 1]
    });

    // Sauvegarder dans le cache
    const resultData = {
      chapters: allChapters,
      totalChapters,
      source: {
        name: firstSource.source,
        url: firstSource.url,
        titleId: firstSource.titleId
      }
    };
    
    await chaptersCache.set(cacheKey, resultData);
    logger.log('debug', 'Données mises en cache', {
      mangaId,
      cacheKey
    });

    const response = formatResponse(resultData, page, limit);
    const executionTime = Date.now() - startTime;
    
    logger.log('info', 'Requête terminée avec succès', {
      mangaId,
      executionTime,
      chaptersCount: allChapters.length,
      page,
      limit
    });

    return response;

  } catch (error) {
    const executionTime = Date.now() - startTime;
    // Éviter de logger params directement
    logger.log('error', 'Erreur lors de la récupération des chapitres', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      executionTime,
      mangaId // Utiliser uniquement l'ID
    });
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la récupération des chapitres',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

function formatResponse(
  data: ChaptersResult & { source: SourceInfo },
  page: number,
  limit: number
) {
  const { chapters: allChapters, totalChapters, source } = data;
  
  // Calculer les indices pour la pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  // Extraire les chapitres pour la page courante
  const paginatedChapters = allChapters.slice(startIndex, endIndex);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalChapters / limit);

  return NextResponse.json({
    chapters: paginatedChapters,
    pagination: {
      currentPage: page,
      totalPages,
      hasNextPage: endIndex < totalChapters,
      hasPreviousPage: page > 1,
      itemsPerPage: limit,
      totalItems: totalChapters
    },
    source
  });
} 