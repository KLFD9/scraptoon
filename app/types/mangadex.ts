export interface MangaDexTag {
  group: string;
  name: {
    en: string;
    fr?: string;
    [key: string]: string | undefined;
  };
}

export interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: {
    fileName?: string;
    name?: string;
  };
}

export interface MangaDexManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    year?: string;
    status?: string;
    originalLanguage?: string;
    links?: Record<string, string>;
    tags: MangaDexTag[];
    availableTranslatedLanguages: string[];
  };
  relationships: MangaDexRelationship[];
}

export interface MangaDexMangaResponse {
  data: MangaDexManga;
}

export interface MangaDexChapter {
  id: string;
  attributes: {
    chapter?: string;
    title?: string;
    publishAt?: string;
    translatedLanguage: string;
  };
}

export interface MangaDexChaptersResponse {
  data: MangaDexChapter[];
}

export interface MangaDexAggregateVolume {
  chapters: Record<string, { translatedLanguage: string }>;
}

export interface MangaDexAggregate {
  volumes?: Record<string, MangaDexAggregateVolume>;
}

export interface MangaDexSearchResponse {
  data: MangaDexManga[];
  total?: number;
}
