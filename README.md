# 🛤 promise-based-task

[![CI](https://github.com/Tomas2D/promise-based-task/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Tomas2D/promise-based-task/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/Tomas2D/promise-based-task/branch/main/graph/badge.svg?token=SQA7VM6XIV)](https://codecov.io/gh/Tomas2D/promise-based-task)

With this tiny library, you will be able to solve situations where you want to prevent  
multiple requests to do time-consuming operations simultaneously.
With this approach, one request will take care of creating the final data and other processes
will asynchronously wait for the completion. 

**NOTE:** This library is useful if you need a lightweight solution without an extra service like Redis / PubSub etc.

Does this library help you? Please give it a ⭐️!

## ✨️ Features

- Later resolving of a task in a `Promise` way
- Auto rejecting promises removed from the shared data structure (`TaskMap`, which is an extension of a `Map` data structure)
- Zero dependencies
- Map with limited space (sliding-window)
- Task Queue mechanism

## 🚀 Installation

```
yarn add promise-based-task
```
```
npm install promise-based-task
```

## 🤘🏻 Usage

**Single task**
```typescript
import { Task } from 'promise-based-task'

let pricesTask: Task<number[]> | null = null

app.get('/prices', async function (req, res) {
  if (pricesTask === null) {
    pricesTask = new Task<number[]>();

    const result = await longRunningTask()
    pricesTask.resolve(result)
  }

  const prices = await pricesTask
  res.json(prices)
})
```

**Multiple tasks (without removing)**

This type is useful when you want to cache data that are not so huge, but
their creation is expensive. Following code prevents multiple requests to react the
critical section of generating the data.

```typescript
import { Task, TaskMap } from 'promise-based-task'

let pricesTasks: TaskMap<string, number[]> = new TaskMap<string, number[]>()

app.get('/prices/:date', async function (req, res) {
  const date = req.params.date

  if (!pricesTasks.has(date)) {
    const task = new Task<number[]>();
    pricesTasks.set(date, task)

    const result = await longRunningTask(date)
    task.resolve(result)
  }

  const prices = await pricesTasks.get(date)
  res.json(prices)
})
```

**Multiple tasks (with removing)**

Sometimes you do not want to store results in memory because results can be enormous in size
and thus, your server can run out of his memory pretty fast.

Following code prevents multiple requests to trigger the process of transforming data to
desired shape and uploading them to S3.

```typescript
import { Task, TaskMap } from 'promise-based-task'

const tasks: TaskMap<string, void> = new TaskMap<string, void>()

app.get('/observations/:date', async function (req, res) {
  const date = req.params.date

  if (tasks.has(date)) {
    await tasks.get(date)
  } else {
    const task = new Task<void>()
    tasks.set(date, task)

    const rawData = await fetchData(date)
    const data = await analyzeData(rawData)
    await uploadDataToS3(data)

    task.resolve()
    tasks.delete(date)
  }

  downloadDataFromS3(date).pipe(res)
})
```

**Task Queue**

```typescript
// Type Definition
declare class TaskQueue<T> {
  constructor(queueSize?: number); // default is 1
  clear(): Promise<void>;
  execute(fn: () => Promise<T>): Promise<T>;
  getStats(): {
    processingCount: number;
    waitingCount: number;
  };
}
```

You want to use the Task Queue when you want to throttle requests/executions of given part of your system.

```typescript
const queue = new TaskQueue<IScrapeResult>(5)

app.get('/scrape/:source', async function (req, res) {
  const source = req.params.source
  const response = await queue.execute(async () => {
    // this function will run by the queue mechanism
    return service.scrape(source)
  })
  
  res.json(response)
})

app.get('/scrape/status', async function (req, res) {
  const { processingCount, waitingCount } = queue.getStats()
  
  return res.json({
    processingCount,
    waitingCount,
  })
})
```

**Sliding window**
```typescript
// Type Definition
declare class SlidingTaskMap<K, V extends Deletable> extends TaskMap<K, V> {
  constructor(windowSize: number, ttl?: number);
  set(key: K, value: V, customTTL?: number): this; // create/override 
  delete(key: K): boolean; // remove single entry
  clear(): void;  // removes all entries
  pop(): boolean; // removes oldest entry, false for an empty window
  shift(): boolean;  // removes newest entry, false for an empty window
}
```

When your map size reaches a specified threshold, the oldest values will be
removed. You can be then sure that the size of the map will never overflow your memory.

```typescript
import { Task, SlidingTaskMap } from 'promise-based-task'

const WINDOW_SIZE = 10
const TTL = 60 * 1000 // data will persist 60 seconds in a cache
const tasks = new SlidingTaskMap<string, number[]>(WINDOW_SIZE, TTL)

app.get('/calculation/:date', async function () {
  const date = req.params.date

  if (!tasks.has(date)) {
    const task = new Task<void>()
    tasks.set(date, task)

    const data = await fetchData(date)
    task.resolve(data)
  }

  return tasks.get(date)
})
```

When your map size reaches a specified threshold, the oldest values will be
removed. You can be then sure that the size of the map will never overflow your memory.

```typescript
import { Task, SlidingTaskMap } from 'promise-based-task'

const WINDOW_SIZE = 10
const TTL = 60 * 1000 // data will persist 60 seconds in a cache
const tasks = new SlidingTaskMap<string, number[]>(WINDOW_SIZE, TTL)

app.get('/calculation/:date', async function () {
  const date = req.params.date

  if (!tasks.has(date)) {
    const task = new Task<void>()
    tasks.set(date, task)
    
    const data = await fetchData(date)
    task.resolve(data)
  }
  
  return tasks.get(date)
})
```
