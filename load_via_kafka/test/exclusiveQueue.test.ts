jest.mock('async-mutex', () => {
  return {
    Mutex: class {
      // For the unit test just resolve promises immediately.
      runExclusive<T>(callback: () => T | Promise<T>): Promise<T> {
        return Promise.resolve(callback());
      }
    },
  };
});

import { AsyncQueue } from '../src/asyncQueue';

describe('AsyncQueue', () => {
  let queue: AsyncQueue<number>;

  beforeEach(() => {
    queue = new AsyncQueue<number>();
  });

  it('increments length when items are pushed into the queue', async () => {
    let length: number;

    await queue.push(1);
    length = await queue.getLength();
    expect(length).toBe(1);

    await queue.push(2);
    length = await queue.getLength();
    expect(length).toBe(2);
  });
  it('splices items out of the queue', async () => {
    for (const value of [1, 2, 3]) {
      await queue.push(value);
    }

    const firstSplice = await queue.splice(0, 2);
    expect(firstSplice).toEqual([1, 2]);

    const secondSplice = await queue.splice(0, 1);
    expect(secondSplice).toEqual([3]);
  });
});
