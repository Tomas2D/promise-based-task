import { Task, SlidingTaskMap } from '../src';

describe('SlidingTaskMap', () => {
  it('Counts', async () => {
    const map = new SlidingTaskMap<string, Task<number>>(5);

    expect(map.size).toBe(0);
    map.set('1', new Task<number>(1));
    expect(map.size).toBe(1);
    map.delete('1');
    expect(map.size).toBe(0);
    map.set('2', new Task<number>(2));
    expect(map.size).toBe(1);
    map.set('2', new Task<number>(2));
    expect(map.size).toBe(1);
    map.clear();
    expect(map.size).toBe(0);
  });

  it('Slides', async () => {
    const WINDOW_SIZE = 5;
    const map = new SlidingTaskMap<string, Task<string>>(WINDOW_SIZE);

    const keys = Array.from({ length: 50 }).map((_, i) => String(i + 1));
    for (const key of keys) {
      const prevSize = Number(map.size);

      const task = new Task<string>(key);
      map.set(key, task);

      expect(map.has(key)).toBe(true);
      expect(map.get(key)).toEqual(task);
      expect(prevSize).toBeLessThanOrEqual(map.size);
      expect(map.size).toBeLessThanOrEqual(WINDOW_SIZE);
    }

    const resolvedValues = await Promise.all(Array.from(map.values()));
    expect(resolvedValues).toEqual(keys.slice(-WINDOW_SIZE));
  });

  it('Throws with invalid window size', async () => {
    expect(() => new SlidingTaskMap(0)).toThrow();

    // @ts-expect-error simulating no type safety env
    expect(() => new SlidingTaskMap()).toThrow();

    // @ts-expect-error simulating no type safety env
    expect(() => new SlidingTaskMap([])).toThrow();

    // @ts-expect-error simulating no type safety env
    expect(() => new SlidingTaskMap('x')).toThrow();
  });

  it('Removes element from front (shift)', async () => {
    const map = new SlidingTaskMap<string, Task<number>>(5);
    expect(map.pop()).toBe(false);
    expect(map.shift()).toBe(false);

    const tasks = [new Task<number>(), new Task<number>(), new Task<number>()];

    map.set('1', tasks[0]);
    map.set('2', tasks[1]);
    map.set('3', tasks[2]);

    expect(map.size).toBe(3);

    expect(map.pop()).toBe(true);
    expect(map.size).toBe(2);
    expect(map.has('1')).toBe(true);
    expect(map.has('2')).toBe(true);
    expect(map.has('3')).toBe(false);

    expect(map.shift()).toBe(true);
    expect(map.size).toBe(1);
    expect(map.has('1')).toBe(false);
    expect(map.has('2')).toBe(true);
    expect(map.has('3')).toBe(false);

    expect(map.pop()).toBe(true);
    expect(map.size).toBe(0);
    expect(map.has('1')).toBe(false);
    expect(map.shift()).toBe(false);
  });
});
