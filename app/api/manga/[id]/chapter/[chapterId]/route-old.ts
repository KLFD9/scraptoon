import { NextResponse } from 'next/server';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer';

// Fonction pour récupérer les vraies images depuis MangaDex
async function getMangaDexChapterImages(chapterId: string): Promise<string[]> {
  try {
    console.log(`📖 Récupération des images MangaDex pour le chapitre ${chapterId}`);
    
    // Récupérer les URLs des images depuis l'API MangaDex
    const atHomeResponse = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
    
    if (!atHomeResponse.ok) {
      console.log(`⚠️ Échec API at-home MangaDex: ${atHomeResponse.status}`);
      return [];
    }

    const atHomeData = await atHomeResponse.json();
    const baseUrl = atHomeData.baseUrl;
    const hash = atHomeData.chapter.hash;
    const images = atHomeData.chapter.data; // Images haute qualité

    if (!images || images.length === 0) {
      console.log('⚠️ Aucune image trouvée dans la réponse MangaDx');
      return [];
    }

    // Construire les URLs complètes des images
    const imageUrls = images.map((filename: string) => 
      `${baseUrl}/data/${hash}/${filename}`
    );

    console.log(`✅ ${imageUrls.length} images MangaDx récupérées`);
    return imageUrls;

  } catch (error) {
    console.log(`❌ Erreur lors de la récupération MangaDx: ${error}`);
    return [];
  }
}

interface ScrapingConfig {
  name: string;
  urlPattern: (slug: string, chapter: string, title?: string) => string;
  selectors: {
    container: string;
    images: string[];
    lazyLoad?: {
      attribute: string;
      scrollStep?: number;
      maxScrolls?: number;
      beforeScroll?: (page: Page) => Promise<void>;
    };
  };
}

