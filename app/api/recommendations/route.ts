import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { logger } from '@/app/utils/logger';
import { retry } from '@/app/utils/retry';
import type { Manga } from '@/app/types/manga';
import type {
  MangaDexSearchResponse,
  MangaDexManga,
  MangaDexRelationship
} from '@/app/types/mangadex';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const cache = new Cache<Manga[]>(CACHE_DURATION);

interface FavoriteMeta {
  id: string;
  title?: string;
  author?: string;
  type?: 'manga' | 'manhwa' | 'manhua';
}

const fetchHttps = (url: string, options?: RequestInit) => {
  if (!url.startsWith('https://')) {
    throw new Error('Les requêtes externes doivent utiliser HTTPS');
  }
  return fetch(url, options);
};

// Convertir les données MangaDex en format Manga
function convertMangaDxToManga(mangadx: MangaDexManga): Manga {
  const title = mangadx.attributes.title.en || 
                mangadx.attributes.title.ja || 
                mangadx.attributes.title['ja-ro'] ||
                Object.values(mangadx.attributes.title)[0] || 
                'Titre inconnu';

  const description = mangadx.attributes.description?.en || 
                     mangadx.attributes.description?.fr ||
                     Object.values(mangadx.attributes.description || {})[0] || 
                     'Description non disponible';

  // Trouver la cover art
  const coverRelation = mangadx.relationships?.find(
    (rel: MangaDexRelationship) => rel.type === 'cover_art'
  );
  const fileName = coverRelation?.attributes?.fileName;
  const cover = fileName 
    ? `https://uploads.mangadex.org/covers/${mangadx.id}/${fileName}`
    : '/images/manga-placeholder.svg';

  // Déterminer le type basé sur les tags ou le pays d'origine
  let type: 'manga' | 'manhwa' | 'manhua' = 'manga';
  const originalLanguage = mangadx.attributes.originalLanguage;
  if (originalLanguage === 'ko') type = 'manhwa';
  else if (originalLanguage === 'zh' || originalLanguage === 'zh-hk') type = 'manhua';

  // Trouver l'auteur
  const authorRelation = mangadx.relationships?.find(
    (rel: MangaDexRelationship) => rel.type === 'author'
  );
  const author = authorRelation?.attributes?.name || 'Auteur inconnu';

  return {
    id: mangadx.id,
    title,
    description,
    cover,
    url: `/manga/${mangadx.id}`,
    source: 'mangadex', // Added source
    type,
    status: mangadx.attributes.status === 'completed' ? 'completed' : 'ongoing',
    lastChapter: mangadx.attributes.lastChapter || 'N/A',
    chapterCount: {
      french: 0, // MangaDX ne fournit pas cette info facilement
      total: parseInt(mangadx.attributes.lastChapter || '0') || 0
    },
    author,
    year: mangadx.attributes.year?.toString() || new Date().getFullYear().toString()
  };
}

// Rechercher des mangas par tags/genres similaires aux favoris
async function searchByTags(favoriteGenres: string[], limit: number, excludeIds: string[]): Promise<Manga[]> {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(Math.min(limit * 2, 20))); // Prendre plus pour filtrer
    params.append('order[rating]', 'desc');
    params.append('order[followedCount]', 'desc');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('contentRating[]', 'erotica'); // Ajout pour contenu mature
    
    // Si on a des genres favoris, les utiliser
    if (favoriteGenres.length > 0) {
      favoriteGenres.forEach(genre => {
        params.append('includedTags[]', genre);
      });
    } else {
      // Tags MangaDx par défaut variés (UUIDs réels)
      const defaultTags = [
        '423e2eae-a7a2-4a8b-ac03-a8351462d71d', // Romance
        'b9af3a63-f058-46de-a9a0-e0c13906197a', // Drama
        '391b0423-d847-456f-aff0-8b0cfc03066b', // Action 
        'cdc58593-87dd-415e-bbc0-2ec27bf404cc', // Fantasy
        '4d32cc48-9f00-4cca-9b5a-a839f0764984'  // Comedy
      ];
      defaultTags.forEach(tag => params.append('includedTags[]', tag));
    }

    const url = `https://api.mangadex.org/manga?${params.toString()}`;
    
    logger.log('info', '🔍 Recherche MangaDx par tags');
    
    const response = await retry(
      () => fetchHttps(url, { headers: { Accept: 'application/json' } }),
      3,
      1000
    );

    if (!response.ok) {
      throw new Error(`MangaDx API error: ${response.status}`);
    }

    const data: MangaDexSearchResponse = await response.json();
    
    const results = data.data
      .filter(manga => !excludeIds.includes(manga.id))
      .slice(0, limit)
      .map(convertMangaDxToManga);

    logger.log('info', '✅ Résultats MangaDx obtenus', {
      count: results.length,
      titles: results.map(r => r.title).slice(0, 3)
    });

    return results;
  } catch (error) {
    logger.log('error', '❌ Erreur searchByTags', { error: String(error) });
    return [];
  }
}

