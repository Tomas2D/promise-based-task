import type { Deletable } from './types';
import { TaskMap } from './TaskMap';

export class SlidingTaskMap<K, V extends Deletable> extends TaskMap<K, V> {
  private readonly keysByTime: K[] = [];
  private readonly ttlMap: Map<K, NodeJS.Timeout> = new Map();

  constructor(private readonly windowSize: number, private readonly ttl?: number) {
    super();

    if (windowSize < 1 || isNaN(windowSize)) {
      throw new TypeError(`windowSize cannot be less than 1!`);
    }
    this.windowSize = Number(windowSize);

    if (ttl !== undefined && ttl !== Number.POSITIVE_INFINITY) {
      if (isNaN(ttl) || ttl < 1) {
        throw new TypeError(`ttl cannot be less than 1!`);
      } else {
        this.ttl = Number(ttl);
      }
    }
  }

  private clearTimeout(key: K) {
    if (this.ttlMap.has(key)) {
      clearTimeout(this.ttlMap.get(key)!);
      this.ttlMap.delete(key);
    }
  }

  private setTimeout(key: K, customTTL?: number) {
    const ttl = Number(customTTL ?? this.ttl);

    if (ttl > 0 && ttl !== Number.POSITIVE_INFINITY) {
      const timeoutId = setTimeout(() => {
        this.delete(key);
      }, ttl);

      this.ttlMap.set(key, timeoutId);
    }
  }

  set(key: K, value: V, customTTL?: number): this {
    if (this.has(key)) {
      super.set(key, value);
    } else {
      if (this.size + 1 > this.windowSize) {
        this.shift();
      }

      this.keysByTime.push(key);
      super.set(key, value);
    }

    this.setTimeout(key, customTTL);
    return this;
  }

  delete(key: K): boolean {
    const didDelete = super.delete(key);
    if (didDelete) {
      this.clearTimeout(key);
      const deleteIndex = this.keysByTime.indexOf(key);
      this.keysByTime.splice(deleteIndex, 1);
    }
    return didDelete;
  }

  clear(): void {
    super.clear();
    this.keysByTime.length = 0;
    this.ttlMap.clear();
  }

  pop(): boolean {
    if (this.keysByTime.length === 0) {
      return false;
    }

    const key = this.keysByTime[this.keysByTime.length - 1];
    return this.delete(key);
  }

  shift(): boolean {
    if (this.keysByTime.length === 0) {
      return false;
    }

    const key = this.keysByTime[0];
    return this.delete(key);
  }
}
