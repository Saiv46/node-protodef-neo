import { Transform as _Transform } from 'stream' // TODO: Use readable-stream
import { Context } from './datatypes/_shared.mjs'
import * as defaultDatatypes from './datatypes/index.mjs'

export class Protocol {
  constructor ({ types = defaultDatatypes, ...namespaces } = {}) {
    this.types = {}
    this.cache = new Map()
    this.namespace = {}
    this.rootContext = new Context()
    Object.entries(types).forEach(v => this.addType(...v))
    Object.entries(namespaces).forEach(v => this.addNamespace(...v))
  }

  _resolveTypeNesting (Type) {
    const rtn = v => this._resolveTypeNesting(v)
    function argsRecursive (v) {
      if (typeof v === 'string') return rtn(v)
      if (Array.isArray(v)) return v.map(argsRecursive)
      if (v.type) { v.type = rtn(v.type) }
      if (v.fields) { for (const k in v.fields) { v.fields[k] = rtn(v.fields[k]) } }
      if (v.countType) { v.countType = rtn(v.countType) }
      if (v.default) { v.default = rtn(v.default) }
      return v
    }
    let args
    if (Array.isArray(Type)) [Type, args] = Type
    if (typeof Type === 'string') {
      if (!this.types[Type]) throw new Error(`Datatype "${Type}" not defined`)
      Type = this.types[Type]
    }
    if (Array.isArray(Type)) { Type = rtn(Type) }
    return args ? [Type, argsRecursive(args)] : Type
  }

  addType (name, data = 'native') {
    if (data === 'native') {
      data = this.types[name] || defaultDatatypes[name]
    }
    this.types[name] = data
  }

  addNamespace (name, data) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      data.types = Object.assign(this.types, data.types)
      this.namespace[name] = new this.constructor(data)
      return
    }
    this.addType(name, data)
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
      return this.namespace[current].get(nested)
    }
    let type = this.types[current]
    if (!type) {
      throw new Error(`Missing data type ${current}`)
    }
    type = this._resolveTypeNesting(type)
    return this._process(type)
  }

  read (name, ...args) { return this.get(name).read(...args) }
  write (name, ...args) { return this.get(name).write(...args) }
  sizeRead (name, ...args) { return this.get(name).sizeRead(...args) }
  sizeWrite (name, ...args) { return this.get(name).sizeWrite(...args) }
  createSerializer (name) { return new Serializer(this.get(name)) }
  createDeserializer (name) { return new Deserializer(this.get(name)) }
}

export class Transform extends _Transform {
  constructor (inst, args) {
    super(args)
    this.instance = inst
  }

  _transform (val, _, cb) {
    try { cb(null, this._asyncTransform(val)) } catch (e) { cb(e) }
  }
}

export class Serializer extends Transform {
  constructor (inst) { super(inst, { writableObjectMode: true }) }
  _asyncTransform (val) {
    const buf = Buffer.allocUnsafe(this.instance.sizeWrite(val))
    this.instance.write(buf, val)
    return buf
  }
}

export class Deserializer extends Transform {
  constructor (inst) { super(inst, { readableObjectMode: true }) }
  _asyncTransform (val) { return this.instance.read(val) }
}

export class Parser extends Transform {
  constructor (inst, mainType) {
    if (mainType) { inst = inst.get(mainType) }
    super(inst, { readableObjectMode: true })
    this.queue = Buffer.alloc(0)
  }

  _asyncTransform (val) {
    this.queue = Buffer.concat([this.queue, val])
    while (true) {
      try {
        this.push(this.inst.read(this.queue))
        this.queue = this.queue.slice(this.instance.readSize(this.queue))
      } catch (e) {
        if (e.partialReadError) return
        e.buffer = this.queue
        this.queue = Buffer.alloc(0)
        throw e
      }
    }
  }
}
