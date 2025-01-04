interface CacheEntry {
  data: any;
  timestamp: number;
}

export class Cache {
  private cache: { [key: string]: CacheEntry } = {};
  private ttl: number;

  constructor(ttl: number = 3600000) { // 1 heure par défaut
    this.ttl = ttl;
  }

  set(key: string, data: any): void {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }

  get(key: string): any | null {
    const entry = this.cache[key];
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      delete this.cache[key];
      return null;
    }

    return entry.data;
  }
} 