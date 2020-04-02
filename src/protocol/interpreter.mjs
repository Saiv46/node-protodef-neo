import ProtocolInterface from './interface.mjs'
import { Context } from '../datatypes/_shared.mjs'
import { void as _void } from '../datatypes/index.mjs'

let NESTING = 0
const NESTING_LIMIT = 256

export default class ProtocolInterpreter extends ProtocolInterface {
  constructor (...args) {
    super(...args)
    this.cache = new Map()
    this.rootContext = new Context()
  }

  _resolveTypeNesting (data) {
    if (NESTING++ > NESTING_LIMIT) return _void
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
    let [Type, args] = Array.isArray(data) ? data : [data]
    if (typeof Type === 'string') {
      if (!this.types[Type]) {
        throw new Error(`Datatype "${Type}" not defined`)
      }
      Type = this.types[Type]
    }
    if (Array.isArray(Type)) { Type = rtn(Type) }
    const result = args ? [Type, argsRecursive(args)] : Type
    NESTING--
    return result
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
}
