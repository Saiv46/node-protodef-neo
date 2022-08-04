import ProtocolInterface, { defaultDatatypes } from './interface'
import { Context, Complex } from '../datatypes/_shared'

export default class ProtocolInterpreter extends ProtocolInterface {
  constructor (...args) {
    super(...args)
    this.cache = new Map()
    this.stack = new Map()
    this.rootContext = new Context()
  }

  resolveType (name) {
    const value = this.types[name]
    if (!value) { throw new Error(`Datatype "${name}" not defined`) }
    if (typeof value === 'function') {
      // eslint-disable-next-line
      return Complex.isPrototypeOf(value) ? value : new value()
    }
    if (typeof value === 'string' || Array.isArray(value)) {
      if (this.stack.has(value)) return this.stack.get(value)
      if (!(name in defaultDatatypes)) this.stack.set(name, value)
      const res = typeof value === 'string'
        ? this.resolveType(value)
        : this.resolveTypeNesting(value)
      this.stack.delete(name)
      this.types[name] = res
      return res
    }
    throw new Error(`Invalid datatype "${name}" (${typeof value})`)
  }

  resolveTypeNesting (data) {
    let [Type, args] = Array.isArray(data) ? data : [data]
    if (typeof Type === 'string') {
      Type = this.resolveType(Type)
    } else if (Array.isArray(Type)) {
      Type = this.resolveTypeNesting(Type)
    }
    return args === undefined ? Type : [Type, this._RTNloop(args)]
  }

  _RTNloop (args) {
    if (typeof args === 'string') return this.resolveType(args)
    if (Array.isArray(args)) return args.map(this._RTNloop, this)
    for (const k in args) {
      const v = args[k]
      switch (k) {
        case 'fields': {
          for (const k2 in v) {
            args.fields[k2] = this.resolveTypeNesting(v[k2])
          }
          break
        }
        case 'type':
        case 'countType':
        case 'default': {
          args[k] = this.resolveTypeNesting(v)
          break
        }
      }
    }
    return args
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
    const type = this.resolveType(current)
    this.stack.clear()
    if (typeof type === 'object' && !Array.isArray(type)) return type
    const [Constructor, params] = Array.isArray(type) ? type : [type]
    return new Constructor(params, this.rootContext)
  }
}
