import { Agent, setGlobalDispatcher, fetch as undiciFetch } from 'undici';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';
import type { Manga } from '../types/manga';
import { toomicsSource } from './sources';
import { launchBrowser } from '../utils/launchBrowser';

interface MangaDexEntry {
  id: string;
  attributes?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    status?: string;
    originalLanguage?: string;
    lastChapter?: string;
  };
  relationships?: Array<{
    type: string;
    attributes?: { fileName?: string };
  }>;
}

const concurrentSources = parseInt(process.env.CONCURRENT_SOURCES || '2', 10);
const concurrentPages = parseInt(process.env.CONCURRENT_PAGES || '6', 10);

const agent = new Agent({
  keepAliveTimeout: 30000,
  keepAliveMaxTimeout: 60000,
  connections: concurrentPages,
});
setGlobalDispatcher(agent);

async function secureFetch(url: string) {
  if (!url.startsWith('https://')) {
    throw new Error('Only HTTPS requests are allowed');
  }
  return retry(() => undiciFetch(url, { dispatcher: agent }), 3, 1000);
}

async function searchMangaDex(query: string): Promise<Manga[]> {
  const params = new URLSearchParams({
    title: query,
    limit: '20',
  });
  params.append('includes[]', 'cover_art');
  const res = await secureFetch(`https://api.mangadex.org/manga?${params.toString()}`);
  if (!res.ok) {
    logger.log('error', 'MangaDex search failed', { status: res.status });
    return [];
  }
  const data = await res.json();
  return (data.data || []).map((m: MangaDexEntry) => {
    const cover = m.relationships?.find(r => r.type === 'cover_art');
    const coverUrl = cover ? `https://uploads.mangadex.org/covers/${m.id}/${cover.attributes.fileName}` : '';
    const title = m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Untitled';
    return {
      id: m.id,
      title,
      description: m.attributes?.description?.en || '',
      cover: coverUrl,
      url: `https://mangadex.org/title/${m.id}`,
      type: m.attributes?.originalLanguage === 'ko' ? 'manhwa' : m.attributes?.originalLanguage === 'zh' ? 'manhua' : 'manga',
      status: m.attributes?.status === 'ongoing' ? 'ongoing' : 'completed',
      lastChapter: m.attributes?.lastChapter || '?',
      chapterCount: {
        french: 0,
        total: parseInt(m.attributes?.lastChapter || '0') || 0,
      },
    } as Manga;
  });
}

async function searchKitsu(query: string): Promise<Manga[]> {
  const url = `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(query)}`;
  const res = await secureFetch(url);
  if (!res.ok) {
    logger.log('error', 'Kitsu search failed', { status: res.status });
    return [];
  }
  const data = await res.json();
  return (data.data || []).map((m: { id: string; attributes?: Record<string, unknown> }) => {
    const attr = m.attributes || {};
    return {
      id: `kitsu-${m.id}`,
      title: attr.canonicalTitle || 'Untitled',
      description: attr.synopsis || '',
      cover: attr.posterImage?.original || '',
      url: `https://kitsu.io/manga/${m.id}`,
      type: 'manga',
      status: attr.status === 'current' ? 'ongoing' : 'completed',
      lastChapter: attr.chapterCount ? String(attr.chapterCount) : '?',
      chapterCount: {
        french: 0,
        total: attr.chapterCount || 0,
      },
    } as Manga;
  });
}

async function searchKomga(query: string): Promise<Manga[]> {
  if (!process.env.KOMGA_URL) return [];
  const url = `${process.env.KOMGA_URL.replace(/\/$/, '')}/api/v1/series?search=${encodeURIComponent(query)}`;
  const res = await secureFetch(url);
  if (!res.ok) {
    logger.log('error', 'Komga search failed', { status: res.status });
    return [];
  }
  const data = await res.json();
  return (data.content || []).map((s: { id: string; name: string; metadata?: Record<string, unknown>; booksCount?: number }) => {
    return {
      id: `komga-${s.id}`,
      title: s.metadata?.title || s.name,
      description: s.metadata?.summary || '',
      cover: '',
      url: `${process.env.KOMGA_URL}/series/${s.id}`,
      type: 'manga',
      status: 'ongoing',
      lastChapter: String(s.booksCount || '?'),
      chapterCount: {
        french: 0,
        total: s.booksCount || 0,
      },
    } as Manga;
  });
}

async function searchToomics(query: string): Promise<Manga[]> {
  try {
    // Utiliser notre source Toomics déjà configurée
    const result = await toomicsSource.search(query);
    
    if (!result.titleId || !result.url) {
      return [];
    }

    // Récupérer les détails du manga
    const baseUrl = result.url;
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
    
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Gérer les éventuels popups de consentement ou vérification d'âge
      try {
        await page.evaluate(() => {
          const consentButtons = document.querySelectorAll('.cookie-confirm, .consent-popup .confirm, button.accept-all');
          if (consentButtons.length > 0) {
            (consentButtons[0] as HTMLElement).click();
          }
          
          const ageButtons = document.querySelectorAll('.btn-confirm, .age-verification-button');
          if (ageButtons.length > 0) {
            (ageButtons[0] as HTMLElement).click();
          }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        // Ignorer les erreurs liées aux popups
      }

      // Extraire les métadonnées du manga
      const mangaData = await page.evaluate(() => {
        const title = document.querySelector('.series-title, .comic-title, h1')?.textContent?.trim() || '';
        const description = document.querySelector('.series-desc, .summary, .description')?.textContent?.trim() || '';
        const cover = document.querySelector('.series-cover img, .comic-cover img')?.getAttribute('src') || '';
        const status = document.querySelector('.series-status, .status')?.textContent?.toLowerCase().includes('ongoing') ? 'ongoing' : 'completed';
        const typeEl = document.querySelector('.series-type, .comic-type, .genre');
        const typeText = typeEl?.textContent?.toLowerCase() || '';
        
        let type = 'manga';
        if (typeText.includes('manhwa') || typeText.includes('korean')) {
          type = 'manhwa';
        } else if (typeText.includes('manhua') || typeText.includes('chinese')) {
          type = 'manhua';
        }
        
        return { title, description, cover, status, type };
      });

      await page.close();
      
      // Créer l'objet manga
      const mangaType = (mangaData.type === 'manhwa' || mangaData.type === 'manhua') 
        ? mangaData.type 
        : 'manga';
        
      const mangaStatus = mangaData.status === 'ongoing' ? 'ongoing' : 'completed';
        return [{
        id: `toomics-${result.titleId}`,
        title: mangaData.title,
        description: mangaData.description,
        cover: mangaData.cover,
        url: baseUrl,
        type: mangaType,
        status: mangaStatus,
        lastChapter: '?',
        chapterCount: {
          french: 0,
          total: 0
        }
      }];
      
    } catch (error) {
      logger.log('error', 'Toomics data extraction failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        query 
      });
      await page.close();
      return [];
    }
  } catch (error) {
    logger.log('error', 'Toomics search failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      query 
    });
    return [];
  }
}

export async function searchMultiSource(query: string): Promise<Manga[]> {
  // Ajouter Toomics à la liste des sources
  const sources = [searchMangaDex, searchKitsu, searchKomga, searchToomics];
  const results: Manga[] = [];
  for (let i = 0; i < sources.length; i += concurrentSources) {
    const slice = sources.slice(i, i + concurrentSources);
    const responses = await Promise.allSettled(slice.map(fn => fn(query)));
    for (const r of responses) {
      if (r.status === 'fulfilled') {
        results.push(...r.value);
      }
    }
    if (results.length) break;
  }
  return results;
}
