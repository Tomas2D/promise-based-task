import { Task } from '../src';

const noop = () => {};
const identity = <T>(x: T): T => x;

describe('Task', () => {
  it('Behaves like a promise', async () => {
    const task = new Task();
    task.resolve(42);

    const errCallback = jest.fn();
    const finallyCallback = jest.fn();

    task.catch(errCallback);
    task.finally(finallyCallback);

    await expect(errCallback).not.toHaveBeenCalled();
    await expect(finallyCallback).toBeCalledTimes(1);
    await expect(task).resolves.toBe(42);
  });

  it('Catch on reject', async () => {
    const task = new Task();
    task.reject('err');
    await expect(task).rejects.toBe('err');
  });

  it('Allow create instance with immediately resolve value', async () => {
    const task = new Task<number>(42);
    await expect(task).resolves.toBe(42);
  });

  it('Ignores double resolve', async () => {
    const task = new Task<number>();
    task.resolve(42);
    task.resolve(100);
    await expect(task).resolves.toBe(42);
  });

  it('Ignores double reject', async () => {
    const task = new Task<number>();
    task.reject('nah');
    task.reject(100);
    await expect(task).rejects.toBe('nah');
  });

  it('Will throw if there are some not served observers', async () => {
    const task: Task<number> = new Task();

    const observers = [task.then(noop), task.then(noop), task.then(noop)];
    task.destructor();
    for (const observer of observers) {
      await expect(observer).rejects.toBeInstanceOf(Error);
    }
  });

  it('Will not reject if already resolved', async () => {
    const task: Task<number> = new Task();
    const observers = [task.then(identity), task.then(identity), task.then(identity)];

    task.resolve(42);

    task.reject(new Error());
    task.destructor();

    for (const observer of observers) {
      await expect(observer).resolves.toBe(42);
    }
  });

  it('Will not throw if there are no observers', () => {
    const task: Task<number> = new Task();
    expect(() => {
      task.destructor();
    }).not.toThrow();
  });
});
