type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface LogData {
  error?: string;
  query?: string;
  type?: string;
  timing?: number;
  totalResults?: number;
  resultsCount?: number;
  sourcesCount?: number;
  timestamp?: string;
  errors?: Array<{ source: string; error: string }>;
  url?: string;
  count?: number;
  titles?: string[];
  status?: number;
  statusText?: string;
  total?: number;
  mangaId?: string;
  stack?: string;
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