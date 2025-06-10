import { batchDiagnose, generateOptimalSelectors, type DiagnosticResult } from '../utils/scraping-diagnostics';
import { logger } from '../utils/logger';

async function testScrapingConfigs() {
  logger.log('info', 'starting scraping diagnostics');

  const testCases = [
    {
      name: 'Webtoons FR - The Lone Necromancer',
      url: 'https://www.webtoons.com/fr/fantasy/The-Lone-Necromancer/episode-177/viewer?title_no=3517',
      expectedImages: 10
    },
    {
      name: 'Reaper Scans - The Lone Necromancer',
      url: 'https://reaper-scans.fr/manga/the-lone-necromancer/chapitre-177/',
      expectedImages: 15
    },
    {
      name: 'Scan Manga - Test générique',
      url: 'https://scan-manga.com/',
      expectedImages: 0
    }
  ];

  try {
    const results = await batchDiagnose(testCases);

    for (const result of results) {
      logger.log('info', `diagnostic result ${result.name}`, {
        url: result.url,
        success: result.success,
        title: result.pageInfo.title,
        totalImages: result.pageInfo.totalImages,
        lazy: result.pageInfo.hasLazyLoading
      });

      if (result.errors.length > 0) {
        logger.log('warning', 'diagnostic errors', {
          errors: result.errors,
          url: result.url
        });
      }

      // Conteneurs fonctionnels
      const workingContainers = result.elements.containers.filter(c => c.found > 0);
      if (workingContainers.length > 0) {
        logger.log('info', 'working containers');
        workingContainers.forEach(c => {
          logger.log('info', 'container details', { selector: c.selector, found: c.found });
          if (c.html) {
            logger.log('info', 'container html sample', { html: c.html.substring(0, 100) });
          }
        });
      }

      // Images fonctionnelles
      const workingImages = result.elements.images.filter(i => i.found > 0);
      if (workingImages.length > 0) {
        logger.log('info', 'working image selectors');
        workingImages.forEach(i => {
          logger.log('info', 'image selector details', { selector: i.selector, found: i.found });
          if (i.sources && i.sources.length > 0) {
            logger.log('info', 'image sources sample', { sources: i.sources.slice(0, 3) });
          }
        });
      }

      // Génération des sélecteurs optimaux
      const optimal = await generateOptimalSelectors(result);
      logger.log('info', 'recommendations', { text: optimal.recommendation });

      logger.log('info', 'end of result');
    }

    // Génération d'une nouvelle configuration basée sur les résultats
    logger.log('info', 'updated configuration recommended');
    generateUpdatedConfig(results);

  } catch (error) {
    logger.log('error', 'diagnostic run error', { error: String(error) });
  }
}

type DiagnosticTestResult = DiagnosticResult & { name: string; expectedImages?: number };

function generateUpdatedConfig(results: DiagnosticTestResult[]) {
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    logger.log('warning', 'no functional configuration found');
    return;
  }

  logger.log('info', 'SCRAPING_CONFIGS_UPDATED start');
  
  for (const result of successfulResults) {
    const workingContainers = result.elements.containers
      .filter(c => c.found > 0)
      .map(c => c.selector)
      .slice(0, 3);
    
    const workingImages = result.elements.images
      .filter(i => i.found > 0)
      .map(i => i.selector)
      .slice(0, 5);

    if (workingContainers.length > 0 && workingImages.length > 0) {
      logger.log('info', 'scraping config snippet', {
        name: result.name,
        container: workingContainers.join(', '),
        images: workingImages,
        lazyLoad: result.pageInfo.hasLazyLoading,
        totalImages: result.pageInfo.totalImages
      });
    }
  }
  
  logger.log('info', 'SCRAPING_CONFIGS_UPDATED end');
}

// Execution si lancé directement
if (require.main === module) {
  testScrapingConfigs().catch(error =>
    logger.log('error', 'Unhandled error in testScrapingConfigs', {
      error: String(error)
    })
  );
}

export { testScrapingConfigs };
