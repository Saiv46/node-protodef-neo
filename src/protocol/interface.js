import * as defaultDatatypes from '../datatypes/index.mjs'
import { Serializer, Deserializer } from './serializer.js'
export { defaultDatatypes }

export default class ProtocolInterface {
  constructor ({ types = defaultDatatypes, ...namespace } = {}) {
    this.types = {}
    this.namespace = {}
    Object.entries(types).forEach(v => this.addType(...v))
    Object.entries(namespace).forEach(v => this.addNamespace(...v))
  }

  addType (name, data = 'native') {
    if (data === 'native') {
      data = this.types[name] || defaultDatatypes[name]
    }
    this.types[name] = data
    return this
  }

  addNamespace (name, data) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      data.types = Object.assign(this.types, data.types)
      this.namespace[name] = new this.constructor(data)
      return
    }
    this.addType(name, data)
    return this
  }

  read (name, ...args) { return this.get(name).read(...args) }
  write (name, ...args) { return this.get(name).write(...args) }
  sizeRead (name, ...args) { return this.get(name).sizeRead(...args) }
  sizeWrite (name, ...args) { return this.get(name).sizeWrite(...args) }
  createSerializer (name) { return new Serializer(this.get(name)) }
  createDeserializer (name) { return new Deserializer(this.get(name)) }
  toBuffer (name, ...args) {
    const inst = this.get(name)
    const buffer = Buffer.allocUnsafe(inst.sizeWrite(...args))
    inst.write(buffer, ...args)
    return buffer
  }

  fromBuffer (name, ...buf) {
    if (buf.length > 1) return buf.map(v => this.fromBuffer(name, v))
    return this.read(name, ...buf)
  }
}
