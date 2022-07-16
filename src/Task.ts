import type { Deletable } from './types';
import { TaskDestroyedException } from './error';

export enum TaskState {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

class Task<T> implements Promise<T>, Deletable {
  private _promise: Promise<T>;
  private _state: TaskState = TaskState.PENDING

  public resolve!: (value: T | PromiseLike<T>) => void;
  public reject!: (reason?: any) => void;

  constructor(immediatelyResolveValue?: T) {
    this._promise = new Promise<T>((_resolve, _reject) => {
      this.resolve = function resolve(...args) {
        this._state = TaskState.RESOLVED
        _resolve(...args);
      }
      this.reject = function reject(...args) {
        this._state = TaskState.REJECTED
        _reject(...args);
      }
    });

    if (arguments.length > 0) {
      this.resolve(immediatelyResolveValue as T);
    }

    this._promise.catch(() => { /* Prevent "UnhandledPromiseRejectionWarning" */ });
  }

  destructor(): void {
    this.reject(new TaskDestroyedException('Object already destroyed'));
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => PromiseLike<TResult1> | TResult1) | undefined | null,
    onrejected?: ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled).catch(onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<T | TResult> {
    return this._promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this._promise.finally(onfinally);
  }

  get state(): TaskState {
    return this._state
  }

  get [Symbol.toStringTag]() {
    return Task.name
  }
}

export default Task;
