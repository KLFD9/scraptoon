import { NextRequest, NextResponse } from 'next/server';
import type { Page, Browser } from 'puppeteer';
import { launchBrowser } from '@/app/utils/launchBrowser';
import { Cache } from '@/app/utils/cache';
import { retry } from '@/app/utils/retry';
import { logger } from '@/app/utils/logger';
import { RequestQueue } from '@/app/utils/requestQueue';


// Préférer l'API MangaDex puis basculer sur Puppeteer en secours
// Cache pour les images de chapitres (1 heure)
const cache = new Cache<ChapterResult>(3600000);
const queue = new RequestQueue({
  maxConcurrent: Number(process.env.MAX_QUEUE_CONCURRENT ?? 3),
  maxQueueSize: Number(process.env.MAX_QUEUE_SIZE ?? 50)
});
const RETRY_ATTEMPTS = Number(process.env.RETRY_ATTEMPTS ?? 3);
const RETRY_DELAY = Number(process.env.RETRY_BASE_DELAY ?? 1000);

// Navigateur Puppeteer réutilisé entre les appels
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser({
      headless: true,
      args: ['--disable-features=VizDisplayCompositor'],
    });
  }
  return browserPromise;
}

async function getMangaDexChapterImages(
  chapterId: string,
): Promise<string[]> {
  try {
    const res = await retry(
      () =>
        fetch(
          `https://api.mangadex.org/at-home/server/${encodeURIComponent(chapterId)}`,
        ),
      RETRY_ATTEMPTS,
      RETRY_DELAY,
    );
    if (!res.ok) {
      logger.log('warning', 'MangaDex at-home failed', {
        status: res.status,
        chapterId
      });
      return [];
    }
    const data = await res.json();
    const baseUrl = data.baseUrl as string;
    const hash = data.chapter.hash as string;
    const images = data.chapter.data as string[];
    return images.map((file) => `${baseUrl}/data/${hash}/${file}`);
  } catch (error) {
    logger.log('error', 'MangaDex fetch error', {
      error: String(error),
      chapterId
    });
    return [];
  }
}


interface ScrapingConfig {
  name: string;
  urlPattern: (slug: string, chapter?: string, title?: string) => string;
  selectors: {
    container: string;
    images: string[];
    lazyLoad?: {
      attribute: string;
      scrollStep: number;
      maxScrolls: number;
      beforeScroll?: (page: Page) => Promise<void>;
    };
  };
}

