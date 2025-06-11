import { Agent, setGlobalDispatcher, fetch as undiciFetch } from 'undici';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';
import type { Manga } from '../types/manga';
import type { MangaDexSearchResponse, MangaDexManga, MangaDexRelationship, MangaDexTag } from '../types/mangadex';
import { toomicsSource, mangakakalotSource } from './sources';
import { launchBrowser } from '../utils/launchBrowser';
import { SourceSearchParams } from '../types/source';

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
    limit: '50', // Increased limit to 50
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
    
    // Safely access title
    let title = 'Untitled';
    if (m.attributes?.title) {
      title = m.attributes.title.en || Object.values(m.attributes.title)[0] || 'Untitled';
    }

    // Safely access description
    let description = '';
    if (m.attributes?.description) {
      description = m.attributes.description.en || Object.values(m.attributes.description)[0] || '';
    }
    
    const authorRel = m.relationships?.find(r => r.type === 'author');
    const artistRel = m.relationships?.find(r => r.type === 'artist');

    // Safely access tags - MangaDexTag directly has name.en
    const genres = m.attributes?.tags?.map((tag: MangaDexTag) => tag.name?.en).filter(Boolean) as string[] || [];

    return {
      id: m.id,
      mangadexId: m.id,
      title,
      description,
      cover: coverUrl, 
      coverImage: coverUrl, 
      url: `/manga/${m.id}`, 
      source: 'MangaDex',
      genres,
      author: authorRel?.attributes?.name || 'N/A',
      artist: artistRel?.attributes?.name || 'N/A',
      status: (m.attributes?.status || 'unknown') as 'ongoing' | 'completed', 
      year: m.attributes?.year ? String(parseInt(String(m.attributes.year))) : undefined, // Ensure year is a string before parseInt
      originalLanguage: m.attributes?.originalLanguage || 'unknown',
      lastChapter: m.attributes?.lastChapter || '?',
      chapterCount: { french: 0, total: 0 }, 
      type: (m.attributes?.originalLanguage === 'ja' ? 'manga' : 'manhwa') as 'manga' | 'manhwa' | 'manhua', 
      contentRating: m.attributes?.contentRating || 'unknown',
      tags: m.attributes?.tags,
    } as unknown as Manga; 
  });
}

async function searchKitsu(query: string): Promise<Manga[]> {
  // Corrected limit to 20 as per Kitsu's max page size
  // Removed 'authors' from include as it's not a valid relationship for manga search
  const url = `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(query)}&page[limit]=20&include=categories`; 
  const res = await secureFetch(url);
  if (!res.ok) {
    logger.log('error', 'Kitsu search failed', { status: res.status, query, response: await res.text() });
    return [];
  }
  const kitsuResponse = (await res.json()) as { data?: Array<{ id: string; attributes?: KitsuMangaAttributes; relationships?: any }>, included?: Array<any> };
  
  const includedDataById = new Map();
  if (kitsuResponse.included) {
    for (const item of kitsuResponse.included) {
      if (item.id && item.type) { // Ensure item has id and type
        if (!includedDataById.has(item.type)) {
          includedDataById.set(item.type, new Map());
        }
        includedDataById.get(item.type).set(item.id, item.attributes);
      }
    }
  }
  
  const getIncludedAttributes = (type: string, id: string) => {
    return includedDataById.get(type)?.get(id);
  };

  return (kitsuResponse.data || []).map((m) => {
    const attr = m.attributes || {};
    const rels = m.relationships || {};

    const genres = rels.categories?.data?.map((catRef: { type: string, id: string }) => {
      const catAttributes = getIncludedAttributes(catRef.type, catRef.id);
      return catAttributes?.title;
    }).filter(Boolean) as string[] || [];
    
    // Authors are not directly included anymore, so this will likely result in 'N/A'
    // This part of the mapping logic might need to be revisited if authors are essential
    const authors: string[] = []; // Initialize as empty or handle differently

    return {
      id: `kitsu-${m.id}`,
      mangadexId: undefined,
      title: attr.canonicalTitle || 'Untitled',
      description: attr.synopsis || '',
      cover: attr.posterImage?.original || '', 
      coverImage: attr.posterImage?.original || '', 
      url: `/manga/kitsu-${m.id}`, 
      source: 'Kitsu',
      genres,
      author: 'N/A', // Set to N/A as authors are not fetched
      artist: 'N/A', // Set to N/A
      status: (attr.status === 'current' ? 'ongoing' : (attr.status === 'finished' ? 'completed' : 'unknown')) as 'ongoing' | 'completed',
      year: attr.startDate ? String(new Date(attr.startDate).getFullYear()) : undefined,
      originalLanguage: undefined, // Kitsu API for manga doesn't directly provide original language easily
      lastChapter: attr.chapterCount ? String(attr.chapterCount) : '?',
      chapterCount: { french: 0, total: attr.chapterCount || 0 }, 
      type: (attr.mangaType || 'manga') as 'manga' | 'manhwa' | 'manhua', 
      contentRating: attr.ageRatingGuide || undefined,
      rating: attr.averageRating ? parseFloat(attr.averageRating) / 10 : undefined, 
    } as unknown as Manga; 
  });
}