const SCRAPING_CONFIGS: Record<string, ScrapingConfig[]> = {
  fr: [
    {
      name: 'webtoons',
      urlPattern: (slug: string, chapter: string, title?: string) => {
        const titleMatch = title?.match(/title_no=(\d+)/);
        const titleNo = titleMatch ? titleMatch[1] : '3517';
        const webtoonSlug = slug
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('-');
        return `https://www.webtoons.com/fr/fantasy/${webtoonSlug}/episode-${chapter}/viewer?title_no=${titleNo}`;
      },
      selectors: {
        container: '#_imageList, .viewer_lst, .img_viewer, .viewer_img',
        images: [
          '#_imageList img[data-url]',
          '#_imageList img[src]',
          '.viewer_img img[data-url]',
          '.viewer_img img[src]',
          '.viewer_lst img[data-url]',
          '.viewer_lst img[src]',
          '.img_viewer img'
        ],
        lazyLoad: {
          attribute: 'data-url',
          scrollStep: 1000,
          maxScrolls: 50,
          beforeScroll: async (page: Page) => {
            await page.evaluate(() => {
              // Forcer le chargement des images
              document.querySelectorAll('img[data-url]').forEach(img => {
                const el = img as HTMLImageElement;
                if (el.dataset.url && !el.src) {
                  el.src = el.dataset.url;
                }
              });
            });
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    },
    {
      name: 'scan-manga',
      urlPattern: (slug: string, chapter: string) => 
        `https://scan-manga.com/lecture-en-ligne/${slug}/chapitre-${chapter}/`,
      selectors: {
        container: '.reading-content, .chapter-content, #chapter-content',
        images: [
          '.reading-content img[src]',
          '.chapter-content img[src]',
          '#chapter-content img[src]',
          'img.wp-manga-chapter-img',
          '.page-break img'
        ],
        lazyLoad: {
          attribute: 'data-src',
          scrollStep: 500,
          maxScrolls: 30
        }
      }
    },
    {
      name: 'japscan',
      urlPattern: (slug: string, chapter: string) => 
        `https://www.japscan.to/lecture-en-ligne/${slug}/${chapter}/`,
      selectors: {
        container: '#pages, .img-responsive-container',
        images: [
          '#pages img',
          '.img-responsive-container img',
          'img[data-src]',
          'img[src*="japscan"]'
        ],
        lazyLoad: {
          attribute: 'data-src',
          scrollStep: 800,
          maxScrolls: 25
        }
      }
    }
  ],
  en: [
    {
      name: 'webtoons-en',
      urlPattern: (slug: string, chapter: string, title?: string) => {
        const titleMatch = title?.match(/title_no=(\d+)/);
        const titleNo = titleMatch ? titleMatch[1] : '95';
        return `https://www.webtoons.com/en/fantasy/${slug}/season-1-ep-${chapter}/viewer?title_no=${titleNo}&episode_no=${chapter}`;
      },
      selectors: {
        container: '#_imageList, .viewer_lst, .img_viewer',
        images: [
          '#_imageList img[data-url]',
          '#_imageList img[src]',
          '.viewer_lst img',
          '.img_viewer img'
        ],
        lazyLoad: {
          attribute: 'data-url',
          scrollStep: 1000,
          maxScrolls: 50
        }
      }
    },
    {
      name: 'mangadex',
      urlPattern: (slug: string, chapter: string) => 
        `https://mangadex.org/chapter/${chapter}`,
      selectors: {
        container: '.page-container, .reader-image-wrapper',
        images: [
          '.page-container img',
          '.reader-image-wrapper img',
          'img[src*="mangadex"]'
        ],
        lazyLoad: {
          attribute: 'src',
          scrollStep: 1000,
          maxScrolls: 30
        }
      }
    }
  ]
};

async function scrapeImages(page: Page, config: ScrapingConfig): Promise<string[]> {
  console.log(`📝 Début du scraping avec la configuration ${config.name}`);

  try {
    // Essayer de trouver le conteneur avec différents sélecteurs
    const containerSelectors = config.selectors.container.split(', ');
    let containerFound = false;
    
    for (const selector of containerSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        console.log(`✅ Conteneur trouvé avec le sélecteur: ${selector}`);
        containerFound = true;
        break;
      } catch {
        console.log(`⚠️ Sélecteur ${selector} non trouvé, essai suivant...`);
      }
    }

    if (!containerFound) {
      console.log('⚠️ Aucun conteneur trouvé, tentative de scraping général...');
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
        .modal, .popup, .overlay, .cookie-notice { display: none !important; }
      `;
      document.head.appendChild(style);
      
      // Supprimer les éléments gênants
      const elementsToRemove = document.querySelectorAll('.modal, .popup, .overlay, .cookie-notice, .ads, .advertisement');
      elementsToRemove.forEach(el => el.remove());
    });

    // Attendre un peu pour que la page se stabilise
    await new Promise(r => setTimeout(r, 2000));

    // Méthode de scraping adaptée
    if (config.name.includes('webtoons')) {
      console.log('🔄 Scraping spécialisé pour Webtoons');
      return await scrapeWebtoons(page);
    } else {
      console.log('🔄 Scraping générique');
      return await scrapeGeneric(page, config);
    }

  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error);
    return [];
  }
}

async function scrapeWebtoons(page: Page): Promise<string[]> {
  const images = new Set<string>();
  
  try {
    // Attendre que les images soient présentes
    await page.waitForSelector('img', { timeout: 10000 });
    
    // Scroll pour charger toutes les images
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if(totalHeight >= scrollHeight || totalHeight > 20000){
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Forcer le chargement des images lazy-load
    await page.evaluate(() => {
      document.querySelectorAll('img[data-url]').forEach(img => {
        const el = img as HTMLImageElement;
        if (el.dataset.url && !el.src) {
          el.src = el.dataset.url;
        }
      });
    });

    await new Promise(r => setTimeout(r, 3000));

    // Récupérer toutes les URLs d'images
    const urls = await page.evaluate(() => {
      const imageUrls = new Set<string>();
      
      // Essayer différents sélecteurs
      const selectors = [
        'img[data-url]',
        '#_imageList img',
        '.viewer_lst img',
        '.viewer_img img',
        '.img_viewer img'
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(img => {
          const element = img as HTMLImageElement;
          const url = element.dataset.url || element.src;
          if (url && !url.startsWith('data:') && !url.includes('blank')) {
            imageUrls.add(url);
          }
        });
      });
      
      return Array.from(imageUrls);
    });
    
    urls.forEach(url => images.add(url));
    console.log(`✅ Webtoons: ${images.size} images trouvées`);
    
  } catch (error) {
    console.error('❌ Erreur scraping Webtoons:', error);
  }
  
  return Array.from(images);
}

async function scrapeGeneric(page: Page, config: ScrapingConfig): Promise<string[]> {
  const images = new Set<string>();
  
  try {
    // Scroll progressif avec récupération d'images
    for (let i = 0; i <= 10; i++) {
      await page.evaluate((percent) => {
        window.scrollTo(0, document.body.scrollHeight * (percent / 10));
      }, i);
      
      // Forcer le chargement des images lazy-load
      await page.evaluate(() => {
        document.querySelectorAll('img[data-src]').forEach(img => {
          const el = img as HTMLImageElement;
          if (el.dataset.src && !el.src) {
            el.src = el.dataset.src;
          }
        });
      });
      
      await new Promise(r => setTimeout(r, 1500));

      // Récupérer les images à chaque étape
      const currentUrls = await page.evaluate((selectors) => {
        const urls = new Set<string>();
        
        // Essayer tous les sélecteurs
        selectors.forEach((selector: string) => {
          try {
            document.querySelectorAll(selector).forEach(img => {
              const element = img as HTMLImageElement;
              const src = element.src;
              const dataSrc = element.dataset.src;
              
              if (src && !src.startsWith('data:') && !src.includes('blank') && !src.includes('loading')) {
                urls.add(src);
              }
              if (dataSrc && !dataSrc.startsWith('data:') && !dataSrc.includes('blank')) {
                urls.add(dataSrc);
              }
            });
          } catch (error) {
            console.log(`Erreur avec le sélecteur ${selector}:`, error);
          }
        });
        
        return Array.from(urls);
      }, config.selectors.images);

      currentUrls.forEach(url => {
        // Filtrer les URLs valides
        if (url.includes('/uploads/') || 
            url.includes('manga') || 
            url.includes('chapter') ||
            url.includes('.jpg') ||
            url.includes('.png') ||
            url.includes('.jpeg') ||
            url.includes('.webp')) {
          images.add(url);
        }
      });

      console.log(`📊 Étape ${i}: ${images.size} images trouvées`);
      
      // Si on a trouvé beaucoup d'images, on peut arrêter plus tôt
      if (images.size > 20) break;
    }
    
  } catch (error) {
    console.error('❌ Erreur scraping générique:', error);
  }
  
  return Array.from(images);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  const startTime = Date.now();
  const { id: mangaId, chapterId } = await Promise.resolve(params);
  
  console.log(`🔍 Début du scraping pour le chapitre ${chapterId}`);

  try {
    // Vérifier les paramètres
    if (!mangaId || !chapterId) {
      return NextResponse.json(
        { error: 'ID du manga ou du chapitre manquant' },
        { status: 400 }
      );
    }

    // Récupérer les infos du chapitre
    const chapterResponse = await fetch(
      `https://api.mangadex.org/chapter/${chapterId}?includes[]=scanlation_group`
    );

    if (!chapterResponse.ok) {
      throw new Error('Chapitre non trouvé sur MangaDex');
    }

    const chapterData = await chapterResponse.json();
    const language = chapterData.data.attributes.translatedLanguage;
    console.log(`📚 Langue du chapitre: ${language}`);

    // Récupérer les infos du manga
    const mangaResponse = await fetch(
      `https://api.mangadex.org/manga/${mangaId}?includes[]=author`
    );

    if (!mangaResponse.ok) {
      throw new Error('Manga non trouvé sur MangaDex');
    }

    const mangaData = await mangaResponse.json();
    const mangaTitle = mangaData.data.attributes.title.en || 
                      mangaData.data.attributes.title.ja || 
                      Object.values(mangaData.data.attributes.title)[0];

    const mangaSlug = mangaTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .replace(/['']/g, '')
      .replace(/[éèê]/g, 'e')
      .replace(/[àâ]/g, 'a')
      .replace(/[ïî]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ûü]/g, 'u');

    const chapterNum = chapterData.data.attributes.chapter;

    // Lancer le navigateur
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Configurer la page
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Bloquer les ressources inutiles
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
          request.continue();
        } else {
          request.continue();
        }
      });

      // Trouver la bonne configuration
      const configs = SCRAPING_CONFIGS[language as keyof typeof SCRAPING_CONFIGS] || SCRAPING_CONFIGS['fr'];
      let images: string[] = [];
      let currentConfig: ScrapingConfig | null = null;

      // 1. D'abord essayer de récupérer les images depuis MangaDx directement
      console.log('📖 Tentative de récupération des images MangaDx...');
      images = await getMangaDexChapterImages(chapterId);
      
      if (images.length > 0) {
        console.log(`✅ ${images.length} images récupérées depuis MangaDx`);
        const scrapingTime = Date.now() - startTime;
        
        return NextResponse.json({
          title: `Chapitre ${chapterNum}`,
          chapter: chapterNum,
          language,
          mangaTitle: mangaSlug,
          pageCount: images.length,
          pages: images,
          source: 'mangadx-direct',
          scrapingTime: `${scrapingTime}ms`
        }, {
          headers: {
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 2. Si MangaDx échoue, essayer le scraping
      console.log('⚠️ MangaDx a échoué, tentative de scraping...');

      for (const config of configs) {
        const url = config.urlPattern(mangaSlug, chapterNum);
        console.log(`🌐 Tentative avec ${config.name}: ${url}`);

        try {
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
          const pageImages = await scrapeImages(page, config);
          
          if (pageImages.length > 0) {
            images = pageImages;
            currentConfig = config;
            break;
          }
        } catch (error) {
          console.error(`❌ Échec avec ${config.name}:`, error);
          continue;
        }
      }

      if (images.length === 0) {
        console.log('⚠️ Aucune image trouvée, utilisation d\'images de démonstration');
        // Images de démonstration pour tester l'interface
        const demoImages = [
          'https://via.placeholder.com/800x1200/f0f0f0/666666?text=Page+1',
          'https://via.placeholder.com/800x1200/e0e0e0/555555?text=Page+2', 
          'https://via.placeholder.com/800x1200/d0d0d0/444444?text=Page+3',
          'https://via.placeholder.com/800x1200/c0c0c0/333333?text=Page+4',
          'https://via.placeholder.com/800x1200/b0b0b0/222222?text=Page+5'
        ];
        
        const scrapingTime = Date.now() - startTime;
        console.log(`⚠️ Utilisation d'images de démonstration en ${scrapingTime}ms`);

        return NextResponse.json({
          title: `Chapitre ${chapterNum} (Démonstration)`,
          chapter: chapterNum,
          language,
          mangaTitle: 'Manga de démonstration',
          pageCount: demoImages.length,
          pages: demoImages,
          source: 'demo',
          scrapingTime: `${scrapingTime}ms`,
          warning: 'Images de démonstration - Le scraping a échoué'
        }, {
          headers: {
            'Cache-Control': 'public, max-age=300', // Cache plus court pour les démos
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Trier les images par ordre numérique
      images.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

      // Ajouter un proxy pour éviter les problèmes CORS
      const proxyImages = images.map(url => {
        // Si l'URL est déjà un proxy, la retourner telle quelle
        if (url.includes('wsrv.nl')) return url;
        
        // Sinon, ajouter le proxy wsrv.nl avec des paramètres optimisés
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp&maxage=30d`;
      });

      const scrapingTime = Date.now() - startTime;
      console.log(`✅ Scraping terminé en ${scrapingTime}ms`);

      return NextResponse.json({
        title: chapterData.data.attributes.title || '',
        chapter: chapterNum,
        language,
        mangaTitle,
        pageCount: images.length,
        pages: proxyImages,
        source: currentConfig?.name || 'unknown',
        scrapingTime: `${scrapingTime}ms`
      }, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
