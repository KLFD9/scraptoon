import { Source, ChaptersResult, ChapterData } from '@/app/types/source';
import { launchBrowser } from '@/app/utils/launchBrowser';
import { logger } from '@/app/utils/logger';

// Helper pour attendre un certain délai
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Navigateur réutilisé entre les appels
let browserPromise: Promise<any> | null = null;

async function getBrowser(): Promise<any> {
  if (!browserPromise) {
    browserPromise = launchBrowser({
      headless: true,
      args: ['--disable-features=VizDisplayCompositor'],
    });
  }
  return browserPromise;
}

// Configuration spécifique pour Toomics
export const toomicsSource: Source = {
  name: 'toomics',
  baseUrl: 'https://toomics.com',
  // Configuration pour le contenu adulte (à activer/désactiver selon les besoins)
  adultContent: true,
  
  search: async (title: string) => {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');

      // Construit l'URL de recherche
      const searchUrl = `${toomicsSource.baseUrl}/fr/webtoon/search?q=${encodeURIComponent(title)}`;
      logger.log('info', 'Recherche sur Toomics', { query: title });
      
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });
      await sleep(3000);

      // Gestion du popup (cookie consent ou autre) s'il apparaît
      try {
        const popupSelectors = [
          '.fc-button-confirm', 
          '.cookie-confirm', 
          '.consent-popup .confirm',
          'button.accept-all'
        ];
        
        for (const selector of popupSelectors) {
          const popup = await page.$(selector);
          if (popup) {
            await popup.click();
            await sleep(500);
            break;
          }
        }
      } catch (err) {
        logger.log('debug', 'Aucun popup à fermer sur Toomics', { error: String(err) });
      }

      // Si on veut accéder au contenu adulte, il faut peut-être confirmer l'âge
      if (toomicsSource.adultContent) {
        try {
          const ageConfirmSelectors = [
            '.btn-confirm', 
            '.age-verification-button',
            'button[contains(text(), "Oui")]',
            'button:contains("J\'ai plus de 18 ans")'
          ];
          
          for (const selector of ageConfirmSelectors) {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              await sleep(1000);
              break;
            }
          }
        } catch (err) {
          logger.log('debug', 'Pas de vérification d\'âge sur Toomics', { error: String(err) });
        }
      }      // Attente du chargement des résultats
      await page.waitForFunction(() => {
        return document.querySelector('.list-item') !== null || 
               document.querySelector('.search-item') !== null ||
               document.querySelector('.webtoon-item') !== null;
      }, { timeout: 10000 }).catch(() => {
        logger.log('info', 'Temps d\'attente des résultats dépassé sur Toomics');
      });      // Extraction des résultats
      const result = await page.evaluate((query: string) => {
        // Sélecteurs potentiels pour les éléments de résultat (peut varier selon le site)
        const selectors = [
          '.list-item', 
          '.search-item',
          '.webtoon-item',
          '.comic-item'
        ];
        
        let items: Element[] = [];
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            items = Array.from(elements);
            break;
          }
        }

        if (items.length === 0) return null;

        let bestMatch = null;
        let bestScore = 0;

        for (const item of items) {
          // Trouver l'élément du titre (peut être dans différentes balises)
          const titleSelectors = [
            '.title', 
            '.webtoon-title', 
            'h3', 
            '.item-title'
          ];
          
          let titleEl = null;
          for (const selector of titleSelectors) {
            const el = item.querySelector(selector);
            if (el) {
              titleEl = el;
              break;
            }
          }

          // Trouver l'élément du lien
          const linkSelectors = [
            'a', 
            '.item-link',
            '.webtoon-link'
          ];
          
          let link = null;
          for (const selector of linkSelectors) {
            const el = item.querySelector(selector);
            if (el) {
              link = el;
              break;
            }
          }

          if (titleEl && link) {
            const title = titleEl.textContent?.trim().toLowerCase() || '';
            const href = link.getAttribute('href') || '';
            
            // Extraire l'ID du titre à partir de l'URL (format peut varier)
            // Toomics utilise généralement un format comme /webtoon/episode/123
            const match = href.match(/\/webtoon\/[^\/]+\/(\d+)/);
            const titleId = match ? match[1] : null;

            if (titleId) {
              // Calculer la pertinence du résultat par rapport à la recherche
              const words1 = query.toLowerCase().split(' ');
              const words2 = title.split(' ');
              const commonWords = words1.filter(w => words2.includes(w));
              const score = commonWords.length / Math.max(words1.length, words2.length);

              if (score > bestScore) {
                bestScore = score;
                bestMatch = { 
                  titleId, 
                  url: href.startsWith('http') ? href : toomicsSource.baseUrl + href,
                  score,
                  title
                };
              }
            }
          }
        }

        return bestMatch;
      }, title);

      await page.close();      if (result && result.score > 0.3) {
        logger.log('info', 'Manga trouvé sur Toomics', { 
          query: title, 
          title: result.title
        });
        return { titleId: result.titleId, url: result.url };
      }

      logger.log('info', 'Manga non trouvé sur Toomics', { query: title });
      return { titleId: null, url: null };

    } catch (error) {
      logger.log('error', 'Erreur lors de la recherche sur Toomics', {
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
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');

      // Extraire l'URL de base du titre
      const baseUrl = url.includes('/episode/') 
        ? url.substring(0, url.lastIndexOf('/episode/'))
        : url;
      
      logger.log('info', 'Chargement de la liste des chapitres', { url: baseUrl });
      
      await page.goto(baseUrl, { waitUntil: 'networkidle0' });
      await sleep(2000);

      // Gestion des popups (comme dans la fonction search)
      try {
        const popupSelectors = [
          '.fc-button-confirm', 
          '.cookie-confirm', 
          '.consent-popup .confirm',
          'button.accept-all'
        ];
        
        for (const selector of popupSelectors) {
          const popup = await page.$(selector);
          if (popup) {
            await popup.click();
            await sleep(500);
            break;
          }
        }
      } catch (err) {
        logger.log('debug', 'Aucun popup à fermer sur Toomics', { error: String(err) });
      }

      // Gestion de la vérification d'âge pour contenu adulte
      if (toomicsSource.adultContent) {
        try {
          const ageConfirmSelectors = [
            '.btn-confirm', 
            '.age-verification-button',
            'button[contains(text(), "Oui")]',
            'button:contains("J\'ai plus de 18 ans")'
          ];
          
          for (const selector of ageConfirmSelectors) {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              await sleep(1000);
              break;
            }
          }
        } catch (err) {
          logger.log('debug', 'Pas de vérification d\'âge sur Toomics', { error: String(err) });
        }
      }

      // Attendre que la liste des chapitres se charge
      const chapterSelectors = [
        '.episode-list li', 
        '.chapter-list li', 
        '.toons-list li',
        '.episodes-container .episode-item'
      ];
      
      let chapterSelector = '';
      for (const selector of chapterSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          chapterSelector = selector;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!chapterSelector) {
        throw new Error('Impossible de trouver la liste des chapitres');
      }

      // Pagination : vérifier s'il y a plusieurs pages de chapitres
      const totalPages = await page.evaluate(() => {
        const pageElements = document.querySelectorAll('.pagination li a, .page-numbers, .paging a');
        const pages = Array.from(pageElements)
          .map(el => {
            const num = parseInt(el.textContent?.trim() || '0');
            return isNaN(num) ? 0 : num;
          })
          .filter(num => num > 0);
        return pages.length > 0 ? Math.max(...pages) : 1;
      });

      logger.log('info', 'Pages trouvées', { totalPages });

      const allChapters: ChapterData[] = [];

      // Récupérer les chapitres page par page
      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        if (currentPage > 1) {
          // Construire l'URL de la page suivante (le format peut varier)
          const pageUrl = `${baseUrl}?page=${currentPage}`;
          logger.log('info', 'Chargement de la page', { page: currentPage, totalPages });
          
          await page.goto(pageUrl, { waitUntil: 'networkidle0' });
          await sleep(2000);
        }        // Extraire les informations des chapitres sur la page courante
        const chaptersOnPage = await page.evaluate((selector: string) => {
          const items = document.querySelectorAll(selector);
          return Array.from(items).map(item => {
            // Trouver le lien
            const link = item.querySelector('a');
            const href = link?.getAttribute('href') || '';
            
            // Extraire le numéro du chapitre
            const episodeMatch = href.match(/episode\/(\d+)/);
            const episodeNumber = episodeMatch ? episodeMatch[1] : '';

            // Identifier le chapitre
            const idMatch = href.match(/episode\/(\d+)/);
            const id = idMatch ? idMatch[1] : '';

            // Extraire le titre du chapitre
            const titleSelectors = [
              '.episode-title', 
              '.chapter-title', 
              '.title'
            ];
            
            let titleElement = null;
            for (const sel of titleSelectors) {
              const el = item.querySelector(sel);
              if (el) {
                titleElement = el;
                break;
              }
            }
            
            // Extraire la date de publication
            const dateSelectors = [
              '.date', 
              '.episode-date', 
              '.chapter-date',
              '.published-date'
            ];
            
            let dateElement = null;
            for (const sel of dateSelectors) {
              const el = item.querySelector(sel);
              if (el) {
                dateElement = el;
                break;
              }
            }
            
            const fullTitle = titleElement?.textContent?.trim() || '';
            const publishedAt = dateElement?.textContent?.trim() || null;

            return {
              id,
              chapter: `Episode ${episodeNumber}`,
              title: fullTitle || null,
              publishedAt,
              url: href.startsWith('http') ? href : `https://toomics.com${href}`,
              source: 'toomics'
            };
          });
        }, chapterSelector);

        allChapters.push(...chaptersOnPage);
        logger.log('info', 'Chapitres trouvés sur la page', { 
          page: currentPage, 
          count: chaptersOnPage.length 
        });
      }

      await page.close();
      logger.log('info', 'Total des chapitres trouvés', { count: allChapters.length });

      return {
        chapters: allChapters.reverse(), // Plus récent en premier
        totalChapters: allChapters.length,
        source: {
          name: 'toomics',
          url: baseUrl,
          titleId: titleId
        }
      };

    } catch (error) {
      logger.log('error', 'Erreur lors du scraping des chapitres sur Toomics', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }
};

export default toomicsSource;
