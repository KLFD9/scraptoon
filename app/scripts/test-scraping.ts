import { batchDiagnose, generateOptimalSelectors, type DiagnosticResult } from '../utils/scraping-diagnostics';
import { logger } from '../utils/logger';

async function testScrapingConfigs() {
  console.log('🔍 Diagnostic des configurations de scraping...\n');

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
      console.log(`\n📊 === ${result.name} ===`);
      console.log(`🌐 URL: ${result.url}`);
      console.log(`✅ Succès: ${result.success ? 'OUI' : 'NON'}`);
      console.log(`📄 Titre: ${result.pageInfo.title}`);
      console.log(`🖼️  Images totales trouvées: ${result.pageInfo.totalImages}`);
      console.log(`⏳ Lazy loading: ${result.pageInfo.hasLazyLoading ? 'OUI' : 'NON'}`);

      if (result.errors.length > 0) {
        console.log(`❌ Erreurs: ${result.errors.join(', ')}`);
      }

      // Conteneurs fonctionnels
      const workingContainers = result.elements.containers.filter(c => c.found > 0);
      if (workingContainers.length > 0) {
        console.log('\n📦 Conteneurs fonctionnels:');
        workingContainers.forEach(c => {
          console.log(`  - ${c.selector}: ${c.found} éléments`);
          if (c.html) {
            console.log(`    HTML: ${c.html.substring(0, 100)}...`);
          }
        });
      }

      // Images fonctionnelles
      const workingImages = result.elements.images.filter(i => i.found > 0);
      if (workingImages.length > 0) {
        console.log('\n🖼️ Sélecteurs d\'images fonctionnels:');
        workingImages.forEach(i => {
          console.log(`  - ${i.selector}: ${i.found} images`);
          if (i.sources && i.sources.length > 0) {
            console.log(`    Sources: ${i.sources.slice(0, 3).join(', ')}...`);
          }
        });
      }

      // Génération des sélecteurs optimaux
      const optimal = await generateOptimalSelectors(result);
      console.log('\n💡 Recommandations:');
      console.log(optimal.recommendation);

      console.log('\n' + '='.repeat(80));
    }

    // Génération d'une nouvelle configuration basée sur les résultats
    console.log('\n🔧 Configuration mise à jour recommandée:');
    generateUpdatedConfig(results);

  } catch (error) {
    logger.log('error', 'diagnostic run error', { error: String(error) });
  }
}

type DiagnosticTestResult = DiagnosticResult & { name: string; expectedImages?: number };

function generateUpdatedConfig(results: DiagnosticTestResult[]) {
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    console.log('❌ Aucune configuration fonctionnelle trouvée');
    return;
  }

  console.log('\nConst SCRAPING_CONFIGS_UPDATED = {');
  
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
      console.log(`  // ${result.name}`);
      console.log(`  '${result.name.toLowerCase().replace(/\s+/g, '-')}': {`);
      console.log(`    container: '${workingContainers.join(', ')}',`);
      console.log(`    images: [${workingImages.map(s => `'${s}'`).join(', ')}],`);
      console.log(`    lazyLoad: ${result.pageInfo.hasLazyLoading},`);
      console.log(`    // Trouvé ${result.pageInfo.totalImages} images`);
      console.log(`  },`);
    }
  }
  
  console.log('};');
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
