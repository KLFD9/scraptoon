import { RateLimiter } from './rateLimiter';
import { retry } from './retry';
import { RequestQueue } from './requestQueue';

const limiterMap: Record<string, RateLimiter> = {};
const queue = new RequestQueue(5);

function getLimiter(source: string) {
  if (!limiterMap[source]) {
    limiterMap[source] = new RateLimiter(5, 1000);
  }
  return limiterMap[source];
}

export async function httpRequest(
  url: string,
  options?: RequestInit,
  source: string = 'default'
): Promise<Response> {
  const limiter = getLimiter(source);

  return queue.add(async () => {
    while (!limiter.canMakeRequest(source)) {
      await new Promise(r => setTimeout(r, 100));
    }
    return retry(() => fetch(url, options), 3, 500);
  });
}
