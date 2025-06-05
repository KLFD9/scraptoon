import { chromium, Browser, Page } from 'playwright';

// Script pour analyser la structure DOM de vrais sites de manga
export class SiteAnalyzer {
  private browser?: Browser;
  
  async init() {
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async analyzeWebtoons() {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const page = await this.browser.newPage();
    
    try {
      // Tester une vraie URL de Webtoons
      console.log('🔍 Analyse de Webtoons...');
      await page.goto('https://www.webtoons.com/fr/fantasy/tower-of-god/saison-1-episode-1/viewer?title_no=95&episode_no=1', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Attendre que la page se charge
      await page.waitForTimeout(3000);

      // Analyser la structure DOM
      const analysis = await page.evaluate(() => {
        const selectors = [
          '#_imageList',
          '.viewer_lst',
          '.img_viewer',
          '.viewer_img',
          '#viewer',
          '.episode_viewer',
          '.viewer_container'
        ];

        const results: any = {
          foundContainers: [],
          images: [],
          imageStructure: {}
        };

        // Chercher les conteneurs d'images
        selectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            results.foundContainers.push({
              selector,
              exists: true,
              children: element.children.length,
              innerHTML: element.innerHTML.substring(0, 200) + '...'
            });
          }
        });

        // Chercher toutes les images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (index < 10) { // Limiter à 10 images pour l'analyse
            results.images.push({
              src: img.src,
              dataSrc: img.getAttribute('data-src'),
              dataUrl: img.getAttribute('data-url'),
              className: img.className,
              parent: img.parentElement?.tagName + '.' + img.parentElement?.className
            });
          }
        });

        return results;
      });

      console.log('📊 Analyse Webtoons:', JSON.stringify(analysis, null, 2));
      return analysis;

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse Webtoons:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  async analyzeReaperScans() {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const page = await this.browser.newPage();
    
    try {
      console.log('🔍 Analyse de Reaper-Scans...');
      await page.goto('https://reaperscans.fr/manga/solo-leveling/chapter-1/', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(3000);

      const analysis = await page.evaluate(() => {
        const selectors = [
          '.reading-content',
          '.chapter-content',
          '#chapter-content',
          '.reader-content',
          '.manga-reader',
          '.chapter-reader'
        ];

        const results: any = {
          foundContainers: [],
          images: [],
          imageStructure: {}
        };

        selectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            results.foundContainers.push({
              selector,
              exists: true,
              children: element.children.length,
              innerHTML: element.innerHTML.substring(0, 200) + '...'
            });
          }
        });

        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (index < 10) {
            results.images.push({
              src: img.src,
              dataSrc: img.getAttribute('data-src'),
              dataUrl: img.getAttribute('data-url'),
              className: img.className,
              parent: img.parentElement?.tagName + '.' + img.parentElement?.className
            });
          }
        });

        return results;
      });

      console.log('📊 Analyse Reaper-Scans:', JSON.stringify(analysis, null, 2));
      return analysis;

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse Reaper-Scans:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Script principal
async function main() {
  const analyzer = new SiteAnalyzer();
  
  try {
    await analyzer.init();
    
    console.log('🚀 Démarrage de l\'analyse des sites...\n');
    
    // Analyser Webtoons
    const webtoonAnalysis = await analyzer.analyzeWebtoons();
    
    // Attendre un peu entre les analyses
    await new Promise(r => setTimeout(r, 2000));
    
    // Analyser Reaper-Scans
    const reaperAnalysis = await analyzer.analyzeReaperScans();
    
    console.log('\n✅ Analyse terminée !');
    
    // Générer des recommandations
    console.log('\n💡 Recommandations pour les sélecteurs :');
    
    if (webtoonAnalysis?.foundContainers.length > 0) {
      console.log('\nWebtoons - Conteneurs trouvés:');
      webtoonAnalysis.foundContainers.forEach((container: any) => {
        console.log(`  - ${container.selector} (${container.children} enfants)`);
      });
    }
    
    if (reaperAnalysis?.foundContainers.length > 0) {
      console.log('\nReaper-Scans - Conteneurs trouvés:');
      reaperAnalysis.foundContainers.forEach((container: any) => {
        console.log(`  - ${container.selector} (${container.children} enfants)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await analyzer.close();
  }
}

if (require.main === module) {
  main();
}

export default main;
