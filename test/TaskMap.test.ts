import { Task, TaskMap } from '../src';
import { TaskDestroyedException } from '../src/error';

describe('TaskMap', () => {
  it('Support single task', async () => {
    const map = new TaskMap();

    const taskA = new Task<number>();
    map.set('2021-12-23', taskA);
    taskA.resolve(42);

    await expect(map.get('2021-12-23')).resolves.toBe(42);
  });

  it('Throw when task is deleted from map and accessed directly later', async () => {
    const map = new TaskMap();
    await expect(() => {
      const taskA = new Task<number>();
      map.set('2021-12-23', taskA);
      map.delete('2021-12-23');
      return taskA;
    }).rejects.toThrow();
  });

  it('Throw when replaced from map and accessed again', async () => {
    const map = new TaskMap();
    await expect(() => {
      const taskA = new Task<number>();
      const taskB = new Task<number>();

      map.set('2021-12-23', taskA);

      taskB.resolve(42);
      map.set('2021-12-23', taskB);

      return taskA;
    }).rejects.toThrow();

    await expect(map.get('2021-12-23')!).resolves.toBe(42);
  });

  it('Complex workflow (happy path)', async () => {
    const map = new TaskMap<string, Task<number>>();
    map.set('2021-01-01', new Task<number>());

    // Work on a task
    setTimeout(() => {
      expect(map.size).toBe(1);
      map.get('2021-01-01').resolve(42);
      map.delete('2021-01-01');
      expect(map.size).toBe(0);
    }, 1000);

    // Concurrent wait for finish
    setTimeout(async () => {
      await expect(map.get('2021-01-01')).resolves.toEqual(42);
    }, 0);
    setTimeout(async () => {
      await expect(map.get('2021-01-01')).resolves.toEqual(42);
    }, 200);
    setTimeout(async () => {
      await expect(map.get('2021-01-01')).resolves.toEqual(42);
    }, 500);

    // Access later -> fail, because reference from map destroyed
    setTimeout(async () => {
      const task = map.get('2021-01-01');
      setTimeout(async () => {
        await expect(map.size).toBe(0);
        await expect(task).rejects.toThrow();
      }, 1500);
    }, 0);

    await new Promise((res) => setTimeout(res, 2000));
    await expect.assertions(7);
  });

  it('Complex workflow (not happy path)', async () => {
    const map = new TaskMap<string, Task<number>>();
    map.set('2021-01-01', new Task<number>());
    map.set('2021-02-01', new Task<number>());

    // Work on a first task
    setTimeout(() => {
      map.get('2021-01-01')!.resolve(42);
      map.delete('2021-01-01');
    }, 250);

    // Work on a second task
    setTimeout(() => {
      map.get('2021-02-01')!.reject(new Error('Server down'));
      map.delete('2021-02-01');
    }, 500);

    // Concurrent wait for finish
    setTimeout(async () => {
      await Promise.all([
        expect(map.get('2021-02-01')).rejects.toThrow(),
        expect(map.get('2021-01-01')).resolves.toEqual(42),
      ]);
    }, 0);

    await new Promise((res) => setTimeout(res, 1000));
    await expect.assertions(2);
  });

  it('Calls destructor on items removal', () => {
    const taskMap = new TaskMap([
      [1, new Task()],
      [2, new Task()],
      [3, new Task()],
    ]);
    expect(taskMap.size).toBe(3);

    // Extract tasks
    const tasks = Array.from(taskMap.values());
    tasks.forEach((task) => {
      jest.spyOn(task, 'destructor');
    });

    taskMap.clear();
    expect(taskMap.size).toBe(0);

    for (const task of tasks) {
      expect(task.destructor).toBeCalledTimes(1);
      expect(task).rejects.toThrow(TaskDestroyedException);
    }
  });
});
