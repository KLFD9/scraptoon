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
  htmlExcerpt?: string; // Added for Cloudflare detection logging
  refreshCache?: boolean;
  cacheKey?: string;
  source?: string;
  count?: number;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  params?: any;
  results?: any[];
  durationMs?: number;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  platform?: string;
  screenResolution?: string;
  language?: string;
  timezone?: string;
  path?: string;
  method?: string;
  body?: any;
  response?: any;
  component?: string;
  action?: string;
  details?: any;
  statusCode?: number;
  errorMessage?: string;
  errorDetails?: any;
  performance?: any;
  featureFlags?: Record<string, boolean>;
  abTestVariant?: string;
  correlationId?: string;
  serviceName?: string;
  operationName?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  // Fields identified from error messages
  methodName?: string;
  receivedParams?: any;
  refreshCacheValue?: boolean;
  paramsProperties?: string[];
  refreshCacheValDirect?: boolean;
  receivedRefreshCache?: boolean;
  capturedRefreshCacheAtExecution?: boolean;
  loopCycleRefreshCache?: boolean;
  resultsReceived?: any;
  uniqueCount?: number;
  totalCount?: number;
  resultsCount?: number;
  timestamp?: string; // Assuming this is a string like Date().toISOString()
  executionTime?: number;
  total?: number; // From MangaDex related logs
  // Added based on new errors
  chapterId?: string;
  config?: any; // Consider a more specific type if possible
  step?: string | number;
  selector?: string;
  images?: any[] | number; // Changed from any[] to allow number (e.g. count)
  titles?: any[]; // Consider a more specific type if possible
  loading?: boolean;
  titleId?: string;
  totalPages?: number;
  page?: number | string;
  favoritesCount?: number; // Added for ModernRecommendationsSection.tsx
  // ... any other relevant fields
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