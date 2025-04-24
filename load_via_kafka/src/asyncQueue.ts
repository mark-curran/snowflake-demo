import { Mutex } from 'async-mutex';

export class AsyncQueue<T> {
  private queue: T[] = [];
  private mutex = new Mutex();

  async push(item: T): Promise<void> {
    await this.mutex.runExclusive(async () => this.queue.push(item));
  }

  async splice(start: number, deleteCount?: number): Promise<T[]> {
    return await this.mutex.runExclusive(async () =>
      this.queue.splice(start, deleteCount),
    );
  }

  async getLength(): Promise<number> {
    return await this.mutex.runExclusive(async () => this.queue.length);
  }
}
