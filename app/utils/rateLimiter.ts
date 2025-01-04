export class RateLimiter {
  private requests: { [key: string]: number[] } = {};
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 10, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  canMakeRequest(source: string): boolean {
    const now = Date.now();
    if (!this.requests[source]) {
      this.requests[source] = [];
    }

    this.requests[source] = this.requests[source].filter(
      time => now - time < this.timeWindow
    );

    if (this.requests[source].length < this.maxRequests) {
      this.requests[source].push(now);
      return true;
    }

    return false;
  }
} 