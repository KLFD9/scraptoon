import { NextRequest, NextResponse } from 'next/server';
import { diagnoseScrapingSelectors } from '../../utils/scraping-diagnostics';
import { logger } from '../../utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { url, selectors } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 });
    }

    const defaultSelectors = selectors || {
      containers: [
        '#_imageList', '.viewer_lst', '.img_viewer', '.viewer_img',
        '.reading-content', '.chapter-content', '#chapter-content',
        '#pages', '.img-responsive-container', '.page-container',
        '.reader-image-wrapper', '.manga-reader', '.chapter-container',
        '.webtoon-episode__canvas', '.episode_cont', '.view_area'
      ],
      images: [
        'img[data-url]', 'img[data-src]', 'img[src]',
        '#_imageList img', '.viewer_img img', '.reading-content img',
        '#pages img', '.page-container img', '.chapter-content img',
        '.webtoon-episode__canvas img', '.episode_cont img'
      ]
    };

    console.log(`🔍 Test de diagnostic pour: ${url}`);
    const result = await diagnoseScrapingSelectors(url, defaultSelectors);

    // Simplifier le résultat pour l'API
    const response = {
      url: result.url,
      success: result.success,
      pageInfo: result.pageInfo,
      workingSelectors: {
        containers: result.elements.containers
          .filter(c => c.found > 0)
          .map(c => ({ selector: c.selector, count: c.found })),
        images: result.elements.images
          .filter(i => i.found > 0)
          .map(i => ({ selector: i.selector, count: i.found, samples: i.sources?.slice(0, 3) }))
      },
      errors: result.errors,
      recommendations: {
        bestContainer: result.elements.containers
          .filter(c => c.found > 0)
          .sort((a, b) => b.found - a.found)[0]?.selector,
        bestImageSelector: result.elements.images
          .filter(i => i.found > 0)
          .sort((a, b) => b.found - a.found)[0]?.selector,
        hasLazyLoading: result.pageInfo.hasLazyLoading,
        totalImages: result.pageInfo.totalImages
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.log('error', 'diagnostic api error', { error: String(error) });
    return NextResponse.json(
      { error: 'Erreur lors du diagnostic', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de diagnostic de scraping',
    usage: {
      method: 'POST',
      body: {
        url: 'URL à tester',
        selectors: {
          containers: ['sélecteurs CSS pour les conteneurs'],
          images: ['sélecteurs CSS pour les images']
        }
      }
    },
    examples: [
      {
        url: 'https://www.webtoons.com/fr/fantasy/The-Lone-Necromancer/episode-177/viewer?title_no=3517'
      },
      {
        url: 'https://reaper-scans.fr/manga/the-lone-necromancer/chapitre-177/'
      }
    ]
  });
}
