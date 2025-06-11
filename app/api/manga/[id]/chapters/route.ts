import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { logger } from '@/app/utils/logger';
import { retry } from '@/app/utils/retry';
import type { MangaDexChapter, MangaDexChaptersResponse } from '@/app/types/mangadex';
import type { Source, ChaptersResult, ChapterData, SourceSearchResult } from '@/app/types/source';
import { getAllSources, mangadexSource, webtoonSource, komgaSource, toomicsSource } from '@/app/services/sources';



const chaptersCache = new Cache<ChaptersResult & { source: { name: string; url: string; titleId: string } }>(7200000);
const sources: Source[] = [
  mangadexSource,
  webtoonSource,
  komgaSource,
  toomicsSource,
  // mangaScantradSource
];

async function searchAllSources(mangaTitle: string): Promise<SourceSearchResult[]> {
  const searchPromises = sources.map(async (source) => {
    try {
      logger.log('info', `Recherche sur ${source.name}`, { query: mangaTitle });
      const result = await source.search(mangaTitle);
      if (result.titleId && result.url) {
        return { source: source.name, titleId: result.titleId, url: result.url, sourceObj: source } as SourceSearchResult;
      }
      return null;
    } catch (error) {
      logger.log('error', `Erreur lors de la recherche sur ${source.name}`, {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return null;
    }
  });
  const results = await Promise.all(searchPromises);
  return results.filter((result): result is SourceSearchResult => result !== null);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const startTime = Date.now();
  const { id: mangaId } = params;
  if (!mangaId) {
    logger.log('warning', 'Requête invalide - ID manga manquant');
    return NextResponse.json({ error: 'ID du manga manquant' }, { status: 400 });
  }
  try {
    logger.log('info', 'Début de la requête GET chapters', { mangaId, timestamp: new Date().toISOString() });
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const getAll = searchParams.get('all') === 'true';
    const sortBy = searchParams.get('sort') || 'chapter-asc';

    const cacheKey = `chapters_${mangaId}`;
    const cachedData = await chaptersCache.get(cacheKey);
    if (cachedData) {
      logger.log('info', 'Données trouvées en cache', { mangaId, chaptersCount: cachedData.chapters.length });
      if (getAll) {
        const sortedChapters = sortChapters(cachedData.chapters, sortBy);
        return NextResponse.json({ chapters: sortedChapters, totalChapters: cachedData.totalChapters, source: cachedData.source });
      }
      return formatResponse(cachedData, page, limit, sortBy);
    }

    const mangaResponse = await retry(() => fetch(`https://api.mangadex.org/manga/${mangaId}?includes[]=title`), 3, 1000);
    const mangaData = await mangaResponse.json();
    if (!mangaResponse.ok) {
      logger.log('error', 'Erreur MangaDex API', { status: mangaResponse.status, statusText: mangaResponse.statusText, mangaId, response: mangaData });
      return NextResponse.json({ error: 'Manga non trouvé' }, { status: 404 });
    }
    const mangaTitle = mangaData.data.attributes.title.en ||
                      mangaData.data.attributes.title.fr ||
                      mangaData.data.attributes.title.ja ||
                      Object.values(mangaData.data.attributes.title)[0];

    logger.log('info', 'Titre du manga récupéré', { mangaId, title: mangaTitle, availableLanguages: Object.keys(mangaData.data.attributes.title) });
    const sourceResults = await searchAllSources(mangaTitle);
    logger.log('debug', 'Résultats de la recherche sur les sources', {
      mangaId,
      title: mangaTitle,
      sourceResults: sourceResults.map(r => ({ source: r.source, titleId: r.titleId, url: r.url }))
    });
    if (sourceResults.length === 0) {
      logger.log('warning', 'Aucune source trouvée', { mangaId, title: mangaTitle });
      return NextResponse.json({ error: 'Manga non trouvé sur aucune source disponible' }, { status: 404 });
    }
    logger.log('info', 'Récupération des chapitres en parallèle', { source: sourceResults.map(r => r.source).join(', ') });
    const chapterPromises = sourceResults.map(r => r.sourceObj.getChapters(r.titleId, r.url).then(data => ({ ...data, source: { name: r.source, url: r.url, titleId: r.titleId } })));
    let resultData: { chapters: ChapterData[]; totalChapters: number; source: { name: string; url: string; titleId: string } };
    try {
      resultData = await Promise.any(chapterPromises);
    } catch {
      logger.log('error', 'Échec de toutes les sources', { mangaId });
      return NextResponse.json({ error: 'Aucune source valide' }, { status: 500 });
    }
    const { chapters: allChapters, totalChapters, source } = resultData;
    logger.log('info', 'Chapitres récupérés avec succès', {
      source: source.name,
      chaptersCount: allChapters.length,
      totalChapters,
      firstChapter: allChapters[0],
      lastChapter: allChapters[allChapters.length - 1]
    });
    const cachePayload = { chapters: allChapters, totalChapters, source };
    await chaptersCache.set(cacheKey, cachePayload);
    logger.log('debug', 'Données mises en cache', { mangaId, cacheKey });
    if (getAll) {
      const sortedChapters = sortChapters(allChapters, sortBy);
      return NextResponse.json({ chapters: sortedChapters, totalChapters, source });
    }
    const response = formatResponse(cachePayload, page, limit, sortBy);
    const executionTime = Date.now() - startTime;
    logger.log('info', 'Requête terminée avec succès', { mangaId, executionTime, chaptersCount: allChapters.length, page, limit });
    return response;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.log('error', 'Erreur lors de la récupération des chapitres', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      executionTime,
      mangaId
    });
    return NextResponse.json({ error: 'Erreur serveur lors de la récupération des chapitres', details: error instanceof Error ? error.message : 'Erreur inconnue' }, { status: 500 });
  }
}

function sortChapters(chapters: ChapterData[], sortBy: string = 'chapter-asc'): ChapterData[] {
  const sorted = [...chapters];
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateA - dateB;
      });
    case 'chapter-desc':
      return sorted.sort((a, b) => {
        const aNum = parseFloat((a.chapter || '').replace(/[^\d.]/g, ''));
        const bNum = parseFloat((b.chapter || '').replace(/[^\d.]/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return bNum - aNum;
        }
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
    case 'chapter-asc':
    default:
      return sorted.sort((a, b) => {
        const aNum = parseFloat((a.chapter || '').replace(/[^\d.]/g, ''));
        const bNum = parseFloat((b.chapter || '').replace(/[^\d.]/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateA - dateB;
      });
  }
}

function formatResponse(
  data: ChaptersResult & { source: { name: string; url: string; titleId: string } },
  page: number,
  limit: number,
  sortBy: string = 'chapter-asc'
) {
  const { chapters: allChapters, totalChapters, source } = data;
  const sortedChapters = sortChapters(allChapters, sortBy);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedChapters = sortedChapters.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalChapters / limit);
  return NextResponse.json({
    chapters: paginatedChapters,
    pagination: {
      currentPage: page,
      totalPages,
      hasNextPage: endIndex < totalChapters,
      hasPreviousPage: page > 1,
      itemsPerPage: limit,
      totalItems: totalChapters
    },
    source
  });
}
