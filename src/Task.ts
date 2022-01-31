import type { Deletable } from './types';
import { TaskDestroyedException } from './error';

class Task<T> implements Promise<T>, Deletable {
  private promise: Promise<T>;
  public resolve!: (value: T | PromiseLike<T>) => void;
  public reject!: (reason?: any) => void;

  constructor(immediatelyResolveValue?: T) {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    if (immediatelyResolveValue !== undefined) {
      this.resolve(immediatelyResolveValue);
    }

    // Prevent "UnhandledPromiseRejectionWarning"
    this.promise.catch(() => {});
  }

  destructor(): void {
    this.reject(new TaskDestroyedException('Object already destroyed'));
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => PromiseLike<TResult1> | TResult1) | undefined | null,
    onrejected?: ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled).catch(onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.promise.finally(onfinally);
  }

  readonly [Symbol.toStringTag]: string;
}

export default Task;
