export class RequestQueue {
  private queue: Array<() => void> = [];
  private activeCount = 0;

  constructor(private concurrency: number = 5) {}

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        this.activeCount++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeCount--;
          const next = this.queue.shift();
          if (next) next();
        }
      };

      if (this.activeCount < this.concurrency) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}
