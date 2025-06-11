export interface Manga {
  id: string;
  title: string;
  description: string;
  cover: string;
  url: string;
  type: 'manga' | 'manhwa' | 'manhua';
  status: 'ongoing' | 'completed';
  lastChapter: string;
  chapterCount: {
    french: number;
    total: number;
  };
  author?: string;
  artist?: string;
  year?: string;
  contentRating?: 'safe' | 'suggestive' | 'erotica' | 'pornographic'; // Contenu approprié
  score?: number; // Note sur 10
  rating?: number; // Note sur 10 (alias pour score)
  isAvailableInFrench?: boolean;
  availableLanguages?: string[];
  originalLanguage?: string;
}

export interface FavoriteManga extends Manga {
  addedAt: string;
  lastRead?: string;
  notes?: string;
  readingStatus?: 'to-read' | 'reading' | 'completed';
}

export type ReadingStatus = 'to-read' | 'reading' | 'completed';
