import puppeteer, { Browser } from 'puppeteer';

class BrowserPool {
  private pool: Browser[] = [];
  private queue: Array<(browser: Browser) => void> = [];
  private active = 0;

  constructor(private size: number = 2) {}

  private async createBrowser(): Promise<Browser> {
    return puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });
  }

  async getBrowser(): Promise<Browser> {
    if (this.pool.length > 0) {
      this.active++;
      return this.pool.pop() as Browser;
    }
    if (this.active < this.size) {
      this.active++;
      return this.createBrowser();
    }
    return new Promise(resolve => {
      this.queue.push(browser => resolve(browser));
    });
  }

  release(browser: Browser) {
    this.pool.push(browser);
    this.active--;
    const next = this.queue.shift();
    if (next) {
      this.getBrowser().then(next);
    }
  }
}

export const browserPool = new BrowserPool(2);
