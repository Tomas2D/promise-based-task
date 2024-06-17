import type { Deletable } from './types';
import { TaskDestroyedException } from './error';

export enum TaskState {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

export interface TaskInput {
  signal?: AbortSignal
}

export class Task<T, E = any> implements Promise<T>, Deletable {
  private _promise: Promise<T>;
  private _resolve!: (value: T) => void
  private _reject!: (error: E) => void

  private _state: TaskState = TaskState.PENDING
  private _resolvedValue: Readonly<T> | undefined
  private _rejectedValue: E | undefined

  constructor(input?: TaskInput) {
    this._promise = new Promise<T>((_resolve, _reject) => {
      this._resolve = (...args) => {
        if (this.state === TaskState.PENDING) {
          this._state = TaskState.RESOLVED
          this._resolvedValue = args.at(0)
          _resolve(...args);
        }
      }
      this._reject = (...args) => {
        if (this.state === TaskState.PENDING) {
          this._state = TaskState.REJECTED
          this._rejectedValue = args.at(0)
          _reject(...args);
        }
      }
    });

    this._promise.catch(() => {
      /* Prevent "UnhandledPromiseRejectionWarning" */
    });

    input?.signal?.addEventListener?.("abort", () => {
      this.reject(new TaskDestroyedException("Task has been aborted!") as E)
    }, {
      once: true,
    })
  }

  static resolve<A>(value: A) {
    const instance = new Task<A>()
    instance.resolve(value)
    return instance
  }

  resolve(value: T) {
    this._resolve(value)
  }

  reject(reason: E) {
    this._reject(reason)
  }

  destructor(): void {
    this.reject(new TaskDestroyedException('Object already destroyed') as E);
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

  resolvedValue(): Readonly<T> | undefined {
    return this._resolvedValue
  }

  rejectedValue(): E | undefined {
    return this._rejectedValue
  }

  get [Symbol.toStringTag]() {
    return Task.name
  }
}
