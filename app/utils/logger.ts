type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface ChapterInfo {
  id: string;
  chapter: string;
  title: string | null;
  publishedAt: string | null;
  url: string;
  source: string;
}

export interface LogData {
  error?: string;
  stack?: string;
  attempt?: number;
  url?: string;
  mangaId?: string;
  query?: string;
  searchQuery?: string;
  html?: string;
  timestamp?: string;
  page?: number;
  limit?: number;
  chaptersCount?: number;
  status?: number;
  statusText?: string;
  response?: unknown;
  title?: string;
  titles?: string[];
  availableLanguages?: string[];
  source?: string;
  titleId?: string;
  totalChapters?: number;
  firstChapter?: ChapterInfo;
  lastChapter?: ChapterInfo;
  cacheKey?: string;
  executionTime?: number;
  maxRetries?: number;
  delay?: number;
  blockStatus?: {
    isBlocked: boolean;
    hasValidContent: boolean;
    indicators: Record<string, boolean>;
  };

  params?: Record<string, unknown>;
  variants?: string[];
  original?: string;
  totalPages?: number;
  count?: number;
  favoritesCount?: number;
  candidatesCount?: number;
  needed?: number;
  author?: string;
  reason?: string;
  candidate?: string;
  favorite?: string;
  commonWords?: string[];  total?: number;
  sourceResults?: any;
  resultsCount?: number;
  historyCount?: number;
  excludeIds?: string[];
  authors?: string[];
  favoritesDetails?: any[];
  isValidPage?: boolean;
  pageStatus?: {
    hasValidContent: boolean;
    errors: Record<string, boolean>;
  };
  proxyInfo?: {
    ip: string;
    country: string;
    status: string;
  };
  // Additional properties for better logging
  index?: number;
  chapterId?: string;
  redisUrl?: string;
}

export const logger = {
  log(level: LogLevel, message: string, data?: LogData) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry, null, 2));
        break;
      case 'warning':
        console.warn(JSON.stringify(logEntry, null, 2));
        break;
      case 'debug':
        console.debug(JSON.stringify(logEntry, null, 2));
        break;
      default:
        console.log(JSON.stringify(logEntry, null, 2));
    }
  }
};