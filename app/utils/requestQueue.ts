export interface RequestQueueOptions {
  maxConcurrent: number;
  maxQueueSize: number;
}

export class RequestQueue {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private options: RequestQueueOptions) {}

  async add<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.options.maxConcurrent && this.queue.length >= this.options.maxQueueSize) {
      throw new Error('Queue limit reached');
    }

    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        this.active++;
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.active--;
          this.next();
        }
      };

      if (this.active < this.options.maxConcurrent) {
        void run();
      } else {
        this.queue.push(run);
      }
    });
  }

  private next() {
    if (this.active < this.options.maxConcurrent && this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) void fn();
    }
  }
}
