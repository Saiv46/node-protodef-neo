import cluster from 'cluster'
import { cpus } from 'os'
import Compiler from './compiler.mjs'
import Interpreter from './interpreter.mjs'

const workerPromise = new WeakMap()
const workerStatus = new WeakMap()
if (cluster.isMaster) {
  cluster.setupMaster({
    exec: './src/index.js',
    args: [],
    serialization: 'advanced',
    silent: true,
    windowsHide: true
  })
  cluster.on('online', worker => callWorker({ protocolData }, worker))
  cluster.on('exit', (worker, code) => {
    if (code) cluster.fork()
    workerStatus.delete(worker)
  })
  cluster.on('message', (worker, msg) => {
    workerStatus.set(worker, true)
    workerPromise.get(worker)(msg)
  })
  for (let i = 0, l = (cpus().length >>> 1) || 1; i < l; i++) {
    cluster.fork()
  }
}

async function getAvailableWorker () {
  for (const id in workers) {
    const worker = workers[id]
    if (workerStatus.get(worker)) return worker
  }
  // No workers available, sorry
  return new Promise(done => setTimeout(() => done(getAvailableWorker()), 10))
}
async function callWorker (data, worker) {
  if (isWorker) return processMessage(data)
  worker = worker || await getAvailableWorker()
  worker.send(data)
  workerStatus.set(worker, false)
  return new Promise(done => workerPromise.set(worker, done))
}
export const serialize = async (id, data) => callWorker({ id, data })
export const deserialize = async (id, buffer) => callWorker({ id, buffer })
export const initialize = async (protocol) => {
  protocolData = protocol
  for (const id in workers) {
    workers[id].process.kill()
  }
}

let protocolData
let interpreter
let compiler

function processMessage ({ id, data, buffer, protocol }) {
  if (protocol) {
    interpreter = new Interpreter(protocol)
    // compiler = new Compiler(protocol)
  }
}
