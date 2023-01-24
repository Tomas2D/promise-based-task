import { Task } from './Task'
import { TaskDestroyedException } from './error';

interface IWaitingTask<T> {
  task: Task<T>
  resolver: () => Promise<void>
}

export class TaskQueue<T> {
  private _waitingQueue: Array<IWaitingTask<T>> = []
  private _unlockQueue: Array<Task<void>> = []


  private readonly _queueSize: number
  private _processingCount = 0

  constructor(queueSize?: number) {
    this._queueSize = Math.max(Number(queueSize), 1)
  }

  private async _internalSync() {
    if (this._processingCount >= this._queueSize) {
      const waitForUnlockTask = new Task<void>()
      this._unlockQueue.push(waitForUnlockTask)
      await waitForUnlockTask
    }

    const task = this._waitingQueue.shift()
    if (task) {
      await task.resolver()
    }
  }

  async clear() {
    this._waitingQueue.forEach(item => item.task.reject(new TaskDestroyedException()))
    this._unlockQueue.forEach(item => item.reject(new TaskDestroyedException()))

    this._unlockQueue.length = 0
    this._waitingQueue.length = 0
    this._processingCount = 0
  }

  async execute(fn: () => Promise<T>): Promise<T> {
    const task = new Task<T>()
    this._waitingQueue.push({
      task,
      resolver: async () => {
        this._processingCount++

        const cleanup = () => {
          this._processingCount--
          const unlockTask = this._unlockQueue.shift()
          unlockTask?.resolve()
        }

        return fn()
          .then((res) => {
            cleanup();
            task.resolve(res);
          })
          .catch(e => {
            cleanup();
            task.reject(e);
          })
      }
    })

    this._internalSync().catch(() => {})

    return task
  }

  getStats() {
    return {
      processingCount: this._processingCount,
      waitingCount: this._waitingQueue.length,
    }
  }
}
