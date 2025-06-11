import { Manga } from '../types/manga';
import { logger } from '../utils/logger';

export async function scrapeManga(query: string, forceRefresh: boolean = false): Promise<Manga[]> {
  try {
    const bodyPayload: { searchQuery: string; refreshCache?: boolean } = { searchQuery: query };
    if (forceRefresh) {
      bodyPayload.refreshCache = true;
    }

    const response = await fetch('/api/scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur inconnue');
    }

    logger.log('info', 'Recherche terminée', {
      query,
      resultsCount: data.results.length
    });

    return data.results;
  } catch (error) {
    logger.log('error', 'Erreur lors de la recherche', {
      query,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    
    return [];
  }
}

// Nouvelle fonction pour récupérer les trending mangas
export async function getTrendingManga(limit: number = 8): Promise<Manga[]> {
  try {
    const trendingQueries = ['Solo Leveling', 'One Piece', 'Tower of God', 'Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen', 'Chainsaw Man', 'My Hero Academia'];
    
    // On prend quelques queries populaires pour avoir de vraies covers
    const randomQueries = trendingQueries.slice(0, Math.min(limit, trendingQueries.length));
    
    const results: Manga[] = [];
    
    for (const query of randomQueries) {
      try {
        const mangas = await scrapeManga(query);
        if (mangas.length > 0) {
          results.push(mangas[0]); // Premier résultat de chaque recherche
        }
      } catch (error) {
        logger.log('error', 'Erreur trending manga', { query, error: String(error) });
      }
    }
    
    return results.slice(0, limit);
  } catch (error) {
    logger.log('error', 'Erreur lors de la récupération des trending', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    return [];
  }
}

// Nouvelle fonction pour récupérer les best sellers
export async function getBestSellerManga(limit: number = 8): Promise<Manga[]> {
  try {
    const bestSellerQueries = [
      'Naruto', 'One Piece', 'Dragon Ball', 'Death Note', 'Attack on Titan', 
      'Fullmetal Alchemist', 'Hunter x Hunter', 'Bleach', 'Tokyo Ghoul', 
      'Demon Slayer', 'Jujutsu Kaisen', 'My Hero Academia'
    ];
    
    // Mélanger et prendre quelques queries pour les best sellers
    const shuffled = [...bestSellerQueries].sort(() => Math.random() - 0.5);
    const selectedQueries = shuffled.slice(0, Math.min(limit, shuffled.length));
    
    const results: Manga[] = [];
    
    for (const query of selectedQueries) {
      try {
        const mangas = await scrapeManga(query);
        if (mangas.length > 0) {
          results.push(mangas[0]);
        }
      } catch (error) {
        logger.log('error', 'Erreur best seller manga', { query, error: String(error) });
      }
    }
    
    return results.slice(0, limit);
  } catch (error) {
    logger.log('error', 'Erreur lors de la récupération des best sellers', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    return [];
  }
}
export async function getNewestManga(limit: number = 8): Promise<Manga[]> {
  try {
    const response = await fetch(`/api/newest?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Erreur inconnue');
    }
    return data.results as Manga[];
  } catch (error) {
    logger.log('error', 'Erreur lors de la récupération des nouveautés', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    return [];
  }
}
