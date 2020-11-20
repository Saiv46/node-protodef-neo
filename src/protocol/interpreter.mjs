import ProtocolInterface from './interface.mjs'
import { Context } from '../datatypes/_shared.mjs'

export default class ProtocolInterpreter extends ProtocolInterface {
  constructor (...args) {
    super(...args)
    this.cache = new Map()
    this.stack = new Map()
    this.rootContext = new Context()
  }

  _RTNloop (args) {
    if (typeof args === 'string') { return this.resolveTypeNesting(args) }
    if (Array.isArray(args)) { return args.map(this._RTNloop, this) }
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

  resolveTypeNesting (data) {
    if (this.stack.has(data)) return this.stack.get(data)
    let [Type, args] = Array.isArray(data) ? data : [data]

    if (typeof Type === 'string') {
      if (!this.types[Type]) {
        throw new Error(`Datatype "${Type}" not defined`)
      }
      const _type = this.types[Type]
      if (typeof _type !== 'function') {
        this.stack.set(Type, _type)
      }
      Type = _type
    }

    if (Array.isArray(Type)) { Type = this.resolveTypeNesting(Type) }
    return args ? [Type, this._RTNloop(args)] : Type
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
    type = this.resolveTypeNesting(type)
    this.stack.clear()
    const [Constructor, params] = Array.isArray(type) ? type : [type]
    return new Constructor(params, this.rootContext)
  }
}
