// Types pour le système de scraping des sources
export interface ChapterData {
  id: string;
  chapter: string;
  title: string | null;
  publishedAt: string | null;
  url: string;
  source: string;
  language?: string; // Code langue ISO (fr, en, ja, etc.)
}

export interface ChaptersResult {
  chapters: ChapterData[];
  totalChapters: number;
  source: {
    name: string;
    url: string;
    titleId: string;
  };
}

export interface Source {
  name: string;
  baseUrl: string;
  adultContent?: boolean;
  search: (title: string) => Promise<{ titleId: string | null; url: string | null }>;
  getChapters: (titleId: string, url: string) => Promise<ChaptersResult>;
}

export interface SourceSearchResult {
  source: string;
  titleId: string;
  url: string;
  sourceObj: Source;
}