interface ChapterResult {
  id: string;
  mangaId: string;
  title: string;
  chapter: string | null;
  volume: string | null;
  pageCount: number;
  pages: string[];
  language: string;
  scrapingMethod: string | null;
  mangaTitle: string;
  mangaCover?: string; // Ajouter la couverture du manga
  publishAt: string | null;
  readableAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Configuration améliorée avec sélecteurs plus génériques
const SCRAPING_CONFIGS: Record<string, ScrapingConfig[]> = {  fr: [
    {
      name: 'toomics-fr',
      urlPattern: (slug: string) => {
        return `https://toomics.com/fr/webtoon/search?q=${encodeURIComponent(slug)}`;
      },
      selectors: {
        container: '.comic-viewer, .viewer-container, .episode-container, .toon-viewer',
        images: [
          'img.comic-image',
          'img.episode-image',
          'img.toon-image',
          'img[src*="toomics"]',
          'img[data-src*="toomics"]',
          '.comic-viewer img',
          '.episode-container img',
          'img:not([src*="icon"]):not([src*="logo"]):not([src*="banner"])'
        ],
        lazyLoad: {
          attribute: 'data-src',
          scrollStep: 800,
          maxScrolls: 50,
          beforeScroll: async (page) => {
            // Gestion des popup de vérification d'âge ou consentement
            try {
              await page.evaluate(() => {
                const buttons = document.querySelectorAll('button.consent-popup, button.age-confirm, .btn-confirm');
                if (buttons.length > 0) {
                  (buttons[0] as HTMLElement).click();
                }
              });
            } catch (e) {
              // Ignorer les erreurs
            }
          }
        }
      }
    },
    {
      name: 'webtoons-fr',
      urlPattern: (slug: string) => {
        // Format plus flexible pour webtoons
        return `https://www.webtoons.com/fr/search?keyword=${encodeURIComponent(slug)}`;
      },
      selectors: {
        container: '#_imageList, .viewer_lst, .img_viewer, .viewer_img, .episode_cont',
        images: [
          'img[data-url]',
          'img[src*="webtoon"]',
          'img[src*="episode"]',
          '.viewer_img img',
          '#_imageList img',
          '.episode_cont img'
        ],
        lazyLoad: {
          attribute: 'data-url',
          scrollStep: 1000,
          maxScrolls: 50
        }
      }
    },
    {
      name: 'generic-manga',
      urlPattern: (slug: string, chapter?: string) => {
        // Fallback générique - on essaiera plusieurs sites
        if (!chapter) {
          throw new Error('Chapter is required for this URL pattern');
        }
        return `https://www.google.com/search?q=${encodeURIComponent(slug)}+chapitre+${chapter}+lecture+en+ligne`;
      },
      selectors: {
        container: '.reading-content, .chapter-content, #chapter-content, .manga-reader, .page-container',
        images: [
          'img[src*="manga"]',
          'img[src*="chapter"]',
          'img[src*="page"]',
          '.reading-content img',
          '.chapter-content img',
          '.page-container img',
          'img[data-src]',
          'img[src]:not([src*="icon"]):not([src*="logo"]):not([src*="banner"])'
        ],
        lazyLoad: {
          attribute: 'data-src',
          scrollStep: 500,
          maxScrolls: 30
        }
      }
    }
  ],
  en: [
    {
      name: 'webtoons-en',
      urlPattern: (slug: string) => {
        return `https://www.webtoons.com/en/search?keyword=${encodeURIComponent(slug)}`;
      },
      selectors: {
        container: '#_imageList, .viewer_lst, .img_viewer',
        images: [
          'img[data-url]',
          'img[src*="webtoon"]',
          '#_imageList img',
          '.viewer_lst img'
        ],
        lazyLoad: {
          attribute: 'data-url',
          scrollStep: 1000,
          maxScrolls: 50
        }
      }
    }
  ]
};


async function performLazyLoad(
  page: Page,
  lazyConfig?: ScrapingConfig['selectors']['lazyLoad']
): Promise<void> {
  if (!lazyConfig) {
    logger.log('warning', 'no lazy load configuration provided');
    return Promise.resolve();
  }
  
  const { attribute, scrollStep = 1000, maxScrolls = 20, beforeScroll } = lazyConfig;
  
  for (let i = 0; i < maxScrolls; i++) {
    try {
      if (beforeScroll) {
        await beforeScroll(page);
      }
      
      await page.evaluate((step: number) => {
        window.scrollBy(0, step);
      }, scrollStep);
      
      if (attribute) {
        await page.evaluate((attr: string) => {
          document.querySelectorAll(`img[${attr}]`).forEach(img => {
            const el = img as HTMLImageElement;
            const data = el.getAttribute(attr);
            if (data && !el.src) {
              el.src = data;
            }
          });
        }, attribute);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logger.log('error', 'lazy load scroll error', {
        error: `Scroll attempt ${i + 1} of ${maxScrolls} failed: ${String(error)}`,
      });
    }
  }
  
  return Promise.resolve();
}

async function scrapeImagesRobust(
  page: Page, 
  config: ScrapingConfig
): Promise<string[]> {
  const images = new Map<string, number>();
  logger.log('info', 'robust scraping started', { config: config.name });

  try {
    // Attendre le chargement initial avec timeout réduit
    try {
      await page.waitForSelector('img, canvas, [style*="background-image"]', { timeout: 10000 });
      logger.log('info', 'page loaded, visual elements detected');
    } catch {
      logger.log('warning', 'timeout on visual elements, continuing');
      return [];
    }

    // Désactiver les animations et popups
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        * { 
          scroll-behavior: auto !important; 
          transition: none !important; 
          animation: none !important;
        }
        .modal, .popup, .overlay, .cookie-banner { display: none !important; }
      `;
      document.head.appendChild(style);

      // Fermer les popups courants
      document.querySelectorAll('.modal, .popup, .overlay').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    });


    if (config.name === 'webtoons') {
      // Méthode spécifique pour Webtoons
      logger.log('info', 'scraping webtoons images');

      // Attendre que les images soient chargées
      await page.waitForSelector('img[data-url]', { timeout: 10000 });

      // Récupérer toutes les URLs d'images
      const urls = await page.evaluate(() => {
        const images = document.querySelectorAll('img[data-url]');
        return Array.from(images)
          .map(img => img.getAttribute('data-url'))
          .filter(url => url);
      });

      urls.forEach((url: string | null) => {
        if (url) images.set(url, images.size + 1);
      });

    } else {
      // Méthode générique pour les autres sites
      logger.log('info', 'progressive scroll started');
      await performLazyLoad(page, config.selectors.lazyLoad);

      const currentUrls = await page.evaluate((selectors: string[]) => {
        const urls = new Set<string>();
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(img => {
            const src = img.getAttribute('src');
            const dataSrc = img.getAttribute('data-src');
            const dataUrl = img.getAttribute('data-url');
            if (src && !src.startsWith('data:')) urls.add(src);
            if (dataSrc && !dataSrc.startsWith('data:')) urls.add(dataSrc);
            if (dataUrl && !dataUrl.startsWith('data:')) urls.add(dataUrl);
          });
        });
        return Array.from(urls);
      }, config.selectors.images);

      currentUrls.forEach((url: string) => {
        if (!images.has(url)) {
          images.set(url, images.size + 1);
        }
      });

      logger.log('info', 'images collected', { count: images.size });

      // Scroll progressif pour charger le contenu lazy
      logger.log('info', 'scrolling to load content');
      const scrollSteps = config.selectors.lazyLoad?.maxScrolls || 20;
      const stepSize = config.selectors.lazyLoad?.scrollStep || 500;

      for (let i = 0; i < scrollSteps; i++) {
        await page.evaluate(
          (step: number, size: number) => {
            window.scrollTo(0, step * size);
          },
          i,
          stepSize
        );
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Vérifier si de nouvelles images sont apparues
        const currentImageCount = await page.evaluate(() => 
          document.querySelectorAll('img[src], img[data-src], img[data-url]').length
        );
        
        if (i % 5 === 0) {
          logger.log('info', 'scroll progress', {
            step: i,
            total: scrollSteps,
            images: currentImageCount
          });
        }
      }

      // Essayer tous les sélecteurs d'images
      for (const selector of config.selectors.images) {
        try {
          const imgSrcs = await page.evaluate((sel) => {
            const elements = document.querySelectorAll(sel);
            const sources: string[] = [];
            
            elements.forEach((el) => {
              if (el instanceof HTMLImageElement) {
                const src = el.src || el.dataset?.url || el.dataset?.src;
                if (src && src.startsWith('http')) {
                  // Filtrer les images système (icons, logos, etc.)
                  const isSystemImage = /icon|logo|banner|avatar|profile|button|arrow|star|heart|thumb|ad|sponsor/i.test(src);
                  if (!isSystemImage && (src.includes('manga') || src.includes('chapter') || src.includes('page') || src.includes('webtoon') || src.includes('episode'))) {
                    sources.push(src);
                  }
                }
              }
            });
            
            return sources;
          }, selector);

          imgSrcs.forEach((src) => {
            if (!images.has(src)) {
              images.set(src, images.size + 1);
            }
          });

          if (imgSrcs.length > 0) {
            logger.log('info', 'images found with selector', {
              selector,
              count: imgSrcs.length
            });
          }
        } catch (error) {
          logger.log('warning', 'selector error', {
            selector,
            error: String(error)
          });
        }
      }
      
    }
    
    // Si on arrive ici, on a terminé le traitement
    if (images.size === 0) {
      logger.log('warning', 'no images found with standard selectors');
      return [];
    }
    
    // Retourner les URLs uniques des images
    return Array.from(images.keys());
  } catch (error) {
    logger.log('error', 'robust scraping error', { error: String(error) });
    return [];
  }
}

async function handleGet(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
): Promise<NextResponse> {
  try {
    const { id: mangaId, chapterId } = await Promise.resolve(params);
    if (!mangaId || !chapterId) {
      throw new Error('ID de manga ou de chapitre manquant');
    }
    const cacheKey = `chapter-${mangaId}-${chapterId}`;

    // Vérifier le cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.log('info', 'chapter data retrieved from cache', { chapterId, mangaId });
      return NextResponse.json(cached);
    }

    logger.log('info', 'reading chapter', { chapterId });

    // Récupérer les infos du manga depuis l'API MangaDex
    const mangaResponse = await retry(
      () =>
        fetch(
          `https://api.mangadex.org/manga/${encodeURIComponent(mangaId)}?includes[]=author&includes[]=artist&includes[]=cover_art`,
        ),
      RETRY_ATTEMPTS,
      RETRY_DELAY,
    );
    
    if (!mangaResponse.ok) {
      throw new Error(`Erreur lors de la récupération du manga: ${mangaResponse.status}`);
    }

    const mangaData = await mangaResponse.json();
    const manga = mangaData.data;
    
    // Récupérer les infos du chapitre
    const chapterResponse = await retry(
      () =>
        fetch(
          `https://api.mangadex.org/chapter/${encodeURIComponent(chapterId)}?includes[]=scanlation_group&includes[]=user`,
        ),
      RETRY_ATTEMPTS,
      RETRY_DELAY,
    );
    
    if (!chapterResponse.ok) {
      throw new Error(`Erreur lors de la récupération du chapitre: ${chapterResponse.status}`);
    }

    const chapterData = await chapterResponse.json();
    const chapter = chapterData.data;
    
    logger.log('info', 'chapter language detected', {
      language: chapter.attributes.translatedLanguage
    });

    const language = chapter.attributes.translatedLanguage;
    const configs = SCRAPING_CONFIGS[language] || SCRAPING_CONFIGS['en'];

    let images: string[] = await getMangaDexChapterImages(chapterId);
    let successfulConfig: string | null = images.length > 0 ? 'mangadex-direct' : null;

    if (images.length > 0) {
      logger.log('info', 'images retrieved via MangaDex', {
        count: images.length
      });
    }

    // Obtenir le titre en slug format
    const titleSlug = manga.attributes.title.en || manga.attributes.title[Object.keys(manga.attributes.title)[0]];
    const slug = titleSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const chapterNumber = chapter.attributes.chapter || '1';

    // Utiliser Puppeteer en secours si nécessaire
    if (images.length === 0) {
      for (const config of configs) {
        try {
          const url = config.urlPattern(slug, chapterNumber, manga.attributes.title.en);
          logger.log('info', 'fallback attempt', {
            config: config.name,
            url
          });

          const browser = await getBrowser();
          const page = await browser.newPage();

          try {
            await page.setUserAgent(
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            );
            await page.setViewport({ width: 1280, height: 720 });

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            images = await scrapeImagesRobust(page, config);

            if (images.length > 0) {
              successfulConfig = config.name;
              logger.log('info', 'images retrieved with config', {
                config: config.name,
                count: images.length
              });
              break;
            }
          } finally {
            await page.close();
          }
        } catch (error) {
          logger.log('warning', 'scraping config error', {
            config: config.name,
            error: String(error)
          });
        }
      }
    }

    // Fallback avec images de démonstration si aucune image trouvée
    if (images.length === 0) {
      logger.log('warning', 'no images found, using demo images');
      // Utiliser des images SVG générées directement pour éviter les problèmes de CORS
      const generateDemoImage = (pageNum: number) => {
        const svgContent = `
          <svg width="800" height="1200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1f2937"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="#9ca3af" text-anchor="middle">
              Page ${pageNum}
            </text>
            <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle">
              Démonstration
            </text>
          </svg>
        `;
        return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
      };
      
      images = Array.from({ length: 5 }, (_, i) => generateDemoImage(i + 1));
      successfulConfig = 'demo-fallback';
    }

    // Récupérer aussi les informations du manga pour la couverture
    let mangaCover: string | undefined;
    try {
      const mangaResponse = await retry(
        () => fetch(`https://api.mangadex.org/manga/${mangaId}?includes[]=cover_art`),
        RETRY_ATTEMPTS,
        RETRY_DELAY
      );
      if (mangaResponse.ok) {
        const mangaData = await mangaResponse.json();
        const coverArt = mangaData.data.relationships?.find((rel: any) => rel.type === 'cover_art');
        if (coverArt?.attributes?.fileName) {
          mangaCover = `https://uploads.mangadex.org/covers/${mangaId}/${coverArt.attributes.fileName}.512.jpg`;
        }
      }
    } catch (error) {
      // Ignorer les erreurs de récupération de la couverture
      logger.log('warning', 'unable to retrieve manga cover');
    }

    const result: ChapterResult = {
      id: chapterId,
      mangaId,
      title: `Chapitre ${chapter.attributes.chapter}${chapter.attributes.title ? `: ${chapter.attributes.title}` : ''}`,
      chapter: chapter.attributes.chapter,
      volume: chapter.attributes.volume,
      pageCount: images.length,
      pages: images,
      language: chapter.attributes.translatedLanguage,
      scrapingMethod: successfulConfig,
      mangaTitle: titleSlug,
      mangaCover, // Ajouter la couverture
      publishAt: chapter.attributes.publishAt,
      readableAt: chapter.attributes.readableAt,
      createdAt: chapter.attributes.createdAt,
      updatedAt: chapter.attributes.updatedAt
    };

    // Mettre en cache pour 1 heure
    try {
      await cache.set(cacheKey, result);
    } catch (error) {
      logger.log('error', 'chapter cache set error', {
        error: String(error),
        cacheKey,
      });
    }

    logger.log('info', 'scraping finished', {
      images: images.length,
      chapterId
    });
    return NextResponse.json(result);
  } catch (error) {
    logger.log('error', 'chapter retrieval error', {
      error: String(error),
      chapterId: params.chapterId,
      mangaId: params.id
    });
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du chapitre', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string; chapterId: string } }
): Promise<NextResponse> {
  return queue.add(() => handleGet(request, context));
}
