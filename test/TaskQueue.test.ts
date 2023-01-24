import { TaskQueue } from '../src';

describe('TaskQueue', () => {
  const sleepFactory = <T>(ms: number, res?: T) => {
    return () => new Promise<T>((resolve) => setTimeout(() => resolve(res), ms));
  };

  beforeEach(() => {
    jest.useRealTimers();
  });

  it('Can process single item', async () => {
    const queue = new TaskQueue<number>(1);
    expect(queue.getStats().processingCount).toBe(0);
    expect(queue.getStats().waitingCount).toBe(0);

    const result = queue.execute(sleepFactory(100, 42));
    expect(queue.getStats().processingCount).toBe(1);
    expect(queue.getStats().waitingCount).toBe(0);
    await expect(result).resolves.toBe(42);
    expect(queue.getStats().processingCount).toBe(0);
    expect(queue.getStats().waitingCount).toBe(0);
  });

  it('Can process multiple items', async () => {
    const queue = new TaskQueue<number>(3);
    const results = Promise.all([
      queue.execute(sleepFactory(100, 1)),
      queue.execute(sleepFactory(100, 2)),
      queue.execute(sleepFactory(100, 3)),
      queue.execute(sleepFactory(100, 4)),
      queue.execute(sleepFactory(100, 5)),
    ]);
    const preStats = queue.getStats();
    expect(preStats.processingCount).toBe(3);
    expect(preStats.waitingCount).toBe(2);

    await expect(results).resolves.toStrictEqual([1, 2, 3, 4, 5]);

    const postStats = queue.getStats();
    expect(postStats.processingCount).toBe(0);
    expect(postStats.waitingCount).toBe(0);
  });

  it('Can process multiple items', async () => {
    const queue = new TaskQueue<number>(3);
    const results = Promise.all([
      queue.execute(sleepFactory(50, 1)),
      queue.execute(sleepFactory(50, 2)),
      queue.execute(sleepFactory(50, 3)),
      queue.execute(sleepFactory(50, 4)),
      queue.execute(sleepFactory(50, 5)),
    ]);
    const preStats = queue.getStats();
    expect(preStats.processingCount).toBe(3);
    expect(preStats.waitingCount).toBe(2);

    await expect(results).resolves.toStrictEqual([1, 2, 3, 4, 5]);

    const postStats = queue.getStats();
    expect(postStats.processingCount).toBe(0);
    expect(postStats.waitingCount).toBe(0);
  });

  it('Can clear/destroy the queue', async () => {
    const queue = new TaskQueue<number>(3);
    const results = Promise.allSettled([
      queue.execute(sleepFactory(50, 1)),
      queue.execute(sleepFactory(50, 2)),
      queue.execute(sleepFactory(50, 3)),
      queue.execute(sleepFactory(50, 4)),
      queue.execute(sleepFactory(50, 5)),
    ]).then((results) => results.map((result) => result.status));

    await sleepFactory(0)();
    await queue.clear();

    await expect(results).resolves.toMatchInlineSnapshot(`
            Array [
              "fulfilled",
              "fulfilled",
              "fulfilled",
              "rejected",
              "rejected",
            ]
          `);
  });


  it('Will resolve in correct order', async () => {
    const queue = new TaskQueue<number>(1);
    const result = Promise.race([
      queue.execute(sleepFactory(500, 1)),
      queue.execute(sleepFactory(50, 2)),
    ])

    await expect(result).resolves.toBe(1)
  });
});
