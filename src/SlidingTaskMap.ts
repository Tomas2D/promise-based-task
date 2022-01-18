import { Deletable } from './types';
import TaskMap from './TaskMap';

class SlidingTaskMap<K, V extends Deletable> extends TaskMap<K, V> {
  private keysByTime: K[] = [];

  constructor(private readonly windowSize: number) {
    super();
    if (windowSize < 1 || isNaN(Number(windowSize))) {
      throw new TypeError(`windowSize cannot be less than 1!`);
    }
  }

  set(key: K, value: V): this {
    if (this.has(key)) {
      return super.set(key, value);
    }

    if (this.size + 1 > this.windowSize) {
      this.delete(this.keysByTime[0]);
    }
    this.keysByTime.push(key);
    return super.set(key, value);
  }

  delete(key: K): boolean {
    const didDelete = super.delete(key);
    if (didDelete) {
      const deleteIndex = this.keysByTime.indexOf(key);
      this.keysByTime.splice(deleteIndex, 1);
    }
    return didDelete;
  }

  clear() {
    super.clear();
    this.keysByTime.length = 0;
  }
}

export default SlidingTaskMap;