async function searchKomga(query: string): Promise<Manga[]> {
  if (!process.env.KOMGA_URL) return [];
  const url = `${process.env.KOMGA_URL.replace(/\/$/, '')}/api/v1/series?search=${encodeURIComponent(query)}&page=0&size=50`; // Increased size to 50
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

async function searchMangakakalot(query: string, params?: SourceSearchParams): Promise<Manga[]> {
  try {
    // Detailed log for the received params object
    logger.log('debug', `[multiSource.searchMangakakalot] Entry. query: '${query}'. Received params object: ${JSON.stringify(params)}`, 
      { methodName: 'searchMangakakalot', query, receivedParams: params }
    );

    const localRefreshCache = params?.refreshCache;
    logger.log('debug', `[multiSource.searchMangakakalot] Value of params.refreshCache: ${localRefreshCache}`, 
      { methodName: 'searchMangakakalot', query, refreshCacheValue: localRefreshCache }
    );
    
    if (params) {
      logger.log('debug', `[multiSource.searchMangakakalot] Detailed check: params object exists. Has 'refreshCache' property: ${Object.prototype.hasOwnProperty.call(params, 'refreshCache')}. Value from prop: ${params.refreshCache}`, 
        { methodName: 'searchMangakakalot', query, paramsProperties: Object.keys(params), refreshCacheValDirect: params.refreshCache }
      );
    } else {
      logger.log('debug', `[multiSource.searchMangakakalot] Detailed check: params object is undefined/null.`, 
        { methodName: 'searchMangakakalot', query }
      );
    }
    
    // Use localRefreshCache when creating search parameters for the actual source
    const searchParametersForSource: SourceSearchParams = { 
      refreshCache: localRefreshCache 
    };
    const searchResults = await mangakakalotSource.search(query, searchParametersForSource); 
    
    if (!searchResults || searchResults.length === 0) return [];

    // Map SourceSearchResultItem[] to Manga[]
    return searchResults.map(item => ({
      id: `mangakakalot-${item.id}`,
      mangadexId: undefined,
      title: item.title,
      description: '', // Mangakakalot search page doesn't provide description
      cover: item.cover || '', 
      coverImage: item.cover || '', // Keep for compatibility
      url: `/manga/mangakakalot-${item.id}`, // Construct URL based on ID
      source: 'Mangakakalot', // item.sourceName is 'Mangakakalot'
      genres: [], // Mangakakalot search page doesn't provide genres
      author: 'N/A', // Mangakakalot search page doesn't provide author
      artist: 'N/A', // Mangakakalot search page doesn't provide artist
      status: 'unknown', // Mangakakalot search page doesn't provide status
      year: undefined,
      originalLanguage: undefined,
      lastChapter: '?',
      chapterCount: { french: 0, total: 0 }, // Placeholder
      type: 'manga', // Default type
      contentRating: 'unknown',
      // Ensure all required Manga properties are present with defaults if not available
      isAdult: false, // Default
      isOfficial: false, // Default
      isAvailableInFrench: false, // Default, can be updated later if chapter info is fetched
      readingProgress: null, // Default
      latestChapterRead: null, // Default
      lastReadAt: null, // Default
      isFavorite: false, // Default
    } as unknown as Manga)); 
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.log('error', '[multiSource.searchMangakakalot] Search failed', { methodName: 'searchMangakakalot', error: errorMessage, query });
    return [];
  }
}

export async function searchMultiSource(query: string, refreshCache?: boolean): Promise<Manga[]> {
  logger.log('debug', `[searchMultiSource] Entry. query: "${query}", refreshCache value received: ${refreshCache}`, 
    { methodName: 'searchMultiSource', query, receivedRefreshCache: refreshCache }
  );

  const sources = [
    { name: 'MangaDex', fn: searchMangaDex },
    { name: 'Kitsu', fn: searchKitsu },
    { name: 'Komga', fn: searchKomga },
    { name: 'Toomics', fn: searchToomics },
    { 
      name: 'Mangakakalot', 
      fn: (q: string) => {
        logger.log('debug', `[searchMultiSource] Mangakakalot wrapper function executing. Captured refreshCache: ${refreshCache}`, 
          { methodName: 'MangakakalotWrapper', query: q, capturedRefreshCacheAtExecution: refreshCache }
        );
        return searchMangakakalot(q, { refreshCache }); 
      }
    }, 
  ];
  const allResults: Manga[] = [];

  try {
    const promises = sources.map(async (source) => {
      try {
        logger.log('info', `[searchMultiSource] Loop: About to search ${source.name}. Query: "${query}". Current searchMultiSource refreshCache: ${refreshCache}`, 
          { methodName: 'searchMultiSourceLoop', query, source: source.name, loopCycleRefreshCache: refreshCache }
        );
        
        const results = await source.fn(query); 
        
        logger.log('info', `[searchMultiSource] Loop: Found ${results.length} results from ${source.name}. Query: "${query}"`, 
          { methodName: 'searchMultiSourceLoop', query, source: source.name, count: results.length }
        );
        if (Array.isArray(results)) { 
          allResults.push(...results);
        } else {
          logger.log('warning', `[searchMultiSource] Loop: Source ${source.name} did not return an array. Query: "${query}"`, 
            { methodName: 'searchMultiSourceLoop', query, source: source.name, resultsReceived: results }
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.log('error', `[searchMultiSource] Loop: Error searching ${source.name}. Query: "${query}"`, 
          { methodName: 'searchMultiSourceLoop', query, source: source.name, error: errorMessage }
        );
      }
    });

    await Promise.all(promises);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.log('error', `[searchMultiSource] General error. Query: "${query}"`, 
      { methodName: 'searchMultiSource', query, error: errorMessage }
    );
  } finally {
  }

  const uniqueResults = Array.from(new Map(allResults.map(m => [`${m.source}-${m.title.toLowerCase()}`, m])).values());
  logger.log('info', `[searchMultiSource] Returning ${uniqueResults.length} unique results out of ${allResults.length} total. Query: "${query}"`, { methodName: 'searchMultiSource', query, uniqueCount: uniqueResults.length, totalCount: allResults.length });
  return uniqueResults;
}
