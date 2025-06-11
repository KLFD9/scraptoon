export interface Manga {
  id: string;
  title: string;
  description: string;
  cover: string;
  url: string;
  source: string; // Added source field
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
  rating?: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
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
