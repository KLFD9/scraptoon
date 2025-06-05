import { NextResponse } from 'next/server';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import { httpRequest } from '@/app/utils/httpClient';
import { browserPool } from '@/app/utils/browserPool';
import { withErrorHandling } from '@/app/utils/errorHandler';

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
        container: '#_imageList',
        images: [
          '#_imageList img[data-url]',
          '.viewer_img img[data-url]',
          '.viewer_lst img[data-url]',
          '#_imageList img',
          '.viewer_img img',
          '.viewer_lst img'
        ],
        lazyLoad: {
          attribute: 'data-url',
          scrollStep: 1000,
          maxScrolls: 50,
          beforeScroll: async (page: Page) => {
            await page.evaluate(() => {
              // Forcer le chargement des images
              document.querySelectorAll('img[data-url]').forEach((img: any) => {
                if (img.dataset.url && !img.src) {
                  img.src = img.dataset.url;
                }
              });
            });
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
    },
    {
      name: 'reaper-scans',
      urlPattern: (slug: string, chapter: string) => 
        `https://reaper-scans.fr/manga/${slug}/chapitre-${chapter}/`,
      selectors: {
        container: '.reading-content',
        images: [
          'img.wp-manga-chapter-img[src*="reaper-scans"]',
          'img.wp-manga-chapter-img[data-src*="reaper-scans"]',
          '.reading-content img[src*="reaper-scans"]',
          '.reading-content img[data-src*="reaper-scans"]',
          '.wp-manga-chapter-img',
          'div.page-break img',
          '.reading-content img'
        ],
        lazyLoad: {
          attribute: 'data-src',
          scrollStep: 500,
          maxScrolls: 50,
          beforeScroll: async (page: Page) => {
            await page.evaluate(() => {
              // Supprimer les éléments qui pourraient interférer
              const elementsToRemove = document.querySelectorAll('.c-ads, .site-header, .c-sidebar');
              elementsToRemove.forEach(el => el.remove());
              
              // Forcer le chargement des images
              document.querySelectorAll('img[data-src]').forEach((img: any) => {
                if (img.dataset.src && !img.src) {
                  img.src = img.dataset.src;
                }
              });
            });
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
    }
  ]
};

async function scrapeImages(page: Page, config: ScrapingConfig): Promise<string[]> {
  const images = new Map<string, string>();
  console.log(`📝 Début du scraping avec la configuration ${config.name}`);

  try {
    // Attendre le chargement initial
    await page.waitForSelector(config.selectors.container, { timeout: 30000 });
    console.log('✅ Page chargée, début du scraping');
    
    // Désactiver les animations
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '* { scroll-behavior: auto !important; transition: none !important; }';
      document.head.appendChild(style);
    });

    if (config.name === 'webtoons') {
      // Méthode spécifique pour Webtoons
      console.log('🔄 Scraping des images Webtoons');
      
      // Attendre que les images soient chargées
      await page.waitForSelector('img[data-url]', { timeout: 10000 });
      
      // Récupérer toutes les URLs d'images
      const urls = await page.evaluate(() => {
        const images = document.querySelectorAll('img[data-url]');
        return Array.from(images).map(img => img.getAttribute('data-url')).filter(url => url);
      });
      
      urls.forEach(url => {
        if (url) images.set(url, url);
      });
      
    } else {
      // Méthode générique pour les autres sites
      console.log('🔄 Scroll progressif');
      for (let i = 0; i <= 10; i++) {
        await page.evaluate((percent) => {
          window.scrollTo(0, document.body.scrollHeight * (percent / 10));
        }, i);
        
        // Attendre et forcer le chargement des images
        await page.evaluate(() => {
          document.querySelectorAll('img[data-src]').forEach((img: any) => {
            if (img.dataset.src && !img.src) {
              img.src = img.dataset.src;
            }
          });
        });
        
        await new Promise(r => setTimeout(r, 2000));

        // Récupérer les images à chaque étape
        const currentUrls = await page.evaluate((selectors) => {
          const urls = new Set<string>();
          selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(img => {
              const src = img.getAttribute('src');
              const dataSrc = img.getAttribute('data-src');
              if (src && !src.startsWith('data:')) urls.add(src);
              if (dataSrc && !dataSrc.startsWith('data:')) urls.add(dataSrc);
            });
          });
          return Array.from(urls);
        }, config.selectors.images);

        currentUrls.forEach(url => {
          if (url.includes('reaper-scans.fr') || url.includes('/uploads/')) {
            images.set(url, url);
          }
        });

        console.log(`📊 Étape ${i}: ${images.size} images trouvées`);
      }
    }

    const imageUrls = Array.from(images.values());
    console.log(`✅ Total des images trouvées: ${imageUrls.length}`);
    return imageUrls;

  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error);
    return [];
  }
}

export const GET = withErrorHandling(async (
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) => {
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
    const chapterResponse = await httpRequest(
      `https://api.mangadex.org/chapter/${chapterId}?includes[]=scanlation_group`,
      undefined,
      'mangadex'
    );

    if (!chapterResponse.ok) {
      throw new Error('Chapitre non trouvé sur MangaDex');
    }

    const chapterData = await chapterResponse.json();
    const language = chapterData.data.attributes.translatedLanguage;
    console.log(`📚 Langue du chapitre: ${language}`);

    // Récupérer les infos du manga
    const mangaResponse = await httpRequest(
      `https://api.mangadex.org/manga/${mangaId}?includes[]=author`,
      undefined,
      'mangadex'
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

    // Lancer le navigateur depuis le pool
    const browser = await browserPool.getBrowser();
    let page = await browser.newPage();

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
        throw new Error('Aucune image trouvée');
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
      await page.close();
      browserPool.release(browser);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
});
