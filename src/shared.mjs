import { Transform as _Transform } from 'stream' // TODO: Use readable-stream
import * as defaultDatatypes from './datatypes'

export class Protocol {
  constructor ({ types, ...namespaces }) {
    this.types = {}
    this.cache = new Map()
    this.namespace = {}
    this.rootContext = new Context()
    Object.entries(types).forEach(v => this.addType(...v))
    Object.entries(namespaces).forEach(v => this.addNamespace(...v))
  }

  _getType (data, context = this.rootContext) {
    const [type, args] = Array.isArray(data) ? data : [data]
    if (args) {
      if (type) {
        args.type = this._getType(args.type, context.child())
      }
      if (countType) {
        args.countType = this._getType(args.countType, context.child())
      }
    }
    return new type(args, context)
  }

  addType (name, data = 'native') {
    if (data === 'native') {
      data = this.types[name] || defaultDatatypes[name]
    }
    this.types[name] = this._getType(data)
  }

  addNamespace (name, { types, ...data }) {
    this.namespace[name] = new this.constructor({ types: { ...this.types, ...types }, ...data })
  }

  get (name) {
    if (typeof name === 'string') {
      if (!this.cache.has(name)) {
        this.cache.set(name, this.get(name.split('.')))
      }
      return this.cache.get(name)
    }
    const [current, ...nested] = name
    if (nested.length) {
      try {
        return this.namespace[current].get(nested)
      } catch (e) {
        if (e instanceof Error) {
          e.message += `.${nested[0]}`
        }
        throw e
      }
    }
    const type = this.types[current]
    if (!type) {
      throw new Error(`Missing data type ${current}`)
    }
    return this._process(type)
  }

  read (name, ...args) { return this.get(name).read(...args) }
  write (name, ...args) { return this.get(name).write(...args) }
  sizeRead (name, ...args) { return this.get(name).sizeRead(...args) }
  sizeWrite (name, ...args) { return this.get(name).sizeWrite(...args) }
  createSerializer (name) { return new Serializer(this.get(name)) }
  createDeserializer (name) { return new Deserializer(this.get(name)) }
}

class Transform extends _Transform {
  constructor (inst, args) {
    super(args)
    this.instance = inst
  }

  async _transform (val, _, cb) {
    try { cb(null, await this._asyncTransform(val)) } catch (e) { cb(e) }
  }
}

class Serializer extends Transform {
  constructor (inst) {
    super(inst, { writableObjectMode: true }, false)
  }

  _asyncTransform (val) {
    const buf = Buffer.allocUnsafe(this.instance.sizeWrite(val))
    this.instance.write(buf, val)
    return buf
  }
}

class Deserializer extends Transform {
  constructor (inst) {
    super(inst, { readableObjectMode: true }, true)
  }

  _asyncTransform (val) { return this.instance.read(val) }
}
