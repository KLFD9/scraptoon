import { Manga } from '../types/manga';
import { logger } from '../utils/logger';

export async function scrapeManga(query: string): Promise<Manga[]> {
  try {
    const response = await fetch('/api/scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchQuery: query }),
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