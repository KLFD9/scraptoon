import puppeteer, { Page } from 'puppeteer';

interface DiagnosticResult {
  url: string;
  success: boolean;
  elements: {
    containers: Array<{ selector: string; found: number; html?: string }>;
    images: Array<{ selector: string; found: number; sources?: string[] }>;
  };
  pageInfo: {
    title: string;
    currentUrl: string;
    hasLazyLoading: boolean;
    totalImages: number;
  };
  errors: string[];
}

export async function diagnoseScrapingSelectors(
  testUrl: string,
  testSelectors: {
    containers: string[];
    images: string[];
  }
): Promise<DiagnosticResult> {
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
  const result: DiagnosticResult = {
    url: testUrl,
    success: false,
    elements: { containers: [], images: [] },
    pageInfo: { title: '', currentUrl: '', hasLazyLoading: false, totalImages: 0 },
    errors: []
  };

  try {
    console.log(`🔍 Diagnostic de ${testUrl}`);
    
    // Configuration de la page
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });

    // Navigation
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Informations de base
    result.pageInfo.title = await page.title();
    result.pageInfo.currentUrl = page.url();

    // Test des conteneurs
    for (const selector of testSelectors.containers) {
      try {
        const elements = await page.$$(selector);
        const html = elements.length > 0 ? await page.evaluate(
          (sel) => document.querySelector(sel)?.outerHTML?.substring(0, 200) + '...',
          selector
        ) : undefined;
        
        result.elements.containers.push({
          selector,
          found: elements.length,
          html
        });
      } catch (error) {
        result.errors.push(`Erreur conteneur "${selector}": ${error}`);
      }
    }

    // Test des images
    for (const selector of testSelectors.images) {
      try {
        const elements = await page.$$(selector);
        const sources = elements.length > 0 ? await page.evaluate(
          (sel) => Array.from(document.querySelectorAll(sel)).map((img: any) => 
            img.src || img.dataset?.url || img.dataset?.src || 'no-source'
          ).slice(0, 5),
          selector
        ) : [];

        result.elements.images.push({
          selector,
          found: elements.length,
          sources
        });
      } catch (error) {
        result.errors.push(`Erreur images "${selector}": ${error}`);
      }
    }

    // Détection du lazy loading
    result.pageInfo.hasLazyLoading = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.some(img => 
        img.hasAttribute('data-src') || 
        img.hasAttribute('data-url') || 
        img.hasAttribute('loading') ||
        img.classList.contains('lazy')
      );
    });

    // Compte total des images
    result.pageInfo.totalImages = await page.evaluate(() => 
      document.querySelectorAll('img').length
    );

    // Analyse de la structure DOM
    const domAnalysis = await page.evaluate(() => {
      const analysis: any = {};
      
      // Classes et IDs communs
      const commonClasses = ['img', 'image', 'page', 'chapter', 'reader', 'viewer', 'content'];
      const commonIds = ['images', 'pages', 'content', 'reader', 'viewer'];
      
      analysis.foundClasses = commonClasses.filter(cls => 
        document.querySelector(`.${cls}`)
      );
      
      analysis.foundIds = commonIds.filter(id => 
        document.querySelector(`#${id}`)
      );

      // Structure des images
      const allImgs = Array.from(document.querySelectorAll('img'));
      analysis.imagePatterns = {
        withDataUrl: allImgs.filter(img => img.hasAttribute('data-url')).length,
        withDataSrc: allImgs.filter(img => img.hasAttribute('data-src')).length,
        withSrc: allImgs.filter(img => img.src && img.src.startsWith('http')).length,
        withLazyClass: allImgs.filter(img => img.classList.contains('lazy')).length
      };

      return analysis;
    });

    result.pageInfo = { ...result.pageInfo, ...domAnalysis };

    result.success = result.elements.images.some(img => img.found > 0);

  } catch (error) {
    result.errors.push(`Erreur générale: ${error}`);
  } finally {
    await browser.close();
  }

  return result;
}

export async function generateOptimalSelectors(diagnosticResult: DiagnosticResult): Promise<{
  containers: string[];
  images: string[];
  recommendation: string;
}> {
  const containers = diagnosticResult.elements.containers
    .filter(c => c.found > 0)
    .sort((a, b) => b.found - a.found)
    .map(c => c.selector);

  const images = diagnosticResult.elements.images
    .filter(i => i.found > 0)
    .sort((a, b) => b.found - a.found)
    .map(i => i.selector);

  let recommendation = "Configuration recommandée:\n";
  
  if (containers.length > 0) {
    recommendation += `- Conteneur principal: ${containers[0]}\n`;
  }
  
  if (images.length > 0) {
    recommendation += `- Sélecteur d'images: ${images[0]}\n`;
  }

  if (diagnosticResult.pageInfo.hasLazyLoading) {
    recommendation += "- Lazy loading détecté, utiliser le scroll\n";
  }

  if (diagnosticResult.pageInfo.totalImages === 0) {
    recommendation += "- ATTENTION: Aucune image détectée sur cette page\n";
  }

  return { containers, images, recommendation };
}

// Fonction utilitaire pour tester plusieurs URLs
export async function batchDiagnose(testCases: Array<{
  name: string;
  url: string;
  expectedImages?: number;
}>): Promise<Array<DiagnosticResult & { name: string; expectedImages?: number }>> {
  const defaultSelectors = {
    containers: [
      '#_imageList', '.viewer_lst', '.img_viewer', '.viewer_img',
      '.reading-content', '.chapter-content', '#chapter-content',
      '#pages', '.img-responsive-container', '.page-container',
      '.reader-image-wrapper', '.manga-reader', '.chapter-container'
    ],
    images: [
      'img[data-url]', 'img[data-src]', 'img[src]',
      '#_imageList img', '.viewer_img img', '.reading-content img',
      '#pages img', '.page-container img', '.chapter-content img'
    ]
  };

  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await diagnoseScrapingSelectors(testCase.url, defaultSelectors);
      results.push({
        ...result,
        name: testCase.name,
        expectedImages: testCase.expectedImages
      });
      
      // Pause entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Erreur lors du diagnostic de ${testCase.name}:`, error);
      results.push({
        url: testCase.url,
        name: testCase.name,
        success: false,
        elements: { containers: [], images: [] },
        pageInfo: { title: '', currentUrl: '', hasLazyLoading: false, totalImages: 0 },
        errors: [String(error)],
        expectedImages: testCase.expectedImages
      });
    }
  }

  return results;
}
