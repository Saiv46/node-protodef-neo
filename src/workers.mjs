import { Worker } from 'worker_threads'
import { cpus } from 'os'

const workers = new Set()
const queue = new WeakMap()

function addTask (worker, ...args) {
  const tasks = queue.get(worker)
  const task = new Promise((resolve, reject) => {
    task.resolve = resolve
    task.reject = reject
    task.arguments = args
  })
  tasks.add(task)
  if (tasks.size === 1) runTask(worker, task.arguments)
  return task
}

function runTask (worker, args) {
  worker.postMessage(args, args.filter(v => v instanceof Buffer).map(v => v.buffer))
}

function handleTask (worker) {
  const tasks = queue.get(worker)
  const iter = tasks.values()
  const { value, done } = iter.next()
  if (!done) runTask(worker, iter.next().value.arguments)
  tasks.delete(value)
  return value
}

function createWorker (data, tasks = new Set()) {
  const worker = new Worker('./worker.mjs')
  worker.on('online', async () => {
    await addTask(worker, data)
    workers.add(worker)
    queue.set(worker, tasks)
  })
  worker.on('message', result => handleTask(worker).resolve(result))
  worker.on('error', error => handleTask(worker).reject(error))
  worker.on('exit', code => {
    if (code) createWorker(data, queue.get(worker))
    workers.delete(worker)
  })
}

export default function setupWorkers ({
  protocol,
  threads = (cpus().length >>> 1) || 1
}) {
  for (let i = 0; i < threads; i++) { createWorker(protocol) }
  function getWorker () {
    let lowest = 0
    let available
    for (const [worker, tasks] of queue) {
      if (!available || tasks.length < lowest) {
        lowest = tasks.length
        available = worker
      }
    }
    return available
  }
  return {
    read: buf => runTask(getWorker(), buf),
    write: val => runTask(getWorker(), val)
  }
}