// Rechercher des mangas par contenu mature/adulte spécifiquement
async function searchMatureContent(limit: number, excludeIds: string[]): Promise<Manga[]> {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(limit * 2));
    params.append('order[rating]', 'desc');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'erotica');
    params.append('contentRating[]', 'suggestive');
    
    // Tags MangaDx réels pour contenu mature/charme (UUIDs)
    const matureTags = [
      '423e2eae-a7a2-4a8b-ac03-a8351462d71d', // Romance
      'b9af3a63-f058-46de-a9a0-e0c13906197a', // Drama  
      '9f5ceee7-234c-4d94-af8a-1b568be146c2', // Ecchi
      '7b2ce280-79ef-4c09-9b58-12b7c23a9b78', // Shoujo Ai
      '5920b825-4181-4a17-beeb-9918b0ff60a1'  // Shounen Ai
    ];
    matureTags.forEach(tag => params.append('includedTags[]', tag));

    const url = `https://api.mangadex.org/manga?${params.toString()}`;
    
    logger.log('info', '🔞 Recherche contenu mature', { url: url.substring(0, 100) + '...' });
    
    const response = await retry(
      () => fetchHttps(url, { headers: { Accept: 'application/json' } }),
      3,
      1000
    );

    if (!response.ok) {
      throw new Error(`MangaDx API error: ${response.status}`);
    }

    const data: MangaDexSearchResponse = await response.json();
    
    const results = data.data
      .filter(manga => !excludeIds.includes(manga.id))
      .slice(0, limit)
      .map(convertMangaDxToManga);

    logger.log('info', '✅ Contenu mature trouvé', {
      count: results.length,
      titles: results.map(r => r.title).slice(0, 3)
    });

    return results;
  } catch (error) {
    logger.log('error', '❌ Erreur recherche mature', { error: String(error) });
    return [];
  }
}

// Rechercher des mangas populaires/recommandés
async function getPopularRecommendations(limit: number, excludeIds: string[]): Promise<Manga[]> {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(limit * 2)); // Prendre plus pour filtrer
    params.append('order[followedCount]', 'desc');
    params.append('order[rating]', 'desc');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');

    const url = `https://api.mangadex.org/manga?${params.toString()}`;
    
    const response = await retry(
      () => fetchHttps(url, { headers: { Accept: 'application/json' } }),
      3,
      1000
    );

    if (!response.ok) {
      throw new Error(`MangaDX API error: ${response.status}`);
    }

    const data: MangaDexSearchResponse = await response.json();
    
    return data.data
      .filter(manga => !excludeIds.includes(manga.id))
      .slice(0, limit)
      .map(convertMangaDxToManga);
  } catch (error) {
    logger.log('error', 'getPopularRecommendations failed', { error: String(error) });
    return [];
  }
}

