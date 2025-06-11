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

// Define a generic search result item structure for sources
export interface SourceSearchResultItem {
  id: string; // Source-specific ID for the manga/item
  title: string;
  url: string; // URL to the manga page on the source
  cover?: string; // URL to the cover image, if available from search
  sourceName: string; // Name of the source, e.g., 'Mangakakalot'
  // Add any other common fields you might get from a basic search across different sources
}

export interface SourceSearchParams {
  refreshCache?: boolean;
}

export interface Source {
  name: string;
  baseUrl: string;
  adultContent?: boolean;
  // Updated search method to return an array of search result items and accept search params
  search: (title: string, params?: SourceSearchParams) => Promise<SourceSearchResultItem[]>; 
  getChapters: (titleId: string, url: string) => Promise<ChaptersResult>;
}

export interface SourceSearchResult {
  source: string;
  titleId: string;
  url: string;
  sourceObj: Source;
}
