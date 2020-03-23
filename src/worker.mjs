import Interpreter from './interpreter.mjs'
import { parentPort } from 'worker_threads'

let instance
let buffer = Buffer.allocUnsafe(2 ** 21) // 2 MB

function processMessage (value) {
  if (value && value instanceof Buffer) {
    return instance.read(value)
  }
  const len = instance.sizeWrite(value)
  if (buffer.length < len) {
    buffer = Buffer.allocUnsafe(len)
  }
  instance.write(buffer, value)
  return buffer.slice(0, len)
}

parentPort.once('message', value => {
  instance = new Interpreter(value)
  parentPort.on('message', value => parentPort.postMessage(processMessage(value)))
})
