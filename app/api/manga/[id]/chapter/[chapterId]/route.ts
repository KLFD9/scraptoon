import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Page } from 'puppeteer';
import { Cache } from '@/app/utils/cache';

interface ChapterCacheData {
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
  publishAt: string;
  readableAt: string;
  createdAt: string;
  updatedAt: string;
}

// Cache pour les images de chapitres (1 heure)
const cache = new Cache<ChapterCacheData>(3600000);

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

// Configuration améliorée avec sélecteurs plus génériques
const SCRAPING_CONFIGS: Record<string, ScrapingConfig[]> = {
  fr: [
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
      urlPattern: (slug: string, chapter: string) => {
        // Fallback générique - on essaiera plusieurs sites
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
    console.log('⚠️ Aucune configuration de lazy load fournie');
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
      console.error(`${new Date().toISOString()} ❌ Erreur lors du chargement paresseux (scroll ${i + 1}/${maxScrolls}):`, error);
    }
  }
  
  return Promise.resolve();
}

async function scrapeImagesRobust(
  page: Page, 
  config: ScrapingConfig
): Promise<string[]> {
  const images = new Map<string, number>();
  console.log(`📝 Début du scraping robuste avec la configuration ${config.name}`);

  try {
    // Attendre le chargement initial avec timeout réduit
    try {
      await page.waitForSelector('img, canvas, [style*="background-image"]', { timeout: 10000 });
      console.log('✅ Page chargée, éléments visuels détectés');
    } catch {
      console.log('⚠️ Timeout sur les éléments visuels, continuation...');
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
      console.log('🔄 Scraping des images Webtoons');

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
      console.log('🔄 Scroll progressif');
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

      console.log(`📊 Images récupérées: ${images.size}`);

      // Scroll progressif pour charger le contenu lazy
      console.log('🔄 Scroll pour charger le contenu...');
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
          console.log(`📸 Scroll ${i}/${scrollSteps}: ${currentImageCount} images détectées`);
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
            console.log(`✅ ${imgSrcs.length} images trouvées avec ${selector}`);
          }
        } catch (error) {
          console.log(`⚠️ Erreur avec le sélecteur ${selector}: ${error}`);
        }
      }
      
    }
    
    // Si on arrive ici, on a terminé le traitement
    if (images.size === 0) {
      console.log('⚠️ Aucune image trouvée avec les sélecteurs standards');
      return [];
    }
    
    // Retourner les URLs uniques des images
    return Array.from(images.keys());
  } catch (error) {
    console.error(`${new Date().toISOString()} ❌ Erreur lors du scraping robuste: ${error}`);
    return [];
  }
}

export async function GET(
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
      console.log('📦 Données du chapitre récupérées du cache');
      return NextResponse.json(cached);
    }

    console.log(`🔍 Début du scraping pour le chapitre ${chapterId}`);

    // Récupérer les infos du manga depuis l'API MangaDex
    const mangaResponse = await fetch(`https://api.mangadex.org/manga/${mangaId}?includes[]=author&includes[]=artist&includes[]=cover_art`);
    
    if (!mangaResponse.ok) {
      throw new Error(`Erreur lors de la récupération du manga: ${mangaResponse.status}`);
    }

    const mangaData = await mangaResponse.json();
    const manga = mangaData.data;
    
    // Récupérer les infos du chapitre
    const chapterResponse = await fetch(`https://api.mangadex.org/chapter/${chapterId}?includes[]=scanlation_group&includes[]=user`);
    
    if (!chapterResponse.ok) {
      throw new Error(`Erreur lors de la récupération du chapitre: ${chapterResponse.status}`);
    }

    const chapterData = await chapterResponse.json();
    const chapter = chapterData.data;
    
    console.log(`📚 Langue du chapitre: ${chapter.attributes.translatedLanguage}`);

    const language = chapter.attributes.translatedLanguage;
    const configs = SCRAPING_CONFIGS[language] || SCRAPING_CONFIGS['en'];
    
    let images: string[] = [];
    let successfulConfig: string | null = null;

    // Obtenir le titre en slug format
    const titleSlug = manga.attributes.title.en || manga.attributes.title[Object.keys(manga.attributes.title)[0]];
    const slug = titleSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const chapterNumber = chapter.attributes.chapter || '1';

    // Essayer chaque configuration
    for (const config of configs) {
      try {
        const url = config.urlPattern(slug, chapterNumber, manga.attributes.title.en);
        console.log(`🌐 Tentative avec ${config.name}: ${url}`);

        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        });

        const page = await browser.newPage();
        
        try {
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          await page.setViewport({ width: 1280, height: 720 });
          
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          images = await scrapeImagesRobust(page, config);
          
          if (images.length > 0) {
            successfulConfig = config.name;
            console.log(`✅ ${images.length} images récupérées avec ${config.name}`);
            break;
          }
        } finally {
          await browser.close();
        }
      } catch (error) {
        console.log(`❌ Erreur avec ${config.name}: ${error}`);
      }
    }

    // Fallback avec images de démonstration si aucune image trouvée
    if (images.length === 0) {
      console.log('⚠️ Aucune image trouvée, utilisation d\'images de démonstration');
      images = [
        'https://via.placeholder.com/800x1200/2C3E50/FFFFFF?text=Page+1+Demo',
        'https://via.placeholder.com/800x1200/34495E/FFFFFF?text=Page+2+Demo',
        'https://via.placeholder.com/800x1200/2C3E50/FFFFFF?text=Page+3+Demo',
        'https://via.placeholder.com/800x1200/34495E/FFFFFF?text=Page+4+Demo',
        'https://via.placeholder.com/800x1200/2C3E50/FFFFFF?text=Page+5+Demo'
      ];
      successfulConfig = 'demo-fallback';
    }

    const result = {
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
      publishAt: chapter.attributes.publishAt,
      readableAt: chapter.attributes.readableAt,
      createdAt: chapter.attributes.createdAt,
      updatedAt: chapter.attributes.updatedAt
    };

    // Mettre en cache pour 1 heure
    cache.set(cacheKey, result);

    console.log(`✅ Scraping terminé: ${images.length} images trouvées`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`${new Date().toISOString()} ❌ Erreur:`, error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du chapitre', details: String(error) },
      { status: 500 }
    );
  }
}
