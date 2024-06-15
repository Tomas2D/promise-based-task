import { isDeletable } from './types';

export class TaskMap<K, V> extends Map<K, V> {
  delete(key: K): boolean {
    if (this.has(key)) {
      const target = this.get(key);
      if (isDeletable(target)) {
        target.destructor();
      }
      return super.delete(key);
    }
    return false;
  }

  set(key: K, value: V): this {
    this.delete(key);

    return super.set(key, value);
  }

  clear(): void {
    for (const key of this.keys()) {
      this.delete(key);
    }

    super.clear();
  }
}