async function generateRecommendations(
  history: string[],
  favorites: FavoriteMeta[],
  limit: number
): Promise<Manga[]> {
  logger.log('info', '🔍 Génération recommandations dynamiques personnalisées');

  const cacheKey = `dynamic_recommendations_${history.sort().join('_')}_${favorites
    .map((f) => f.id)
    .sort()
    .join('_')}_${limit}`;
  
  logger.log('info', '🔑 Clé de cache générée');
    
  const cached = await cache.get(cacheKey);
  if (cached && cached.length > 0) {
    logger.log('info', '💾 Recommandations chargées depuis le cache');
    return cached;
  }

  let recommendations: Manga[] = [];
  const excludeIds = [...history, ...favorites.map(f => f.id)];
  
  logger.log('info', '🚫 IDs à exclure');
  
  // Analyser les types de favoris pour déterminer les préférences
  const favoriteTypes = favorites.map(f => f.type).filter(Boolean);
  const favoriteAuthors = favorites.map(f => f.author).filter(Boolean);
  
  // Détecter si l'utilisateur aime le contenu mature/adulte
  // Basé sur les titres et types de favoris
  const hasMaturePreferences = favorites.some(fav => {
    const title = (fav.title || fav.id || '').toLowerCase();
    const matureKeywords = ['ecchi', 'mature', 'adult', 'romance', 'hentai', 'sexy', 'charme', 'sensual', 'prison', 'domestic', 'monster'];
    return matureKeywords.some(keyword => title.includes(keyword));
  });
  
  // Si l'utilisateur a des favoris mais aucun contenu mature détecté, 
  // on suppose qu'il peut être intéressé par du contenu mature/romance
  const shouldSearchMature = hasMaturePreferences || (favorites.length >= 2);
  
  if (shouldSearchMature) {
    logger.log('info', '🔞 Contenu mature détecté dans les préférences utilisateur');
  }
  
  logger.log('info', '🎯 Analyse des préférences utilisateur', {
    favoritesCount: favorites.length
  });
  
  try {
    if (shouldSearchMature) {
      logger.log('info', '🔞 Utilisateur avec préférences mature identifiées - recherche contenu similaire');
      
      // 1. Rechercher du contenu mature/romance en priorité
      const matureRecs = await searchMatureContent(Math.ceil(limit * 0.6), excludeIds);
      recommendations.push(...matureRecs);
      
      // 2. Compléter avec des contenus similaires par tags mature
      if (recommendations.length < limit) {
        const remainingLimit = limit - recommendations.length;
        const currentExcludeIds = [...excludeIds, ...recommendations.map(r => r.id)];
        
        // Rechercher avec des tags appropriés pour contenu mature/romance
        const matureTagIds = [
          '423e2eae-a7a2-4a8b-ac03-a8351462d71d', // Romance
          'b9af3a63-f058-46de-a9a0-e0c13906197a', // Drama
          '9f5ceee7-234c-4d94-af8a-1b568be146c2'  // Ecchi
        ];
        const tagBasedRecs = await searchByTags(matureTagIds, remainingLimit, currentExcludeIds);
        recommendations.push(...tagBasedRecs);
      }
      
      // 3. Si toujours pas assez, rechercher par type (manhwa, manga, etc.)
      if (recommendations.length < limit && favoriteTypes.length > 0) {
        const remainingLimit = limit - recommendations.length;
        const currentExcludeIds = [...excludeIds, ...recommendations.map(r => r.id)];
        
        // Prendre le type dominant des favoris
        const typeCount = favoriteTypes.reduce((acc, type) => {
          if (type) acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const dominantType = (Object.keys(typeCount) as Array<'manga' | 'manhwa' | 'manhua'>).reduce((a, b) => 
          typeCount[a] > typeCount[b] ? a : b
        );
        
        logger.log('info', '📚 Recherche par type dominant');
        const typeBasedRecs = await searchByTags([], remainingLimit, currentExcludeIds);
        recommendations.push(...typeBasedRecs);
      }
    } else {
      logger.log('info', '📚 Utilisateur avec préférences générales - recherche contenu populaire');
      
      // Pour utilisateurs sans préférences mature claires, contenu plus général
      const generalRecs = await getPopularRecommendations(limit, excludeIds);
      recommendations.push(...generalRecs);
    }
    
    // Mélanger pour plus de diversité
    recommendations = recommendations
      .filter((rec, index, self) => self.findIndex(r => r.id === rec.id) === index) // Supprimer doublons
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
      
    logger.log('info', '✅ Recommandations API générées');
    
  } catch (error) {
    logger.log('error', '❌ Erreur lors des appels API');
    recommendations = []; // Forcer le fallback
  }

  // Fallback seulement si vraiment aucune recommandation n'a été trouvée
  if (recommendations.length === 0) {
    logger.log('warning', '⚠️ Aucune recommandation API trouvée, utilisation de fallbacks');
    
    // Fallbacks adaptés au contenu mature si applicable
    if (shouldSearchMature) {
      recommendations = [
        {
          id: 'mature-fb-1',
          title: 'Domestic Girlfriend',
          description: 'Romance dramatique entre étudiants et professeurs.',
          cover: '/images/manga-placeholder.svg',
          url: '/manga/domestic-girlfriend',
          source: 'fallback', // Added source
          type: 'manga' as const,
          status: 'completed' as const,
          lastChapter: '276',
          chapterCount: { french: 276, total: 276 },
          author: 'Kei Sasuga',
          year: '2014'
        },
        {
          id: 'mature-fb-2',
          title: 'Prison School',
          description: 'Comédie et romance dans un lycée strict.',
          cover: '/images/manga-placeholder.svg',
          url: '/manga/prison-school',
          source: 'fallback', // Added source
          type: 'manga' as const,
          status: 'completed' as const,
          lastChapter: '277',
          chapterCount: { french: 277, total: 277 },
          author: 'Akira Hiramoto',
          year: '2011'
        },
        {
          id: 'mature-fb-3',
          title: 'Monster Musume',
          description: 'Romance avec des créatures fantastiques.',
          cover: '/images/manga-placeholder.svg',
          url: '/manga/monster-musume',
          source: 'fallback', // Added source
          type: 'manga' as const,
          status: 'ongoing' as const,
          lastChapter: '80+',
          chapterCount: { french: 75, total: 80 },
          author: 'Okayado',
          year: '2012'
        }
      ].slice(0, limit);
    } else {
      // Fallbacks généraux
      recommendations = [
        {
          id: 'fallback-1',
          title: 'One Piece',
          description: 'Les aventures épiques de Monkey D. Luffy et son équipage à la recherche du trésor légendaire One Piece.',
          cover: '/images/manga-placeholder.svg',
          url: '/manga/one-piece',
          source: 'fallback', // Added source
          type: 'manga' as const,
          status: 'ongoing' as const,
          lastChapter: '1100+',
          chapterCount: { french: 1000, total: 1100 },
          author: 'Eiichiro Oda',
          year: '1997'
        },
        {
          id: 'fallback-2',
          title: 'Attack on Titan',
          description: 'L\'humanité lutte pour sa survie contre des géants mangeurs d\'hommes.',
          cover: '/images/manga-placeholder.svg',
          url: '/manga/attack-on-titan',
          source: 'fallback', // Added source
          type: 'manga' as const,
          status: 'completed' as const,
          lastChapter: '139',
          chapterCount: { french: 139, total: 139 },
          author: 'Hajime Isayama',
          year: '2009'
        },
        {
          id: 'fallback-3',
          title: 'Solo Leveling',
          description: 'Un chasseur faible devient le plus puissant au monde.',
          cover: '/images/manga-placeholder.svg',
          url: '/manga/solo-leveling',
          source: 'fallback', // Added source
          type: 'manhwa' as const,
          status: 'completed' as const,
          lastChapter: '179',
          chapterCount: { french: 179, total: 179 },
          author: 'Chugong',
          year: '2018'
        }
      ].slice(0, limit);
    }
  }

  logger.log('info', '✅ Recommandations finales générées');

  await cache.set(cacheKey, recommendations);
  return recommendations;
} // Ensuring getRecommendations function is properly closed

export async function POST(request: Request) {
  try {
    const { limit = 6, favorites = [] } = await request.json();
    const cookieStore = cookies();
    const historyCookie = (await cookieStore).get('reading_history');
    let history: string[] = [];
    if (historyCookie) {
      try {
        const parsed = JSON.parse(historyCookie.value);
        if (Array.isArray(parsed)) {
          history = Array.from(new Set(parsed))
            .slice(0, 20)
            .map((id) => String(id));
        }
      } catch (err) {
        console.error('Failed to parse reading_history cookie:', err); // Added logging for robustness
      }
    }

    const finalRecommendations = await generateRecommendations(
      history,
      favorites,
      limit,
    );

    return NextResponse.json(
      { success: true, results: finalRecommendations, cached: false },
      { status: 200 },
    );

  } catch (error) { // Added catch for the main try block in POST
    console.error('Error in POST /recommendations:', error);
    // It's good practice to return a proper error response
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '6');
    const cookieStore = cookies();
    const historyCookie = (await cookieStore).get('reading_history');
    let history: string[] = [];
    if (historyCookie) {
      try {
        const parsed = JSON.parse(historyCookie.value);
        if (Array.isArray(parsed)) {
          history = Array.from(new Set(parsed))
            .slice(0, 20)
            .map((id) => String(id));
        }
      } catch (err) {
        logger.log('warning', 'Invalid reading_history cookie', {
          error: String(err),
        });
      }
    }

    const recommendations = await generateRecommendations(history, [], limit);

    return NextResponse.json({ success: true, results: recommendations, cached: false });
  } catch (error) {
    logger.log('error', 'Erreur génération recommandations', { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Erreur lors des recommandations' },
      { status: 500 }
    );
  }
}