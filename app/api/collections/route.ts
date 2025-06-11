import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { logger } from '@/app/utils/logger';
import { STATIC_MANGA_DATABASE } from '@/app/services/staticMangaDatabase';
import type { Manga } from '@/app/types/manga';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const cache = new Cache<any>(CACHE_DURATION);

interface CollectionStats {
  id: string;
  name: string;
  count: number;
  trending: boolean;
  newCount: number; // Nouveaux mangas cette semaine
  genres: string[];
  avgRating?: number;
  topManga?: {
    title: string;
    cover: string;
  };
}

// Définition des collections avec leurs critères de filtrage
interface CollectionConfig {
  keywords: string[];
  genres: string[];
  excludeKeywords: string[];
  minRating?: number;
}

const COLLECTIONS_CONFIG: Record<string, CollectionConfig> = {
  'romance-scolaire': {
    keywords: ['school', 'romance', 'love', 'high school', 'college'],
    genres: ['Romance', 'School Life', 'Shoujo'],
    excludeKeywords: ['hentai', 'adult'],
  },
  'action-intense': {
    keywords: ['action', 'fighting', 'battle', 'war', 'combat'],
    genres: ['Action', 'Martial Arts', 'Adventure'],
    excludeKeywords: ['slice of life'],
  },
  'fantasy-medieval': {
    keywords: ['fantasy', 'medieval', 'magic', 'dragon', 'sword'],
    genres: ['Fantasy', 'Adventure', 'Supernatural'],
    excludeKeywords: ['modern', 'contemporary'],
  },
  'thriller-psychologique': {
    keywords: ['thriller', 'psychological', 'mystery', 'suspense', 'horror'],
    genres: ['Thriller', 'Mystery', 'Horror', 'Psychological'],
    excludeKeywords: ['comedy', 'romance'],
  },
  'slice-of-life': {
    keywords: ['slice of life', 'daily life', 'everyday', 'realistic'],
    genres: ['Slice of Life', 'Drama', 'Josei', 'Seinen'],
    excludeKeywords: ['action', 'fantasy'],
  },
  'top-rated': {
    keywords: ['award', 'winner', 'acclaimed', 'masterpiece'],
    genres: [],
    minRating: 8.5,
    excludeKeywords: [],
  },
};

// Simuler des données de tendances et statistiques
function getCollectionTrendingData() {
  return {
    'romance-scolaire': { trending: true, weeklyGrowth: 15, newManga: ['Komi-san', 'Horimiya'] },
    'action-intense': { trending: false, weeklyGrowth: 5, newManga: ['Jujutsu Kaisen'] },
    'fantasy-medieval': { trending: true, weeklyGrowth: 22, newManga: ['Frieren', 'Dungeon Meshi'] },
    'thriller-psychologique': { trending: false, weeklyGrowth: -2, newManga: [] },
    'slice-of-life': { trending: true, weeklyGrowth: 8, newManga: ['Spy x Family'] },
    'top-rated': { trending: false, weeklyGrowth: 3, newManga: ['Chainsaw Man'] },
  };
}

// Filtrer les mangas selon les critères de collection
function filterMangaForCollection(collectionId: string, allManga: Manga[]): Manga[] {
  const config = COLLECTIONS_CONFIG[collectionId];
  if (!config) return [];

  return allManga.filter(manga => {
    const searchText = `${manga.title} ${manga.description} ${manga.author}`.toLowerCase();
    
    // Vérifier les mots-clés requis
    const hasRequiredKeywords = config.keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    
    // Vérifier les mots-clés à exclure
    const hasExcludedKeywords = config.excludeKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    
    // Vérifier la note minimale si spécifiée
    const meetsRatingRequirement = !config.minRating || 
      (manga.rating && typeof manga.rating === 'number' && manga.rating >= config.minRating);
    
    return hasRequiredKeywords && !hasExcludedKeywords && meetsRatingRequirement;
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('id');
    const detailed = searchParams.get('detailed') === 'true';
    
    const cacheKey = `collections_${collectionId || 'all'}_${detailed}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({ success: true, data: cached, cached: true });
    }

    const trendingData = getCollectionTrendingData();
    
    if (collectionId) {
      // Retourner les détails d'une collection spécifique
      const manga = filterMangaForCollection(collectionId, STATIC_MANGA_DATABASE);
      const trending = trendingData[collectionId as keyof typeof trendingData];
      
      const collectionDetails = {
        id: collectionId,
        manga: detailed ? manga : manga.slice(0, 6), // Limiter à 6 pour l'aperçu
        count: manga.length,
        trending: trending?.trending || false,
        weeklyGrowth: trending?.weeklyGrowth || 0,
        newManga: trending?.newManga || [],
        topManga: manga[0] ? { title: manga[0].title, cover: manga[0].cover } : null,
      };
      
      await cache.set(cacheKey, collectionDetails);
      return NextResponse.json({ success: true, data: collectionDetails });
    }
    
    // Retourner les statistiques de toutes les collections
    const collectionsStats: CollectionStats[] = Object.keys(COLLECTIONS_CONFIG).map(id => {
      const manga = filterMangaForCollection(id, STATIC_MANGA_DATABASE);
      const trending = trendingData[id as keyof typeof trendingData];
      const config = COLLECTIONS_CONFIG[id as keyof typeof COLLECTIONS_CONFIG];
      
      return {
        id,
        name: getCollectionName(id),
        count: manga.length,
        trending: trending?.trending || false,
        newCount: trending?.newManga?.length || 0,
        genres: config.genres,
        avgRating: manga.reduce((sum, m) => {
          const rating = typeof m.rating === 'number' ? m.rating : 7;
          return sum + rating;
        }, 0) / manga.length,
        topManga: manga[0] ? { title: manga[0].title, cover: manga[0].cover } : undefined,
      };
    });
    
    await cache.set(cacheKey, collectionsStats);
    
    return NextResponse.json({ 
      success: true, 
      data: collectionsStats,
      trending: Object.entries(trendingData)
        .filter(([_, data]) => data.trending)
        .map(([id]) => id)
    });
    
  } catch (error) {
    logger.log('error', 'Erreur API collections', { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des collections' },
      { status: 500 }
    );
  }
}

function getCollectionName(id: string): string {
  const names: Record<string, string> = {
    'romance-scolaire': 'Romance scolaire',
    'action-intense': 'Action intense',
    'fantasy-medieval': 'Fantasy médiévale',
    'thriller-psychologique': 'Thriller psychologique',
    'slice-of-life': 'Tranches de vie',
    'top-rated': 'Les mieux notés',
  };
  return names[id] || id;
}
