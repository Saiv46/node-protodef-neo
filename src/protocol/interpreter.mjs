import { Context } from '../datatypes/_shared.mjs'
import * as defaultDatatypes from '../datatypes/index.mjs'
import { Serializer, Deserializer } from './serializer.mjs'

export default class ProtocolInterpreter {
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
      if (v.fields) {
        for (const k in v.fields) { v.fields[k] = rtn(v.fields[k]) }
      }
      ['type', 'countType', 'default'].forEach(k => { v[k] = rtn(v[k]) })
      return v
    }
    let args
    if (Array.isArray(Type)) [Type, args] = Type
    if (typeof Type === 'string') {
      if (!this.types[Type]) {
        throw new Error(`Datatype "${Type}" not defined`)
      }
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
    const [Constructor, params] = Array.isArray(type) ? type : [type]
    return new Constructor(params, this.rootContext)
  }

  read (name, ...args) { return this.get(name).read(...args) }
  write (name, ...args) { return this.get(name).write(...args) }
  sizeRead (name, ...args) { return this.get(name).sizeRead(...args) }
  sizeWrite (name, ...args) { return this.get(name).sizeWrite(...args) }
  createSerializer (name) { return new Serializer(this.get(name)) }
  createDeserializer (name) { return new Deserializer(this.get(name)) }
}
