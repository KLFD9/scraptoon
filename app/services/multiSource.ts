import { Agent, setGlobalDispatcher, fetch as undiciFetch } from 'undici';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';
import type { Manga } from '../types/manga';
import type { MangaDexSearchResponse, MangaDexManga, MangaDexRelationship, MangaDexTag } from '../types/mangadex';
import { toomicsSource, mangakakalotSource } from './sources';
import { launchBrowser } from '../utils/launchBrowser';

interface KitsuMangaAttributes {
  canonicalTitle?: string;
  synopsis?: string;
  posterImage?: { original?: string };
  status?: string;
  chapterCount?: number;
  averageRating?: string;
  startDate?: string;
  ageRatingGuide?: string;
  mangaType?: string;
  categories?: { data: Array<{ attributes: { title: string } }> };
  authors?: { data: Array<{ attributes: { name: string } }> };
}

interface KomgaSeries {
  id: string;
  name: string;
  metadata?: {
    title?: string;
    summary?: string;
    status?: string;
    publisher?: string;
    ageRating?: number;
    publicationDate?: string;
    genres?: string[];
    authors?: Array<{ name: string; role: string }>;
  };
  booksCount?: number;
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
  params.append('order[relevance]', 'desc');
  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'artist');
  params.append('includes[]', 'author');

  const res = await secureFetch(`https://api.mangadex.org/manga?${params.toString()}`);
  if (!res.ok) {
    logger.log('error', 'MangaDex search failed', { status: res.status, query, response: await res.text() });
    return [];
  }
  const data = (await res.json()) as MangaDexSearchResponse;
  return (data.data || []).map((m: MangaDexManga) => {
    const coverRel = m.relationships?.find(r => r.type === 'cover_art');
    const coverUrl = coverRel?.attributes?.fileName
      ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes.fileName}`
      : '';
    const title = m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Untitled';
    
    const authorRel = m.relationships?.find(r => r.type === 'author');
    const artistRel = m.relationships?.find(r => r.type === 'artist');

    const genres = m.attributes?.tags?.map((tag: MangaDexTag) => tag.name.en) || [];

    return {
      id: m.id,
      mangadexId: m.id,
      title,
      description: m.attributes?.description?.en || Object.values(m.attributes?.description || {})[0] || '',
      cover: coverUrl, // Changed from coverImage
      coverImage: coverUrl, // Keep for compatibility if used elsewhere, but `cover` is primary
      url: `/manga/${m.id}`, // Added required property
      source: 'MangaDex',
      genres,
      author: authorRel?.attributes?.name || 'N/A',
      artist: artistRel?.attributes?.name || 'N/A',
      status: (m.attributes?.status || 'unknown') as 'ongoing' | 'completed', // Type assertion
      year: m.attributes?.year ? String(parseInt(m.attributes.year)) : undefined,
      originalLanguage: m.attributes?.originalLanguage || 'unknown',
      lastChapter: m.attributes?.lastChapter || '?',
      chapterCount: { french: 0, total: 0 }, // Added required property with default
      type: (m.attributes.originalLanguage === 'ja' ? 'manga' : 'manhwa') as 'manga' | 'manhwa' | 'manhua', // Added required property with basic logic
      contentRating: m.attributes?.contentRating || 'unknown',
      // publicationDemographic: m.attributes?.publicationDemographic || undefined, // Removed, not in MangaDexManga attributes
      tags: m.attributes?.tags,
    } as unknown as Manga; // Use unknown first for type conversion
  });
}

async function searchKitsu(query: string): Promise<Manga[]> {
  const url = `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(query)}&page[limit]=20&include=categories`;
  const res = await secureFetch(url);
  if (!res.ok) {
    logger.log('error', 'Kitsu search failed', { status: res.status, query, response: await res.text() });
    return [];
  }
  const kitsuResponse = (await res.json()) as { data?: Array<{ id: string; attributes?: KitsuMangaAttributes; relationships?: any }>, included?: Array<any> };
  
  const includedData = new Map(kitsuResponse.included?.map(item => [item.id, item.attributes]));

  return (kitsuResponse.data || []).map((m) => {
    const attr = m.attributes || {};
    const rels = m.relationships || {};

    const genres = rels.categories?.data?.map((cat: any) => includedData.get(cat.id)?.title).filter(Boolean) || [];
    const authors = rels.authors?.data?.map((auth: any) => includedData.get(auth.id)?.name).filter(Boolean) || [];

    return {
      id: `kitsu-${m.id}`,
      mangadexId: undefined,
      title: attr.canonicalTitle || 'Untitled',
      description: attr.synopsis || '',
      cover: attr.posterImage?.original || '', // Changed from coverImage
      coverImage: attr.posterImage?.original || '', // Keep for compatibility
      url: `/manga/kitsu-${m.id}`, // Added required property
      source: 'Kitsu',
      genres,
      author: authors[0] || 'N/A',
      artist: authors.slice(1).join(', ') || (authors.length > 1 ? 'N/A' : authors[0] || 'N/A'),
      status: (attr.status === 'current' ? 'ongoing' : (attr.status === 'finished' ? 'completed' : 'unknown')) as 'ongoing' | 'completed', // Type assertion
      year: attr.startDate ? String(new Date(attr.startDate).getFullYear()) : undefined,
      originalLanguage: undefined,
      lastChapter: attr.chapterCount ? String(attr.chapterCount) : '?',
      chapterCount: { french: 0, total: attr.chapterCount || 0 }, // Added required property
      type: (attr.mangaType || 'manga') as 'manga' | 'manhwa' | 'manhua', // Added required property
      contentRating: attr.ageRatingGuide || undefined,
      rating: attr.averageRating ? parseFloat(attr.averageRating) / 10 : undefined,
    } as unknown as Manga; // Use unknown first for type conversion
  });
}

async function searchKomga(query: string): Promise<Manga[]> {
  if (!process.env.KOMGA_URL) return [];
  const url = `${process.env.KOMGA_URL.replace(/\/$/, '')}/api/v1/series?search=${encodeURIComponent(query)}&page=0&size=20`;
  const komgaUser = process.env.KOMGA_USERNAME;
  const komgaPassword = process.env.KOMGA_PASSWORD;
  const headers: HeadersInit = {};
  if (komgaUser && komgaPassword) {
    headers['Authorization'] = 'Basic ' + Buffer.from(komgaUser + ":" + komgaPassword).toString('base64');
  }

  const res = await retry(() => undiciFetch(url, { dispatcher: agent, headers }), 3, 1000);

  if (!res.ok) {
    logger.log('error', 'Komga search failed', { status: res.status, query, response: await res.text() });
    return [];
  }
  const data = (await res.json()) as { content?: KomgaSeries[] };
  return (data.content || []).map((s: KomgaSeries) => {
    const komgaAuthors = s.metadata?.authors?.filter(a => a.role.toLowerCase() === 'writer').map(a => a.name) || [];
    const komgaArtists = s.metadata?.authors?.filter(a => a.role.toLowerCase() === 'penciller' || a.role.toLowerCase() === 'inker' || a.role.toLowerCase() === 'artist').map(a => a.name) || [];

    return {
      id: `komga-${s.id}`,
      mangadexId: undefined,
      title: s.metadata?.title || s.name,
      description: s.metadata?.summary || '',
      cover: `${process.env.KOMGA_URL?.replace(/\/$/, '')}/api/v1/series/${s.id}/thumbnail`, // Changed from coverImage
      coverImage: `${process.env.KOMGA_URL?.replace(/\/$/, '')}/api/v1/series/${s.id}/thumbnail`, // Keep for compatibility
      url: `/manga/komga-${s.id}`, // Added required property
      source: 'Komga',
      genres: s.metadata?.genres || [],
      author: komgaAuthors.join(', ') || s.metadata?.publisher || 'N/A',
      artist: komgaArtists.join(', ') || 'N/A',
      status: (s.metadata?.status?.toLowerCase() === 'ended' ? 'completed' : (s.metadata?.status?.toLowerCase() === 'ongoing' ? 'ongoing' : 'unknown')) as 'ongoing' | 'completed', // Type assertion
      year: s.metadata?.publicationDate ? String(new Date(s.metadata.publicationDate).getFullYear()) : undefined,
      originalLanguage: undefined,
      lastChapter: String(s.booksCount || '?'),
      chapterCount: { french: 0, total: s.booksCount || 0 }, // Added required property
      type: 'manga', // Added required property, default to manga for Komga
      contentRating: s.metadata?.ageRating ? String(s.metadata.ageRating) : undefined,
    } as unknown as Manga; // Use unknown first for type conversion
  });
}

async function searchToomics(query: string): Promise<Manga[]> {
  try {
    logger.log('info', 'Toomics search called, currently a placeholder', { query });
    return []; // Placeholder implementation

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.log('error', 'Toomics search failed or not fully implemented', { error: errorMessage, query });
    return [];
  }
}

async function searchMangakakalot(query: string): Promise<Manga[]> {
  try {
    const { titleId, url } = await mangakakalotSource.search(query);
    if (!titleId || !url) return [];
    return [{
      id: `mangakakalot-${titleId}`,
      mangadexId: undefined,
      title: query,
      description: '',
      cover: '',
      coverImage: '',
      url: `/manga/mangakakalot-${titleId}`,
      source: 'Mangakakalot',
      genres: [],
      author: 'N/A',
      artist: 'N/A',
      status: 'unknown',
      year: undefined,
      originalLanguage: undefined,
      lastChapter: '?',
      chapterCount: { french: 0, total: 0 },
      type: 'manga',
      contentRating: 'unknown'
    } as unknown as Manga];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.log('error', 'Mangakakalot search failed', { error: errorMessage, query });
    return [];
  }
}

export async function searchMultiSource(query: string): Promise<Manga[]> {
  const sources = [searchMangaDex, searchKitsu, searchKomga, searchToomics, searchMangakakalot];
  const results: Manga[] = [];
  
  for (let i = 0; i < sources.length; i += concurrentSources) {
    const slice = sources.slice(i, i + concurrentSources);
    const responses = await Promise.allSettled(slice.map(fn => fn(query)));
    for (const r of responses) {
      if (r.status === 'fulfilled') {
        if (Array.isArray(r.value)) {
          results.push(...r.value);
        } else {
          logger.log('warning', 'Search source did not return an array', { source: r.value });
        }
      } else {
        logger.log('error', 'Error from one of the search sources', { reason: r.reason, query });
      }
    }
  }
  
  const uniqueResults = Array.from(new Map(results.map(m => [m.id, m])).values());
  logger.log('info', `searchMultiSource found ${uniqueResults.length} unique results for query: ${query}`, { query /*, totalFetched: results.length */ }); // Removed totalFetched
  return uniqueResults;
}
