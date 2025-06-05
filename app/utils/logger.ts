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
  firstChapter?: unknown;
  lastChapter?: unknown;
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

  params?: any;
  params?: Record<string, unknown>;
  variants?: string[];
  original?: string;
  totalPages?: number;
  count?: number;
  variant?: string;
  sourceResults?: Array<{
    source: string;
    titleId: string;
    url: string;
  }>;
  resultsCount?: number;
  total?: number;
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