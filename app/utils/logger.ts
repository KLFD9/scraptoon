type LogLevel = 'info' | 'warning' | 'error' | 'debug';

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
  response?: any;
  title?: string;
  titles?: string[];
  availableLanguages?: string[];
  source?: string;
  titleId?: string;
  totalChapters?: number;
  firstChapter?: any;
  lastChapter?: any;
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
  googleUrl?: string;
  pageInfo?: {
    hasTitle: boolean;
    hasSynopsis: boolean;
    hasCover: boolean;
    hasInfo: boolean;
    hasChapters: boolean;
    title: string | null;
  };
  elements?: {
    hasTitle: boolean;
    hasSynopsis: boolean;
    hasCover: boolean;
    hasInfo: boolean;
    hasChapters: boolean;
    title: string | null;
  };
  formattedTitle?: string;
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